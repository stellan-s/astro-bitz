import { Graphics, Container } from 'pixi.js';
import { getEnemyConfig, type MovePattern } from '../config/EnemyConfig';

export type EnemyType = 'basic' | 'fast' | 'tank' | 'weaver' | 'spinner' | 'dasher' | 'stealth' | 'kamikaze' | 'phantom' | 'boss' | 'bossSniper' | 'bossTank' | 'bossSwarm' | 'bossTriple';

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

  // Kamikaze-specific properties
  private kamikazeTargetRotation: number = 0; // Target rotation for smooth turning
  private kamikazeCurrentRotation: number = 0; // Current rotation
  private kamikazeApproachSide: number = 0; // Which side to approach from (left=-1, right=1)
  private kamikazeTargetX: number = 0; // Fixed target X position (doesn't update)
  private kamikazeTargetY: number = 0; // Fixed target Y position (doesn't update)
  private kamikazeHasLockedTarget: boolean = false; // Whether target has been locked

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
        // Basic enemy rotation moved here (after flames will be added)
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
      case 'kamikaze':
        this.drawKamikaze();
        // Randomly choose which side to approach from (left or right)
        this.kamikazeApproachSide = Math.random() > 0.5 ? 1 : -1;
        // Initialize rotation to point downward (Math.PI = 180 degrees)
        this.sprite.rotation = Math.PI;
        this.kamikazeCurrentRotation = Math.PI;
        this.kamikazeTargetRotation = Math.PI;
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

    // Apply rotation AFTER flames are added for basic enemy
    if (type === 'basic') {
      this.sprite.rotation = Math.PI;
    }
  }

  private createExhaustFlames(): void {
    // Create animated exhaust flames that flicker
    const config = getEnemyConfig(this.type);
    const heat = config.heatEmission; // 0-1 scale

    // More particles for hotter enemies
    const flameCount = Math.max(2, Math.floor(heat * 5)); // 2-5 particles based on heat

    // Check if this enemy type is rotated 180° (basic and kamikaze)
    // For these, the ship graphic points UP but sprite is rotated to point DOWN
    // So in local coordinates, flames should be at POSITIVE Y (bottom of upward-pointing graphic)
    const isRotated = this.type === 'basic' || this.type === 'kamikaze';

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

      // Position flames BEHIND enemy in local coordinates (before rotation is applied)
      flame.x = (Math.random() - 0.5) * (8 + heat * 4); // Spread scales with heat

      // For basic/kamikaze: graphic drawn pointing up, so flames at bottom (positive Y)
      // For others: graphic drawn pointing down, so flames at top (negative Y)
      if (isRotated) {
        // Flames at bottom of upward-pointing graphic (becomes rear after 180° rotation)
        flame.y = config.size.height / 2 + 5 + i * (6 + heat * 4);
      } else {
        // Flames at top of downward-pointing graphic (rear)
        flame.y = -config.size.height / 2 - 5 - i * (6 + heat * 4);
      }

      this.exhaustFlames.push(flame);
      this.sprite.addChild(flame);
    }
  }

  private drawBasic(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig('basic');

    // Main hull - arrow/dart spaceship shape (pointing downward)
    graphics.moveTo(0, -15);   // Front tip (top, but will point down)
    graphics.lineTo(12, 5);    // Right body
    graphics.lineTo(8, 12);    // Right rear
    graphics.lineTo(-8, 12);   // Left rear
    graphics.lineTo(-12, 5);   // Left body
    graphics.lineTo(0, -15);   // Close
    graphics.fill(config.color);

    // Engine exhausts at rear (bottom)
    graphics.rect(-6, 10, 4, 5);  // Left engine
    graphics.fill(config.secondaryColor || 0x000000);

    graphics.rect(2, 10, 4, 5);   // Right engine
    graphics.fill(config.secondaryColor || 0x000000);

    // Cockpit/bridge (near front)
    graphics.circle(0, -5, 4);
    graphics.fill(config.secondaryColor || 0x000000);

    // Small wing tips
    graphics.moveTo(-12, 5);
    graphics.lineTo(-16, 7);
    graphics.lineTo(-12, 10);
    graphics.lineTo(-12, 5);
    graphics.fill(config.color);

    graphics.moveTo(12, 5);
    graphics.lineTo(16, 7);
    graphics.lineTo(12, 10);
    graphics.lineTo(12, 5);
    graphics.fill(config.color);

    this.sprite.addChild(graphics);
  }

  private drawFast(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig('fast');
    const halfSize = config.size.height / 2;

    // Smaller, triangular shape
    graphics.poly([
      0, -halfSize,
      -halfSize, halfSize,
      halfSize, halfSize,
      0, -halfSize
    ]);
    graphics.fill(config.color);

    // Speed lines
    graphics.rect(-10, 0, 20, 2);
    graphics.fill(config.secondaryColor || 0xffffff);

    this.sprite.addChild(graphics);
  }

  private drawTank(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig('tank');

    // Main hull - hexagonal armored body
    graphics.moveTo(0, -20);  // Top point
    graphics.lineTo(25, -10);  // Top right
    graphics.lineTo(25, 10);   // Bottom right
    graphics.lineTo(0, 20);    // Bottom point
    graphics.lineTo(-25, 10);  // Bottom left
    graphics.lineTo(-25, -10); // Top left
    graphics.lineTo(0, -20);   // Close
    graphics.fill(config.color);

    // Armored wings (left and right)
    graphics.rect(-30, -8, 10, 16);  // Left wing
    graphics.fill(config.secondaryColor || 0x696969);

    graphics.rect(20, -8, 10, 16);   // Right wing
    graphics.fill(config.secondaryColor || 0x696969);

    // Cockpit/bridge area
    graphics.circle(0, -5, 8);
    graphics.fill(0x4a0e4e);  // Darker purple for cockpit

    // Armor plating details
    graphics.rect(-15, -3, 10, 6);
    graphics.fill(config.secondaryColor || 0x696969);

    graphics.rect(5, -3, 10, 6);
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

    // Start in cloaked state (almost invisible)
    const alpha = 0.03; // Nearly invisible when cloaked

    // Main body - angular stealth design
    graphics.moveTo(0, -h);
    graphics.lineTo(w * 0.7, 0);
    graphics.lineTo(0, h);
    graphics.lineTo(-w * 0.7, 0);
    graphics.lineTo(0, -h);
    graphics.fill({ color: config.color, alpha: alpha });

    // Wings - angular
    graphics.moveTo(-w * 0.7, 0);
    graphics.lineTo(-w * 1.2, h * 0.3);
    graphics.lineTo(-w * 0.9, h * 0.5);
    graphics.lineTo(-w * 0.7, 0);
    graphics.fill({ color: config.color, alpha: alpha });

    graphics.moveTo(w * 0.7, 0);
    graphics.lineTo(w * 1.2, h * 0.3);
    graphics.lineTo(w * 0.9, h * 0.5);
    graphics.lineTo(w * 0.7, 0);
    graphics.fill({ color: config.color, alpha: alpha });

    // Cockpit/core - barely visible when cloaked
    graphics.circle(0, 0, 6);
    graphics.fill({ color: config.color, alpha: 0.05 });

    // No edge highlights when starting cloaked

    this.sprite.addChild(graphics);
  }

  private drawKamikaze(): void {
    const graphics = new Graphics();
    const config = getEnemyConfig('kamikaze');

    const w = config.size.width / 2;
    const h = config.size.height / 2;

    // Warning symbol inspired design - dangerous and fast
    // Triangle/arrow (drawn pointing up, will rotate 180° to point down)
    graphics.moveTo(0, -h);     // Point at top
    graphics.lineTo(-w, h);     // Bottom left
    graphics.lineTo(w, h);      // Bottom right
    graphics.lineTo(0, -h);     // Close
    graphics.fill(config.color);

    // Inner warning stripes
    graphics.moveTo(0, -h * 0.6);
    graphics.lineTo(-w * 0.6, h * 0.4);
    graphics.lineTo(w * 0.6, h * 0.4);
    graphics.lineTo(0, -h * 0.6);
    graphics.fill(config.secondaryColor);

    // Explosive core (pulsing effect will be added in update)
    graphics.circle(0, 0, 5);
    graphics.fill(0xffff00);

    // Speed fins/wings - aggressive angle (at the rear/bottom when upright)
    graphics.moveTo(-w, h);
    graphics.lineTo(-w * 1.3, h * 0.5);
    graphics.lineTo(-w * 0.8, h * 0.3);
    graphics.lineTo(-w, h);
    graphics.fill(config.color);

    graphics.moveTo(w, h);
    graphics.lineTo(w * 1.3, h * 0.5);
    graphics.lineTo(w * 0.8, h * 0.3);
    graphics.lineTo(w, h);
    graphics.fill(config.color);

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
        // Tank Boss - Heavy armored battleship (scaled up tank design)
        // Main hull - large hexagonal armored body
        graphics.moveTo(0, -h * 0.8);      // Top point
        graphics.lineTo(w * 0.7, -h * 0.4);  // Top right
        graphics.lineTo(w * 0.7, h * 0.4);   // Bottom right
        graphics.lineTo(0, h * 0.8);         // Bottom point
        graphics.lineTo(-w * 0.7, h * 0.4);  // Bottom left
        graphics.lineTo(-w * 0.7, -h * 0.4); // Top left
        graphics.lineTo(0, -h * 0.8);        // Close
        graphics.fill(config.color);

        // Large armored wings
        graphics.rect(-w * 0.85, -h * 0.3, w * 0.25, h * 0.6);  // Left wing
        graphics.fill(config.secondaryColor || 0x483d8b);
        graphics.rect(w * 0.6, -h * 0.3, w * 0.25, h * 0.6);    // Right wing
        graphics.fill(config.secondaryColor || 0x483d8b);

        // Bridge/command center
        graphics.circle(0, -h * 0.2, 18);
        graphics.fill(0x2a0845);  // Very dark purple for bridge

        // Heavy armor plating - multiple sections
        graphics.rect(-w * 0.5, -h * 0.15, w * 0.3, h * 0.25);  // Left armor
        graphics.fill(config.secondaryColor || 0x483d8b);
        graphics.rect(w * 0.2, -h * 0.15, w * 0.3, h * 0.25);   // Right armor
        graphics.fill(config.secondaryColor || 0x483d8b);
        graphics.rect(-w * 0.2, h * 0.2, w * 0.4, h * 0.2);     // Bottom armor
        graphics.fill(config.secondaryColor || 0x483d8b);

        // Gun turrets (gray weapon mounts)
        graphics.circle(-w * 0.5, -h * 0.5, 10);
        graphics.fill(config.tertiaryColor || 0x696969);
        graphics.circle(w * 0.5, -h * 0.5, 10);
        graphics.fill(config.tertiaryColor || 0x696969);
        graphics.circle(-w * 0.4, h * 0.3, 10);
        graphics.fill(config.tertiaryColor || 0x696969);
        graphics.circle(w * 0.4, h * 0.3, 10);
        graphics.fill(config.tertiaryColor || 0x696969);

        // Additional armor detail stripes
        graphics.rect(-w * 0.6, -h * 0.05, w * 0.15, h * 0.1);
        graphics.fill(config.tertiaryColor || 0x696969);
        graphics.rect(w * 0.45, -h * 0.05, w * 0.15, h * 0.1);
        graphics.fill(config.tertiaryColor || 0x696969);
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

      case 'bossTriple':
        // Triple Boss - Three small ships in formation
        // Ship size (each ship is smaller than the main boss)
        const shipW = w * 0.25;
        const shipH = h * 0.4;
        const spacing = w * 0.7;

        // Draw three ships in a V formation
        // Left ship
        this.drawSmallShip(graphics, -spacing, h * 0.3, shipW, shipH, config.color, config.secondaryColor);

        // Center ship (lead ship, slightly forward)
        this.drawSmallShip(graphics, 0, -h * 0.2, shipW * 1.2, shipH * 1.2, config.color, config.tertiaryColor);

        // Right ship
        this.drawSmallShip(graphics, spacing, h * 0.3, shipW, shipH, config.color, config.secondaryColor);

        // Connection lines showing they're linked
        graphics.moveTo(-spacing * 0.5, h * 0.1);
        graphics.lineTo(-spacing * 0.3, -h * 0.1);
        graphics.stroke({ width: 2, color: config.secondaryColor || 0xffa500, alpha: 0.5 });

        graphics.moveTo(spacing * 0.5, h * 0.1);
        graphics.lineTo(spacing * 0.3, -h * 0.1);
        graphics.stroke({ width: 2, color: config.secondaryColor || 0xffa500, alpha: 0.5 });
        break;
    }

    this.sprite.addChild(graphics);
  }

  private drawSmallShip(graphics: Graphics, x: number, y: number, w: number, h: number, mainColor: number, accentColor?: number): void {
    // Small fighter ship design - hull
    graphics.poly([
      x, y - h,
      x + w * 0.5, y,
      x + w * 0.3, y + h,
      x - w * 0.3, y + h,
      x - w * 0.5, y,
      x, y - h
    ]);
    graphics.fill(mainColor);

    // Cockpit
    graphics.circle(x, y - h * 0.3, w * 0.3);
    graphics.fill(accentColor || 0xffa500);

    // Engine glow
    graphics.circle(x, y + h * 0.7, w * 0.2);
    graphics.fill(0xffd700);
  }

  public update(deltaTime: number, currentTime?: number, playerX?: number, playerY?: number): void {
    // Normalize deltaTime to be frame-rate independent (assuming 60 FPS as baseline)
    const normalizedDelta = deltaTime / 16.67; // 16.67ms = 60 FPS

    // Move enemy downward, but respect maxY for bosses
    // Kamikaze enemies handle their own movement (homing toward player)
    if (this.type !== 'kamikaze') {
      if (this.maxY === undefined || this.sprite.y < this.maxY) {
        this.sprite.y += this.speed * normalizedDelta;
      } else {
        // Boss has reached its max Y position, stop downward movement
        // Constrain to maxY
        this.sprite.y = Math.min(this.sprite.y, this.maxY);
      }
    }

    // Update movement pattern counter
    this.movePattern += 0.1 * normalizedDelta;

    // Kamikaze specific behavior - homing toward player with pulsing/shaking
    if (this.type === 'kamikaze' && playerX !== undefined && playerY !== undefined) {
      // Pulse the sprite scale to create warning effect
      const pulseSpeed = 5;
      const pulseAmount = 0.15;
      const scale = 1 + Math.sin(this.movePattern * pulseSpeed) * pulseAmount;
      this.sprite.scale.set(scale, scale);

      // Lock onto target position only once (when close enough to player)
      if (!this.kamikazeHasLockedTarget && this.sprite.y > 50) {
        // Calculate offset target position to approach from the side
        const sideOffset = 150; // How far to the side to aim
        this.kamikazeTargetX = playerX + (this.kamikazeApproachSide * sideOffset);
        // Aim for a point past the player (below them on screen)
        this.kamikazeTargetY = playerY + 200; // Fly past player by 200 pixels
        this.kamikazeHasLockedTarget = true;
      }

      // Continue toward FIXED target position (doesn't update with player movement)
      if (this.kamikazeHasLockedTarget) {
        const dx = this.kamikazeTargetX - this.sprite.x;
        const dy = this.kamikazeTargetY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          // Add random drift to make aim worse (±30% targeting error)
          const aimError = 0.3;
          const randomDriftX = (Math.random() - 0.5) * this.speed * aimError * normalizedDelta;
          const randomDriftY = (Math.random() - 0.5) * this.speed * aimError * normalizedDelta;

          // Move toward fixed target with aggressive speed but imperfect aim
          const moveX = (dx / distance) * this.speed * normalizedDelta + randomDriftX;
          const moveY = (dy / distance) * this.speed * normalizedDelta + randomDriftY;
          this.sprite.x += moveX;
          this.sprite.y += moveY;

          // Calculate target rotation based on movement direction
          // Add Math.PI since the sprite is drawn pointing up and rotated 180° initially
          this.kamikazeTargetRotation = Math.atan2(dx, dy) + Math.PI;

          // Smoothly interpolate rotation (slower turn rate)
          const turnRate = 0.04; // Lower = slower turning
          let rotationDiff = this.kamikazeTargetRotation - this.kamikazeCurrentRotation;

          // Normalize angle difference to -PI to PI range
          while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
          while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

          // Apply smooth turning
          this.kamikazeCurrentRotation += rotationDiff * turnRate * normalizedDelta;

          // Apply rotation to sprite
          this.sprite.rotation = this.kamikazeCurrentRotation;
        }
      }
    }

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
        this.sprite.rotation += this.rotationSpeed * normalizedDelta;
        break;

      case 'diagonal':
        // Diagonal movement (dasher)
        this.sprite.x += this.direction * this.speed * 0.8 * normalizedDelta;
        // Slight wave to make it more interesting
        this.sprite.x += Math.sin(this.movePattern * 2) * normalizedDelta;

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

    // Choose color based on cloak state - almost invisible when cloaked
    const bodyColor = cloaked ? config.color : config.secondaryColor;
    const alpha = cloaked ? 0.03 : 0.35; // Nearly invisible when cloaked, subtle when uncloaked

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
      graphics.fill({ color: config.color, alpha: 0.05 }); // Barely visible cockpit when cloaked
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
