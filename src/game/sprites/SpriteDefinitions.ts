// Sprite coordinate definitions for different skins
// Based on Chrome's offline-sprite-definitions.js

export interface SpriteCoords {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TRexFrames {
  WAITING_1: SpriteCoords;
  WAITING_2: SpriteCoords;
  RUNNING_1: SpriteCoords;
  RUNNING_2: SpriteCoords;
  JUMPING: SpriteCoords;
  CRASHED: SpriteCoords;
  DUCKING_1: SpriteCoords;
  DUCKING_2: SpriteCoords;
}

export interface SpriteDefinition {
  // Base positions in sprite sheet (HDPI coordinates)
  TREX_BASE: { x: number; y: number };
  TREX: TRexFrames;
  
  // Obstacles
  CACTUS_SMALL: SpriteCoords;
  CACTUS_LARGE: SpriteCoords;
  PTERODACTYL: { frame1: SpriteCoords; frame2: SpriteCoords };
  
  // Background
  HORIZON: SpriteCoords;
  CLOUD: SpriteCoords;
  MOON: SpriteCoords;
  STAR: SpriteCoords;
  
  // UI
  RESTART: SpriteCoords;
  GAME_OVER: SpriteCoords;
  TEXT_SPRITE: SpriteCoords;
}

// Classic Chrome Dino sprite definitions (HDPI - 2x resolution)
export const CLASSIC_SPRITE_DEFINITION: SpriteDefinition = {
  // T-Rex base position in sprite sheet
  TREX_BASE: { x: 1678, y: 2 },
  
  // T-Rex animation frames (offsets from TREX_BASE)
  TREX: {
    WAITING_1: { x: 44, y: 0, w: 44, h: 47 },
    WAITING_2: { x: 0, y: 0, w: 44, h: 47 },
    RUNNING_1: { x: 88, y: 0, w: 44, h: 47 },
    RUNNING_2: { x: 132, y: 0, w: 44, h: 47 },
    JUMPING: { x: 0, y: 0, w: 44, h: 47 },
    CRASHED: { x: 220, y: 0, w: 44, h: 47 },
    DUCKING_1: { x: 264, y: 0, w: 59, h: 26 },
    DUCKING_2: { x: 323, y: 0, w: 59, h: 26 },
  },
  
  // Cacti obstacles
  CACTUS_SMALL: { x: 446, y: 2, w: 17, h: 35 },
  CACTUS_LARGE: { x: 652, y: 2, w: 25, h: 50 },
  
  // Pterodactyl (two frames for wing animation)
  PTERODACTYL: {
    frame1: { x: 260, y: 2, w: 46, h: 40 },
    frame2: { x: 306, y: 2, w: 46, h: 40 },
  },
  
  // Ground/horizon
  HORIZON: { x: 2, y: 104, w: 1200, h: 12 },
  
  // Background elements
  CLOUD: { x: 166, y: 2, w: 46, h: 14 },
  MOON: { x: 954, y: 2, w: 20, h: 40 },
  STAR: { x: 1276, y: 2, w: 9, h: 9 },
  
  // UI elements
  RESTART: { x: 2, y: 130, w: 36, h: 32 },
  GAME_OVER: { x: 1294, y: 2, w: 191, h: 11 },
  TEXT_SPRITE: { x: 1294, y: 2, w: 191, h: 13 },
};

// LDPI version (1x resolution) - divide HDPI coords by 2
export const CLASSIC_SPRITE_DEFINITION_LDPI: SpriteDefinition = {
  TREX_BASE: { x: 848, y: 2 },
  
  TREX: {
    WAITING_1: { x: 44, y: 0, w: 44, h: 47 },
    WAITING_2: { x: 0, y: 0, w: 44, h: 47 },
    RUNNING_1: { x: 88, y: 0, w: 44, h: 47 },
    RUNNING_2: { x: 132, y: 0, w: 44, h: 47 },
    JUMPING: { x: 0, y: 0, w: 44, h: 47 },
    CRASHED: { x: 220, y: 0, w: 44, h: 47 },
    DUCKING_1: { x: 264, y: 0, w: 59, h: 26 },
    DUCKING_2: { x: 323, y: 0, w: 59, h: 26 },
  },
  
  CACTUS_SMALL: { x: 228, y: 2, w: 17, h: 35 },
  CACTUS_LARGE: { x: 332, y: 2, w: 25, h: 50 },
  
  PTERODACTYL: {
    frame1: { x: 134, y: 2, w: 46, h: 40 },
    frame2: { x: 180, y: 2, w: 46, h: 40 },
  },
  
  HORIZON: { x: 2, y: 54, w: 600, h: 12 },
  CLOUD: { x: 86, y: 2, w: 46, h: 14 },
  MOON: { x: 484, y: 2, w: 20, h: 40 },
  STAR: { x: 645, y: 2, w: 9, h: 9 },
  
  RESTART: { x: 2, y: 68, w: 36, h: 32 },
  GAME_OVER: { x: 655, y: 2, w: 96, h: 11 },
  TEXT_SPRITE: { x: 655, y: 2, w: 96, h: 13 },
};
