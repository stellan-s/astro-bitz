import { Graphics, Container } from 'pixi.js';
import { Enemy } from './Enemy';
import { getEnemyConfig } from '../config/EnemyConfig';

export class Missile {
  public sprite: Container;
  private baseSpeed: number = 6;
  private speed: number = 6;
  private target: Enemy | null = null;
  private velocity: { x: number; y: number } = { x: 0, y: -1 }; // Start moving up
  public isActive: boolean = true;
  public damage: number = 1; // Base damage
  public splashRadius: number = 0; // Area-of-effect damage radius
  public splashDamage: number = 0; // Damage dealt in splash area

  // Performance optimizations
  private targetConfig: any = null; // Cache target's config
  private retargetCounter: number = 0; // Only search for new target every N frames
  private readonly RETARGET_INTERVAL = 10; // Frames between retargeting attempts

  constructor(x: number, y: number, waveNumber: number = 1) {
    this.sprite = new Container();
    this.sprite.x = x;
    this.sprite.y = y;

    // Scale missile power with wave progression
    this.applyWaveScaling(waveNumber);

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

  private applyWaveScaling(waveNumber: number): void {
    // Missile power scales with wave number for better late-game effectiveness

    // Speed increase: +10% per wave, capped at 2x base speed
    const speedMultiplier = Math.min(1 + (waveNumber - 1) * 0.1, 2.0);
    this.speed = this.baseSpeed * speedMultiplier;

    // Damage scaling: 1 damage baseline, +1 every 3 waves
    // Wave 1-3: 1 damage, Wave 4-6: 2 damage, Wave 7-9: 3 damage, etc.
    this.damage = 1 + Math.floor((waveNumber - 1) / 3);

    // Splash damage unlocks at wave 5 and scales
    if (waveNumber >= 5) {
      this.splashRadius = 40 + (waveNumber - 5) * 5; // 40px at wave 5, +5px per wave
      this.splashDamage = 1 + Math.floor((waveNumber - 5) / 4); // 1 splash damage at wave 5, increases every 4 waves
    }

    // Better tracking on higher waves (update turn speed)
    // This will be applied during targeting
  }

  public update(deltaTime: number, enemies: Enemy[]): void {
    // Normalize deltaTime to be frame-rate independent (assuming 60 FPS as baseline)
    const normalizedDelta = deltaTime / 16.67; // 16.67ms = 60 FPS

    // Find or update target
    this.updateTarget(enemies);

    // If we have a target, steer towards it
    if (this.target && this.target.sprite && !this.target.sprite.destroyed && this.targetConfig) {
      const dx = this.target.sprite.x - this.sprite.x;
      const dy = this.target.sprite.y - this.sprite.y;
      const distanceSquared = dx * dx + dy * dy; // Use squared distance to avoid sqrt

      if (distanceSquared > 0) {
        // Use fast inverse square root approximation for normalization
        const invDistance = 1 / Math.sqrt(distanceSquared);
        const desiredVelX = dx * invDistance;
        const desiredVelY = dy * invDistance;

        // Use cached config instead of looking it up every frame
        const heat = this.targetConfig.heatEmission;

        // Turn speed scales with heat: 0.0 heat = 0.02 turn, 1.0 heat = 0.15 turn
        // Higher heat = tighter tracking, easier to hit
        const heatScaledTurnSpeed = 0.02 + (heat * 0.13);

        // Gradually turn towards target - better tracking for hotter enemies
        this.velocity.x += (desiredVelX - this.velocity.x) * heatScaledTurnSpeed * normalizedDelta;
        this.velocity.y += (desiredVelY - this.velocity.y) * heatScaledTurnSpeed * normalizedDelta;

        // Normalize velocity using squared magnitude
        const velMagSquared = this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y;
        if (velMagSquared > 0.0001) { // Small epsilon to avoid division by zero
          const invVelMag = 1 / Math.sqrt(velMagSquared);
          this.velocity.x *= invVelMag;
          this.velocity.y *= invVelMag;
        }
      }
    }

    // Move in current direction
    this.sprite.x += this.velocity.x * this.speed * normalizedDelta;
    this.sprite.y += this.velocity.y * this.speed * normalizedDelta;

    // Rotate sprite to face direction of travel
    this.sprite.rotation = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2;
  }

  private updateTarget(enemies: Enemy[]): void {
    // Increment retarget counter
    this.retargetCounter++;

    // If current target is dead, destroyed, or sprite is invalid, find new target immediately
    if (!this.target || !this.target.sprite || this.target.health <= 0 || this.target.sprite.destroyed) {
      this.target = this.findBestTarget(enemies);
      if (this.target) {
        this.targetConfig = getEnemyConfig(this.target.type); // Cache config
      } else {
        this.targetConfig = null;
      }
      this.retargetCounter = 0; // Reset counter after finding new target
    }
    // Optionally retarget periodically to find better targets (throttled)
    else if (this.retargetCounter >= this.RETARGET_INTERVAL) {
      const betterTarget = this.findBestTarget(enemies);
      if (betterTarget && betterTarget !== this.target) {
        this.target = betterTarget;
        this.targetConfig = getEnemyConfig(this.target.type); // Cache new config
      }
      this.retargetCounter = 0;
    }
  }

  private findBestTarget(enemies: Enemy[]): Enemy | null {
    if (enemies.length === 0) return null;

    const MINIMUM_HEAT_THRESHOLD = 0.5; // Missiles only lock onto enemies with heat >= 0.5
    const MAX_SEARCH_DISTANCE_SQ = 800 * 800; // Don't target enemies too far away (screen width squared)

    let bestTarget: Enemy | null = null;
    let bestScore = -1;

    const missileX = this.sprite.x;
    const missileY = this.sprite.y;

    for (const enemy of enemies) {
      // Quick validation checks first
      if (!enemy.sprite || enemy.health <= 0) continue;

      // Calculate distance squared (avoid sqrt until necessary)
      const dx = enemy.sprite.x - missileX;
      const dy = enemy.sprite.y - missileY;
      const distanceSquared = dx * dx + dy * dy;

      // Skip enemies that are too far away
      if (distanceSquared > MAX_SEARCH_DISTANCE_SQ) continue;

      // Get enemy heat emission (cache lookup in loop is unavoidable, but less frequent now)
      const config = getEnemyConfig(enemy.type);
      const heatSignature = config.heatEmission;

      // Skip enemies with insufficient heat signature (stealth enemies)
      if (heatSignature < MINIMUM_HEAT_THRESHOLD) continue;

      // Score based on heat signature and distance (prefer closer, hotter targets)
      // Use squared values to avoid sqrt and pow operations
      // Heat is exponentially weighted - higher heat = much stronger lock
      const heatWeightSquared = heatSignature * heatSignature;

      // Use inverse distance squared for scoring (closer = higher score)
      // Add 1 to avoid division by zero
      const score = heatWeightSquared * 1000000 / (distanceSquared + 1);

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

  public getSplashRadius(): number {
    return this.splashRadius;
  }

  public getSplashDamage(): number {
    return this.splashDamage;
  }

  public getDamage(): number {
    return this.damage;
  }

  public destroy(): void {
    this.isActive = false;
    this.sprite.destroy();
  }
}
