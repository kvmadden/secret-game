/**
 * MiniMap — corner overlay showing the full pharmacy layout when camera is zoomed in.
 *
 * Renders a simplified color-coded tile grid with entity dots, station markers,
 * and a camera viewport indicator. Auto-hides in OVERVIEW mode.
 *
 * No external dependencies.
 */

// Tile type constants (mirrored from map.js to avoid import)
const TILE = {
  FLOOR: 0,
  COUNTER_TOP: 1,
  COUNTER_FRONT: 2,
  SHELF: 3,
  WALL: 4,
  BACK_WALL: 5,
  CUSTOMER_FLOOR: 6,
  WORKSPACE: 7,
  DRIVE_LANE: 8,
  STORE_FLOOR: 9,
  HALF_WALL: 10,
};

// Simplified tile colors for mini-map rendering
const TILE_COLORS = {
  [TILE.FLOOR]:          '#e0d4c0',
  [TILE.COUNTER_TOP]:    '#8b6f47',
  [TILE.COUNTER_FRONT]:  '#8b6f47',
  [TILE.SHELF]:          '#5a3a1a',
  [TILE.WALL]:           '#e8dcc8',
  [TILE.BACK_WALL]:      '#a08060',
  [TILE.CUSTOMER_FLOOR]: '#e8d8c0',
  [TILE.WORKSPACE]:      '#d8ccb8',
  [TILE.DRIVE_LANE]:     '#484848',
  [TILE.STORE_FLOOR]:    '#e0d4c0',
  [TILE.HALF_WALL]:      '#6a5030',
};

// Station definitions (mirrored from constants.js to avoid import)
const STATION_DEFS = {
  pickup:  { col: 3,  row: 8,  color: '#00cc66' },
  consult: { col: 10, row: 8,  color: '#aa66ff' },
  verify:  { col: 6,  row: 12, color: '#00d4ff' },
  phone:   { col: 2,  row: 13, color: '#ff8800' },
  drive:   { col: 13, row: 12, color: '#ff4466' },
};

export class MiniMap {
  /**
   * @param {number} mapCols - Number of tile columns (16)
   * @param {number} mapRows - Number of tile rows (20)
   * @param {number} tileSize - Size of each tile in world pixels (16)
   */
  constructor(mapCols, mapRows, tileSize) {
    this.mapCols = mapCols;
    this.mapRows = mapRows;
    this.tileSize = tileSize;

    // Mini-map display dimensions
    this.width = 60;
    this.height = 75;

    // Positioning
    this.corner = 'bottom-right';
    this.margin = 8;

    // Visibility
    this.visible = true;
    this.opacity = 0;       // Current fade opacity (0-1)
    this.targetOpacity = 1; // Target opacity for animation
    this.fadeSpeed = 4;     // Opacity units per second

    // Internal padding inside the border
    this.padding = 2;

    // Cached tile map (generated once)
    this._tileMap = null;
    this._tileCanvas = null;

    // Game state cache (updated each frame)
    this._state = null;
    this._time = 0;

    this._buildTileMap();
    this._renderTileCanvas();
  }

  // ── Configuration ──

  /**
   * Set which corner the mini-map appears in.
   * @param {'top-left'|'top-right'|'bottom-left'|'bottom-right'} corner
   */
  setPosition(corner) {
    this.corner = corner;
  }

  /**
   * Set mini-map dimensions in screen pixels.
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
    this._renderTileCanvas();
  }

  /**
   * Set visibility.
   * @param {boolean} visible
   */
  setVisible(visible) {
    this.visible = visible;
    this.targetOpacity = visible ? 1 : 0;
  }

  /** Toggle visibility. */
  toggle() {
    this.setVisible(!this.visible);
  }

  // ── Update ──

  /**
   * Update with current game state each frame.
   * @param {object} gameState
   */
  update(gameState) {
    this._state = gameState;
    if (gameState && gameState.time != null) {
      this._time = gameState.time;
    }
  }

  // ── Render ──

  /**
   * Render the mini-map overlay onto the main canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} screenWidth
   * @param {number} screenHeight
   * @param {number} cameraZoom - Current camera zoom level
   */
  render(ctx, screenWidth, screenHeight, cameraZoom) {
    // Auto-hide: only show when zoomed in (FOLLOW mode).
    // A zoom <= 1.0 means we're in OVERVIEW / fit-to-screen.
    const shouldShow = this.visible && cameraZoom > 1.2;
    this.targetOpacity = shouldShow ? 1 : 0;

    // Animate fade
    const dt = 1 / 60; // approximate frame delta
    if (this.opacity < this.targetOpacity) {
      this.opacity = Math.min(this.targetOpacity, this.opacity + this.fadeSpeed * dt);
    } else if (this.opacity > this.targetOpacity) {
      this.opacity = Math.max(this.targetOpacity, this.opacity - this.fadeSpeed * dt);
    }

    if (this.opacity <= 0.01) return;

    const totalW = this.width + this.padding * 2 + 2;  // +2 for border
    const totalH = this.height + this.padding * 2 + 2;

    // Compute position based on corner
    let x, y;
    switch (this.corner) {
      case 'top-left':
        x = this.margin;
        y = this.margin;
        break;
      case 'top-right':
        x = screenWidth - totalW - this.margin;
        y = this.margin;
        break;
      case 'bottom-left':
        x = this.margin;
        y = screenHeight - totalH - this.margin;
        break;
      case 'bottom-right':
      default:
        x = screenWidth - totalW - this.margin;
        y = screenHeight - totalH - this.margin;
        break;
    }

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // ── Background with rounded corners (1px pixel-art style) ──
    this._drawRoundedRect(ctx, x, y, totalW, totalH);

    // ── Border ──
    ctx.strokeStyle = '#1a1008';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner area origin
    const innerX = x + 1 + this.padding;
    const innerY = y + 1 + this.padding;

    // ── Tile background ──
    if (this._tileCanvas) {
      ctx.drawImage(this._tileCanvas, innerX, innerY, this.width, this.height);
    }

    // Scale factors: world coords -> mini-map pixels
    const sx = this.width / (this.mapCols * this.tileSize);
    const sy = this.height / (this.mapRows * this.tileSize);

    // ── Station markers ──
    this._drawStations(ctx, innerX, innerY, sx, sy);

    // ── Entity dots ──
    if (this._state) {
      this._drawAmbientShoppers(ctx, innerX, innerY, sx, sy);
      this._drawPatients(ctx, innerX, innerY, sx, sy);
      this._drawActiveEvents(ctx, innerX, innerY, sx, sy);
      this._drawPharmacist(ctx, innerX, innerY, sx, sy);
    }

    // ── Camera viewport indicator ──
    this._drawViewport(ctx, innerX, innerY, sx, sy, screenWidth, screenHeight, cameraZoom);

    ctx.restore();
  }

  // ── Private methods ──

  /** Build tile map data (mirrors map.js createTileMap logic). */
  _buildTileMap() {
    const map = [];
    for (let row = 0; row < this.mapRows; row++) {
      map[row] = [];
      for (let col = 0; col < this.mapCols; col++) {
        if (col >= 14) {
          map[row][col] = TILE.DRIVE_LANE;
          continue;
        }
        if (col === 13 && row >= 9) {
          map[row][col] = (row === 12) ? TILE.WORKSPACE : TILE.HALF_WALL;
          continue;
        }
        if (row <= 1) {
          map[row][col] = (col <= 1 || col >= 12) ? TILE.SHELF : TILE.STORE_FLOOR;
        } else if (row >= 2 && row <= 6) {
          map[row][col] = TILE.CUSTOMER_FLOOR;
        } else if (row === 7) {
          map[row][col] = (col >= 0 && col <= 12) ? TILE.COUNTER_TOP : TILE.CUSTOMER_FLOOR;
        } else if (row === 8) {
          map[row][col] = (col >= 0 && col <= 12) ? TILE.COUNTER_FRONT : TILE.CUSTOMER_FLOOR;
        } else if (row >= 9 && row <= 13) {
          map[row][col] = TILE.WORKSPACE;
        } else if (row >= 14 && row <= 15) {
          map[row][col] = (col % 6 < 2) ? TILE.WORKSPACE : TILE.SHELF;
        } else {
          map[row][col] = TILE.BACK_WALL;
        }
      }
    }
    this._tileMap = map;
  }

  /** Pre-render tile background to an offscreen canvas. */
  _renderTileCanvas() {
    if (!this._tileMap) return;
    if (typeof OffscreenCanvas !== 'undefined') {
      this._tileCanvas = new OffscreenCanvas(this.width, this.height);
    } else if (typeof document !== 'undefined') {
      this._tileCanvas = document.createElement('canvas');
      this._tileCanvas.width = this.width;
      this._tileCanvas.height = this.height;
    } else {
      this._tileCanvas = null;
      return;
    }

    const tctx = this._tileCanvas.getContext('2d');
    const tw = this.width / this.mapCols;
    const th = this.height / this.mapRows;

    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        const tile = this._tileMap[row][col];
        tctx.fillStyle = TILE_COLORS[tile] || '#e0d4c0';
        // Use Math.floor/ceil to avoid subpixel gaps
        const px = Math.floor(col * tw);
        const py = Math.floor(row * th);
        const pw = Math.ceil((col + 1) * tw) - px;
        const ph = Math.ceil((row + 1) * th) - py;
        tctx.fillRect(px, py, pw, ph);
      }
    }
  }

  /** Draw a rounded rectangle path (1px corner cut for pixel-art feel). */
  _drawRoundedRect(ctx, x, y, w, h) {
    ctx.beginPath();
    // 1px corner cuts
    ctx.moveTo(x + 1, y);
    ctx.lineTo(x + w - 1, y);
    ctx.lineTo(x + w, y + 1);
    ctx.lineTo(x + w, y + h - 1);
    ctx.lineTo(x + w - 1, y + h);
    ctx.lineTo(x + 1, y + h);
    ctx.lineTo(x, y + h - 1);
    ctx.lineTo(x, y + 1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(20, 12, 4, 0.8)';
    ctx.fill();
  }

  /** Draw colored dots at station positions. */
  _drawStations(ctx, ox, oy, sx, sy) {
    for (const key in STATION_DEFS) {
      const st = STATION_DEFS[key];
      const cx = ox + (st.col + 0.5) * this.tileSize * sx;
      const cy = oy + (st.row + 0.5) * this.tileSize * sy;
      ctx.fillStyle = st.color;
      ctx.globalAlpha = this.opacity * 0.7;
      ctx.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 2, 2);
      ctx.globalAlpha = this.opacity;
    }
  }

  /** Draw ambient shoppers as gray dots. */
  _drawAmbientShoppers(ctx, ox, oy, sx, sy) {
    const shoppers = this._state.ambientShoppers;
    if (!shoppers || !shoppers.length) return;

    ctx.globalAlpha = this.opacity * 0.5;
    ctx.fillStyle = '#999999';
    for (let i = 0; i < shoppers.length; i++) {
      const s = shoppers[i];
      if (s.col == null || s.row == null) continue;
      const px = ox + (s.col + 0.5) * this.tileSize * sx;
      const py = oy + (s.row + 0.5) * this.tileSize * sy;
      ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
    }
    ctx.globalAlpha = this.opacity;
  }

  /** Draw patient dots (white, red when angry). */
  _drawPatients(ctx, ox, oy, sx, sy) {
    const patients = this._state.patients;
    if (!patients || !patients.length) return;

    for (let i = 0; i < patients.length; i++) {
      const p = patients[i];
      if (p.col == null || p.row == null) continue;
      // Red when patience < 30%
      const angry = (p.patience != null && p.patience < 0.3);
      ctx.fillStyle = angry ? '#ff4444' : '#ffffff';
      const px = ox + (p.col + 0.5) * this.tileSize * sx;
      const py = oy + (p.row + 0.5) * this.tileSize * sy;
      ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
    }
  }

  /** Draw pharmacist as a bright green pulsing 2x2 dot. */
  _drawPharmacist(ctx, ox, oy, sx, sy) {
    const pharm = this._state.pharmacist;
    if (!pharm || pharm.col == null || pharm.row == null) return;

    const px = ox + (pharm.col + 0.5) * this.tileSize * sx;
    const py = oy + (pharm.row + 0.5) * this.tileSize * sy;

    // Pulsing effect
    const pulse = 0.7 + 0.3 * Math.sin(this._time * 6);
    ctx.globalAlpha = this.opacity * pulse;
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2);
    ctx.globalAlpha = this.opacity;
  }

  /** Draw active event indicators at stations with pulsing colored circles. */
  _drawActiveEvents(ctx, ox, oy, sx, sy) {
    const sm = this._state.stationManager;
    if (!sm) return;

    const stations = sm.getAll ? sm.getAll() : [];
    for (let i = 0; i < stations.length; i++) {
      const st = stations[i];
      if (!st.hasEvent) continue;

      const def = STATION_DEFS[st.key];
      if (!def) continue;

      const cx = ox + (def.col + 0.5) * this.tileSize * sx;
      const cy = oy + (def.row + 0.5) * this.tileSize * sy;

      // Pulsing circle
      const pulse = 0.5 + 0.5 * Math.sin(this._time * 5);
      const radius = 2 + pulse;

      ctx.globalAlpha = this.opacity * (0.5 + pulse * 0.4);
      ctx.beginPath();
      ctx.arc(Math.round(cx), Math.round(cy), radius, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();
      ctx.globalAlpha = this.opacity;
    }
  }

  /** Draw camera viewport rectangle. */
  _drawViewport(ctx, ox, oy, sx, sy, screenWidth, screenHeight, cameraZoom) {
    if (cameraZoom <= 0) return;

    // The camera shows (screenWidth/cameraZoom) x (screenHeight/cameraZoom) world pixels.
    const viewW = (screenWidth / cameraZoom) * sx;
    const viewH = (screenHeight / cameraZoom) * sy;

    // Center viewport on pharmacist if available, else center of map
    let worldCX, worldCY;
    if (this._state && this._state.pharmacist &&
        this._state.pharmacist.col != null && this._state.pharmacist.row != null) {
      worldCX = (this._state.pharmacist.col + 0.5) * this.tileSize * sx;
      worldCY = (this._state.pharmacist.row + 0.5) * this.tileSize * sy;
    } else {
      worldCX = this.width / 2;
      worldCY = this.height / 2;
    }

    let vx = ox + worldCX - viewW / 2;
    let vy = oy + worldCY - viewH / 2;

    // Clamp to mini-map bounds
    vx = Math.max(ox, Math.min(vx, ox + this.width - viewW));
    vy = Math.max(oy, Math.min(vy, oy + this.height - viewH));

    ctx.globalAlpha = this.opacity * 0.35;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.round(vx) + 0.5,
      Math.round(vy) + 0.5,
      Math.round(viewW),
      Math.round(viewH)
    );

    // Slight fill for visibility
    ctx.globalAlpha = this.opacity * 0.08;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      Math.round(vx),
      Math.round(vy),
      Math.round(viewW),
      Math.round(viewH)
    );
    ctx.globalAlpha = this.opacity;
  }
}
