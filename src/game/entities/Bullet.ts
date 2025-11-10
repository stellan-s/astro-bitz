import { Graphics, Container } from 'pixi.js';

export class Bullet {
  public sprite: Container;
  private speed: number = 8;
  private travelDistance: number = 0;
  public canCollide: boolean = false; // Bullets need to travel a bit before they can hit
  public damage: number = 1; // Damage dealt to enemies

  constructor(x: number, y: number, isSuperFire: boolean = false, isGoldenTracer: boolean = false) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;

    // Draw bullet
    const graphics = new Graphics();

    if (isSuperFire) {
      // Purple superfire bullet - larger and more powerful looking
      this.damage = 3; // 3x damage
      graphics.circle(0, 0, 6); // Slightly larger
      graphics.fill(0x8b00ff); // Purple
      // Add glow effect
      graphics.circle(0, 0, 8);
      graphics.fill({ color: 0xff00ff, alpha: 0.3 }); // Purple glow
    } else if (isGoldenTracer) {
      // Golden tracer bullet for point multiplier
      this.damage = 1;
      graphics.circle(0, 0, 5); // Slightly larger than normal
      graphics.fill(0xffd700); // Gold
      // Add golden glow effect
      graphics.circle(0, 0, 7);
      graphics.fill({ color: 0xffff00, alpha: 0.4 }); // Yellow glow
    } else {
      // Normal yellow bullet
      this.damage = 1;
      graphics.circle(0, 0, 4);
      graphics.fill(0xffff00);
    }

    this.sprite.addChild(graphics);
  }

  public update(deltaTime: number): void {
    // Normalize deltaTime to be frame-rate independent (assuming 60 FPS as baseline)
    const normalizedDelta = deltaTime / 16.67; // 16.67ms = 60 FPS

    // Move bullet upward
    const movement = this.speed * normalizedDelta;
    this.sprite.y -= movement;
    this.travelDistance += movement;

    // Enable collision after bullet travels just 10 pixels (minimal clearance from player)
    if (this.travelDistance > 10) {
      this.canCollide = true;
    }
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
