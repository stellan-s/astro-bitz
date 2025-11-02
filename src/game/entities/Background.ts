import { Graphics, Container } from 'pixi.js';

interface Star {
  sprite: Graphics;
  speed: number;
  layer: number; // 0 = far, 1 = mid, 2 = near
}

export class Background {
  private container: Container;
  private stars: Star[] = [];
  private screenWidth: number;
  private screenHeight: number;

  constructor(container: Container, screenWidth: number, screenHeight: number) {
    this.container = container;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.createStars();
  }

  private createStars(): void {
    // Create stars in 3 layers for parallax effect
    const layerConfig = [
      { count: 50, size: 1, alpha: 0.3, speed: 0.1, color: 0x888888 },  // Far stars
      { count: 30, size: 1.5, alpha: 0.5, speed: 0.3, color: 0xaaaaaa }, // Mid stars
      { count: 20, size: 2, alpha: 0.7, speed: 0.5, color: 0xffffff },   // Near stars
    ];

    layerConfig.forEach((config, layer) => {
      for (let i = 0; i < config.count; i++) {
        const star = new Graphics();
        star.circle(0, 0, config.size);
        star.fill(config.color);
        star.alpha = config.alpha;

        // Random starting position
        star.x = Math.random() * this.screenWidth;
        star.y = Math.random() * this.screenHeight;

        this.container.addChildAt(star, 0); // Add to back

        this.stars.push({
          sprite: star,
          speed: config.speed,
          layer: layer
        });
      }
    });
  }

  public update(_deltaTime: number): void {
    // Move stars downward at different speeds for parallax
    for (const star of this.stars) {
      star.sprite.y += star.speed;

      // Wrap around when star goes off bottom
      if (star.sprite.y > this.screenHeight) {
        star.sprite.y = 0;
        star.sprite.x = Math.random() * this.screenWidth;
      }
    }
  }

  public destroy(): void {
    for (const star of this.stars) {
      this.container.removeChild(star.sprite);
      star.sprite.destroy();
    }
    this.stars = [];
  }
}
