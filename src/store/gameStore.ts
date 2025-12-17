import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { PlayerProfile, SkinType, LobbyState, LeaderboardEntry, GameState, PlayerGameState, LobbyPlayer } from '@/types/game';

interface GameStore {
  // Profile
  profile: PlayerProfile | null;
  profileId: string | null;
  setProfile: (profile: PlayerProfile | null) => void;
  setProfileId: (id: string | null) => void;
  updateProfile: (data: Partial<PlayerProfile>) => void;
  syncProfile: () => Promise<void>;

  // Skin
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

  // Session
  sessionId: string;
}

// Generate a unique session ID for guests
const generateSessionId = () => {
  const stored = localStorage.getItem('pixel-dino-session');
  if (stored) return stored;
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('pixel-dino-session', newId);
  return newId;
};

// Generate guest profile
const generateGuestProfile = (): PlayerProfile => ({
  id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  username: `DINO_${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
  skin: 'classic',
  totalMatches: 0,
  bestDistance: 0,
  averageDistance: 0,
  totalPlaytime: 0,
  joinDate: new Date().toISOString(),
  isGuest: true,
});

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Session
      sessionId: generateSessionId(),

      resetGuestSession: () => {
        // Clear persisted Zustand storage
        localStorage.removeItem("pixel-dino-storage");

        // Generate new session ID
        const newSessionId = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        localStorage.setItem("pixel-dino-session", newSessionId);

        // Reset store state
        set({
          sessionId: newSessionId,
          profile: null,
          profileId: null,
          currentSkin: "classic",
          lobby: null,
          gameState: null,
          localPlayer: null,
          leaderboard: [],
          isConnected: false,
          currentView: "home",
        });

        // Recreate fresh guest profile
        setTimeout(() => {
          get().syncProfile();
        }, 0);
      },

      // Profile
      profile: null,
      profileId: null,
      setProfile: (profile) => set({ profile }),
      setProfileId: (id) => set({ profileId: id }),
      updateProfile: (data) => {
        const currentProfile = get().profile;
        if (currentProfile) {
          const updatedProfile = { ...currentProfile, ...data };
          set({ profile: updatedProfile });

          // Sync to database if we have a profileId
          const profileId = get().profileId;
          if (profileId) {
            supabase
              .from('profiles')
              .update({
                username: updatedProfile.username,
                skin: updatedProfile.skin,
                total_matches: updatedProfile.totalMatches,
                best_distance: updatedProfile.bestDistance,
                average_distance: updatedProfile.averageDistance,
                total_playtime: updatedProfile.totalPlaytime,
              })
              .eq('id', profileId)
              .then(({ error }) => {
                if (error) console.error('Error updating profile:', error);
              });
          }
        }
      },

      syncProfile: async () => {
        const state = get();
        const sessionId = state.sessionId;
        let profile = state.profile;

        if (!profile) {
          profile = generateGuestProfile();
          set({ profile });
        }

        try {
          // First check if user is authenticated
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            // User is authenticated - find or create their profile
            const { data: authProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();

            if (authProfile) {
              set({
                profileId: authProfile.id,
                profile: {
                  id: authProfile.id,
                  username: authProfile.username,
                  skin: authProfile.skin as SkinType,
                  totalMatches: authProfile.total_matches,
                  bestDistance: authProfile.best_distance,
                  averageDistance: authProfile.average_distance,
                  totalPlaytime: authProfile.total_playtime,
                  joinDate: authProfile.created_at,
                  isGuest: false,
                },
                currentSkin: authProfile.skin as SkinType,
              });
              return;
            }
            // If no profile exists for authenticated user, it will be created by useAuth hook
            return;
          }

          // Guest user flow
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('session_id', sessionId)
            .eq('is_guest', true)
            .maybeSingle();

          if (existingProfile) {
            set({
              profileId: existingProfile.id,
              profile: {
                id: existingProfile.id,
                username: existingProfile.username,
                skin: existingProfile.skin as SkinType,
                totalMatches: existingProfile.total_matches,
                bestDistance: existingProfile.best_distance,
                averageDistance: existingProfile.average_distance,
                totalPlaytime: existingProfile.total_playtime,
                joinDate: existingProfile.created_at,
                isGuest: existingProfile.is_guest,
              },
              currentSkin: existingProfile.skin as SkinType,
            });
          } else {
            // Create new guest profile
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                username: profile.username,
                skin: profile.skin,
                is_guest: true,
                session_id: sessionId,
              })
              .select()
              .single();

            if (createError) {
              if (createError.code === '23505') {
                const newUsername = `DINO_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                const { data: retryProfile } = await supabase
                  .from('profiles')
                  .insert({
                    username: newUsername,
                    skin: profile.skin,
                    is_guest: true,
                    session_id: sessionId,
                  })
                  .select()
                  .single();

                if (retryProfile) {
                  set({
                    profileId: retryProfile.id,
                    profile: { ...profile, id: retryProfile.id, username: newUsername }
                  });
                }
              }
            } else if (newProfile) {
              set({
                profileId: newProfile.id,
                profile: { ...profile, id: newProfile.id }
              });
            }
          }
        } catch (error) {
          console.error('Error syncing profile:', error);
        }
      },

      // Skin
      currentSkin: 'classic',
      setSkin: (skin) => {
        set({ currentSkin: skin });
        const profile = get().profile;
        if (profile) {
          get().updateProfile({ skin });
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
              skin: row.skin as SkinType,
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
      partialize: (state) => ({
        profile: state.profile,
        profileId: state.profileId,
        currentSkin: state.currentSkin,
        sessionId: state.sessionId,
      }),
    }
  )
);

// Initialize profile on first load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useGameStore.getState().syncProfile();
  }, 100);
}
