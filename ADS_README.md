# Adding Ads to Astro Bitz

This guide will help you add real ads to your mobile app using AdMob.

## Why Your Current Ads Don't Show

The "fake ad" placeholders in `index.html` are just CSS divs for development. They won't show real ads because:
1. AdSense doesn't work in Cordova apps (it's for websites only)
2. Mobile apps need AdMob (Google's mobile advertising platform)
3. Requires native plugins to display ads

## Setting Up AdMob

### Step 1: Create AdMob Account

1. Go to https://admob.google.com/
2. Sign in with your Google account
3. Click "Get Started" or "Apps" → "Add App"
4. Register your app:
   - **Platform:** iOS / Android
   - **App name:** Astro Bitz
   - **Is your app listed on Google Play or App Store?** No (not yet)

### Step 2: Create Ad Units

After registering your app, create ad units for each ad position:

#### Banner Ads (Top & Bottom)
1. Click "Ad units" → "Add ad unit"
2. Select "Banner"
3. Name it: "Top Banner" / "Bottom Banner"
4. Save and copy the **Ad Unit ID** (looks like `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`)

#### Interstitial Ads (Optional - Full Screen)
1. "Add ad unit" → "Interstitial"
2. Name: "Game Over Ad"
3. Save and copy Ad Unit ID

#### Rewarded Ads (Optional - Watch for Extra Lives)
1. "Add ad unit" → "Rewarded"
2. Name: "Extra Life Reward"
3. Save and copy Ad Unit ID

### Step 3: Install AdMob Plugin

```bash
cd cordova-app

# Install the AdMob Pro plugin (recommended)
cordova plugin add cordova-admob-plus --save

# Or use cordova-plugin-admob-free (alternative)
# cordova plugin add cordova-plugin-admob-free --save
```

### Step 4: Update Your Code

#### Option A: Using cordova-admob-plus (Recommended)

Create a new file: `src/game/AdManager.ts`

```typescript
export class AdManager {
  private appId: string;
  private bannerTopId: string;
  private bannerBottomId: string;
  private interstitialId: string;
  private isInitialized: boolean = false;

  constructor() {
    // Replace with your actual AdMob IDs
    this.appId = 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY';
    this.bannerTopId = 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY';
    this.bannerBottomId = 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY';
    this.interstitialId = 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY';
  }

  public async initialize(): Promise<void> {
    if (!window.admob) {
      console.warn('AdMob not available - running in browser?');
      return;
    }

    try {
      await window.admob.start();
      this.isInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
    }
  }

  public async showBannerTop(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await window.admob.banner.show({
        id: this.bannerTopId,
        position: 'top',
        size: 'BANNER', // 320x50
      });
    } catch (error) {
      console.error('Failed to show top banner:', error);
    }
  }

  public async showBannerBottom(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await window.admob.banner.show({
        id: this.bannerBottomId,
        position: 'bottom',
        size: 'BANNER', // 320x50
      });
    } catch (error) {
      console.error('Failed to show bottom banner:', error);
    }
  }

  public async hideBanners(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await window.admob.banner.hide();
    } catch (error) {
      console.error('Failed to hide banners:', error);
    }
  }

  public async showInterstitial(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Load the ad
      await window.admob.interstitial.load({
        id: this.interstitialId,
      });

      // Show when loaded
      await window.admob.interstitial.show();
    } catch (error) {
      console.error('Failed to show interstitial:', error);
    }
  }

  public async preloadInterstitial(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await window.admob.interstitial.load({
        id: this.interstitialId,
      });
    } catch (error) {
      console.error('Failed to preload interstitial:', error);
    }
  }
}

// Type definitions for TypeScript
declare global {
  interface Window {
    admob: any;
  }
}
```

#### Update Your Game Class

In `src/game/Game.ts`, add:

```typescript
import { AdManager } from './AdManager';

export class Game {
  // ... existing properties ...
  private adManager: AdManager;

  constructor(app: Application) {
    // ... existing code ...

    // Initialize ads
    this.adManager = new AdManager();

    // Wait for device ready (Cordova)
    document.addEventListener('deviceready', () => {
      this.initializeAds();
    }, false);
  }

  private async initializeAds(): Promise<void> {
    await this.adManager.initialize();

    // Show banner ads
    await this.adManager.showBannerTop();
    await this.adManager.showBannerBottom();

    // Preload interstitial for game over
    await this.adManager.preloadInterstitial();
  }

  private gameOver(): void {
    // ... existing game over code ...

    // Show interstitial ad on game over
    this.adManager.showInterstitial();

    // Preload next one
    setTimeout(() => {
      this.adManager.preloadInterstitial();
    }, 1000);
  }
}
```

### Step 5: Update HTML

Remove the fake ad divs from `index.html` since AdMob will overlay real ads:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0" />
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <title>Astro Bitz</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>

    <!-- Cordova script (only loads in app) -->
    <script src="cordova.js"></script>
  </body>
</html>
```

### Step 6: Update CSS

Remove or update ad-related CSS in `src/style.css`:

```css
/* Remove all the .ad-container, .fake-ad styles since AdMob handles positioning */

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #1a1a2e;
  /* ... rest of your styles ... */
}

#app {
  width: 100%;
  height: 100vh;
  height: 100dvh;
}
```

### Step 7: Test Your Implementation

#### Test in Browser (No Ads)
```bash
npm run dev
```
Ads won't show in browser, but check console for "AdMob not available" message.

#### Test on Device
```bash
npm run build
cp -r dist/* cordova-app/www/
cd cordova-app
cordova run android
```

### Step 8: Configure Test Ads

**IMPORTANT:** Use test ad IDs during development!

For testing, replace your ad unit IDs with these test IDs:

```typescript
// TEST IDs - Use during development
this.bannerTopId = 'ca-app-pub-3940256099942544/6300978111'; // Test banner
this.bannerBottomId = 'ca-app-pub-3940256099942544/6300978111'; // Test banner
this.interstitialId = 'ca-app-pub-3940256099942544/1033173712'; // Test interstitial
```

**Before publishing:** Replace with your real ad unit IDs!

## Advanced Ad Strategies

### 1. Interstitial Ads on Game Over

```typescript
private gameOver(): void {
  this.gameState = 'gameover';

  // Show ad every 3rd game over
  if (this.gamesPlayed % 3 === 0) {
    this.adManager.showInterstitial();
  }

  this.gamesPlayed++;
}
```

### 2. Rewarded Ads for Extra Life

```typescript
public async watchAdForExtraLife(): Promise<boolean> {
  if (!this.isInitialized) return false;

  try {
    const result = await window.admob.rewardedVideo.show({
      id: this.rewardedId,
    });

    if (result.rewarded) {
      console.log('User earned reward!');
      return true;
    }
  } catch (error) {
    console.error('Rewarded ad failed:', error);
  }

  return false;
}
```

Then in your game:

```typescript
private async offerExtraLife(): Promise<void> {
  // Show a dialog: "Watch ad for extra life?"
  const watchedAd = await this.adManager.watchAdForExtraLife();

  if (watchedAd) {
    this.lives = 1;
    this.gameState = 'playing';
  }
}
```

### 3. Smart Banner Management

```typescript
// Hide banners during gameplay
public startGame(): void {
  this.gameState = 'playing';
  this.adManager.hideBanners();
}

// Show banners on game over
public gameOver(): void {
  this.gameState = 'gameover';
  this.adManager.showBannerTop();
  this.adManager.showBannerBottom();
}
```

## Alternative: AdMob Free Plugin

If you prefer the free plugin:

```bash
cordova plugin add cordova-plugin-admob-free
```

Usage is slightly different:

```typescript
window.admob.banner.prepare({
  adId: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
  position: window.admob.banner.POSITION.TOP,
  autoShow: true,
});
```

## Troubleshooting

### Ads Not Showing

1. **Check test mode:** Use test ad IDs first
2. **Wait 1-2 hours:** New ad units take time to activate
3. **Check device:** Use real device, not emulator
4. **Verify plugin:** Run `cordova plugin list`
5. **Check console:** Look for error messages
6. **Internet connection:** Ads require network

### Common Errors

**"Ad failed to load (error code 3)"**
- Ad unit ID is incorrect
- Account not approved yet
- Try test IDs

**"AdMob is not defined"**
- Plugin not installed
- Not running in Cordova (browser mode)
- Missing `cordova.js` script

**Ads show in test but not production**
- AdMob account needs approval (can take days)
- App needs to be published
- Not enough ad inventory

## Revenue Tips

1. **Don't show too many ads** - Users will uninstall
2. **Reward users** - Give bonuses for watching ads
3. **Time it right** - Show ads at natural breaks (game over, level complete)
4. **Use banner + interstitial** - Mix of both types
5. **Test placements** - See what works best

## Before Publishing

- [ ] Replace test ad IDs with real ones
- [ ] Remove console.log statements
- [ ] Test on multiple devices
- [ ] Check ad frequency (not too many!)
- [ ] Review AdMob policies
- [ ] Set up payment info in AdMob

## Resources

- AdMob Plugin Docs: https://github.com/admob-plus/admob-plus
- AdMob Policy: https://support.google.com/admob/answer/6128543
- Test Ad IDs: https://developers.google.com/admob/android/test-ads

Good luck with monetization! 💰
