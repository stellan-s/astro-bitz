/**
 * AdManager - Handles Google AdSense integration
 *
 * IMPORTANT: Before deploying, you need to:
 * 1. Replace 'ca-pub-XXXXXXXXXXXXXXXX' with your actual AdSense publisher ID
 * 2. Replace ad slot IDs with your actual slot IDs from AdSense dashboard
 * 3. Get approval from Google AdSense for your site
 */

export class AdManager {
  private static instance: AdManager;
  private adsInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  /**
   * Initialize Google AdSense
   * Call this once when the game starts
   */
  public initialize(): void {
    if (this.adsInitialized) return;

    // Check if AdSense script is loaded
    if (typeof (window as any).adsbygoogle === 'undefined') {
      console.warn('AdSense script not loaded. Ads will not display.');
      return;
    }

    // Initialize all ad slots
    this.initializeAdSlots();
    this.adsInitialized = true;
  }

  /**
   * Initialize all ad slots on the page
   */
  private initializeAdSlots(): void {
    const adSlots = document.querySelectorAll('.adsbygoogle');

    adSlots.forEach((adSlot) => {
      try {
        // Only initialize if not already initialized
        if (!adSlot.getAttribute('data-adsbygoogle-status')) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error('Error initializing ad slot:', error);
      }
    });
  }

  /**
   * Show/hide ads based on game state
   * Call this to hide ads during important gameplay moments
   */
  public setAdsVisibility(visible: boolean): void {
    const adContainers = document.querySelectorAll('.ad-container');
    adContainers.forEach((container) => {
      (container as HTMLElement).style.opacity = visible ? '1' : '0.3';
    });
  }

  /**
   * Refresh ads (use sparingly, Google has limits on refresh rates)
   */
  public refreshAds(): void {
    // Note: Auto-refreshing ads may violate Google's policies
    // Only use this in appropriate contexts (e.g., between game levels)
    console.log('Ad refresh requested - implement based on AdSense policies');
  }
}
