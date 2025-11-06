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
import { ParallaxBackground } from './ParallaxBackground';
import { AnalyticsManager } from './AnalyticsManager';
import { AchievementsManager, type Achievement } from './AchievementsManager';
import { LeaderboardManager } from './LeaderboardManager';

export class Game {
  private app: Application;
  private gameContainer: Container;
  private background: Background;
  private parallaxBackground: ParallaxBackground;
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
  private spawnInterval: number = 1800; // Start at 1.8 seconds (slightly slower)
  private powerUpTimer: number = 0;
  private powerUpInterval: number = 8000; // Power-ups more frequent (8 seconds)
  private audio: AudioManager;
  private musicEnabled: boolean = true;
  private musicText: Text;
  private rapidFireActive: boolean = false;
  private rapidFireTimer: number = 0;
  private rapidFireSpawnBoost: boolean = false;
  private rapidFireSpawnTimer: number = 0;
  private rapidFireSpawnDuration: number = 5000; // 5 seconds of faster spawns
  private shieldCount: number = 0; // Number of shields (can stack)
  private fireRate: number = 300; // milliseconds between shots
  private lastShotTime: number = 0;
  private isInvincible: boolean = false;
  private invincibilityTimer: number = 0;
  private invincibilityDuration: number = 1500; // 1.5 seconds of invincibility after shield break

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
  private autoFireEnabled: boolean = false;

  // Game state
  private gameState: 'start' | 'playing' | 'dying' | 'gameover' = 'start';
  private isPaused: boolean = false;
  private startScreenContainer: HTMLDivElement | null = null;
  private pauseOverlay: HTMLDivElement | null = null;

  // Analytics
  private analytics: AnalyticsManager;
  private waveStartTime: number = 0;
  private bossSpawnTime: number = 0;
  private gameStartTime: number = 0; // Track when game starts for grace period

  // Achievements
  private achievementsManager: AchievementsManager;
  private newAchievements: Achievement[] = []; // Queue of newly unlocked achievements

  // Leaderboard (initialized but not yet integrated into UI)
  private leaderboardManager: LeaderboardManager | null = null;

  // Getter for future leaderboard integration
  public getLeaderboardManager(): LeaderboardManager | null {
    return this.leaderboardManager;
  }

  constructor(app: Application) {
    this.app = app;
    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);
    this.audio = new AudioManager();
    this.analytics = AnalyticsManager.getInstance();
    this.achievementsManager = new AchievementsManager();

    // Initialize leaderboard with game-specific Supabase instance
    const leaderboardUrl = import.meta.env.VITE_LEADERBOARD_URL;
    const leaderboardKey = import.meta.env.VITE_LEADERBOARD_ANON_KEY;
    if (leaderboardUrl && leaderboardKey) {
      this.leaderboardManager = new LeaderboardManager({
        supabaseUrl: leaderboardUrl,
        supabaseKey: leaderboardKey
      });
    }

    // Create starry background
    this.background = new Background(this.gameContainer, this.app.screen.width, this.app.screen.height);

    // Create parallax background with depth layers
    this.parallaxBackground = new ParallaxBackground(this.app.screen.width, this.app.screen.height);
    // Add parallax behind everything but after the static background
    this.gameContainer.addChildAt(this.parallaxBackground.getContainer(), 1);

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

    // Create pause button
    this.createPauseButton();

    // Setup input
    this.setupInput();

    // Enable auto-fire for all devices
    this.autoFireEnabled = true;

    // Show start screen instead of starting immediately
    this.showStartScreen();
  }

  private showStartScreen(): void {
    // Remove any existing start screen first
    if (this.startScreenContainer) {
      if (document.body.contains(this.startScreenContainer)) {
        document.body.removeChild(this.startScreenContainer);
      }
      this.startScreenContainer = null;
    }

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
          ASTRO ACE
        </h1>
        <p style="font-size: 24px; color: #ffaa00; margin-bottom: 40px;">
          The stars are calling
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

    let startGameCalled = false;

    const startGame = (e: Event) => {
      // Prevent double-firing
      if (startGameCalled) return;
      startGameCalled = true;

      e.preventDefault();
      e.stopPropagation();

      // Remove event listeners
      container.removeEventListener('click', startGame);
      container.removeEventListener('touchstart', startGame);

      if (this.startScreenContainer) {
        document.body.removeChild(this.startScreenContainer);
        this.startScreenContainer = null;
      }

      // Reset all game state
      this.score = 0;
      this.currentWave = 1;
      this.enemiesKilledThisWave = 0;
      this.enemiesPerWave = 15;
      this.spawnTimer = 0;
      this.spawnInterval = 1500; // Slightly slower (increased from 1200)
      this.powerUpTimer = 0;
      this.difficultyMultiplier = 1.0;
      this.shieldCount = 0;
      this.rapidFireActive = false;
      this.rapidFireTimer = 0;
      this.rapidFireSpawnBoost = false;
      this.rapidFireSpawnTimer = 0;
      this.missileAmmo = 3;
      this.isInvincible = false;
      this.invincibilityTimer = 0;
      this.isBossWave = false;
      this.bossSpawned = false;

      // Update UI
      this.scoreText.text = `Score: ${this.score}`;
      this.waveText.text = `Wave: ${this.currentWave}`;
      if (this.missileText) {
        this.missileText.text = `Missiles: ${this.missileAmmo}`;
      }
      this.player.hideShield();

      // Make player visible again (in case it was hidden from game over)
      this.player.sprite.visible = true;

      this.gameState = 'playing';
      this.audio.resume();

      // Stop any existing music before starting new game
      this.audio.stopBackgroundMusic();
      this.audio.stopBossMusic();

      // Start fresh music after a brief delay to ensure stop completes
      if (this.musicEnabled) {
        setTimeout(() => {
          this.audio.startBackgroundMusic(this.currentWave);
        }, 100);
      }
      // Track game start
      this.analytics.trackGameStart();
      // Reset achievements session tracking
      this.achievementsManager.resetSession();
      this.newAchievements = [];
      this.waveStartTime = Date.now();
      this.gameStartTime = Date.now(); // Set grace period start time
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

      // Toggle pause with ESC or P key
      if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && this.gameState === 'playing') {
        this.togglePause();
        return;
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
      if (e.key === ' ' && this.gameState === 'playing' && !this.isPaused) {
        const currentTime = Date.now();
        const currentFireRate = this.rapidFireActive ? 100 : this.fireRate;
        if (currentTime - this.lastShotTime >= currentFireRate) {
          this.shoot();
          this.lastShotTime = currentTime;
        }
      }

      // Fire missile on X key
      if ((e.key === 'x' || e.key === 'X') && this.gameState === 'playing' && !this.isPaused) {
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

    // Mobile instructions removed - start screen already shows controls

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

      // Mobile instructions removed - no longer needed
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
    this.analytics.trackBulletShot();
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
    this.analytics.trackMissileFired();
  }

  private spawnEnemyBullets(x: number, y: number, pattern: string, playerX?: number, playerY?: number): void {
    switch (pattern) {
      case 'single':
        // Single bullet with more randomness
        const randomOffset = (Math.random() - 0.5) * 0.4; // ±0.2 radians (~11 degrees) - increased from 0.15
        const singleBullet = new EnemyBullet(x, y, randomOffset);
        this.enemyBullets.push(singleBullet);
        this.gameContainer.addChild(singleBullet.sprite);
        break;

      case 'triple':
        // Three bullets in a more random spread
        for (let i = -1; i <= 1; i++) {
          // Randomize the base spread more
          const baseSpread = 0.3 + (Math.random() - 0.5) * 0.3; // 0.15 to 0.45 radians base
          const baseAngle = i * baseSpread;
          const randomness = (Math.random() - 0.5) * 0.25; // ±0.125 radians (~7 degrees) - increased from 0.1
          const bullet = new EnemyBullet(x, y, baseAngle + randomness);
          this.enemyBullets.push(bullet);
          this.gameContainer.addChild(bullet.sprite);
        }
        break;

      case 'spread':
        // Five bullets in a much more chaotic spread
        for (let i = -2; i <= 2; i++) {
          // Randomize the base spread significantly
          const baseSpread = 0.4 + (Math.random() - 0.5) * 0.4; // 0.2 to 0.6 radians base
          const baseAngle = i * baseSpread;
          const randomness = (Math.random() - 0.5) * 0.3; // ±0.15 radians (~9 degrees) - increased from 0.1
          const bullet = new EnemyBullet(x, y, baseAngle + randomness);
          this.enemyBullets.push(bullet);
          this.gameContainer.addChild(bullet.sprite);
        }
        break;

      case 'aimed':
        // Aimed at player but with more inaccuracy
        if (playerX !== undefined && playerY !== undefined) {
          const dx = playerX - x;
          const dy = playerY - y;
          const angle = Math.atan2(dx, dy);
          const randomness = (Math.random() - 0.5) * 0.3; // ±0.15 radians (~9 degrees) - increased from 0.12
          const bullet = new EnemyBullet(x, y, angle + randomness);
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

        if (this.shieldCount > 0) {
          // Shield absorbs hit
          this.handleShieldBreak();
        } else if (!this.isInvincible) {
          // Game over (unless invincible)
          this.gameOver();
          return;
        }
      }
    }
  }

  private checkShieldCollisions(): void {
    // Only check if player has shields active
    if (this.shieldCount === 0) return;

    const shieldRadius = 50; // Collision radius for shield

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Don't damage bosses with shield collisions
      if (enemy.isBoss) continue;

      // Check collision with player's shield
      const dx = enemy.sprite.x - this.player.sprite.x;
      const dy = enemy.sprite.y - this.player.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < shieldRadius + 20) {
        // Enemy collided with shield! Kill enemy and remove ALL shields
        const config = getEnemyConfig(enemy.type);

        // Create explosion
        this.particleSystem.createExplosion(enemy.sprite.x, enemy.sprite.y, config.color, 25);

        // Remove enemy
        this.gameContainer.removeChild(enemy.sprite);
        this.enemies.splice(i, 1);
        enemy.destroy();

        // Award points for shield kill
        this.score += config.points;
        this.enemiesKilledThisWave++;

        // Remove ALL shields on collision
        this.handleShieldBreak();

        this.audio.playHit();
        this.checkWaveComplete();
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

    // Set up shooting callback for stealth enemies
    if (type === 'stealth') {
      enemy.onShoot = (bx: number, by: number, pattern: string, playerX?: number, playerY?: number) => {
        this.spawnEnemyBullets(bx, by, pattern, playerX, playerY);
      };
    }

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

      // Kamikaze explosion proximity check
      if (enemy.type === 'kamikaze') {
        const dx = enemy.sprite.x - this.player.sprite.x;
        const dy = enemy.sprite.y - this.player.sprite.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

        // Explode when close to player (40 pixel radius - reduced from 60)
        if (distanceToPlayer < 40) {
          // Create massive explosion
          const config = getEnemyConfig(enemy.type);
          this.particleSystem.createExplosion(enemy.sprite.x, enemy.sprite.y, config.color, 30);
          this.particleSystem.createExplosion(enemy.sprite.x, enemy.sprite.y, 0xffff00, 20);

          // Remove kamikaze
          this.gameContainer.removeChild(enemy.sprite);
          this.enemies.splice(i, 1);
          enemy.destroy();

          // Play explosion sound
          this.audio.playHit();

          // Kill player if no shield
          if (this.shieldCount > 0) {
            // Shield absorbs kamikaze explosion
            this.handleShieldBreak(); // Remove ALL shields
          } else {
            this.gameOver();
            return;
          }
          continue;
        }
      }

      // Check if enemy reached bottom
      if (enemy.sprite.y > this.app.screen.height) {
        if (this.shieldCount > 0) {
          // Shield absorbs one hit
          this.shieldCount--;
          if (this.shieldCount === 0) {
            this.player.hideShield(); // Hide shield visual when all used
          }
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
        // Boost enemy spawn rate temporarily
        this.rapidFireSpawnBoost = true;
        this.rapidFireSpawnTimer = this.rapidFireSpawnDuration;
        break;
      case 'shield':
        particleColor = 0x4169e1; // Blue
        this.shieldCount++; // Stack shields
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
        // Update score display after bomb kills
        this.scoreText.text = `Score: ${this.score}`;
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

    // Track powerup collection
    this.analytics.trackPowerupCollected(type);

    // Track achievements
    const powerUpAchievements = this.achievementsManager.trackPowerUpCollected();
    this.newAchievements.push(...powerUpAchievements);
  }

  private handleShieldBreak(): void {
    // Create shield break particles (cyan burst)
    this.particleSystem.createExplosion(
      this.player.sprite.x,
      this.player.sprite.y,
      0x00ffff, // Cyan shield color
      30 // More particles for dramatic effect
    );

    // Play shield break sound
    this.audio.playShieldBreak();

    // Remove shield
    this.shieldCount--;
    if (this.shieldCount === 0) {
      this.player.hideShield();
    }

    // Grant brief invincibility
    this.isInvincible = true;
    this.invincibilityTimer = this.invincibilityDuration;

    // Track damage taken for achievement
    this.achievementsManager.trackDamageTaken();
  }

  private playEnemyDeathAnimation(enemy: Enemy, _enemyIndex: number, config: any, particleCount: number = 12, wasMissile: boolean = false): void {
    // Create explosion particles immediately
    this.particleSystem.createExplosion(enemy.sprite.x, enemy.sprite.y, config.color, particleCount);

    // Award points immediately
    this.score += config.points;
    this.scoreText.text = `Score: ${this.score}`;

    // Track enemy killed
    this.analytics.trackEnemyKilled(enemy.type, config.points);

    // Track achievements
    const achievements = this.achievementsManager.trackEnemyKilled(wasMissile);
    this.newAchievements.push(...achievements);

    // Track boss defeat if it's a boss
    if (enemy.isBoss) {
      const timeTaken = Math.floor((Date.now() - this.bossSpawnTime) / 1000);
      this.analytics.trackBossDefeated(enemy.type, this.currentWave, timeTaken);

      // Track boss achievement
      const bossAchievements = this.achievementsManager.trackBossDefeated();
      this.newAchievements.push(...bossAchievements);
    }

    // Track wave progress
    this.enemiesKilledThisWave++;
    this.checkWaveComplete();

    // Mark enemy as being destroyed to prevent concurrent animations
    const isBeingDestroyed = (enemy as any).isBeingDestroyed;
    if (isBeingDestroyed) {
      return; // Already being destroyed, don't start another animation
    }
    (enemy as any).isBeingDestroyed = true;

    // Animate the enemy shrinking/exploding
    const animationDuration = 150; // milliseconds
    const startTime = Date.now();
    const startScale = { x: enemy.sprite.scale.x, y: enemy.sprite.scale.y };

    const animate = () => {
      // Check if enemy still exists and hasn't been removed
      const currentIndex = this.enemies.indexOf(enemy);
      if (currentIndex === -1) {
        // Enemy was removed externally (e.g., boss wave cleanup), stop animation
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      if (progress < 1) {
        // Scale up then shrink
        const scale = progress < 0.3
          ? 1 + (progress / 0.3) * 0.3 // First 30%: scale up to 1.3x
          : 1.3 - ((progress - 0.3) / 0.7) * 1.3; // Last 70%: shrink to 0

        enemy.sprite.scale.set(startScale.x * scale, startScale.y * scale);

        // Rotate for more dynamic death
        enemy.sprite.rotation += 0.2;

        // Fade out
        enemy.sprite.alpha = 1 - progress;

        // Continue animation
        requestAnimationFrame(animate);
      } else {
        // Animation complete - remove enemy
        const finalIndex = this.enemies.indexOf(enemy);
        if (finalIndex !== -1) {
          this.gameContainer.removeChild(enemy.sprite);
          this.enemies.splice(finalIndex, 1);
          enemy.destroy();
        }
      }
    };

    animate();
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

            // Play death animation then remove
            this.playEnemyDeathAnimation(enemy, j, config);
          }

          this.audio.playHit(enemy.type);
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

            // Play death animation (with larger explosion for missiles)
            this.playEnemyDeathAnimation(enemy, j, config, 20, true); // true = was missile
          }

          this.audio.playHit(enemy.type);
          break;
        }
      }
    }
  }

  private checkWaveComplete(): void {
    if (this.enemiesKilledThisWave >= this.enemiesPerWave) {
      // Track wave completion
      const timeToComplete = Math.floor((Date.now() - this.waveStartTime) / 1000);
      this.analytics.trackWaveComplete(this.currentWave, timeToComplete);

      // Track achievements for wave completion
      const waveAchievements = this.achievementsManager.trackWaveCompleted(this.currentWave);
      this.newAchievements.push(...waveAchievements);

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

    // Reset wave tracking for achievements
    this.achievementsManager.resetWaveTracking();

    // Check if this is a boss wave (every 3rd wave: 3, 6, 9, etc.)
    this.isBossWave = this.currentWave % 3 === 0;
    this.isTransitioningToBoss = this.isBossWave; // Store boss wave status for transition
    this.bossSpawned = false;

    // If we just completed a boss wave, stop boss music
    if (wasBossWave && !this.isBossWave && this.musicEnabled) {
      this.audio.stopBossMusic();
      this.audio.startBackgroundMusic(this.currentWave);
    }

    if (this.isBossWave) {
      // Boss wave - just 1 boss enemy
      this.enemiesPerWave = 1;

      // Clear all remaining enemies from previous wave
      // Mark them as being destroyed to stop any ongoing death animations
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        (enemy as any).isBeingDestroyed = true; // Stop any ongoing animations
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

    // Track wave start
    this.analytics.trackWaveStart(this.currentWave, this.isBossWave);
    this.waveStartTime = Date.now();
    if (this.isBossWave) {
      this.bossSpawnTime = Date.now();
    }
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

  private getPilotRank(score: number): { rank: string; color: string; nextRank: string; nextThreshold: number } {
    const ranks = [
      { name: 'Cadet', threshold: 0, color: '#888888' },
      { name: 'Rookie', threshold: 100, color: '#8b7355' },
      { name: 'Navigator', threshold: 300, color: '#4169e1' },
      { name: 'Pilot', threshold: 600, color: '#00ced1' },
      { name: 'Aviator', threshold: 1000, color: '#32cd32' },
      { name: 'Squadron Leader', threshold: 1500, color: '#9acd32' },
      { name: 'Wing Commander', threshold: 2200, color: '#ffa500' },
      { name: 'Flight Captain', threshold: 3000, color: '#ff8c00' },
      { name: 'Star Colonel', threshold: 4000, color: '#ff6347' },
      { name: 'Sky Marshal', threshold: 5500, color: '#ff4500' },
      { name: 'Fleet Admiral', threshold: 7500, color: '#dc143c' },
      { name: 'Legendary Pilot', threshold: 10000, color: '#9400d3' },
      { name: 'Void Commander', threshold: 13000, color: '#8b00ff' },
      { name: 'Cosmic Guardian', threshold: 16500, color: '#ff00ff' },
      { name: 'Nebula Sovereign', threshold: 20000, color: '#ff1493' },
      { name: 'Galactic Champion', threshold: 24000, color: '#ff69b4' },
      { name: 'Celestial Master', threshold: 28000, color: '#ffb6c1' },
      { name: 'Astro Ace', threshold: 35000, color: '#ffd700' },
    ];

    let currentRank = ranks[0];
    let nextRank = ranks[1];

    for (let i = 0; i < ranks.length; i++) {
      if (score >= ranks[i].threshold) {
        currentRank = ranks[i];
        nextRank = ranks[i + 1] || ranks[i]; // Stay at top rank if maxed
      } else {
        break;
      }
    }

    return {
      rank: currentRank.name,
      color: currentRank.color,
      nextRank: nextRank.name,
      nextThreshold: nextRank.threshold
    };
  }

  private async gameOver(): Promise<void> {
    // Set to 'dying' state - keeps particles animating but stops gameplay
    this.gameState = 'dying';

    // Stop all game music immediately
    this.audio.stopBackgroundMusic();
    this.audio.stopBossMusic();

    // Play death jingle immediately (like Super Mario)
    this.audio.playGameOver();

    // Store player position before hiding
    const playerX = this.player.sprite.x;
    const playerY = this.player.sprite.y;

    // Hide player sprite immediately
    this.player.sprite.visible = false;

    // Create BIG SLOW-MOTION explosion at player position
    this.particleSystem.createExplosion(playerX, playerY, 0xff6600, 50, true); // Orange explosion with 50 particles (SLOW-MO)
    this.particleSystem.createExplosion(playerX, playerY, 0xffff00, 40, true); // Yellow inner explosion with 40 particles (SLOW-MO)
    this.particleSystem.createExplosion(playerX, playerY, 0xff0000, 30, true); // Red core with 30 particles (SLOW-MO)
    this.particleSystem.createExplosion(playerX, playerY, 0xffffff, 20, true); // White flash with 20 particles (SLOW-MO)

    // Play explosion sound - multiple hits for bigger bang
    this.audio.playHit();
    setTimeout(() => this.audio.playHit(), 50);
    setTimeout(() => this.audio.playHit(), 100);

    // Wait longer for slow-motion explosion to animate (2.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // NOW set game over state
    this.gameState = 'gameover';

    // Track game over with analytics
    const stats = this.analytics.getCurrentStats();
    this.analytics.trackGameOver(this.score, this.currentWave, stats);

    // Check for new high score
    const isNewHighScore = HighScoreManager.saveHighScore(this.score);
    if (isNewHighScore) {
      this.analytics.trackHighScore(this.score, this.highScore);
    }

    // Get pilot rank and stats
    const rankInfo = this.getPilotRank(this.score);

    // Track rank achievement
    const rankAchievements = this.achievementsManager.trackRankReached(rankInfo.rank);
    this.newAchievements.push(...rankAchievements);
    const accuracy = stats.bulletsShot > 0 ?
      Math.round((stats.enemiesKilled / stats.bulletsShot) * 100) : 0;

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
      justify-content: flex-start;
      align-items: center;
      z-index: 10000;
      font-family: 'Orbitron', sans-serif;
      text-align: center;
      padding: 20px;
      box-sizing: border-box;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    `;

    const titleColor = isNewHighScore ? '#ffd700' : '#ff0000';
    const glowColor = isNewHighScore ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';

    const progressToNext = rankInfo.rank === 'Astro Ace' ? 100 :
      Math.min(100, Math.round((this.score / rankInfo.nextThreshold) * 100));

    container.innerHTML = `
      <div style="max-width: 700px; width: 100%; margin: auto; position: relative; padding-top: 20px; padding-bottom: 100px;">
        <h1 style="font-size: 56px; margin-bottom: 20px; color: ${titleColor};
                   text-shadow: 0 0 20px ${glowColor}, 0 0 40px ${glowColor};
                   font-weight: 900;">
          GAME OVER
        </h1>
        ${isNewHighScore ? `
          <p style="font-size: 32px; color: #ffd700; margin-bottom: 30px;
                    text-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
                    animation: glow 1.5s infinite alternate;">
            ★ NEW HIGH SCORE! ★
          </p>
        ` : ''}

        <!-- Pilot Rank Section -->
        <div style="background: rgba(0, 0, 0, 0.5); padding: 20px; border-radius: 10px;
                    border: 2px solid ${rankInfo.color}; margin-bottom: 30px;
                    box-shadow: 0 0 20px ${rankInfo.color}40;">
          <div style="font-size: 18px; color: #aaa; margin-bottom: 10px;">PILOT RANK</div>
          <div style="font-size: 36px; font-weight: bold; color: ${rankInfo.color};
                      text-shadow: 0 0 15px ${rankInfo.color}; margin-bottom: 15px;">
            ${rankInfo.rank}
          </div>
          ${rankInfo.rank !== 'Astro Ace' ? `
            <div style="font-size: 14px; color: #888; margin-bottom: 8px;">
              Next: ${rankInfo.nextRank} (${rankInfo.nextThreshold} pts)
            </div>
            <div style="background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, ${rankInfo.color}, ${rankInfo.color}cc);
                          height: 100%; width: ${progressToNext}%; transition: width 0.5s;"></div>
            </div>
          ` : '<div style="font-size: 16px; color: #ffd700;">★ MAXIMUM RANK ACHIEVED ★</div>'}
        </div>

        <!-- Score Section -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
          <div style="background: rgba(0, 100, 150, 0.3); padding: 15px; border-radius: 8px; border: 1px solid #00ffff;">
            <div style="font-size: 14px; color: #00ffff; margin-bottom: 5px;">FINAL SCORE</div>
            <div style="font-size: 32px; font-weight: bold; color: #ffffff;">${this.score}</div>
          </div>
          <div style="background: rgba(150, 100, 0, 0.3); padding: 15px; border-radius: 8px; border: 1px solid #ffaa00;">
            <div style="font-size: 14px; color: #ffaa00; margin-bottom: 5px;">WAVE REACHED</div>
            <div style="font-size: 32px; font-weight: bold; color: #ffffff;">${this.currentWave}</div>
          </div>
        </div>

        <!-- Detailed Stats -->
        <div style="background: rgba(0, 0, 0, 0.4); padding: 20px; border-radius: 10px;
                    border: 1px solid #444; margin-bottom: 25px;">
          <div style="font-size: 16px; color: #aaa; margin-bottom: 15px; text-align: left;">MISSION STATISTICS</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: left; font-size: 14px;">
            <div style="color: #888;">Enemies Destroyed:</div>
            <div style="color: #fff; text-align: right; font-weight: bold;">${stats.enemiesKilled}</div>

            <div style="color: #888;">Shots Fired:</div>
            <div style="color: #fff; text-align: right; font-weight: bold;">${stats.bulletsShot}</div>

            <div style="color: #888;">Accuracy:</div>
            <div style="color: ${accuracy >= 25 ? '#32cd32' : accuracy >= 15 ? '#ffaa00' : '#ff4500'};
                        text-align: right; font-weight: bold;">${accuracy}%</div>

            <div style="color: #888;">Missiles Fired:</div>
            <div style="color: #fff; text-align: right; font-weight: bold;">${stats.missilesUsed}</div>

            <div style="color: #888;">Power-Ups Collected:</div>
            <div style="color: #fff; text-align: right; font-weight: bold;">${stats.powerupsCollected}</div>

            <div style="color: #888;">High Score:</div>
            <div style="color: #ffd700; text-align: right; font-weight: bold;">${this.highScore}</div>
          </div>
        </div>

        <!-- Leaderboard Submission -->
        ${this.leaderboardManager ? `
        <div id="leaderboard-section" style="background: rgba(0, 0, 0, 0.4); padding: 20px; border-radius: 10px;
                    border: 1px solid #444; margin-bottom: 25px; margin-top: 25px;">
          <div style="font-size: 18px; color: #00ffff; margin-bottom: 15px;">SUBMIT TO LEADERBOARD</div>
          <div style="display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap;">
            <input type="text" id="player-name-input" placeholder="Enter your name" maxlength="20"
                   style="padding: 10px; border-radius: 5px; border: 2px solid #00ffff;
                          background: rgba(0, 0, 0, 0.5); color: #fff; font-family: 'Orbitron', sans-serif;
                          font-size: 16px; flex: 1; min-width: 200px; max-width: 300px;">
            <button id="submit-score-btn" style="padding: 10px 20px; border-radius: 5px;
                                                   border: 2px solid #00ffff; background: rgba(0, 255, 255, 0.2);
                                                   color: #00ffff; font-family: 'Orbitron', sans-serif;
                                                   font-size: 16px; cursor: pointer; transition: all 0.3s;
                                                   font-weight: bold;">
              SUBMIT SCORE
            </button>
          </div>
          <div id="submit-status" style="margin-top: 10px; font-size: 14px; min-height: 20px;"></div>
        </div>

        <!-- Leaderboard Display -->
        <div style="background: rgba(0, 0, 0, 0.4); padding: 20px; border-radius: 10px;
                    border: 1px solid #444; margin-bottom: 25px;">
          <div style="font-size: 18px; color: #ffd700; margin-bottom: 15px;">🏆 LEADERBOARD</div>

          <!-- Tabs -->
          <div style="display: flex; gap: 10px; margin-bottom: 15px; justify-content: center; flex-wrap: wrap;">
            <button class="leaderboard-tab" data-tab="alltime" style="padding: 8px 16px; border-radius: 5px;
                                                                       border: 2px solid #ffd700; background: rgba(255, 215, 0, 0.3);
                                                                       color: #ffd700; font-family: 'Orbitron', sans-serif;
                                                                       font-size: 14px; cursor: pointer; transition: all 0.3s;
                                                                       font-weight: bold;">
              ALL-TIME
            </button>
            <button class="leaderboard-tab" data-tab="weekly" style="padding: 8px 16px; border-radius: 5px;
                                                                      border: 2px solid #888; background: rgba(136, 136, 136, 0.2);
                                                                      color: #888; font-family: 'Orbitron', sans-serif;
                                                                      font-size: 14px; cursor: pointer; transition: all 0.3s;">
              WEEKLY
            </button>
            <button class="leaderboard-tab" data-tab="daily" style="padding: 8px 16px; border-radius: 5px;
                                                                     border: 2px solid #888; background: rgba(136, 136, 136, 0.2);
                                                                     color: #888; font-family: 'Orbitron', sans-serif;
                                                                     font-size: 14px; cursor: pointer; transition: all 0.3s;">
              DAILY
            </button>
          </div>

          <!-- Leaderboard Content -->
          <div id="leaderboard-content" style="font-size: 14px; color: #fff; text-align: left;">
            <div style="text-align: center; color: #888;">Loading...</div>
          </div>
        </div>
        ` : ''}

        <div style="font-size: 18px; color: #888; margin-top: 20px; margin-bottom: 30px;">
          Click "CLOSE STATS" to return to menu
        </div>

        <!-- Dismiss Button at Bottom -->
        <button id="dismiss-btn" style="background: rgba(255, 0, 0, 0.2); border: 2px solid #ff0000;
                                        color: #ff0000; padding: 12px 24px; border-radius: 5px;
                                        font-family: 'Orbitron', sans-serif; font-size: 16px;
                                        cursor: pointer; transition: all 0.3s;
                                        font-weight: bold; margin-top: 20px;">
          ✕ CLOSE STATS
        </button>
      </div>
      <style>
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 15px rgba(255, 215, 0, 0.7); }
          50% { text-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 50px rgba(255, 215, 0, 0.5); }
        }
        #dismiss-btn:hover {
          background: rgba(255, 0, 0, 0.4);
          transform: scale(1.05);
          box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
        }
        #dismiss-btn:active {
          transform: scale(0.95);
        }
        #submit-score-btn:hover {
          background: rgba(0, 255, 255, 0.4);
          transform: scale(1.05);
        }
        #submit-score-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .leaderboard-tab:hover {
          transform: scale(1.05);
        }
        /* Mobile optimizations */
        @media (max-width: 768px) {
          h1 { font-size: 40px !important; }
          #dismiss-btn { font-size: 14px; padding: 10px 20px; }
          #player-name-input { min-width: 150px; font-size: 14px; }
          #submit-score-btn { font-size: 14px; padding: 8px 16px; }
        }
        @media (max-height: 700px) {
          /* Ensure content is accessible on short screens */
          body { overflow-y: auto; }
        }
      </style>
    `;

    let dismissCalled = false;

    const dismissScreen = () => {
      // Prevent multiple calls
      if (dismissCalled) return;
      dismissCalled = true;

      // Remove the container from DOM
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      window.removeEventListener('keydown', keyHandler);

      // Remove game over ad if it exists
      const adContainer = document.getElementById('game-over-ad');
      if (adContainer && document.body.contains(adContainer)) {
        document.body.removeChild(adContainer);
      }

      // Clear all game entities to prevent them from triggering game over
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        this.gameContainer.removeChild(enemy.sprite);
        enemy.destroy();
      }
      this.enemies = [];

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];
        this.gameContainer.removeChild(bullet.sprite);
        bullet.destroy();
      }
      this.bullets = [];

      for (let i = this.missiles.length - 1; i >= 0; i--) {
        const missile = this.missiles[i];
        this.gameContainer.removeChild(missile.sprite);
        missile.destroy();
      }
      this.missiles = [];

      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = this.enemyBullets[i];
        this.gameContainer.removeChild(bullet.sprite);
        bullet.destroy();
      }
      this.enemyBullets = [];

      for (let i = this.powerUps.length - 1; i >= 0; i--) {
        const powerUp = this.powerUps[i];
        this.gameContainer.removeChild(powerUp.sprite);
        powerUp.destroy();
      }
      this.powerUps = [];

      // Clear particles
      for (let i = this.particleSystem.particles.length - 1; i >= 0; i--) {
        const particle = this.particleSystem.particles[i];
        this.gameContainer.removeChild(particle.sprite);
        particle.destroy();
      }
      this.particleSystem.particles = [];

      // Reset player position and make visible
      this.player.sprite.x = this.app.screen.width / 2;
      this.player.sprite.y = this.app.screen.height - 80;
      this.player.sprite.visible = true;
      this.player.sprite.alpha = 1.0;

      // Stop any background music
      this.audio.stopBackgroundMusic();
      this.audio.stopBossMusic();

      // Reset to start screen when dismissing
      this.gameState = 'start';
      this.showStartScreen();
    };

    // Keyboard handler - Escape to dismiss
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissScreen();
      }
    };
    window.addEventListener('keydown', keyHandler);

    document.body.appendChild(container);

    // Add dismiss button handler after DOM is added
    setTimeout(() => {
      const dismissBtn = document.getElementById('dismiss-btn');
      if (dismissBtn) {
        // Use touchstart OR click, not both
        if ('ontouchstart' in window) {
          // Mobile - use touchstart only
          dismissBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dismissScreen();
          });
        } else {
          // Desktop - use click only
          dismissBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dismissScreen();
          });
        }
      }
    }, 0);

    // Set up leaderboard functionality
    if (this.leaderboardManager) {
      this.setupLeaderboard(container, rankInfo.rank);
    }

    // Create game-over ad container below the game over message
    setTimeout(() => this.createGameOverAd(), 100);
  }

  private setupLeaderboard(container: HTMLDivElement, rank: string): void {
    // Get saved player name from localStorage
    const savedName = localStorage.getItem('player_name') || '';
    const nameInput = document.getElementById('player-name-input') as HTMLInputElement;
    if (nameInput && savedName) {
      nameInput.value = savedName;
    }

    // Submit score handler
    const submitBtn = document.getElementById('submit-score-btn');
    const statusDiv = document.getElementById('submit-status');

    if (submitBtn && nameInput && statusDiv) {
      submitBtn.addEventListener('click', async () => {
        const playerName = nameInput.value.trim();
        if (!playerName) {
          statusDiv.style.color = '#ff4500';
          statusDiv.textContent = 'Please enter your name';
          return;
        }

        if (playerName.length < 2) {
          statusDiv.style.color = '#ff4500';
          statusDiv.textContent = 'Name must be at least 2 characters';
          return;
        }

        // Save name for next time
        localStorage.setItem('player_name', playerName);

        // Disable button during submission
        submitBtn.textContent = 'SUBMITTING...';
        (submitBtn as HTMLButtonElement).disabled = true;
        statusDiv.style.color = '#888';
        statusDiv.textContent = 'Submitting...';

        try {
          const success = await this.leaderboardManager!.submitScore({
            player_name: playerName,
            score: this.score,
            wave: this.currentWave,
            rank: rank
          });

          if (success) {
            statusDiv.style.color = '#32cd32';
            statusDiv.textContent = '✓ Score submitted successfully!';
            submitBtn.textContent = '✓ SUBMITTED';
            // Refresh leaderboard
            await this.loadLeaderboard('alltime');
          } else {
            throw new Error('Submission failed');
          }
        } catch (error) {
          statusDiv.style.color = '#ff4500';
          statusDiv.textContent = '✗ Failed to submit score';
          submitBtn.textContent = 'SUBMIT SCORE';
          (submitBtn as HTMLButtonElement).disabled = false;
        }
      });
    }

    // Tab switching
    const tabs = container.querySelectorAll('.leaderboard-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        const tabName = (tab as HTMLElement).dataset.tab!;

        // Update tab styles
        tabs.forEach(t => {
          if (t === tab) {
            (t as HTMLElement).style.border = '2px solid #ffd700';
            (t as HTMLElement).style.background = 'rgba(255, 215, 0, 0.3)';
            (t as HTMLElement).style.color = '#ffd700';
            (t as HTMLElement).style.fontWeight = 'bold';
          } else {
            (t as HTMLElement).style.border = '2px solid #888';
            (t as HTMLElement).style.background = 'rgba(136, 136, 136, 0.2)';
            (t as HTMLElement).style.color = '#888';
            (t as HTMLElement).style.fontWeight = 'normal';
          }
        });

        // Load leaderboard data
        await this.loadLeaderboard(tabName);
      });
    });

    // Load initial leaderboard data
    this.loadLeaderboard('alltime');
  }

  private async loadLeaderboard(tab: string): Promise<void> {
    const contentDiv = document.getElementById('leaderboard-content');
    if (!contentDiv || !this.leaderboardManager) return;

    contentDiv.innerHTML = '<div style="text-align: center; color: #888;">Loading...</div>';

    try {
      let scores;
      switch (tab) {
        case 'daily':
          scores = await this.leaderboardManager.getTodayTopScores(10);
          break;
        case 'weekly':
          scores = await this.leaderboardManager.getWeekTopScores(10);
          break;
        default:
          scores = await this.leaderboardManager.getTopScores(10);
      }

      if (scores.length === 0) {
        contentDiv.innerHTML = '<div style="text-align: center; color: #888;">No scores yet. Be the first!</div>';
        return;
      }

      // Build leaderboard HTML
      let html = '<table style="width: 100%; border-collapse: collapse;">';
      scores.forEach((entry, index) => {
        const position = index + 1;
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
        const rowColor = position <= 3 ? 'rgba(255, 215, 0, 0.1)' : 'transparent';

        // Get rank info for color
        const rankInfo = this.getPilotRank(entry.score);

        html += `
          <tr style="background: ${rowColor}; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <td style="padding: 8px; text-align: left; color: #ffd700; font-weight: bold; width: 40px;">${medal}</td>
            <td style="padding: 8px; text-align: left; color: #fff;">${this.escapeHtml(entry.player_name)}</td>
            <td style="padding: 8px; text-align: center; color: ${rankInfo.color}; font-size: 11px; font-weight: bold;">${entry.rank}</td>
            <td style="padding: 8px; text-align: right; color: #00ffff; font-weight: bold;">${entry.score}</td>
            <td style="padding: 8px; text-align: right; color: #888; font-size: 12px; width: 70px;">W${entry.wave}</td>
          </tr>
        `;
      });
      html += '</table>';

      contentDiv.innerHTML = html;
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      contentDiv.innerHTML = '<div style="text-align: center; color: #ff4500;">Failed to load leaderboard</div>';
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Show pause overlay
      this.showPauseOverlay();
      // Pause background music
      this.audio.stopBackgroundMusic();
      this.audio.stopBossMusic();
    } else {
      // Hide pause overlay
      this.hidePauseOverlay();
      // Resume background music if enabled
      if (this.musicEnabled) {
        if (this.isBossWave) {
          this.audio.startBossMusic();
        } else {
          this.audio.startBackgroundMusic();
        }
      }
    }
  }

  private showPauseOverlay(): void {
    if (this.pauseOverlay) return; // Already showing

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.fontFamily = 'Arial, sans-serif';

    const title = document.createElement('h1');
    title.textContent = 'PAUSED';
    title.style.color = '#00ffff';
    title.style.fontSize = '64px';
    title.style.marginBottom = '30px';
    title.style.textShadow = '0 0 20px #00ffff';

    const instructions = document.createElement('div');
    instructions.innerHTML = `
      <p style="color: #ffffff; font-size: 24px; margin: 10px;">Press ESC or P to Resume</p>
      <p style="color: #00ffff; font-size: 20px; margin: 10px;">Or tap anywhere to continue</p>
    `;
    instructions.style.textAlign = 'center';

    overlay.appendChild(title);
    overlay.appendChild(instructions);

    // Make overlay clickable to resume
    overlay.addEventListener('click', () => {
      this.togglePause();
    });

    overlay.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.togglePause();
    });

    document.body.appendChild(overlay);

    this.pauseOverlay = overlay;
  }

  private hidePauseOverlay(): void {
    if (this.pauseOverlay && document.body.contains(this.pauseOverlay)) {
      document.body.removeChild(this.pauseOverlay);
      this.pauseOverlay = null;
    }
  }

  private createPauseButton(): void {
    const button = document.createElement('button');
    button.innerHTML = '⏸';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.width = '50px';
    button.style.height = '50px';
    button.style.backgroundColor = 'rgba(0, 255, 255, 0.3)';
    button.style.border = '2px solid #00ffff';
    button.style.borderRadius = '8px';
    button.style.color = '#00ffff';
    button.style.fontSize = '24px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '100';
    button.style.fontFamily = 'Arial, sans-serif';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.padding = '0';
    button.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
    button.style.transition = 'all 0.2s';

    // Hover effect
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'rgba(0, 255, 255, 0.5)';
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'rgba(0, 255, 255, 0.3)';
      button.style.transform = 'scale(1)';
    });

    // Click handler
    button.addEventListener('click', () => {
      if (this.gameState === 'playing') {
        this.togglePause();
      }
    });

    // Touch handler for mobile
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.gameState === 'playing') {
        this.togglePause();
      }
    });

    document.body.appendChild(button);
  }

  public start(): void {
    let lastTime = Date.now();

    this.app.ticker.add(() => {
      // Skip if not playing or dying
      if (this.gameState !== 'playing' && this.gameState !== 'dying') return;

      // Skip if paused
      if (this.isPaused) return;

      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // If dying, only update particles and background
      if (this.gameState === 'dying') {
        this.background.update(deltaTime);
        this.parallaxBackground.update(deltaTime);
        this.particleSystem.update(deltaTime);
        return;
      }

      // Update wave transition
      this.updateWaveTransition(deltaTime);

      // Check if grace period has ended (2 seconds after game start)
      const gracePeriodActive = (currentTime - this.gameStartTime) < 2000;

      // Don't spawn enemies during wave transition or grace period
      if (!this.isWaveTransition && !gracePeriodActive) {
        // Spawn enemies (with optional rapid fire boost)
        this.spawnTimer += deltaTime;
        const currentSpawnInterval = this.rapidFireSpawnBoost
          ? Math.max(this.spawnInterval * 0.5, 200) // 50% faster when rapid fire is active, min 200ms
          : this.spawnInterval;

        if (this.spawnTimer >= currentSpawnInterval) {
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

      // Update rapid fire spawn boost timer
      if (this.rapidFireSpawnBoost) {
        this.rapidFireSpawnTimer -= deltaTime;
        if (this.rapidFireSpawnTimer <= 0) {
          this.rapidFireSpawnBoost = false;
        }
      }

      // Update invincibility timer
      if (this.isInvincible) {
        this.invincibilityTimer -= deltaTime;
        if (this.invincibilityTimer <= 0) {
          this.isInvincible = false;
          this.player.sprite.alpha = 1.0; // Restore full opacity
        } else {
          // Flashing effect: alternate between visible and semi-transparent
          const flashSpeed = 8; // flashes per second
          this.player.sprite.alpha = Math.sin(this.invincibilityTimer * flashSpeed) > 0 ? 1.0 : 0.3;
        }
      }

      // Auto-fire for mobile devices
      if (this.autoFireEnabled && this.gameState === 'playing' && !this.isPaused) {
        const currentFireRate = this.rapidFireActive ? 100 : this.fireRate;
        if (currentTime - this.lastShotTime >= currentFireRate) {
          this.shoot();
          this.lastShotTime = currentTime;
        }
      }

      // Update game objects
      this.background.update(deltaTime);
      this.parallaxBackground.update(deltaTime);
      this.updateBullets(deltaTime);
      this.updateMissiles(deltaTime);
      this.updateEnemies(deltaTime);
      this.updateEnemyBullets(deltaTime);
      this.updatePowerUps(deltaTime);
      this.particleSystem.update(deltaTime);
      this.player.updateShield(deltaTime, this.shieldCount); // Animate shield with count
      this.checkCollisions();
      this.checkShieldCollisions(); // Check for shield-enemy collisions
      this.checkEnemyBulletCollisions();

      // Update music intensity based on enemy count
      this.audio.updateMusicIntensity(this.enemies.length);
    });
  }
}
