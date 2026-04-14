import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin" | "member";

export interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole;
  profile: { display_name: string; avatar_initials: string; sbu: string } | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: "member",
    profile: null,
    loading: true,
  });

  const fetchUserData = useCallback(async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("display_name, avatar_initials, sbu").eq("user_id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId).single(),
    ]);

    setState((prev) => ({
      ...prev,
      profile: profileRes.data ?? null,
      role: (roleRes.data?.role as AppRole) ?? "member",
      loading: false,
    }));
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState((prev) => ({ ...prev, user: session?.user ?? null, session }));
        if (session?.user) {
          // Defer data fetch to avoid Supabase deadlock
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setState((prev) => ({ ...prev, profile: null, role: "member", loading: false }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({ ...prev, user: session?.user ?? null, session }));
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...state, signIn, signUp, signOut };
}
