import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { authService } from "@/services/authService";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    authService.getSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user, error } = await authService.signIn(email, password);
    return { user, error };
  };

  const signUp = async (email: string, password: string) => {
    const { user, error } = await authService.signUp(email, password);
    return { user, error };
  };

  const signInWithGoogle = async () => {
    const { error } = await authService.signInWithGoogle();
    return { error };
  };

  const signOut = async () => {
    await authService.signOut();
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
};
