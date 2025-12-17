import { useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useGameStore } from "@/store/gameStore";
import type { SkinType } from "@/types/game";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const { setProfile, setProfileId, currentSkin } = useGameStore();

  /* --------------------------------------------------
   * Sync profile AFTER email is confirmed
   * -------------------------------------------------- */
  const syncAuthProfile = useCallback(
    async (authUser: User) => {
      if (!authUser.email_confirmed_at) return;

      try {
        // 1️⃣ Existing authenticated profile
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (existingProfile) {
          setProfileId(existingProfile.id);
          setProfile({
            id: existingProfile.id,
            username: existingProfile.username,
            skin: existingProfile.skin as SkinType,
            totalMatches: existingProfile.total_matches,
            bestDistance: existingProfile.best_distance,
            averageDistance: existingProfile.average_distance,
            totalPlaytime: existingProfile.total_playtime,
            joinDate: existingProfile.created_at,
            isGuest: false,
          });
          return;
        }

        // 2️⃣ CLAIM GUEST PROFILE (🔥 THIS IS THE KEY PART)
        const guestProfile = useGameStore.getState().profile;
        const guestProfileId = useGameStore.getState().profileId;

        if (guestProfile && guestProfile.isGuest && guestProfileId) {
          const { data: upgradedProfile, error } = await supabase
            .from("profiles")
            .update({
              user_id: authUser.id,
              is_guest: false,
            })
            .eq("id", guestProfileId)
            .select()
            .single();

          if (!error && upgradedProfile) {
            setProfileId(upgradedProfile.id);
            setProfile({
              id: upgradedProfile.id,
              username: upgradedProfile.username,
              skin: upgradedProfile.skin as SkinType,
              totalMatches: upgradedProfile.total_matches,
              bestDistance: upgradedProfile.best_distance,
              averageDistance: upgradedProfile.average_distance,
              totalPlaytime: upgradedProfile.total_playtime,
              joinDate: upgradedProfile.created_at,
              isGuest: false,
            });
            return;
          }
        }

        // 3️⃣ FALLBACK: create brand new profile (rare case)
        const username =
          authUser.user_metadata?.name
            ?.toUpperCase()
            .replace(/[^A-Z0-9_]/g, "")
            .slice(0, 10) ||
          authUser.email?.split("@")[0]?.toUpperCase().slice(0, 10) ||
          `DINO_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        const { data: newProfile, error } = await supabase
          .from("profiles")
          .insert({
            username,
            skin: currentSkin || "classic",
            is_guest: false,
            user_id: authUser.id,
          })
          .select()
          .single();

        if (!error && newProfile) {
          setProfileId(newProfile.id);
          setProfile({
            id: newProfile.id,
            username,
            skin: newProfile.skin as SkinType,
            totalMatches: 0,
            bestDistance: 0,
            averageDistance: 0,
            totalPlaytime: 0,
            joinDate: newProfile.created_at,
            isGuest: false,
          });
        }
      } catch (err) {
        console.error("Profile sync error:", err);
      }
    },
    [setProfile, setProfileId, currentSkin]
  );

  /* --------------------------------------------------
   * Auth listener
   * -------------------------------------------------- */
  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user?.email_confirmed_at) {
          setTimeout(() => syncAuthProfile(session.user), 0);
        }
      });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);

      if (data.session?.user?.email_confirmed_at) {
        setTimeout(() => syncAuthProfile(data.session.user), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [syncAuthProfile]);

  /* --------------------------------------------------
   * Auth actions
   * -------------------------------------------------- */

  const signUp = async (email: string, password: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

  const signIn = async (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signInWithGoogle = async () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

  const sendOtp = async (email: string) =>
    supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

  const verifyOtp = async (email: string, token: string) =>
    supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

  const resendVerification = async (email: string) =>
    supabase.auth.resend({ type: "signup", email });

  const resetPassword = async (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?mode=reset`,
    });

  const updatePassword = async (password: string) =>
    supabase.auth.updateUser({ password });

  const signOut = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setSession(null);

    // 🔥 HARD RESET guest state
    useGameStore.getState().resetGuestSession();
  };

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,

    signUp,
    signIn,
    signInWithGoogle,

    sendOtp,
    verifyOtp,
    resendVerification,

    resetPassword,
    updatePassword,
    signOut,
  };
}
