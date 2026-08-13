/**
 * AnalyticsManager - Game-specific analytics wrapper
 * Tracks game events, player actions, and session metrics
 */

import { createAnalytics, Analytics } from '../lib/analytics';

export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private analytics: Analytics;
  private sessionStartTime: number;
  private gameStartTime: number = 0;
  private currentWave: number = 0;
  private enemiesKilled: number = 0;
  private bulletsShot: number = 0;
  private missilesUsed: number = 0;
  private powerupsCollected: number = 0;

  private constructor() {
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    const appName = import.meta.env.VITE_APP_NAME || 'astro-bitz';
    const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const debug = import.meta.env.VITE_ANALYTICS_DEBUG === 'true';

    if (!endpoint || !apiKey) {
      console.warn('[Analytics] Missing required environment variables. Analytics disabled.');
    }

    this.analytics = createAnalytics({
      endpoint: endpoint || '',
      appName,
      apiKey,
      debug,
      disabled: !endpoint || !apiKey
    });

    this.sessionStartTime = Date.now();

    // Track that the game loaded
    this.trackGameLoaded();
  }

  public static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  /**
   * Game loaded (initial page load)
   */
  private trackGameLoaded(): void {
    this.analytics.pageView('game_loaded', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Player started a new game
   */
  public trackGameStart(): void {
    this.gameStartTime = Date.now();
    this.currentWave = 1;
    this.enemiesKilled = 0;
    this.bulletsShot = 0;
    this.missilesUsed = 0;
    this.powerupsCollected = 0;

    this.analytics.track({
      eventType: 'game_event',
      eventName: 'game_start',
      properties: {
        session_age: Math.floor((Date.now() - this.sessionStartTime) / 1000)
      }
    });
  }

  /**
   * Game over (player died)
   */
  public trackGameOver(score: number, wave: number, finalStats?: {
    enemiesKilled: number;
    bulletsShot: number;
    missilesUsed: number;
    powerupsCollected: number;
  }): void {
    const gameDuration = Math.floor((Date.now() - this.gameStartTime) / 1000);

    this.analytics.conversion('game_over', {
      score,
      wave,
      duration: gameDuration,
      enemies_killed: finalStats?.enemiesKilled || this.enemiesKilled,
      bullets_shot: finalStats?.bulletsShot || this.bulletsShot,
      missiles_used: finalStats?.missilesUsed || this.missilesUsed,
      powerups_collected: finalStats?.powerupsCollected || this.powerupsCollected,
      accuracy: this.bulletsShot > 0 ?
        Math.round((this.enemiesKilled / this.bulletsShot) * 100) : 0
    });
  }

  /**
   * Wave started
   */
  public trackWaveStart(waveNumber: number, isBossWave: boolean): void {
    this.currentWave = waveNumber;

    this.analytics.track({
      eventType: 'game_event',
      eventName: isBossWave ? 'boss_wave_start' : 'wave_start',
      properties: {
        wave: waveNumber,
        is_boss: isBossWave
      }
    });
  }

  /**
   * Wave completed
   */
  public trackWaveComplete(waveNumber: number, timeToComplete: number): void {
    this.analytics.conversion('wave_complete', {
      wave: waveNumber,
      time: timeToComplete,
      enemies_killed_in_wave: this.enemiesKilled
    });
  }

  /**
   * Enemy killed
   */
  public trackEnemyKilled(_enemyType: string, _points: number): void {
    this.enemiesKilled++;

    // Track every 10th kill to avoid too many events
    if (this.enemiesKilled % 10 === 0) {
      this.analytics.track({
        eventType: 'game_event',
        eventName: 'enemies_milestone',
        properties: {
          total_killed: this.enemiesKilled,
          wave: this.currentWave
        }
      });
    }
  }

  /**
   * Boss defeated
   */
  public trackBossDefeated(bossType: string, wave: number, timeTaken: number): void {
    this.analytics.conversion('boss_defeated', {
      boss_type: bossType,
      wave: wave,
      time: timeTaken
    });
  }

  /**
   * Power-up collected
   */
  public trackPowerupCollected(powerupType: string): void {
    this.powerupsCollected++;

    this.analytics.click('powerup_collected', {
      type: powerupType,
      wave: this.currentWave,
      total_collected: this.powerupsCollected
    });
  }

  /**
   * Bullet shot
   */
  public trackBulletShot(): void {
    this.bulletsShot++;
  }

  /**
   * Missile fired
   */
  public trackMissileFired(): void {
    this.missilesUsed++;

    this.analytics.click('missile_fired', {
      wave: this.currentWave,
      total_used: this.missilesUsed
    });
  }

  /**
   * Player hit (took damage)
   */
  public trackPlayerHit(source: 'bullet' | 'collision', shieldActive: boolean): void {
    this.analytics.track({
      eventType: 'game_event',
      eventName: 'player_hit',
      properties: {
        source,
        shield_active: shieldActive,
        wave: this.currentWave
      }
    });
  }

  /**
   * High score achieved
   */
  public trackHighScore(newScore: number, previousScore: number): void {
    this.analytics.conversion('high_score', {
      new_score: newScore,
      previous_score: previousScore,
      improvement: newScore - previousScore
    });
  }

  /**
   * Score milestone reached
   */
  public trackScoreMilestone(milestone: number): void {
    this.analytics.conversion('score_milestone', {
      milestone: milestone,
      wave: this.currentWave
    });
  }

  /**
   * Ad viewed (if using ads)
   */
  public trackAdViewed(adType: string): void {
    this.analytics.click('ad_viewed', {
      ad_type: adType
    });
  }

  /**
   * Session milestone (time-based)
   */
  public trackSessionMilestone(minutes: number): void {
    this.analytics.track({
      eventType: 'engagement',
      eventName: 'session_milestone',
      properties: {
        minutes: minutes,
        games_played: Math.floor(this.enemiesKilled / 50) // Rough estimate
      }
    });
  }

  /**
   * Get current game stats
   */
  public getCurrentStats() {
    return {
      enemiesKilled: this.enemiesKilled,
      bulletsShot: this.bulletsShot,
      missilesUsed: this.missilesUsed,
      powerupsCollected: this.powerupsCollected,
      currentWave: this.currentWave
    };
  }

  /**
   * Reset game stats (for new game)
   */
  public resetGameStats(): void {
    this.enemiesKilled = 0;
    this.bulletsShot = 0;
    this.missilesUsed = 0;
    this.powerupsCollected = 0;
    this.currentWave = 0;
  }
}
