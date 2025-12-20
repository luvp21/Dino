/**
 * Profile Service
 *
 * Centralized profile management with race condition prevention.
 *
 * Rules:
 * - Profiles are ONLY created for authenticated users (not guests)
 * - Only ONE profile per user_id (enforced by unique constraint)
 * - getOrCreateProfile() is the ONLY function that creates profiles
 * - This function should ONLY be called once when auth session becomes available
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { User } from '@supabase/supabase-js';
import type { SkinType } from '@/types/game';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// In-memory lock to prevent race conditions during profile creation
let profileCreationLock: Map<string, Promise<ProfileRow | null>> = new Map();

/**
 * Get or create a profile for an authenticated user.
 *
 * This function:
 * - Checks if a profile exists for the user_id
 * - If exists, returns it
 * - If not, creates ONE profile (with race condition protection)
 * - NEVER creates profiles for guests
 *
 * @param user_id - The authenticated user's ID (from Supabase auth)
 * @param currentSkin - Optional skin preference for new profiles
 * @returns The profile row, or null if creation failed
 *
 * @throws Never throws - returns null on error to allow graceful handling
 */
export async function getOrCreateProfile(
  user_id: string,
  currentSkin?: SkinType
): Promise<ProfileRow | null> {
  // Guard: Only authenticated users can have profiles
  if (!user_id) {
    console.warn('getOrCreateProfile: user_id is required');
    return null;
  }

  // Check if there's already a creation in progress for this user
  const existingLock = profileCreationLock.get(user_id);
  if (existingLock) {
    // Wait for the existing creation to complete
    return existingLock;
  }

  // Create a new promise for this profile creation
  const creationPromise = (async (): Promise<ProfileRow | null> => {
    try {
      // Step 1: SELECT existing profile
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle(); // Use maybeSingle() to avoid throwing on empty result

      if (selectError) {
        console.error('Error checking for existing profile:', selectError);
        return null;
      }

      // Step 2: If profile exists, return it
      if (existingProfile) {
        return existingProfile;
      }

      // Step 3: Profile doesn't exist - create it
      // Generate username from user metadata or email
      const baseUsername =
        `DINO_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      // Try to create profile with username, retry with suffix if conflict
      let username = baseUsername;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            username,
            skin: currentSkin || 'classic',
            is_guest: false,
            user_id: user_id,
          })
          .select()
          .single();

        if (!insertError && newProfile) {
          return newProfile;
        }

        // If conflict (unique constraint violation), try with a random suffix
        // This handles username conflicts (user_id should be unique due to DB constraint)
        if (
          insertError?.code === '23505' ||
          insertError?.message?.includes('409') ||
          insertError?.message?.includes('duplicate') ||
          insertError?.message?.includes('unique')
        ) {
          attempts++;
          const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
          const maxBaseLength = Math.max(6, 10 - suffix.length);
          username = `${baseUsername.slice(0, maxBaseLength)}_${suffix}`;
        } else {
          // Non-conflict error - log and return null
          console.error('Error creating profile:', insertError);
          return null;
        }
      }

      // Max attempts reached
      console.error('Failed to create profile after max attempts');
      return null;
    } finally {
      // Remove the lock after creation completes (success or failure)
      profileCreationLock.delete(user_id);
    }
  })();

  // Store the promise in the lock map
  profileCreationLock.set(user_id, creationPromise);

  return creationPromise;
}

/**
 * Load a profile for an authenticated user (read-only, no creation).
 *
 * Use this when you only want to read the profile, not create it.
 *
 * @param user_id - The authenticated user's ID
 * @returns The profile row, or null if not found
 */
export async function getProfile(user_id: string): Promise<ProfileRow | null> {
  if (!user_id) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user_id)
    .maybeSingle();

  if (error) {
    console.error('Error loading profile:', error);
    return null;
  }

  return data;
}

/**
 * Load profile with currency and owned skins.
 *
 * This is a convenience function that loads the profile along with
 * related data (currency and owned skins).
 *
 * @param user_id - The authenticated user's ID
 * @returns Profile data with currency and owned skins, or null if not found
 */
export async function getProfileWithDetails(user_id: string): Promise<{
  profile: ProfileRow;
  currency: number;
  ownedSkins: string[];
} | null> {
  const profile = await getProfile(user_id);
  if (!profile) {
    return null;
  }

  // Fetch currency from backend (NEVER trust client-side values)
  const { data: currencyData } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', profile.id)
    .single();

  // Fetch owned skins from backend
  const { data: ownedSkinsData } = await supabase
    .from('user_skins')
    .select('skin_id')
    .eq('profile_id', profile.id);

  const currency = currencyData?.coins ?? 0;
  const ownedSkins = ownedSkinsData?.map((s: any) => s.skin_id) ?? [];

  return {
    profile,
    currency,
    ownedSkins,
  };
}




