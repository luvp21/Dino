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
  INITIAL_JUMP_VELOCITY: -12,
  DROP_VELOCITY: -5,
  MIN_JUMP_HEIGHT: 100,
  MAX_JUMP_HEIGHT: 100,
  SPEED_DROP_COEFFICIENT: 3,

  // Obstacles
  GAP_COEFFICIENT: 0.15,
  MAX_OBSTACLE_DUPLICATION: 2,

  // Timing
  CLEAR_TIME: 3000, // ms before obstacles start spawning

  // Ground positioning
  // Ground line is where sprite feet touch - near bottom of canvas
  GROUND_Y: 290, // Visual baseline where feet touch
} as const;

