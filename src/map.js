/**
 * Portrait-friendly pharmacy layout — 16 cols × 20 rows.
 *
 * Three-band design for Diner Dash readability:
 *
 *  Rows 0-1:   Retail store hints (OTC shelves, aisle entrance)
 *  Rows 2-4:   Customer waiting / queue area (PUBLIC PRESSURE BAND)
 *  Rows 5-6:   Customer approach — patients stand here
 *  Row 7:      Counter top (sneeze guards, registers)
 *  Row 8:      Counter front panel (PICKUP left, CONSULT right)
 *  Rows 9-13:  Pharmacist workspace (BENCH ZONE — fishbowl)
 *              VERIFY at center, PHONE at left, clutter everywhere
 *  Rows 14-15: Back shelves
 *  Rows 16-17: Back wall (clipboard, fridge, storage)
 *  Rows 18-19: Floor / utilities
 *
 *  Cols 14-15: Drive-thru lane (runs full height on right side)
 *  Drive window at col 13, row 12
 */

import { MAP_COLS, MAP_ROWS, STATIONS, COLORS } from './constants.js';
import { Sprites } from './sprites.js';

// Tile types
export const TILE = {
  FLOOR: 0,
  COUNTER_TOP: 1,
  COUNTER_FRONT: 2,
  SHELF: 3,
  WALL: 4,
  BACK_WALL: 5,
  CUSTOMER_FLOOR: 6,
  WORKSPACE: 7,
  DRIVE_LANE: 8,
  STORE_FLOOR: 9,   // Retail store hint area
  HALF_WALL: 10,    // Low wall / divider
};

// Generate the tile map
export function createTileMap() {
  const map = [];
  for (let row = 0; row < MAP_ROWS; row++) {
    map[row] = [];
    for (let col = 0; col < MAP_COLS; col++) {
      // Drive-thru lane on far right (cols 14-15)
      if (col >= 14) {
        map[row][col] = TILE.DRIVE_LANE;
        continue;
      }

      // Col 13: drive-thru wall/curb (except at window row 12)
      if (col === 13 && row >= 9) {
        if (row === 12) {
          map[row][col] = TILE.WORKSPACE; // drive window — walkable
        } else {
          map[row][col] = TILE.HALF_WALL;
        }
        continue;
      }

      if (row <= 1) {
        // Store hint area
        if (col <= 1 || col >= 12) {
          map[row][col] = TILE.SHELF; // OTC shelves at edges
        } else {
          map[row][col] = TILE.STORE_FLOOR;
        }
      } else if (row >= 2 && row <= 6) {
        // Customer area
        map[row][col] = TILE.CUSTOMER_FLOOR;
      } else if (row === 7) {
        // Counter top
        if (col >= 0 && col <= 12) {
          map[row][col] = TILE.COUNTER_TOP;
        } else {
          map[row][col] = TILE.CUSTOMER_FLOOR;
        }
      } else if (row === 8) {
        // Counter front
        if (col >= 0 && col <= 12) {
          map[row][col] = TILE.COUNTER_FRONT;
        } else {
          map[row][col] = TILE.CUSTOMER_FLOOR;
        }
      } else if (row >= 9 && row <= 13) {
        // Pharmacist workspace (fishbowl)
        map[row][col] = TILE.WORKSPACE;
      } else if (row >= 14 && row <= 15) {
        // Back shelves — with gaps for walking
        if (col % 6 < 2) {
          map[row][col] = TILE.WORKSPACE; // aisle gaps
        } else {
          map[row][col] = TILE.SHELF;
        }
      } else if (row >= 16 && row <= 17) {
        // Back wall
        map[row][col] = TILE.BACK_WALL;
      } else {
        // Bottom utilities
        map[row][col] = TILE.BACK_WALL;
      }
    }
  }
  return map;
}

// Walkability check for pathfinding
export function isWalkable(map, col, row) {
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
  const tile = map[row][col];
  return tile === TILE.WORKSPACE || tile === TILE.FLOOR;
}

// Render the full map to an offscreen canvas (called once, then blitted)
export function renderMap(map, scale) {
  const tileSize = 16;
  const w = MAP_COLS * tileSize;
  const h = MAP_ROWS * tileSize;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const tile = map[row][col];
      const x = col * tileSize;
      const y = row * tileSize;

      switch (tile) {
        case TILE.STORE_FLOOR:
          // Retail store floor — lighter, warmer tone
          ctx.fillStyle = '#d8d0c0';
          ctx.fillRect(x, y, tileSize, tileSize);
          // Subtle tile grid
          ctx.strokeStyle = 'rgba(0,0,0,0.04)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
          break;

        case TILE.CUSTOMER_FLOOR:
          ctx.drawImage(Sprites.floorTile((row * MAP_COLS + col) % 7), x, y);
          break;

        case TILE.COUNTER_TOP:
          ctx.drawImage(Sprites.counterTop(), x, y);
          break;

        case TILE.COUNTER_FRONT:
          ctx.drawImage(Sprites.counterFront(), x, y);
          break;

        case TILE.SHELF:
          ctx.drawImage(Sprites.shelf(row * MAP_COLS + col), x, y);
          break;

        case TILE.BACK_WALL:
          ctx.drawImage(Sprites.backWall((row * 17 + col) % 8), x, y);
          break;

        case TILE.WORKSPACE:
          ctx.drawImage(Sprites.floorTile((row * MAP_COLS + col + 3) % 7), x, y);
          break;

        case TILE.HALF_WALL: {
          // Low wall / divider between pharmacy and drive-thru
          ctx.drawImage(Sprites.floorTile(2), x, y);
          ctx.fillStyle = '#a09888';
          ctx.fillRect(x, y, tileSize, tileSize);
          // Brick-like pattern
          ctx.fillStyle = '#b0a898';
          for (let by = 0; by < tileSize; by += 4) {
            const offset = (by % 8 === 0) ? 0 : 4;
            for (let bx = offset; bx < tileSize; bx += 8) {
              ctx.fillRect(x + bx + 0.5, y + by + 0.5, 7, 3);
            }
          }
          // Top highlight
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(x, y, tileSize, 2);
          break;
        }

        case TILE.DRIVE_LANE: {
          // Asphalt
          const shade = ((col * 7 + row * 13) % 3);
          ctx.fillStyle = shade === 0 ? '#5a5a5a' : shade === 1 ? '#626262' : '#585858';
          ctx.fillRect(x, y, tileSize, tileSize);
          // Specks
          const rng = (col * 31 + row * 17) % 97;
          for (let s = 0; s < 3; s++) {
            const sx = ((rng * (s + 1) * 7) % 14) + 1;
            const sy = ((rng * (s + 1) * 11) % 14) + 1;
            ctx.fillStyle = s % 2 === 0 ? '#6e6e6e' : '#505050';
            ctx.fillRect(x + sx, y + sy, 1, 1);
          }
          // Curb on left edge
          if (col === 14) {
            ctx.fillStyle = '#b0aba0';
            ctx.fillRect(x, y, 2, tileSize);
            ctx.fillStyle = '#c8c3b8';
            ctx.fillRect(x, y, 1, tileSize);
          }
          // Center dashes
          if (col === 15 && row % 3 === 0) {
            ctx.fillStyle = '#ccaa22';
            ctx.fillRect(x + 6, y + 2, 2, 10);
          }
          break;
        }

        default:
          ctx.drawImage(Sprites.floorTile(0), x, y);
      }
    }
  }

  // ========== RETAIL STORE HINTS ==========
  // "PHARMACY" sign spanning top
  const pharmSign = Sprites.sign('PHARMACY', '#cc2233');
  ctx.drawImage(pharmSign, 4 * tileSize, 0 * tileSize + 2);

  // Aisle entrance hint — floor arrows
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(6 * tileSize, 0, 2 * tileSize, 2 * tileSize);

  // OTC signage on edge shelves
  ctx.fillStyle = '#aa8866';
  ctx.font = 'bold 5px monospace';
  ctx.fillText('OTC', 0.5 * tileSize, 1 * tileSize + 6);
  ctx.fillText('VITAMINS', 12.2 * tileSize, 1 * tileSize + 6);

  // ========== COUNTER FIXTURES ==========

  // Sneeze guards along counter
  for (let col = 1; col < 12; col += 4) {
    ctx.drawImage(Sprites.sneezeGuard(), col * tileSize, 7 * tileSize);
  }

  // Register at pickup
  ctx.drawImage(Sprites.register(), STATIONS.pickup.col * tileSize, 7 * tileSize);

  // Signature pad near pickup
  ctx.drawImage(Sprites.signaturePad(), (STATIONS.pickup.col + 2) * tileSize, 7 * tileSize);

  // ========== WORKSPACE FIXTURES ==========

  // Verification bench (center of workspace)
  ctx.drawImage(Sprites.verifyBench(), (STATIONS.verify.col - 1) * tileSize, STATIONS.verify.row * tileSize);

  // Phone station
  ctx.drawImage(Sprites.phone(false), STATIONS.phone.col * tileSize, STATIONS.phone.row * tileSize);

  // Rx bags near pickup station (behind counter)
  ctx.drawImage(Sprites.rxBags(), (STATIONS.pickup.col - 1) * tileSize, 9 * tileSize);

  // Counting tray and pill bottles
  ctx.drawImage(Sprites.countingTray(), 8 * tileSize, 11 * tileSize);
  ctx.drawImage(Sprites.pillBottles(), 10 * tileSize, 11 * tileSize);

  // Computer monitors at workstations
  ctx.drawImage(Sprites.computerMonitor(), 4 * tileSize, 10 * tileSize);
  ctx.drawImage(Sprites.computerMonitor(), 9 * tileSize, 10 * tileSize);

  // Receipt printer
  ctx.drawImage(Sprites.receiptPrinter(), (STATIONS.verify.col + 2) * tileSize, STATIONS.verify.row * tileSize);

  // Drop-off bin
  ctx.drawImage(Sprites.dropOffBin(), 1 * tileSize, 9 * tileSize);

  // Trash bins
  ctx.drawImage(Sprites.trashBin(), 11 * tileSize, 13 * tileSize);

  // ========== DRIVE-THRU ==========

  // Drive-thru window
  ctx.drawImage(Sprites.driveThruWindow(), STATIONS.drive.col * tileSize, STATIONS.drive.row * tileSize);

  // ========== CUSTOMER AREA FIXTURES ==========

  // Chairs in waiting area
  for (let i = 0; i < 3; i++) {
    ctx.drawImage(Sprites.chair(), (2 + i * 3) * tileSize, 2 * tileSize);
  }

  // Brochure rack
  ctx.drawImage(Sprites.brochureRack(), 11 * tileSize, 3 * tileSize);

  // Blood pressure machine
  ctx.drawImage(Sprites.bpMachine(), 0 * tileSize, 4 * tileSize);

  // ========== HANGING SIGNS ==========
  const signs = [
    { text: 'PICK UP', x: STATIONS.pickup.col, color: '#cc2233' },
    { text: 'DROP OFF', x: STATIONS.pickup.col + 4, color: '#cc2233' },
    { text: 'CONSULT', x: STATIONS.consult.col, color: '#2244aa' },
    { text: 'DRIVE THRU', x: 13, color: '#cc2233' },
  ];

  for (const sign of signs) {
    const signSprite = Sprites.sign(sign.text, sign.color);
    ctx.drawImage(signSprite, sign.x * tileSize - 8, 5 * tileSize + 2);
  }

  // ========== LUNCH GATE ==========
  // Visible gate track on counter top (can be animated later)
  ctx.fillStyle = 'rgba(100, 100, 120, 0.3)';
  ctx.fillRect(0, 7 * tileSize - 1, 13 * tileSize, 1);
  // Gate rail dots
  for (let gx = 0; gx < 13; gx += 2) {
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(gx * tileSize + tileSize / 2, 7 * tileSize - 1, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // ========== STATION MARKERS (glow dots on floor) ==========
  for (const [key, station] of Object.entries(STATIONS)) {
    const marker = Sprites.stationMarker(station.color, station.label);
    ctx.drawImage(marker, station.col * tileSize, station.row * tileSize);
  }

  return canvas;
}
