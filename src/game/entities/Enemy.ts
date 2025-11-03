import { Graphics, Container } from 'pixi.js';
import { getEnemyConfig, type MovePattern } from '../config/EnemyConfig';

export type EnemyType = 'basic' | 'fast' | 'tank' | 'weaver' | 'spinner' | 'dasher' | 'stealth' | 'boss' | 'bossSniper' | 'bossTank' | 'bossSwarm';

export class Enemy {
  public sprite: Container;
  private speed: number;
  public health: number;
  public type: EnemyType;
  private movePattern: number = 0;
  private movePatternType: MovePattern;
  private initialX: number;
  private rotationSpeed: number = 0.05;
  private direction: number = 1; // 1 or -1 for diagonal movement
  private screenWidth: number = 800; // Default, will be set properly
  private enemyWidth: number = 40; // Will be set from config
  private exhaustFlames: Graphics[] = []; // Animated exhaust flames for high-heat enemies

  // Boss-specific properties
  public isBoss: boolean = false;
  private maxY: number | undefined; // Maximum Y position for bosses
  private lastShootTime: number = 0;
  public onShoot?: (x: number, y: number, pattern: string, playerX?: number, playerY?: number) => void;

  // Stealth-specific properties
  private isCloaked: boolean = true; // Starts cloaked
  private cloakDuration: number = 4000; // 4 seconds cloaked
  private uncloakDuration: number = 1500; // 1.5 seconds uncloaked
  private lastCloakChange: number = 0;
  private hitRevealTime: number = 0; // Time when hit, reveals briefly
  private hitRevealDuration: number = 300; // 0.3 seconds reveal on hit

  constructor(x: number, y: number, type: EnemyType = 'basic', speedMultiplier: number = 1.0, screenWidth: number = 800) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;
    this.initialX = x;
    this.type = type;
    this.screenWidth = screenWidth;

    // Get configuration for this enemy type
    const config = getEnemyConfig(type);

    // Store enemy width for boundary checking
    this.enemyWidth = config.size.width;

    // Set properties from configuration with difficulty multiplier
    const baseSpeed = config.speed + (Math.random() * config.speedVariation * 2 - config.speedVariation);
    this.speed = baseSpeed * speedMultiplier; // Apply difficulty multiplier
    this.health = config.health;
    this.movePatternType = config.movePattern;

    // Boss-specific settings
    this.isBoss = config.isBoss || false;
    this.maxY = config.maxY;

    // Random direction for diagonal enemies
    this.direction = Math.random() > 0.5 ? 1 : -1;

    // Draw enemy based on type
    switch (type) {
      case 'basic':
        this.drawBasic();
        break;
      case 'fast':
        this.drawFast();
        break;
      case 'tank':
        this.drawTank();
        break;
      case 'weaver':
        this.drawWeaver();
        break;
      case 'spinner':
        this.drawSpinner();
        break;
      case 'dasher':
        this.drawDasher();
        break;
      case 'stealth':
        this.drawStealth();
        this.lastCloakChange = Date.now();
        break;
      case 'boss':
      case 'bossSniper':
      case 'bossTank':
      case 'bossSwarm':
        this.drawBoss();
        break;
    }

    // Add jet exhaust flames based on heat emission (0-1 scale)
    // Even low heat enemies get small flames
    if (config.heatEmission > 0) {
      this.createExhaustFlames();
    }
  }

  private createExhaustFlames(): void {
    // Create animated exhaust flames that flicker
    const config = getEnemyConfig(this.type);
    const heat = config.heatEmission; // 0-1 scale

    // More particles for hotter enemies
    const flameCount = Math.max(2, Math.floor(heat * 5)); // 2-5 particles based on heat

    for (let i = 0; i < flameCount; i++) {
      const flame = new Graphics();

      // Flame size scales with heat (0-1 range becomes 2-6 pixel radius)
      const baseSize = 2 + heat * 4;
      flame.circle(0, 0, baseSize + Math.random() * (heat * 2));

      // Color intensity based on heat: low heat = dim orange, high heat = bright red
      const colors = [0xffaa00, 0xff6600, 0xff0000]; // Orange to red
      const colorIndex = Math.min(Math.floor(i / 2), colors.length - 1);
      flame.fill(colors[colorIndex]);

      // Hotter enemies have more opaque flames
      flame.alpha = 0.5 + heat * 0.4 + Math.random() * 0.2;

      // Position flames BEHIND enemy (negative Y = above enemy, pointing up/back)
      flame.x = (Math.random() - 0.5) * (8 + heat * 4); // Spread scales with heat
      flame.y = -config.size.height / 2 - 5 - i * (6 + heat * 4); // Behind enemy, staggered upward

      this.exhaustFlames.push(flame);
      this.sprite.addChild(flame);
    }
  }

  private drawBasic(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig('basic');

    // Main body
    graphics.rect(-config.size.width / 2, -config.size.height / 2, config.size.width, config.size.height);
    graphics.fill(config.color);

    // Eyes/details
    graphics.circle(-8, -5, 3);
    graphics.fill(config.secondaryColor || 0x000000);

    graphics.circle(8, -5, 3);
    graphics.fill(config.secondaryColor || 0x000000);

    this.sprite.addChild(graphics);
  }

  private drawFast(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig('fast');
    const halfSize = config.size.height / 2;

    // Smaller, triangular shape
    graphics.moveTo(0, -halfSize);
    graphics.lineTo(-halfSize, halfSize);
    graphics.lineTo(halfSize, halfSize);
    graphics.lineTo(0, -halfSize);
    graphics.fill(config.color);

    // Speed lines
    graphics.rect(-10, 0, 20, 2);
    graphics.fill(config.secondaryColor || 0xffffff);

    this.sprite.addChild(graphics);
  }

  private drawTank(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig('tank');

    // Larger, armored shape
    graphics.rect(-config.size.width / 2, -config.size.height / 2, config.size.width, config.size.height);
    graphics.fill(config.color);

    // Armor plates
    graphics.rect(-25, -15, 20, 10);
    graphics.fill(config.secondaryColor || 0x696969);

    graphics.rect(5, -15, 20, 10);
    graphics.fill(config.secondaryColor || 0x696969);

    graphics.rect(-10, 5, 20, 10);
    graphics.fill(config.secondaryColor || 0x696969);

    this.sprite.addChild(graphics);
  }

  private drawWeaver(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig('weaver');
    const size = config.size.width / 2;

    // Diamond/rhombus shape
    graphics.moveTo(0, -size);
    graphics.lineTo(size, 0);
    graphics.lineTo(0, size);
    graphics.lineTo(-size, 0);
    graphics.lineTo(0, -size);
    graphics.fill(config.color);

    // Inner accent lines
    graphics.moveTo(-size * 0.5, 0);
    graphics.lineTo(0, -size * 0.5);
    graphics.lineTo(size * 0.5, 0);
    graphics.lineTo(0, size * 0.5);
    graphics.lineTo(-size * 0.5, 0);
    graphics.fill(config.secondaryColor || 0xffff00);

    this.sprite.addChild(graphics);
  }

  private drawSpinner(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig('spinner');
    const size = config.size.width / 2;

    // Central circle
    graphics.circle(0, 0, size * 0.4);
    graphics.fill(config.color);

    // Three blades/arms rotating around center
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const x1 = Math.cos(angle) * size * 0.3;
      const y1 = Math.sin(angle) * size * 0.3;
      const x2 = Math.cos(angle) * size;
      const y2 = Math.sin(angle) * size;

      graphics.moveTo(x1, y1);
      graphics.lineTo(x2, y2);
      graphics.lineTo(x2 + Math.cos(angle + Math.PI / 2) * 5, y2 + Math.sin(angle + Math.PI / 2) * 5);
      graphics.lineTo(x1, y1);

      // Alternate colors for each blade
      if (i === 0) graphics.fill(config.secondaryColor || 0x00ffff);
      else if (i === 1) graphics.fill(config.tertiaryColor || 0xffff00);
      else graphics.fill(config.color);
    }

    this.sprite.addChild(graphics);
  }

  private drawDasher(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig('dasher');

    // Arrow-like shape pointing down
    graphics.moveTo(0, config.size.height / 2);
    graphics.lineTo(-config.size.width / 2, -config.size.height / 2);
    graphics.lineTo(0, -config.size.height / 4);
    graphics.lineTo(config.size.width / 2, -config.size.height / 2);
    graphics.lineTo(0, config.size.height / 2);
    graphics.fill(config.color);

    // Speed trails
    graphics.rect(-config.size.width / 3, -config.size.height / 3, config.size.width * 0.66, 2);
    graphics.fill(config.secondaryColor || 0xffffff);

    graphics.rect(-config.size.width / 4, 0, config.size.width * 0.5, 2);
    graphics.fill(config.secondaryColor || 0xffffff);

    this.sprite.addChild(graphics);
  }

  private drawStealth(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig('stealth');

    // Sleek diamond/rhombus shape - stealth fighter aesthetic
    const w = config.size.width / 2;
    const h = config.size.height / 2;

    // Main body - angular stealth design
    graphics.moveTo(0, -h);
    graphics.lineTo(w * 0.7, 0);
    graphics.lineTo(0, h);
    graphics.lineTo(-w * 0.7, 0);
    graphics.lineTo(0, -h);
    graphics.fill(config.color); // Will change based on cloak state

    // Wings - angular
    graphics.moveTo(-w * 0.7, 0);
    graphics.lineTo(-w * 1.2, h * 0.3);
    graphics.lineTo(-w * 0.9, h * 0.5);
    graphics.lineTo(-w * 0.7, 0);
    graphics.fill(config.color);

    graphics.moveTo(w * 0.7, 0);
    graphics.lineTo(w * 1.2, h * 0.3);
    graphics.lineTo(w * 0.9, h * 0.5);
    graphics.lineTo(w * 0.7, 0);
    graphics.fill(config.color);

    // Cockpit/core - will glow when uncloaked
    graphics.circle(0, 0, 6);
    graphics.fill(config.secondaryColor);

    // Edge highlights - barely visible when cloaked
    graphics.moveTo(0, -h);
    graphics.lineTo(w * 0.7, 0);
    graphics.lineTo(0, h);
    graphics.lineTo(-w * 0.7, 0);
    graphics.lineTo(0, -h);
    graphics.stroke({ color: config.tertiaryColor, width: 1, alpha: 0.3 });

    this.sprite.addChild(graphics);
  }

  private drawBoss(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig(this.type);

    const w = config.size.width / 2;
    const h = config.size.height / 2;

    switch (this.type) {
      case 'boss':
        // Standard Boss - Hexagonal battleship
        graphics.moveTo(0, -h);
        graphics.lineTo(w * 0.6, -h * 0.5);
        graphics.lineTo(w * 0.6, h * 0.5);
        graphics.lineTo(0, h);
        graphics.lineTo(-w * 0.6, h * 0.5);
        graphics.lineTo(-w * 0.6, -h * 0.5);
        graphics.lineTo(0, -h);
        graphics.fill(config.color);

        // Inner core
        graphics.circle(0, 0, 15);
        graphics.fill(0xffff00);

        // Armor plates
        graphics.rect(-w * 0.5, -h * 0.3, w * 0.2, h * 0.2);
        graphics.fill(config.secondaryColor || 0xff6600);
        graphics.rect(-w * 0.5, h * 0.1, w * 0.2, h * 0.2);
        graphics.fill(config.secondaryColor || 0xff6600);
        graphics.rect(w * 0.3, -h * 0.3, w * 0.2, h * 0.2);
        graphics.fill(config.secondaryColor || 0xff6600);
        graphics.rect(w * 0.3, h * 0.1, w * 0.2, h * 0.2);
        graphics.fill(config.secondaryColor || 0xff6600);

        // Wings
        graphics.moveTo(-w * 0.6, -h * 0.4);
        graphics.lineTo(-w, -h * 0.6);
        graphics.lineTo(-w * 0.8, -h * 0.2);
        graphics.fill(config.tertiaryColor || 0xffaa00);
        graphics.moveTo(w * 0.6, -h * 0.4);
        graphics.lineTo(w, -h * 0.6);
        graphics.lineTo(w * 0.8, -h * 0.2);
        graphics.fill(config.tertiaryColor || 0xffaa00);

        // Weapon ports
        graphics.circle(-w * 0.3, -h * 0.2, 5);
        graphics.fill(0xff0000);
        graphics.circle(w * 0.3, -h * 0.2, 5);
        graphics.fill(0xff0000);
        break;

      case 'bossSniper':
        // Sniper Boss - Diamond sniper craft
        graphics.moveTo(0, -h);
        graphics.lineTo(w * 0.5, 0);
        graphics.lineTo(0, h);
        graphics.lineTo(-w * 0.5, 0);
        graphics.lineTo(0, -h);
        graphics.fill(config.color);

        // Targeting scope
        graphics.circle(0, 0, 20);
        graphics.fill(config.secondaryColor || 0x8a2be2);
        graphics.circle(0, 0, 12);
        graphics.fill(config.color);
        graphics.circle(0, 0, 5);
        graphics.fill(0xffff00);

        // Crosshair
        graphics.rect(-15, -1, 30, 2);
        graphics.fill(0xff00ff);
        graphics.rect(-1, -15, 2, 30);
        graphics.fill(0xff00ff);

        // Sniper barrels
        graphics.rect(-w * 0.3, -h * 0.8, 8, h * 0.4);
        graphics.fill(config.tertiaryColor || 0xff00ff);
        graphics.rect(w * 0.3 - 8, -h * 0.8, 8, h * 0.4);
        graphics.fill(config.tertiaryColor || 0xff00ff);
        break;

      case 'bossTank':
        // Tank Boss - Heavy fortress
        graphics.rect(-w, -h * 0.8, w * 2, h * 1.6);
        graphics.fill(config.color);

        // Heavy armor layers
        graphics.rect(-w * 0.9, -h * 0.6, w * 1.8, h * 0.3);
        graphics.fill(config.secondaryColor || 0x483d8b);
        graphics.rect(-w * 0.9, -h * 0.1, w * 1.8, h * 0.3);
        graphics.fill(config.secondaryColor || 0x483d8b);
        graphics.rect(-w * 0.9, h * 0.4, w * 1.8, h * 0.3);
        graphics.fill(config.secondaryColor || 0x483d8b);

        // Gun turrets
        graphics.circle(-w * 0.6, -h * 0.3, 12);
        graphics.fill(config.tertiaryColor || 0x696969);
        graphics.circle(w * 0.6, -h * 0.3, 12);
        graphics.fill(config.tertiaryColor || 0x696969);
        graphics.circle(-w * 0.6, h * 0.3, 12);
        graphics.fill(config.tertiaryColor || 0x696969);
        graphics.circle(w * 0.6, h * 0.3, 12);
        graphics.fill(config.tertiaryColor || 0x696969);
        graphics.circle(0, 0, 15);
        graphics.fill(config.tertiaryColor || 0x696969);

        // Main cannon barrel
        graphics.rect(-6, -h - 15, 12, 20);
        graphics.fill(0x808080);
        break;

      case 'bossSwarm':
        // Swarm Boss - Organic/alien design
        graphics.circle(0, 0, h * 0.9);
        graphics.fill(config.color);

        // Multiple eyes
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI * 2) / 6;
          const eyeX = Math.cos(angle) * w * 0.4;
          const eyeY = Math.sin(angle) * h * 0.4;
          graphics.circle(eyeX, eyeY, 8);
          graphics.fill(config.secondaryColor || 0x00ffff);
          graphics.circle(eyeX, eyeY, 4);
          graphics.fill(0xffffff);
        }

        // Tentacles/appendages
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8 + Math.PI / 8;
          const x1 = Math.cos(angle) * w * 0.6;
          const y1 = Math.sin(angle) * h * 0.6;
          const x2 = Math.cos(angle) * w * 1.2;
          const y2 = Math.sin(angle) * h * 1.2;
          graphics.moveTo(x1, y1);
          graphics.lineTo(x2, y2);
          graphics.lineTo(x2 + Math.cos(angle + Math.PI / 4) * 10, y2 + Math.sin(angle + Math.PI / 4) * 10);
          graphics.lineTo(x1, y1);
          graphics.fill(config.tertiaryColor || 0x1e90ff);
        }

        // Central core
        graphics.circle(0, 0, h * 0.3);
        graphics.fill(0xffff00);
        break;
    }

    this.sprite.addChild(graphics);
  }

  public update(_deltaTime: number, currentTime?: number, playerX?: number, playerY?: number): void {
    // Move enemy downward, but respect maxY for bosses
    if (this.maxY === undefined || this.sprite.y < this.maxY) {
      this.sprite.y += this.speed;
    } else {
      // Boss has reached its max Y position, stop downward movement
      // Constrain to maxY
      this.sprite.y = Math.min(this.sprite.y, this.maxY);
    }

    // Update movement pattern counter
    this.movePattern += 0.1;

    // Shooting logic for bosses and stealth enemies
    if (currentTime !== undefined && this.onShoot) {
      const config = getEnemyConfig(this.type);
      if (config.shootInterval && currentTime - this.lastShootTime >= config.shootInterval) {
        // Stealth enemies only shoot when uncloaked
        if (this.type === 'stealth' && this.isCloaked && currentTime - this.hitRevealTime > this.hitRevealDuration) {
          // Don't shoot while cloaked
        } else {
          this.onShoot(this.sprite.x, this.sprite.y, config.shootPattern || 'single', playerX, playerY);
          this.lastShootTime = currentTime;
        }
      }
    }

    // Stealth cloaking cycle
    if (this.type === 'stealth' && currentTime !== undefined) {
      const timeSinceLastChange = currentTime - this.lastCloakChange;
      const timeSinceHit = currentTime - this.hitRevealTime;

      // If recently hit, force reveal briefly
      if (timeSinceHit < this.hitRevealDuration) {
        this.updateStealthVisuals(false); // Force visible
      } else {
        // Normal cloak/uncloak cycle
        if (this.isCloaked && timeSinceLastChange >= this.cloakDuration) {
          this.isCloaked = false;
          this.lastCloakChange = currentTime;
          this.updateStealthVisuals(false);
        } else if (!this.isCloaked && timeSinceLastChange >= this.uncloakDuration) {
          this.isCloaked = true;
          this.lastCloakChange = currentTime;
          this.updateStealthVisuals(true);
        }
      }
    }

    // Calculate safe boundaries (half enemy width plus small buffer)
    const minX = this.enemyWidth / 2 + 10;
    const maxX = this.screenWidth - this.enemyWidth / 2 - 10;

    // Apply movement pattern
    switch (this.movePatternType) {
      case 'straight':
        // No additional movement
        break;

      case 'zigzag':
        // Fast zigzag pattern - use absolute positioning to prevent drift
        this.sprite.x = this.initialX + Math.sin(this.movePattern) * 15;
        break;

      case 'sine':
        // Smooth sine wave pattern (weaver)
        this.sprite.x = this.initialX + Math.sin(this.movePattern * 0.8) * 60;
        break;

      case 'circular':
        // Circular pattern (spinner) with rotation
        this.sprite.x = this.initialX + Math.cos(this.movePattern) * 30;
        this.sprite.rotation += this.rotationSpeed;
        break;

      case 'diagonal':
        // Diagonal movement (dasher)
        this.sprite.x += this.direction * this.speed * 0.8;
        // Slight wave to make it more interesting
        this.sprite.x += Math.sin(this.movePattern * 2) * 1;

        // Bounce off edges to stay on screen
        if (this.sprite.x < minX || this.sprite.x > maxX) {
          this.direction *= -1; // Reverse direction
        }
        break;
    }

    // Clamp all enemies to screen bounds (safety check for all movement types)
    this.sprite.x = Math.max(minX, Math.min(maxX, this.sprite.x));

    // Animate exhaust flames
    this.updateExhaustFlames();
  }

  private updateExhaustFlames(): void {
    if (this.exhaustFlames.length === 0) return;

    // Get heat emission to scale animation intensity
    const config = getEnemyConfig(this.type);
    const heat = config.heatEmission;

    // Make flames flicker and pulse
    for (let i = 0; i < this.exhaustFlames.length; i++) {
      const flame = this.exhaustFlames[i];

      // Flicker alpha - more intense flicker for hotter enemies
      const baseAlpha = 0.5 + heat * 0.3;
      flame.alpha = baseAlpha + Math.random() * (0.3 + heat * 0.2);

      // Slight position variation for flame movement effect
      // Hotter enemies have more turbulent flames
      const spread = 8 + heat * 6;
      flame.x = (Math.random() - 0.5) * spread;

      // Scale variation to simulate flickering - bigger variation for hotter engines
      const scaleVariation = 0.3 + heat * 0.3;
      const scale = (1 - scaleVariation / 2) + Math.random() * scaleVariation;
      flame.scale.set(scale);
    }
  }

  public takeDamage(): boolean {
    this.health--;

    // Stealth enemies reveal briefly when hit
    if (this.type === 'stealth') {
      this.hitRevealTime = Date.now();
      this.updateStealthVisuals(false); // Reveal on hit
    }

    // Flash effect when taking damage
    if (this.health > 0) {
      this.sprite.alpha = 0.5;
      setTimeout(() => {
        if (this.sprite) {
          this.sprite.alpha = 1;
        }
      }, 100);
    }

    return this.health <= 0;
  }

  private updateStealthVisuals(cloaked: boolean): void {
    if (this.type !== 'stealth') return;

    const config = getEnemyConfig('stealth');
    const graphics = this.sprite.children[0] as Graphics;

    if (!graphics) return;

    graphics.clear();

    const w = config.size.width / 2;
    const h = config.size.height / 2;

    // Choose color based on cloak state - much more subtle when uncloaked
    const bodyColor = cloaked ? config.color : config.secondaryColor;
    const alpha = cloaked ? 0.15 : 0.35; // Barely visible even when uncloaked

    // Subtle outer glow when uncloaked (blurred effect with multiple circles)
    if (!cloaked) {
      // Multiple layers of very faint glow circles for blur effect
      graphics.circle(0, -10, w * 1.5);
      graphics.fill({ color: config.secondaryColor, alpha: 0.03 });
      graphics.circle(0, -10, w * 1.2);
      graphics.fill({ color: config.secondaryColor, alpha: 0.05 });
      graphics.circle(0, -10, w * 0.9);
      graphics.fill({ color: config.secondaryColor, alpha: 0.08 });
    }

    // Main body
    graphics.moveTo(0, -h);
    graphics.lineTo(w * 0.7, 0);
    graphics.lineTo(0, h);
    graphics.lineTo(-w * 0.7, 0);
    graphics.lineTo(0, -h);
    graphics.fill({ color: bodyColor, alpha: alpha });

    // Wings
    graphics.moveTo(-w * 0.7, 0);
    graphics.lineTo(-w * 1.2, h * 0.3);
    graphics.lineTo(-w * 0.9, h * 0.5);
    graphics.lineTo(-w * 0.7, 0);
    graphics.fill({ color: bodyColor, alpha: alpha });

    graphics.moveTo(w * 0.7, 0);
    graphics.lineTo(w * 1.2, h * 0.3);
    graphics.lineTo(w * 0.9, h * 0.5);
    graphics.lineTo(w * 0.7, 0);
    graphics.fill({ color: bodyColor, alpha: alpha });

    // Cockpit/core - very subtle glow when uncloaked
    if (cloaked) {
      graphics.circle(0, 0, 6);
      graphics.fill({ color: config.color, alpha: 0.2 });
    } else {
      // Subtle blurred glow layers when uncloaked
      graphics.circle(0, 0, 12);
      graphics.fill({ color: config.tertiaryColor, alpha: 0.1 });
      graphics.circle(0, 0, 8);
      graphics.fill({ color: config.tertiaryColor, alpha: 0.15 });
      graphics.circle(0, 0, 5);
      graphics.fill({ color: config.secondaryColor, alpha: 0.4 });
    }

    // Edge highlights - only when uncloaked
    if (!cloaked) {
      const edgeAlpha = 0.25;
      const edgeColor = config.tertiaryColor;
      graphics.moveTo(0, -h);
      graphics.lineTo(w * 0.7, 0);
      graphics.lineTo(0, h);
      graphics.lineTo(-w * 0.7, 0);
      graphics.lineTo(0, -h);
      graphics.stroke({ color: edgeColor, width: 2, alpha: edgeAlpha });
    }
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
