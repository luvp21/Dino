// =============================================
// DINO GAME RENDERER - SPRITE-BASED
// Uses Chrome's offline-sprite.png for authentic rendering
// Supports multiple skins via CSS filters + special effects
// =============================================

import { GAME_CONFIG, type GameState, type PlayerGameState, type Obstacle, type SkinType } from '@/types/game';
import { SpriteLoader } from './sprites/SpriteLoader';
import { getSkinConfig, getSpriteDefinition, type SkinConfig } from './sprites/SkinConfig';
import type { SpriteDefinition, SpriteCoords } from './sprites/SpriteDefinitions';
import { WinterEffects } from './effects/WinterEffects';

const { CANVAS_WIDTH, CANVAS_HEIGHT, DINO_X, DINO_WIDTH, DINO_HEIGHT, DINO_DUCK_HEIGHT, GROUND_Y } = GAME_CONFIG;

// Player colors for multiplayer (future use)
const PLAYER_COLORS = ['#2ECC71', '#E74C3C', '#3498DB', '#F1C40F'];

export class DinoGameRenderer {
  private ctx: CanvasRenderingContext2D;
  private skin: SkinType;
  private skinConfig: SkinConfig;
  private spriteDef: SpriteDefinition;
  private spriteSheet: HTMLImageElement | null = null;
  private spriteReady: boolean = false;

  private groundOffset: number = 0;
  private runFrame: number = 0;
  private pterodactylFrame: number = 0;
  private playerColorMap: Map<string, string> = new Map();

  // Special effects
  private winterEffects: WinterEffects | null = null;
  private frameCount: number = 0;

  constructor(canvas: HTMLCanvasElement, skin: SkinType = 'classic') {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    this.ctx = ctx;
    this.skin = skin;
    this.skinConfig = getSkinConfig(skin);
    this.spriteDef = getSpriteDefinition(skin, false); // Use LDPI for now

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Enable pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;

    // Load sprite sheet
    this.loadSprite();

    // Initialize special effects for winter skin
    if (skin === 'winter') {
      this.winterEffects = new WinterEffects(CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y + DINO_HEIGHT + 5);
    }
  }

  private async loadSprite(): Promise<void> {
    try {
      this.spriteSheet = await SpriteLoader.load(this.skinConfig.spriteSheet);
      this.spriteReady = true;
    } catch (err) {
      console.error('Failed to load sprite sheet:', err);
      this.spriteReady = false;
    }
  }

  setSkin(skin: SkinType): void {
    this.skin = skin;
    this.skinConfig = getSkinConfig(skin);
    this.spriteDef = getSpriteDefinition(skin, false);
    this.loadSprite();

    // Initialize/clear winter effects
    if (skin === 'winter') {
      this.winterEffects = new WinterEffects(CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y + DINO_HEIGHT + 5);
    } else {
      this.winterEffects = null;
    }
  }

  private getPlayerColor(playerId: string, playerIndex: number): string {
    if (this.playerColorMap.has(playerId)) {
      return this.playerColorMap.get(playerId)!;
    }
    const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
    this.playerColorMap.set(playerId, color);
    return color;
  }

  render(state: GameState, localPlayerId?: string): void {
    const bgColor = this.skinConfig.backgroundColor || '#FFFFFF';
    this.frameCount++;

    // Clear canvas
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Update animation frames
    this.groundOffset = (this.groundOffset + state.speed) % 24;
    if (state.frame % 6 === 0) {
      this.runFrame = (this.runFrame + 1) % 2;
    }
    if (state.frame % 10 === 0) {
      this.pterodactylFrame = (this.pterodactylFrame + 1) % 2;
    }

    // Update winter effects if active
    if (this.winterEffects) {
      this.winterEffects.update(state.speed);
    }

    // Draw frost overlay first (background layer)
    if (this.winterEffects) {
      this.winterEffects.renderFrostOverlay(this.ctx);
    }

    // Apply skin filter if set
    if (this.skinConfig.filter) {
      this.ctx.filter = this.skinConfig.filter;
    }

    // Draw ground/horizon
    this.drawGround(state.distance);

    // Draw obstacles
    state.obstacles.forEach(obstacle => {
      this.drawObstacle(obstacle);
    });

    // Reset filter before drawing dinos (so scarf colors are correct)
    this.ctx.filter = 'none';

    // Draw players
    const localPlayerIndex = state.players.findIndex(p => p.id === localPlayerId);
    state.players.forEach((player, index) => {
      const isLocal = player.id === localPlayerId;
      const colorIndex = isLocal ? 0 : (index < localPlayerIndex ? index + 1 : index);
      this.getPlayerColor(player.id, colorIndex);
    });

    const sortedPlayers = [...state.players].sort((a, b) => {
      if (a.id === localPlayerId) return 1;
      if (b.id === localPlayerId) return -1;
      return 0;
    });

    sortedPlayers.forEach((player, drawIndex) => {
      const isLocal = player.id === localPlayerId;

      // Apply filter for dino sprite
      if (this.skinConfig.filter) {
        this.ctx.filter = this.skinConfig.filter;
      }

      this.drawDino(player, isLocal, drawIndex);

      // Reset filter and draw winter accessories
      this.ctx.filter = 'none';

      if (this.winterEffects && player.isAlive) {
        const x = DINO_X + drawIndex * 8;
        const y = player.y;
        this.winterEffects.renderDinoScarf(this.ctx, x, y, player.isDucking);
        if (!player.isDucking) {
          this.winterEffects.renderBreathVapor(this.ctx, x, y, this.frameCount);
        }
      }
    });

    // Draw snowflakes on top
    if (this.winterEffects) {
      this.winterEffects.render(this.ctx);
    }

    // Draw HI score
    this.drawHiScore(state);

    // Draw game over
    if (state.isGameOver) {
      this.drawGameOver();
    }
  }

  private drawGround(distance: number): void {
    if (!this.spriteReady || !this.spriteSheet) {
      this.drawGroundFallback(distance);
      return;
    }

    const horizon = this.spriteDef.HORIZON;
    const y = GROUND_Y + DINO_HEIGHT + 5;
    const offset = Math.floor(distance * 0.5) % horizon.w;

    // Draw scrolling horizon line
    // First segment
    const firstWidth = Math.min(horizon.w - offset, CANVAS_WIDTH);
    this.ctx.drawImage(
      this.spriteSheet,
      horizon.x + offset, horizon.y, firstWidth, horizon.h,
      0, y, firstWidth, horizon.h
    );

    // Second segment (wraps around)
    if (firstWidth < CANVAS_WIDTH) {
      this.ctx.drawImage(
        this.spriteSheet,
        horizon.x, horizon.y, CANVAS_WIDTH - firstWidth, horizon.h,
        firstWidth, y, CANVAS_WIDTH - firstWidth, horizon.h
      );
    }

    // Draw clouds
    this.drawClouds(distance);
  }

  private drawGroundFallback(distance: number): void {
    const y = GROUND_Y + DINO_HEIGHT + 5;
    this.ctx.fillStyle = this.skinConfig.groundColor || '#737373';
    this.ctx.fillRect(0, y, CANVAS_WIDTH, 2);

    // Ground texture
    const offset = Math.floor(distance * 0.5) % 600;
    for (let i = 0; i < CANVAS_WIDTH + 100; i += 3) {
      const worldX = i + offset;
      const hash = (worldX * 2654435761) >>> 0;
      const random = (hash % 100) / 100;
      const drawX = i - (offset % 600);

      if (random < 0.15) {
        this.ctx.fillRect(drawX, y + 4, 2 + Math.floor(random * 3), 2);
      }
    }
  }

  private drawClouds(distance: number): void {
    if (!this.spriteReady || !this.spriteSheet) return;

    const cloud = this.spriteDef.CLOUD;
    const offset = Math.floor(distance * 0.2) % (CANVAS_WIDTH * 2);

    // Draw a few clouds at different positions
    const cloudPositions = [
      { x: 100 - offset % CANVAS_WIDTH, y: 30 },
      { x: 350 - offset % CANVAS_WIDTH, y: 50 },
      { x: 550 - offset % CANVAS_WIDTH, y: 20 },
    ];

    cloudPositions.forEach(pos => {
      let x = pos.x;
      if (x < -cloud.w) x += CANVAS_WIDTH + cloud.w * 2;
      if (x > CANVAS_WIDTH) return;

      this.ctx.drawImage(
        this.spriteSheet!,
        cloud.x, cloud.y, cloud.w, cloud.h,
        x, pos.y, cloud.w, cloud.h
      );
    });
  }

  private drawDino(player: PlayerGameState, isLocal: boolean, drawIndex: number): void {
    if (!player.isAlive) {
      this.drawDeadDino(player, drawIndex);
      return;
    }

    const xOffset = drawIndex * 8;
    const x = DINO_X + xOffset;
    const y = player.y;

    if (!this.spriteReady || !this.spriteSheet) {
      this.drawDinoFallback(x, y, player);
      return;
    }

    const trexBase = this.spriteDef.TREX_BASE;
    let frame: SpriteCoords;

    if (player.isDucking) {
      frame = this.runFrame === 0 ? this.spriteDef.TREX.DUCKING_1 : this.spriteDef.TREX.DUCKING_2;
      // Ducking dino is shorter, adjust y position
      const duckY = y + (DINO_HEIGHT - DINO_DUCK_HEIGHT);
      this.ctx.drawImage(
        this.spriteSheet,
        trexBase.x + frame.x, trexBase.y + frame.y, frame.w, frame.h,
        x, duckY, frame.w, frame.h
      );
    } else if (player.isJumping) {
      frame = this.spriteDef.TREX.JUMPING;
      this.ctx.drawImage(
        this.spriteSheet,
        trexBase.x + frame.x, trexBase.y + frame.y, frame.w, frame.h,
        x, y, frame.w, frame.h
      );
    } else {
      // Running animation
      frame = this.runFrame === 0 ? this.spriteDef.TREX.RUNNING_1 : this.spriteDef.TREX.RUNNING_2;
      this.ctx.drawImage(
        this.spriteSheet,
        trexBase.x + frame.x, trexBase.y + frame.y, frame.w, frame.h,
        x, y, frame.w, frame.h
      );
    }

    // Draw player indicator for multiplayer
    if (!isLocal) {
      const playerColor = this.playerColorMap.get(player.id) || '#2ECC71';
      const indicatorY = Math.min(y - 15, GROUND_Y - 60);
      this.ctx.fillStyle = playerColor;
      this.ctx.beginPath();
      this.ctx.arc(x + frame.w / 2, indicatorY, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawDinoFallback(x: number, y: number, player: PlayerGameState): void {
    this.ctx.fillStyle = '#262626';

    if (player.isDucking) {
      // Ducking body
      this.ctx.fillRect(x, y + (DINO_HEIGHT - DINO_DUCK_HEIGHT) + 4, 50, 14);
      this.ctx.fillRect(x + 44, y + (DINO_HEIGHT - DINO_DUCK_HEIGHT), 14, 14);
    } else {
      // Head
      this.ctx.fillRect(x + 30, y - 2, 14, 18);
      this.ctx.fillRect(x + 38, y + 4, 6, 8);
      // Body
      this.ctx.fillRect(x + 14, y + 14, 24, 22);
      // Tail
      this.ctx.fillRect(x + 4, y + 18, 12, 10);
      // Legs
      this.ctx.fillRect(x + 16, y + 36, 8, 12);
      this.ctx.fillRect(x + 28, y + 36, 8, 12);
    }
  }

  private drawDeadDino(player: PlayerGameState, drawIndex: number): void {
    const x = DINO_X + drawIndex * 8;
    const y = GROUND_Y;

    if (!this.spriteReady || !this.spriteSheet) {
      this.ctx.globalAlpha = 0.4;
      this.ctx.fillStyle = '#262626';
      this.ctx.fillRect(x + 14, y + 14, 24, 22);
      this.ctx.fillRect(x + 30, y - 2, 14, 18);
      this.ctx.globalAlpha = 1;
      return;
    }

    const trexBase = this.spriteDef.TREX_BASE;
    const frame = this.spriteDef.TREX.CRASHED;

    this.ctx.globalAlpha = 0.4;
    this.ctx.drawImage(
      this.spriteSheet,
      trexBase.x + frame.x, trexBase.y + frame.y, frame.w, frame.h,
      x, y, frame.w, frame.h
    );
    this.ctx.globalAlpha = 1;

    // Dead indicator
    this.ctx.fillStyle = '#FF0000';
    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('☠', x + frame.w / 2, y - 15);
  }

  private drawObstacle(obstacle: Obstacle): void {
    if (!this.spriteReady || !this.spriteSheet) {
      this.drawObstacleFallback(obstacle);
      return;
    }

    switch (obstacle.type) {
      case 'cactus-small':
        this.drawCactusSmall(obstacle.x, obstacle.y);
        break;
      case 'cactus-large':
        this.drawCactusLarge(obstacle.x, obstacle.y);
        break;
      case 'cactus-group':
        // Draw multiple small cacti
        this.drawCactusSmall(obstacle.x, obstacle.y);
        this.drawCactusSmall(obstacle.x + 18, obstacle.y);
        this.drawCactusSmall(obstacle.x + 34, obstacle.y);
        break;
      case 'pterodactyl':
        this.drawPterodactyl(obstacle.x, obstacle.y);
        break;
    }
  }

  private drawCactusSmall(x: number, y: number): void {
    const cactus = this.spriteDef.CACTUS_SMALL;
    this.ctx.drawImage(
      this.spriteSheet!,
      cactus.x, cactus.y, cactus.w, cactus.h,
      x, y, cactus.w, cactus.h
    );
  }

  private drawCactusLarge(x: number, y: number): void {
    const cactus = this.spriteDef.CACTUS_LARGE;
    this.ctx.drawImage(
      this.spriteSheet!,
      cactus.x, cactus.y, cactus.w, cactus.h,
      x, y, cactus.w, cactus.h
    );
  }

  private drawPterodactyl(x: number, y: number): void {
    const ptero = this.pterodactylFrame === 0
      ? this.spriteDef.PTERODACTYL.frame1
      : this.spriteDef.PTERODACTYL.frame2;

    this.ctx.drawImage(
      this.spriteSheet!,
      ptero.x, ptero.y, ptero.w, ptero.h,
      x, y, ptero.w, ptero.h
    );
  }

  private drawObstacleFallback(obstacle: Obstacle): void {
    this.ctx.fillStyle = '#333333';

    switch (obstacle.type) {
      case 'cactus-small':
        this.ctx.fillRect(obstacle.x + 5, obstacle.y + 2, 8, 33);
        this.ctx.fillRect(obstacle.x, obstacle.y + 10, 6, 4);
        this.ctx.fillRect(obstacle.x + 12, obstacle.y + 16, 6, 4);
        break;
      case 'cactus-large':
        this.ctx.fillRect(obstacle.x + 8, obstacle.y + 2, 10, 48);
        this.ctx.fillRect(obstacle.x, obstacle.y + 14, 8, 6);
        this.ctx.fillRect(obstacle.x + 18, obstacle.y + 22, 8, 6);
        break;
      case 'cactus-group':
        for (let i = 0; i < 3; i++) {
          const cx = obstacle.x + i * 18;
          this.ctx.fillRect(cx + 5, obstacle.y + 2, 8, 33);
        }
        break;
      case 'pterodactyl':
        this.ctx.fillRect(obstacle.x + 14, obstacle.y + 16, 22, 10);
        this.ctx.fillRect(obstacle.x + 34, obstacle.y + 14, 16, 10);
        if (this.pterodactylFrame === 0) {
          this.ctx.fillRect(obstacle.x + 8, obstacle.y + 2, 24, 6);
        } else {
          this.ctx.fillRect(obstacle.x + 8, obstacle.y + 26, 24, 6);
        }
        break;
    }
  }

  private drawHiScore(state: GameState): void {
    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.fillStyle = this.skinConfig.filter ? '#FFFFFF' : '#1A1A1A';
    this.ctx.textAlign = 'right';

    const hi = 'HI ' + String(Math.floor(state.distance)).padStart(5, '0');
    this.ctx.fillText(hi, CANVAS_WIDTH - 10, 20);
  }

  private drawGameOver(): void {
    const bgColor = this.skinConfig.backgroundColor || '#FFFFFF';
    const fgColor = this.skinConfig.filter ? '#FFFFFF' : '#1A1A1A';

    // Semi-transparent overlay
    this.ctx.fillStyle = bgColor;
    this.ctx.globalAlpha = 0.85;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.globalAlpha = 1;

    // Game Over text (could use sprite, but text works well)
    this.ctx.fillStyle = fgColor;
    this.ctx.font = '20px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

    // Draw restart button sprite if available
    if (this.spriteReady && this.spriteSheet) {
      const restart = this.spriteDef.RESTART;
      this.ctx.drawImage(
        this.spriteSheet,
        restart.x, restart.y, restart.w, restart.h,
        CANVAS_WIDTH / 2 - restart.w / 2, CANVAS_HEIGHT / 2 + 10, restart.w, restart.h
      );
    } else {
      this.ctx.font = '8px "Press Start 2P", monospace';
      this.ctx.fillText('PRESS SPACE TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }
  }

  renderStartScreen(skin: SkinType): void {
    const config = getSkinConfig(skin);
    const bgColor = config.backgroundColor || '#FFFFFF';
    const fgColor = config.filter ? '#FFFFFF' : '#1A1A1A';

    // Update skin if changed
    if (this.skin !== skin) {
      this.setSkin(skin);
    }

    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw frost overlay for winter
    if (this.winterEffects) {
      this.winterEffects.renderFrostOverlay(this.ctx);
    }

    // Apply filter
    if (config.filter) {
      this.ctx.filter = config.filter;
    }

    // Draw ground
    this.drawGround(0);

    // Draw static dino
    if (this.spriteReady && this.spriteSheet) {
      const trexBase = this.spriteDef.TREX_BASE;
      const frame = this.spriteDef.TREX.WAITING_1;
      this.ctx.drawImage(
        this.spriteSheet,
        trexBase.x + frame.x, trexBase.y + frame.y, frame.w, frame.h,
        DINO_X, GROUND_Y, frame.w, frame.h
      );
    } else {
      this.drawDinoFallback(DINO_X, GROUND_Y, {
        isJumping: false,
        isDucking: false
      } as PlayerGameState);
    }

    // Reset filter
    this.ctx.filter = 'none';

    // Draw scarf for winter
    if (this.winterEffects) {
      this.winterEffects.renderDinoScarf(this.ctx, DINO_X, GROUND_Y, false);
      this.winterEffects.update(0);
      this.winterEffects.render(this.ctx);
    }

    // Title
    this.ctx.fillStyle = fgColor;
    this.ctx.font = '16px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PIXEL DINO', CANVAS_WIDTH / 2, 50);

    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.fillText('PRESS SPACE TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }
}
