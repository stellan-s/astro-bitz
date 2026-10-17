/**
 * Anonymous Analytics Client
 * Privacy-first analytics tracking without PII
 */

export interface AnalyticsConfig {
  endpoint: string;
  appName: string;
  debug?: boolean;
  disabled?: boolean;
}

export interface TrackEventParams {
  eventType: string;
  eventName: string;
  properties?: Record<string, any>;
}

export class Analytics {
  private config: AnalyticsConfig;
  private sessionId: string;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionId = this.getOrCreateSessionId();

    if (this.config.debug) {
      console.log('[Analytics] Initialized', {
        appName: this.config.appName,
        sessionId: this.sessionId
      });
    }
  }

  /**
   * Track a custom event
   */
  public async track(params: TrackEventParams): Promise<void> {
    if (this.config.disabled || this.privacySignalEnabled()) return;

    const event = {
      app: this.config.appName,
      eventType: params.eventType,
      eventName: params.eventName,
      properties: this.sanitizeProperties(params.properties || {}),
      anonymousId: this.sessionId,
      sessionId: this.sessionId,
      pathname: window.location.pathname,
      referrer: this.getReferrer(),
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    if (this.config.debug) {
      console.log('[Analytics] Track:', event);
    }

    try {
      const response = await fetch(this.analyticsEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true
      });

      if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${responseBody || response.statusText}`);
      }

      if (this.config.debug) {
        console.log('[Analytics] Event sent successfully');
      }
    } catch (error) {
      if (this.config.debug) {
        console.warn('[Analytics] Failed to send event:', error);
      }
    }
  }

  private analyticsEndpoint(): string {
    const endpoint = new URL(this.config.endpoint, window.location.href);
    endpoint.searchParams.set('forceFunctionRegion', 'eu-central-1');
    return endpoint.toString();
  }

  private privacySignalEnabled(): boolean {
    const privacyNavigator = navigator as Navigator & {
      globalPrivacyControl?: boolean;
    };
    return navigator.doNotTrack === '1'
      || privacyNavigator.globalPrivacyControl === true;
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
   * Get or create a session ID (stored for the lifetime of the browser tab)
   */
  private getOrCreateSessionId(): string {
    const storageKey = `analytics_session_id_${this.config.appName}`;
    let id = sessionStorage.getItem(storageKey);

    if (!id) {
      id = this.generateUUID();
      sessionStorage.setItem(storageKey, id);
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
   * Get referrer origin. The service reduces this to the domain before storage.
   */
  private getReferrer(): string | null {
    if (!document.referrer) return null;

    try {
      const url = new URL(document.referrer);
      return url.origin;
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
