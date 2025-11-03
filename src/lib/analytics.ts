/**
 * Anonymous Analytics Client
 * Privacy-first analytics tracking without PII
 */

export interface AnalyticsConfig {
  endpoint: string;
  appName: string;
  apiKey?: string;
  debug?: boolean;
  disabled?: boolean;
}

export interface TrackEventParams {
  eventType: string;
  eventName: string;
  properties?: Record<string, any>;
}

interface DeviceInfo {
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  timezone: string;
  language: string;
}

export class Analytics {
  private config: AnalyticsConfig;
  private anonymousId: string;
  private sessionId: string;
  private sessionStartTime: number;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionStartTime = Date.now();

    // Generate or retrieve anonymous ID (persists across sessions)
    this.anonymousId = this.getOrCreateAnonymousId();

    // Generate session ID (unique per session)
    this.sessionId = this.generateSessionId();

    if (this.config.debug) {
      console.log('[Analytics] Initialized', {
        appName: this.config.appName,
        anonymousId: this.anonymousId,
        sessionId: this.sessionId
      });
    }
  }

  /**
   * Track a custom event
   */
  public async track(params: TrackEventParams): Promise<void> {
    if (this.config.disabled) return;

    const event = {
      app: this.config.appName,
      eventType: params.eventType,
      eventName: params.eventName,
      properties: this.sanitizeProperties(params.properties || {}),
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,
      sessionDuration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
      device: this.getDeviceInfo(),
      referrer: this.getReferrer(),
      userAgent: navigator.userAgent
    };

    if (this.config.debug) {
      console.log('[Analytics] Track:', event);
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if API key is provided
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (this.config.debug) {
        console.log('[Analytics] Event sent successfully');
      }
    } catch (error) {
      console.error('[Analytics] Failed to send event:', error);
    }
  }

  /**
   * Track a page view
   */
  public async pageView(pageName: string, properties?: Record<string, any>): Promise<void> {
    return this.track({
      eventType: 'page_view',
      eventName: pageName,
      properties
    });
  }

  /**
   * Track a user interaction (click, tap, etc.)
   */
  public async click(elementName: string, properties?: Record<string, any>): Promise<void> {
    return this.track({
      eventType: 'interaction',
      eventName: elementName,
      properties
    });
  }

  /**
   * Track a conversion event (goal achieved)
   */
  public async conversion(eventName: string, properties?: Record<string, any>): Promise<void> {
    return this.track({
      eventType: 'conversion',
      eventName: eventName,
      properties
    });
  }

  /**
   * Setup automatic tracking for page views and clicks
   */
  public setupAutoTracking(): void {
    // Track initial page view
    this.pageView(window.location.pathname);

    // Track clicks on elements with data-analytics attribute
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const analyticsData = target.getAttribute('data-analytics');

      if (analyticsData) {
        try {
          const parsed = JSON.parse(analyticsData);
          this.click(parsed.element || analyticsData, parsed.properties);
        } catch {
          // If not JSON, treat as simple element name
          this.click(analyticsData);
        }
      }
    });

    if (this.config.debug) {
      console.log('[Analytics] Auto-tracking enabled');
    }
  }

  /**
   * Get or create anonymous ID (stored in localStorage)
   */
  private getOrCreateAnonymousId(): string {
    const storageKey = `analytics_anonymous_id_${this.config.appName}`;
    let id = localStorage.getItem(storageKey);

    if (!id) {
      id = this.generateUUID();
      localStorage.setItem(storageKey, id);
    }

    return id;
  }

  /**
   * Generate a session ID
   */
  private generateSessionId(): string {
    return `${this.generateUUID()}_${Date.now()}`;
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
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    const width = window.innerWidth;
    const deviceType = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

    return {
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      deviceType,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  /**
   * Get referrer (domain only, for privacy)
   */
  private getReferrer(): string | null {
    if (!document.referrer) return null;

    try {
      const url = new URL(document.referrer);
      return url.hostname;
    } catch {
      return null;
    }
  }

  /**
   * Sanitize properties to remove PII
   */
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const piiFields = ['email', 'phone', 'name', 'address', 'ip', 'user_id', 'userId', 'username'];

    for (const [key, value] of Object.entries(properties)) {
      // Skip PII fields
      if (piiFields.includes(key.toLowerCase())) {
        continue;
      }

      // Remove email patterns from strings
      if (typeof value === 'string' && this.looksLikeEmail(value)) {
        continue;
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  /**
   * Check if a string looks like an email
   */
  private looksLikeEmail(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }
}

/**
 * Create an analytics instance
 */
export function createAnalytics(config: AnalyticsConfig): Analytics {
  return new Analytics(config);
}
