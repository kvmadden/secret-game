/**
 * Entry point - initializes the game.
 */

import { Game } from './game.js';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
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
