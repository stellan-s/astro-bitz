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

    // Draw player as a tank-like shape
    const graphics = new Graphics();

    // Base of tank
    graphics.rect(-25, -10, 50, 20);
    graphics.fill(0x4a90e2);

    // Turret
    graphics.rect(-15, -20, 30, 15);
    graphics.fill(0x357abd);

    // Cannon
    graphics.rect(-3, -35, 6, 20);
    graphics.fill(0x2c5f8d);

    this.sprite.addChild(graphics);
  }

  public moveLeft(): void {
    this.sprite.x -= this.speed;
  }

  public moveRight(): void {
    this.sprite.x += this.speed;
  }

  public showShield(): void {
    if (this.shieldGraphics) return; // Already showing

    this.shieldGraphics = new Graphics();
    this.sprite.addChild(this.shieldGraphics);
    this.shieldAnimationTime = 0;
  }

  public hideShield(): void {
    if (this.shieldGraphics) {
      this.sprite.removeChild(this.shieldGraphics);
      this.shieldGraphics.destroy();
      this.shieldGraphics = null;
    }
  }

  public updateShield(deltaTime: number): void {
    if (!this.shieldGraphics) return;

    this.shieldAnimationTime += deltaTime * 0.003; // Slow animation

    // Clear and redraw the shield with animation
    this.shieldGraphics.clear();

    // Hexagonal shield with pulsing effect
    const radius = 45 + Math.sin(this.shieldAnimationTime) * 3;
    const alpha = 0.6 + Math.sin(this.shieldAnimationTime * 2) * 0.2;

    // Outer glow
    this.shieldGraphics.circle(0, -10, radius + 5);
    this.shieldGraphics.fill({ color: 0x00ffff, alpha: alpha * 0.2 });

    // Main shield hexagon
    const sides = 6;
    this.shieldGraphics.moveTo(
      Math.cos(this.shieldAnimationTime) * radius,
      Math.sin(this.shieldAnimationTime) * radius - 10
    );

    for (let i = 1; i <= sides; i++) {
      const angle = (i * Math.PI * 2) / sides + this.shieldAnimationTime;
      this.shieldGraphics.lineTo(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius - 10
      );
    }

    this.shieldGraphics.stroke({ color: 0x00ffff, width: 3, alpha: alpha });
    this.shieldGraphics.fill({ color: 0x00ffff, alpha: alpha * 0.15 });

    // Inner energy ring
    this.shieldGraphics.circle(0, -10, radius * 0.7);
    this.shieldGraphics.stroke({ color: 0xffffff, width: 2, alpha: alpha * 0.6 });
  }
}
