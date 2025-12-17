// =============================================
// DINO GAME RENDERER
// Pixel-perfect canvas rendering
// Supports multiple skins/themes & multiplayer
// =============================================

import { GAME_CONFIG, type GameState, type PlayerGameState, type Obstacle, type SkinType } from '@/types/game';

const { CANVAS_WIDTH, CANVAS_HEIGHT, DINO_X, DINO_WIDTH, DINO_HEIGHT, DINO_DUCK_HEIGHT, GROUND_Y } = GAME_CONFIG;

interface SkinColors {
  background: string;
  foreground: string;
  ground: string;
  dino: string;
  obstacle: string;
}

// Distinct colors for multiplayer dinos
const PLAYER_COLORS = [
  '#00FF00', // Green (Player 1 / Local)
  '#FF6B6B', // Red
  '#4ECDC4', // Cyan
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#F38181', // Coral
  '#AA96DA', // Purple
  '#FCBAD3', // Pink
];

const SKIN_COLORS: Record<SkinType, SkinColors> = {
  classic: {
    background: '#FFFFFF',
    foreground: '#1A1A1A',
    ground: '#737373',
    dino: '#262626',
    obstacle: '#333333',
  },
  inverted: {
    background: '#1A1A1A',
    foreground: '#F2F2F2',
    ground: '#666666',
    dino: '#F2F2F2',
    obstacle: '#CCCCCC',
  },
  phosphor: {
    background: '#001A00',
    foreground: '#00FF00',
    ground: '#004400',
    dino: '#00FF00',
    obstacle: '#00CC00',
  },
  amber: {
    background: '#1A0D00',
    foreground: '#FFBF00',
    ground: '#4D2600',
    dino: '#FFBF00',
    obstacle: '#CC9900',
  },
  crt: {
    background: '#141414',
    foreground: '#D9D9D9',
    ground: '#404040',
    dino: '#D9D9D9',
    obstacle: '#B3B3B3',
  },
  winter: {
    background: '#0A1929',
    foreground: '#81D4FA',
    ground: '#1E3A5F',
    dino: '#4FC3F7',
    obstacle: '#29B6F6',
  },
  neon: {
    background: '#0D0D0D',
    foreground: '#FF00FF',
    ground: '#1A1A2E',
    dino: '#00FFFF',
    obstacle: '#FF00FF',
  },
  golden: {
    background: '#1A1500',
    foreground: '#FFD700',
    ground: '#3D3200',
    dino: '#FFC107',
    obstacle: '#FFB300',
  },
};

// Skin-specific player colors for better contrast
const SKIN_PLAYER_COLORS: Record<SkinType, string[]> = {
  classic: ['#2ECC71', '#E74C3C', '#3498DB', '#F1C40F'],
  inverted: ['#2ECC71', '#E74C3C', '#3498DB', '#F1C40F'],
  phosphor: ['#00FF00', '#00FFFF', '#FFFF00', '#FF00FF'],
  amber: ['#FFBF00', '#FF6600', '#FFFF00', '#FF9900'],
  crt: ['#00FF00', '#FF6B6B', '#00FFFF', '#FFFF00'],
  winter: ['#4FC3F7', '#81D4FA', '#B3E5FC', '#E1F5FE'],
  neon: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00'],
  golden: ['#FFD700', '#FFC107', '#FFEB3B', '#FFB300'],
};

export class DinoGameRenderer {
  private ctx: CanvasRenderingContext2D;
  private skin: SkinType;
  private groundOffset: number = 0;
  private runFrame: number = 0;
  private pterodactylFrame: number = 0;
  private playerColorMap: Map<string, string> = new Map();

  constructor(canvas: HTMLCanvasElement, skin: SkinType = 'classic') {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    this.ctx = ctx;
    this.skin = skin;
    
    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Enable pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
  }

  setSkin(skin: SkinType): void {
    this.skin = skin;
  }

  private getPlayerColor(playerId: string, playerIndex: number, isLocal: boolean): string {
    // Check if already assigned
    if (this.playerColorMap.has(playerId)) {
      return this.playerColorMap.get(playerId)!;
    }
    
    // Assign color based on index
    const skinColors = SKIN_PLAYER_COLORS[this.skin];
    const color = skinColors[playerIndex % skinColors.length];
    this.playerColorMap.set(playerId, color);
    return color;
  }

  render(state: GameState, localPlayerId?: string): void {
    const colors = SKIN_COLORS[this.skin];
    
    // Clear canvas
    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Update animation frames
    this.groundOffset = (this.groundOffset + state.speed) % 24;
    if (state.frame % 6 === 0) {
      this.runFrame = (this.runFrame + 1) % 2;
    }
    if (state.frame % 10 === 0) {
      this.pterodactylFrame = (this.pterodactylFrame + 1) % 2;
    }
    
    // Draw ground
    this.drawGround(colors, state.distance);
    
    // Draw obstacles
    state.obstacles.forEach(obstacle => {
      this.drawObstacle(obstacle, colors);
    });
    
    // Assign colors to players
    const localPlayerIndex = state.players.findIndex(p => p.id === localPlayerId);
    state.players.forEach((player, index) => {
      const isLocal = player.id === localPlayerId;
      // Local player always gets index 0 color
      const colorIndex = isLocal ? 0 : (index < localPlayerIndex ? index + 1 : index);
      this.getPlayerColor(player.id, colorIndex, isLocal);
    });
    
    // Draw players (local player on top)
    const sortedPlayers = [...state.players].sort((a, b) => {
      if (a.id === localPlayerId) return 1;
      if (b.id === localPlayerId) return -1;
      return 0;
    });
    
    sortedPlayers.forEach((player, drawIndex) => {
      const isLocal = player.id === localPlayerId;
      const playerColor = this.playerColorMap.get(player.id) || colors.dino;
      this.drawDino(player, colors, playerColor, isLocal, drawIndex);
    });
    
    // Draw player legend (top left)
    this.drawPlayerLegend(state.players, colors, localPlayerId);
    
    // Draw HI score (top right)
    this.drawHiScore(state, colors);
    
    // Draw game over if applicable
    if (state.isGameOver) {
      this.drawGameOver(colors);
    }
  }

  private drawGround(colors: SkinColors, distance: number): void {
    const y = GROUND_Y + DINO_HEIGHT + 5;
    
    // Main ground line - thicker for better visibility
    this.ctx.fillStyle = colors.ground;
    this.ctx.fillRect(0, y, CANVAS_WIDTH, 2);
    
    // Scrolling ground texture with varied elements
    const offset = Math.floor(distance * 0.5) % 600;
    
    // Draw varied ground bumps and details
    for (let i = 0; i < CANVAS_WIDTH + 100; i += 3) {
      const worldX = i + offset;
      const hash = (worldX * 2654435761) >>> 0;
      const random = (hash % 100) / 100;
      
      const drawX = i - (offset % 600);
      
      if (random < 0.08) {
        // Large rock
        this.ctx.fillRect(drawX, y + 4, 4, 3);
        this.ctx.fillRect(drawX + 1, y + 3, 2, 1);
      } else if (random < 0.15) {
        // Medium bump
        this.ctx.fillRect(drawX, y + 4, 3, 2);
      } else if (random < 0.25) {
        // Small dot
        this.ctx.fillRect(drawX, y + 5, 2, 1);
      } else if (random < 0.30) {
        // Tiny speck
        this.ctx.fillRect(drawX, y + 6, 1, 1);
      }
    }
    
    // Additional horizon details
    this.ctx.globalAlpha = 0.3;
    for (let i = 0; i < CANVAS_WIDTH; i += 80) {
      const hillX = (i - (offset * 0.1) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
      // Distant hills silhouette
      this.ctx.fillRect(hillX, y - 2, 30, 2);
      this.ctx.fillRect(hillX + 5, y - 4, 20, 2);
      this.ctx.fillRect(hillX + 10, y - 6, 10, 2);
    }
    this.ctx.globalAlpha = 1;
  }

  private drawDino(
    player: PlayerGameState, 
    skinColors: SkinColors, 
    playerColor: string,
    isLocal: boolean, 
    drawIndex: number
  ): void {
    if (!player.isAlive) {
      this.drawDeadDino(player, skinColors, playerColor, drawIndex);
      return;
    }

    // Offset each player slightly so they don't overlap completely
    const xOffset = drawIndex * 8;
    const x = DINO_X + xOffset;
    const y = player.y;
    
    // Use distinct player color
    const alpha = isLocal ? 1 : 0.85;
    
    if (player.isDucking) {
      this.drawDuckingDino(x, y + (DINO_HEIGHT - DINO_DUCK_HEIGHT), skinColors, playerColor, alpha);
    } else if (player.isJumping) {
      this.drawJumpingDino(x, y, skinColors, playerColor, alpha);
    } else {
      this.drawRunningDino(x, y, skinColors, playerColor, alpha);
    }
    
    // Draw player indicator above dino (colored dot + name)
    const indicatorY = Math.min(y - 15, GROUND_Y - 60);
    
    // Colored dot
    this.ctx.fillStyle = playerColor;
    this.ctx.beginPath();
    this.ctx.arc(x + DINO_WIDTH / 2 - 20, indicatorY + 3, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Name
    this.ctx.fillStyle = skinColors.foreground;
    this.ctx.font = '7px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(player.username.substring(0, 6).toUpperCase(), x + DINO_WIDTH / 2 - 12, indicatorY + 6);
    
    // Local player arrow indicator
    if (isLocal) {
      this.ctx.fillStyle = playerColor;
      this.ctx.font = '10px "Press Start 2P", monospace';
      this.ctx.fillText('▼', x + DINO_WIDTH / 2 - 5, indicatorY - 5);
    }
  }

  private drawRunningDino(x: number, y: number, skinColors: SkinColors, dinoColor: string, alpha: number): void {
    const c = this.ctx;
    c.fillStyle = this.adjustAlpha(dinoColor, alpha);
    
    // Head - more detailed T-Rex shape
    c.fillRect(x + 30, y - 2, 14, 18);  // Main head
    c.fillRect(x + 26, y + 2, 6, 12);   // Back of head
    c.fillRect(x + 38, y + 4, 6, 8);    // Snout
    c.fillRect(x + 42, y + 8, 4, 4);    // Nose tip
    
    // Eye socket (cutout)
    c.fillStyle = this.adjustAlpha(skinColors.background, alpha);
    c.fillRect(x + 36, y + 2, 4, 4);
    
    // Eye pupil
    c.fillStyle = this.adjustAlpha(dinoColor, alpha);
    c.fillRect(x + 37, y + 3, 2, 2);
    
    // Mouth line
    c.fillStyle = this.adjustAlpha(skinColors.background, alpha);
    c.fillRect(x + 38, y + 10, 8, 1);
    
    c.fillStyle = this.adjustAlpha(dinoColor, alpha);
    
    // Body - chunky T-Rex torso
    c.fillRect(x + 14, y + 14, 24, 22);  // Main body
    c.fillRect(x + 10, y + 18, 6, 14);   // Body extension
    c.fillRect(x + 34, y + 16, 6, 12);   // Chest
    
    // Arms - tiny T-Rex arms
    c.fillRect(x + 34, y + 22, 8, 4);
    c.fillRect(x + 40, y + 24, 3, 4);
    
    // Tail - segmented
    c.fillRect(x + 4, y + 18, 12, 10);
    c.fillRect(x, y + 20, 6, 6);
    c.fillRect(x - 4, y + 22, 6, 4);
    
    // Legs (animated) - more detailed
    if (this.runFrame === 0) {
      // Left leg forward
      c.fillRect(x + 16, y + 36, 8, 6);
      c.fillRect(x + 14, y + 42, 10, 4);
      c.fillRect(x + 12, y + 46, 8, 4);
      // Right leg back
      c.fillRect(x + 28, y + 36, 8, 4);
      c.fillRect(x + 30, y + 40, 6, 6);
    } else {
      // Left leg back
      c.fillRect(x + 16, y + 36, 8, 4);
      c.fillRect(x + 18, y + 40, 6, 6);
      // Right leg forward
      c.fillRect(x + 28, y + 36, 8, 6);
      c.fillRect(x + 26, y + 42, 10, 4);
      c.fillRect(x + 28, y + 46, 8, 4);
    }
  }

  private drawJumpingDino(x: number, y: number, skinColors: SkinColors, dinoColor: string, alpha: number): void {
    const c = this.ctx;
    c.fillStyle = this.adjustAlpha(dinoColor, alpha);
    
    // Head - same as running
    c.fillRect(x + 30, y - 2, 14, 18);
    c.fillRect(x + 26, y + 2, 6, 12);
    c.fillRect(x + 38, y + 4, 6, 8);
    c.fillRect(x + 42, y + 8, 4, 4);
    
    // Eye socket
    c.fillStyle = this.adjustAlpha(skinColors.background, alpha);
    c.fillRect(x + 36, y + 2, 4, 4);
    c.fillStyle = this.adjustAlpha(dinoColor, alpha);
    c.fillRect(x + 37, y + 3, 2, 2);
    
    // Mouth
    c.fillStyle = this.adjustAlpha(skinColors.background, alpha);
    c.fillRect(x + 38, y + 10, 8, 1);
    c.fillStyle = this.adjustAlpha(dinoColor, alpha);
    
    // Body
    c.fillRect(x + 14, y + 14, 24, 22);
    c.fillRect(x + 10, y + 18, 6, 14);
    c.fillRect(x + 34, y + 16, 6, 12);
    
    // Arms
    c.fillRect(x + 34, y + 22, 8, 4);
    c.fillRect(x + 40, y + 24, 3, 4);
    
    // Tail
    c.fillRect(x + 4, y + 18, 12, 10);
    c.fillRect(x, y + 20, 6, 6);
    c.fillRect(x - 4, y + 22, 6, 4);
    
    // Legs (tucked for jump)
    c.fillRect(x + 16, y + 36, 8, 6);
    c.fillRect(x + 18, y + 42, 6, 4);
    c.fillRect(x + 28, y + 36, 8, 6);
    c.fillRect(x + 30, y + 42, 6, 4);
  }

  private drawDuckingDino(x: number, y: number, skinColors: SkinColors, dinoColor: string, alpha: number): void {
    const c = this.ctx;
    c.fillStyle = this.adjustAlpha(dinoColor, alpha);
    
    // Stretched body for ducking
    c.fillRect(x, y + 4, 50, 14);
    c.fillRect(x - 4, y + 6, 8, 10);
    
    // Head - flattened
    c.fillRect(x + 44, y, 14, 14);
    c.fillRect(x + 54, y + 4, 6, 6);
    c.fillRect(x + 58, y + 6, 4, 4);
    
    // Eye
    c.fillStyle = this.adjustAlpha(skinColors.background, alpha);
    c.fillRect(x + 52, y + 2, 3, 3);
    c.fillStyle = this.adjustAlpha(dinoColor, alpha);
    c.fillRect(x + 53, y + 3, 1, 1);
    
    // Mouth
    c.fillStyle = this.adjustAlpha(skinColors.background, alpha);
    c.fillRect(x + 54, y + 8, 8, 1);
    c.fillStyle = this.adjustAlpha(dinoColor, alpha);
    
    // Tail
    c.fillRect(x - 8, y + 8, 10, 6);
    c.fillRect(x - 12, y + 10, 6, 4);
    
    // Legs (animated)
    if (this.runFrame === 0) {
      c.fillRect(x + 10, y + 18, 6, 6);
      c.fillRect(x + 8, y + 24, 6, 3);
      c.fillRect(x + 30, y + 18, 6, 4);
    } else {
      c.fillRect(x + 10, y + 18, 6, 4);
      c.fillRect(x + 30, y + 18, 6, 6);
      c.fillRect(x + 28, y + 24, 6, 3);
    }
  }

  private drawDeadDino(player: PlayerGameState, skinColors: SkinColors, playerColor: string, drawIndex: number): void {
    const x = DINO_X + drawIndex * 8;
    const y = GROUND_Y;
    const c = this.ctx;
    
    c.fillStyle = this.adjustAlpha(playerColor, 0.4);
    
    // Body - same as jumping but faded
    c.fillRect(x + 14, y + 14, 24, 22);
    c.fillRect(x + 30, y - 2, 14, 18);
    c.fillRect(x + 26, y + 2, 6, 12);
    c.fillRect(x + 38, y + 4, 6, 8);
    
    // X eyes
    c.fillStyle = this.adjustAlpha(skinColors.foreground, 0.6);
    c.fillRect(x + 35, y + 1, 2, 2);
    c.fillRect(x + 37, y + 3, 2, 2);
    c.fillRect(x + 37, y + 1, 2, 2);
    c.fillRect(x + 35, y + 3, 2, 2);
    
    // Tail and legs
    c.fillStyle = this.adjustAlpha(playerColor, 0.4);
    c.fillRect(x + 4, y + 18, 12, 10);
    c.fillRect(x + 16, y + 36, 8, 12);
    c.fillRect(x + 28, y + 36, 8, 12);
    
    // Dead indicator
    c.fillStyle = this.adjustAlpha('#FF0000', 0.7);
    c.font = '10px "Press Start 2P", monospace';
    c.textAlign = 'center';
    c.fillText('☠', x + DINO_WIDTH / 2, y - 15);
  }

  private drawObstacle(obstacle: Obstacle, colors: SkinColors): void {
    switch (obstacle.type) {
      case 'cactus-small':
        this.drawSmallCactus(obstacle.x, obstacle.y, colors);
        break;
      case 'cactus-large':
        this.drawLargeCactus(obstacle.x, obstacle.y, colors);
        break;
      case 'cactus-group':
        this.drawCactusGroup(obstacle.x, obstacle.y, colors);
        break;
      case 'pterodactyl':
        this.drawPterodactyl(obstacle.x, obstacle.y, colors);
        break;
    }
  }

  private drawSmallCactus(x: number, y: number, colors: SkinColors): void {
    const c = this.ctx;
    c.fillStyle = colors.obstacle;
    
    // Main stem with detail
    c.fillRect(x + 5, y + 2, 8, 33);
    c.fillRect(x + 4, y + 5, 10, 28);
    
    // Left arm
    c.fillRect(x, y + 10, 6, 4);
    c.fillRect(x - 2, y + 8, 4, 10);
    c.fillRect(x - 2, y + 6, 3, 4);
    
    // Right arm
    c.fillRect(x + 12, y + 16, 6, 4);
    c.fillRect(x + 16, y + 12, 4, 10);
    c.fillRect(x + 17, y + 10, 3, 4);
    
    // Top spikes
    c.fillRect(x + 6, y, 2, 3);
    c.fillRect(x + 10, y, 2, 3);
    
    // Texture lines
    c.fillStyle = this.adjustAlpha(colors.background, 0.2);
    c.fillRect(x + 8, y + 8, 1, 20);
  }

  private drawLargeCactus(x: number, y: number, colors: SkinColors): void {
    const c = this.ctx;
    c.fillStyle = colors.obstacle;
    
    // Main stem - chunky
    c.fillRect(x + 8, y + 2, 10, 48);
    c.fillRect(x + 6, y + 5, 14, 42);
    
    // Left arm
    c.fillRect(x, y + 14, 8, 6);
    c.fillRect(x - 4, y + 10, 6, 16);
    c.fillRect(x - 4, y + 6, 4, 6);
    
    // Right arm
    c.fillRect(x + 18, y + 22, 8, 6);
    c.fillRect(x + 24, y + 16, 6, 16);
    c.fillRect(x + 26, y + 12, 4, 6);
    
    // Top spikes
    c.fillRect(x + 10, y, 2, 3);
    c.fillRect(x + 14, y, 2, 3);
    
    // Texture
    c.fillStyle = this.adjustAlpha(colors.background, 0.15);
    c.fillRect(x + 12, y + 10, 1, 35);
  }

  private drawCactusGroup(x: number, y: number, colors: SkinColors): void {
    // Three cacti with slight variations
    this.drawSmallCactus(x, y + 2, colors);
    this.drawSmallCactus(x + 18, y, colors);
    this.drawSmallCactus(x + 34, y + 3, colors);
  }

  private drawPterodactyl(x: number, y: number, colors: SkinColors): void {
    const c = this.ctx;
    c.fillStyle = colors.obstacle;
    
    // Body - more detailed
    c.fillRect(x + 14, y + 16, 22, 10);
    c.fillRect(x + 12, y + 18, 26, 6);
    
    // Head
    c.fillRect(x + 34, y + 14, 10, 10);
    c.fillRect(x + 42, y + 16, 6, 6);
    
    // Beak
    c.fillRect(x + 46, y + 18, 6, 3);
    c.fillRect(x + 50, y + 19, 4, 2);
    
    // Eye
    c.fillStyle = colors.background;
    c.fillRect(x + 38, y + 16, 3, 3);
    c.fillStyle = colors.obstacle;
    c.fillRect(x + 39, y + 17, 1, 1);
    
    // Crest
    c.fillRect(x + 36, y + 12, 6, 4);
    c.fillRect(x + 34, y + 10, 4, 4);
    
    // Wing (animated)
    if (this.pterodactylFrame === 0) {
      // Wings up
      c.fillRect(x + 8, y + 2, 24, 6);
      c.fillRect(x + 4, y, 20, 4);
      c.fillRect(x, y - 4, 16, 6);
      c.fillRect(x - 4, y - 6, 10, 4);
    } else {
      // Wings down
      c.fillRect(x + 8, y + 26, 24, 6);
      c.fillRect(x + 4, y + 30, 20, 4);
      c.fillRect(x, y + 32, 16, 6);
      c.fillRect(x - 4, y + 36, 10, 4);
    }
    
    // Tail
    c.fillRect(x, y + 18, 14, 6);
    c.fillRect(x - 4, y + 20, 6, 4);
  }

  private drawPlayerLegend(players: PlayerGameState[], colors: SkinColors, localPlayerId?: string): void {
    this.ctx.font = '8px "Press Start 2P", monospace';
    
    let yOffset = 15;
    players.forEach((player, index) => {
      const isLocal = player.id === localPlayerId;
      const playerColor = this.playerColorMap.get(player.id) || colors.dino;
      
      // Background for better readability
      this.ctx.fillStyle = this.adjustAlpha(colors.background, 0.7);
      this.ctx.fillRect(5, yOffset - 9, 120, 14);
      
      // Colored dot
      this.ctx.fillStyle = playerColor;
      this.ctx.beginPath();
      this.ctx.arc(15, yOffset - 2, 5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Border for local player dot
      if (isLocal) {
        this.ctx.strokeStyle = colors.foreground;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
      
      // Player name and score
      const prefix = isLocal ? '►' : ' ';
      const status = player.isAlive ? '' : '✗';
      const name = player.username.substring(0, 5).toUpperCase();
      const score = String(player.score).padStart(5, '0');
      
      this.ctx.fillStyle = player.isAlive ? colors.foreground : colors.ground;
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${prefix}${name}`, 25, yOffset);
      
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`${score}${status}`, 120, yOffset);
      
      yOffset += 16;
    });
  }

  private drawHiScore(state: GameState, colors: SkinColors): void {
    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.fillStyle = colors.foreground;
    this.ctx.textAlign = 'right';
    
    const hi = 'HI ' + String(Math.floor(state.distance)).padStart(5, '0');
    this.ctx.fillText(hi, CANVAS_WIDTH - 10, 20);
  }

  private drawGameOver(colors: SkinColors): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = this.adjustAlpha(colors.background, 0.85);
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Game Over text
    this.ctx.fillStyle = colors.foreground;
    this.ctx.font = '20px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    
    this.ctx.font = '8px "Press Start 2P", monospace';
    this.ctx.fillText('WAITING FOR RESULTS...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }

  private adjustAlpha(color: string, alpha: number): string {
    // Convert hex to rgba
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  // Draw start screen
  renderStartScreen(skin: SkinType): void {
    const colors = SKIN_COLORS[skin];
    
    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Ground
    this.drawGround(colors, 0);
    
    // Static dino
    this.drawStaticDino(DINO_X, GROUND_Y, colors);
    
    // Title
    this.ctx.fillStyle = colors.foreground;
    this.ctx.font = '16px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PIXEL DINO', CANVAS_WIDTH / 2, 50);
    
    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.fillText('PRESS SPACE TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }

  private drawStaticDino(x: number, y: number, colors: SkinColors): void {
    const c = this.ctx;
    c.fillStyle = colors.dino;
    
    // Head - detailed T-Rex shape
    c.fillRect(x + 30, y - 2, 14, 18);
    c.fillRect(x + 26, y + 2, 6, 12);
    c.fillRect(x + 38, y + 4, 6, 8);
    c.fillRect(x + 42, y + 8, 4, 4);
    
    // Eye socket
    c.fillStyle = colors.background;
    c.fillRect(x + 36, y + 2, 4, 4);
    c.fillStyle = colors.dino;
    c.fillRect(x + 37, y + 3, 2, 2);
    
    // Mouth line
    c.fillStyle = colors.background;
    c.fillRect(x + 38, y + 10, 8, 1);
    c.fillStyle = colors.dino;
    
    // Body
    c.fillRect(x + 14, y + 14, 24, 22);
    c.fillRect(x + 10, y + 18, 6, 14);
    c.fillRect(x + 34, y + 16, 6, 12);
    
    // Arms
    c.fillRect(x + 34, y + 22, 8, 4);
    c.fillRect(x + 40, y + 24, 3, 4);
    
    // Tail
    c.fillRect(x + 4, y + 18, 12, 10);
    c.fillRect(x, y + 20, 6, 6);
    c.fillRect(x - 4, y + 22, 6, 4);
    
    // Legs (standing)
    c.fillRect(x + 16, y + 36, 8, 10);
    c.fillRect(x + 14, y + 46, 8, 4);
    c.fillRect(x + 28, y + 36, 8, 10);
    c.fillRect(x + 26, y + 46, 8, 4);
  }
}
