import * as Linking from 'expo-linking';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { parseInviteToken } from '../lib/invite';

type PendingInviteContextValue = {
  token: string | null;
  clear: () => void;
};

const PendingInviteContext = createContext<PendingInviteContextValue | null>(null);

export function PendingInviteProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      const parsed = parseInviteToken(url);
      if (parsed) setToken(parsed);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const parsed = parseInviteToken(url);
      if (parsed) setToken(parsed);
    });
    return () => subscription.remove();
  }, []);

  return <PendingInviteContext.Provider value={{ token, clear: () => setToken(null) }}>{children}</PendingInviteContext.Provider>;
}

export function usePendingInvite(): PendingInviteContextValue {
  const ctx = useContext(PendingInviteContext);
  if (!ctx) throw new Error('usePendingInvite must be used within PendingInviteProvider');
  return ctx;
}
