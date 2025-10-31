import { Graphics, Container } from 'pixi.js';

export class Bullet {
  public sprite: Container;
  private speed: number = 8;
  private travelDistance: number = 0;
  public canCollide: boolean = false; // Bullets need to travel a bit before they can hit

  constructor(x: number, y: number) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;

    // Draw bullet
    const graphics = new Graphics();
    graphics.circle(0, 0, 4);
    graphics.fill(0xffff00);

    this.sprite.addChild(graphics);
  }

  public update(_deltaTime: number): void {
    // Move bullet upward
    this.sprite.y -= this.speed;
    this.travelDistance += this.speed;

    // Enable collision after bullet travels 40 pixels (gets clear of player area)
    if (this.travelDistance > 40) {
      this.canCollide = true;
    }
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
