import { supabase } from '@/integrations/supabase/client';
import type { LobbyState, LobbyPlayer, SkinType } from '@/types/game';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://joahiyjvnzivjnctzcjs.supabase.co';
const WS_URL = SUPABASE_URL.replace('https://', 'wss://') + '/functions/v1/realtime-game';

// Generate a short room code (6 characters)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Convert database row to LobbyPlayer
function dbToLobbyPlayer(row: any, profiles: Map<string, any>): LobbyPlayer {
  const profile = profiles.get(row.profile_id);
  return {
    id: row.profile_id,
    username: profile?.username || 'UNKNOWN',
    skin: (profile?.skin || 'classic') as SkinType,
    isReady: row.is_ready,
    isHost: row.is_host,
  };
}

// Create a new lobby
export async function createLobby(profileId: string): Promise<LobbyState | null> {
  try {
    const roomCode = generateRoomCode();
    
    // Create lobby with short room code
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .insert({
        host_id: profileId,
        status: 'waiting',
        max_players: 4,
        room_code: roomCode,
      })
      .select()
      .single();
    
    if (lobbyError) throw lobbyError;
    
    // Add host as player
    const { error: playerError } = await supabase
      .from('lobby_players')
      .insert({
        lobby_id: lobby.id,
        profile_id: profileId,
        is_host: true,
        is_ready: false,
      });
    
    if (playerError) throw playerError;
    
    // Get profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, skin')
      .eq('id', profileId)
      .single();
    
    return {
      id: lobby.id,
      roomCode: lobby.room_code || lobby.id.slice(0, 6).toUpperCase(),
      hostId: profileId,
      players: [{
        id: profileId,
        username: profile?.username || 'HOST',
        skin: (profile?.skin || 'classic') as SkinType,
        isReady: false,
        isHost: true,
      }],
      status: 'waiting',
      seed: lobby.seed,
      maxPlayers: lobby.max_players,
    };
  } catch (error) {
    console.error('Error creating lobby:', error);
    return null;
  }
}

// Join an existing lobby (supports full UUID or short 6-char code)
export async function joinLobby(lobbyIdOrCode: string, profileId: string): Promise<LobbyState | null> {
  try {
    let lobbyId = lobbyIdOrCode;
    
    // If it's a short code (<=8 chars), search by room_code column
    if (lobbyIdOrCode.length <= 8) {
      const searchCode = lobbyIdOrCode.toUpperCase();
      const { data: lobbies, error: searchError } = await supabase
        .from('lobbies')
        .select('id')
        .eq('status', 'waiting')
        .eq('room_code', searchCode)
        .limit(1);
      
      if (searchError || !lobbies || lobbies.length === 0) {
        console.error('Lobby not found with code:', searchCode);
        return null;
      }
      lobbyId = lobbies[0].id;
    }
    
    // Check if lobby exists and has space
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*, lobby_players(count)')
      .eq('id', lobbyId)
      .eq('status', 'waiting')
      .single();
    
    if (lobbyError || !lobby) {
      console.error('Lobby not found or not available');
      return null;
    }
    
    // Check player count
    const { count } = await supabase
      .from('lobby_players')
      .select('*', { count: 'exact', head: true })
      .eq('lobby_id', lobbyId);
    
    if ((count || 0) >= lobby.max_players) {
      console.error('Lobby is full');
      return null;
    }
    
    // Check if already in lobby
    const { data: existing } = await supabase
      .from('lobby_players')
      .select('id')
      .eq('lobby_id', lobbyId)
      .eq('profile_id', profileId)
      .maybeSingle();
    
    if (!existing) {
      // Join lobby
      const { error: joinError } = await supabase
        .from('lobby_players')
        .insert({
          lobby_id: lobbyId,
          profile_id: profileId,
          is_host: false,
          is_ready: false,
        });
      
      if (joinError) throw joinError;
    }
    
    // Get full lobby state
    return await getLobbyState(lobbyId);
  } catch (error) {
    console.error('Error joining lobby:', error);
    return null;
  }
}

// Get lobby state
export async function getLobbyState(lobbyId: string): Promise<LobbyState | null> {
  try {
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('id', lobbyId)
      .single();
    
    if (lobbyError || !lobby) return null;
    
    // Get players
    const { data: players, error: playersError } = await supabase
      .from('lobby_players')
      .select('*, profiles(username, skin)')
      .eq('lobby_id', lobbyId);
    
    if (playersError) throw playersError;
    
    const lobbyPlayers: LobbyPlayer[] = (players || []).map((p: any) => ({
      id: p.profile_id,
      username: p.profiles?.username || 'UNKNOWN',
      skin: (p.profiles?.skin || 'classic') as SkinType,
      isReady: p.is_ready,
      isHost: p.is_host,
    }));
    
    return {
      id: lobby.id,
      roomCode: (lobby as any).room_code || lobby.id.slice(0, 6).toUpperCase(),
      hostId: lobby.host_id,
      players: lobbyPlayers,
      status: lobby.status as LobbyState['status'],
      seed: lobby.seed,
      maxPlayers: lobby.max_players,
    };
  } catch (error) {
    console.error('Error getting lobby state:', error);
    return null;
  }
}

// Leave lobby
export async function leaveLobby(lobbyId: string, profileId: string): Promise<boolean> {
  try {
    // Check if host
    const { data: lobby } = await supabase
      .from('lobbies')
      .select('host_id')
      .eq('id', lobbyId)
      .single();
    
    if (lobby?.host_id === profileId) {
      // Host leaving - delete the lobby
      await supabase.from('lobbies').delete().eq('id', lobbyId);
    } else {
      // Regular player leaving
      await supabase
        .from('lobby_players')
        .delete()
        .eq('lobby_id', lobbyId)
        .eq('profile_id', profileId);
    }
    
    return true;
  } catch (error) {
    console.error('Error leaving lobby:', error);
    return false;
  }
}

// Update ready status
export async function setReady(lobbyId: string, profileId: string, isReady: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('lobby_players')
      .update({ is_ready: isReady })
      .eq('lobby_id', lobbyId)
      .eq('profile_id', profileId);
    
    return !error;
  } catch (error) {
    console.error('Error updating ready status:', error);
    return false;
  }
}

// Start the game (host only)
export async function startGame(lobbyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('lobbies')
      .update({ 
        status: 'starting',
        started_at: new Date().toISOString(),
      })
      .eq('id', lobbyId);
    
    return !error;
  } catch (error) {
    console.error('Error starting game:', error);
    return false;
  }
}

// Get available lobbies
export async function getAvailableLobbies(): Promise<LobbyState[]> {
  try {
    const { data: lobbies, error } = await supabase
      .from('lobbies')
      .select(`
        *,
        lobby_players(
          profile_id,
          is_ready,
          is_host,
          profiles(username, skin)
        )
      `)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    return (lobbies || []).map((lobby: any) => ({
      id: lobby.id,
      roomCode: lobby.room_code || lobby.id.slice(0, 6).toUpperCase(),
      hostId: lobby.host_id,
      players: (lobby.lobby_players || []).map((p: any) => ({
        id: p.profile_id,
        username: p.profiles?.username || 'UNKNOWN',
        skin: (p.profiles?.skin || 'classic') as SkinType,
        isReady: p.is_ready,
        isHost: p.is_host,
      })),
      status: lobby.status,
      seed: lobby.seed,
      maxPlayers: lobby.max_players,
    }));
  } catch (error) {
    console.error('Error getting available lobbies:', error);
    return [];
  }
}

// Submit game result
export async function submitGameResult(
  profileId: string,
  lobbyId: string | null,
  distance: number,
  score: number,
  placement: number,
  seed: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('game_results')
      .insert({
        profile_id: profileId,
        lobby_id: lobbyId,
        distance,
        score,
        placement,
        seed,
      });
    
    return !error;
  } catch (error) {
    console.error('Error submitting game result:', error);
    return false;
  }
}

// WebSocket connection for real-time game
export class GameWebSocket {
  private ws: WebSocket | null = null;
  private lobbyId: string;
  private playerId: string;
  private playerName: string;
  private playerSkin: string;
  private onMessage: (data: any) => void;
  private onClose: () => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(
    lobbyId: string, 
    playerId: string, 
    playerName: string,
    onMessage: (data: any) => void,
    onClose: () => void,
    playerSkin: string = 'classic'
  ) {
    this.lobbyId = lobbyId;
    this.playerId = playerId;
    this.playerName = playerName;
    this.playerSkin = playerSkin;
    this.onMessage = onMessage;
    this.onClose = onClose;
  }

  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      const url = `${WS_URL}?lobbyId=${this.lobbyId}&playerId=${this.playerId}&playerName=${encodeURIComponent(this.playerName)}&skin=${this.playerSkin}`;
      
      console.log('Connecting to WebSocket:', url);
      
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve(true);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.onClose();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        resolve(false);
      };
      
      // Timeout fallback
      setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          resolve(false);
        }
      }, 5000);
    });
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendReady() {
    this.send({ type: 'game:ready' });
  }

  sendStart() {
    this.send({ type: 'game:start' });
  }

  sendInput(input: { frame: number; action: string }) {
    this.send({ type: 'game:input', input });
  }

  sendFrame(frame: number) {
    this.send({ type: 'game:frame', frame });
  }

  sendGameOver(score: number, distance: number) {
    this.send({ type: 'game:over', score, distance });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Subscribe to lobby updates
export function subscribeLobbyUpdates(
  lobbyId: string,
  onUpdate: (lobby: LobbyState) => void
) {
  const channel = supabase
    .channel(`lobby:${lobbyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lobbies',
        filter: `id=eq.${lobbyId}`,
      },
      async () => {
        const lobby = await getLobbyState(lobbyId);
        if (lobby) onUpdate(lobby);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lobby_players',
        filter: `lobby_id=eq.${lobbyId}`,
      },
      async () => {
        const lobby = await getLobbyState(lobbyId);
        if (lobby) onUpdate(lobby);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}
