import { Graphics, Container } from 'pixi.js';
import { getEnemyConfig, type MovePattern } from '../config/EnemyConfig';

export type EnemyType = 'basic' | 'fast' | 'tank' | 'weaver' | 'spinner' | 'dasher';

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

  constructor(x: number, y: number, type: EnemyType = 'basic', speedMultiplier: number = 1.0, screenWidth: number = 800) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;
    this.initialX = x;
    this.type = type;
    this.screenWidth = screenWidth;

    // Get configuration for this enemy type
    const config = getEnemyConfig(type);

    // Set properties from configuration with difficulty multiplier
    const baseSpeed = config.speed + (Math.random() * config.speedVariation * 2 - config.speedVariation);
    this.speed = baseSpeed * speedMultiplier; // Apply difficulty multiplier
    this.health = config.health;
    this.movePatternType = config.movePattern;

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

  public update(_deltaTime: number): void {
    // Move enemy downward
    this.sprite.y += this.speed;

    // Update movement pattern counter
    this.movePattern += 0.1;

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
        if (this.sprite.x < 30 || this.sprite.x > this.screenWidth - 30) {
          this.direction *= -1; // Reverse direction
          // Clamp to bounds
          this.sprite.x = Math.max(30, Math.min(this.screenWidth - 30, this.sprite.x));
        }
        break;
    }
  }

  public takeDamage(): boolean {
    this.health--;

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

  public destroy(): void {
    this.sprite.destroy();
  }
}
