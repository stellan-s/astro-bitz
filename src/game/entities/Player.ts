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

    // Draw player as a retro 80s LEGO spaceship - more triangular
    const graphics = new Graphics();

    // Classic LEGO space colors
    const blue = 0x0055BF;        // LEGO classic blue
    const darkBlue = 0x003D99;    // Darker blue
    const neonYellow = 0xFFFF00;  // Bright neon yellow
    const trans = 0x00FFFF;       // Trans-neon blue windscreen

    // Main triangular fuselage (classic LEGO spaceship triangle)
    graphics.moveTo(0, -40);      // Sharp nose point
    graphics.lineTo(20, 15);      // Right back corner (wider triangle)
    graphics.lineTo(-20, 15);     // Left back corner
    graphics.lineTo(0, -40);      // Back to nose
    graphics.fill({ color: blue });

    // Cockpit windscreen (trans-neon blue) - angular
    graphics.moveTo(0, -32);
    graphics.lineTo(10, -18);
    graphics.lineTo(10, -8);
    graphics.lineTo(-10, -8);
    graphics.lineTo(-10, -18);
    graphics.lineTo(0, -32);
    graphics.fill({ color: trans, alpha: 0.7 });

    // Yellow racing stripe down the center
    graphics.moveTo(0, -38);
    graphics.lineTo(3, -30);
    graphics.lineTo(3, 8);
    graphics.lineTo(-3, 8);
    graphics.lineTo(-3, -30);
    graphics.lineTo(0, -38);
    graphics.fill({ color: neonYellow });

    // Wing tips with yellow accents (LEGO style blocky)
    // Right wing tip
    graphics.rect(15, 8, 5, 7);
    graphics.fill({ color: neonYellow });
    // Left wing tip
    graphics.rect(-20, 8, 5, 7);
    graphics.fill({ color: neonYellow });

    // Side panels (darker blue for depth)
    graphics.moveTo(8, -10);
    graphics.lineTo(16, 10);
    graphics.lineTo(12, 10);
    graphics.lineTo(8, -5);
    graphics.fill({ color: darkBlue });

    graphics.moveTo(-8, -10);
    graphics.lineTo(-16, 10);
    graphics.lineTo(-12, 10);
    graphics.lineTo(-8, -5);
    graphics.fill({ color: darkBlue });

    // Engine nozzles (dark blue circles at back)
    // Right engine
    graphics.circle(12, 13, 5);
    graphics.fill({ color: darkBlue });
    graphics.circle(12, 13, 3);
    graphics.fill({ color: 0x001a33 }); // Very dark for nozzle depth

    // Left engine
    graphics.circle(-12, 13, 5);
    graphics.fill({ color: darkBlue });
    graphics.circle(-12, 13, 3);
    graphics.fill({ color: 0x001a33 });

    // Yellow detail dots (LEGO style)
    graphics.circle(0, -25, 2);
    graphics.fill({ color: neonYellow });
    graphics.circle(8, 0, 2);
    graphics.fill({ color: neonYellow });
    graphics.circle(-8, 0, 2);
    graphics.fill({ color: neonYellow });

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
