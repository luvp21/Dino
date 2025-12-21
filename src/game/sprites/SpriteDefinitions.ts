// =============================================
// SPRITE DEFINITIONS
// Based on official Chrome offline-sprite-definitions.js
// =============================================

// Collision box for hit detection
export interface CollisionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteCoords {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TRexFrames {
  WAITING_2: SpriteCoords;
  RUNNING_1: SpriteCoords;
  RUNNING_2: SpriteCoords;
  JUMPING: SpriteCoords;
  CRASHED: SpriteCoords;
  DUCKING_1: SpriteCoords;
  DUCKING_2: SpriteCoords;
}

export interface ObstacleType {
  type: string;
  width: number;
  height: number;
  yPos: number | number[];
  multipleSpeed: number;
  minGap: number;
  minSpeed: number;
  collisionBoxes: CollisionBox[];
  numFrames?: number;
  frameRate?: number;
  speedOffset?: number;
}

export interface SpriteDefinition {
  // Base positions in sprite sheet
  TREX_BASE: { x: number; y: number };
  TREX: TRexFrames;
  TREX_COLLISION_BOXES: CollisionBox[];

  // Obstacles
  CACTUS_SMALL: SpriteCoords;
  CACTUS_LARGE: SpriteCoords;
  CACTUS_SMALL_2: SpriteCoords;
  CACTUS_SMALL_3: SpriteCoords;
  CACTUS_LARGE_2: SpriteCoords;
  CACTUS_LARGE_3: SpriteCoords;
  PTERODACTYL: { frame1: SpriteCoords; frame2: SpriteCoords };

  // Obstacle definitions with collision data
  // Background
  HORIZON: SpriteCoords;
  CLOUD: SpriteCoords;
}

// =============================================
// HDPI (2x resolution) SPRITE DEFINITION
// =============================================
export const CLASSIC_SPRITE_DEFINITION: SpriteDefinition = {
  // T-Rex base position in sprite sheet (HDPI)
  TREX_BASE: { x: 1678, y: 2 },

  // T-Rex animation frames (offsets from TREX_BASE)
  TREX: {
    WAITING_2: { x: 0, y: 0, w: 44, h: 47 },
    RUNNING_1: { x: 88, y: 0, w: 44, h: 47 },
    RUNNING_2: { x: 132, y: 0, w: 44, h: 47 },
    JUMPING: { x: 0, y: 0, w: 44, h: 47 },
    CRASHED: { x: 220, y: 0, w: 44, h: 47 },
    DUCKING_1: { x: 264, y: 0, w: 59, h: 26 },
    DUCKING_2: { x: 323, y: 0, w: 59, h: 26 },
  },

  // Official T-Rex collision boxes
  TREX_COLLISION_BOXES: [
    { x: 22, y: 0, width: 17, height: 16 },
    { x: 1, y: 18, width: 30, height: 9 },
    { x: 10, y: 35, width: 14, height: 8 },
    { x: 1, y: 24, width: 29, height: 5 },
    { x: 5, y: 30, width: 21, height: 4 },
    { x: 9, y: 34, width: 15, height: 4 },
  ],

  // Cacti obstacles (HDPI coords)
  CACTUS_SMALL: { x: 446, y: 2, w: 17, h: 35 },
  CACTUS_LARGE: { x: 652, y: 2, w: 25, h: 50 },
  CACTUS_SMALL_2: { x: 858, y: 2, w: 67, h: 69 },
  CACTUS_SMALL_3: { x: 548, y: 2, w: 100, h: 69 },
  CACTUS_LARGE_2: { x: 702, y: 2, w: 99, h: 99 },
  CACTUS_LARGE_3: { x: 801, y: 2, w: 149, h: 99 },
  // Pterodactyl (two frames for wing animation)
  PTERODACTYL: {
    frame1: { x: 260, y: 2, w: 46, h: 40 },
    frame2: { x: 306, y: 2, w: 46, h: 40 },
  },


  // Ground/horizon (HDPI)
  HORIZON: { x: 2, y: 104, w: 1200, h: 12 },

  // Background elements (HDPI)
  CLOUD: { x: 166, y: 2, w: 46, h: 14 },
};

// =============================================
// LDPI (1x resolution) SPRITE DEFINITION
// =============================================
export const CLASSIC_SPRITE_DEFINITION_LDPI: SpriteDefinition = {
  // T-Rex base position (LDPI)
  TREX_BASE: { x: 1678, y: 2 },

  // T-Rex frames (same relative offsets)
  TREX: {
    WAITING_2: { x: 0, y: 0, w: 88, h: 88 },
    RUNNING_1: { x: 176, y: 0, w: 88, h: 88 },
    RUNNING_2: { x: 264, y: 0, w: 88, h: 88 },
    JUMPING: { x: 0, y: 0, w: 88, h: 88 },
    CRASHED: { x: 444, y: 0, w: 79, h: 88 },
    DUCKING_1: { x: 525, y: 36, w: 117, h: 60 },
    DUCKING_2: { x: 643, y: 36, w: 117, h: 60 },
  },

  // Same collision boxes (relative to sprite)
  TREX_COLLISION_BOXES: [
    { x: 22, y: 0, width: 17, height: 16 },
    { x: 1, y: 18, width: 30, height: 9 },
    { x: 10, y: 35, width: 14, height: 8 },
    { x: 1, y: 24, width: 29, height: 5 },
    { x: 5, y: 30, width: 21, height: 4 },
    { x: 9, y: 34, width: 15, height: 4 },
  ],

  // Cacti obstacles (LDPI coords)
  CACTUS_SMALL: { x: 446, y: 2, w: 33, h: 69 },
  CACTUS_SMALL_2: { x: 480, y: 2, w: 67, h: 69 },
  CACTUS_SMALL_3: { x: 548, y: 2, w: 100, h: 69 },
  CACTUS_LARGE: { x: 652, y: 2, w: 49, h: 99 },
  CACTUS_LARGE_2: { x: 702, y: 2, w: 99, h: 99 },
  CACTUS_LARGE_3: { x: 801, y: 2, w: 149, h: 99 },

  // Pterodactyl (LDPI)
  PTERODACTYL: {
    frame1: { x: 260, y: 14, w: 91, h: 66 },
    frame2: { x: 352, y: 2, w: 91, h: 58 },
  },


  // Ground/horizon (LDPI)
  HORIZON: { x: 2, y: 102, w: 2400, h: 20 },
  // Background elements (LDPI)
  CLOUD: { x: 166, y: 2, w: 96, h: 28 },
};
