import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

interface AuthContextValue {
  session: Session | null;
  userId: string | null;
  /** Đã kiểm tra xong phiên đăng nhập lưu trên máy chưa. */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, userId: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Phiên cũ được supabase-js đọc lại từ SecureStore.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, userId: session?.user.id ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
