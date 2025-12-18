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
  multipleSpeed: number;
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
    width: 17,
    height: 35,
    yPos: groundY - 35, // Bottom of cactus on ground
    multipleSpeed: 4,
    minGap: 120,
    minSpeed: 0,
    collisionBoxes: [
      new CollisionBox(0, 7, 5, 27),
      new CollisionBox(4, 0, 6, 34),
      new CollisionBox(10, 4, 7, 14),
    ],
  },
  {
    type: 'CACTUS_LARGE',
    width: 25,
    height: 50,
    yPos: groundY - 50,
    multipleSpeed: 7,
    minGap: 120,
    minSpeed: 0,
    collisionBoxes: [
      new CollisionBox(0, 12, 7, 38),
      new CollisionBox(8, 0, 7, 49),
      new CollisionBox(13, 10, 10, 38),
    ],
  },
  {
    type: 'PTERODACTYL',
    width: 46,
    height: 40,
    yPos: [groundY - 60, groundY - 85, groundY - 110], // Low, medium, high
    multipleSpeed: 999, // Never spawn multiples
    minSpeed: 8.5,
    minGap: 150,
    collisionBoxes: [
      new CollisionBox(15, 15, 16, 5),
      new CollisionBox(18, 21, 24, 6),
      new CollisionBox(2, 14, 4, 3),
      new CollisionBox(6, 10, 4, 7),
      new CollisionBox(10, 8, 6, 9),
    ],
    numFrames: 2,
    frameRate: 1000 / 6,
    speedOffset: 0.8,
  },
];

export function cloneCollisionBoxes(boxes: CollisionBox[], size: number): CollisionBox[] {
  const cloned = boxes.map(box => box.clone());

  // Adjust collision boxes for grouped obstacles
  if (size > 1 && cloned.length >= 3) {
    cloned[1].width = boxes[0].width * size - boxes[0].width - boxes[2].width;
    cloned[2].x = boxes[0].width * size - boxes[2].width;
  }

  return cloned;
}
