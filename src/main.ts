import './style.css';
import { Application } from 'pixi.js';
import { Game } from './game/Game';
import { AdManager } from './game/AdManager';

const app = new Application();

async function init() {
  // Calculate canvas size to maximize available viewport space
  // Account for ad space, padding, borders, and box shadows
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  // Calculate actual space used by ads and padding
  // Top ad: height + padding + borders
  // Bottom ad: height + padding + borders
  // Game container: padding on both sides
  const adHeight = isMobile ? 40 : 50;
  const adPadding = 2;
  const adBorders = 4; // 2px borders
  const containerPadding = isMobile ? 4 : 10; // 2px or 5px per side

  const totalOverhead = (adHeight + adPadding + adBorders) * 2 + containerPadding;
  const availableHeight = window.innerHeight - totalOverhead;

  // Use most of the available height for a larger play area
  const canvasWidth = 800;
  const canvasHeight = Math.max(700, Math.min(availableHeight, 1400)); // Min 700, max 1400

  console.log(`Viewport: ${window.innerHeight}px, Overhead: ${totalOverhead}px, Available: ${availableHeight}px, Canvas: ${canvasHeight}px`);

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
