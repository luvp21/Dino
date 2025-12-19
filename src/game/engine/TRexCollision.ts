/**
 * T-Rex Collision Box Definitions
 * Detailed hitboxes for running and ducking poses
 */
import { CollisionBox } from './CollisionBox';

export const TREX_COLLISION_BOXES = {
  RUNNING: [
    new CollisionBox(43, 3, 40, 30),
    new CollisionBox(3, 35, 56, 9),
    new CollisionBox(3, 42, 64, 8),
    new CollisionBox(3, 51, 56, 8),
    new CollisionBox(10, 57, 44, 10),
    new CollisionBox(16, 68, 34, 4),
    new CollisionBox(22, 72, 24, 14),
  ],
  DUCKING: [
    new CollisionBox(1, 8, 110, 26),
  ],
};

export const TREX_CONFIG = {
  WIDTH: 87,
  HEIGHT: 87,
  DUCK_WIDTH: 117,
  DUCK_HEIGHT: 60,
  START_X: 50,
};
