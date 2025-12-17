/**
 * Chrome Dino T-Rex Runner Engine
 * Based on Chromium's offline dinosaur game
 * Deterministic game engine with seed-based RNG for multiplayer sync
 */

import { ENGINE_CONFIG, FPS } from './config';
import { CollisionBox } from './CollisionBox';
import { OBSTACLE_TYPES, cloneCollisionBoxes } from './ObstacleTypes';
import { TREX_COLLISION_BOXES, TREX_CONFIG } from './TRexCollision';
import { SeededRandom } from './SeededRandom';
import { 
  EngineGameState, 
  TRexState, 
  ObstacleState, 
  InputAction,
  PlayerEngineState 
} from './types';

export class DinoEngine {
  private state: EngineGameState;
  private rng: SeededRandom;
  private seed: number;
  private msPerFrame: number;
  private obstacleHistory: string[] = [];
  private obstacleIdCounter: number = 0;

  constructor(seed: number) {
    this.seed = seed;
    this.rng = new SeededRandom(seed);
    this.msPerFrame = 1000 / FPS;
    this.state = this.createInitialState();
  }

  private createInitialState(): EngineGameState {
    const groundYPos = ENGINE_CONFIG.CANVAS_HEIGHT - ENGINE_CONFIG.GROUND_HEIGHT - ENGINE_CONFIG.BOTTOM_PAD - TREX_CONFIG.HEIGHT;

    return {
      tRex: {
        x: TREX_CONFIG.START_X,
        y: groundYPos,
        groundYPos,
        jumpVelocity: 0,
        jumping: false,
        ducking: false,
        reachedMinHeight: false,
        speedDrop: false,
        currentFrame: 0,
        timer: 0,
      },
      obstacles: [],
      clouds: [],
      score: 0,
      highScore: 0,
      currentSpeed: ENGINE_CONFIG.SPEED,
      frame: 0,
      runningTime: 0,
      isRunning: false,
      isGameOver: false,
      groundOffset: 0,
    };
  }

  reset(newSeed?: number): void {
    if (newSeed !== undefined) {
      this.seed = newSeed;
    }
    this.rng = new SeededRandom(this.seed);
    this.state = this.createInitialState();
    this.obstacleHistory = [];
    this.obstacleIdCounter = 0;
  }

  start(): void {
    this.state.isRunning = true;
    this.state.isGameOver = false;
  }

  stop(): void {
    this.state.isRunning = false;
  }

  getState(): EngineGameState {
    return { ...this.state };
  }

  getTRex(): TRexState {
    return { ...this.state.tRex };
  }

  getSeed(): number {
    return this.seed;
  }

  getScore(): number {
    return this.state.score;
  }

  isGameOver(): boolean {
    return this.state.isGameOver;
  }

  processInput(action: InputAction): void {
    if (this.state.isGameOver) return;

    const { tRex } = this.state;

    switch (action) {
      case 'jump':
        if (!tRex.jumping && !tRex.ducking) {
          tRex.jumpVelocity = ENGINE_CONFIG.INITIAL_JUMP_VELOCITY - this.state.currentSpeed / 10;
          tRex.jumping = true;
          tRex.reachedMinHeight = false;
          tRex.speedDrop = false;
        }
        break;
      case 'duck_start':
        if (tRex.jumping) {
          // Fast fall when ducking in air
          tRex.speedDrop = true;
          tRex.jumpVelocity = 1;
        } else if (!tRex.ducking) {
          tRex.ducking = true;
        }
        break;
      case 'duck_end':
        tRex.ducking = false;
        tRex.speedDrop = false;
        break;
    }
  }

  update(): void {
    if (!this.state.isRunning || this.state.isGameOver) return;

    const deltaTime = this.msPerFrame;
    this.state.frame++;
    this.state.runningTime += deltaTime;

    // Update ground offset for scrolling effect
    this.state.groundOffset = (this.state.groundOffset + this.state.currentSpeed) % 12;

    // Update T-Rex physics
    this.updateTRex(deltaTime);

    // Update obstacles
    this.updateObstacles(deltaTime);

    // Update clouds
    this.updateClouds();

    // Spawn obstacles after clear time
    const hasObstacles = this.state.runningTime > ENGINE_CONFIG.CLEAR_TIME;
    if (hasObstacles) {
      this.spawnObstacles();
    }

    // Spawn clouds
    this.spawnClouds();

    // Check collisions
    if (hasObstacles && this.checkCollision()) {
      this.gameOver();
    }

    // Update score based on distance
    this.state.score = Math.floor((this.state.currentSpeed * this.state.runningTime) / this.msPerFrame * 0.025);

    // Increase speed gradually
    if (this.state.currentSpeed < ENGINE_CONFIG.MAX_SPEED) {
      this.state.currentSpeed += ENGINE_CONFIG.ACCELERATION;
    }
  }

  private updateTRex(deltaTime: number): void {
    const { tRex } = this.state;
    const framesElapsed = deltaTime / this.msPerFrame;

    // Update running animation
    tRex.timer += deltaTime;
    if (tRex.timer >= 1000 / 12) {
      tRex.currentFrame = tRex.currentFrame === 1 ? 0 : 1;
      tRex.timer = 0;
    }

    if (tRex.jumping) {
      // Apply speed drop coefficient for fast falling
      if (tRex.speedDrop) {
        tRex.y += Math.round(tRex.jumpVelocity * ENGINE_CONFIG.SPEED_DROP_COEFFICIENT * framesElapsed);
      } else {
        tRex.y += Math.round(tRex.jumpVelocity * framesElapsed);
      }

      tRex.jumpVelocity += ENGINE_CONFIG.GRAVITY * framesElapsed;

      // Check min height reached
      const minJumpHeight = tRex.groundYPos - ENGINE_CONFIG.MIN_JUMP_HEIGHT;
      if (tRex.y < minJumpHeight || tRex.speedDrop) {
        tRex.reachedMinHeight = true;
      }

      // Apply drop velocity after max height
      if (tRex.y < tRex.groundYPos - ENGINE_CONFIG.MAX_JUMP_HEIGHT || tRex.speedDrop) {
        if (tRex.reachedMinHeight && tRex.jumpVelocity < ENGINE_CONFIG.DROP_VELOCITY) {
          tRex.jumpVelocity = ENGINE_CONFIG.DROP_VELOCITY;
        }
      }

      // Landing
      if (tRex.y > tRex.groundYPos) {
        tRex.y = tRex.groundYPos;
        tRex.jumpVelocity = 0;
        tRex.jumping = false;
        tRex.reachedMinHeight = false;
        tRex.speedDrop = false;
      }
    } else if (tRex.speedDrop && tRex.y === tRex.groundYPos) {
      // Transition from speed drop to ducking
      tRex.speedDrop = false;
      tRex.ducking = true;
    }
  }

  private updateObstacles(deltaTime: number): void {
    for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.state.obstacles[i];
      let speed = this.state.currentSpeed;

      if (obstacle.speedOffset) {
        speed += obstacle.speedOffset;
      }

      obstacle.x -= Math.floor((speed * FPS) / 1000 * deltaTime);

      // Update pterodactyl animation
      if (obstacle.typeConfig.numFrames) {
        obstacle.timer += deltaTime;
        if (obstacle.timer >= obstacle.typeConfig.frameRate!) {
          obstacle.currentFrame = obstacle.currentFrame === obstacle.typeConfig.numFrames - 1 ? 0 : obstacle.currentFrame + 1;
          obstacle.timer = 0;
        }
      }

      // Remove off-screen obstacles
      if (obstacle.x + obstacle.width < 0) {
        this.state.obstacles.splice(i, 1);
      }
    }
  }

  private updateClouds(): void {
    for (let i = this.state.clouds.length - 1; i >= 0; i--) {
      const cloud = this.state.clouds[i];
      cloud.x -= 0.2;

      if (cloud.x + 46 < 0) {
        this.state.clouds.splice(i, 1);
      }
    }
  }

  private spawnObstacles(): void {
    const lastObstacle = this.state.obstacles[this.state.obstacles.length - 1];

    if (lastObstacle && !lastObstacle.followingObstacleCreated &&
        lastObstacle.x + lastObstacle.width + lastObstacle.gap < ENGINE_CONFIG.CANVAS_WIDTH) {
      this.addNewObstacle();
      lastObstacle.followingObstacleCreated = true;
    } else if (this.state.obstacles.length === 0) {
      this.addNewObstacle();
    }
  }

  private addNewObstacle(): void {
    const obstacleTypeIndex = this.rng.nextInt(0, OBSTACLE_TYPES.length - 1);
    const obstacleType = OBSTACLE_TYPES[obstacleTypeIndex];

    // Check duplication limits and speed requirements
    if (this.duplicateObstacleCheck(obstacleType.type) ||
        this.state.currentSpeed < obstacleType.minSpeed) {
      return;
    }

    const size = this.rng.nextInt(1, Math.min(ENGINE_CONFIG.MAX_OBSTACLE_LENGTH,
      obstacleType.multipleSpeed > this.state.currentSpeed ? 1 : ENGINE_CONFIG.MAX_OBSTACLE_LENGTH));

    let yPos: number;
    if (Array.isArray(obstacleType.yPos)) {
      yPos = obstacleType.yPos[this.rng.nextInt(0, obstacleType.yPos.length - 1)];
    } else {
      yPos = obstacleType.yPos;
    }

    const minGap = Math.round(obstacleType.width * size * this.state.currentSpeed + obstacleType.minGap * ENGINE_CONFIG.GAP_COEFFICIENT);
    const maxGap = Math.round(minGap * 1.5);
    const gap = this.rng.nextInt(minGap, maxGap);

    const obstacle: ObstacleState = {
      id: `obstacle_${this.obstacleIdCounter++}`,
      x: ENGINE_CONFIG.CANVAS_WIDTH + gap,
      y: yPos,
      width: obstacleType.width * size,
      height: obstacleType.height,
      size,
      type: obstacleType.type,
      typeConfig: obstacleType,
      collisionBoxes: cloneCollisionBoxes(obstacleType.collisionBoxes, size),
      gap,
      speedOffset: obstacleType.speedOffset ? (this.rng.next() > 0.5 ? obstacleType.speedOffset : -obstacleType.speedOffset) : 0,
      remove: false,
      currentFrame: 0,
      timer: 0,
      followingObstacleCreated: false,
    };

    this.state.obstacles.push(obstacle);
    this.obstacleHistory.unshift(obstacleType.type);

    if (this.obstacleHistory.length > ENGINE_CONFIG.MAX_OBSTACLE_DUPLICATION) {
      this.obstacleHistory.splice(ENGINE_CONFIG.MAX_OBSTACLE_DUPLICATION);
    }
  }

  private duplicateObstacleCheck(nextObstacleType: string): boolean {
    let duplicateCount = 0;
    for (let i = 0; i < this.obstacleHistory.length; i++) {
      duplicateCount = this.obstacleHistory[i] === nextObstacleType ? duplicateCount + 1 : 0;
    }
    return duplicateCount >= ENGINE_CONFIG.MAX_OBSTACLE_DUPLICATION;
  }

  private spawnClouds(): void {
    if (this.rng.next() > 0.995 && this.state.clouds.length < 6) {
      this.state.clouds.push({
        x: ENGINE_CONFIG.CANVAS_WIDTH,
        y: this.rng.nextInt(30, 71),
        remove: false,
        gap: this.rng.nextInt(100, 400),
      });
    }
  }

  private checkCollision(): boolean {
    if (this.state.obstacles.length === 0) return false;

    const obstacle = this.state.obstacles[0];
    const { tRex } = this.state;

    // Outer bounding box check
    const tRexBox = new CollisionBox(
      tRex.x + 1,
      tRex.y + 1,
      TREX_CONFIG.WIDTH - 2,
      (tRex.ducking ? TREX_CONFIG.DUCK_HEIGHT : TREX_CONFIG.HEIGHT) - 2
    );

    const obstacleBox = new CollisionBox(
      obstacle.x + 1,
      obstacle.y + 1,
      obstacle.width - 2,
      obstacle.height - 2
    );

    // Quick bounds check
    if (!CollisionBox.compare(tRexBox, obstacleBox)) {
      return false;
    }

    // Detailed collision with sub-boxes
    const tRexCollisionBoxes = tRex.ducking ? TREX_COLLISION_BOXES.DUCKING : TREX_COLLISION_BOXES.RUNNING;

    for (const tBox of tRexCollisionBoxes) {
      for (const oBox of obstacle.collisionBoxes) {
        const adjTrexBox = new CollisionBox(
          tBox.x + tRexBox.x,
          tBox.y + tRexBox.y,
          tBox.width,
          tBox.height
        );
        const adjObstacleBox = new CollisionBox(
          oBox.x + obstacleBox.x,
          oBox.y + obstacleBox.y,
          oBox.width,
          oBox.height
        );

        if (CollisionBox.compare(adjTrexBox, adjObstacleBox)) {
          return true;
        }
      }
    }

    return false;
  }

  private gameOver(): void {
    this.state.isGameOver = true;
    this.state.isRunning = false;
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
    }
  }

  // Utility method to get debug info
  getDebugInfo() {
    return {
      frame: this.state.frame,
      speed: this.state.currentSpeed.toFixed(2),
      score: this.state.score,
      obstacleCount: this.state.obstacles.length,
      runningTime: Math.floor(this.state.runningTime),
    };
  }
}
