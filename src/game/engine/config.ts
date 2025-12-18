/**
 * Chrome Dino Engine Configuration
 * Based on Chromium's offline dinosaur game
 * Exact values from the original Chrome Dino game
 */

export const FPS = 60;

export const ENGINE_CONFIG = {
  // Canvas
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 200,

  // Speed (from Runner.normalConfig)
  SPEED: 6,
  ACCELERATION: 0.001,
  MAX_SPEED: 13,

  // T-Rex Physics (from Trex.normalJumpConfig)
  GRAVITY: 0.6,
  INITIAL_JUMP_VELOCITY: -10,
  DROP_VELOCITY: -5,
  MIN_JUMP_HEIGHT: 30,
  MAX_JUMP_HEIGHT: 30,
  SPEED_DROP_COEFFICIENT: 3,

  // T-Rex Dimensions (from Trex.config)
  TREX_WIDTH: 44,
  TREX_HEIGHT: 47,
  TREX_WIDTH_DUCK: 59,
  TREX_HEIGHT_DUCK: 25,
  TREX_START_X: 50,

  // Obstacles (from Runner.config)
  GAP_COEFFICIENT: 0.6,
  MAX_OBSTACLE_LENGTH: 3,
  MAX_OBSTACLE_DUPLICATION: 2,

  // Timing
  CLEAR_TIME: 3000, // ms before obstacles start spawning

  // Ground
  BOTTOM_PAD: 10,
  GROUND_HEIGHT: 2,

  // Animation
  RUNNING_ANIMATION_FPS: 12, // frames per second for running animation
  DUCKING_ANIMATION_FPS: 8, // frames per second for ducking animation
} as const;

export const DEBUG = {
  SHOW_HITBOXES: false,
};
