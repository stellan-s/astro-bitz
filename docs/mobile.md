# Building Astro Bitz as a Mobile App

Your game is now set up with Cordova! Here's how to build and deploy it.

## Quick Start

### Option 1: Use the build script
```bash
./build-cordova.sh
```

### Option 2: Manual steps
```bash
# Build the game
npm run build

# Copy to Cordova
rm -rf cordova-app/www/*
cp -r dist/* cordova-app/www/

# Navigate to Cordova directory
cd cordova-app
```

## Building for Platforms

### Android

**Prerequisites:**
- Android Studio installed
- Android SDK installed
- Java Development Kit (JDK) 17 or higher

**Build:**
```bash
cd cordova-app
cordova build android
```

**Run on device:**
```bash
cordova run android
```

**Create release APK:**
```bash
cordova build android --release
```

The APK will be at: `cordova-app/platforms/android/app/build/outputs/apk/release/`

### iOS

**Prerequisites:**
- macOS with Xcode installed
- iOS development certificate
- Provisioning profile

**Build:**
```bash
cd cordova-app
cordova build ios
```

**Open in Xcode:**
```bash
open platforms/ios/Astro\ Bitz.xcworkspace
```

Then build and run from Xcode.

## Configuration

Edit `cordova-app/config.xml` to customize:
- App ID: `com.astroblitz.game`
- App name: `Astro Bitz`

The legacy `com.astroblitz.game` identifier is intentionally retained so existing mobile builds continue to share the same application identity.
- Version: `1.0.0`
- Author information
- Platform-specific settings

## Current Settings

- **Orientation:** Portrait only
- **Fullscreen:** Enabled
- **Background color:** Dark blue (#1a1a2e)
- **Min Android SDK:** 24 (Android 7.0)
- **Target Android SDK:** 35 (Android 15)

## Testing

**Browser testing (before building):**
```bash
cd cordova-app
cordova serve
```

Then open http://localhost:8000

## Adding Plugins

If you need additional Cordova plugins (e.g., ads, in-app purchases):

```bash
cd cordova-app
cordova plugin add cordova-plugin-name
```

Common plugins:
- `cordova-plugin-statusbar` - Status bar control
- `cordova-plugin-screen-orientation` - Lock orientation
- `cordova-plugin-splashscreen` - Splash screen
- `cordova-plugin-admob-free` - AdMob ads

## Workflow for Updates

1. Make changes to your game code
2. Run `npm run build` (or use `./build-cordova.sh`)
3. Copy to Cordova: `cp -r dist/* cordova-app/www/`
4. Build for platform: `cd cordova-app && cordova build android`
5. Test on device: `cordova run android`

## Troubleshooting

**"cordova: command not found"**
```bash
npm install -g cordova
```

**Android build fails:**
- Check Android Studio is installed
- Verify ANDROID_HOME environment variable is set
- Run `cordova requirements android`

**iOS build fails:**
- Make sure you're on macOS
- Install Xcode from App Store
- Run `cordova requirements ios`

## Next Steps

1. Customize the package ID in `config.xml` (currently `com.astroblitz.game`)
2. Add app icons and splash screens to `cordova-app/res/`
3. Configure signing for release builds
4. Test on real devices
5. Submit to App Store / Google Play Store

## File Structure

```
king_shot_clone/
├── src/                  # Your game source code
├── dist/                 # Built web app (created by 'npm run build')
├── cordova-app/          # Cordova project
│   ├── www/              # Your game files (copied from dist/)
│   ├── platforms/        # Platform-specific code (generated)
│   │   ├── android/
│   │   └── ios/
│   ├── plugins/          # Cordova plugins
│   └── config.xml        # App configuration
└── build-cordova.sh      # Convenience script
```

Good luck with your mobile app! 🚀
