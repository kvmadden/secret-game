/**
 * Simple BFS pathfinding for pharmacist movement.
 * Works on the tile grid, returns array of {col, row} waypoints.
 */

import { MAP_COLS, MAP_ROWS } from './constants.js';
import { isWalkable } from './map.js';

const DIRS = [
  { dc: 1, dr: 0 },
  { dc: -1, dr: 0 },
  { dc: 0, dr: 1 },
  { dc: 0, dr: -1 },
];

export function findPath(map, startCol, startRow, endCol, endRow) {
  startCol = Math.round(startCol);
  startRow = Math.round(startRow);
  endCol = Math.round(endCol);
  endRow = Math.round(endRow);

  if (startCol === endCol && startRow === endRow) return [];

  // If destination isn't walkable, find nearest walkable tile
  if (!isWalkable(map, endCol, endRow)) {
    const nearest = findNearestWalkable(map, endCol, endRow);
    if (!nearest) return [];
    endCol = nearest.col;
    endRow = nearest.row;
  }

  const key = (c, r) => `${c},${r}`;
  const visited = new Set();
  const queue = [{ col: startCol, row: startRow, path: [] }];
  visited.add(key(startCol, startRow));

  while (queue.length > 0) {
    const { col, row, path } = queue.shift();

    for (const dir of DIRS) {
      const nc = col + dir.dc;
      const nr = row + dir.dr;
      const k = key(nc, nr);

      if (visited.has(k)) continue;
      if (!isWalkable(map, nc, nr)) continue;

      const newPath = [...path, { col: nc, row: nr }];

      if (nc === endCol && nr === endRow) {
        return newPath;
      }

      visited.add(k);
      queue.push({ col: nc, row: nr, path: newPath });
    }
  }

  // No path found - try to get close
  return [];
}

function findNearestWalkable(map, col, row) {
  for (let r = 0; r <= 3; r++) {
    for (let dc = -r; dc <= r; dc++) {
      for (let dr = -r; dr <= r; dr++) {
        const nc = col + dc;
        const nr = row + dr;
        if (isWalkable(map, nc, nr)) {
          return { col: nc, row: nr };
        }
      }
    }
  }
  return null;
}
