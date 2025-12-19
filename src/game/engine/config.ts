/**
 * Chrome Dino Engine Configuration
 * Based on Chromium's offline dinosaur game
 */

export const FPS = 60;

export const ENGINE_CONFIG = {
  // Canvas
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 300,

  // Speed
  SPEED: 6,
  ACCELERATION: 0.001,
  MAX_SPEED: 13,

  // T-Rex Physics
  GRAVITY: 0.6,
  INITIAL_JUMP_VELOCITY: -10,
  DROP_VELOCITY: -5,
  MIN_JUMP_HEIGHT: 30,
  MAX_JUMP_HEIGHT: 30,
  SPEED_DROP_COEFFICIENT: 3,

  // Obstacles
  GAP_COEFFICIENT: 0.6,
  MAX_OBSTACLE_LENGTH: 3,
  MAX_OBSTACLE_DUPLICATION: 2,

  // Timing
  CLEAR_TIME: 3000, // ms before obstacles start spawning

  // Ground positioning
  // Ground line is where sprite feet touch - near bottom of canvas
  GROUND_Y: 292, // Visual baseline where feet touch
  BOTTOM_PAD: 6, // Padding below ground line
  GROUND_HEIGHT: 12, // Height of horizon sprite
} as const;

