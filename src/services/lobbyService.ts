// Lobby service - multiplayer currently disabled
import { supabase } from '@/integrations/supabase/client';
import type { LobbyState } from '@/types/game';

// Submit single-player game result
export async function submitGameResult(
  profileId: string,
  lobbyId: string | null,
  score: number,
  distance: number,
  placement: number,
  seed: number
): Promise<void> {
  try {
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
    }

    // Award coins based on distance
    await supabase.rpc('award_coins', {
      p_profile_id: profileId,
      p_distance: distance,
    });
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

export function subscribeLobbyUpdates(
  _lobbyId: string,
  _callback: (lobby: LobbyState) => void
): () => void {
  console.warn('Multiplayer is currently disabled');
  return () => {};
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
