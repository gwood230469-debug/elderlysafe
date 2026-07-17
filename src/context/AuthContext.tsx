import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import type { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        // User closed the sheet — not a real error, don't surface one.
        return { error: null };
      }
      const idToken = response.data.idToken;
      if (!idToken) return { error: 'Google sign-in did not return a token. Please try again.' };

      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e) {
      if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
        return { error: null };
      }
      return { error: e instanceof Error ? e.message : 'Could not sign in with Google.' };
    }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    try {
      await GoogleSignin.signOut();
    } catch {
      // Best-effort — the Supabase session is already cleared, which is
      // what actually gates access to the app.
    }
  }

  return <AuthContext.Provider value={{ session, loading, signInWithGoogle, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
