import { Application, Container, Text } from 'pixi.js';
import { Player } from './entities/Player';
import { Enemy, type EnemyType } from './entities/Enemy';
import { Bullet } from './entities/Bullet';
import { PowerUp, type PowerUpType } from './entities/PowerUp';
import { ParticleSystem } from './entities/Particle';
import { AudioManager } from './AudioManager';
import { HighScoreManager } from './HighScoreManager';

export class Game {
  private app: Application;
  private gameContainer: Container;
  private player: Player;
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private powerUps: PowerUp[] = [];
  private particleSystem: ParticleSystem;
  private score: number = 0;
  private highScore: number = 0;
  private scoreText: Text;
  private highScoreText: Text;
  private waveText: Text;
  private isGameOver: boolean = false;
  private spawnTimer: number = 0;
  private spawnInterval: number = 2000; // 2 seconds
  private powerUpTimer: number = 0;
  private powerUpInterval: number = 10000; // 10 seconds
  private audio: AudioManager;
  private musicEnabled: boolean = true;
  private musicText: Text;
  private rapidFireActive: boolean = false;
  private rapidFireTimer: number = 0;
  private shieldActive: boolean = false;
  private fireRate: number = 300; // milliseconds between shots
  private lastShotTime: number = 0;

  // Wave system
  private currentWave: number = 1;
  private enemiesKilledThisWave: number = 0;
  private enemiesPerWave: number = 10;
  private isWaveTransition: boolean = false;
  private waveTransitionTimer: number = 0;
  private waveTransitionDuration: number = 3000; // 3 seconds between waves
  private waveTransitionText: Text | null = null;

  // Mobile instructions
  private mobileInstructionsShown: boolean = false;
  private autoFireEnabled: boolean = false;

  constructor(app: Application) {
    this.app = app;
    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);
    this.audio = new AudioManager();
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

    // Setup input
    this.setupInput();

    // Enable auto-fire for mobile devices
    if (this.isMobileDevice()) {
      this.autoFireEnabled = true;
    }
  }

  private setupInput(): void {
    const keys: { [key: string]: boolean } = {};
    let musicStarted = false;
    let touchMoving = false;

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
      if (e.key === ' ' && !this.isGameOver) {
        const currentTime = Date.now();
        const currentFireRate = this.rapidFireActive ? 100 : this.fireRate;
        if (currentTime - this.lastShotTime >= currentFireRate) {
          this.shoot();
          this.lastShotTime = currentTime;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key] = false;
    });

    // Touch controls for mobile
    const canvas = this.app.canvas as HTMLCanvasElement;

    // Show mobile instructions on first load
    if (this.isMobileDevice() && !this.mobileInstructionsShown) {
      this.showMobileInstructions();
      this.mobileInstructionsShown = true;
    }

    // Touch move (drag to move player)
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchMoving = true;

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
      if (!this.isGameOver && touchMoving && e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const scaleX = this.app.screen.width / rect.width;
        this.player.sprite.x = x * scaleX;

        // Keep player in bounds
        if (this.player.sprite.x < this.player.sprite.width / 2) {
          this.player.sprite.x = this.player.sprite.width / 2;
        }
        if (this.player.sprite.x > this.app.screen.width - this.player.sprite.width / 2) {
          this.player.sprite.x = this.app.screen.width - this.player.sprite.width / 2;
        }
      }
    });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      touchMoving = false;
    });

    // Update player position based on keys (keyboard only)
    this.app.ticker.add(() => {
      if (!this.isGameOver && !touchMoving) {
        if (keys['ArrowLeft'] || keys['a']) {
          this.player.moveLeft();
        }
        if (keys['ArrowRight'] || keys['d']) {
          this.player.moveRight();
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

  private spawnEnemy(): void {
    // Keep enemies away from edges - tank enemy is 60px wide, so 40px padding is safe
    const edgePadding = 40;
    const x = edgePadding + Math.random() * (this.app.screen.width - edgePadding * 2);

    // Random enemy type with weighted probabilities
    const rand = Math.random();
    let type: EnemyType;
    if (rand < 0.7) {
      type = 'basic'; // 70% chance
    } else if (rand < 0.8) {
      type = 'fast'; // 10% chance - rare but scary!
    } else {
      type = 'tank'; // 20% chance
    }

    const enemy = new Enemy(x, -50, type);
    this.enemies.push(enemy);
    this.gameContainer.addChild(enemy.sprite);
  }

  private spawnPowerUp(): void {
    // Keep power-ups away from edges too
    const edgePadding = 40;
    const x = edgePadding + Math.random() * (this.app.screen.width - edgePadding * 2);

    // Random power-up type
    const types: PowerUpType[] = ['rapidfire', 'shield', 'bomb'];
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

  private updateEnemies(deltaTime: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(deltaTime);

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
        this.collectPowerUp(powerUp.type);
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

  private collectPowerUp(type: PowerUpType): void {
    switch (type) {
      case 'rapidfire':
        this.rapidFireActive = true;
        this.rapidFireTimer = 10000; // 10 seconds - longer for more fun!
        break;
      case 'shield':
        this.shieldActive = true;
        this.player.showShield(); // Show shield visual
        break;
      case 'bomb':
        // Clear all enemies on screen with explosion particles
        let enemiesCleared = 0;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const enemy = this.enemies[i];
          this.particleSystem.createExplosion(enemy.sprite.x, enemy.sprite.y, 0xff4444, 20);
          this.gameContainer.removeChild(enemy.sprite);
          this.enemies.splice(i, 1);
          enemy.destroy();
          this.score += 5;
          enemiesCleared++;
        }
        // Track wave progress for bomb kills
        this.enemiesKilledThisWave += enemiesCleared;
        this.checkWaveComplete();
        this.audio.playHit();
        break;
    }
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
        const minDistance = 35; // Combined radius - larger for easier hitting

        if (distance < minDistance) {
          // Collision detected - remove bullet
          this.gameContainer.removeChild(bullet.sprite);
          this.bullets.splice(i, 1);
          bullet.destroy();

          // Damage enemy
          const isDead = enemy.takeDamage();
          if (isDead) {
            // Create explosion particles
            const color = enemy.type === 'basic' ? 0xff4444 : enemy.type === 'fast' ? 0x00ffff : 0x8b008b;
            this.particleSystem.createExplosion(enemy.sprite.x, enemy.sprite.y, color, 12);

            this.gameContainer.removeChild(enemy.sprite);
            this.enemies.splice(j, 1);
            enemy.destroy();

            const points = enemy.type === 'tank' ? 30 : enemy.type === 'fast' ? 15 : 10;
            this.score += points;
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
      this.startWaveTransition();
    }
  }

  private startWaveTransition(): void {
    this.isWaveTransition = true;
    this.waveTransitionTimer = 0;
    this.currentWave++;
    this.enemiesKilledThisWave = 0;

    // Increase difficulty
    this.enemiesPerWave += 5; // More enemies each wave
    if (this.spawnInterval > 800) {
      this.spawnInterval -= 100; // Faster spawning (but not too fast)
    }

    // Show wave complete text
    this.waveTransitionText = new Text({
      text: `WAVE ${this.currentWave - 1} COMPLETE!\n\nWave ${this.currentWave} Starting...`,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 40,
        fontWeight: '900',
        fill: 0x00ffff,
        align: 'center',
        stroke: { color: 0x000000, width: 6 },
        dropShadow: {
          color: 0x00ffff,
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
    this.waveText.text = `Wave: ${this.currentWave}`;
  }

  private updateWaveTransition(deltaTime: number): void {
    if (!this.isWaveTransition) return;

    this.waveTransitionTimer += deltaTime;

    if (this.waveTransitionTimer >= this.waveTransitionDuration) {
      // End transition
      this.isWaveTransition = false;
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
        <h2 style="font-size: 32px; margin-bottom: 30px; text-shadow: 0 0 10px #00ffff;">📱 TOUCH CONTROLS</h2>
        <div style="font-size: 18px; line-height: 1.8; margin-bottom: 20px;">
          <p style="margin-bottom: 15px;">👆 <strong>TOUCH & DRAG</strong> to steer your ship</p>
          <p style="margin-bottom: 15px;">🔫 <strong>AUTO-FIRE</strong> enabled - focus on steering!</p>
          <p style="margin-bottom: 15px;">🎵 Music starts automatically</p>
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

  private gameOver(): void {
    this.isGameOver = true;
    this.audio.playGameOver();

    // Check for new high score
    const isNewHighScore = HighScoreManager.saveHighScore(this.score);

    let gameOverMessage = 'GAME OVER\n';
    if (isNewHighScore) {
      gameOverMessage += '🏆 NEW HIGH SCORE! 🏆\n';
    }
    gameOverMessage += `Final Score: ${this.score}\n`;
    gameOverMessage += `Wave Reached: ${this.currentWave}\n\n`;

    // Different restart instructions for mobile vs desktop
    if (this.isMobileDevice()) {
      gameOverMessage += 'Tap to Restart';
    } else {
      gameOverMessage += 'Press R to Restart';
    }

    const gameOverText = new Text({
      text: gameOverMessage,
      style: {
        fontFamily: 'Orbitron',
        fontSize: isNewHighScore ? 42 : 38,
        fontWeight: '900',
        fill: isNewHighScore ? 0xffd700 : 0xff0000,
        align: 'center',
        stroke: { color: 0x000000, width: 6 },
        dropShadow: {
          color: isNewHighScore ? 0xffaa00 : 0xff0000,
          blur: 12,
          distance: 4,
        },
      },
    });
    gameOverText.anchor.set(0.5);
    gameOverText.x = this.app.screen.width / 2;
    gameOverText.y = this.app.screen.height / 2;
    this.app.stage.addChild(gameOverText);

    // Keyboard restart
    window.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        window.location.reload();
      }
    });

    // Touch restart for mobile
    if (this.isMobileDevice()) {
      const canvas = this.app.canvas as HTMLCanvasElement;
      const touchRestartHandler = () => {
        window.location.reload();
      };
      canvas.addEventListener('touchstart', touchRestartHandler, { once: true });
    }
  }

  public start(): void {
    let lastTime = Date.now();

    this.app.ticker.add(() => {
      if (this.isGameOver) return;

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
      if (this.autoFireEnabled && !this.isGameOver) {
        const currentFireRate = this.rapidFireActive ? 100 : this.fireRate;
        if (currentTime - this.lastShotTime >= currentFireRate) {
          this.shoot();
          this.lastShotTime = currentTime;
        }
      }

      // Update game objects
      this.updateBullets(deltaTime);
      this.updateEnemies(deltaTime);
      this.updatePowerUps(deltaTime);
      this.particleSystem.update(deltaTime);
      this.player.updateShield(deltaTime); // Animate shield if active
      this.checkCollisions();
    });
  }
}
