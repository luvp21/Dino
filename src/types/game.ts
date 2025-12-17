// =============================================
// PIXEL DINO - GAME TYPES
// Deterministic Multiplayer Architecture
// =============================================

export type SkinType = 'classic' | 'inverted' | 'phosphor' | 'amber' | 'crt' | 'winter' | 'neon' | 'golden';

export interface PlayerProfile {
  id: string;
  username: string;
  skin: SkinType;
  totalMatches: number;
  bestDistance: number;
  averageDistance: number;
  totalPlaytime: number; // in seconds
  joinDate: string;
  isGuest: boolean;
}

export interface GameInput {
  frame: number;
  action: 'jump' | 'duck' | 'release';
  playerId: string;
}

export interface GameState {
  frame: number;
  seed: number;
  speed: number;
  distance: number;
  isRunning: boolean;
  isGameOver: boolean;
  obstacles: Obstacle[];
  players: PlayerGameState[];
}

export interface PlayerGameState {
  id: string;
  username: string;
  skin: SkinType;
  y: number;
  velocityY: number;
  isJumping: boolean;
  isDucking: boolean;
  isAlive: boolean;
  distance: number;
  score: number;
}

export interface Obstacle {
  id: string;
  type: 'cactus-small' | 'cactus-large' | 'cactus-group' | 'pterodactyl';
  x: number;
  y: number;
  width: number;
  height: number;
  frame: number; // frame when it spawned
}

export interface LobbyState {
  id: string;
  roomCode: string;
  hostId: string;
  players: LobbyPlayer[];
  status: 'waiting' | 'starting' | 'in-game' | 'finished';
  seed: number;
  maxPlayers: number;
}

export interface LobbyPlayer {
  id: string;
  username: string;
  skin: SkinType;
  isReady: boolean;
  isHost: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  skin: SkinType;
  bestDistance: number;
  totalMatches: number;
  weeklyBest?: number;
}

export interface GameResult {
  playerId: string;
  username: string;
  distance: number;
  score: number;
  placement: number;
  timestamp: string;
}

// Socket Events
export interface ServerToClientEvents {
  'lobby:update': (lobby: LobbyState) => void;
  'lobby:joined': (lobby: LobbyState) => void;
  'lobby:left': () => void;
  'game:start': (data: { seed: number; players: PlayerGameState[] }) => void;
  'game:state': (state: GameState) => void;
  'game:input': (input: GameInput) => void;
  'game:over': (results: GameResult[]) => void;
  'leaderboard:update': (entries: LeaderboardEntry[]) => void;
  'profile:update': (profile: PlayerProfile) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'lobby:create': (username: string, skin: SkinType) => void;
  'lobby:join': (lobbyId: string, username: string, skin: SkinType) => void;
  'lobby:leave': () => void;
  'lobby:ready': (isReady: boolean) => void;
  'lobby:start': () => void;
  'game:input': (input: Omit<GameInput, 'playerId'>) => void;
  'game:frame': (frame: number) => void;
  'leaderboard:get': (type: 'all-time' | 'weekly') => void;
  'profile:get': () => void;
  'profile:update': (data: Partial<PlayerProfile>) => void;
}

// Game Constants
export const GAME_CONFIG = {
  // Canvas
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 200,
  
  // Physics
  GRAVITY: 0.6,
  JUMP_VELOCITY: -12,
  MAX_FALL_VELOCITY: 15,
  
  // Dino
  DINO_WIDTH: 44,
  DINO_HEIGHT: 47,
  DINO_DUCK_HEIGHT: 25,
  DINO_X: 50,
  GROUND_Y: 131, // CANVAS_HEIGHT(200) - GROUND_HEIGHT(12) - BOTTOM_PAD(10) - DINO_HEIGHT(47)
  
  // Game
  INITIAL_SPEED: 6,
  MAX_SPEED: 13,
  SPEED_INCREMENT: 0.001,
  
  // Obstacles
  MIN_OBSTACLE_GAP: 100,
  MAX_OBSTACLE_GAP: 250,
  
  // Scoring
  SCORE_PER_FRAME: 0.1,
  
  // Multiplayer
  TICK_RATE: 60, // frames per second
  INPUT_DELAY: 2, // frames of input delay for sync
} as const;

// Seeded Random Number Generator
export class SeededRNG {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  // Mulberry32 PRNG
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  
  intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  
  choice<T>(array: T[]): T {
    return array[this.intRange(0, array.length - 1)];
  }
}
