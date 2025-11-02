import './style.css';
import { Application } from 'pixi.js';
import { Game } from './game/Game';
import { AdManager } from './game/AdManager';

const app = new Application();

async function init() {
  // Calculate canvas size to maximize available viewport space
  // Account for ad space and padding
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  const adSpace = isMobile ? 90 : 110; // Mobile has smaller ads
  const availableHeight = window.innerHeight - adSpace;

  // Use most of the available height for a larger play area
  const canvasWidth = 800;
  const canvasHeight = Math.max(700, Math.min(availableHeight, 1400)); // Min 700, max 1400

  await app.init({
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor: 0x1a1a2e,
    antialias: true,
  });

  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.appendChild(app.canvas as HTMLCanvasElement);
  }

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
