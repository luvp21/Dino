/**
 * T-Rex Collision Box Definitions
 * Detailed hitboxes for running and ducking poses
 */
import { CollisionBox } from './CollisionBox';

export const TREX_COLLISION_BOXES = {
  RUNNING: [
    new CollisionBox(22, 0, 17, 16),
    new CollisionBox(1, 18, 30, 9),
    new CollisionBox(10, 35, 14, 8),
    new CollisionBox(1, 24, 29, 5),
    new CollisionBox(5, 30, 21, 4),
    new CollisionBox(9, 34, 15, 4),
  ],
  DUCKING: [
    new CollisionBox(1, 18, 55, 25),
  ],
};

export const TREX_CONFIG = {
  WIDTH: 44,
  HEIGHT: 47,
  DUCK_HEIGHT: 25,
  START_X: 50,
};
