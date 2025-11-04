import { Graphics, Container, Sprite, Texture } from 'pixi.js';

export class Player {
  public sprite: Container;
  private speed: number = 5;
  private shieldGraphics: Graphics | null = null;
  private shieldAnimationTime: number = 0;
  private jetBeams: Graphics;
  private exhaustFlames: Graphics[] = [];

  constructor(x: number, y: number) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;

    // Create jet beams first (so they appear behind the ship)
    this.jetBeams = new Graphics();
    this.sprite.addChild(this.jetBeams);

    // Create exhaust flames (like enemies)
    this.createExhaustFlames();

    // Try to load custom ship sprite, fall back to procedural graphics
    this.loadShipSprite();
  }

  private loadShipSprite(): void {
    // Check if custom ship sprite exists by trying to load it
    fetch('/player-ship.png', { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          // File exists, load the texture
          const shipTexture = Texture.from('/player-ship.png');
          const shipSprite = new Sprite(shipTexture);
          shipSprite.anchor.set(0.5, 0.5);
          this.sprite.addChild(shipSprite);
          console.log('Custom ship sprite loaded successfully');
        } else {
          // File doesn't exist, use fallback
          console.log('Custom ship sprite not found, using fallback graphics');
          this.drawFallbackShip();
        }
      })
      .catch(() => {
        // Error loading file, use fallback
        console.log('Custom ship sprite not found, using fallback graphics');
        this.drawFallbackShip();
      });
  }

  private drawFallbackShip(): void {
    const graphics = new Graphics();

    // Classic LEGO space colors
    const blue = 0x0055BF;           // LEGO classic blue
    const lightGray = 0xA0A0A0;      // LEGO light gray
    const darkGray = 0x6B6B6B;       // LEGO dark gray
    const neonYellow = 0xFFFF00;     // Bright neon yellow
    const transYellow = 0xFFFF00;    // Trans-neon yellow windscreen
    const red = 0xFF0000;            // LEGO red

    // Main blue body - LEGO blocky delta wing design
    // Large swept delta wings
    graphics.moveTo(0, -28);      // Front nose point
    graphics.lineTo(26, 10);      // Right wing tip
    graphics.lineTo(10, 10);      // Right inner
    graphics.lineTo(10, 2);       // Right step
    graphics.lineTo(-10, 2);      // Left step
    graphics.lineTo(-10, 10);     // Left inner
    graphics.lineTo(-26, 10);     // Left wing tip
    graphics.lineTo(0, -28);      // Close
    graphics.fill({ color: blue });

    // Center fuselage body (raised section)
    graphics.rect(-8, -16, 16, 18);
    graphics.fill({ color: blue });

    // Front nose block
    graphics.rect(-6, -22, 12, 6);
    graphics.fill({ color: blue });

    // Gray structural block on top
    graphics.rect(-5, -18, 10, 5);
    graphics.fill({ color: lightGray });

    // Trans-yellow cockpit - more rectangular and LEGO-like
    graphics.rect(-8, -12, 16, 12);
    graphics.fill({ color: transYellow, alpha: 0.7 });

    // Yellow cockpit frame/border
    graphics.rect(-8, -12, 16, 12);
    graphics.stroke({ color: neonYellow, width: 1.5 });

    // Yellow laser cannons/blasters on wings
    graphics.rect(-18, -2, 4, 10);
    graphics.fill({ color: neonYellow });
    graphics.rect(14, -2, 4, 10);
    graphics.fill({ color: neonYellow });

    // Small yellow detail blocks on wing tips
    graphics.rect(-26, 8, 5, 3);
    graphics.fill({ color: neonYellow });
    graphics.rect(21, 8, 5, 3);
    graphics.fill({ color: neonYellow });

    // Red exhaust/thruster blocks at back
    graphics.rect(-7, 8, 3, 4);
    graphics.fill({ color: red });
    graphics.rect(4, 8, 3, 4);
    graphics.fill({ color: red });

    // Dark gray engine housing blocks
    graphics.rect(-10, 6, 6, 6);
    graphics.fill({ color: darkGray });
    graphics.rect(4, 6, 6, 6);
    graphics.fill({ color: darkGray });

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

  private createExhaustFlames(): void {
    // Create animated exhaust flames for both engines
    const flameCount = 4; // Multiple particles per engine
    const enginePositions = [-5.5, 5.5]; // Match red exhaust positions

    for (const engineX of enginePositions) {
      for (let i = 0; i < flameCount; i++) {
        const flame = new Graphics();

        // Flame size varies
        const baseSize = 3 + Math.random() * 2;
        flame.circle(0, 0, baseSize);

        // Color gradient: more orange/yellow, less red
        const colors = [0xffaa00, 0xff8800, 0xffcc00, 0xffff00];
        const colorIndex = Math.floor(Math.random() * colors.length);
        flame.fill(colors[colorIndex]);

        // Random opacity
        flame.alpha = 0.6 + Math.random() * 0.3;

        // Position flames BEHIND ship (positive Y = downward)
        flame.x = engineX + (Math.random() - 0.5) * 4; // Slight spread
        flame.y = 13 + i * 8; // Behind ship, staggered downward

        this.exhaustFlames.push(flame);
        this.sprite.addChild(flame);
      }
    }
  }

  public updateJetBeams(_deltaTime: number): void {
    // Update exhaust flames (like enemies)
    for (let i = 0; i < this.exhaustFlames.length; i++) {
      const flame = this.exhaustFlames[i];
      const engineIndex = i < 4 ? 0 : 1; // Which engine (left or right)
      const engineX = engineIndex === 0 ? -5.5 : 5.5;

      // Flicker alpha
      const baseAlpha = 0.6;
      flame.alpha = baseAlpha + Math.random() * 0.4;

      // Slight horizontal position variation
      const spread = 5;
      flame.x = engineX + (Math.random() - 0.5) * spread;

      // Scale variation for flickering effect
      const scale = 0.8 + Math.random() * 0.4;
      flame.scale.set(scale);
    }
  }

  public updateShield(deltaTime: number, shieldCount: number = 1): void {
    // Always update jet beams
    this.updateJetBeams(deltaTime);

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
