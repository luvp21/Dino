import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameInput {
  frame: number;
  action: 'jump' | 'duck' | 'release';
  playerId: string;
}

interface PlayerState {
  id: string;
  username: string;
  skin: string;
  isAlive: boolean;
  score: number;
  distance: number;
  y: number;
  isJumping: boolean;
  isDucking: boolean;
}

interface GameRoom {
  seed: number;
  players: Map<string, { socket: WebSocket; username: string; skin: string; isReady: boolean }>;
  playerStates: Map<string, PlayerState>;
  inputs: GameInput[];
  frame: number;
  status: 'waiting' | 'starting' | 'in-game' | 'finished';
  lobbyId: string;
}

// In-memory game rooms for active games
const gameRooms = new Map<string, GameRoom>();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if this is a WebSocket upgrade request
  const upgradeHeader = req.headers.get('upgrade') || '';
  
  if (upgradeHeader.toLowerCase() !== 'websocket') {
    return handleHttpRequest(req);
  }

  // WebSocket connection for real-time game sync
  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    const url = new URL(req.url);
    const lobbyId = url.searchParams.get('lobbyId');
    const playerId = url.searchParams.get('playerId');
    const playerName = url.searchParams.get('playerName') || 'PLAYER';
    const playerSkin = url.searchParams.get('skin') || 'classic';
    
    if (!lobbyId || !playerId) {
      socket.close(1008, 'Missing lobbyId or playerId');
      return response;
    }

    console.log(`Player ${playerName} (${playerId}) connecting to lobby ${lobbyId}`);

    socket.onopen = () => {
      console.log(`WebSocket opened for player ${playerId} in lobby ${lobbyId}`);
      
      // Get or create game room
      let room = gameRooms.get(lobbyId);
      if (!room) {
        room = {
          seed: Date.now(),
          players: new Map(),
          playerStates: new Map(),
          inputs: [],
          frame: 0,
          status: 'waiting',
          lobbyId,
        };
        gameRooms.set(lobbyId, room);
      }
      
      // Add player to room
      room.players.set(playerId, { 
        socket, 
        username: playerName, 
        skin: playerSkin,
        isReady: false 
      });
      
      // Initialize player state
      room.playerStates.set(playerId, {
        id: playerId,
        username: playerName,
        skin: playerSkin,
        isAlive: true,
        score: 0,
        distance: 0,
        y: 150,
        isJumping: false,
        isDucking: false,
      });
      
      // Send room state to new player
      const playerList = Array.from(room.players.entries()).map(([id, p]) => ({
        id,
        username: p.username,
        skin: p.skin,
        isReady: p.isReady,
      }));
      
      socket.send(JSON.stringify({
        type: 'room:joined',
        lobbyId,
        playerId,
        seed: room.seed,
        status: room.status,
        players: playerList,
      }));
      
      // Notify all players about the new player
      broadcastToRoom(room, {
        type: 'player:joined',
        playerId,
        playerName,
        skin: playerSkin,
        players: playerList,
      }, playerId);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const room = gameRooms.get(lobbyId);
        
        if (!room) {
          socket.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
          return;
        }

        console.log(`[${lobbyId}] Received from ${playerId}:`, data.type);

        switch (data.type) {
          case 'game:ready':
            handlePlayerReady(room, playerId);
            break;
            
          case 'game:start':
            handleGameStart(room, playerId);
            break;
            
          case 'game:input':
            handleGameInput(room, playerId, data.input);
            break;
            
          case 'game:state':
            handlePlayerStateUpdate(room, playerId, data.state);
            break;
            
          case 'game:over':
            handlePlayerGameOver(room, playerId, data.score, data.distance);
            break;
            
          case 'ping':
            socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    };

    socket.onclose = () => {
      console.log(`WebSocket closed for player ${playerId}`);
      const room = gameRooms.get(lobbyId);
      
      if (room) {
        room.players.delete(playerId);
        room.playerStates.delete(playerId);
        
        // Notify other players
        broadcastToRoom(room, {
          type: 'player:left',
          playerId,
          players: Array.from(room.players.entries()).map(([id, p]) => ({
            id,
            username: p.username,
            skin: p.skin,
            isReady: p.isReady,
          })),
        });
        
        // Clean up empty rooms
        if (room.players.size === 0) {
          gameRooms.delete(lobbyId);
          console.log(`Room ${lobbyId} deleted (no players)`);
        }
      }
    };

    socket.onerror = (error) => {
      console.error(`WebSocket error for player ${playerId}:`, error);
    };

    return response;
  } catch (error) {
    console.error('Error upgrading to WebSocket:', error);
    return new Response(JSON.stringify({ error: 'Failed to upgrade connection' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Broadcast message to all players in a room
function broadcastToRoom(room: GameRoom, message: object, excludePlayerId?: string) {
  const messageStr = JSON.stringify(message);
  
  for (const [playerId, player] of room.players) {
    if (playerId !== excludePlayerId && player.socket.readyState === WebSocket.OPEN) {
      try {
        player.socket.send(messageStr);
      } catch (e) {
        console.error(`Failed to send to ${playerId}:`, e);
      }
    }
  }
}

// Handle player ready status
function handlePlayerReady(room: GameRoom, playerId: string) {
  const player = room.players.get(playerId);
  if (player) {
    player.isReady = !player.isReady;
  }
  
  const playerList = Array.from(room.players.entries()).map(([id, p]) => ({
    id,
    username: p.username,
    skin: p.skin,
    isReady: p.isReady,
  }));
  
  broadcastToRoom(room, {
    type: 'player:ready',
    playerId,
    isReady: player?.isReady,
    players: playerList,
  });
}

// Handle game start (host only)
function handleGameStart(room: GameRoom, hostId: string) {
  if (room.status !== 'waiting') return;
  
  room.status = 'starting';
  room.seed = Date.now();
  room.frame = 0;
  room.inputs = [];
  
  // Reset all player states
  for (const [playerId, state] of room.playerStates) {
    state.isAlive = true;
    state.score = 0;
    state.distance = 0;
    state.y = 150;
    state.isJumping = false;
    state.isDucking = false;
  }
  
  const playerList = Array.from(room.players.entries()).map(([id, p]) => ({
    id,
    username: p.username,
    skin: p.skin,
  }));
  
  // Broadcast game start with seed and player list
  broadcastToRoom(room, {
    type: 'game:start',
    seed: room.seed,
    players: playerList,
  });
  
  console.log(`Game started in room ${room.lobbyId} with seed ${room.seed}`);
  
  // Mark as in-game after countdown
  setTimeout(() => {
    room.status = 'in-game';
  }, 3000);
}

// Handle game input from player - BROADCAST TO ALL
function handleGameInput(room: GameRoom, playerId: string, input: Omit<GameInput, 'playerId'>) {
  const fullInput: GameInput = {
    ...input,
    playerId,
  };
  
  room.inputs.push(fullInput);
  
  // Broadcast input to ALL players including sender for confirmation
  broadcastToRoom(room, {
    type: 'game:input',
    input: fullInput,
  });
  
  console.log(`[${room.lobbyId}] Input broadcast: ${playerId} -> ${input.action} @ frame ${input.frame}`);
}

// Handle player state update (position, alive status)
function handlePlayerStateUpdate(room: GameRoom, playerId: string, state: Partial<PlayerState>) {
  const playerState = room.playerStates.get(playerId);
  if (playerState) {
    Object.assign(playerState, state);
  }
  
  // Broadcast state update to all other players
  broadcastToRoom(room, {
    type: 'player:state',
    playerId,
    state: {
      y: state.y,
      isAlive: state.isAlive,
      score: state.score,
      distance: state.distance,
      isJumping: state.isJumping,
      isDucking: state.isDucking,
    },
  }, playerId);
}

// Handle player game over
function handlePlayerGameOver(room: GameRoom, playerId: string, score: number, distance: number) {
  const playerState = room.playerStates.get(playerId);
  if (playerState) {
    playerState.isAlive = false;
    playerState.score = score;
    playerState.distance = distance;
  }
  
  broadcastToRoom(room, {
    type: 'player:gameover',
    playerId,
    score,
    distance,
  });
  
  // Check if all players are done
  const allDead = Array.from(room.playerStates.values()).every(s => !s.isAlive);
  if (allDead) {
    room.status = 'finished';
    
    // Calculate and broadcast final results
    const results = Array.from(room.playerStates.values())
      .sort((a, b) => b.distance - a.distance)
      .map((p, index) => ({
        playerId: p.id,
        username: p.username,
        distance: Math.floor(p.distance),
        score: p.score,
        placement: index + 1,
      }));
    
    broadcastToRoom(room, {
      type: 'game:finished',
      results,
    });
    
    console.log(`Game finished in room ${room.lobbyId}`);
  }
}

// Handle regular HTTP requests
async function handleHttpRequest(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  
  if (req.method === 'GET' && path === 'rooms') {
    const rooms = Array.from(gameRooms.entries()).map(([id, room]) => ({
      id,
      playerCount: room.players.size,
      status: room.status,
    }));
    
    return new Response(JSON.stringify({ rooms }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
