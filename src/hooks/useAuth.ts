import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useGameStore } from '@/store/gameStore';
import type { SkinType } from '@/types/game';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { setProfile, setProfileId, profile, currentSkin } = useGameStore();

  // Sync profile with authenticated user
  const syncAuthProfile = useCallback(async (authUser: User) => {
    try {
      // Check if profile exists for this user
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
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
      } else {
        // Create new profile for authenticated user
        const username = authUser.user_metadata?.name?.toUpperCase().slice(0, 10).replace(/[^A-Z0-9_]/g, '') ||
          authUser.email?.split('@')[0]?.toUpperCase().slice(0, 10) || 
          `DINO_${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            username,
            skin: currentSkin || 'classic',
            is_guest: false,
            user_id: authUser.id,
          })
          .select()
          .single();

        if (createError) {
          // Handle duplicate username
          if (createError.code === '23505') {
            const retryUsername = `DINO_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            const { data: retryProfile } = await supabase
              .from('profiles')
              .insert({
                username: retryUsername,
                skin: currentSkin || 'classic',
                is_guest: false,
                user_id: authUser.id,
              })
              .select()
              .single();

            if (retryProfile) {
              setProfileId(retryProfile.id);
              setProfile({
                id: retryProfile.id,
                username: retryUsername,
                skin: retryProfile.skin as SkinType,
                totalMatches: 0,
                bestDistance: 0,
                averageDistance: 0,
                totalPlaytime: 0,
                joinDate: retryProfile.created_at,
                isGuest: false,
              });
            }
          }
        } else if (newProfile) {
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
      }
    } catch (error) {
      console.error('Error syncing auth profile:', error);
    }
  }, [setProfile, setProfileId, currentSkin]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Defer profile sync to avoid deadlocks
        if (session?.user) {
          setTimeout(() => {
            syncAuthProfile(session.user);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        setTimeout(() => {
          syncAuthProfile(session.user);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [syncAuthProfile]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      // Reset to guest profile
      useGameStore.getState().syncProfile();
    }
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
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
    signOut,
    resetPassword,
    updatePassword,
  };
}
