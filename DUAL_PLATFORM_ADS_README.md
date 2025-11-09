# Dual Platform Ads - Web & Mobile

This guide shows how to implement ads that work on both web (AdSense) and mobile (AdMob).

## Strategy Overview

- **Web (Browser):** Use Google AdSense (HTML/JavaScript)
- **Mobile (App):** Use AdMob via Cordova plugin
- **Unified Interface:** Single AdManager that detects platform

## Step 1: Set Up AdSense (Web)

### Get AdSense Account

1. Go to https://www.google.com/adsense/
2. Sign up with your Google account
3. Add your website
4. Wait for approval (can take days/weeks)

### Get Ad Code

1. In AdSense dashboard, click "Ads" → "By ad unit"
2. Create "Display ads" for each position:
   - **Top Banner:** 320x50 or Responsive
   - **Bottom Banner:** 320x50 or Responsive
   - **Sidebar (Desktop):** 160x600 or 300x250

3. Copy the ad code for each unit (looks like):
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="YYYYYYYYYY"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

## Step 2: Update HTML for Web Ads

Update `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>Astro Bitz</title>

    <!-- AdSense - Only loads on web, ignored in Cordova -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
         crossorigin="anonymous"></script>
  </head>
  <body>
    <!-- Top Banner Ad -->
    <div class="ad-container ad-top">
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="YYYYYYYYYY"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>

    <!-- Game Wrapper -->
    <div id="game-wrapper">
      <!-- Left Sidebar Ad (Desktop only) -->
      <div class="ad-container ad-sidebar ad-left">
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot="ZZZZZZZZZZ"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>

      <!-- Game Container -->
      <div id="game-container"></div>

      <!-- Right Sidebar Ad (Desktop only) -->
      <div class="ad-container ad-sidebar ad-right">
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot="AAAAAAAAAA"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>

    <!-- Bottom Banner Ad -->
    <div class="ad-container ad-bottom">
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="BBBBBBBBBB"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>

    <script type="module" src="/src/main.ts"></script>

    <!-- Cordova script (only loads in app, 404 in browser is fine) -->
    <script src="cordova.js"></script>

    <!-- Initialize AdSense ads (web only) -->
    <script>
      // Only run AdSense if not in Cordova
      if (!window.cordova) {
        (adsbygoogle = window.adsbygoogle || []).push({});
        (adsbygoogle = window.adsbygoogle || []).push({});
        (adsbygoogle = window.adsbygoogle || []).push({});
        (adsbygoogle = window.adsbygoogle || []).push({});
      }
    </script>
  </body>
</html>
```

## Step 3: Keep Your Current CSS

Your `style.css` already has good styles for web ads! Keep them:

```css
/* Ad Container Styling */
.ad-container {
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px;
  overflow: hidden;
  flex-shrink: 0;
}

.ad-top {
  width: 100%;
  height: 50px;
  border-bottom: 2px solid rgba(0, 255, 255, 0.3);
}

.ad-bottom {
  width: 100%;
  height: 50px;
  border-top: 2px solid rgba(0, 255, 255, 0.3);
}

.ad-sidebar {
  width: 160px;
  min-width: 160px;
  display: none;
}

@media (min-width: 1200px) {
  .ad-sidebar {
    display: flex;
  }
}

/* AdSense responsive units */
.adsbygoogle {
  display: block;
  max-height: 100%;
  overflow: hidden;
}
```

## Step 4: Create Unified AdManager

Create `src/game/AdManager.ts`:

```typescript
export class AdManager {
  private isCordova: boolean;
  private isInitialized: boolean = false;

  // AdMob IDs (mobile)
  private admobAppId: string = 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY';
  private admobBannerTopId: string = 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY';
  private admobBannerBottomId: string = 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ';
  private admobInterstitialId: string = 'ca-app-pub-XXXXXXXXXXXXXXXX/AAAAAAAAAA';

  constructor() {
    // Detect if running in Cordova
    this.isCordova = !!window.cordova;

    if (this.isCordova) {
      // Wait for Cordova deviceready event
      document.addEventListener('deviceready', () => {
        this.initializeMobile();
      }, false);
    } else {
      // Web - AdSense is already loaded via HTML
      this.initializeWeb();
    }
  }

  private initializeWeb(): void {
    console.log('AdManager: Running on Web, using AdSense');
    this.isInitialized = true;

    // AdSense ads are automatically loaded via HTML
    // Just need to hide the ad containers on mobile layouts
  }

  private async initializeMobile(): Promise<void> {
    console.log('AdManager: Running on Mobile, using AdMob');

    if (!window.admob) {
      console.error('AdMob plugin not found!');
      return;
    }

    try {
      // Hide web ad containers
      this.hideWebAds();

      // Initialize AdMob
      await window.admob.start();
      this.isInitialized = true;

      // Show mobile banner ads
      await this.showMobileBannerTop();
      await this.showMobileBannerBottom();

      // Preload interstitial
      await this.preloadInterstitial();

      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
    }
  }

  private hideWebAds(): void {
    // Hide AdSense ad containers when in mobile app
    const adContainers = document.querySelectorAll('.ad-container');
    adContainers.forEach(container => {
      (container as HTMLElement).style.display = 'none';
    });
  }

  private async showMobileBannerTop(): Promise<void> {
    if (!this.isCordova || !this.isInitialized) return;

    try {
      await window.admob.banner.show({
        id: this.admobBannerTopId,
        position: 'top',
        size: 'BANNER',
      });
    } catch (error) {
      console.error('Failed to show top banner:', error);
    }
  }

  private async showMobileBannerBottom(): Promise<void> {
    if (!this.isCordova || !this.isInitialized) return;

    try {
      await window.admob.banner.show({
        id: this.admobBannerBottomId,
        position: 'bottom',
        size: 'BANNER',
      });
    } catch (error) {
      console.error('Failed to show bottom banner:', error);
    }
  }

  public async showInterstitial(): Promise<void> {
    if (!this.isInitialized) return;

    if (this.isCordova) {
      // Mobile - Show AdMob interstitial
      try {
        await window.admob.interstitial.show();
        // Preload next one
        await this.preloadInterstitial();
      } catch (error) {
        console.error('Failed to show interstitial:', error);
      }
    } else {
      // Web - Could implement AdSense overlay or skip
      console.log('Web interstitial not implemented');
    }
  }

  public async preloadInterstitial(): Promise<void> {
    if (!this.isCordova || !this.isInitialized) return;

    try {
      await window.admob.interstitial.load({
        id: this.admobInterstitialId,
      });
    } catch (error) {
      console.error('Failed to preload interstitial:', error);
    }
  }

  public isPlatformCordova(): boolean {
    return this.isCordova;
  }
}

// Type definitions
declare global {
  interface Window {
    admob: any;
    cordova: any;
  }
}
```

## Step 5: Integrate with Game

Update `src/game/Game.ts`:

```typescript
import { AdManager } from './AdManager';

export class Game {
  private adManager: AdManager;

  constructor(app: Application) {
    // ... existing code ...

    // Initialize unified ad manager
    this.adManager = new AdManager();
  }

  private gameOver(): void {
    this.gameState = 'gameover';

    // Show interstitial every 3rd game over
    if (this.gamesPlayed % 3 === 0) {
      this.adManager.showInterstitial();
    }

    this.gamesPlayed++;
  }
}
```

## Step 6: Install AdMob Plugin (Mobile Only)

```bash
cd cordova-app
cordova plugin add cordova-admob-plus
```

## Step 7: Build for Both Platforms

### For Web:
```bash
npm run build
# Deploy dist/ folder to your web host
```

### For Mobile:
```bash
npm run build
cp -r dist/* cordova-app/www/
cd cordova-app
cordova build android
# or
cordova build ios
```

## Testing

### Test Web (AdSense):
```bash
npm run dev
```
- Ads won't show until approved by AdSense
- You'll see blank spaces where ads will appear
- Check browser console for AdSense errors

### Test Mobile (AdMob):
```bash
cd cordova-app
cordova run android
```
- Use test ad IDs during development
- Real ads will show once AdMob account is approved

## Platform Detection Flow

```
User Opens App
      ↓
  Is Cordova?
   ↙        ↘
 YES         NO
  ↓           ↓
AdMob      AdSense
(Mobile)    (Web)
  ↓           ↓
Native     HTML/JS
Overlay     in DOM
```

## Test Ad IDs (Development)

Replace real IDs with test IDs during development:

```typescript
// TEST MODE - AdMob
private admobBannerTopId = 'ca-app-pub-3940256099942544/6300978111';
private admobBannerBottomId = 'ca-app-pub-3940256099942544/6300978111';
private admobInterstitialId = 'ca-app-pub-3940256099942544/1033173712';
```

For AdSense, use your test mode in the dashboard.

## Build Script Update

Update `build-cordova.sh` to handle both:

```bash
#!/bin/bash

echo "🎮 Building Astro Bitz..."

# Build the web app
echo "📦 Building web app..."
npm run build

# Copy to Cordova for mobile
echo "📱 Copying to Cordova..."
rm -rf cordova-app/www/*
cp -r dist/* cordova-app/www/

echo "✅ Build complete!"
echo ""
echo "For WEB: Deploy dist/ folder to your hosting"
echo "For MOBILE: cd cordova-app && cordova build android/ios"
```

## Deployment Checklist

### Web Deployment
- [ ] Replace AdSense test IDs with real IDs
- [ ] Upload `dist/` to web server
- [ ] Verify AdSense ads appear (may take hours)
- [ ] Test on mobile browser

### Mobile Deployment
- [ ] Replace AdMob test IDs with real IDs
- [ ] Build with `cordova build --release`
- [ ] Test on real device
- [ ] Submit to App Store / Google Play

## Revenue Comparison

| Platform | Ad Type | Typical CPM | Notes |
|----------|---------|-------------|-------|
| Web (AdSense) | Banner | $0.50-$3 | Lower but wide reach |
| Web (AdSense) | Display | $1-$5 | Better for desktop |
| Mobile (AdMob) | Banner | $1-$10 | Higher engagement |
| Mobile (AdMob) | Interstitial | $5-$20 | Best revenue |

## Troubleshooting

### Ads Don't Show on Web
- AdSense approval pending
- Ad blocker active
- Check browser console
- Verify ad codes in HTML

### Ads Don't Show on Mobile
- AdMob plugin not installed
- Using production IDs too soon
- Device offline
- Account not approved

### Ads Show on Web But Not Mobile
- AdMob plugin missing
- Wrong platform detection
- Check `window.cordova` exists

## Best Practices

1. **Test extensively** - Both platforms separately
2. **Use test IDs** - Until ready to publish
3. **Monitor performance** - Different revenue per platform
4. **Don't spam** - Too many ads = bad UX
5. **Loading states** - Show placeholder while ads load

## Resources

- AdSense: https://www.google.com/adsense/
- AdMob: https://admob.google.com/
- AdMob Plus Plugin: https://github.com/admob-plus/admob-plus
- Testing: Use separate test accounts

Your game now works perfectly on both web and mobile with appropriate ads for each platform! 🎮💰
