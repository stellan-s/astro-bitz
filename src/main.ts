import './style.css';
import { Application } from 'pixi.js';
import { Game } from './game/Game';
import { AdManager } from './game/AdManager';
import { AnalyticsManager } from './game/AnalyticsManager';

const app = new Application();

async function init() {
  // Wait for viewport to stabilize on mobile (especially iOS Safari)
  await new Promise(resolve => setTimeout(resolve, 100));

  // Calculate canvas size to maximize available viewport space
  // Account for ad space, padding, borders, and box shadows
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  // Get actual game container dimensions after CSS layout
  const gameContainer = document.getElementById('game-container');
  let availableWidth = window.innerWidth;
  let availableHeight = window.innerHeight;

  if (gameContainer) {
    const rect = gameContainer.getBoundingClientRect();
    availableWidth = rect.width;
    availableHeight = rect.height;
  } else {
    // Fallback calculation if container not ready
    const adHeight = isMobile ? 40 : 50;
    const adPadding = 2;
    const adBorders = 4; // 2px borders
    const containerPadding = isMobile ? 4 : 10; // 2px or 5px per side
    const totalOverhead = (adHeight + adPadding + adBorders) * 2 + containerPadding;
    availableHeight = window.innerHeight - totalOverhead;
    availableWidth = window.innerWidth - containerPadding;
  }

  // Calculate canvas dimensions
  let canvasWidth: number;
  let canvasHeight: number;

  if (isMobile) {
    // Mobile: calculate dimensions to match available space aspect ratio
    // This prevents stretching by matching the container's aspect ratio
    const availableAspect = availableWidth / availableHeight;

    // Portrait orientation (most mobile devices)
    if (availableAspect < 1) {
      canvasWidth = Math.floor(availableWidth);
      canvasHeight = Math.floor(availableHeight);
    } else {
      // Landscape: maintain reasonable aspect ratio
      canvasWidth = Math.floor(availableWidth);
      canvasHeight = Math.floor(availableHeight);
    }
  } else {
    // Desktop: use fixed dimensions with aspect ratio
    canvasWidth = 800;
    canvasHeight = Math.max(700, Math.min(availableHeight - 20, 1400));
  }

  console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}px, Container: ${availableWidth}x${availableHeight}px, Canvas: ${canvasWidth}x${canvasHeight}px`);

  await app.init({
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor: 0x1a1a2e,
    antialias: !isMobile, // Disable on mobile to save 30-50% GPU usage
  });

  if (gameContainer) {
    gameContainer.appendChild(app.canvas as HTMLCanvasElement);
  }

  // Initialize Analytics (instantiates singleton)
  AnalyticsManager.getInstance();

  // Initialize Google AdSense
  const adManager = AdManager.getInstance();

  // Wait a bit for the page to load before initializing ads
  setTimeout(() => {
    adManager.initialize();
  }, 1000);

  const game = new Game(app);
  game.start();
}

init();
