/**
 * Time-of-day lighting system for 2D pixel art pharmacy game.
 *
 * Simulates natural light changes across a 6-hour shift (9AM-3PM)
 * mapped to 360 seconds of real time. Handles window light rays,
 * floor light patches, ambient tinting, shadow direction, and
 * fluorescent/natural light interplay.
 *
 * All effects are intentionally subtle to enhance atmosphere
 * without distracting from gameplay.
 */

const TILE_SIZE = 16;
const MAP_COLS = 16;
const MAP_ROWS = 20;

// Window positions (left edge, right edge) in tile columns.
// Pharmacy has windows on both sides at the front (customer area).
const WINDOWS = [
  { col: 0,  row: 7, side: 'left'  },
  { col: 0,  row: 5, side: 'left'  },
  { col: 0,  row: 3, side: 'left'  },
  { col: 15, row: 7, side: 'right' },
  { col: 15, row: 5, side: 'right' },
  { col: 15, row: 3, side: 'right' },
];

// Customer area rows that receive the most window light
const LIGHT_ROWS_MIN = 2;
const LIGHT_ROWS_MAX = 6;

// ---------- Time period color definitions ----------

// Each entry: { ambient: {r,g,b,a}, sunIntensity, shadowAngle, shadowLength, windowGlow: {r,g,b,a} }
const TIME_PERIODS = [
  {
    // Early Morning (0-60s / 9-10AM)
    name: 'earlyMorning',
    tStart: 0,
    tEnd: 60,
    ambient:     { r: 255, g: 210, b: 130, a: 0.05 },
    sunIntensity: 0.55,
    shadowAngle:  -0.35 * Math.PI, // sun from east, shadows point west-ish
    shadowLength: 0.85,
    windowGlow:  { r: 255, g: 220, b: 150, a: 0.12 },
    fluorescent: 0.3,
  },
  {
    // Mid Morning (60-120s / 10-11AM)
    name: 'midMorning',
    tStart: 60,
    tEnd: 120,
    ambient:     { r: 255, g: 235, b: 190, a: 0.035 },
    sunIntensity: 0.78,
    shadowAngle:  -0.25 * Math.PI,
    shadowLength: 0.5,
    windowGlow:  { r: 255, g: 240, b: 200, a: 0.08 },
    fluorescent: 0.55,
  },
  {
    // Noon (120-200s / 11AM-12:30PM)
    name: 'noon',
    tStart: 120,
    tEnd: 200,
    ambient:     { r: 240, g: 245, b: 255, a: 0.03 },
    sunIntensity: 1.0,
    shadowAngle:  0, // straight down
    shadowLength: 0.15,
    windowGlow:  { r: 255, g: 255, b: 245, a: 0.05 },
    fluorescent: 0.85,
  },
  {
    // Early Afternoon (200-280s / 12:30-2PM)
    name: 'earlyAfternoon',
    tStart: 200,
    tEnd: 280,
    ambient:     { r: 255, g: 215, b: 145, a: 0.04 },
    sunIntensity: 0.75,
    shadowAngle:  0.25 * Math.PI, // sun from west, shadows point east
    shadowLength: 0.55,
    windowGlow:  { r: 255, g: 210, b: 140, a: 0.10 },
    fluorescent: 0.5,
  },
  {
    // Late Afternoon (280-360s / 2-3PM)
    name: 'lateAfternoon',
    tStart: 280,
    tEnd: 360,
    ambient:     { r: 255, g: 180, b: 100, a: 0.06 },
    sunIntensity: 0.5,
    shadowAngle:  0.4 * Math.PI,
    shadowLength: 0.9,
    windowGlow:  { r: 255, g: 185, b: 95, a: 0.14 },
    fluorescent: 0.25,
  },
];

// ---------- Helpers ----------

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
  return {
    r: lerp(c1.r, c2.r, t),
    g: lerp(c1.g, c2.g, t),
    b: lerp(c1.b, c2.b, t),
    a: lerp(c1.a, c2.a, t),
  };
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Find the two time periods surrounding the current time and
 * return their interpolated values.
 */
function sampleTimePeriods(gameTime) {
  const t = clamp(gameTime, 0, 360);

  // Find the period we are in (or between)
  for (let i = 0; i < TIME_PERIODS.length; i++) {
    const p = TIME_PERIODS[i];
    if (t >= p.tStart && t <= p.tEnd) {
      // Inside this period — also blend toward neighbors at edges
      const mid = (p.tStart + p.tEnd) / 2;
      if (t <= mid && i > 0) {
        // Blend with previous period in the first half
        const prev = TIME_PERIODS[i - 1];
        const blendZone = (p.tEnd - p.tStart) / 2;
        const localT = (t - p.tStart) / blendZone;
        return blendPeriods(prev, p, localT);
      } else if (t > mid && i < TIME_PERIODS.length - 1) {
        // Blend with next period in the second half
        const next = TIME_PERIODS[i + 1];
        const blendZone = (p.tEnd - p.tStart) / 2;
        const localT = (t - mid) / blendZone;
        return blendPeriods(p, next, localT);
      }
      return extractPeriod(p);
    }
  }
  // Fallback to last period
  return extractPeriod(TIME_PERIODS[TIME_PERIODS.length - 1]);
}

function extractPeriod(p) {
  return {
    ambient:      { ...p.ambient },
    sunIntensity: p.sunIntensity,
    shadowAngle:  p.shadowAngle,
    shadowLength: p.shadowLength,
    windowGlow:   { ...p.windowGlow },
    fluorescent:  p.fluorescent,
  };
}

function blendPeriods(a, b, t) {
  return {
    ambient:      lerpColor(a.ambient, b.ambient, t),
    sunIntensity: lerp(a.sunIntensity, b.sunIntensity, t),
    shadowAngle:  lerp(a.shadowAngle, b.shadowAngle, t),
    shadowLength: lerp(a.shadowLength, b.shadowLength, t),
    windowGlow:   lerpColor(a.windowGlow, b.windowGlow, t),
    fluorescent:  lerp(a.fluorescent, b.fluorescent, t),
  };
}

// ---------- Main class ----------

export class DayNightCycle {
  constructor() {
    this._current = extractPeriod(TIME_PERIODS[0]);
    this._weatherMod = { tintR: 0, tintG: 0, tintB: 0, dimming: 0, warmth: 0 };

    // Off-screen canvas for light ray compositing
    this._rayCanvas = null;
    this._rayCtx = null;
  }

  /**
   * Update the lighting state for the current frame.
   * @param {number} gameTime  Elapsed game time in seconds (0-360)
   * @param {number} gameDuration  Total shift duration (default 360)
   * @param {object} weather  Weather object with at least { name: string }
   */
  update(gameTime, gameDuration = 360, weather) {
    // Normalize gameTime to 0-360 range in case duration differs
    const normalized = (gameTime / gameDuration) * 360;
    this._current = sampleTimePeriods(clamp(normalized, 0, 360));

    // Lunch close dimming (around noon period, 38%-55% of shift)
    const progress = gameTime / gameDuration;
    if (progress >= 0.38 && progress <= 0.55) {
      // Dim lights during lunch close
      const lunchT = (progress - 0.38) / 0.17;
      const dimAmount = Math.sin(lunchT * Math.PI) * 0.25;
      this._current.sunIntensity *= (1 - dimAmount);
      this._current.fluorescent *= (1 - dimAmount * 0.6);
    }

    // Apply weather modifications
    this._weatherMod = { tintR: 0, tintG: 0, tintB: 0, dimming: 0, warmth: 0 };
    if (weather) {
      const name = weather.name || '';
      if (name === 'Rainy') {
        this._weatherMod.tintR = -20;
        this._weatherMod.tintG = -5;
        this._weatherMod.tintB = 25;
        this._weatherMod.dimming = 0.15;
      } else if (name === 'Stormy') {
        this._weatherMod.tintR = -35;
        this._weatherMod.tintG = -15;
        this._weatherMod.tintB = 40;
        this._weatherMod.dimming = 0.25;
      } else if (name === 'Sunny') {
        this._weatherMod.warmth = 0.12;
        this._weatherMod.tintR = 10;
        this._weatherMod.tintG = 5;
        this._weatherMod.tintB = -8;
      } else if (name === 'Cloudy') {
        this._weatherMod.tintR = -8;
        this._weatherMod.tintG = -3;
        this._weatherMod.tintB = 10;
        this._weatherMod.dimming = 0.06;
      }
    }
  }

  /**
   * Render the full lighting overlay onto the game canvas.
   * Call this AFTER all game elements are drawn.
   * @param {CanvasRenderingContext2D} ctx  Main canvas context
   * @param {number} w   Canvas pixel width
   * @param {number} h   Canvas pixel height
   * @param {number} mapW  Map pixel width (MAP_COLS * TILE_SIZE * scale)
   * @param {number} mapH  Map pixel height (MAP_ROWS * TILE_SIZE * scale)
   */
  renderLighting(ctx, w, h, mapW, mapH) {
    const scaleX = mapW / (MAP_COLS * TILE_SIZE);
    const scaleY = mapH / (MAP_ROWS * TILE_SIZE);

    ctx.save();

    // 1. Ambient tint (full-screen color overlay)
    this._renderAmbientTint(ctx, w, h);

    // 2. Window light rays
    this._renderWindowRays(ctx, mapW, mapH, scaleX, scaleY);

    // 3. Floor light patches
    this._renderFloorPatches(ctx, mapW, mapH, scaleX, scaleY);

    // 4. Fluorescent light wash (competes with natural)
    this._renderFluorescent(ctx, mapW, mapH);

    // 5. Weather dimming overlay
    this._renderWeatherOverlay(ctx, w, h);

    ctx.restore();
  }

  // ---- Ambient tint ----
  _renderAmbientTint(ctx, w, h) {
    const c = this._current;
    const wm = this._weatherMod;

    const r = clamp(Math.round(c.ambient.r + wm.tintR), 0, 255);
    const g = clamp(Math.round(c.ambient.g + wm.tintG), 0, 255);
    const b = clamp(Math.round(c.ambient.b + wm.tintB), 0, 255);
    const a = clamp(c.ambient.a + wm.warmth * 0.02, 0.02, 0.08);

    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---- Window light rays ----
  _renderWindowRays(ctx, mapW, mapH, sx, sy) {
    const c = this._current;
    const glow = c.windowGlow;
    const intensity = c.sunIntensity * (1 - this._weatherMod.dimming);

    if (intensity < 0.05) return;

    ctx.globalCompositeOperation = 'screen';

    for (const win of WINDOWS) {
      const wx = win.col * TILE_SIZE * sx;
      const wy = win.row * TILE_SIZE * sy;

      // Ray direction based on shadow angle — rays point opposite to shadows
      const angle = c.shadowAngle;
      const rayLen = TILE_SIZE * 5 * sy * intensity;

      // Only cast rays inward from the window side
      const inward = win.side === 'left' ? 1 : -1;

      // Trapezoid ray: narrow at window, wider as it extends inward
      const startX = win.side === 'left' ? 0 : mapW;
      const startY = wy + TILE_SIZE * sy * 0.5;

      const endX = startX + inward * rayLen * Math.cos(angle * 0.3 + (inward > 0 ? 0 : Math.PI));
      const spreadY = TILE_SIZE * 1.5 * sy * intensity;

      // Vertical offset from sun angle
      const yShift = Math.sin(angle) * rayLen * 0.4;

      const alpha = clamp(glow.a * intensity * 0.6, 0, 0.15);

      const grad = ctx.createLinearGradient(startX, startY, endX, startY + yShift);
      grad.addColorStop(0, `rgba(${Math.round(glow.r)},${Math.round(glow.g)},${Math.round(glow.b)},${alpha.toFixed(3)})`);
      grad.addColorStop(1, `rgba(${Math.round(glow.r)},${Math.round(glow.g)},${Math.round(glow.b)},0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(startX, startY - TILE_SIZE * sy * 0.4);
      ctx.lineTo(startX, startY + TILE_SIZE * sy * 0.4);
      ctx.lineTo(endX, startY + yShift + spreadY);
      ctx.lineTo(endX, startY + yShift - spreadY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  // ---- Floor light patches ----
  _renderFloorPatches(ctx, mapW, mapH, sx, sy) {
    const c = this._current;
    const intensity = c.sunIntensity * (1 - this._weatherMod.dimming);
    if (intensity < 0.1) return;

    const glow = c.windowGlow;
    const angle = c.shadowAngle;

    ctx.globalCompositeOperation = 'screen';

    // Patches on customer area floor from side windows
    for (let row = LIGHT_ROWS_MIN; row <= LIGHT_ROWS_MAX; row++) {
      // Horizontal offset based on sun angle
      const sunOffsetX = Math.cos(angle) * (row - 4) * TILE_SIZE * sx * 0.3;

      // Left window patches
      const patchX1 = TILE_SIZE * 1.5 * sx + sunOffsetX;
      const patchY = row * TILE_SIZE * sy;
      const patchW = TILE_SIZE * 2 * sx * intensity;
      const patchH = TILE_SIZE * 0.8 * sy;

      const alpha1 = clamp(intensity * 0.04 * (1 - Math.abs(row - 4) * 0.15), 0, 0.06);

      const g1 = ctx.createRadialGradient(
        patchX1 + patchW * 0.5, patchY + patchH * 0.5, 0,
        patchX1 + patchW * 0.5, patchY + patchH * 0.5, patchW * 0.7
      );
      g1.addColorStop(0, `rgba(${Math.round(glow.r)},${Math.round(glow.g)},${Math.round(glow.b)},${alpha1.toFixed(3)})`);
      g1.addColorStop(1, `rgba(${Math.round(glow.r)},${Math.round(glow.g)},${Math.round(glow.b)},0)`);

      ctx.fillStyle = g1;
      ctx.fillRect(patchX1, patchY, patchW, patchH);

      // Right window patches
      const patchX2 = mapW - TILE_SIZE * 3.5 * sx - sunOffsetX;

      const g2 = ctx.createRadialGradient(
        patchX2 + patchW * 0.5, patchY + patchH * 0.5, 0,
        patchX2 + patchW * 0.5, patchY + patchH * 0.5, patchW * 0.7
      );
      g2.addColorStop(0, `rgba(${Math.round(glow.r)},${Math.round(glow.g)},${Math.round(glow.b)},${alpha1.toFixed(3)})`);
      g2.addColorStop(1, `rgba(${Math.round(glow.r)},${Math.round(glow.g)},${Math.round(glow.b)},0)`);

      ctx.fillStyle = g2;
      ctx.fillRect(patchX2, patchY, patchW, patchH);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  // ---- Fluorescent light wash ----
  _renderFluorescent(ctx, mapW, mapH) {
    const c = this._current;
    const fl = c.fluorescent;
    if (fl < 0.05) return;

    // Fluorescent light is a cool-white wash over the workspace area (rows 8-18)
    // It competes with natural light — stronger at midday, weaker at edges of day
    const wsTop = 8 * TILE_SIZE * (mapH / (MAP_ROWS * TILE_SIZE));
    const wsHeight = 10 * TILE_SIZE * (mapH / (MAP_ROWS * TILE_SIZE));

    // Very subtle cool white overlay
    const alpha = clamp(fl * 0.025, 0, 0.04);
    ctx.globalCompositeOperation = 'screen';

    const grad = ctx.createLinearGradient(0, wsTop, 0, wsTop + wsHeight);
    grad.addColorStop(0, `rgba(220,225,240,${alpha.toFixed(3)})`);
    grad.addColorStop(0.3, `rgba(230,235,245,${(alpha * 1.2).toFixed(3)})`);
    grad.addColorStop(1, `rgba(215,220,235,${(alpha * 0.5).toFixed(3)})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, wsTop, mapW, wsHeight);

    ctx.globalCompositeOperation = 'source-over';
  }

  // ---- Weather dimming overlay ----
  _renderWeatherOverlay(ctx, w, h) {
    const dim = this._weatherMod.dimming;
    if (dim < 0.01) return;

    // Slight darkening + blue shift for rain/storm
    ctx.globalCompositeOperation = 'multiply';
    const v = Math.round(255 * (1 - dim * 0.4));
    const bv = Math.round(Math.min(255, v + dim * 20));
    ctx.fillStyle = `rgb(${v},${v},${bv})`;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------- Getter methods for other systems ----------

  /**
   * Current ambient tint color with weather modification applied.
   * @returns {{ r: number, g: number, b: number, a: number }}
   */
  getAmbientColor() {
    const c = this._current;
    const wm = this._weatherMod;
    return {
      r: clamp(Math.round(c.ambient.r + wm.tintR), 0, 255),
      g: clamp(Math.round(c.ambient.g + wm.tintG), 0, 255),
      b: clamp(Math.round(c.ambient.b + wm.tintB), 0, 255),
      a: clamp(c.ambient.a + wm.warmth * 0.02, 0.02, 0.08),
    };
  }

  /**
   * Shadow angle in radians indicating sun position.
   * Negative = sun from east, 0 = overhead, positive = sun from west.
   * @returns {number}
   */
  getShadowAngle() {
    return this._current.shadowAngle;
  }

  /**
   * Shadow length multiplier (0 = no shadows, 1 = very long shadows).
   * @returns {number}
   */
  getShadowLength() {
    return clamp(this._current.shadowLength * (1 + this._weatherMod.dimming * 0.2), 0, 1);
  }

  /**
   * Sun intensity (0 = dark, 1 = full brightness).
   * @returns {number}
   */
  getSunIntensity() {
    return clamp(this._current.sunIntensity * (1 - this._weatherMod.dimming), 0, 1);
  }

  /**
   * Window glow color for window light spill effects.
   * @returns {{ r: number, g: number, b: number, a: number }}
   */
  getWindowGlow() {
    const g = this._current.windowGlow;
    const wm = this._weatherMod;
    return {
      r: clamp(Math.round(g.r + wm.tintR * 0.5), 0, 255),
      g: clamp(Math.round(g.g + wm.tintG * 0.5), 0, 255),
      b: clamp(Math.round(g.b + wm.tintB * 0.5), 0, 255),
      a: clamp(g.a * (1 - wm.dimming * 0.5), 0, 0.2),
    };
  }
}
