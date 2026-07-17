import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { createCircle, getOwnCircleState, inviteMember, listMembers, safeWordExists, setSafeWord } from '../lib/circle';
import { hashSafeWord } from '../lib/safeWordHash';
import { getErrorMessage } from '../lib/errors';
import { CircleMember } from '../types/models';

type RefreshResult = { circleId: string | null; hasSafeWord: boolean; hasConfirmedMember: boolean };

type CircleContextValue = {
  loading: boolean;
  circleId: string | null;
  members: CircleMember[];
  hasSafeWord: boolean;
  error: string | null;
  refresh: (overrideUserId?: string) => Promise<RefreshResult>;
  ensureOwnCircle: () => Promise<string>;
  addMember: (name: string, phone: string | null) => Promise<{ memberId: string; inviteToken: string }>;
  saveSafeWord: (rawValue: string) => Promise<void>;
};

const CircleContext = createContext<CircleContextValue | null>(null);

export function CircleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [circleId, setCircleId] = useState<string | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [hasSafeWord, setHasSafeWord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh(overrideUserId?: string): Promise<RefreshResult> {
    const userId = overrideUserId ?? session?.user.id;
    if (!userId) {
      setCircleId(null);
      setMembers([]);
      setHasSafeWord(false);
      setLoading(false);
      return { circleId: null, hasSafeWord: false, hasConfirmedMember: false };
    }
    try {
      const state = await getOwnCircleState(userId);
      if (state.role === 'none') {
        setCircleId(null);
        setMembers([]);
        setHasSafeWord(false);
        setError(null);
        return { circleId: null, hasSafeWord: false, hasConfirmedMember: false };
      }
      const [memberList, safeWordPresent] = await Promise.all([listMembers(state.circleId), safeWordExists(state.circleId)]);
      setCircleId(state.circleId);
      setMembers(memberList);
      setHasSafeWord(safeWordPresent);
      setError(null);
      return {
        circleId: state.circleId,
        hasSafeWord: safeWordPresent,
        hasConfirmedMember: memberList.some((m) => m.status === 'confirmed'),
      };
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load your family circle.'));
      return { circleId: null, hasSafeWord: false, hasConfirmedMember: false };
    } finally {
      setLoading(false);
    }
  }

  async function ensureOwnCircle(): Promise<string> {
    if (circleId) return circleId;
    const userId = session?.user.id;
    if (!userId) throw new Error('Not signed in.');
    const newCircleId = await createCircle(userId);
    setCircleId(newCircleId);
    return newCircleId;
  }

  async function addMember(name: string, phone: string | null): Promise<{ memberId: string; inviteToken: string }> {
    const userId = session?.user.id;
    if (!userId) throw new Error('Not signed in.');
    const id = await ensureOwnCircle();
    const { member, inviteToken } = await inviteMember(id, userId, name.trim(), phone);
    setMembers((prev) => [...prev, member]);
    return { memberId: member.id, inviteToken };
  }

  async function saveSafeWord(rawValue: string): Promise<void> {
    const userId = session?.user.id;
    if (!userId) throw new Error('Not signed in.');
    const id = await ensureOwnCircle();
    const hashed = await hashSafeWord(rawValue);
    await setSafeWord(id, userId, hashed);
    setHasSafeWord(true);
  }

  useEffect(() => {
    setLoading(true);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  return (
    <CircleContext.Provider value={{ loading, circleId, members, hasSafeWord, error, refresh, ensureOwnCircle, addMember, saveSafeWord }}>
      {children}
    </CircleContext.Provider>
  );
}

export function useCircle(): CircleContextValue {
  const ctx = useContext(CircleContext);
  if (!ctx) throw new Error('useCircle must be used within CircleProvider');
  return ctx;
}
