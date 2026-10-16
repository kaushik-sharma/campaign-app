import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import type { Session } from '@/domain/types';
import { services } from '@/services';

import { runPendingAuthAction } from './pending-action';

type AuthState = {
  /** `undefined` while the persisted session is being restored. */
  session: Session | null | undefined;
  signIn: typeof services.auth.signIn;
  signUp: typeof services.auth.signUp;
  signOut: typeof services.auth.signOut;
};

const AuthContext = createContext<AuthState | null>(null);

/** Talks only to `services.auth`, so swapping mock auth for Supabase touches nothing here. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void services.auth.getSession().then((s) => {
      if (active) setSession(s);
    });
    const unsubscribe = services.auth.onAuthStateChange((next) => {
      setSession(next);
      if (next) runPendingAuthAction();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext
      value={{
        session,
        signIn: services.auth.signIn,
        signUp: services.auth.signUp,
        signOut: services.auth.signOut,
      }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthState {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function useCurrentUser() {
  return useAuth().session?.user ?? null;
}
