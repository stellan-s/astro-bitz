import './style.css';
import { Application } from 'pixi.js';
import { Game } from './game/Game';
import { AdManager } from './game/AdManager';

const app = new Application();

async function init() {
  await app.init({
    width: 800,
    height: 900, // Increased from 700 to 900 for much more vertical play space
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
