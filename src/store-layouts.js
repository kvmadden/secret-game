/**
 * store-layouts.js - Layout modifiers for different campaign store locations.
 *
 * Each layout provides tile overrides and decoration changes that modify
 * specific areas of the base 16x20 tile map without replacing it entirely.
 */

import { TILE, MAP_COLS, MAP_ROWS } from './constants.js';

// Seeded pseudo-random for deterministic "random" crack positions per layout
function layoutRand(seed) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

// --- Layout definitions ---

const homeLayout = {
  description: 'Home store - your regular pharmacy',
  tileOverrides: [],
  decorationOverrides: [],
  removedDecorations: [],
  colorTint: null,
};

const floatLayout = {
  description: 'Unfamiliar store - nothing is where you expect',
  tileOverrides: [
    // Swap shelf positions in back area (rows 14-17): shelves and aisles inverted
    ...buildBackShelfSwaps(),
    // Move phone station area hint: put a shelf where phone usually sits
    { row: 13, col: 2, tileType: TILE.SHELF },
    { row: 13, col: 3, tileType: TILE.WORKSPACE },
    // Different counter hint: gap in counter at col 6
    { row: 7, col: 6, tileType: TILE.WORKSPACE },
    { row: 8, col: 6, tileType: TILE.WORKSPACE },
  ],
  decorationOverrides: [
    { row: 14, col: 5, spriteName: 'misplacedSign', spriteFunc: 'decorSign' },
    { row: 15, col: 9, spriteName: 'wrongLabel', spriteFunc: 'decorLabel' },
    { row: 3, col: 7, spriteName: 'unfamiliarPoster', spriteFunc: 'decorPoster' },
    { row: 10, col: 4, spriteName: 'oddBin', spriteFunc: 'decorBin' },
    { row: 16, col: 3, spriteName: 'rearrangedBox', spriteFunc: 'decorBox' },
  ],
  removedDecorations: [
    { row: 14, col: 2 }, { row: 14, col: 3 },
    { row: 15, col: 2 }, { row: 15, col: 3 },
  ],
  colorTint: null,
};

function buildBackShelfSwaps() {
  const overrides = [];
  for (let row = 14; row <= 17; row++) {
    for (let col = 0; col < 13; col++) {
      // Invert the shelf/aisle pattern: gaps become shelves, shelves become gaps
      if (col % 6 < 2) {
        overrides.push({ row, col, tileType: TILE.SHELF });
      } else if (col % 6 >= 2 && col % 6 < 4) {
        overrides.push({ row, col, tileType: TILE.WORKSPACE });
      }
      // remaining cols keep original tile
    }
  }
  return overrides;
}

const problemLayout = (() => {
  const rand = layoutRand(42);
  const crackPositions = [];
  for (let i = 0; i < 5; i++) {
    crackPositions.push({
      row: 9 + Math.floor(rand() * 5),
      col: 1 + Math.floor(rand() * 11),
      spriteName: 'crackedTile',
      spriteFunc: 'decorCrack',
    });
  }

  return {
    description: 'Problem store - overcrowded and falling apart',
    tileOverrides: [
      // Extra clutter in workspace (rows 9-13): add shelf obstacles
      { row: 9, col: 5, tileType: TILE.SHELF },
      { row: 9, col: 8, tileType: TILE.SHELF },
      { row: 11, col: 1, tileType: TILE.SHELF },
      { row: 13, col: 7, tileType: TILE.SHELF },
      { row: 13, col: 10, tileType: TILE.SHELF },
      // Overfull back shelves - fill in aisle gaps
      { row: 14, col: 0, tileType: TILE.SHELF },
      { row: 14, col: 1, tileType: TILE.SHELF },
      { row: 15, col: 0, tileType: TILE.SHELF },
      { row: 15, col: 1, tileType: TILE.SHELF },
    ],
    decorationOverrides: [
      ...crackPositions,
      { row: 7, col: 5, spriteName: 'messyCounter', spriteFunc: 'decorClutter' },
      { row: 7, col: 8, spriteName: 'messyCounter', spriteFunc: 'decorClutter' },
      { row: 8, col: 3, spriteName: 'messyCounter', spriteFunc: 'decorClutter' },
      // Extra queue ropes suggesting high volume
      { row: 3, col: 2, spriteName: 'queueRope', spriteFunc: 'decorRope' },
      { row: 3, col: 5, spriteName: 'queueRope', spriteFunc: 'decorRope' },
      { row: 4, col: 2, spriteName: 'queueRope', spriteFunc: 'decorRope' },
      { row: 4, col: 5, spriteName: 'queueRope', spriteFunc: 'decorRope' },
      { row: 10, col: 3, spriteName: 'brokenPrinter', spriteFunc: 'decorBroken' },
    ],
    removedDecorations: [],
    colorTint: null,
  };
})();

const offsiteLayout = {
  description: 'Offsite clinic - temporary vaccine setup',
  tileOverrides: [
    // Replace back area (rows 14-19) with open floor
    ...buildOffsiteFloor(),
  ],
  decorationOverrides: [
    // Folding tables
    { row: 15, col: 3, spriteName: 'foldingTable', spriteFunc: 'decorTable' },
    { row: 15, col: 7, spriteName: 'foldingTable', spriteFunc: 'decorTable' },
    { row: 15, col: 10, spriteName: 'foldingTable', spriteFunc: 'decorTable' },
    // Vaccine station marker
    { row: 16, col: 6, spriteName: 'vaccineStation', spriteFunc: 'decorVaccine' },
    { row: 16, col: 7, spriteName: 'vaccineStation', spriteFunc: 'decorVaccine' },
    // Cooler for vaccines
    { row: 17, col: 2, spriteName: 'vaccineCooler', spriteFunc: 'decorCooler' },
    { row: 17, col: 10, spriteName: 'vaccineCooler', spriteFunc: 'decorCooler' },
    // Queue ropes in clinic configuration
    { row: 14, col: 4, spriteName: 'queueRope', spriteFunc: 'decorRope' },
    { row: 14, col: 8, spriteName: 'queueRope', spriteFunc: 'decorRope' },
    { row: 18, col: 4, spriteName: 'queueRope', spriteFunc: 'decorRope' },
    { row: 18, col: 8, spriteName: 'queueRope', spriteFunc: 'decorRope' },
    // Makeshift signage
    { row: 14, col: 6, spriteName: 'clinicSign', spriteFunc: 'decorSign' },
  ],
  removedDecorations: [
    // Clear all default back-area decorations
    ...buildOffsiteRemovals(),
  ],
  colorTint: null,
};

function buildOffsiteFloor() {
  const overrides = [];
  for (let row = 14; row <= 19; row++) {
    for (let col = 0; col < 14; col++) {
      overrides.push({ row, col, tileType: TILE.FLOOR });
    }
  }
  return overrides;
}

function buildOffsiteRemovals() {
  const removals = [];
  for (let row = 14; row <= 19; row++) {
    for (let col = 0; col < 14; col++) {
      removals.push({ row, col });
    }
  }
  return removals;
}

const overnightLayout = {
  description: 'Overnight shift - dim lights, locked entrances',
  tileOverrides: [
    // Closed gate on drive-thru (block the window)
    { row: 12, col: 13, tileType: TILE.HALF_WALL },
  ],
  decorationOverrides: [
    // Emergency exit sign glows green
    { row: 18, col: 6, spriteName: 'exitSignGlow', spriteFunc: 'decorExitSign' },
    // Security desk near entrance
    { row: 2, col: 1, spriteName: 'securityDesk', spriteFunc: 'decorDesk' },
    { row: 2, col: 2, spriteName: 'securityMonitor', spriteFunc: 'decorMonitor' },
    // Shadow hints on shelves
    { row: 14, col: 4, spriteName: 'shelfShadow', spriteFunc: 'decorShadow' },
    { row: 14, col: 8, spriteName: 'shelfShadow', spriteFunc: 'decorShadow' },
    { row: 15, col: 4, spriteName: 'shelfShadow', spriteFunc: 'decorShadow' },
    { row: 15, col: 8, spriteName: 'shelfShadow', spriteFunc: 'decorShadow' },
    // Closed gate decoration on drive-thru
    { row: 11, col: 13, spriteName: 'closedGate', spriteFunc: 'decorGate' },
    { row: 12, col: 13, spriteName: 'closedGate', spriteFunc: 'decorGate' },
    { row: 13, col: 13, spriteName: 'closedGate', spriteFunc: 'decorGate' },
  ],
  removedDecorations: [],
  colorTint: { r: 20, g: 25, b: 50, a: 0.18 },
};

// --- Exported layout registry ---

export const STORE_LAYOUTS = {
  home: homeLayout,
  float: floatLayout,
  problem: problemLayout,
  offsite: offsiteLayout,
  overnight: overnightLayout,
};

/**
 * Apply a store layout's tile overrides to a base grid.
 * Returns a deep copy - does not mutate the original.
 *
 * @param {number[][]} baseGrid - 2D tile array from createTileMap()
 * @param {string} storeType - key into STORE_LAYOUTS
 * @returns {number[][]} modified copy of the grid
 */
export function applyStoreLayout(baseGrid, storeType) {
  const layout = STORE_LAYOUTS[storeType];
  if (!layout) return baseGrid;

  // Deep copy the grid
  const grid = [];
  for (let r = 0; r < baseGrid.length; r++) {
    grid[r] = baseGrid[r].slice();
  }

  // Apply tile overrides
  for (const override of layout.tileOverrides) {
    const { row, col, tileType } = override;
    if (row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS) {
      grid[row][col] = tileType;
    }
  }

  return grid;
}

/**
 * Get decoration overrides for a store type.
 * Returns an object with decorationOverrides, removedDecorations, and colorTint.
 *
 * @param {string} storeType - key into STORE_LAYOUTS
 * @returns {{ decorationOverrides: Array, removedDecorations: Array, colorTint: object|null }}
 */
export function getStoreDecorations(storeType) {
  const layout = STORE_LAYOUTS[storeType];
  if (!layout) {
    return { decorationOverrides: [], removedDecorations: [], colorTint: null };
  }
  return {
    decorationOverrides: layout.decorationOverrides,
    removedDecorations: layout.removedDecorations,
    colorTint: layout.colorTint,
  };
}
