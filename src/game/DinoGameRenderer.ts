// =============================================
// DINO GAME RENDERER - SPRITE-BASED
// Chrome Dino recreation w/ multi-skin & HiDPI support
// =============================================

import {
  GAME_CONFIG,
  type GameState,
  type PlayerGameState,
  type Obstacle,
  type SkinType,
} from '@/types/game';

import { SpriteLoader } from './sprites/SpriteLoader';
import { getSkinConfig, getSpriteDefinition, type SkinConfig } from './sprites/SkinConfig';
import type { SpriteDefinition, SpriteCoords } from './sprites/SpriteDefinitions';

// Extract constants
const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DINO_X,
  DINO_DUCK_HEIGHT,
  GROUND_Y,
  DINO_START_Y,
} = GAME_CONFIG;

const PLAYER_COLORS = ['#2ECC71', '#E74C3C', '#3498DB', '#F1C40F'];

export class DinoGameRenderer {
  // core state
  private ctx: CanvasRenderingContext2D;
  private skin: SkinType;
  private skinConfig: SkinConfig;
  private spriteDef: SpriteDefinition;

  // rendering assets
  private spriteSheet: HTMLImageElement | null = null;
  private spriteReady = false;

  // animation state
  private groundOffset = 0;
  private runFrame = 0;
  private pterodactylFrame = 0;

  private playerColorMap = new Map<string, string>();

  constructor(canvas: HTMLCanvasElement, skin: SkinType = 'classic') {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Assign renderer state
    this.ctx = ctx;
    this.skin = skin;
    this.skinConfig = getSkinConfig(skin);
    this.spriteDef = getSpriteDefinition(skin, false);

    // HiDPI scale for crisp pixels
    const scale = window.devicePixelRatio || 1;

    canvas.width = CANVAS_WIDTH * scale;
    canvas.height = CANVAS_HEIGHT * scale;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    this.loadSprite();
  }

  // ================================
  // Sprite loading + skin switching
  // ================================

  private async loadSprite(): Promise<void> {
    try {
      this.spriteSheet = await SpriteLoader.load(this.skinConfig.spriteSheet);
      this.spriteReady = true;
    } catch {
      console.error('Failed to load sprite sheet');
      this.spriteReady = false;
    }
  }

  setSkin(skin: SkinType): void {
    this.skin = skin;
    this.skinConfig = getSkinConfig(skin);
    this.spriteDef = getSpriteDefinition(skin, false);
    this.loadSprite();
  }

  private getPlayerColor(playerId: string, index: number): string {
    if (!this.playerColorMap.has(playerId)) {
      const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
      this.playerColorMap.set(playerId, color);
    }
    return this.playerColorMap.get(playerId)!;
  }

  // ================================
  // Main frame render loop
  // ================================

  render(state: GameState, localPlayerId?: string): void {
    const bg = this.skinConfig.backgroundColor || '#fff';

    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Animation frame updates
    this.groundOffset = (this.groundOffset + state.speed) % 24;

    if (state.frame % 6 === 0) this.runFrame ^= 1;
    if (state.frame % 10 === 0) this.pterodactylFrame ^= 1;

    if (this.skinConfig.filter) {
      this.ctx.filter = this.skinConfig.filter;
    }

    this.drawClouds(state.distance);
    this.drawGround(state.distance);

    state.obstacles.forEach(o => this.drawObstacle(o));

    const sorted = [...state.players].sort((a, b) =>
      a.id === localPlayerId ? 1 :
      b.id === localPlayerId ? -1 :
      0
    );

    sorted.forEach((p, index) => {
      this.getPlayerColor(p.id, index);
      this.drawDino(p, p.id === localPlayerId, index);
    });

    this.ctx.filter = 'none';

    this.drawHiScore(state);

    if (state.isGameOver) {
      this.drawGameOver();
    }
  }

  // ================================
  // Ground + clouds
  // ================================

  private drawGround(distance: number): void {
    if (!this.spriteReady || !this.spriteSheet) {
      this.drawGroundFallback(distance);
      return;
    }

    const horizon = this.spriteDef.HORIZON;
    const offset = Math.floor(distance * 0.5) % horizon.w;

    const firstWidth = Math.min(horizon.w - offset, CANVAS_WIDTH);
    this.ctx.drawImage(
      this.spriteSheet,
      horizon.x + offset,
      horizon.y,
      firstWidth,
      horizon.h,
      0,
      GROUND_Y,
      firstWidth,
      horizon.h
    );

    if (firstWidth < CANVAS_WIDTH) {
      this.ctx.drawImage(
        this.spriteSheet,
        horizon.x,
        horizon.y,
        CANVAS_WIDTH - firstWidth,
        horizon.h,
        firstWidth,
        GROUND_Y,
        CANVAS_WIDTH - firstWidth,
        horizon.h
      );
    }
  }

  private drawGroundFallback(distance: number): void {
    this.ctx.fillStyle = this.skinConfig.groundColor || '#737373';
    this.ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 2);

    const offset = Math.floor(distance * 0.5) % 600;

    for (let i = 0; i < CANVAS_WIDTH + 100; i += 3) {
      const hash = (((i + offset) * 2654435761) >>> 0) % 100;

      if (hash < 15) {
        this.ctx.fillRect(i - offset % 600, GROUND_Y + 4, 2 + Math.floor(hash / 5), 2);
      }
    }
  }

  private drawClouds(distance: number): void {
    if (!this.spriteReady || !this.spriteSheet) return;

    const cloud = this.spriteDef.CLOUD;
    const offset = Math.floor(distance * 0.2) % (CANVAS_WIDTH * 2);

    const positions = [
      { x: 100 - offset % CANVAS_WIDTH, y: 30 },
      { x: 350 - offset % CANVAS_WIDTH, y: 50 },
      { x: 550 - offset % CANVAS_WIDTH, y: 20 },
    ];

    positions.forEach(({ x, y }) => {
      if (x > -cloud.w && x < CANVAS_WIDTH) {
        this.ctx.drawImage(this.spriteSheet!, cloud.x, cloud.y, cloud.w, cloud.h, x, y, cloud.w, cloud.h);
      }
    });
  }

  // ================================
  // Dino + death + fallback
  // ================================

  private drawDino(player: PlayerGameState, isLocal: boolean, idx: number): void {
    const x = DINO_X + idx * 8;
    const y = player.y;

    if (!player.isAlive) {
      this.drawDeadDino(player, idx);
      return;
    }

    if (!this.spriteReady || !this.spriteSheet) {
      this.drawDinoFallback(x, y);
      return;
    }

    const base = this.spriteDef.TREX_BASE;
    let frame: SpriteCoords;

    if (player.isDucking) {
      frame = this.runFrame ? this.spriteDef.TREX.DUCKING_2 : this.spriteDef.TREX.DUCKING_1;
      const duckY = GROUND_Y - DINO_DUCK_HEIGHT;
      this.ctx.drawImage(this.spriteSheet, base.x + frame.x, base.y + frame.y, frame.w, frame.h, x, duckY, frame.w, frame.h);
    } else if (player.isJumping) {
      frame = this.spriteDef.TREX.JUMPING;
      this.ctx.drawImage(this.spriteSheet, base.x + frame.x, base.y + frame.y, frame.w, frame.h, x, y, frame.w, frame.h);
    } else {
      frame = this.runFrame ? this.spriteDef.TREX.RUNNING_2 : this.spriteDef.TREX.RUNNING_1;
      this.ctx.drawImage(this.spriteSheet, base.x + frame.x, base.y + frame.y, frame.w, frame.h, x, y, frame.w, frame.h);
    }

    if (!isLocal) {
      const color = this.playerColorMap.get(player.id)!;
      const nameY = Math.min(y - 15, DINO_START_Y - 20);

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(x + frame.w / 2, nameY, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawDinoFallback(x: number, y: number): void {
    const h = this.ctx;
    h.fillStyle = '#262626';
    h.fillRect(x + 30, y - 2, 14, 18);
    h.fillRect(x + 38, y + 4, 6, 8);
    h.fillRect(x + 14, y + 14, 24, 22);
    h.fillRect(x + 4, y + 18, 12, 10);
    h.fillRect(x + 16, y + 36, 8, 12);
    h.fillRect(x + 28, y + 36, 8, 12);
  }

  private drawDeadDino(player: PlayerGameState, idx: number): void {
    const x = DINO_X + idx * 8;
    const y = player.isDucking ? (GROUND_Y - DINO_DUCK_HEIGHT) : player.y;

    if (!this.spriteReady || !this.spriteSheet) {
      this.ctx.fillStyle = '#262626';
      this.ctx.fillRect(x + 14, y + 14, 24, 22);
      this.ctx.fillRect(x + 30, y - 2, 14, 18);
      return;
    }

    const base = this.spriteDef.TREX_BASE;
    const crash = this.spriteDef.TREX.CRASHED;

    this.ctx.drawImage(
      this.spriteSheet,
      base.x + crash.x,
      base.y + crash.y,
      crash.w,
      crash.h,
      x,
      y,
      crash.w,
      crash.h
    );
  }

  // ================================
  // Obstacles
  // ================================

  private drawObstacle(obstacle: Obstacle): void {
    if (!this.spriteReady || !this.spriteSheet) {
      this.drawObstacleFallback(obstacle);
      return;
    }

    const { type, x, y } = obstacle;

    switch (type) {
      case 'cactus-small': return this.drawCactusSmall(x, y);
      case 'cactus-large': return this.drawCactusLarge(x, y);
      case 'cactus-group':
        this.drawCactusSmall(x, y);
        this.drawCactusSmall(x + 18, y);
        this.drawCactusSmall(x + 34, y);
        break;
      case 'pterodactyl': return this.drawPterodactyl(x, y);
    }
  }

  private drawCactusSmall(x: number, y: number): void {
    const c = this.spriteDef.CACTUS_SMALL;
    this.ctx.drawImage(this.spriteSheet!, c.x, c.y, c.w, c.h, x, y, c.w, c.h);
  }

  private drawCactusLarge(x: number, y: number): void {
    const c = this.spriteDef.CACTUS_LARGE;
    this.ctx.drawImage(this.spriteSheet!, c.x, c.y, c.w, c.h, x, y, c.w, c.h);
  }

  private drawPterodactyl(x: number, y: number): void {
    const p = this.pterodactylFrame
      ? this.spriteDef.PTERODACTYL.frame2
      : this.spriteDef.PTERODACTYL.frame1;

    this.ctx.drawImage(this.spriteSheet!, p.x, p.y, p.w, p.h, x, y, p.w, p.h);
  }

  private drawObstacleFallback(o: Obstacle): void {
    const h = this.ctx;
    h.fillStyle = '#333';

    switch (o.type) {
      case 'cactus-small':
        h.fillRect(o.x + 5, o.y + 2, 8, 33);
        break;
      case 'cactus-large':
        h.fillRect(o.x + 8, o.y + 2, 10, 48);
        break;
    }
  }

  // ================================
  // UI overlays
  // ================================

  private drawHiScore(state: GameState): void {
    const fg = this.skinConfig.filter ? '#fff' : '#1A1A1A';

    this.ctx.font = '16px "Press Start 2P", monospace';
    this.ctx.fillStyle = fg;
    this.ctx.textAlign = 'right';

    this.ctx.fillText(
      `HI ${String(Math.floor(state.distance)).padStart(5, '0')}`,
      CANVAS_WIDTH - 10,
      20
    );
  }

  private drawGameOver(): void {
    const fg = this.skinConfig.filter ? '#fff' : '#1A1A1A';

    this.ctx.save();
    this.ctx.filter = 'none';
    this.ctx.fillStyle = fg;
    this.ctx.textAlign = 'center';
    this.ctx.font = '10px "Press Start 2P", monospace';

    this.ctx.fillText(
      'PRESS SPACE TO RESTART',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 40
    );

    this.ctx.restore();
  }

  renderStartScreen(skin: SkinType): void {
    const cfg = getSkinConfig(skin);
    const fg = cfg.filter ? '#fff' : '#1A1A1A';

    if (this.skin !== skin) {
      this.setSkin(skin);
    }

    this.ctx.fillStyle = cfg.backgroundColor || '#fff';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (cfg.filter) this.ctx.filter = cfg.filter;

    this.drawClouds(0);
    this.drawGround(0);

    if (this.spriteReady && this.spriteSheet) {
      const base = this.spriteDef.TREX_BASE;
      const f = this.spriteDef.TREX.WAITING_2;
      this.ctx.drawImage(
        this.spriteSheet,
        base.x + f.x,
        base.y + f.y,
        f.w,
        f.h,
        DINO_X,
        DINO_START_Y,
        f.w,
        f.h
      );
    }

    this.ctx.filter = 'none';
    this.ctx.fillStyle = fg;
    this.ctx.textAlign = 'center';

    this.ctx.font = '16px "Press Start 2P", monospace';
    this.ctx.fillText('PIXEL DINO', CANVAS_WIDTH / 2, 50);

    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.fillText('PRESS SPACE TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }
}
