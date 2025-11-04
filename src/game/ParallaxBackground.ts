import { Container, Graphics } from 'pixi.js';

interface Star {
  sprite: Graphics;
  speed: number;
}

interface NebulaCloud {
  sprite: Graphics;
  speed: number;
  opacity: number;
}

interface Planet {
  sprite: Graphics;
  speed: number;
  x: number;
  y: number;
}

export class ParallaxBackground {
  private container: Container;
  private screenWidth: number;
  private screenHeight: number;

  // Starfield layers (3 layers at different depths)
  private distantStars: Star[] = [];
  private midStars: Star[] = [];
  private nearStars: Star[] = [];

  // Nebula clouds
  private nebulaClouds: NebulaCloud[] = [];

  // Distant planets
  private planets: Planet[] = [];

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.initDistantStars();
    this.initMidStars();
    this.initNearStars();
    this.initNebulaClouds();
    this.initPlanets();
  }

  // Layer 1: Distant stars (slowest, smallest)
  private initDistantStars(): void {
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
      const star = new Graphics();
      star.circle(0, 0, 0.5);
      star.fill({ color: this.getStarColor(), alpha: Math.random() * 0.3 + 0.3 });

      star.x = Math.random() * this.screenWidth;
      star.y = Math.random() * this.screenHeight;

      this.container.addChild(star);
      this.distantStars.push({
        sprite: star,
        speed: 0.001 // Glacially slow - nearly imperceptible
      });
    }
  }

  // Layer 2: Mid-distance stars (medium speed and size)
  private initMidStars(): void {
    const starCount = 60;
    for (let i = 0; i < starCount; i++) {
      const star = new Graphics();
      star.circle(0, 0, 1);
      star.fill({ color: this.getStarColor(), alpha: Math.random() * 0.4 + 0.4 });

      star.x = Math.random() * this.screenWidth;
      star.y = Math.random() * this.screenHeight;

      this.container.addChild(star);
      this.midStars.push({
        sprite: star,
        speed: 0.003 // Glacially slow
      });
    }
  }

  // Layer 3: Near stars (faster, larger, brighter)
  private initNearStars(): void {
    const starCount = 40;
    for (let i = 0; i < starCount; i++) {
      const star = new Graphics();
      star.circle(0, 0, 1.5);
      star.fill({ color: this.getStarColor(), alpha: Math.random() * 0.3 + 0.6 });

      star.x = Math.random() * this.screenWidth;
      star.y = Math.random() * this.screenHeight;

      this.container.addChild(star);
      this.nearStars.push({
        sprite: star,
        speed: 0.008 // Still very slow
      });
    }
  }

  // Nebula clouds - large, soft, colorful clouds in the background
  private initNebulaClouds(): void {
    const cloudCount = 5;
    const nebulaColors = [
      0x4a0e4e, // Purple
      0x1a1a4e, // Deep blue
      0x0e3d4e, // Cyan
      0x4e1a2e, // Magenta
      0x2e1a4e, // Indigo
    ];

    for (let i = 0; i < cloudCount; i++) {
      const cloud = new Graphics();
      const color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
      const size = Math.random() * 150 + 100;

      // Create organic cloud shape with multiple overlapping circles
      const circleCount = 8;
      for (let j = 0; j < circleCount; j++) {
        const offsetX = (Math.random() - 0.5) * size * 0.6;
        const offsetY = (Math.random() - 0.5) * size * 0.6;
        const radius = size / 2 + Math.random() * size * 0.3;

        cloud.circle(offsetX, offsetY, radius);
      }

      const opacity = Math.random() * 0.08 + 0.05;
      cloud.fill({ color, alpha: opacity });

      cloud.x = Math.random() * this.screenWidth;
      cloud.y = Math.random() * this.screenHeight;

      // Add to container at the back
      this.container.addChildAt(cloud, 0);

      this.nebulaClouds.push({
        sprite: cloud,
        speed: 0.002, // Glacially slow
        opacity
      });
    }
  }

  // Distant planets
  private initPlanets(): void {
    const planetCount = 1; // Just one planet
    const planetData = [
      { color: 0x8b4513, size: 40, hasRing: false }, // Brown
      { color: 0x4169e1, size: 35, hasRing: true },  // Blue with rings
      { color: 0xff6347, size: 30, hasRing: false }, // Red
      { color: 0x9370db, size: 45, hasRing: false }, // Purple
      { color: 0x20b2aa, size: 38, hasRing: false }, // Teal
    ];

    for (let i = 0; i < planetCount; i++) {
      const data = planetData[Math.floor(Math.random() * planetData.length)];
      const planet = new Graphics();

      // Main planet body - very faded and distant
      planet.circle(0, 0, data.size);
      planet.fill({ color: data.color, alpha: 0.25 }); // Very transparent for distant look

      // Add subtle crescent for dimension
      planet.circle(data.size * 0.3, 0, data.size);
      planet.fill({ color: 0x000000, alpha: 0.15 }); // Very subtle

      // Add ring if specified
      if (data.hasRing) {
        planet.ellipse(0, 0, data.size * 1.8, data.size * 0.3);
        planet.stroke({ color: data.color, width: 2, alpha: 0.2 }); // Very faint ring
      }

      const x = Math.random() * this.screenWidth;
      const y = Math.random() * (this.screenHeight * 0.4); // Keep in upper portion

      planet.x = x;
      planet.y = y;

      // Add planets behind nebula but in front of distant stars
      this.container.addChildAt(planet, this.distantStars.length);

      this.planets.push({
        sprite: planet,
        speed: 0.001, // Glacially slow - essentially static
        x,
        y
      });
    }
  }

  // Get random star color (white, blue-white, yellow-white, with subtle green/purple tints)
  private getStarColor(): number {
    const colors = [
      0xffffff, // White
      0xf0f8ff, // Blue-white
      0xfffacd, // Yellow-white
      0xe0ffff, // Cyan-white
      0xe8ffe8, // Subtle green tint
      0xf0e8ff, // Subtle purple tint
      0xd8ffd8, // Light green tint
      0xf8e8ff, // Light purple tint
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Update parallax positions
  public update(deltaTime: number): void {
    // Update distant stars
    for (const star of this.distantStars) {
      star.sprite.y += star.speed * deltaTime;
      if (star.sprite.y > this.screenHeight + 10) {
        star.sprite.y = -10;
        star.sprite.x = Math.random() * this.screenWidth;
      }
    }

    // Update mid stars
    for (const star of this.midStars) {
      star.sprite.y += star.speed * deltaTime;
      if (star.sprite.y > this.screenHeight + 10) {
        star.sprite.y = -10;
        star.sprite.x = Math.random() * this.screenWidth;
      }
    }

    // Update near stars
    for (const star of this.nearStars) {
      star.sprite.y += star.speed * deltaTime;
      if (star.sprite.y > this.screenHeight + 10) {
        star.sprite.y = -10;
        star.sprite.x = Math.random() * this.screenWidth;
      }
    }

    // Update nebula clouds (very slow, subtle pulse)
    for (const cloud of this.nebulaClouds) {
      cloud.sprite.y += cloud.speed * deltaTime;

      // Subtle opacity pulse
      const time = Date.now() * 0.0005;
      cloud.sprite.alpha = cloud.opacity + Math.sin(time) * 0.02;

      if (cloud.sprite.y > this.screenHeight + 200) {
        cloud.sprite.y = -200;
        cloud.sprite.x = Math.random() * this.screenWidth;
      }
    }

    // Update planets (very slow)
    for (const planet of this.planets) {
      planet.sprite.y += planet.speed * deltaTime;

      if (planet.sprite.y > this.screenHeight + 100) {
        planet.sprite.y = -100;
        planet.sprite.x = Math.random() * this.screenWidth;
      }
    }
  }

  // Get the container to add to the game
  public getContainer(): Container {
    return this.container;
  }

  // Cleanup
  public destroy(): void {
    // Clean up all stars
    for (const star of [...this.distantStars, ...this.midStars, ...this.nearStars]) {
      star.sprite.destroy();
    }

    // Clean up nebula clouds
    for (const cloud of this.nebulaClouds) {
      cloud.sprite.destroy();
    }

    // Clean up planets
    for (const planet of this.planets) {
      planet.sprite.destroy();
    }

    this.container.destroy();
  }
}
