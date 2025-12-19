/**
 * Engine State Types
 */
import { CollisionBox } from './CollisionBox';
import { ObstacleTypeConfig } from './ObstacleTypes';

export interface TRexState {
  x: number;
  y: number;
  groundYPos: number;
  jumpVelocity: number;
  jumping: boolean;
  ducking: boolean;
  reachedMinHeight: boolean;
  speedDrop: boolean;
  currentFrame: number;
  timer: number;
}

export interface ObstacleState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  type: string;
  typeConfig: ObstacleTypeConfig;
  collisionBoxes: CollisionBox[];
  gap: number;
  speedOffset: number;
  remove: boolean;
  currentFrame: number;
  timer: number;
  followingObstacleCreated: boolean;
}

export interface CloudState {
  x: number;
  y: number;
  remove: boolean;
  gap: number;
}

export interface EngineGameState {
  tRex: TRexState;
  obstacles: ObstacleState[];
  clouds: CloudState[];
  score: number;
  highScore: number;
  currentSpeed: number;
  frame: number;
  runningTime: number;
  isRunning: boolean;
  isGameOver: boolean;
  groundOffset: number;
}

export type InputAction = 'jump' | 'duck_start' | 'duck_end' | 'none';
