/**
 * HighScoreManager - Manages high score persistence using localStorage
 */

export class HighScoreManager {
  private static readonly STORAGE_KEY = 'kingshot_highscore';

  /**
   * Get the current high score
   */
  public static getHighScore(): number {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.warn('Failed to load high score:', error);
      return 0;
    }
  }

  /**
   * Save a new high score if it's higher than the current one
   * Returns true if a new high score was set
   */
  public static saveHighScore(score: number): boolean {
    try {
      const currentHighScore = this.getHighScore();
      if (score > currentHighScore) {
        localStorage.setItem(this.STORAGE_KEY, score.toString());
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to save high score:', error);
      return false;
    }
  }

  /**
   * Reset the high score (for testing)
   */
  public static resetHighScore(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to reset high score:', error);
    }
  }
}
