import { Graphics, Container } from 'pixi.js';
import { Enemy } from './Enemy';
import { getEnemyConfig } from '../config/EnemyConfig';

export class Missile {
  public sprite: Container;
  private speed: number = 6;
  private target: Enemy | null = null;
  private velocity: { x: number; y: number } = { x: 0, y: -1 }; // Start moving up
  public isActive: boolean = true;

  constructor(x: number, y: number) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;

    // Draw missile - rocket shape
    const graphics = new Graphics();

    // Main body - orange/red gradient
    graphics.rect(-3, -10, 6, 20);
    graphics.fill(0xff4500);

    // Nose cone
    graphics.moveTo(0, -10);
    graphics.lineTo(-3, -10);
    graphics.lineTo(0, -15);
    graphics.lineTo(3, -10);
    graphics.fill(0xff6347);

    // Fins
    graphics.moveTo(-3, 5);
    graphics.lineTo(-8, 10);
    graphics.lineTo(-3, 10);
    graphics.fill(0xff8c00);

    graphics.moveTo(3, 5);
    graphics.lineTo(8, 10);
    graphics.lineTo(3, 10);
    graphics.fill(0xff8c00);

    // Exhaust flame
    graphics.circle(0, 12, 3);
    graphics.fill(0xffff00);

    this.sprite.addChild(graphics);
  }

  public update(_deltaTime: number, enemies: Enemy[]): void {
    // Find or update target
    this.updateTarget(enemies);

    // If we have a target, steer towards it
    if (this.target && this.target.sprite) {
      const dx = this.target.sprite.x - this.sprite.x;
      const dy = this.target.sprite.y - this.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // Desired direction to target
        const desiredVelX = dx / distance;
        const desiredVelY = dy / distance;

        // Get target's heat emission to scale tracking quality
        const config = getEnemyConfig(this.target.type);
        const heat = config.heatEmission;

        // Turn speed scales with heat: 0.0 heat = 0.02 turn, 1.0 heat = 0.15 turn
        // Higher heat = tighter tracking, easier to hit
        const heatScaledTurnSpeed = 0.02 + (heat * 0.13);

        // Gradually turn towards target - better tracking for hotter enemies
        this.velocity.x += (desiredVelX - this.velocity.x) * heatScaledTurnSpeed;
        this.velocity.y += (desiredVelY - this.velocity.y) * heatScaledTurnSpeed;

        // Normalize velocity
        const velMag = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (velMag > 0) {
          this.velocity.x /= velMag;
          this.velocity.y /= velMag;
        }
      }
    }

    // Move in current direction
    this.sprite.x += this.velocity.x * this.speed;
    this.sprite.y += this.velocity.y * this.speed;

    // Rotate sprite to face direction of travel
    this.sprite.rotation = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2;
  }

  private updateTarget(enemies: Enemy[]): void {
    // If current target is dead or destroyed, find new target
    if (!this.target || !this.target.sprite || this.target.health <= 0) {
      this.target = this.findBestTarget(enemies);
    }
  }

  private findBestTarget(enemies: Enemy[]): Enemy | null {
    if (enemies.length === 0) return null;

    const MINIMUM_HEAT_THRESHOLD = 0.5; // Missiles only lock onto enemies with heat >= 0.5
    let bestTarget: Enemy | null = null;
    let bestScore = -1;

    for (const enemy of enemies) {
      if (!enemy.sprite || enemy.health <= 0) continue;

      // Get enemy heat emission
      const config = getEnemyConfig(enemy.type);
      const heatSignature = config.heatEmission;

      // Skip enemies with insufficient heat signature (stealth enemies)
      if (heatSignature < MINIMUM_HEAT_THRESHOLD) {
        continue; // Missile cannot detect this enemy - too cold!
      }

      const dx = enemy.sprite.x - this.sprite.x;
      const dy = enemy.sprite.y - this.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Score based on heat signature and distance (prefer closer, hotter targets)
      // Heat is exponentially weighted - higher heat = much stronger lock
      const heatWeight = Math.pow(heatSignature, 2); // Square it for exponential preference
      const score = heatWeight * 1000 / (distance + 1);

      if (score > bestScore) {
        bestScore = score;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }

  public getTarget(): Enemy | null {
    return this.target;
  }

  public destroy(): void {
    this.isActive = false;
    this.sprite.destroy();
  }
}
