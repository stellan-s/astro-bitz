import { Graphics, Container } from 'pixi.js';

export class Player {
  public sprite: Container;
  private speed: number = 5;
  private shieldGraphics: Graphics | null = null;
  private shieldAnimationTime: number = 0;

  constructor(x: number, y: number) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;

    // Draw player as a retro 80s LEGO spaceship
    const graphics = new Graphics();

    // Classic LEGO space colors
    const blue = 0x0055BF;        // LEGO classic blue
    const darkBlue = 0x003D99;    // Darker blue
    const neonYellow = 0xFFFF00;  // Bright neon yellow
    const trans = 0x00FFFF;       // Trans-neon blue windscreen

    // Main fuselage (blue body)
    graphics.moveTo(0, -35);      // Nose point
    graphics.lineTo(12, -25);     // Right front
    graphics.lineTo(15, -5);      // Right side
    graphics.lineTo(15, 10);      // Right back corner
    graphics.lineTo(8, 15);       // Right back slope
    graphics.lineTo(-8, 15);      // Left back slope
    graphics.lineTo(-15, 10);     // Left back corner
    graphics.lineTo(-15, -5);     // Left side
    graphics.lineTo(-12, -25);    // Left front
    graphics.lineTo(0, -35);      // Back to nose
    graphics.fill({ color: blue });

    // Cockpit windscreen (trans-neon blue)
    graphics.moveTo(0, -28);
    graphics.lineTo(8, -22);
    graphics.lineTo(8, -12);
    graphics.lineTo(-8, -12);
    graphics.lineTo(-8, -22);
    graphics.lineTo(0, -28);
    graphics.fill({ color: trans, alpha: 0.6 });

    // Neon yellow accents on nose
    graphics.rect(-2, -35, 4, 8);
    graphics.fill({ color: neonYellow });

    // Wing stripes (neon yellow)
    // Right wing stripe
    graphics.rect(10, -5, 5, 12);
    graphics.fill({ color: neonYellow });
    // Left wing stripe
    graphics.rect(-15, -5, 5, 12);
    graphics.fill({ color: neonYellow });

    // Engine exhausts (dark blue circles with yellow glow)
    // Right engine
    graphics.circle(10, 12, 4);
    graphics.fill({ color: darkBlue });
    graphics.circle(10, 12, 3);
    graphics.fill({ color: neonYellow, alpha: 0.4 });

    // Left engine
    graphics.circle(-10, 12, 4);
    graphics.fill({ color: darkBlue });
    graphics.circle(-10, 12, 3);
    graphics.fill({ color: neonYellow, alpha: 0.4 });

    // Center engine
    graphics.circle(0, 13, 5);
    graphics.fill({ color: darkBlue });
    graphics.circle(0, 13, 4);
    graphics.fill({ color: neonYellow, alpha: 0.4 });

    // Detail lines (dark blue panel lines)
    graphics.moveTo(-10, -10);
    graphics.lineTo(-10, 8);
    graphics.stroke({ color: darkBlue, width: 1 });

    graphics.moveTo(10, -10);
    graphics.lineTo(10, 8);
    graphics.stroke({ color: darkBlue, width: 1 });

    // Yellow highlights on wings
    graphics.circle(12, 0, 2);
    graphics.fill({ color: neonYellow });
    graphics.circle(-12, 0, 2);
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

  public updateShield(deltaTime: number, shieldCount: number = 1): void {
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
