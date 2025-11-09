# Astro Bitz - Complete Deployment Guide

Your game is set up for **both web and mobile** deployment! 🎮

## Quick Overview

- **Web Version:** Uses AdSense, deployed to any web server
- **Mobile Version:** Uses AdMob, built with Cordova for iOS/Android
- **Unified Codebase:** Same game code works on both platforms

## Build Commands

### Build for Web
```bash
npm run build
# Output: dist/ folder ready to deploy
```

### Build for Mobile
```bash
./build-cordova.sh
# Then: cd cordova-app && cordova build android
```

## Deployment Paths

### 🌐 Web Deployment

1. **Build the game:**
   ```bash
   npm run build
   ```

2. **Deploy `dist/` folder to:**
   - GitHub Pages
   - Netlify
   - Vercel
   - Your own server
   - Any static hosting

3. **Example (GitHub Pages):**
   ```bash
   npm run build
   git add dist -f
   git commit -m "Deploy to GitHub Pages"
   git subtree push --prefix dist origin gh-pages
   ```

4. **Configure AdSense:**
   - Add your AdSense code to `index.html`
   - Ads will automatically show on web

### 📱 Mobile Deployment

1. **Build the game:**
   ```bash
   npm run build
   cp -r dist/* cordova-app/www/
   cd cordova-app
   ```

2. **Build for Android:**
   ```bash
   cordova build android --release
   # Output: platforms/android/app/build/outputs/apk/release/
   ```

3. **Build for iOS:**
   ```bash
   cordova build ios --release
   # Then open in Xcode to sign and submit
   ```

4. **Configure AdMob:**
   - Install plugin: `cordova plugin add cordova-admob-plus`
   - Add AdMob IDs to `AdManager.ts`
   - Ads will show automatically in app

## Ad Configuration

### For Web (AdSense)

Your HTML already has placeholders:
- Edit `index.html`
- Replace `ca-pub-XXXXXXXXXXXXXXXX` with your AdSense publisher ID
- Replace ad slot IDs with your ad unit IDs

### For Mobile (AdMob)

Create `src/game/AdManager.ts`:
- See `DUAL_PLATFORM_ADS_README.md` for full code
- Replace test IDs with your AdMob app and ad unit IDs
- Plugin automatically detects Cordova vs web

## Workflow for Updates

### Updating Web Version
```bash
npm run build
# Upload dist/ to your web server
```

### Updating Mobile Version
```bash
npm run build
cp -r dist/* cordova-app/www/
cd cordova-app
cordova build android --release
# Submit to Google Play Store
```

## Platform-Specific Files

```
Your Project/
├── src/                    # Game source code (SHARED)
├── dist/                   # Built web app (WEB)
├── cordova-app/            # Mobile app wrapper (MOBILE)
│   ├── www/                # Your game (copied from dist/)
│   ├── platforms/          # iOS/Android native code
│   └── config.xml          # App configuration
├── index.html              # Entry point (SHARED, with AdSense)
└── style.css               # Styles (SHARED, with ad styles)
```

## Documentation Files

- **CORDOVA_README.md** - Complete Cordova setup guide
- **ADS_README.md** - AdMob-only implementation (mobile-only approach)
- **DUAL_PLATFORM_ADS_README.md** - Unified ads for web + mobile ⭐
- **DEPLOYMENT_GUIDE.md** - This file

## Pre-Publish Checklist

### Web
- [ ] AdSense account approved
- [ ] Real AdSense IDs in `index.html`
- [ ] Test on multiple browsers
- [ ] Test on mobile browsers
- [ ] Optimize images/assets
- [ ] Configure analytics (optional)

### Mobile
- [ ] AdMob account approved
- [ ] Real AdMob IDs in `AdManager.ts`
- [ ] Test on real devices (iOS + Android)
- [ ] Create app icons (all sizes)
- [ ] Create splash screens
- [ ] Update `config.xml` (name, ID, version, author)
- [ ] Sign release builds
- [ ] Create store listings

## Store Submission

### Google Play Store (Android)

1. **Build release APK:**
   ```bash
   cd cordova-app
   cordova build android --release
   ```

2. **Sign the APK:**
   ```bash
   # Generate keystore (first time only)
   keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

   # Sign APK
   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk alias_name

   # Align APK
   zipalign -v 4 app-release-unsigned.apk AstroBitz.apk
   ```

3. **Upload to Google Play Console:**
   - https://play.google.com/console
   - Create new app
   - Upload APK/AAB
   - Fill in store listing
   - Submit for review

### Apple App Store (iOS)

1. **Build in Xcode:**
   ```bash
   cd cordova-app
   cordova build ios
   open platforms/ios/Astro\ Bitz.xcworkspace
   ```

2. **In Xcode:**
   - Select "Any iOS Device"
   - Product → Archive
   - Distribute to App Store

3. **Upload to App Store Connect:**
   - https://appstoreconnect.apple.com/
   - Create new app
   - Upload build
   - Fill in app information
   - Submit for review

## Analytics (Optional)

Add Google Analytics for web:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

For mobile, add Firebase Analytics:
```bash
cd cordova-app
cordova plugin add cordova-plugin-firebase-analytics
```

## Cost Comparison

### Web Hosting (Free Options)
- GitHub Pages: Free
- Netlify: Free tier available
- Vercel: Free tier available
- Firebase Hosting: Free tier (10GB/month)

### Mobile
- Google Play: $25 one-time fee
- Apple App Store: $99/year
- Both: Allow unlimited app updates

## Revenue Potential

Based on typical metrics:

### Web (AdSense)
- 1000 players/day × 5 sessions × 4 ad views × $0.001 = **~$20/day**

### Mobile (AdMob)
- 1000 players/day × 3 sessions × 2 interstitials × $0.01 = **~$60/day**

*Actual revenue varies greatly based on geography, game quality, and engagement.*

## Support & Resources

- Cordova Docs: https://cordova.apache.org/docs/en/latest/
- AdSense Help: https://support.google.com/adsense/
- AdMob Help: https://support.google.com/admob/
- Vite Docs: https://vitejs.dev/
- PixiJS Docs: https://pixijs.com/

## Need Help?

Check the README files for detailed guides:
- Setting up ads: `DUAL_PLATFORM_ADS_README.md`
- Cordova setup: `CORDOVA_README.md`
- Mobile-only ads: `ADS_README.md`

Good luck with your game! 🚀
