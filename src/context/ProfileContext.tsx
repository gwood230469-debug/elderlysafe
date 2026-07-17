import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/errors';

type ProfileContextValue = {
  loading: boolean;
  displayName: string | null;
  error: string | null;
  refresh: () => Promise<string | null>;
  createProfile: (name: string) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh(): Promise<string | null> {
    const userId = session?.user.id;
    if (!userId) {
      setDisplayName(null);
      setLoading(false);
      return null;
    }
    try {
      const { data, error: fetchError } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle();
      if (fetchError) throw fetchError;
      setDisplayName(data?.display_name ?? null);
      setError(null);
      return data?.display_name ?? null;
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load your profile.'));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function createProfile(name: string): Promise<void> {
    const userId = session?.user.id;
    if (!userId) throw new Error('Not signed in.');
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, auth_provider: 'google', display_name: name.trim() });
    if (insertError) throw insertError;
    setDisplayName(name.trim());
  }

  useEffect(() => {
    setLoading(true);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  return <ProfileContext.Provider value={{ loading, displayName, error, refresh, createProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
