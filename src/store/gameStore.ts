import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { PlayerProfile, SkinType, LobbyState, LeaderboardEntry, GameState, PlayerGameState, GuestProfile, UserProfile } from '@/types/game';
import { isGuestProfile, isUserProfile } from '@/types/game';

interface GameStore {
  // Profile - can be GuestProfile or UserProfile
  profile: PlayerProfile | null;
  profileId: string | null;
  setProfile: (profile: PlayerProfile | null) => void;
  setProfileId: (id: string | null) => void;
  updateProfile: (data: Partial<PlayerProfile>) => void;
  syncProfile: () => Promise<void>;

  // Currency operations - ONLY for authenticated users
  getCurrency: () => Promise<number>; // Always fetch from backend
  earnCoins: (amount: number) => Promise<boolean>; // No-op if guest
  spendCoins: (amount: number) => Promise<boolean>; // No-op if guest

  // Skin operations - ONLY for authenticated users
  purchaseSkin: (skinId: string) => Promise<boolean>; // No-op if guest
  getOwnedSkins: () => Promise<string[]>; // Returns empty array if guest

  // Skin selection (works for both guests and users)
  currentSkin: SkinType;
  setSkin: (skin: SkinType) => void;

  // Lobby
  lobby: LobbyState | null;
  setLobby: (lobby: LobbyState | null) => void;

  // Game
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  localPlayer: PlayerGameState | null;
  setLocalPlayer: (player: PlayerGameState | null) => void;
  resetGuestSession: () => void;

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  fetchLeaderboard: (type?: 'all-time' | 'weekly') => Promise<void>;

  // UI State
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  currentView: 'home' | 'lobby' | 'game' | 'leaderboard' | 'profile' | 'skins';
  setCurrentView: (view: 'home' | 'lobby' | 'game' | 'leaderboard' | 'profile' | 'skins') => void;

  // Session (only for guest identification, not persistence)
  sessionId: string;

  // Session stats (stored in sessionStorage for guests)
  sessionStats: {
    lastScore: number;
    bestDistance: number;
    gamesPlayed: number;
    averageDistance: number;
  };
  updateSessionStats: (score: number) => void;
  getSessionStats: () => {
    lastScore: number;
    bestDistance: number;
    gamesPlayed: number;
    averageDistance: number;
  };
}

// Generate a unique session ID for guests (NOT persisted)
const generateSessionId = () => {
  // Do NOT use localStorage for guests - generate fresh each time
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Session stats key for sessionStorage
const SESSION_STATS_KEY = 'pixel-dino-session-stats';

// Guest profile key for localStorage (persists across page refreshes)
const GUEST_PROFILE_KEY = 'pixel-dino-guest-profile';

// Get session stats from sessionStorage
const getSessionStatsFromStorage = (): {
  lastScore: number;
  bestDistance: number;
  gamesPlayed: number;
  averageDistance: number;
} => {
  if (typeof window === 'undefined') {
    return { lastScore: 0, bestDistance: 0, gamesPlayed: 0, averageDistance: 0 };
  }

  try {
    const stored = sessionStorage.getItem(SESSION_STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading session stats:', error);
  }

  return { lastScore: 0, bestDistance: 0, gamesPlayed: 0, averageDistance: 0 };
};

// Save session stats to sessionStorage
const saveSessionStatsToStorage = (stats: {
  lastScore: number;
  bestDistance: number;
  gamesPlayed: number;
  averageDistance: number;
}) => {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(SESSION_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving session stats:', error);
  }
};

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

// Generate or load guest profile from localStorage
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

// Generate guest profile - NO persistence, NO currency, NO inventory
// This is kept for backward compatibility but should use getOrCreateGuestProfile instead
const generateGuestProfile = (): GuestProfile => getOrCreateGuestProfile();

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Session - NOT persisted for guests
      sessionId: generateSessionId(),

      // Session stats - loaded from sessionStorage
      sessionStats: getSessionStatsFromStorage(),
      updateSessionStats: (score: number) => {
        const currentStats = get().sessionStats;
        const newBestDistance = Math.max(currentStats.bestDistance, score);
        const newGamesPlayed = currentStats.gamesPlayed + 1;
        const newAverageDistance = Math.floor(
          ((currentStats.averageDistance * currentStats.gamesPlayed) + score) / newGamesPlayed
        );

        const updatedStats = {
          lastScore: score,
          bestDistance: newBestDistance,
          gamesPlayed: newGamesPlayed,
          averageDistance: newAverageDistance,
        };

        set({ sessionStats: updatedStats });
        saveSessionStatsToStorage(updatedStats);
      },
      getSessionStats: () => {
        return get().sessionStats;
      },

      resetGuestSession: () => {
        // Clear ALL persisted Zustand storage
        localStorage.removeItem("pixel-dino-storage");
        // Clear guest profile from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GUEST_PROFILE_KEY);
          sessionStorage.removeItem(SESSION_STATS_KEY);
        }

        // Generate new session ID
        const newSessionId = generateSessionId();

        // Reset store state - create fresh guest profile
        const freshGuestProfile = getOrCreateGuestProfile();
        set({
          sessionId: newSessionId,
          profile: freshGuestProfile,
          profileId: null, // Guests don't have persistent profile IDs
          currentSkin: "classic",
          lobby: null,
          gameState: null,
          localPlayer: null,
          leaderboard: [],
          isConnected: false,
          currentView: "home",
          sessionStats: { lastScore: 0, bestDistance: 0, gamesPlayed: 0, averageDistance: 0 },
        });
      },

      // Profile
      // Initialize with guest profile from localStorage (or create new one)
      // This will be replaced by authenticated profile if user logs in
      profile: getOrCreateGuestProfile(),
      profileId: null,
      setProfile: (profile) => {
        set({ profile });
        // Save guest profile to localStorage when it's updated
        if (profile && isGuestProfile(profile)) {
          saveGuestProfileToStorage(profile);
        }
      },
      setProfileId: (id) => set({ profileId: id }),

      updateProfile: (data) => {
        const currentProfile = get().profile;
        if (!currentProfile) return;

        // Only update if user is authenticated (not guest)
        if (isGuestProfile(currentProfile)) {
          console.warn('Cannot update guest profile - guests cannot persist data');
          return;
        }

        const updatedProfile = { ...currentProfile, ...data };
        set({ profile: updatedProfile });

        // Sync to database if we have a profileId (authenticated users only)
        const profileId = get().profileId;
        if (profileId) {
          const updateData: any = {
            skin: updatedProfile.skin,
            total_matches: updatedProfile.totalMatches,
            best_distance: updatedProfile.bestDistance,
            average_distance: updatedProfile.averageDistance,
            total_playtime: updatedProfile.totalPlaytime,
          };

          // Only include username if it changed
          if (data.username !== undefined) {
            updateData.username = updatedProfile.username;
          }

          supabase
            .from('profiles')
            .update(updateData)
            .eq('id', profileId)
            .then(({ error }) => {
              if (error) {
                if (error.code === '23505') {
                  console.warn('Username conflict, keeping current username:', error);
                  if (data.username !== undefined) {
                    supabase
                      .from('profiles')
                      .select('username')
                      .eq('id', profileId)
                      .single()
                      .then(({ data: profileData }) => {
                        if (profileData) {
                          set({ profile: { ...updatedProfile, username: profileData.username } });
                        }
                      });
                  }
                } else {
                  console.error('Error updating profile:', error);
                }
              }
            });
        }
      },

      /**
       * Sync profile from backend (read-only, no creation).
       *
       * This function:
       * - Only loads existing profiles (never creates)
       * - For authenticated users: loads profile from DB
       * - For guests: creates ephemeral guest profile (not persisted)
       *
       * NOTE: Profile creation is handled by useAuth hook via getOrCreateProfile().
       * This function should NOT be called automatically on mount.
       */
      syncProfile: async () => {
        const state = get();
        const persistedSkin = state.currentSkin; // Preserve persisted skin selection
        let profile = state.profile;

        try {
          // First check if user is authenticated
          const { data: { user } } = await supabase.auth.getUser();

          if (user && user.email_confirmed_at) {
            // User is authenticated - load their profile from backend
            // NOTE: We do NOT create profiles here - that's handled by useAuth
            const { data: authProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();

            if (authProfile) {
              // Fetch currency from backend (NEVER trust client-side values)
              const { data: currencyData } = await supabase
                .from('profiles')
                .select('coins')
                .eq('id', authProfile.id)
                .single();

              // Fetch owned skins from backend
              const { data: ownedSkinsData } = await supabase
                .from('user_skins')
                .select('skin_id')
                .eq('profile_id', authProfile.id);

              const currency = currencyData?.coins ?? 0;
              const ownedSkins = ownedSkinsData?.map((s: any) => s.skin_id) ?? [];

              // Prioritize persisted skin if it differs from database
              const skinToUse = persistedSkin !== authProfile.skin ? persistedSkin : authProfile.skin;

              // Update profile skin in database if changed
              if (skinToUse !== authProfile.skin) {
                await supabase
                  .from('profiles')
                  .update({ skin: skinToUse })
                  .eq('id', authProfile.id);
              }

              // Create UserProfile with currency and inventory from backend
              const userProfile: UserProfile = {
                id: authProfile.id,
                username: authProfile.username,
                skin: skinToUse,
                totalMatches: authProfile.total_matches,
                bestDistance: authProfile.best_distance,
                averageDistance: authProfile.average_distance,
                totalPlaytime: authProfile.total_playtime,
                joinDate: authProfile.created_at,
                isGuest: false,
                currency, // From backend, never cached
                ownedSkins, // From backend, never cached
              };

              set({
                profileId: authProfile.id,
                profile: userProfile,
                currentSkin: skinToUse,
              });
              return;
            }
            // If no profile exists for authenticated user, it will be created by useAuth hook
            // Do NOT create it here
            return;
          }

          // Guest user flow - NO persistence, NO currency, NO inventory
          // Create ephemeral guest profile that resets on page refresh
          // NOTE: Guests NEVER get profiles created in the database
          if (!profile || !isGuestProfile(profile)) {
            profile = generateGuestProfile();
          }

          set({
            profileId: null, // Guests don't have persistent profile IDs
            profile: profile,
            currentSkin: persistedSkin !== 'classic' ? persistedSkin : profile.skin,
          });
        } catch (error) {
          console.error('Error syncing profile:', error);
        }
      },

      // =============================================
      // CURRENCY OPERATIONS - Authenticated Users Only
      // =============================================

      /**
       * Get currency from backend - ALWAYS fetch, never trust client
       * Returns 0 for guests
       */
      getCurrency: async () => {
        const profile = get().profile;
        if (!profile || isGuestProfile(profile)) {
          return 0; // Guests always have 0 currency
        }

        const profileId = get().profileId;
        if (!profileId) return 0;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('coins')
            .eq('id', profileId)
            .single();

          if (error) {
            console.error('Error fetching currency:', error);
            return 0;
          }

          return data?.coins ?? 0;
        } catch (error) {
          console.error('Error fetching currency:', error);
          return 0;
        }
      },

      /**
       * Earn coins - NO-OP for guests
       * Only works for authenticated users
       */
      earnCoins: async (amount: number) => {
        const profile = get().profile;
        if (!profile || isGuestProfile(profile)) {
          console.warn('Guests cannot earn coins - login required');
          return false;
        }

        const profileId = get().profileId;
        if (!profileId) return false;

        try {
          // Award coins via backend function (handles calculation)
          const { error } = await supabase.rpc('award_coins', {
            p_profile_id: profileId,
            p_distance: amount * 100, // Convert coins to distance (1 coin per 100 distance)
          });

          if (error) {
            console.error('Error earning coins:', error);
            return false;
          }

          return true;
        } catch (error) {
          console.error('Error earning coins:', error);
          return false;
        }
      },

      /**
       * Spend coins - NO-OP for guests
       * Only works for authenticated users
       */
      spendCoins: async (amount: number) => {
        const profile = get().profile;
        if (!profile || isGuestProfile(profile)) {
          console.warn('Guests cannot spend coins - login required');
          return false;
        }

        const profileId = get().profileId;
        if (!profileId) return false;

        try {
          // Get current currency from backend
          const currentCurrency = await get().getCurrency();
          if (currentCurrency < amount) {
            return false; // Insufficient funds
          }

          // Update currency in backend
          const { error } = await supabase
            .from('profiles')
            .update({ coins: currentCurrency - amount })
            .eq('id', profileId);

          if (error) {
            console.error('Error spending coins:', error);
            return false;
          }

          return true;
        } catch (error) {
          console.error('Error spending coins:', error);
          return false;
        }
      },

      // =============================================
      // SKIN OPERATIONS - Authenticated Users Only
      // =============================================

      /**
       * Purchase skin - NO-OP for guests
       * Only works for authenticated users
       */
      purchaseSkin: async (skinId: string) => {
        const profile = get().profile;
        if (!profile || isGuestProfile(profile)) {
          console.warn('Guests cannot purchase skins - login required');
          return false;
        }

        const profileId = get().profileId;
        if (!profileId) return false;

        try {
          const { data, error } = await supabase.rpc('purchase_skin', {
            p_profile_id: profileId,
            p_skin_id: skinId,
          });

          if (error) {
            console.error('Error purchasing skin:', error);
            return false;
          }

          const result = data as { success: boolean; error?: string };
          return result.success ?? false;
        } catch (error) {
          console.error('Error purchasing skin:', error);
          return false;
        }
      },

      /**
       * Get owned skins - Returns empty array for guests
       * Always fetches from backend for authenticated users
       */
      getOwnedSkins: async () => {
        const profile = get().profile;
        if (!profile || isGuestProfile(profile)) {
          return []; // Guests have no owned skins
        }

        const profileId = get().profileId;
        if (!profileId) return [];

        try {
          const { data, error } = await supabase
            .from('user_skins')
            .select('skin_id')
            .eq('profile_id', profileId);

          if (error) {
            console.error('Error fetching owned skins:', error);
            return [];
          }

          return data?.map((s: any) => s.skin_id) ?? [];
        } catch (error) {
          console.error('Error fetching owned skins:', error);
          return [];
        }
      },

      // Skin selection (works for both guests and users)
      currentSkin: 'classic',
      setSkin: (skin) => {
        set({ currentSkin: skin });
        const profile = get().profile;
        if (profile && isUserProfile(profile)) {
          // Only update database for authenticated users
          get().updateProfile({ skin });
        } else if (profile && isGuestProfile(profile)) {
          // Update guest profile skin and save to localStorage
          const updatedProfile = { ...profile, skin };
          set({ profile: updatedProfile });
          saveGuestProfileToStorage(updatedProfile);
        }
      },

      // Lobby
      lobby: null,
      setLobby: (lobby) => set({ lobby }),

      // Game
      gameState: null,
      setGameState: (state) => set({ gameState: state }),
      localPlayer: null,
      setLocalPlayer: (player) => set({ localPlayer: player }),

      // Leaderboard
      leaderboard: [],
      setLeaderboard: (entries) => set({ leaderboard: entries }),
      fetchLeaderboard: async (type = 'all-time') => {
        try {
          const { data, error } = await supabase.rpc('get_leaderboard', {
            limit_count: 10,
            time_filter: type,
          });

          if (error) throw error;

          if (data) {
            const entries: LeaderboardEntry[] = data.map((row: any) => ({
              rank: Number(row.rank),
              playerId: row.profile_id,
              username: row.username,
              skin: row.skin,
              bestDistance: row.best_distance,
              totalMatches: row.total_matches,
            }));
            set({ leaderboard: entries });
          }
        } catch (error) {
          console.error('Error fetching leaderboard:', error);
        }
      },

      // UI State
      isConnected: false,
      setIsConnected: (connected) => set({ isConnected: connected }),
      currentView: 'home',
      setCurrentView: (view) => set({ currentView: view }),
    }),
    {
      name: 'pixel-dino-storage',
      // ONLY persist for authenticated users - guests get nothing
      // Guest profiles are handled separately via localStorage (GUEST_PROFILE_KEY)
      partialize: (state) => {
        // Only persist if user is authenticated (not guest)
        if (state.profile && isUserProfile(state.profile)) {
          return {
            profile: {
              // Only persist non-sensitive data
              id: state.profile.id,
              username: state.profile.username,
              skin: state.profile.skin,
              // Do NOT persist currency or ownedSkins - always fetch from backend
            },
            profileId: state.profileId,
            currentSkin: state.currentSkin,
          };
        }
        // Guests: only persist skin preference (visual only, no currency/inventory)
        // Guest profile itself is stored separately in localStorage
        return {
          currentSkin: state.currentSkin,
        };
      },
    }
  )
);

// NOTE: Profile initialization is handled by useAuth hook.
// We do NOT automatically call syncProfile() here to prevent
// multiple profile creation attempts.
//
// Profile loading flow:
// 1. useAuth hook listens to auth state changes
// 2. When user logs in, useAuth calls getOrCreateProfile() ONCE
// 3. getOrCreateProfile() ensures only one profile per user
// 4. Guests never get profiles created
