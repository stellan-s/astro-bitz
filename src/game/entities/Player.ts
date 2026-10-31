import { Graphics, Container, Sprite, Assets } from 'pixi.js';

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

  private async loadShipSprite(): Promise<void> {
    try {
      // Load the texture using Pixi.js v8 Assets API
      const shipTexture = await Assets.load('/astrobitz-player-pixel-v2.png');
      shipTexture.source.scaleMode = 'nearest';
      const shipSprite = new Sprite(shipTexture);

      shipSprite.anchor.set(0.5, 0.5);
      // Preserve the wide delta-wing silhouette while keeping the collision footprint familiar.
      shipSprite.width = 72;
      shipSprite.height = 69;

      // Add to container
      this.sprite.addChild(shipSprite);

      console.log('Custom ship sprite loaded successfully:', {
        width: shipSprite.width,
        height: shipSprite.height,
        visible: shipSprite.visible,
        alpha: shipSprite.alpha,
        children: this.sprite.children.length
      });
    } catch (error) {
      // Image failed to load, use fallback
      console.log('Custom ship sprite not found, using fallback graphics:', error);
      this.drawFallbackShip();
    }
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
    // One centered plume matches the single rear engine on the landing-page craft.
    const flameCount = 5;
    const colors = [0xfff06a, 0xffc12d, 0xff8a24, 0xff5b1f, 0xd43b22];

    for (let i = 0; i < flameCount; i++) {
      const flame = new Graphics();
      const baseSize = 4.8 - i * 0.45;
      flame.circle(0, 0, baseSize);
      flame.fill(colors[i]);
      flame.alpha = 0.72 + Math.random() * 0.2;
      flame.x = (Math.random() - 0.5) * 1.8;
      flame.y = 31 + i * 5;

      this.exhaustFlames.push(flame);
      this.sprite.addChild(flame);
    }
  }

  public updateJetBeams(_deltaTime: number): void {
    // Update exhaust flames (like enemies)
    for (let i = 0; i < this.exhaustFlames.length; i++) {
      const flame = this.exhaustFlames[i];

      // Flicker alpha
      const baseAlpha = 0.68;
      flame.alpha = baseAlpha + Math.random() * 0.28;

      // Keep all particles within one narrow central plume.
      flame.x = (Math.random() - 0.5) * 2.2;

      // Scale variation for flickering effect
      const scale = 0.88 + Math.random() * 0.24;
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
