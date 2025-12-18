// Winter effects renderer - adds snow, frost, and winter atmosphere
// Overlays on top of base sprite rendering

export interface Snowflake {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
}

export class WinterEffects {
  private snowflakes: Snowflake[] = [];
  private canvasWidth: number;
  private canvasHeight: number;
  private groundY: number;
  private snowAccumulation: number[] = []; // Snow height at each x position

  constructor(canvasWidth: number, canvasHeight: number, groundY: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.groundY = groundY;
    
    // Initialize snowflakes
    this.initSnowflakes(50);
    
    // Initialize snow accumulation
    this.snowAccumulation = new Array(Math.ceil(canvasWidth / 4)).fill(0);
  }

  private initSnowflakes(count: number): void {
    for (let i = 0; i < count; i++) {
      this.snowflakes.push(this.createSnowflake(true));
    }
  }

  private createSnowflake(randomY: boolean = false): Snowflake {
    return {
      x: Math.random() * this.canvasWidth,
      y: randomY ? Math.random() * this.canvasHeight : -10,
      size: 1 + Math.random() * 3,
      speed: 0.5 + Math.random() * 1.5,
      drift: (Math.random() - 0.5) * 0.5,
      opacity: 0.5 + Math.random() * 0.5,
    };
  }

  update(gameSpeed: number): void {
    // Update snowflakes
    this.snowflakes.forEach((flake, index) => {
      flake.y += flake.speed;
      flake.x += flake.drift - gameSpeed * 0.3; // Drift with wind
      
      // Wrap horizontally
      if (flake.x < 0) flake.x = this.canvasWidth;
      if (flake.x > this.canvasWidth) flake.x = 0;
      
      // Reset when hitting ground
      if (flake.y > this.groundY - 5) {
        // Add to snow accumulation
        const accIndex = Math.floor(flake.x / 4);
        if (accIndex >= 0 && accIndex < this.snowAccumulation.length) {
          this.snowAccumulation[accIndex] = Math.min(
            this.snowAccumulation[accIndex] + 0.1,
            3
          );
        }
        this.snowflakes[index] = this.createSnowflake(false);
      }
    });

    // Slowly reduce snow accumulation (melting/wind)
    for (let i = 0; i < this.snowAccumulation.length; i++) {
      this.snowAccumulation[i] = Math.max(0, this.snowAccumulation[i] - 0.002);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Draw snowflakes
    this.snowflakes.forEach(flake => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      
      if (flake.size > 2) {
        // Larger flakes are star-shaped
        this.drawSnowflakeStar(ctx, flake.x, flake.y, flake.size);
      } else {
        // Small flakes are circles
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw snow accumulation on ground
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < this.snowAccumulation.length; i++) {
      const height = this.snowAccumulation[i];
      if (height > 0) {
        ctx.fillRect(
          i * 4,
          this.groundY - height,
          4,
          height + 2
        );
      }
    }
  }

  private drawSnowflakeStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.save();
    ctx.translate(x, y);
    
    // Draw 6-pointed snowflake
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.fillRect(-0.5, 0, 1, size);
      ctx.fillRect(-size * 0.3, size * 0.5, size * 0.6, 1);
    }
    
    ctx.restore();
  }

  // Draw frost overlay on edges
  renderFrostOverlay(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, 30);
    gradient.addColorStop(0, 'rgba(200, 230, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(200, 230, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, 30);
    
    // Side frost
    const sideGradient = ctx.createLinearGradient(0, 0, 20, 0);
    sideGradient.addColorStop(0, 'rgba(200, 230, 255, 0.2)');
    sideGradient.addColorStop(1, 'rgba(200, 230, 255, 0)');
    
    ctx.fillStyle = sideGradient;
    ctx.fillRect(0, 0, 20, this.canvasHeight);
  }

  // Draw scarf on dino at given position
  renderDinoScarf(ctx: CanvasRenderingContext2D, x: number, y: number, isDucking: boolean): void {
    const scarfColor = '#E74C3C'; // Red scarf
    const scarfStripe = '#C0392B'; // Darker stripe
    
    ctx.fillStyle = scarfColor;
    
    if (isDucking) {
      // Scarf wraps tighter when ducking
      ctx.fillRect(x + 42, y + 6, 8, 4);
      ctx.fillRect(x + 46, y + 10, 6, 8);
      // Stripe
      ctx.fillStyle = scarfStripe;
      ctx.fillRect(x + 42, y + 8, 8, 1);
    } else {
      // Normal scarf around neck
      ctx.fillRect(x + 28, y + 12, 12, 4);
      // Hanging end
      ctx.fillRect(x + 24, y + 14, 6, 12);
      ctx.fillRect(x + 22, y + 24, 6, 4);
      // Stripes
      ctx.fillStyle = scarfStripe;
      ctx.fillRect(x + 28, y + 14, 12, 1);
      ctx.fillRect(x + 24, y + 18, 6, 1);
      ctx.fillRect(x + 24, y + 22, 6, 1);
    }
    
    // Fringe at the end
    ctx.fillStyle = scarfColor;
    ctx.fillRect(x + 22, y + 28, 2, 3);
    ctx.fillRect(x + 25, y + 28, 2, 4);
  }

  // Draw breath vapor in cold air
  renderBreathVapor(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void {
    if (frame % 30 < 15) return; // Only show every other half-second
    
    const breathX = x + 48;
    const breathY = y + 8;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(breathX + 4, breathY, 3, 0, Math.PI * 2);
    ctx.arc(breathX + 8, breathY - 2, 2, 0, Math.PI * 2);
    ctx.arc(breathX + 11, breathY - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
