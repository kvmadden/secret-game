/**
 * Pharmacy tile map and layout.
 * The pharmacy is wide (40 tiles) and shallow (14 tiles).
 *
 * Row layout:
 *  0-1:   Customer waiting area (above counter)
 *  2-3:   Customer approach area
 *  4:     Sneeze guards / counter top edge
 *  5:     Counter top (the counter surface)
 *  6:     Counter front (visible front panel)
 *  7-9:   Pharmacist workspace (walkable)
 *  10-11: Back shelves
 *  12:    Back wall / fridge / clipboards
 *  13:    Back wall bottom
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
};

// Generate the tile map
export function createTileMap() {
  const map = [];
  for (let row = 0; row < MAP_ROWS; row++) {
    map[row] = [];
    for (let col = 0; col < MAP_COLS; col++) {
      if (row <= 3) {
        // Customer area - drive lane on far right
        if (col >= 33) {
          map[row][col] = TILE.DRIVE_LANE;
        } else {
          map[row][col] = TILE.CUSTOMER_FLOOR;
        }
      } else if (row === 4 || row === 5) {
        // Counter top - gap at drive thru
        if (col >= 33) {
          map[row][col] = TILE.DRIVE_LANE;
        } else {
          map[row][col] = TILE.COUNTER_TOP;
        }
      } else if (row === 6) {
        // Counter front
        if (col >= 33) {
          map[row][col] = TILE.WORKSPACE;
        } else {
          map[row][col] = TILE.COUNTER_FRONT;
        }
      } else if (row >= 7 && row <= 9) {
        // Pharmacist workspace (walkable)
        map[row][col] = TILE.WORKSPACE;
      } else if (row >= 10 && row <= 11) {
        // Shelves - with gaps for walking between sections
        if (col % 8 < 2) {
          map[row][col] = TILE.WORKSPACE; // gaps between shelf sections
        } else {
          map[row][col] = TILE.SHELF;
        }
      } else {
        // Back wall
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
        case TILE.DRIVE_LANE: {
          // Asphalt base with subtle variation
          const asphaltShade = ((col * 7 + row * 13) % 3);
          ctx.fillStyle = asphaltShade === 0 ? '#5a5a5a' : asphaltShade === 1 ? '#626262' : '#585858';
          ctx.fillRect(x, y, tileSize, tileSize);

          // Asphalt texture — tiny aggregate specks
          const rng = (col * 31 + row * 17) % 97;
          for (let s = 0; s < 4; s++) {
            const sx = ((rng * (s + 1) * 7) % 14) + 1;
            const sy = ((rng * (s + 1) * 11) % 14) + 1;
            ctx.fillStyle = s % 2 === 0 ? '#6e6e6e' : '#505050';
            ctx.fillRect(x + sx, y + sy, 1, 1);
          }

          // Curb on left edge of drive lane (col 33)
          if (col === 33) {
            // Concrete curb
            ctx.fillStyle = '#b0aba0';
            ctx.fillRect(x, y, 2, tileSize);
            // Curb highlight
            ctx.fillStyle = '#c8c3b8';
            ctx.fillRect(x, y, 1, tileSize);
            // Curb shadow
            ctx.fillStyle = '#8a857a';
            ctx.fillRect(x + 2, y, 1, tileSize);
          }

          // Yellow center lane dashes
          if (col === 36) {
            if (row % 2 === 0) {
              ctx.fillStyle = '#ccaa22';
              ctx.fillRect(x + 7, y + 2, 2, 12);
              // Highlight edge
              ctx.fillStyle = '#ddbb44';
              ctx.fillRect(x + 7, y + 2, 1, 12);
            }
          }

          // White edge line on far right
          if (col === 39) {
            ctx.fillStyle = '#aaa89e';
            ctx.fillRect(x + 14, y, 2, tileSize);
          }

          // Oil stain near where cars idle
          if (col === 35 && row === 2) {
            ctx.fillStyle = 'rgba(30, 25, 20, 0.3)';
            ctx.beginPath();
            ctx.ellipse(x + 8, y + 8, 5, 3, 0.2, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        default:
          ctx.drawImage(Sprites.floorTile(0), x, y);
      }
    }
  }

  // ========== DRAW FIXTURES ==========

  // Verification bench (left side workspace)
  const vb = Sprites.verifyBench();
  ctx.drawImage(vb, (STATIONS.verify.col - 1) * tileSize, (STATIONS.verify.row) * tileSize);

  // Phone
  ctx.drawImage(Sprites.phone(false), STATIONS.phone.col * tileSize, STATIONS.phone.row * tileSize);

  // Registers at pickup
  ctx.drawImage(Sprites.register(), (STATIONS.pickup.col) * tileSize, (STATIONS.pickup.row + 1) * tileSize);

  // Signature pad near pickup
  ctx.drawImage(Sprites.signaturePad(), (STATIONS.pickup.col + 2) * tileSize, (STATIONS.pickup.row) * tileSize);

  // Rx bags near pickup
  ctx.drawImage(Sprites.rxBags(), (STATIONS.pickup.col - 2) * tileSize, (STATIONS.pickup.row + 1) * tileSize);

  // Counting tray in fill area
  ctx.drawImage(Sprites.countingTray(), 13 * tileSize, 8 * tileSize);
  ctx.drawImage(Sprites.pillBottles(), 15 * tileSize, 8 * tileSize);

  // Brochure rack near consult
  ctx.drawImage(Sprites.brochureRack(), (STATIONS.consult.col + 2) * tileSize, 3 * tileSize);

  // Chairs in waiting area
  for (let i = 0; i < 4; i++) {
    ctx.drawImage(Sprites.chair(), (2 + i * 3) * tileSize, 1 * tileSize);
  }

  // Drive-thru window
  ctx.drawImage(Sprites.driveThruWindow(), STATIONS.drive.col * tileSize, (STATIONS.drive.row) * tileSize);

  // Receipt printer near verification station
  ctx.drawImage(Sprites.receiptPrinter(), (STATIONS.verify.col + 2) * tileSize, STATIONS.verify.row * tileSize);

  // Drop-off bin (left of pickup, customer-facing)
  ctx.drawImage(Sprites.dropOffBin(), (STATIONS.pickup.col - 5) * tileSize, 5 * tileSize);

  // Computer monitors at workstations
  ctx.drawImage(Sprites.computerMonitor(), 7 * tileSize, 8 * tileSize);
  ctx.drawImage(Sprites.computerMonitor(), 20 * tileSize, 8 * tileSize);
  ctx.drawImage(Sprites.computerMonitor(), 28 * tileSize, 8 * tileSize);

  // Blood pressure machine in waiting area
  ctx.drawImage(Sprites.bpMachine(), 14 * tileSize, 0 * tileSize);

  // Trash bins in workspace
  ctx.drawImage(Sprites.trashBin(), 11 * tileSize, 9 * tileSize);
  ctx.drawImage(Sprites.trashBin(), 26 * tileSize, 9 * tileSize);

  // ========== HANGING SIGNS ==========
  const signs = [
    { text: 'PICK UP', x: STATIONS.pickup.col, color: '#cc2233' },
    { text: 'DROP OFF', x: STATIONS.pickup.col - 5, color: '#cc2233' },
    { text: 'CONSULT', x: STATIONS.consult.col, color: '#2244aa' },
    { text: 'DRIVE THRU', x: STATIONS.drive.col - 1, color: '#cc2233' },
  ];

  for (const sign of signs) {
    const signSprite = Sprites.sign(sign.text, sign.color);
    ctx.drawImage(signSprite, sign.x * tileSize - 8, 3 * tileSize + 2);
  }

  // ========== STATION MARKERS (glow dots on floor) ==========
  for (const [key, station] of Object.entries(STATIONS)) {
    const marker = Sprites.stationMarker(station.color, station.label);
    ctx.drawImage(marker, station.col * tileSize, station.row * tileSize);
  }

  // ========== SNEEZE GUARDS along counter ==========
  for (let col = 2; col < 32; col += 5) {
    ctx.drawImage(Sprites.sneezeGuard(), col * tileSize, 4 * tileSize);
  }

  return canvas;
}
