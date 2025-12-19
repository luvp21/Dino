/**
 * Obstacle Type Definitions
 * Detailed collision boxes for accurate hit detection
 */
import { CollisionBox } from './CollisionBox';
import { ENGINE_CONFIG } from './config';

export interface ObstacleTypeConfig {
  type: string;
  width: number;
  height: number;
  yPos: number | number[];
  minGap: number;
  minSpeed: number;
  collisionBoxes: CollisionBox[];
  numFrames?: number;
  frameRate?: number;
  speedOffset?: number;
}

// Ground Y is where the ground line is drawn (obstacles sit ON this line)
const groundY = ENGINE_CONFIG.GROUND_Y;

export const OBSTACLE_TYPES: ObstacleTypeConfig[] = [
  {
    type: 'CACTUS_SMALL',
    width: 33,
    height: 69,
    yPos: groundY - 70, // Bottom of cactus on ground
    minGap: 120,
    minSpeed: 0,
    collisionBoxes: [
      new CollisionBox(1, 20, 5, 22),
      new CollisionBox(11, 4, 10, 60),
      new CollisionBox(26, 12, 6, 20),
    ],
  },
  {
    type: 'CACTUS_LARGE',
    width: 49,
    height: 99,
    yPos: groundY - 95,
    minGap: 120,
    minSpeed: 0,
    collisionBoxes: [
      new CollisionBox(1, 27, 10, 30),
      new CollisionBox(18, 3, 13, 60),
      new CollisionBox(39, 23, 9, 30),
    ],
  },
  {
    type: 'PTERODACTYL',
    width: 91,
    height: 60,
    yPos: [groundY - 60, groundY - 85, groundY - 110], // Low, medium, high
    minSpeed: 8.5,
    minGap: 150,
    collisionBoxes: [
      new CollisionBox(28, 20, 34, 7),
      new CollisionBox(36, 28, 48, 12),
      new CollisionBox(20, 4, 8, 20),
      new CollisionBox(4, 20, 10, 4),
      new CollisionBox(12, 12, 14, 12),
    ],
    numFrames: 2,
    frameRate: 1000 / 6,
    speedOffset: 0.8,
  },
];

export function cloneCollisionBoxes(boxes: CollisionBox[], size: number): CollisionBox[] {
  // Size is always 1 now (no stacking), so just clone the boxes
  return boxes.map(box => box.clone());
}
