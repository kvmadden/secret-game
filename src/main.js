/**
 * Entry point - initializes the game.
 */

import { Game } from './game.js';
import { SpriteSheets } from './spritesheet.js';

// Wait for DOM
document.addEventListener('DOMContentLoaded', async () => {
  // Load sprite sheets (non-blocking — programmatic sprites used as fallback)
  SpriteSheets.load();

  const canvas = document.getElementById('pharmacy-canvas');
  const game = new Game(canvas);

  // Show title screen
  game.ui.showTitle();

  // Prevent default touch behaviors on the game container
  document.getElementById('game-container').addEventListener('touchmove', (e) => {
    // Allow scrolling in action zone
    if (e.target.closest('#action-zone')) return;
    e.preventDefault();
  }, { passive: false });
});
