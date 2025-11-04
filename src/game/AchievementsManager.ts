export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji icon
  unlocked: boolean;
  unlockedAt?: number; // Timestamp
  progress?: number; // For progressive achievements
  maxProgress?: number; // Target for progressive achievements
}

export class AchievementsManager {
  private achievements: Map<string, Achievement> = new Map();
  private storageKey: string = 'astro-ace-achievements';

  constructor() {
    this.initializeAchievements();
    this.loadAchievements();
  }

  private initializeAchievements(): void {
    const achievementsList: Achievement[] = [
      {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Destroy your first enemy',
        icon: '🎯',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
      },
      {
        id: 'wave_master',
        name: 'Wave Master',
        description: 'Complete wave 5',
        icon: '🌊',
        unlocked: false,
        progress: 0,
        maxProgress: 5,
      },
      {
        id: 'boss_slayer',
        name: 'Boss Slayer',
        description: 'Defeat 10 bosses',
        icon: '⚔️',
        unlocked: false,
        progress: 0,
        maxProgress: 10,
      },
      {
        id: 'untouchable',
        name: 'Untouchable',
        description: 'Complete a wave without taking damage',
        icon: '🛡️',
        unlocked: false,
      },
      {
        id: 'ace_pilot',
        name: 'Astro Ace',
        description: 'Reach the Astro Ace rank',
        icon: '⭐',
        unlocked: false,
      },
      {
        id: 'century',
        name: 'Century Club',
        description: 'Destroy 100 enemies in a single game',
        icon: '💯',
        unlocked: false,
        progress: 0,
        maxProgress: 100,
      },
      {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Kill 10 enemies without missing a shot',
        icon: '🎖️',
        unlocked: false,
      },
      {
        id: 'survivor',
        name: 'Survivor',
        description: 'Survive to wave 10',
        icon: '🏆',
        unlocked: false,
        progress: 0,
        maxProgress: 10,
      },
      {
        id: 'missile_master',
        name: 'Missile Master',
        description: 'Destroy 50 enemies with missiles',
        icon: '🚀',
        unlocked: false,
        progress: 0,
        maxProgress: 50,
      },
      {
        id: 'collector',
        name: 'Power Collector',
        description: 'Collect 25 power-ups',
        icon: '💎',
        unlocked: false,
        progress: 0,
        maxProgress: 25,
      },
    ];

    for (const achievement of achievementsList) {
      this.achievements.set(achievement.id, achievement);
    }
  }

  private loadAchievements(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        for (const [id, savedAchievement] of Object.entries(data)) {
          const achievement = this.achievements.get(id);
          if (achievement) {
            Object.assign(achievement, savedAchievement);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  }

  private saveAchievements(): void {
    try {
      const data: Record<string, Achievement> = {};
      for (const [id, achievement] of this.achievements) {
        data[id] = achievement;
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  }

  public unlockAchievement(id: string): Achievement | null {
    const achievement = this.achievements.get(id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();
      this.saveAchievements();
      return achievement;
    }
    return null;
  }

  public updateProgress(id: string, progress: number): Achievement | null {
    const achievement = this.achievements.get(id);
    if (achievement && !achievement.unlocked && achievement.maxProgress) {
      achievement.progress = Math.min(progress, achievement.maxProgress);

      // Auto-unlock if max progress reached
      if (achievement.progress >= achievement.maxProgress) {
        return this.unlockAchievement(id);
      }

      this.saveAchievements();
    }
    return null;
  }

  public incrementProgress(id: string, amount: number = 1): Achievement | null {
    const achievement = this.achievements.get(id);
    if (achievement && !achievement.unlocked && achievement.progress !== undefined) {
      return this.updateProgress(id, achievement.progress + amount);
    }
    return null;
  }

  public getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  public getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  public getUnlockedAchievements(): Achievement[] {
    return this.getAllAchievements().filter(a => a.unlocked);
  }

  public getLockedAchievements(): Achievement[] {
    return this.getAllAchievements().filter(a => !a.unlocked);
  }

  public getUnlockPercentage(): number {
    const total = this.achievements.size;
    const unlocked = this.getUnlockedAchievements().length;
    return Math.round((unlocked / total) * 100);
  }

  public resetAchievements(): void {
    for (const achievement of this.achievements.values()) {
      achievement.unlocked = false;
      achievement.unlockedAt = undefined;
      if (achievement.progress !== undefined) {
        achievement.progress = 0;
      }
    }
    this.saveAchievements();
  }

  // Session tracking (not persisted)
  private sessionStats = {
    enemiesKilledThisGame: 0,
    missileKillsThisGame: 0,
    powerUpsCollectedThisGame: 0,
    damageTakenThisWave: false,
    shotsThisStreak: 0,
    hitsThisStreak: 0,
  };

  public resetSession(): void {
    this.sessionStats = {
      enemiesKilledThisGame: 0,
      missileKillsThisGame: 0,
      powerUpsCollectedThisGame: 0,
      damageTakenThisWave: false,
      shotsThisStreak: 0,
      hitsThisStreak: 0,
    };
  }

  public resetWaveTracking(): void {
    this.sessionStats.damageTakenThisWave = false;
  }

  public trackEnemyKilled(wasMissile: boolean = false): Achievement[] {
    const newAchievements: Achievement[] = [];

    // Track total kills this game
    this.sessionStats.enemiesKilledThisGame++;

    // Track hits for sharpshooter
    this.sessionStats.hitsThisStreak++;

    // First Blood
    if (this.sessionStats.enemiesKilledThisGame === 1) {
      const achievement = this.unlockAchievement('first_blood');
      if (achievement) newAchievements.push(achievement);
    }

    // Century Club
    if (this.sessionStats.enemiesKilledThisGame >= 100) {
      const achievement = this.unlockAchievement('century');
      if (achievement) newAchievements.push(achievement);
    } else {
      this.updateProgress('century', this.sessionStats.enemiesKilledThisGame);
    }

    // Missile Master
    if (wasMissile) {
      this.sessionStats.missileKillsThisGame++;
      const achievement = this.incrementProgress('missile_master');
      if (achievement) newAchievements.push(achievement);
    }

    // Sharpshooter (10 hits without missing)
    if (this.sessionStats.hitsThisStreak >= 10 && this.sessionStats.shotsThisStreak === this.sessionStats.hitsThisStreak) {
      const achievement = this.unlockAchievement('sharpshooter');
      if (achievement) newAchievements.push(achievement);
    }

    return newAchievements;
  }

  public trackShotFired(): void {
    this.sessionStats.shotsThisStreak++;
  }

  public trackShotMissed(): void {
    // Reset sharpshooter streak
    this.sessionStats.shotsThisStreak = 0;
    this.sessionStats.hitsThisStreak = 0;
  }

  public trackWaveCompleted(waveNumber: number): Achievement[] {
    const newAchievements: Achievement[] = [];

    // Untouchable
    if (!this.sessionStats.damageTakenThisWave) {
      const achievement = this.unlockAchievement('untouchable');
      if (achievement) newAchievements.push(achievement);
    }

    // Wave Master (wave 5)
    if (waveNumber >= 5) {
      const achievement = this.unlockAchievement('wave_master');
      if (achievement) newAchievements.push(achievement);
    } else {
      this.updateProgress('wave_master', waveNumber);
    }

    // Survivor (wave 10)
    if (waveNumber >= 10) {
      const achievement = this.unlockAchievement('survivor');
      if (achievement) newAchievements.push(achievement);
    } else {
      this.updateProgress('survivor', waveNumber);
    }

    return newAchievements;
  }

  public trackBossDefeated(): Achievement[] {
    const achievement = this.incrementProgress('boss_slayer');
    return achievement ? [achievement] : [];
  }

  public trackDamageTaken(): void {
    this.sessionStats.damageTakenThisWave = true;
  }

  public trackPowerUpCollected(): Achievement[] {
    this.sessionStats.powerUpsCollectedThisGame++;
    const achievement = this.incrementProgress('collector');
    return achievement ? [achievement] : [];
  }

  public trackRankReached(rank: string): Achievement[] {
    const newAchievements: Achievement[] = [];

    if (rank === 'Astro Ace') {
      const achievement = this.unlockAchievement('ace_pilot');
      if (achievement) newAchievements.push(achievement);
    }

    return newAchievements;
  }
}
