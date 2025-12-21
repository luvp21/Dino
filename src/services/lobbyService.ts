// Lobby service - multiplayer currently disabled
import { supabase } from '@/integrations/supabase/client';
import type { LobbyState } from '@/types/game';

/**
 * Submit single-player game result
 * Only awards coins for authenticated users (guests get no-op)
 */
export async function submitGameResult(
  profileId: string | null,
  lobbyId: string | null,
  score: number,
  distance: number,
  placement: number,
  seed: number
): Promise<void> {
  // Guard: Only submit results for authenticated users
  if (!profileId) {
    console.warn('Cannot submit game result - no profile ID (guest user)');
    return;
  }

  try {
    // Check if user is authenticated (not guest)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Cannot submit game result - user not authenticated (guest user)');
      return;
    }

    // Verify profile belongs to authenticated user
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, is_guest')
      .eq('id', profileId)
      .single();

    if (!profile || profile.is_guest || profile.user_id !== user.id) {
      console.warn('Cannot submit game result - profile is guest or does not belong to user');
      return;
    }

    // Submit game result
    const { error } = await supabase.from('game_results').insert({
      profile_id: profileId,
      lobby_id: lobbyId,
      score,
      distance,
      placement,
      seed,
    });

    if (error) {
      console.error('Failed to submit game result:', error);
      return;
    }

    // Award coins based on distance - ONLY for authenticated users
    // Backend function will handle the calculation and update
    const { error: coinError } = await supabase.rpc('award_coins', {
      p_profile_id: profileId,
      p_distance: distance,
    });

    if (coinError) {
      console.error('Failed to award coins:', coinError);
      // Don't throw - game result was saved, coin award is secondary
    }
  } catch (err) {
    console.error('Error submitting game result:', err);
  }
}

// Multiplayer stubs - disabled
export async function createLobby(_profileId: string, _maxPlayers: number): Promise<string | null> {
  console.warn('Multiplayer is currently disabled');
  return null;
}

export async function joinLobby(_lobbyId: string, _profileId: string): Promise<boolean> {
  console.warn('Multiplayer is currently disabled');
  return false;
}

export async function getLobby(_lobbyId: string): Promise<LobbyState | null> {
  console.warn('Multiplayer is currently disabled');
  return null;
}

export async function getLobbyState(_lobbyId: string): Promise<LobbyState | null> {
  console.warn('Multiplayer is currently disabled');
  return null;
}

export async function leaveLobby(_lobbyId: string, _profileId: string): Promise<void> {
  console.warn('Multiplayer is currently disabled');
}

export async function setReady(_lobbyId: string, _profileId: string, _ready: boolean): Promise<void> {
  console.warn('Multiplayer is currently disabled');
}

export async function startGame(_lobbyId: string): Promise<void> {
  console.warn('Multiplayer is currently disabled');
}

export async function getAvailableLobbies(): Promise<LobbyState[]> {
  console.warn('Multiplayer is currently disabled');
  return [];
}

// WebSocket stub class
export class GameWebSocket {
  connect(_lobbyId: string, _profileId: string, _callbacks: any): void {
    console.warn('Multiplayer is currently disabled');
  }

  disconnect(): void {
    console.warn('Multiplayer is currently disabled');
  }

  send(_data: any): void {
    console.warn('Multiplayer is currently disabled');
  }

  sendReady(_ready: boolean): void {
    console.warn('Multiplayer is currently disabled');
  }

  sendStart(): void {
    console.warn('Multiplayer is currently disabled');
  }

  sendInput(_input: any): void {
    console.warn('Multiplayer is currently disabled');
  }

  sendGameOver(_score: number): void {
    console.warn('Multiplayer is currently disabled');
  }
}
