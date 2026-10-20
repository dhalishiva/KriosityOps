import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';

type AuthCtx = {
  session: Session | null;
  loading: boolean;
  /** Set when the session ended on its own (expired, revoked), so Log in can explain why. */
  endedReason: string | null;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [endedReason, setEndedReason] = useState<string | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => alive && setSession(data.session))
      .finally(() => alive && setLoading(false));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession((prev) => {
        if (event === 'SIGNED_OUT' && prev && !manualSignOut) setEndedReason('Please log in again.');
        if (event === 'SIGNED_IN') setEndedReason(null);
        return s;
      });
      if (event === 'SIGNED_OUT') qc.clear();
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  async function signOut() {
    manualSignOut = true;
    try {
      await supabase.auth.signOut();
    } finally {
      manualSignOut = false;
      qc.clear();
    }
  }

  return <Ctx.Provider value={{ session, loading, endedReason, signOut }}>{children}</Ctx.Provider>;
}

let manualSignOut = false;

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
