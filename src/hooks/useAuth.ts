import { useEffect, useState, useCallback, useRef } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useGameStore } from "@/store/gameStore";
import type { SkinType, GuestProfile } from "@/types/game";
import { getOrCreateProfile, getProfileWithDetails } from "@/services/profileService";

// Guest profile key for localStorage (persists across page refreshes)
const GUEST_PROFILE_KEY = 'pixel-dino-guest-profile';

// Get guest profile from localStorage
const getGuestProfileFromStorage = (): GuestProfile | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(GUEST_PROFILE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it's a guest profile
      if (parsed && parsed.isGuest === true) {
        return parsed as GuestProfile;
      }
    }
  } catch (error) {
    console.error('Error reading guest profile from localStorage:', error);
  }

  return null;
};

// Save guest profile to localStorage
const saveGuestProfileToStorage = (profile: GuestProfile) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving guest profile to localStorage:', error);
  }
};

// Get or create guest profile from localStorage
// This ensures the same guest profile is used across page refreshes
const getOrCreateGuestProfile = (): GuestProfile => {
  // Try to load existing guest profile from localStorage
  const existingProfile = getGuestProfileFromStorage();
  if (existingProfile) {
    return existingProfile;
  }

  // Generate new guest profile if none exists
  const newProfile: GuestProfile = {
    id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    username: `DINO_${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    skin: 'classic',
    totalMatches: 0,
    bestDistance: 0,
    averageDistance: 0,
    totalPlaytime: 0,
    joinDate: new Date().toISOString(),
    isGuest: true,
    // Explicitly no currency or ownedSkins - guests cannot have these
  };

  // Save to localStorage for persistence
  saveGuestProfileToStorage(newProfile);

  return newProfile;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const { setProfile, setProfileId, currentSkin } = useGameStore();

  // Track if we've already loaded the profile for this user
  // This prevents multiple calls when auth state changes multiple times
  const loadedProfileForUserId = useRef<string | null>(null);

  /* --------------------------------------------------
   * Load profile for authenticated user
   *
   * This function:
   * - Only runs for authenticated users (email confirmed)
   * - Uses getOrCreateProfile() to ensure only ONE profile per user
   * - Only runs ONCE per user (tracked by loadedProfileForUserId)
   * - NEVER creates profiles for guests
   * -------------------------------------------------- */
  const loadUserProfile = useCallback(
    async (authUser: User) => {
      // Guard: Only process if email is confirmed
      if (!authUser.email_confirmed_at) {
        return;
      }

      // Guard: Only load once per user
      if (loadedProfileForUserId.current === authUser.id) {
        return;
      }

      try {
        // Use getOrCreateProfile to ensure only one profile exists
        // This function handles race conditions and prevents duplicates
        const profileRow = await getOrCreateProfile(authUser.id, currentSkin);

        if (!profileRow) {
          console.error("Failed to get or create profile for user:", authUser.id);
          return;
        }

        // Mark that we've loaded the profile for this user
        loadedProfileForUserId.current = authUser.id;

        // Load profile with currency and owned skins
        const profileDetails = await getProfileWithDetails(authUser.id);

        if (!profileDetails) {
          console.error("Failed to load profile details for user:", authUser.id);
          return;
        }

        const { profile, currency, ownedSkins } = profileDetails;

        // Update store with profile data
        setProfileId(profile.id);
        setProfile({
          id: profile.id,
          username: profile.username,
          skin: profile.skin as SkinType,
          totalMatches: profile.total_matches,
          bestDistance: profile.best_distance,
          averageDistance: profile.average_distance,
          totalPlaytime: profile.total_playtime,
          joinDate: profile.created_at,
          isGuest: false,
          currency, // From backend, never cached
          ownedSkins, // From backend, never cached
        });
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    },
    [setProfile, setProfileId, currentSkin]
  );

  /* --------------------------------------------------
   * Auth listener
   *
   * This is the ONLY place where getOrCreateProfile() is called.
   * It runs when:
   * - Auth state changes (login, logout, token refresh)
   * - Initial session is loaded
   *
   * Profile loading is idempotent - it only runs once per user.
   * -------------------------------------------------- */
  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Reset loaded profile tracking on logout
        if (event === 'SIGNED_OUT') {
          loadedProfileForUserId.current = null;
          // Clear profile state for guests
          useGameStore.getState().resetGuestSession();
        }

        // Load profile ONLY for authenticated users with confirmed email
        if (session?.user?.email_confirmed_at) {
          loadUserProfile(session.user);
        } else {
          // User is not authenticated or email not confirmed
          // Load or create guest profile from localStorage (not persisted to DB)
          const guestProfile = getOrCreateGuestProfile();
          setProfile(guestProfile);
          setProfileId(null);
        }
      });

    // Load initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);

      // Load profile ONLY for authenticated users with confirmed email
      if (data.session?.user?.email_confirmed_at) {
        loadUserProfile(data.session.user);
      } else {
        // User is not authenticated or email not confirmed
        // Load or create guest profile from localStorage (not persisted to DB)
        const guestProfile = getOrCreateGuestProfile();
        setProfile(guestProfile);
        setProfileId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile, setProfile, setProfileId]);

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

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    // If there's an error, return it
    if (error) {
      return { data: null, error };
    }

    // OAuth redirect will happen automatically, so we don't need to do anything else
    return { data, error: null };
  };

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
    loadedProfileForUserId.current = null;

    // Clear profile state and reset to guest mode
    // This ensures no user data persists after logout
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
