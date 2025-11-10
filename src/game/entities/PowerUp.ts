import { Graphics, Container, Text } from 'pixi.js';

export type PowerUpType = 'rapidfire' | 'shield' | 'bomb' | 'missiles' | 'superfire' | 'pointmultiplier';

export class PowerUp {
  public sprite: Container;
  public type: PowerUpType;
  private speed: number = 1.5;

  constructor(x: number, y: number, type: PowerUpType) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;
    this.type = type;

    const graphics = new Graphics();

    // Draw power-up based on type
    switch (type) {
      case 'rapidfire':
        // Orange/yellow lightning bolt style
        graphics.rect(-15, -15, 30, 30);
        graphics.fill(0xffa500);
        graphics.star(0, 0, 4, 10, 5);
        graphics.fill(0xffff00);
        break;

      case 'shield':
        // Blue shield
        graphics.circle(0, 0, 15);
        graphics.fill(0x4169e1);
        graphics.circle(0, 0, 10);
        graphics.fill(0x87ceeb);
        break;

      case 'bomb':
        // Red/black bomb
        graphics.circle(0, 0, 15);
        graphics.fill(0xff0000);
        graphics.rect(-3, -20, 6, 10);
        graphics.fill(0x000000);
        break;

      case 'missiles':
        // Orange rocket
        graphics.rect(-5, -15, 10, 20);
        graphics.fill(0xff4500);
        graphics.moveTo(0, -15);
        graphics.lineTo(-5, -15);
        graphics.lineTo(0, -20);
        graphics.lineTo(5, -15);
        graphics.fill(0xff6347);
        break;

      case 'superfire':
        // Purple lightning bolt with glow
        graphics.circle(0, 0, 18);
        graphics.fill({ color: 0x9400d3, alpha: 0.3 }); // Purple glow
        graphics.rect(-15, -15, 30, 30);
        graphics.fill(0x8b00ff);
        graphics.star(0, 0, 6, 12, 6); // More points for super
        graphics.fill(0xff00ff);
        break;

      case 'pointmultiplier':
        // Gold V-shaped chevron with glow
        graphics.circle(0, 0, 18);
        graphics.fill({ color: 0xffd700, alpha: 0.3 }); // Golden glow
        // Draw V shape (chevron pointing down)
        graphics.moveTo(0, 15);
        graphics.lineTo(-12, -10);
        graphics.lineTo(-8, -10);
        graphics.lineTo(0, 8);
        graphics.lineTo(8, -10);
        graphics.lineTo(12, -10);
        graphics.lineTo(0, 15);
        graphics.fill(0xffd700); // Gold color
        // Add inner highlight
        graphics.moveTo(0, 10);
        graphics.lineTo(-6, -5);
        graphics.lineTo(0, 3);
        graphics.lineTo(6, -5);
        graphics.lineTo(0, 10);
        graphics.fill(0xffff00); // Bright yellow highlight
        break;
    }

    // Add label
    const labelText =
      type === 'rapidfire' ? 'RF' :
      type === 'shield' ? 'SH' :
      type === 'bomb' ? 'BM' :
      type === 'missiles' ? 'MS' :
      type === 'superfire' ? 'SF' :
      'x2'; // Point multiplier

    const label = new Text({
      text: labelText,
      style: {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    });
    label.anchor.set(0.5);
    graphics.addChild(label);

    this.sprite.addChild(graphics);
  }

  public update(deltaTime: number): void {
    // Normalize deltaTime to be frame-rate independent (assuming 60 FPS as baseline)
    const normalizedDelta = deltaTime / 16.67; // 16.67ms = 60 FPS

    // Move power-up downward slowly
    this.sprite.y += this.speed * normalizedDelta;
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
