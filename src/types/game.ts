// =============================================
// PIXEL DINO - GAME TYPES
// Deterministic Multiplayer Architecture
// =============================================

// SkinType is now a string to allow any skin from the database
// Unknown skins will fall back to 'classic' in the renderer
export type SkinType = string;

// =============================================
// PROFILE TYPES - Guest vs Authenticated User
// =============================================

/**
 * Base profile interface with common fields
 * All profiles have these basic properties
 */
interface BaseProfile {
  id: string;
  username: string;
  skin: SkinType;
  totalMatches: number;
  bestDistance: number;
  averageDistance: number;
  totalPlaytime: number; // in seconds
  joinDate: string;
}

/**
 * Guest Profile - Temporary, no persistence
 * - No currency or inventory
 * - No localStorage usage
 * - Stats are ephemeral (reset on page refresh)
 * - Can play but cannot earn/store anything
 */
export interface GuestProfile extends BaseProfile {
  isGuest: true;
  // Explicitly no currency or inventory fields
}

/**
 * User Profile - Authenticated, persistent
 * - Has currency and inventory
 * - All data stored in backend
 * - Currency always fetched from backend (never trust client)
 */
export interface UserProfile extends BaseProfile {
  isGuest: false;
  currency: number; // Always fetched from backend, never cached
  ownedSkins: string[]; // Array of skin IDs owned
}

/**
 * Union type for profile - discriminated by isGuest
 * TypeScript will enforce proper type narrowing
 */
export type PlayerProfile = GuestProfile | UserProfile;

// Type guards for runtime type checking
export function isGuestProfile(profile: PlayerProfile): profile is GuestProfile {
  return profile.isGuest === true;
}

export function isUserProfile(profile: PlayerProfile): profile is UserProfile {
  return profile.isGuest === false;
}

// =============================================
// GAME STATE TYPES
// =============================================

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
  type: 'cactus-small' | 'cactus-large' | 'cactus-small-2' | 'cactus-small-3' | 'cactus-large-2' | 'cactus-large-3' | 'pterodactyl';
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

// Game Constants
export const GAME_CONFIG = {
  // Canvas
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 300,

  // Dino positioning
  DINO_DUCK_HEIGHT: 35,
  DINO_X: 50,

  // Ground positioning - ground line where sprite feet touch
  GROUND_Y: 270, // Visual baseline (closer to bottom)
  DINO_START_Y: 203, // GROUND_Y - DINO_HEIGHT = 182 - 47 = 135

  // Game
  INITIAL_SPEED: 7,
} as const;

