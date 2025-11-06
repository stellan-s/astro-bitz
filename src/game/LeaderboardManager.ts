import { filterProfanity } from '../utils/profanityFilter';

export interface LeaderboardEntry {
  id?: string;
  player_name: string;
  score: number;
  wave: number;
  rank: string;
  created_at?: string;
  anonymous_id?: string;
}

export interface LeaderboardConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tableName?: string;
}

export class LeaderboardManager {
  private config: LeaderboardConfig;
  private tableName: string;

  constructor(config: LeaderboardConfig) {
    this.config = config;
    this.tableName = config.tableName || 'leaderboard';
  }

  /**
   * Submit a score to the leaderboard
   */
  public async submitScore(entry: LeaderboardEntry): Promise<boolean> {
    try {
      // Filter profanity from player name
      const filteredPlayerName = filterProfanity(entry.player_name);

      const response = await fetch(
        `${this.config.supabaseUrl}/rest/v1/${this.tableName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.config.supabaseKey,
            'Authorization': `Bearer ${this.config.supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            player_name: filteredPlayerName,
            score: entry.score,
            wave: entry.wave,
            rank: entry.rank,
            anonymous_id: entry.anonymous_id || this.getAnonymousId(),
            created_at: new Date().toISOString()
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to submit score:', error);
      return false;
    }
  }

  /**
   * Get top scores from the leaderboard
   */
  public async getTopScores(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const response = await fetch(
        `${this.config.supabaseUrl}/rest/v1/${this.tableName}?select=*&order=score.desc&limit=${limit}`,
        {
          headers: {
            'apikey': this.config.supabaseKey,
            'Authorization': `Bearer ${this.config.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.filterLeaderboardEntries(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }

  /**
   * Get today's top scores
   */
  public async getTodayTopScores(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const response = await fetch(
        `${this.config.supabaseUrl}/rest/v1/${this.tableName}?select=*&created_at=gte.${todayISO}&order=score.desc&limit=${limit}`,
        {
          headers: {
            'apikey': this.config.supabaseKey,
            'Authorization': `Bearer ${this.config.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.filterLeaderboardEntries(data);
    } catch (error) {
      console.error('Failed to fetch today\'s leaderboard:', error);
      return [];
    }
  }

  /**
   * Get this week's top scores
   */
  public async getWeekTopScores(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      const weekAgoISO = weekAgo.toISOString();

      const response = await fetch(
        `${this.config.supabaseUrl}/rest/v1/${this.tableName}?select=*&created_at=gte.${weekAgoISO}&order=score.desc&limit=${limit}`,
        {
          headers: {
            'apikey': this.config.supabaseKey,
            'Authorization': `Bearer ${this.config.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.filterLeaderboardEntries(data);
    } catch (error) {
      console.error('Failed to fetch week\'s leaderboard:', error);
      return [];
    }
  }

  /**
   * Get player's rank for a given score
   */
  public async getPlayerRank(score: number): Promise<number> {
    try {
      const response = await fetch(
        `${this.config.supabaseUrl}/rest/v1/${this.tableName}?select=score&score=gt.${score}`,
        {
          headers: {
            'apikey': this.config.supabaseKey,
            'Authorization': `Bearer ${this.config.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.length + 1; // Position is count of higher scores + 1
    } catch (error) {
      console.error('Failed to get player rank:', error);
      return -1;
    }
  }

  /**
   * Get player's personal best scores
   */
  public async getPersonalBests(limit: number = 5): Promise<LeaderboardEntry[]> {
    try {
      const anonymousId = this.getAnonymousId();

      const response = await fetch(
        `${this.config.supabaseUrl}/rest/v1/${this.tableName}?select=*&anonymous_id=eq.${anonymousId}&order=score.desc&limit=${limit}`,
        {
          headers: {
            'apikey': this.config.supabaseKey,
            'Authorization': `Bearer ${this.config.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.filterLeaderboardEntries(data);
    } catch (error) {
      console.error('Failed to fetch personal bests:', error);
      return [];
    }
  }

  /**
   * Filter profanity from leaderboard entries
   */
  private filterLeaderboardEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    return entries.map(entry => ({
      ...entry,
      player_name: filterProfanity(entry.player_name)
    }));
  }

  /**
   * Get anonymous ID from localStorage (same as analytics)
   */
  private getAnonymousId(): string {
    const storageKey = 'analytics_anonymous_id_astro-blitz';
    let id = localStorage.getItem(storageKey);

    if (!id) {
      id = this.generateUUID();
      localStorage.setItem(storageKey, id);
    }

    return id;
  }

  /**
   * Generate a UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Check if leaderboard is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.supabaseUrl}/rest/v1/${this.tableName}?select=count&limit=1`,
        {
          headers: {
            'apikey': this.config.supabaseKey,
            'Authorization': `Bearer ${this.config.supabaseKey}`
          }
        }
      );

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
