import { Application, Container, Text } from 'pixi.js';
import { Player } from './entities/Player';
import { Enemy } from './entities/Enemy';
import { Bullet } from './entities/Bullet';
import { Missile } from './entities/Missile';
import { PowerUp, type PowerUpType } from './entities/PowerUp';
import { ParticleSystem } from './entities/Particle';
import { AudioManager } from './AudioManager';
import { HighScoreManager } from './HighScoreManager';
import { selectRandomEnemyType, getEnemyConfig, selectRandomBossType } from './config/EnemyConfig';
import { EnemyBullet } from './entities/EnemyBullet';
import { Background } from './entities/Background';

export class Game {
  private app: Application;
  private gameContainer: Container;
  private background: Background;
  private player: Player;
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private missiles: Missile[] = [];
  private enemyBullets: EnemyBullet[] = [];
  private powerUps: PowerUp[] = [];
  private particleSystem: ParticleSystem;
  private score: number = 0;
  private highScore: number = 0;
  private scoreText: Text;
  private highScoreText: Text;
  private waveText: Text;
  private spawnTimer: number = 0;
  private spawnInterval: number = 1500; // Start at 1.5 seconds
  private powerUpTimer: number = 0;
  private powerUpInterval: number = 8000; // Power-ups more frequent (8 seconds)
  private audio: AudioManager;
  private musicEnabled: boolean = true;
  private musicText: Text;
  private rapidFireActive: boolean = false;
  private rapidFireTimer: number = 0;
  private shieldActive: boolean = false;
  private fireRate: number = 300; // milliseconds between shots
  private lastShotTime: number = 0;

  // Missile system
  private missileAmmo: number = 3; // Start with 3 missiles
  private missileText: Text | null = null;
  private lastMissileTime: number = 0;
  private missileFireRate: number = 500; // milliseconds between missile shots

  // Wave system
  private currentWave: number = 1;
  private enemiesKilledThisWave: number = 0;
  private enemiesPerWave: number = 15; // Start with more enemies
  private isWaveTransition: boolean = false;
  private waveTransitionTimer: number = 0;
  private waveTransitionDuration: number = 2000; // Shorter transition (2 seconds)
  private waveTransitionText: Text | null = null;
  private isTransitioningToBoss: boolean = false; // Track if current transition is for boss wave
  private isBossWave: boolean = false;
  private bossSpawned: boolean = false;

  // Difficulty scaling
  private minSpawnInterval: number = 300; // Much more aggressive minimum
  private difficultyMultiplier: number = 1.0; // Increases enemy speed over time

  // Mobile instructions
  private mobileInstructionsShown: boolean = false;
  private autoFireEnabled: boolean = false;

  // Game state
  private gameState: 'start' | 'playing' | 'gameover' = 'start';
  private startScreenContainer: HTMLDivElement | null = null;

  constructor(app: Application) {
    this.app = app;
    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);
    this.audio = new AudioManager();

    // Create starry background
    this.background = new Background(this.gameContainer, this.app.screen.width, this.app.screen.height);

    this.particleSystem = new ParticleSystem(this.gameContainer);

    // Create player
    this.player = new Player(
      this.app.screen.width / 2,
      this.app.screen.height - 100
    );
    this.gameContainer.addChild(this.player.sprite);

    // Load high score
    this.highScore = HighScoreManager.getHighScore();

    // Create score text
    this.scoreText = new Text({
      text: 'Score: 0',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 28,
        fontWeight: '900',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 4 },
        dropShadow: {
          color: 0x00ffff,
          blur: 4,
          distance: 2,
        },
      },
    });
    this.scoreText.x = 10;
    this.scoreText.y = 10;
    this.app.stage.addChild(this.scoreText);

    // Create high score text
    this.highScoreText = new Text({
      text: `Best: ${this.highScore}`,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 22,
        fontWeight: '700',
        fill: 0xffd700,
        stroke: { color: 0x000000, width: 3 },
        dropShadow: {
          color: 0xffaa00,
          blur: 4,
          distance: 2,
        },
      },
    });
    this.highScoreText.x = 10;
    this.highScoreText.y = 45;
    this.app.stage.addChild(this.highScoreText);

    // Create wave text
    this.waveText = new Text({
      text: 'Wave: 1',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 24,
        fontWeight: '700',
        fill: 0x00ffff,
        stroke: { color: 0x000000, width: 3 },
        dropShadow: {
          color: 0x0088ff,
          blur: 4,
          distance: 2,
        },
      },
    });
    this.waveText.x = this.app.screen.width - 140;
    this.waveText.y = 10;
    this.app.stage.addChild(this.waveText);

    // Create music toggle text
    this.musicText = new Text({
      text: 'Music: ON (Press M)',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 14,
        fill: 0xaaaaaa,
        stroke: { color: 0x000000, width: 2 },
      },
    });
    this.musicText.x = 10;
    this.musicText.y = 80;
    this.app.stage.addChild(this.musicText);

    // Create missile counter text
    this.missileText = new Text({
      text: `Missiles: ${this.missileAmmo}`,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 20,
        fontWeight: '700',
        fill: 0xff4500,
        stroke: { color: 0x000000, width: 3 },
        dropShadow: {
          color: 0xff6347,
          blur: 4,
          distance: 2,
        },
      },
    });
    this.missileText.x = this.app.screen.width - 160;
    this.missileText.y = 45;
    this.app.stage.addChild(this.missileText);

    // Setup input
    this.setupInput();

    // Enable auto-fire for mobile devices
    if (this.isMobileDevice()) {
      this.autoFireEnabled = true;
    }

    // Show start screen instead of starting immediately
    this.showStartScreen();
  }

  private showStartScreen(): void {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'Orbitron', sans-serif;
      color: #00ffff;
      text-align: center;
      padding: 20px;
      box-sizing: border-box;
    `;

    container.innerHTML = `
      <div style="max-width: 600px;">
        <h1 style="font-size: 64px; margin-bottom: 20px;
                   background: linear-gradient(45deg, #00ffff, #ff00ff);
                   -webkit-background-clip: text;
                   -webkit-text-fill-color: transparent;
                   background-clip: text;
                   text-shadow: 0 0 30px rgba(0, 255, 255, 0.5);">
          ASTRO BLITZ
        </h1>
        <p style="font-size: 24px; color: #ffaa00; margin-bottom: 40px;">
          Survive the cosmic onslaught
        </p>
        <div style="font-size: 18px; color: #ffffff; margin-bottom: 40px; line-height: 1.8;">
          <p style="margin-bottom: 15px;">⬅️ ➡️ or A/D - Move</p>
          <p style="margin-bottom: 15px;">SPACE - Fire Bullets</p>
          <p style="margin-bottom: 15px;">X - Launch Missile</p>
          <p style="margin-bottom: 15px; color: #00ffff;">📱 Touch: Drag to steer, swipe up for missiles</p>
        </div>
        <div style="font-size: 28px; color: #ff4500; font-weight: bold;
                    animation: pulse 2s infinite; cursor: pointer;">
          ${this.isMobileDevice() ? 'TAP TO START' : 'CLICK TO START'}
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      </style>
    `;

    const startGame = () => {
      if (this.startScreenContainer) {
        document.body.removeChild(this.startScreenContainer);
        this.startScreenContainer = null;
      }
      this.gameState = 'playing';
      this.audio.resume();
      if (this.musicEnabled) {
        this.audio.startBackgroundMusic();
      }
    };

    container.addEventListener('click', startGame);
    container.addEventListener('touchstart', startGame);

    this.startScreenContainer = container;
    document.body.appendChild(container);
  }

  private setupInput(): void {
    const keys: { [key: string]: boolean } = {};
    let musicStarted = false;
    let touchMoving = false;
    let mouseX: number | null = null;

    // Mouse controls (desktop only - for X-axis movement)
    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.addEventListener('mousemove', (e) => {
      if (this.gameState === 'playing') {
        const rect = canvas.getBoundingClientRect();
        const scaleX = this.app.screen.width / rect.width;
        mouseX = (e.clientX - rect.left) * scaleX;
      }
    });

    canvas.addEventListener('mouseleave', () => {
      mouseX = null;
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      keys[e.key] = true;

      // Resume audio context and start music on first interaction
      this.audio.resume();
      if (!musicStarted && this.musicEnabled) {
        this.audio.startBackgroundMusic();
        musicStarted = true;
      }

      // Toggle music with M key
      if (e.key === 'm' || e.key === 'M') {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
          this.audio.startBackgroundMusic();
          this.musicText.text = 'Music: ON (Press M)';
          musicStarted = true;
        } else {
          this.audio.stopBackgroundMusic();
          this.musicText.text = 'Music: OFF (Press M)';
        }
      }

      // Shoot on spacebar (with fire rate limiting)
      if (e.key === ' ' && this.gameState === 'playing') {
        const currentTime = Date.now();
        const currentFireRate = this.rapidFireActive ? 100 : this.fireRate;
        if (currentTime - this.lastShotTime >= currentFireRate) {
          this.shoot();
          this.lastShotTime = currentTime;
        }
      }

      // Fire missile on X key
      if ((e.key === 'x' || e.key === 'X') && this.gameState === 'playing') {
        const currentTime = Date.now();
        if (currentTime - this.lastMissileTime >= this.missileFireRate) {
          this.fireMissile();
          this.lastMissileTime = currentTime;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key] = false;
    });

    // Touch controls for mobile
    let lastTouchY = 0;

    // Show mobile instructions on first load
    if (this.isMobileDevice() && !this.mobileInstructionsShown) {
      this.showMobileInstructions();
      this.mobileInstructionsShown = true;
    }

    // Touch move (drag to move player)
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchMoving = true;

      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        lastTouchY = touch.clientY - rect.top; // Get Y relative to canvas
      }

      // Resume audio on first touch
      this.audio.resume();
      if (!musicStarted && this.musicEnabled) {
        this.audio.startBackgroundMusic();
        musicStarted = true;
      }

      // Hide mobile instructions on first touch
      this.hideMobileInstructions();
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.gameState === 'playing' && touchMoving && e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top; // Get Y relative to canvas
        const scaleX = this.app.screen.width / rect.width;
        this.player.sprite.x = x * scaleX;

        // Keep player in bounds
        if (this.player.sprite.x < this.player.sprite.width / 2) {
          this.player.sprite.x = this.player.sprite.width / 2;
        }
        if (this.player.sprite.x > this.app.screen.width - this.player.sprite.width / 2) {
          this.player.sprite.x = this.app.screen.width - this.player.sprite.width / 2;
        }

        // Detect swipe up gesture for missile firing
        if (lastTouchY > 0) {
          const swipeDistance = lastTouchY - y; // Positive means upward swipe
          const swipeThreshold = 50; // Increased from 30 to 50 pixels - harder to trigger accidentally

          // Fire missile if swiped up past threshold
          if (swipeDistance > swipeThreshold) {
            const currentTime = Date.now();
            if (currentTime - this.lastMissileTime >= this.missileFireRate) {
              this.fireMissile();
              this.lastMissileTime = currentTime;
            }
            // Always reset lastTouchY after detecting swipe to allow continuous swipes
            lastTouchY = y;
          } else if (swipeDistance < -10) {
            // Reset if user swipes down (allows recovery from accidental movements)
            lastTouchY = y;
          }
          // Only update lastTouchY for small movements to maintain swipe detection
          else if (Math.abs(swipeDistance) < 5) {
            lastTouchY = y;
          }
        } else {
          lastTouchY = y;
        }
      }
    });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      touchMoving = false;
      lastTouchY = 0;
    });

    // Update player position based on mouse or keys
    this.app.ticker.add(() => {
      if (this.gameState === 'playing' && !touchMoving) {
        // Mouse movement takes priority (desktop)
        if (mouseX !== null) {
          // Smoothly move towards mouse position
          const targetX = mouseX;
          const smoothing = 0.3; // How quickly to follow mouse (0-1, higher = faster)
          this.player.sprite.x += (targetX - this.player.sprite.x) * smoothing;
        } else {
          // Keyboard movement (fallback)
          if (keys['ArrowLeft'] || keys['a']) {
            this.player.moveLeft();
          }
          if (keys['ArrowRight'] || keys['d']) {
            this.player.moveRight();
          }
        }

        // Keep player in bounds
        if (this.player.sprite.x < this.player.sprite.width / 2) {
          this.player.sprite.x = this.player.sprite.width / 2;
        }
        if (this.player.sprite.x > this.app.screen.width - this.player.sprite.width / 2) {
          this.player.sprite.x = this.app.screen.width - this.player.sprite.width / 2;
        }
      }
    });
  }

  private shoot(): void {
    const bullet = new Bullet(this.player.sprite.x, this.player.sprite.y - 30);
    this.bullets.push(bullet);
    this.gameContainer.addChild(bullet.sprite);
    this.audio.playShoot();
  }

  private fireMissile(): void {
    if (this.missileAmmo <= 0) {
      // No ammo - play empty sound or feedback
      return;
    }

    this.missileAmmo--;
    if (this.missileText) {
      this.missileText.text = `Missiles: ${this.missileAmmo}`;
    }

    const missile = new Missile(this.player.sprite.x, this.player.sprite.y - 30);
    this.missiles.push(missile);
    this.gameContainer.addChild(missile.sprite);
    this.audio.playMissileLaunch();
  }

  private spawnEnemyBullets(x: number, y: number, pattern: string, playerX?: number, playerY?: number): void {
    switch (pattern) {
      case 'single':
        // Single bullet aimed at player
        const singleBullet = new EnemyBullet(x, y);
        this.enemyBullets.push(singleBullet);
        this.gameContainer.addChild(singleBullet.sprite);
        break;

      case 'triple':
        // Three bullets in a spread
        for (let i = -1; i <= 1; i++) {
          const angle = i * 0.3; // ±0.3 radians spread
          const bullet = new EnemyBullet(x, y, angle);
          this.enemyBullets.push(bullet);
          this.gameContainer.addChild(bullet.sprite);
        }
        break;

      case 'spread':
        // Five bullets in a wide spread
        for (let i = -2; i <= 2; i++) {
          const angle = i * 0.4; // ±0.8 radians spread
          const bullet = new EnemyBullet(x, y, angle);
          this.enemyBullets.push(bullet);
          this.gameContainer.addChild(bullet.sprite);
        }
        break;

      case 'aimed':
        // Precisely aimed at player position
        if (playerX !== undefined && playerY !== undefined) {
          const dx = playerX - x;
          const dy = playerY - y;
          const angle = Math.atan2(dx, dy);
          const bullet = new EnemyBullet(x, y, angle);
          this.enemyBullets.push(bullet);
          this.gameContainer.addChild(bullet.sprite);
        }
        break;
    }
  }

  private updateEnemyBullets(deltaTime: number): void {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.update(deltaTime);

      // Remove bullets that are off screen
      if (bullet.sprite.y > this.app.screen.height + 10 ||
          bullet.sprite.y < -10 ||
          bullet.sprite.x < -10 ||
          bullet.sprite.x > this.app.screen.width + 10) {
        this.gameContainer.removeChild(bullet.sprite);
        this.enemyBullets.splice(i, 1);
        bullet.destroy();
      }
    }
  }

  private checkEnemyBulletCollisions(): void {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];

      // Check collision with player
      const dx = bullet.sprite.x - this.player.sprite.x;
      const dy = bullet.sprite.y - this.player.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 25) {
        // Player hit!
        this.gameContainer.removeChild(bullet.sprite);
        this.enemyBullets.splice(i, 1);
        bullet.destroy();

        if (this.shieldActive) {
          // Shield absorbs hit
          this.shieldActive = false;
          this.player.hideShield();
        } else {
          // Game over
          this.gameOver();
          return;
        }
      }
    }
  }

  private spawnEnemy(): void {
    // On boss waves, spawn boss at the start and nothing else
    if (this.isBossWave) {
      if (this.bossSpawned) {
        return; // Boss already spawned, don't spawn anything else
      }

      // Spawn boss in the center of the screen
      const x = this.app.screen.width / 2;
      const boss = new Enemy(x, -100, 'boss', this.difficultyMultiplier, this.app.screen.width);
      this.enemies.push(boss);
      this.gameContainer.addChild(boss.sprite);
      this.bossSpawned = true;
      return;
    }

    // Normal enemy spawning for regular waves
    // Select random enemy type based on current wave (harder enemies more common in later waves)
    const type = selectRandomEnemyType(this.currentWave);

    // Get enemy configuration to determine safe spawn area
    const config = getEnemyConfig(type);

    // Calculate edge padding based on enemy size and movement pattern
    let edgePadding = config.size.width / 2; // Base padding is half the enemy width

    // Add extra padding based on movement pattern
    switch (config.movePattern) {
      case 'sine':
        edgePadding += 60; // Weaver moves ±60px
        break;
      case 'circular':
        edgePadding += 30; // Spinner moves ±30px
        break;
      case 'zigzag':
        edgePadding += 15; // Fast enemy zigzags ±15px
        break;
      case 'diagonal':
        edgePadding += 80; // Dasher moves diagonally, needs much more room
        break;
      case 'straight':
        edgePadding += 10; // Just a small buffer
        break;
    }

    // Ensure padding doesn't exceed screen bounds
    const maxPadding = this.app.screen.width / 3;
    edgePadding = Math.min(edgePadding, maxPadding);

    // Calculate safe spawn position
    const x = edgePadding + Math.random() * (this.app.screen.width - edgePadding * 2);

    // Create enemy with current difficulty multiplier and screen width for boundaries
    const enemy = new Enemy(x, -50, type, this.difficultyMultiplier, this.app.screen.width);
    this.enemies.push(enemy);
    this.gameContainer.addChild(enemy.sprite);
  }

  private spawnPowerUp(): void {
    // Keep power-ups away from edges too
    const edgePadding = 40;
    const x = edgePadding + Math.random() * (this.app.screen.width - edgePadding * 2);

    // Random power-up type
    const types: PowerUpType[] = ['rapidfire', 'shield', 'bomb', 'missiles'];
    const type = types[Math.floor(Math.random() * types.length)];

    const powerUp = new PowerUp(x, -50, type);
    this.powerUps.push(powerUp);
    this.gameContainer.addChild(powerUp.sprite);
  }

  private updateBullets(deltaTime: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(deltaTime);

      // Remove bullets that are off screen
      if (bullet.sprite.y < -10) {
        this.gameContainer.removeChild(bullet.sprite);
        this.bullets.splice(i, 1);
        bullet.destroy();
      }
    }
  }

  private updateMissiles(deltaTime: number): void {
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const missile = this.missiles[i];
      missile.update(deltaTime, this.enemies);

      // Remove missiles that are off screen or inactive
      if (missile.sprite.x < -50 || missile.sprite.x > this.app.screen.width + 50 ||
          missile.sprite.y < -50 || missile.sprite.y > this.app.screen.height + 50 ||
          !missile.isActive) {
        this.gameContainer.removeChild(missile.sprite);
        this.missiles.splice(i, 1);
        missile.destroy();
      }
    }
  }

  private updateEnemies(deltaTime: number): void{
    const currentTime = Date.now();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(deltaTime, currentTime, this.player.sprite.x, this.player.sprite.y);

      // Check if enemy reached bottom
      if (enemy.sprite.y > this.app.screen.height) {
        if (this.shieldActive) {
          // Shield absorbs one hit
          this.shieldActive = false;
          this.player.hideShield(); // Hide shield visual when used
          this.gameContainer.removeChild(enemy.sprite);
          this.enemies.splice(i, 1);
          enemy.destroy();
        } else {
          this.gameOver();
          return;
        }
      }
    }
  }

  private updatePowerUps(deltaTime: number): void {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.update(deltaTime);

      // Check collision with player
      const dx = powerUp.sprite.x - this.player.sprite.x;
      const dy = powerUp.sprite.y - this.player.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 40) {
        // Create particle effect at powerup location
        this.collectPowerUp(powerUp.type, powerUp.sprite.x, powerUp.sprite.y);
        this.gameContainer.removeChild(powerUp.sprite);
        this.powerUps.splice(i, 1);
        powerUp.destroy();
        continue;
      }

      // Remove if off screen
      if (powerUp.sprite.y > this.app.screen.height) {
        this.gameContainer.removeChild(powerUp.sprite);
        this.powerUps.splice(i, 1);
        powerUp.destroy();
      }
    }
  }

  private collectPowerUp(type: PowerUpType, x: number, y: number): void {
    // Play powerup collection sound
    this.audio.playPowerUp();

    // Award points for collecting powerup
    this.score += 5;

    // Get color based on powerup type for particles
    let particleColor: number;
    let particleCount: number = 30;

    switch (type) {
      case 'rapidfire':
        particleColor = 0xffa500; // Orange
        this.rapidFireActive = true;
        this.rapidFireTimer = 10000; // 10 seconds - longer for more fun!
        break;
      case 'shield':
        particleColor = 0x4169e1; // Blue
        this.shieldActive = true;
        this.player.showShield(); // Show shield visual
        break;
      case 'bomb':
        particleColor = 0xff0000; // Red
        particleCount = 40; // More particles for bomb
        // Clear all enemies on screen with explosion particles
        let enemiesCleared = 0;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const enemy = this.enemies[i];
          const config = getEnemyConfig(enemy.type);
          this.particleSystem.createExplosion(enemy.sprite.x, enemy.sprite.y, config.color, 20);
          this.gameContainer.removeChild(enemy.sprite);
          this.enemies.splice(i, 1);
          enemy.destroy();
          // Award half points for bomb kills
          this.score += Math.floor(config.points / 2);
          enemiesCleared++;
        }
        // Track wave progress for bomb kills
        this.enemiesKilledThisWave += enemiesCleared;
        this.checkWaveComplete();
        this.audio.playHit();
        break;
      case 'missiles':
        particleColor = 0xff4500; // Orange-red
        this.missileAmmo += 3; // Add 3 missiles
        if (this.missileText) {
          this.missileText.text = `Missiles: ${this.missileAmmo}`;
        }
        break;
    }

    // Create sparkle particle effect at powerup collection location
    this.particleSystem.createExplosion(x, y, particleColor, particleCount);
  }

  private checkCollisions(): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // Skip collision check if bullet hasn't traveled far enough yet
      if (!bullet.canCollide) continue;

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];

        // Simple circle collision detection
        const dx = bullet.sprite.x - enemy.sprite.x;
        const dy = bullet.sprite.y - enemy.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Use enemy size for better collision detection (especially for bosses)
        const config = getEnemyConfig(enemy.type);
        const enemyRadius = Math.max(config.size.width, config.size.height) / 2;
        const minDistance = enemyRadius + 10; // Enemy radius + small buffer

        if (distance < minDistance) {
          // Collision detected - remove bullet
          this.gameContainer.removeChild(bullet.sprite);
          this.bullets.splice(i, 1);
          bullet.destroy();

          // Damage enemy
          const isDead = enemy.takeDamage();
          if (isDead) {
            // Get enemy config for color and points
            const config = getEnemyConfig(enemy.type);

            // Create explosion particles
            this.particleSystem.createExplosion(enemy.sprite.x, enemy.sprite.y, config.color, 12);

            this.gameContainer.removeChild(enemy.sprite);
            this.enemies.splice(j, 1);
            enemy.destroy();

            // Use configured points
            this.score += config.points;
            this.scoreText.text = `Score: ${this.score}`;

            // Track wave progress
            this.enemiesKilledThisWave++;
            this.checkWaveComplete();
          }

          this.audio.playHit();
          break;
        }
      }
    }

    // Check missile collisions
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const missile = this.missiles[i];

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];

        // Missile collision detection
        const dx = missile.sprite.x - enemy.sprite.x;
        const dy = missile.sprite.y - enemy.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Use enemy size for better collision detection (especially for bosses)
        const config = getEnemyConfig(enemy.type);
        const enemyRadius = Math.max(config.size.width, config.size.height) / 2;
        const minDistance = enemyRadius + 15; // Enemy radius + larger buffer for missiles

        if (distance < minDistance) {
          // Collision detected - remove missile
          this.gameContainer.removeChild(missile.sprite);
          this.missiles.splice(i, 1);
          missile.destroy();

          // Missiles do 3 damage (or kill instantly for weak enemies)
          const isDead = enemy.takeDamage() || enemy.takeDamage() || enemy.takeDamage();
          if (isDead) {
            // Get enemy config for color and points
            const config = getEnemyConfig(enemy.type);

            // Create larger explosion for missile hits
            this.particleSystem.createExplosion(enemy.sprite.x, enemy.sprite.y, config.color, 20);

            this.gameContainer.removeChild(enemy.sprite);
            this.enemies.splice(j, 1);
            enemy.destroy();

            // Use configured points
            this.score += config.points;
            this.scoreText.text = `Score: ${this.score}`;

            // Track wave progress
            this.enemiesKilledThisWave++;
            this.checkWaveComplete();
          }

          this.audio.playHit();
          break;
        }
      }
    }
  }

  private checkWaveComplete(): void {
    if (this.enemiesKilledThisWave >= this.enemiesPerWave) {
      // If we're already in a transition (e.g., boss wave intro),
      // clean it up before starting the next wave
      if (this.isWaveTransition) {
        this.isWaveTransition = false;
        this.isTransitioningToBoss = false;
        if (this.waveTransitionText) {
          this.app.stage.removeChild(this.waveTransitionText);
          this.waveTransitionText.destroy();
          this.waveTransitionText = null;
        }
      }
      this.startWaveTransition();
    }
  }

  private startWaveTransition(): void {
    this.isWaveTransition = true;
    this.waveTransitionTimer = 0;

    // Store previous wave's boss status before incrementing
    const wasBossWave = this.isBossWave;

    this.currentWave++;
    this.enemiesKilledThisWave = 0;

    // Check if this is a boss wave (every 3rd wave: 3, 6, 9, etc.)
    this.isBossWave = this.currentWave % 3 === 0;
    this.isTransitioningToBoss = this.isBossWave; // Store boss wave status for transition
    this.bossSpawned = false;

    // If we just completed a boss wave, stop boss music
    if (wasBossWave && !this.isBossWave && this.musicEnabled) {
      this.audio.stopBossMusic();
      this.audio.startBackgroundMusic();
    }

    if (this.isBossWave) {
      // Boss wave - just 1 boss enemy
      this.enemiesPerWave = 1;

      // Clear all remaining enemies from previous wave
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        this.gameContainer.removeChild(enemy.sprite);
        enemy.destroy();
      }
      this.enemies = [];

      // Switch to boss music
      if (this.musicEnabled) {
        this.audio.stopBackgroundMusic();
        this.audio.startBossMusic();
      }

      // Spawn boss immediately during transition so it appears right away
      const x = this.app.screen.width / 2;
      const bossType = selectRandomBossType(this.currentWave);
      const boss = new Enemy(x, -100, bossType, this.difficultyMultiplier, this.app.screen.width);

      // Set up boss shooting callback
      boss.onShoot = (bx: number, by: number, pattern: string, playerX?: number, playerY?: number) => {
        this.spawnEnemyBullets(bx, by, pattern, playerX, playerY);
      };

      this.enemies.push(boss);
      this.gameContainer.addChild(boss.sprite);
      this.bossSpawned = true;
    } else {
      // Normal wave - aggressive difficulty scaling
      this.enemiesPerWave += Math.floor(3 + this.currentWave * 1.5);

      // Decrease spawn interval aggressively (more enemies on screen)
      const reductionAmount = Math.max(80, 150 - this.currentWave * 10);
      this.spawnInterval = Math.max(this.minSpawnInterval, this.spawnInterval - reductionAmount);

      // Increase enemy speed multiplier (enemies get faster)
      this.difficultyMultiplier += 0.08; // 8% speed increase per wave

      // Reduce power-up frequency as game gets harder
      this.powerUpInterval = Math.min(15000, this.powerUpInterval + 500);
    }

    // Show wave complete text
    const waveMessage = this.isBossWave
      ? `WAVE ${this.currentWave - 1} COMPLETE!\n\n⚠️ BOSS WAVE ${this.currentWave} ⚠️\nPrepare for Battle!`
      : `WAVE ${this.currentWave - 1} COMPLETE!\n\nWave ${this.currentWave} Starting...\nDifficulty: ${Math.round(this.difficultyMultiplier * 100)}%`;

    this.waveTransitionText = new Text({
      text: waveMessage,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 40,
        fontWeight: '900',
        fill: this.isBossWave ? 0xff0000 : 0x00ffff,
        align: 'center',
        stroke: { color: 0x000000, width: 6 },
        dropShadow: {
          color: this.isBossWave ? 0xff0000 : 0x00ffff,
          blur: 10,
          distance: 4,
        },
      },
    });
    this.waveTransitionText.anchor.set(0.5);
    this.waveTransitionText.x = this.app.screen.width / 2;
    this.waveTransitionText.y = this.app.screen.height / 2;
    this.app.stage.addChild(this.waveTransitionText);

    // Update wave text
    this.waveText.text = this.isBossWave ? `BOSS WAVE: ${this.currentWave}` : `Wave: ${this.currentWave}`;
  }

  private updateWaveTransition(deltaTime: number): void {
    if (!this.isWaveTransition) return;

    this.waveTransitionTimer += deltaTime;

    // Boss waves get a bit more time to show the warning (3 seconds vs 2)
    const duration = this.isTransitioningToBoss ? 3000 : this.waveTransitionDuration;

    // Fade out the text in the last 500ms
    if (this.waveTransitionText && this.waveTransitionTimer >= duration - 500) {
      const fadeProgress = (this.waveTransitionTimer - (duration - 500)) / 500;
      this.waveTransitionText.alpha = Math.max(0, 1 - fadeProgress);
    }

    if (this.waveTransitionTimer >= duration) {
      // End transition
      this.isWaveTransition = false;
      this.isTransitioningToBoss = false; // Reset transition flag
      if (this.waveTransitionText) {
        this.app.stage.removeChild(this.waveTransitionText);
        this.waveTransitionText.destroy();
        this.waveTransitionText = null;
      }
    }
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  }

  private mobileInstructionsContainer: HTMLDivElement | null = null;

  private showMobileInstructions(): void {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.zIndex = '10000';
    container.style.padding = '20px';
    container.style.fontFamily = 'Orbitron, sans-serif';
    container.style.color = '#00ffff';
    container.style.textAlign = 'center';
    container.style.cursor = 'pointer';

    container.innerHTML = `
      <div style="max-width: 400px;">
        <h2 style="font-size: 32px; margin-bottom: 30px; text-shadow: 0 0 10px #00ffff;">TOUCH CONTROLS</h2>
        <div style="font-size: 18px; line-height: 1.8; margin-bottom: 20px;">
          <p style="margin-bottom: 15px;"><strong>DRAG LEFT/RIGHT</strong> to steer your ship</p>
          <p style="margin-bottom: 15px;"><strong>SWIPE UP</strong> while steering to fire missile</p>
          <p style="margin-bottom: 15px;"><strong>AUTO-FIRE</strong> enabled for bullets</p>
          <p style="margin-bottom: 15px;">Music starts automatically</p>
        </div>
        <div style="font-size: 16px; color: #ffaa00; margin-top: 30px; animation: pulse 2s infinite;">
          TAP ANYWHERE TO START
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `;

    // Make it dismissible on click/touch
    const dismissHandler = () => {
      this.hideMobileInstructions();
      // Start music on first interaction
      this.audio.resume();
    };

    container.addEventListener('click', dismissHandler);
    container.addEventListener('touchstart', dismissHandler);

    this.mobileInstructionsContainer = container;
    document.body.appendChild(container);
  }

  private hideMobileInstructions(): void {
    if (this.mobileInstructionsContainer) {
      document.body.removeChild(this.mobileInstructionsContainer);
      this.mobileInstructionsContainer = null;
    }
  }

  private createGameOverAd(): void {
    // Create a styled ad container that appears on game over
    const adContainer = document.createElement('div');
    adContainer.id = 'game-over-ad';
    adContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 728px;
      padding: 15px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(0, 255, 255, 0.3);
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
      text-align: center;
      z-index: 1000;
    `;

    // Create AdSense ad unit
    const adIns = document.createElement('ins');
    adIns.className = 'adsbygoogle';
    adIns.style.display = 'block';
    adIns.setAttribute('data-ad-client', 'ca-pub-XXXXXXXXXXXXXXXX');
    adIns.setAttribute('data-ad-slot', '6677889900');
    adIns.setAttribute('data-ad-format', 'horizontal');
    adIns.setAttribute('data-full-width-responsive', 'true');

    adContainer.appendChild(adIns);
    document.body.appendChild(adContainer);

    // Push ad to AdSense
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.log('AdSense error:', e);
    }
  }

  private gameOver(): void {
    this.gameState = 'gameover';
    this.audio.playGameOver();

    // Check for new high score
    const isNewHighScore = HighScoreManager.saveHighScore(this.score);

    // Create HTML overlay for game over screen
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'Orbitron', sans-serif;
      text-align: center;
      padding: 20px;
      box-sizing: border-box;
    `;

    const titleColor = isNewHighScore ? '#ffd700' : '#ff0000';
    const glowColor = isNewHighScore ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';

    container.innerHTML = `
      <div style="max-width: 600px;">
        <h1 style="font-size: 56px; margin-bottom: 20px; color: ${titleColor};
                   text-shadow: 0 0 20px ${glowColor}, 0 0 40px ${glowColor};
                   font-weight: 900;">
          GAME OVER
        </h1>
        ${isNewHighScore ? `
          <p style="font-size: 32px; color: #ffd700; margin-bottom: 30px;
                    text-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
                    animation: glow 1.5s infinite alternate;">
            NEW HIGH SCORE!
          </p>
        ` : ''}
        <div style="font-size: 28px; color: #00ffff; margin-bottom: 15px;">
          Final Score: <span style="color: #ffffff; font-weight: bold;">${this.score}</span>
        </div>
        <div style="font-size: 24px; color: #ffaa00; margin-bottom: 40px;">
          Wave Reached: <span style="color: #ffffff; font-weight: bold;">${this.currentWave}</span>
        </div>
        <div style="font-size: 20px; color: #888888; margin-bottom: 30px;">
          High Score: ${this.highScore}
        </div>
        <div style="font-size: 28px; color: #ff4500; font-weight: bold;
                    animation: pulse 2s infinite; cursor: pointer; margin-bottom: 30px;">
          ${this.isMobileDevice() ? 'TAP TO RESTART' : 'PRESS R OR CLICK TO RESTART'}
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 15px rgba(255, 215, 0, 0.7); }
          50% { text-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 50px rgba(255, 215, 0, 0.5); }
        }
      </style>
    `;

    const restartGame = () => {
      window.location.reload();
    };

    container.addEventListener('click', restartGame);
    container.addEventListener('touchstart', restartGame);

    // Keyboard restart
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        restartGame();
      }
    };
    window.addEventListener('keydown', keyHandler);

    document.body.appendChild(container);

    // Create game-over ad container below the game over message
    setTimeout(() => this.createGameOverAd(), 100);
  }

  public start(): void {
    let lastTime = Date.now();

    this.app.ticker.add(() => {
      // Only run game logic when in playing state
      if (this.gameState !== 'playing') return;

      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update wave transition
      this.updateWaveTransition(deltaTime);

      // Don't spawn enemies during wave transition
      if (!this.isWaveTransition) {
        // Spawn enemies
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
          this.spawnEnemy();
          this.spawnTimer = 0;
        }

        // Spawn power-ups
        this.powerUpTimer += deltaTime;
        if (this.powerUpTimer >= this.powerUpInterval) {
          this.spawnPowerUp();
          this.powerUpTimer = 0;
        }
      }

      // Update rapid fire timer
      if (this.rapidFireActive) {
        this.rapidFireTimer -= deltaTime;
        if (this.rapidFireTimer <= 0) {
          this.rapidFireActive = false;
        }
      }

      // Auto-fire for mobile devices
      if (this.autoFireEnabled && this.gameState === 'playing') {
        const currentFireRate = this.rapidFireActive ? 100 : this.fireRate;
        if (currentTime - this.lastShotTime >= currentFireRate) {
          this.shoot();
          this.lastShotTime = currentTime;
        }
      }

      // Update game objects
      this.background.update(deltaTime);
      this.updateBullets(deltaTime);
      this.updateMissiles(deltaTime);
      this.updateEnemies(deltaTime);
      this.updateEnemyBullets(deltaTime);
      this.updatePowerUps(deltaTime);
      this.particleSystem.update(deltaTime);
      this.player.updateShield(deltaTime); // Animate shield if active
      this.checkCollisions();
      this.checkEnemyBulletCollisions();
    });
  }
}
