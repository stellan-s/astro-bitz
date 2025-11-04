import { Graphics, Container } from 'pixi.js';

export class Particle {
  public sprite: Container;
  private velocityX: number;
  private velocityY: number;
  private lifetime: number;
  private maxLifetime: number;
  private size: number;
  private slowMo: boolean;

  constructor(x: number, y: number, color: number = 0xffa500, slowMo: boolean = false) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;
    this.slowMo = slowMo;

    // Random velocity for explosion effect
    const angle = Math.random() * Math.PI * 2;
    const baseSpeed = Math.random() * 3 + 1;
    // Slow motion: reduce speed by 60% and increase lifetime significantly
    const speed = slowMo ? baseSpeed * 0.4 : baseSpeed;
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;

    this.lifetime = 0;
    // Slow motion: 3x longer lifetime (90-150 frames instead of 30-50)
    this.maxLifetime = slowMo
      ? 90 + Math.random() * 60
      : 30 + Math.random() * 20;
    this.size = Math.random() * 3 + 2; // 2-5 pixels

    const graphics = new Graphics();
    graphics.circle(0, 0, this.size);
    graphics.fill(color);

    this.sprite.addChild(graphics);
  }

  public update(_deltaTime: number): boolean {
    this.lifetime++;

    // Move particle (already slowed by constructor)
    this.sprite.x += this.velocityX;
    this.sprite.y += this.velocityY;

    // Apply gravity (reduced for slow motion)
    const gravity = this.slowMo ? 0.03 : 0.1;
    this.velocityY += gravity;

    // Fade out
    const lifetimeRatio = this.lifetime / this.maxLifetime;
    this.sprite.alpha = 1 - lifetimeRatio;

    // Return true if particle should be removed
    return this.lifetime >= this.maxLifetime;
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}

export class ParticleSystem {
  public particles: Particle[] = [];
  private container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  public createExplosion(x: number, y: number, color: number = 0xffa500, count: number = 15, slowMo: boolean = false): void {
    for (let i = 0; i < count; i++) {
      const particle = new Particle(x, y, color, slowMo);
      this.particles.push(particle);
      this.container.addChild(particle.sprite);
    }
  }

  public update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      const shouldRemove = particle.update(deltaTime);

      if (shouldRemove) {
        this.container.removeChild(particle.sprite);
        particle.destroy();
        this.particles.splice(i, 1);
      }
    }
  }
}
