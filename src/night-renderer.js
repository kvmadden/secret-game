/**
 * Overnight / night shift visual effects for the pharmacy game.
 *
 * Complements day-night.js (which handles daytime lighting) by providing
 * atmosphere-specific overlays when the player is on an overnight shift.
 * Fluorescent lights become the dominant light source, windows go dark,
 * and occasional headlights sweep past the storefront.
 */

const TILE = 16;
const COLS = 16;
const ROWS = 20;

// Ceiling fluorescent light positions (workspace area rows 9-12, every 4 cols)
const FLUORO_LIGHTS = [];
for (let r = 9; r <= 12; r += 1) {
  for (let c = 2; c < COLS; c += 4) {
    FLUORO_LIGHTS.push({ col: c, row: r });
  }
}

// Window tile positions (customer-area edges)
const WINDOWS = [
  { col: 0, row: 3 }, { col: 0, row: 5 }, { col: 0, row: 7 },
  { col: 15, row: 3 }, { col: 15, row: 5 }, { col: 15, row: 7 },
];

// Parking lot lamp positions (outside, visible through front windows)
const PARKING_LAMPS = [
  { x: -1.5, y: 2 }, { x: 17.5, y: 4 }, { x: -1.5, y: 6 },
];

// Workstation monitor positions (computer screens in the back)
const MONITORS = [
  { col: 4, row: 14 }, { col: 8, row: 14 }, { col: 12, row: 14 },
];

const HEADLIGHT_MIN = 10;
const HEADLIGHT_MAX = 15;

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

export class NightRenderer {
  constructor() {
    this._time = 0;
    this._hlTimer = lerp(HEADLIGHT_MIN, HEADLIGHT_MAX, Math.random());
    this._hlProgress = -1; // -1 = inactive
    this._hlY = 0;
  }

  /**
   * Check whether a shift config represents an overnight / night shift.
   * @param {string|object} shiftId  Shift id string or config with timeOfDay
   * @returns {boolean}
   */
  isNightShift(shiftId) {
    if (typeof shiftId === 'object' && shiftId !== null) {
      const tod = (shiftId.timeOfDay || '').toLowerCase();
      if (tod === 'night' || tod === 'overnight') return true;
      const id = (shiftId.id || '').toLowerCase();
      return id.includes('overnight');
    }
    const s = String(shiftId).toLowerCase();
    return s.includes('overnight') || s === 'c7_last_straw';
  }

  /** Advance animation clocks. */
  update(dt, isNight) {
    if (!isNight) return;
    this._time += dt;

    // Headlight sweep timer
    if (this._hlProgress < 0) {
      this._hlTimer -= dt;
      if (this._hlTimer <= 0) {
        this._hlProgress = 0;
        this._hlY = lerp(3, 7, Math.random()) * TILE;
        this._hlTimer = lerp(HEADLIGHT_MIN, HEADLIGHT_MAX, Math.random());
      }
    } else {
      this._hlProgress += dt * 0.8; // ~1.25s sweep
      if (this._hlProgress >= 1) this._hlProgress = -1;
    }
  }

  /**
   * Render all night-specific visual effects.
   * Call AFTER all game sprites are drawn, BEFORE UI.
   */
  render(ctx, w, h, isNight) {
    if (!isNight) return;
    const sx = w / (COLS * TILE);
    const sy = h / (ROWS * TILE);
    ctx.save();

    this._darkOverlay(ctx, w, h);
    this._edgeDarkness(ctx, w, h);
    this._windowDarkness(ctx, sx, sy);
    this._parkingLamps(ctx, sx, sy);
    this._fluorescentGlow(ctx, sx, sy);
    this._exitSign(ctx, sx, sy);
    this._monitorGlow(ctx, sx, sy);
    this._headlightSweep(ctx, w, sx, sy);

    ctx.restore();
  }

  // -- 1. Deep blue-black tint --
  _darkOverlay(ctx, w, h) {
    ctx.fillStyle = 'rgba(10,15,35,0.3)';
    ctx.fillRect(0, 0, w, h);
  }

  // -- 7. Progressive edge darkness --
  _edgeDarkness(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    const r = Math.max(w, h) * 0.55;
    const g = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,10,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // -- 3. Window darkness --
  _windowDarkness(ctx, sx, sy) {
    for (const win of WINDOWS) {
      const x = win.col * TILE * sx;
      const y = win.row * TILE * sy;
      const tw = TILE * sx;
      const th = TILE * sy;
      ctx.fillStyle = 'rgba(5,8,25,0.7)';
      ctx.fillRect(x, y, tw, th);
    }
  }

  // -- 4. Parking lot lamps (outside windows) --
  _parkingLamps(ctx, sx, sy) {
    for (const lamp of PARKING_LAMPS) {
      const x = clamp(lamp.x * TILE * sx, 0, COLS * TILE * sx);
      const y = lamp.y * TILE * sy;
      const r = TILE * sx * 0.4;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,180,80,0.18)');
      g.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  // -- 2. Fluorescent glow pools with pulse --
  _fluorescentGlow(ctx, sx, sy) {
    const pulse = Math.sin(this._time * Math.PI * 2 / 4) * 0.02;
    const alpha = 0.12 + pulse;
    ctx.globalCompositeOperation = 'screen';
    for (const lt of FLUORO_LIGHTS) {
      const x = (lt.col + 0.5) * TILE * sx;
      const y = (lt.row + 0.5) * TILE * sy;
      const r = TILE * 2.5 * sx;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,250,220,${alpha.toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // -- 5. Exit sign glow --
  _exitSign(ctx, sx, sy) {
    const x = 8 * TILE * sx;
    const y = 18.5 * TILE * sy;
    // Green ambient
    const r = TILE * 2 * sx;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,255,60,0.06)');
    g.addColorStop(1, 'rgba(0,255,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    // Sign rectangle
    const sw = TILE * 1.2 * sx, sh = TILE * 0.5 * sy;
    ctx.fillStyle = 'rgba(0,200,40,0.55)';
    ctx.fillRect(x - sw / 2, y - sh / 2, sw, sh);
    // "EXIT" text
    ctx.fillStyle = 'rgba(220,255,220,0.9)';
    ctx.font = `${Math.round(sh * 0.7)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', x, y);
  }

  // -- 6. Monitor glow --
  _monitorGlow(ctx, sx, sy) {
    ctx.globalCompositeOperation = 'screen';
    for (const m of MONITORS) {
      const x = (m.col + 0.5) * TILE * sx;
      const y = (m.row + 0.5) * TILE * sy;
      const r = TILE * 1.5 * sx;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(160,190,255,0.09)');
      g.addColorStop(1, 'rgba(160,190,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // -- 8. Headlight sweep --
  _headlightSweep(ctx, w, sx, sy) {
    if (this._hlProgress < 0) return;
    const p = this._hlProgress;
    const x = p * (w + TILE * 4 * sx) - TILE * 2 * sx;
    const y = this._hlY * sy;
    const bandW = TILE * 3 * sx;
    const bandH = TILE * 1.8 * sy;
    const fade = 1 - Math.abs(p - 0.5) * 2; // fade in/out
    const alpha = fade * 0.15;
    const g = ctx.createLinearGradient(x - bandW / 2, 0, x + bandW / 2, 0);
    g.addColorStop(0, 'rgba(255,255,240,0)');
    g.addColorStop(0.5, `rgba(255,255,240,${alpha.toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,255,240,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - bandW / 2, y - bandH / 2, bandW, bandH);
  }
}
