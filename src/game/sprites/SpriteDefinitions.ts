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
  WAITING_1: SpriteCoords;
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
  PTERODACTYL: { frame1: SpriteCoords; frame2: SpriteCoords };

  // Obstacle definitions with collision data
  OBSTACLES: ObstacleType[];

  // Background
  HORIZON: SpriteCoords;
  CLOUD: SpriteCoords;
  MOON: SpriteCoords;
  STAR: SpriteCoords;

  // UI elements
  RESTART: SpriteCoords;
  GAME_OVER: SpriteCoords;
  TEXT_SPRITE: SpriteCoords;

  // Config
  MAX_GAP_COEFFICIENT: number;
  MAX_OBSTACLE_LENGTH: number;
  BOTTOM_PAD: number;
}

// =============================================
// HDPI (2x resolution) SPRITE DEFINITION
// =============================================
export const CLASSIC_SPRITE_DEFINITION: SpriteDefinition = {
  // T-Rex base position in sprite sheet (HDPI)
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

  // Pterodactyl (two frames for wing animation)
  PTERODACTYL: {
    frame1: { x: 260, y: 2, w: 46, h: 40 },
    frame2: { x: 306, y: 2, w: 46, h: 40 },
  },

  // Official obstacle definitions with collision data
  OBSTACLES: [
    {
      type: 'CACTUS_SMALL',
      width: 17,
      height: 35,
      yPos: 105,
      multipleSpeed: 4,
      minGap: 120,
      minSpeed: 0,
      collisionBoxes: [
        { x: 0, y: 7, width: 5, height: 27 },
        { x: 4, y: 0, width: 6, height: 34 },
        { x: 10, y: 4, width: 7, height: 14 },
      ],
    },
    {
      type: 'CACTUS_LARGE',
      width: 25,
      height: 50,
      yPos: 90,
      multipleSpeed: 7,
      minGap: 120,
      minSpeed: 0,
      collisionBoxes: [
        { x: 0, y: 12, width: 7, height: 38 },
        { x: 8, y: 0, width: 7, height: 49 },
        { x: 13, y: 10, width: 10, height: 38 },
      ],
    },
    {
      type: 'PTERODACTYL',
      width: 46,
      height: 40,
      yPos: [100, 75, 50], // Variable height
      multipleSpeed: 999,
      minSpeed: 8.5,
      minGap: 150,
      collisionBoxes: [
        { x: 15, y: 15, width: 16, height: 5 },
        { x: 18, y: 21, width: 24, height: 6 },
        { x: 2, y: 14, width: 4, height: 3 },
        { x: 6, y: 10, width: 4, height: 7 },
        { x: 10, y: 8, width: 6, height: 9 },
      ],
      numFrames: 2,
      frameRate: 1000 / 6,
      speedOffset: 0.8,
    },
  ],

  // Ground/horizon (HDPI)
  HORIZON: { x: 2, y: 104, w: 1200, h: 12 },

  // Background elements (HDPI)
  CLOUD: { x: 166, y: 2, w: 46, h: 14 },
  MOON: { x: 954, y: 2, w: 20, h: 40 },
  STAR: { x: 1276, y: 2, w: 9, h: 9 },

  // UI elements (HDPI)
  RESTART: { x: 2, y: 130, w: 36, h: 32 },
  GAME_OVER: { x: 1294, y: 2, w: 191, h: 11 },
  TEXT_SPRITE: { x: 1294, y: 2, w: 191, h: 13 },

  // Game config
  MAX_GAP_COEFFICIENT: 1.5,
  MAX_OBSTACLE_LENGTH: 3,
  BOTTOM_PAD: 10,
};

// =============================================
// LDPI (1x resolution) SPRITE DEFINITION
// =============================================
export const CLASSIC_SPRITE_DEFINITION_LDPI: SpriteDefinition = {
  // T-Rex base position (LDPI)
  TREX_BASE: { x: 848, y: 2 },

  // T-Rex frames (same relative offsets)
  TREX: {
    WAITING_1: { x: 44, y: 0, w: 44, h: 47 },
    WAITING_2: { x: 0, y: 0, w: 44, h: 47 },
    RUNNING_1: { x: 88, y: 0, w: 44, h: 47 },
    RUNNING_2: { x: 132, y: 0, w: 44, h: 47 },
    JUMPING: { x: 0, y: 0, w: 44, h: 47 },
    CRASHED: { x: 220, y: 0, w: 44, h: 47 },
    DUCKING_1: { x: 264, y:18, w: 59, h: 26 },
    DUCKING_2: { x: 323, y: 18, w: 59, h: 26 },
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
  CACTUS_SMALL: { x: 228, y: 2, w: 17, h: 35 },
  CACTUS_LARGE: { x: 332, y: 2, w: 25, h: 50 },

  // Pterodactyl (LDPI)
  PTERODACTYL: {
    frame1: { x: 134, y: 2, w: 46, h: 40 },
    frame2: { x: 180, y: 2, w: 46, h: 40 },
  },

  // Same obstacle definitions
  OBSTACLES: [
    {
      type: 'CACTUS_SMALL',
      width: 17,
      height: 35,
      yPos: 105,
      multipleSpeed: 4,
      minGap: 120,
      minSpeed: 0,
      collisionBoxes: [
        { x: 0, y: 7, width: 5, height: 27 },
        { x: 4, y: 0, width: 6, height: 34 },
        { x: 10, y: 4, width: 7, height: 14 },
      ],
    },
    {
      type: 'CACTUS_LARGE',
      width: 25,
      height: 50,
      yPos: 90,
      multipleSpeed: 7,
      minGap: 120,
      minSpeed: 0,
      collisionBoxes: [
        { x: 0, y: 12, width: 7, height: 38 },
        { x: 8, y: 0, width: 7, height: 49 },
        { x: 13, y: 10, width: 10, height: 38 },
      ],
    },
    {
      type: 'PTERODACTYL',
      width: 46,
      height: 40,
      yPos: [100, 75, 50],
      multipleSpeed: 999,
      minSpeed: 8.5,
      minGap: 150,
      collisionBoxes: [
        { x: 15, y: 15, width: 16, height: 5 },
        { x: 18, y: 21, width: 24, height: 6 },
        { x: 2, y: 14, width: 4, height: 3 },
        { x: 6, y: 10, width: 4, height: 7 },
        { x: 10, y: 8, width: 6, height: 9 },
      ],
      numFrames: 2,
      frameRate: 1000 / 6,
      speedOffset: 0.8,
    },
  ],

  // Ground/horizon (LDPI)
  HORIZON: { x: 2, y: 54, w: 600, h: 12 },

  // Background elements (LDPI)
  CLOUD: { x: 86, y: 2, w: 46, h: 14 },
  MOON: { x: 484, y: 2, w: 20, h: 40 },
  STAR: { x: 645, y: 2, w: 9, h: 9 },

  // UI elements (LDPI)
  RESTART: { x: 2, y: 68, w: 36, h: 32 },
  GAME_OVER: { x: 655, y: 2, w: 96, h: 11 },
  TEXT_SPRITE: { x: 655, y: 2, w: 96, h: 13 },

  // Game config
  MAX_GAP_COEFFICIENT: 1.5,
  MAX_OBSTACLE_LENGTH: 3,
  BOTTOM_PAD: 10,
};
