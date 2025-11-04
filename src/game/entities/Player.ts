import { Graphics, Container } from 'pixi.js';

export class Player {
  public sprite: Container;
  private speed: number = 5;
  private shieldGraphics: Graphics | null = null;
  private shieldAnimationTime: number = 0;
  private jetBeams: Graphics;
  private jetAnimationTime: number = 0;

  constructor(x: number, y: number) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;

    // Create jet beams first (so they appear behind the ship)
    this.jetBeams = new Graphics();
    this.sprite.addChild(this.jetBeams);

    // Draw player as simple classic LEGO spaceship (like 6872/10497)
    const graphics = new Graphics();

    // Classic LEGO space colors
    const blue = 0x0055BF;           // LEGO classic blue
    const lightGray = 0xA0A0A0;      // LEGO light gray
    const neonYellow = 0xFFFF00;     // Bright neon yellow
    const transYellow = 0xFFFF00;    // Trans-neon yellow windscreen

    // Simple triangular body (clean and blocky)
    graphics.moveTo(0, -35);      // Nose
    graphics.lineTo(18, 12);      // Right back
    graphics.lineTo(-18, 12);     // Left back
    graphics.lineTo(0, -35);      // Close
    graphics.fill({ color: blue });

    // Trans-yellow windscreen - simple trapezoid
    graphics.moveTo(0, -28);
    graphics.lineTo(8, -15);
    graphics.lineTo(8, -5);
    graphics.lineTo(-8, -5);
    graphics.lineTo(-8, -15);
    graphics.lineTo(0, -28);
    graphics.fill({ color: transYellow, alpha: 0.6 });

    // Simple gray wing blocks (like LEGO plates)
    graphics.rect(14, 5, 4, 7);
    graphics.fill({ color: lightGray });
    graphics.rect(-18, 5, 4, 7);
    graphics.fill({ color: lightGray });

    // Classic LEGO Space logo - simplified
    const logoX = 0;
    const logoY = 0;

    // Planet circle (gray)
    graphics.circle(logoX, logoY, 5);
    graphics.fill({ color: lightGray });

    // Simple rings (yellow ellipse)
    graphics.ellipse(logoX, logoY, 8, 2.5);
    graphics.stroke({ color: neonYellow, width: 1.5 });

    // Tiny rocket (just a simple triangle)
    graphics.moveTo(logoX + 4, logoY - 2);
    graphics.lineTo(logoX + 7, logoY);
    graphics.lineTo(logoX + 4, logoY + 2);
    graphics.fill({ color: neonYellow });

    // Rocket trail
    graphics.rect(logoX + 1, logoY - 0.5, 3, 1);
    graphics.fill({ color: neonYellow, alpha: 0.7 });

    // Simple yellow stripe on nose
    graphics.moveTo(0, -33);
    graphics.lineTo(2, -25);
    graphics.lineTo(2, -10);
    graphics.lineTo(-2, -10);
    graphics.lineTo(-2, -25);
    graphics.lineTo(0, -33);
    graphics.fill({ color: neonYellow });

    // Two simple engine blocks at back
    graphics.rect(10, 10, 4, 4);
    graphics.fill({ color: lightGray });
    graphics.circle(12, 12, 2);
    graphics.fill({ color: 0x1a1a1a });

    graphics.rect(-14, 10, 4, 4);
    graphics.fill({ color: lightGray });
    graphics.circle(-12, 12, 2);
    graphics.fill({ color: 0x1a1a1a });

    this.sprite.addChild(graphics);
  }

  public moveLeft(): void {
    this.sprite.x -= this.speed;
  }

  public moveRight(): void {
    this.sprite.x += this.speed;
  }

  public showShield(): void {
    if (!this.shieldGraphics) {
      this.shieldGraphics = new Graphics();
      this.sprite.addChild(this.shieldGraphics);
      this.shieldAnimationTime = 0;
    }
  }

  public hideShield(): void {
    if (this.shieldGraphics) {
      this.sprite.removeChild(this.shieldGraphics);
      this.shieldGraphics.destroy();
      this.shieldGraphics = null;
    }
  }

  public updateJetBeams(deltaTime: number): void {
    this.jetAnimationTime += deltaTime * 0.005;

    this.jetBeams.clear();

    const neonYellow = 0xFFFF00;
    const orange = 0xFF8800;

    // Animated jet flames from both engines
    for (const engineX of [-12, 12]) {
      const baseY = 13;

      // Flame length varies with animation
      const flameLength = 25 + Math.sin(this.jetAnimationTime * 3 + engineX) * 8;

      // Outer flame (orange glow)
      this.jetBeams.moveTo(engineX, baseY);
      this.jetBeams.lineTo(engineX + 4, baseY + flameLength * 0.6);
      this.jetBeams.lineTo(engineX, baseY + flameLength);
      this.jetBeams.lineTo(engineX - 4, baseY + flameLength * 0.6);
      this.jetBeams.lineTo(engineX, baseY);
      this.jetBeams.fill({ color: orange, alpha: 0.5 + Math.sin(this.jetAnimationTime * 4) * 0.2 });

      // Inner flame (bright yellow core)
      const coreLength = flameLength * 0.7;
      this.jetBeams.moveTo(engineX, baseY);
      this.jetBeams.lineTo(engineX + 2, baseY + coreLength * 0.6);
      this.jetBeams.lineTo(engineX, baseY + coreLength);
      this.jetBeams.lineTo(engineX - 2, baseY + coreLength * 0.6);
      this.jetBeams.lineTo(engineX, baseY);
      this.jetBeams.fill({ color: neonYellow, alpha: 0.8 });

      // Bright center streak
      this.jetBeams.rect(engineX - 1, baseY, 2, coreLength * 0.5);
      this.jetBeams.fill({ color: 0xFFFFFF, alpha: 0.9 });
    }
  }

  public updateShield(deltaTime: number, shieldCount: number = 1): void {
    // Always update jet beams
    this.updateJetBeams(deltaTime);

    if (!this.shieldGraphics) return;

    this.shieldAnimationTime += deltaTime * 0.003; // Slow animation

    // Clear and redraw the shield with animation
    this.shieldGraphics.clear();

    // Draw multiple layers based on shield count
    const maxLayers = Math.min(shieldCount, 5); // Cap visual at 5 layers

    for (let layer = 0; layer < maxLayers; layer++) {
      const layerOffset = layer * 8; // Space between layers
      const radius = 45 + layerOffset + Math.sin(this.shieldAnimationTime + layer * 0.5) * 3;
      const alpha = (0.6 + Math.sin(this.shieldAnimationTime * 2) * 0.2) * (1 - layer * 0.15);

      // Outer glow for each layer
      this.shieldGraphics.circle(0, -10, radius + 5);
      this.shieldGraphics.fill({ color: 0x00ffff, alpha: alpha * 0.2 });

      // Main shield hexagon for each layer
      const sides = 6;
      this.shieldGraphics.moveTo(
        Math.cos(this.shieldAnimationTime + layer * 0.3) * radius,
        Math.sin(this.shieldAnimationTime + layer * 0.3) * radius - 10
      );

      for (let i = 1; i <= sides; i++) {
        const angle = (i * Math.PI * 2) / sides + this.shieldAnimationTime + layer * 0.3;
        this.shieldGraphics.lineTo(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius - 10
        );
      }

      this.shieldGraphics.stroke({ color: 0x00ffff, width: 2 + layer * 0.5, alpha: alpha });
      this.shieldGraphics.fill({ color: 0x00ffff, alpha: alpha * 0.1 });
    }

    // Inner energy ring (only on innermost shield)
    const innerRadius = 45 + Math.sin(this.shieldAnimationTime) * 3;
    const alpha = 0.6 + Math.sin(this.shieldAnimationTime * 2) * 0.2;
    this.shieldGraphics.circle(0, -10, innerRadius * 0.7);
    this.shieldGraphics.stroke({ color: 0xffffff, width: 2, alpha: alpha * 0.6 });
  }
}
