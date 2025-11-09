import './style.css';
import { Application } from 'pixi.js';
import { Game } from './game/Game';
import { AdManager } from './game/AdManager';
import { AnalyticsManager } from './game/AnalyticsManager';

const app = new Application();

async function init() {
  try {
    // Wait for viewport to stabilize on mobile (especially iOS Safari)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Calculate canvas size to maximize available viewport space
    // Account for ad space, padding, borders, and box shadows
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

    // Get actual game container dimensions after CSS layout
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
      console.error('Game container not found! Make sure you have <div id="game-container"></div> in your HTML.');
      return;
    }

    let availableWidth = window.innerWidth;
    let availableHeight = window.innerHeight;

    const rect = gameContainer.getBoundingClientRect();
    availableWidth = rect.width;
    availableHeight = rect.height;

    // Calculate canvas dimensions
    // Always use fixed logical dimensions for consistent game world
    // CSS will scale to fit the screen
    const canvasWidth = 800;

    let canvasHeight: number;
    if (isMobile) {
      // Mobile: calculate height to match screen aspect ratio
      // This prevents black bars while keeping 800px logical width
      const availableAspect = availableWidth / availableHeight;
      canvasHeight = Math.floor(canvasWidth / availableAspect);
    } else {
      // Desktop: use flexible height based on available space
      canvasHeight = Math.max(700, Math.min(availableHeight - 20, 1400));
    }

    console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}px, Container: ${availableWidth}x${availableHeight}px, Canvas: ${canvasWidth}x${canvasHeight}px`);

    await app.init({
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 0x1a1a2e,
      antialias: !isMobile, // Disable on mobile to save 30-50% GPU usage
    });

    // Verify canvas was created
    if (!app.canvas) {
      console.error('Failed to create canvas!');
      return;
    }

    gameContainer.appendChild(app.canvas as HTMLCanvasElement);

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
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

init();
