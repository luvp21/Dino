// =============================================
// DINO GAME RENDERER - SPRITE-BASED
// Uses Chrome's offline-sprite.png for authentic rendering
// Supports multiple skins via CSS filters
// =============================================

import { GAME_CONFIG, type GameState, type PlayerGameState, type Obstacle, type SkinType } from '@/types/game';
import { SpriteLoader } from './sprites/SpriteLoader';
import { getSkinConfig, getSpriteDefinition, type SkinConfig } from './sprites/SkinConfig';
import type { SpriteDefinition, SpriteCoords } from './sprites/SpriteDefinitions';

const { CANVAS_WIDTH, CANVAS_HEIGHT, DINO_X, DINO_HEIGHT, DINO_DUCK_HEIGHT, GROUND_Y, DINO_START_Y } = GAME_CONFIG;

// Player colors for multiplayer
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

  // Restart button state
  private restartButtonBounds: { x: number; y: number; w: number; h: number } | null = null;
  private restartHovered: boolean = false;
  private restartPressed: boolean = false;

  constructor(canvas: HTMLCanvasElement, skin: SkinType = 'classic') {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    this.ctx = ctx;
    this.skin = skin;
    this.skinConfig = getSkinConfig(skin);
    this.spriteDef = getSpriteDefinition(skin, false);

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx.imageSmoothingEnabled = false;

    this.loadSprite();
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

    // Apply skin filter
    if (this.skinConfig.filter) {
      this.ctx.filter = this.skinConfig.filter;
    }

    // Draw clouds (behind everything)
    this.drawClouds(state.distance);

    // Draw ground/horizon
    this.drawGround(state.distance);

    // Draw obstacles
    state.obstacles.forEach(obstacle => {
      this.drawObstacle(obstacle);
    });

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
      this.drawDino(player, isLocal, drawIndex);
    });

    // Reset filter for UI
    this.ctx.filter = 'none';

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
    const offset = Math.floor(distance * 0.5) % horizon.w;

    // Ground line at GROUND_Y
    const firstWidth = Math.min(horizon.w - offset, CANVAS_WIDTH);
    this.ctx.drawImage(
      this.spriteSheet,
      horizon.x + offset, horizon.y, firstWidth, horizon.h,
      0, GROUND_Y, firstWidth, horizon.h
    );

    // Second segment (wraps around)
    if (firstWidth < CANVAS_WIDTH) {
      this.ctx.drawImage(
        this.spriteSheet,
        horizon.x, horizon.y, CANVAS_WIDTH - firstWidth, horizon.h,
        firstWidth, GROUND_Y, CANVAS_WIDTH - firstWidth, horizon.h
      );
    }
  }

  private drawGroundFallback(distance: number): void {
    this.ctx.fillStyle = this.skinConfig.groundColor || '#737373';
    this.ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 2);

    // Ground texture
    const offset = Math.floor(distance * 0.5) % 600;
    for (let i = 0; i < CANVAS_WIDTH + 100; i += 3) {
      const worldX = i + offset;
      const hash = (worldX * 2654435761) >>> 0;
      const random = (hash % 100) / 100;
      const drawX = i - (offset % 600);

      if (random < 0.15) {
        this.ctx.fillRect(drawX, GROUND_Y + 4, 2 + Math.floor(random * 3), 2);
      }
    }
  }

  private drawClouds(distance: number): void {
    if (!this.spriteReady || !this.spriteSheet) return;

    const cloud = this.spriteDef.CLOUD;
    const offset = Math.floor(distance * 0.2) % (CANVAS_WIDTH * 2);

    // Clouds at different heights
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
      // Ducking animation
      frame = this.runFrame === 0 ? this.spriteDef.TREX.DUCKING_1 : this.spriteDef.TREX.DUCKING_2;
      // Position duck so bottom aligns with ground (same as standing dino feet)
      const duckY = GROUND_Y - DINO_DUCK_HEIGHT;
      this.ctx.drawImage(
        this.spriteSheet,
        trexBase.x + frame.x, trexBase.y + frame.y, frame.w, frame.h,
        x, duckY, frame.w, frame.h
      );
    } else if (player.isJumping) {
      // Jumping (use waiting frame for static pose)
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
      const indicatorY = Math.min(y - 15, DINO_START_Y - 20);
      this.ctx.fillStyle = playerColor;
      this.ctx.beginPath();
      this.ctx.arc(x + frame.w / 2, indicatorY, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawDinoFallback(x: number, y: number, player: PlayerGameState): void {
    this.ctx.fillStyle = '#262626';

    if (player.isDucking) {
      const duckY = GROUND_Y - DINO_DUCK_HEIGHT;
      this.ctx.fillRect(x, duckY + 4, 50, 18);
      this.ctx.fillRect(x + 44, duckY, 14, 14);
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

    // Keep the exact collision pose position instead of snapping to start Y
    const y = player.isDucking ? (GROUND_Y - DINO_DUCK_HEIGHT) : player.y;

    if (!this.spriteReady || !this.spriteSheet) {
      this.ctx.fillStyle = '#262626';
      this.ctx.fillRect(x + 14, y + 14, 24, 22);
      this.ctx.fillRect(x + 30, y - 2, 14, 18);
      return;
    }

    const trexBase = this.spriteDef.TREX_BASE;
    const frame = this.spriteDef.TREX.CRASHED;

    this.ctx.drawImage(
      this.spriteSheet,
      trexBase.x + frame.x, trexBase.y + frame.y, frame.w, frame.h,
      x, y, frame.w, frame.h
    );
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
    const fgColor = this.skinConfig.filter ? '#FFFFFF' : '#1A1A1A';

    // Match the classic Dino "GAME OVER" layout: text top-center + restart icon
    if (this.spriteReady && this.spriteSheet) {
      const gameOver = this.spriteDef.GAME_OVER;
      const restart = this.spriteDef.RESTART;

      const goX = Math.round(CANVAS_WIDTH / 2 - gameOver.w / 2);
      const goY = 18;
      const rX = Math.round(CANVAS_WIDTH / 2 - restart.w / 2);
      const rY = goY + 20;

      // Store button bounds for click detection
      const padding = 6;
      this.restartButtonBounds = {
        x: rX - padding,
        y: rY - padding,
        w: restart.w + padding * 2,
        h: restart.h + padding * 2,
      };

      // If the skin uses an invert-like filter, invert UI sprites so they stay readable.
      this.ctx.save();
      if (this.skinConfig.filter) {
        this.ctx.filter = 'invert(1)';
      }

      this.ctx.drawImage(
        this.spriteSheet,
        gameOver.x, gameOver.y, gameOver.w, gameOver.h,
        goX, goY, gameOver.w, gameOver.h
      );

      // Apply hover/press animation offset
      let offsetY = 0;
      if (this.restartPressed) {
        offsetY = 2; // Press down effect
      } else if (this.restartHovered) {
        offsetY = -2; // Hover lift effect
      }

      this.ctx.drawImage(
        this.spriteSheet,
        restart.x, restart.y, restart.w, restart.h,
        rX, rY + offsetY, restart.w, restart.h
      );

      this.ctx.restore();

      // Pixel border around restart button with hover/press states
      this.ctx.strokeStyle = fgColor;
      this.ctx.lineWidth = this.restartHovered ? 3 : 2;

      // Draw button background on hover
      if (this.restartHovered) {
        this.ctx.fillStyle = this.skinConfig.filter ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
        this.ctx.fillRect(rX - padding, rY - padding + offsetY, restart.w + padding * 2, restart.h + padding * 2);
      }

      this.ctx.strokeRect(rX - padding, rY - padding + offsetY, restart.w + padding * 2, restart.h + padding * 2);
      return;
    }

    // Fallback when sprite sheet isn't ready - store bounds for fallback button too
    const btnW = 120;
    const btnH = 24;
    const btnX = CANVAS_WIDTH / 2 - btnW / 2;
    const btnY = 42;
    this.restartButtonBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

    let offsetY = 0;
    if (this.restartPressed) offsetY = 2;
    else if (this.restartHovered) offsetY = -2;

    this.ctx.fillStyle = fgColor;
    this.ctx.font = '16px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 30);

    // Draw button with hover state
    if (this.restartHovered) {
      this.ctx.fillStyle = this.skinConfig.filter ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
      this.ctx.fillRect(btnX, btnY + offsetY, btnW, btnH);
    }
    this.ctx.strokeStyle = fgColor;
    this.ctx.lineWidth = this.restartHovered ? 3 : 2;
    this.ctx.strokeRect(btnX, btnY + offsetY, btnW, btnH);

    this.ctx.fillStyle = fgColor;
    this.ctx.font = '8px "Press Start 2P", monospace';
    this.ctx.fillText('PRESS SPACE', CANVAS_WIDTH / 2, btnY + 16 + offsetY);
  }

  // Check if a point (in canvas coords) is over the restart button
  isPointOverRestartButton(canvasX: number, canvasY: number): boolean {
    if (!this.restartButtonBounds) return false;
    const { x, y, w, h } = this.restartButtonBounds;
    return canvasX >= x && canvasX <= x + w && canvasY >= y && canvasY <= y + h;
  }

  setRestartHovered(hovered: boolean): void {
    this.restartHovered = hovered;
  }

  setRestartPressed(pressed: boolean): void {
    this.restartPressed = pressed;
  }

  clearRestartButtonState(): void {
    this.restartButtonBounds = null;
    this.restartHovered = false;
    this.restartPressed = false;
  }

  renderStartScreen(skin: SkinType): void {
    const config = getSkinConfig(skin);
    const bgColor = config.backgroundColor || '#FFFFFF';
    const fgColor = config.filter ? '#FFFFFF' : '#1A1A1A';

    if (this.skin !== skin) {
      this.setSkin(skin);
    }

    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (config.filter) {
      this.ctx.filter = config.filter;
    }

    // Draw clouds
    this.drawClouds(0);

    // Draw ground
    this.drawGround(0);

    // Draw static dino
    if (this.spriteReady && this.spriteSheet) {
      const trexBase = this.spriteDef.TREX_BASE;
      const frame = this.spriteDef.TREX.WAITING_2;
      this.ctx.drawImage(
        this.spriteSheet,
        trexBase.x + frame.x, trexBase.y + frame.y, frame.w, frame.h,
        DINO_X, DINO_START_Y, frame.w, frame.h
      );
    } else {
      this.drawDinoFallback(DINO_X, DINO_START_Y, {
        isJumping: false,
        isDucking: false
      } as PlayerGameState);
    }

    this.ctx.filter = 'none';

    // Title
    this.ctx.fillStyle = fgColor;
    this.ctx.font = '16px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PIXEL DINO', CANVAS_WIDTH / 2, 50);

    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.fillText('PRESS SPACE TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }
}
