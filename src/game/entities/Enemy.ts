import { Graphics, Container } from 'pixi.js';

export type EnemyType = 'basic' | 'fast' | 'tank';

export class Enemy {
  public sprite: Container;
  private speed: number;
  public health: number;
  public type: EnemyType;
  private movePattern: number = 0;

  constructor(x: number, y: number, type: EnemyType = 'basic') {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;
    this.type = type;

    // Set properties based on enemy type
    switch (type) {
      case 'basic':
        this.speed = 1.5 + (Math.random() * 0.4 - 0.2); // 1.3 to 1.7
        this.health = 1;
        this.drawBasic();
        break;
      case 'fast':
        this.speed = 3.5 + (Math.random() * 0.6 - 0.3); // 3.2 to 3.8 - fast and challenging!
        this.health = 1;
        this.drawFast();
        break;
      case 'tank':
        this.speed = 0.8 + (Math.random() * 0.2 - 0.1); // 0.7 to 0.9
        this.health = 3;
        this.drawTank();
        break;
    }
  }

  private drawBasic(): void {
    const graphics = new Graphics();

    // Main body - red
    graphics.rect(-20, -15, 40, 30);
    graphics.fill(0xff4444);

    // Eyes/details
    graphics.circle(-8, -5, 3);
    graphics.fill(0x000000);

    graphics.circle(8, -5, 3);
    graphics.fill(0x000000);

    this.sprite.addChild(graphics);
  }

  private drawFast(): void {
    const graphics = new Graphics();

    // Smaller, triangular shape - cyan
    graphics.moveTo(0, -15);
    graphics.lineTo(-15, 15);
    graphics.lineTo(15, 15);
    graphics.lineTo(0, -15);
    graphics.fill(0x00ffff);

    // Speed lines
    graphics.rect(-10, 0, 20, 2);
    graphics.fill(0xffffff);

    this.sprite.addChild(graphics);
  }

  private drawTank(): void {
    const graphics = new Graphics();

    // Larger, armored shape - purple/gray
    graphics.rect(-30, -20, 60, 40);
    graphics.fill(0x8b008b);

    // Armor plates
    graphics.rect(-25, -15, 20, 10);
    graphics.fill(0x696969);

    graphics.rect(5, -15, 20, 10);
    graphics.fill(0x696969);

    graphics.rect(-10, 5, 20, 10);
    graphics.fill(0x696969);

    this.sprite.addChild(graphics);
  }

  public update(_deltaTime: number): void {
    // Move enemy downward
    this.sprite.y += this.speed;

    // Fast enemies have a slight zigzag pattern
    if (this.type === 'fast') {
      this.movePattern += 0.1;
      this.sprite.x += Math.sin(this.movePattern) * 2;
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
