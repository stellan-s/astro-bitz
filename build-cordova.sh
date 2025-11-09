#!/bin/bash

# Build script for Astro Bitz - Web & Mobile

echo "🎮 Building Astro Bitz..."

# Build the web app
echo "📦 Building web app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Web build complete! (dist/ folder)"
echo ""

# Ask if user wants to build for mobile too
echo "📱 Build for mobile? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "📱 Copying to Cordova..."
    rm -rf cordova-app/www/*
    cp -r dist/* cordova-app/www/

    echo "✅ Copied to cordova-app/www/"
    echo ""
    echo "Next steps for mobile:"
    echo "  cd cordova-app"
    echo "  cordova build android    # or 'cordova build ios'"
    echo "  cordova run android      # to run on device"
else
    echo ""
    echo "Skipping mobile build."
    echo ""
    echo "To build for mobile later:"
    echo "  cp -r dist/* cordova-app/www/"
    echo "  cd cordova-app"
    echo "  cordova build android"
fi

echo ""
echo "📊 Build Summary:"
echo "  Web: dist/ folder ready for deployment"
echo "  Mobile: Use cordova-app/ for iOS/Android builds"
