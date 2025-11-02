import { Graphics, Container } from 'pixi.js';

export class EnemyBullet {
  public sprite: Container;
  private speed: number = 4;
  private velocityX: number = 0;
  private velocityY: number = 1;
  public isActive: boolean = true;

  constructor(x: number, y: number, angle?: number) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;

    // If angle is provided, calculate velocity based on angle
    if (angle !== undefined) {
      this.velocityX = Math.sin(angle);
      this.velocityY = Math.cos(angle);
    }

    // Draw enemy bullet - different from player bullet
    const graphics = new Graphics();

    // Red/orange enemy bullet
    graphics.circle(0, 0, 5);
    graphics.fill(0xff4500);

    // Inner glow
    graphics.circle(0, 0, 3);
    graphics.fill(0xffff00);

    this.sprite.addChild(graphics);
  }

  public update(_deltaTime: number): void {
    // Move bullet
    this.sprite.x += this.velocityX * this.speed;
    this.sprite.y += this.velocityY * this.speed;
  }

  public destroy(): void {
    this.isActive = false;
    this.sprite.destroy();
  }
}
