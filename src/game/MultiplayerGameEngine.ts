/**
 * Multiplayer Game Engine Wrapper
 * Wraps the new DinoEngine for multiplayer compatibility
 */

import { DinoEngine, ENGINE_CONFIG, FPS, InputAction, EngineGameState, TRexState } from './engine';
import { type GameState, type Obstacle, type PlayerGameState, type GameInput, type SkinType, GAME_CONFIG } from '@/types/game';

interface MultiplayerPlayer {
  id: string;
  username: string;
  skin: SkinType;
}

interface PlayerEngine {
  engine: DinoEngine;
  player: MultiplayerPlayer;
  isAlive: boolean;
  score: number;
  distance: number;
}

export class MultiplayerGameEngine {
  private playerEngines: Map<string, PlayerEngine> = new Map();
  private seed: number;
  private frame: number = 0;
  private isRunning: boolean = false;
  private isGameOver: boolean = false;
  private inputQueue: GameInput[] = [];

  constructor(seed: number, players: MultiplayerPlayer[]) {
    this.seed = seed;

    // Create an engine instance for each player
    players.forEach(player => {
      const engine = new DinoEngine(seed);
      this.playerEngines.set(player.id, {
        engine,
        player,
        isAlive: true,
        score: 0,
        distance: 0,
      });
    });
  }

  start(): void {
    this.isRunning = true;
    this.isGameOver = false;
    this.playerEngines.forEach(pe => pe.engine.start());
  }

  pause(): void {
    this.isRunning = false;
    this.playerEngines.forEach(pe => pe.engine.stop());
  }

  queueInput(input: GameInput): void {
    this.inputQueue.push(input);
  }

  getState(): GameState {
    // Get the first engine's state for obstacles (they're deterministic)
    const firstEngine = Array.from(this.playerEngines.values())[0];
    const engineState = firstEngine?.engine.getState();

    // Convert obstacles
    const obstacles: Obstacle[] = engineState?.obstacles.map(o => ({
      id: o.id,
      type: o.type === 'CACTUS_SMALL' ? 'cactus-small' :
            o.type === 'CACTUS_LARGE' ? 'cactus-large' :
            'pterodactyl',
      x: o.x,
      y: o.y,
      width: o.width,
      height: o.height,
      frame: o.currentFrame,
    })) || [];

    // Build player states
    const players: PlayerGameState[] = Array.from(this.playerEngines.values()).map(pe => {
      const tRex = pe.engine.getTRex();
      return {
        id: pe.player.id,
        username: pe.player.username,
        skin: pe.player.skin,
        y: tRex.y,
        velocityY: tRex.jumpVelocity,
        isJumping: tRex.jumping,
        isDucking: tRex.ducking,
        isAlive: pe.isAlive,
        distance: pe.distance,
        score: pe.score,
      };
    });

    return {
      frame: this.frame,
      seed: this.seed,
      speed: engineState?.currentSpeed || GAME_CONFIG.INITIAL_SPEED,
      distance: Math.max(...players.map(p => p.distance)),
      isRunning: this.isRunning,
      isGameOver: this.isGameOver,
      obstacles,
      players,
    };
  }

  getPlayer(playerId: string): PlayerGameState | undefined {
    const pe = this.playerEngines.get(playerId);
    if (!pe) return undefined;

    const tRex = pe.engine.getTRex();
    return {
      id: pe.player.id,
      username: pe.player.username,
      skin: pe.player.skin,
      y: tRex.y,
      velocityY: tRex.jumpVelocity,
      isJumping: tRex.jumping,
      isDucking: tRex.ducking,
      isAlive: pe.isAlive,
      distance: pe.distance,
      score: pe.score,
    };
  }

  markPlayerDead(playerId: string, score: number, distance: number): void {
    const pe = this.playerEngines.get(playerId);
    if (pe) {
      pe.isAlive = false;
      pe.score = score;
      pe.distance = distance;
      pe.engine.stop();
    }
  }

  tick(): GameState {
    if (!this.isRunning || this.isGameOver) {
      return this.getState();
    }

    this.frame++;

    // Process inputs for this frame
    const frameInputs = this.inputQueue.filter(i => i.frame === this.frame);
    this.inputQueue = this.inputQueue.filter(i => i.frame > this.frame);

    // Process inputs for each player
    frameInputs.forEach(input => {
      const pe = this.playerEngines.get(input.playerId);
      if (!pe || !pe.isAlive) return;

      const engineAction: InputAction =
        input.action === 'jump' ? 'jump' :
        input.action === 'duck' ? 'duck_start' :
        'duck_end';

      pe.engine.processInput(engineAction);
    });

    // Update all player engines
    this.playerEngines.forEach(pe => {
      if (!pe.isAlive) return;

      pe.engine.update();

      if (pe.engine.isGameOver()) {
        pe.isAlive = false;
        pe.score = pe.engine.getScore();
        pe.distance = pe.engine.getScore();
      } else {
        pe.score = pe.engine.getScore();
        pe.distance = pe.engine.getScore();
      }
    });

    // Check if all players are dead
    const anyAlive = Array.from(this.playerEngines.values()).some(pe => pe.isAlive);
    if (!anyAlive) {
      this.isGameOver = true;
      this.isRunning = false;
    }

    return this.getState();
  }
}
