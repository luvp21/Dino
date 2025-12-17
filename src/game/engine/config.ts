/**
 * Chrome Dino Engine Configuration
 * Based on Chromium's offline dinosaur game
 */

export const FPS = 60;

export const ENGINE_CONFIG = {
  // Canvas
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 200,

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

  // Ground
  BOTTOM_PAD: 10,
  GROUND_HEIGHT: 12,
} as const;

export const DEBUG = {
  SHOW_HITBOXES: false,
};
