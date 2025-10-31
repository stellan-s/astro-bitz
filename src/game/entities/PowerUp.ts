import { Graphics, Container, Text } from 'pixi.js';

export type PowerUpType = 'rapidfire' | 'shield' | 'bomb';

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
    }

    // Add label
    const label = new Text({
      text: type === 'rapidfire' ? 'RF' : type === 'shield' ? 'SH' : 'BM',
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

  public update(_deltaTime: number): void {
    // Move power-up downward slowly
    this.sprite.y += this.speed;
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
