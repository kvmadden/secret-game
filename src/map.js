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
 *              VERIFY at center, PHONE at left
 *  Rows 14-15: Back shelves
 *  Rows 16-17: Back wall (clipboard, fridge, storage)
 *  Rows 18-19: Floor / utilities
 *
 *  Cols 14-15: Drive-thru lane (runs full height on right side)
 *  Drive window at col 13, row 12
 */

import { MAP_COLS, MAP_ROWS, STATIONS, COLORS, TILE } from './constants.js';
import { Sprites } from './sprites.js';
import { SpriteFurniture } from './sprite-furniture.js';
// SpriteItems import removed — no longer scattering items on the map
import { STORE_LAYOUTS, getStoreDecorations } from './store-layouts.js';

let currentStoreType = 'home';

export function setStoreType(type) {
  currentStoreType = type || 'home';
}

// TILE is imported from constants.js — re-export for any legacy consumers
export { TILE };

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
          // Retail store floor — warm golden tile
          ctx.fillStyle = '#e0d4b8';
          ctx.fillRect(x, y, tileSize, tileSize);
          // Tile grid lines — warm
          ctx.strokeStyle = 'rgba(120, 90, 40, 0.08)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
          // Inner highlight
          ctx.fillStyle = 'rgba(255, 240, 200, 0.06)';
          ctx.fillRect(x + 1, y + 1, tileSize - 2, 1);
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
          // Low wall / divider — warm brick
          ctx.drawImage(Sprites.floorTile(2), x, y);
          ctx.fillStyle = '#a89880';
          ctx.fillRect(x, y, tileSize, tileSize);
          // Brick-like pattern — warm tones
          ctx.fillStyle = '#b8a890';
          for (let by = 0; by < tileSize; by += 4) {
            const offset = (by % 8 === 0) ? 0 : 4;
            for (let bx = offset; bx < tileSize; bx += 8) {
              ctx.fillRect(x + bx + 0.5, y + by + 0.5, 7, 3);
            }
          }
          // Mortar lines
          ctx.fillStyle = '#988870';
          for (let by = 3; by < tileSize; by += 4) {
            ctx.fillRect(x, y + by, tileSize, 1);
          }
          // Top highlight
          ctx.fillStyle = 'rgba(255,240,200,0.12)';
          ctx.fillRect(x, y, tileSize, 2);
          break;
        }

        case TILE.DRIVE_LANE: {
          // Asphalt — warmer gray
          const shade = ((col * 7 + row * 13) % 3);
          ctx.fillStyle = shade === 0 ? '#5a5850' : shade === 1 ? '#625e54' : '#585650';
          ctx.fillRect(x, y, tileSize, tileSize);
          // Specks — warm
          const rng = (col * 31 + row * 17) % 97;
          for (let s = 0; s < 3; s++) {
            const sx = ((rng * (s + 1) * 7) % 14) + 1;
            const sy = ((rng * (s + 1) * 11) % 14) + 1;
            ctx.fillStyle = s % 2 === 0 ? '#6e6a60' : '#504e48';
            ctx.fillRect(x + sx, y + sy, 1, 1);
          }
          // Curb on left edge — warm concrete
          if (col === 14) {
            ctx.fillStyle = '#b8b0a0';
            ctx.fillRect(x, y, 2, tileSize);
            ctx.fillStyle = '#c8c0b0';
            ctx.fillRect(x, y, 1, tileSize);
          }
          // Center dashes — warm yellow
          if (col === 15 && row % 3 === 0) {
            ctx.fillStyle = '#c8a020';
            ctx.fillRect(x + 6, y + 2, 2, 10);
          }
          break;
        }

        default:
          ctx.drawImage(Sprites.floorTile(0), x, y);
      }
    }
  }

  // Apply store layout color tint if applicable
  const layout = STORE_LAYOUTS[currentStoreType];
  if (layout && layout.colorTint) {
    const t = layout.colorTint;
    ctx.fillStyle = `rgba(${t.r}, ${t.g}, ${t.b}, ${t.a})`;
    ctx.fillRect(0, 0, MAP_COLS * tileSize, MAP_ROWS * tileSize);
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

  // Counting tray at filling station
  ctx.drawImage(Sprites.countingTray(), 8 * tileSize, 11 * tileSize);

  // Computer monitor at main workstation
  ctx.drawImage(Sprites.computerMonitor(), 4 * tileSize, 10 * tileSize);

  // ========== DRIVE-THRU ==========

  // Drive-thru window
  ctx.drawImage(Sprites.driveThruWindow(), STATIONS.drive.col * tileSize, STATIONS.drive.row * tileSize);

  // ========== CUSTOMER AREA FIXTURES ==========

  // Chairs in waiting area
  for (let i = 0; i < 3; i++) {
    ctx.drawImage(Sprites.chair(), (2 + i * 3) * tileSize, 2 * tileSize);
  }

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

  // ========== ENVIRONMENT DETAILS ==========

  // --- 1. Workspace details (rows 9-13) ---

  // Keyboard at (4, 10) — near computer monitor
  ctx.fillStyle = '#333';
  ctx.fillRect(4 * tileSize + 2, 10 * tileSize + 12, 12, 3);
  ctx.fillStyle = '#444';
  for (let kx = 0; kx < 5; kx++) {
    for (let ky = 0; ky < 2; ky++) {
      ctx.fillRect(4 * tileSize + 3 + kx * 2.2, 10 * tileSize + 12.5 + ky * 1.2, 1.5, 0.8);
    }
  }

  // --- 2. Customer area details (rows 2-6) ---

  // Floor mat at entrance: (6, 2) to (7, 2)
  ctx.fillStyle = '#5a5040';
  ctx.fillRect(6 * tileSize, 2 * tileSize, 2 * tileSize, tileSize);
  ctx.fillStyle = '#4a4535';
  ctx.fillRect(6 * tileSize + 1, 2 * tileSize + 1, 2 * tileSize - 2, tileSize - 2);
  // "WELCOME" tiny text
  ctx.fillStyle = '#8a8060';
  ctx.font = '4px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WELCOME', 7 * tileSize, 2 * tileSize + 10);
  ctx.textAlign = 'start';

  // Tile checkerboard pattern in waiting area (rows 3-5)
  for (let cRow = 3; cRow <= 5; cRow++) {
    for (let cCol = 0; cCol <= 12; cCol++) {
      if ((cRow + cCol) % 2 === 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.fillRect(cCol * tileSize, cRow * tileSize, tileSize, tileSize);
      }
    }
  }

  // Queue rope stands at (4, 5) and (8, 5)
  // Left post
  ctx.fillStyle = '#b0a080';
  ctx.beginPath();
  ctx.arc(4 * tileSize + 8, 5 * tileSize + 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d4c090';
  ctx.fillRect(4 * tileSize + 7, 5 * tileSize + 3, 2, 10);
  // Right post
  ctx.fillStyle = '#b0a080';
  ctx.beginPath();
  ctx.arc(8 * tileSize + 8, 5 * tileSize + 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d4c090';
  ctx.fillRect(8 * tileSize + 7, 5 * tileSize + 3, 2, 10);
  // Rope between posts (retractable belt)
  ctx.strokeStyle = '#cc2244';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(4 * tileSize + 9, 5 * tileSize + 6);
  // Slight sag
  ctx.quadraticCurveTo(6 * tileSize + 8, 5 * tileSize + 9, 8 * tileSize + 7, 5 * tileSize + 6);
  ctx.stroke();

  // --- 3. Counter details (row 7-8) ---

  // "PLEASE WAIT" sign at (7, 7)
  ctx.fillStyle = '#333';
  ctx.fillRect(7 * tileSize + 4, 7 * tileSize + 8, 2, 5);
  ctx.fillStyle = '#eee';
  ctx.fillRect(7 * tileSize + 1, 7 * tileSize + 2, 14, 7);
  ctx.fillStyle = '#333';
  ctx.fillRect(7 * tileSize + 1.5, 7 * tileSize + 2.5, 13, 6);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 4px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PLEASE', 7 * tileSize + 8, 7 * tileSize + 6);
  ctx.fillText('WAIT', 7 * tileSize + 8, 7 * tileSize + 10.5);
  ctx.textAlign = 'start';

  // --- 4. Drive-thru enhancements (cols 13-15) ---

  // Menu/speaker board at row 5 in drive lane
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(14 * tileSize + 2, 5 * tileSize + 1, tileSize + 10, 14);
  ctx.fillStyle = '#f5e8a0';
  ctx.fillRect(14 * tileSize + 3, 5 * tileSize + 2, tileSize + 8, 8);
  ctx.fillStyle = '#333';
  ctx.font = 'bold 3px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MENU', 15 * tileSize, 5 * tileSize + 6);
  ctx.font = '3px monospace';
  ctx.fillText('ORDER', 15 * tileSize, 5 * tileSize + 9);
  ctx.textAlign = 'start';
  // Speaker grille
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(15 * tileSize, 5 * tileSize + 13, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.arc(15 * tileSize, 5 * tileSize + 13, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // "DRIVE THRU" painted on asphalt at row 3
  ctx.fillStyle = 'rgba(200, 200, 180, 0.25)';
  ctx.font = 'bold 5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DRIVE', 15 * tileSize, 3 * tileSize + 6);
  ctx.fillText('THRU', 15 * tileSize, 3 * tileSize + 12);
  // Arrow
  ctx.fillStyle = 'rgba(200, 200, 180, 0.2)';
  ctx.beginPath();
  ctx.moveTo(15 * tileSize, 3 * tileSize + 13);
  ctx.lineTo(15 * tileSize - 3, 3 * tileSize + 15);
  ctx.lineTo(15 * tileSize + 3, 3 * tileSize + 15);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = 'start';

  // Speed bump at row 8 — yellow striped line
  ctx.fillStyle = '#c8a020';
  ctx.fillRect(14 * tileSize, 8 * tileSize + 7, 2 * tileSize, 2);
  // Stripes on speed bump
  ctx.fillStyle = '#333';
  for (let sx = 0; sx < 8; sx++) {
    ctx.fillRect(14 * tileSize + sx * 4, 8 * tileSize + 7, 2, 2);
  }

  // --- 5. SpriteFurniture detail objects ---

  // Wall clock above counter (row 6, visible to customers)
  ctx.drawImage(SpriteFurniture.clockWall(), 9 * tileSize, 6 * tileSize);

  // Potted plant in waiting area corner
  ctx.drawImage(SpriteFurniture.plantPot(), 12 * tileSize, 2 * tileSize);

  // --- 6. Lighting hints on floor ---

  // Fluorescent light pools in workspace (rows 10-12)
  for (let lr = 10; lr <= 12; lr++) {
    for (let lc = 2; lc <= 10; lc += 4) {
      ctx.fillStyle = 'rgba(255, 250, 230, 0.06)';
      ctx.beginPath();
      ctx.arc(lc * tileSize + tileSize / 2, lr * tileSize + tileSize / 2, tileSize * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Window light on customer floor (rows 3-5, warm tint)
  for (let wr = 3; wr <= 5; wr++) {
    const lightAlpha = wr === 4 ? 0.07 : 0.04;
    ctx.fillStyle = `rgba(255, 240, 200, ${lightAlpha})`;
    ctx.fillRect(0, wr * tileSize, 13 * tileSize, tileSize);
  }
  // Warm spotlight near windows on left
  ctx.fillStyle = 'rgba(255, 230, 180, 0.08)';
  ctx.beginPath();
  ctx.arc(1 * tileSize, 4 * tileSize + tileSize / 2, tileSize * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Store-type specific decorations
  const storeDecorations = getStoreDecorations(currentStoreType);
  if (storeDecorations && storeDecorations.decorationOverrides) {
    for (const dec of storeDecorations.decorationOverrides) {
      if (dec.spriteFunc && typeof dec.spriteFunc === 'function') {
        ctx.drawImage(dec.spriteFunc(), dec.col * tileSize, dec.row * tileSize);
      }
    }
  }

  // ========== STATION MARKERS (glow dots on floor) ==========
  for (const [key, station] of Object.entries(STATIONS)) {
    const marker = Sprites.stationMarker(station.color, station.label);
    ctx.drawImage(marker, station.col * tileSize, station.row * tileSize);
  }

  return canvas;
}
