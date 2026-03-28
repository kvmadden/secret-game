// seasonal.js - Seasonal/holiday decoration system for 2D pixel art pharmacy game
// Detects real-world date and adds charming pixel art decorations to the pharmacy.
// Like Stardew Valley's seasonal changes - visual variety tied to the calendar.

// No imports - all self-contained.

// ---- Sprite cache ----
const _spriteCache = {};

function getCachedSprite(key, width, height, drawFn) {
  if (_spriteCache[key]) return _spriteCache[key];
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawFn(ctx, width, height);
  _spriteCache[key] = c;
  return c;
}

// ---- Pixel art drawing helpers ----

function drawPixel(ctx, x, y, color, size) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size || 1, size || 1);
}

function drawRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawText(ctx, text, x, y, color, bgColor) {
  // Tiny pixel text rendered as filled rectangles (3x5 font)
  // For simplicity, render as a sign with text via canvas font at small size
  if (bgColor) {
    const textW = text.length * 4 + 2;
    drawRect(ctx, x, y, textW, 7, bgColor);
    drawRect(ctx, x, y, textW, 1, '#00000033');
  }
  ctx.fillStyle = color;
  ctx.font = '5px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(text, x + 1, y + 1);
}

// ---- Sprite generators ----

function makeFlowerPot(petalColor) {
  return getCachedSprite('flowerpot_' + petalColor, 8, 8, (ctx) => {
    // Terracotta pot
    drawRect(ctx, 2, 5, 4, 3, '#b5651d');
    drawRect(ctx, 1, 5, 6, 1, '#c4722e');
    // Stem
    drawRect(ctx, 3, 2, 1, 3, '#3a7a30');
    // Petals
    drawPixel(ctx, 2, 1, petalColor);
    drawPixel(ctx, 4, 1, petalColor);
    drawPixel(ctx, 3, 0, petalColor);
    drawPixel(ctx, 2, 2, petalColor);
    drawPixel(ctx, 4, 2, petalColor);
    // Center
    drawPixel(ctx, 3, 1, '#ffe066');
    // Leaves
    drawPixel(ctx, 1, 3, '#3a7a30');
    drawPixel(ctx, 5, 3, '#3a7a30');
  });
}

function makeSign(text, bgColor, textColor) {
  const w = Math.max(text.length * 4 + 4, 16);
  const h = 8;
  return getCachedSprite('sign_' + text + bgColor, w, h, (ctx) => {
    // Sign background
    drawRect(ctx, 0, 0, w, h, bgColor);
    // Border
    drawRect(ctx, 0, 0, w, 1, '#00000044');
    drawRect(ctx, 0, h - 1, w, 1, '#00000044');
    drawRect(ctx, 0, 0, 1, h, '#00000022');
    drawRect(ctx, w - 1, 0, 1, h, '#00000022');
    // Text
    ctx.fillStyle = textColor || '#ffffff';
    ctx.font = '5px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(text, 2, 2);
  });
}

function makeFanSprite() {
  return getCachedSprite('fan', 8, 8, (ctx) => {
    // Base
    drawRect(ctx, 2, 6, 4, 2, '#666666');
    // Stand
    drawRect(ctx, 3, 4, 2, 2, '#888888');
    // Fan circle
    drawRect(ctx, 1, 0, 6, 5, '#cccccc');
    drawRect(ctx, 0, 1, 8, 3, '#cccccc');
    // Center
    drawPixel(ctx, 3, 2, '#444444');
    drawPixel(ctx, 4, 2, '#444444');
    // Blades (hint)
    drawPixel(ctx, 2, 1, '#aaaaaa');
    drawPixel(ctx, 5, 1, '#aaaaaa');
    drawPixel(ctx, 2, 3, '#aaaaaa');
    drawPixel(ctx, 5, 3, '#aaaaaa');
  });
}

function makeSunglassesRack() {
  return getCachedSprite('sunglasses_rack', 8, 8, (ctx) => {
    // Rack post
    drawRect(ctx, 3, 0, 2, 8, '#8b6f47');
    // Sunglasses 1 (top)
    drawRect(ctx, 0, 1, 3, 2, '#222222');
    drawRect(ctx, 5, 1, 3, 2, '#222222');
    drawPixel(ctx, 3, 1, '#222222');
    drawPixel(ctx, 4, 1, '#222222');
    // Sunglasses 2 (bottom)
    drawRect(ctx, 0, 5, 3, 2, '#4a2211');
    drawRect(ctx, 5, 5, 3, 2, '#4a2211');
    drawPixel(ctx, 3, 5, '#4a2211');
    drawPixel(ctx, 4, 5, '#4a2211');
  });
}

function makePumpkin() {
  return getCachedSprite('pumpkin', 8, 8, (ctx) => {
    // Body
    drawRect(ctx, 1, 3, 6, 4, '#e87800');
    drawRect(ctx, 2, 2, 4, 5, '#e87800');
    // Ribs (darker lines)
    drawRect(ctx, 2, 3, 1, 4, '#cc6600');
    drawRect(ctx, 5, 3, 1, 4, '#cc6600');
    // Stem
    drawRect(ctx, 3, 0, 2, 2, '#5a7a30');
    drawPixel(ctx, 3, 1, '#4a6a20');
    // Highlight
    drawPixel(ctx, 3, 3, '#f0a030');
  });
}

function makeJackOLantern() {
  return getCachedSprite('jack_o_lantern', 8, 8, (ctx) => {
    // Body
    drawRect(ctx, 1, 3, 6, 4, '#e87800');
    drawRect(ctx, 2, 2, 4, 5, '#e87800');
    // Ribs
    drawRect(ctx, 2, 3, 1, 4, '#cc6600');
    drawRect(ctx, 5, 3, 1, 4, '#cc6600');
    // Stem
    drawRect(ctx, 3, 0, 2, 2, '#5a7a30');
    // Eyes (triangle-ish, glowing)
    drawPixel(ctx, 2, 3, '#ffee00');
    drawPixel(ctx, 3, 4, '#ffee00');
    drawPixel(ctx, 5, 3, '#ffee00');
    drawPixel(ctx, 4, 4, '#ffee00');
    // Mouth
    drawPixel(ctx, 2, 5, '#ffee00');
    drawPixel(ctx, 3, 6, '#ffee00');
    drawPixel(ctx, 4, 6, '#ffee00');
    drawPixel(ctx, 5, 5, '#ffee00');
  });
}

function makeWreath() {
  return getCachedSprite('wreath', 8, 8, (ctx) => {
    // Green circle
    const g = '#2d6a2d';
    const dg = '#1d4a1d';
    // Top
    drawRect(ctx, 2, 0, 4, 1, g);
    // Sides
    drawRect(ctx, 0, 2, 2, 4, g);
    drawRect(ctx, 6, 2, 2, 4, g);
    // Bottom
    drawRect(ctx, 2, 7, 4, 1, g);
    // Corners
    drawPixel(ctx, 1, 1, g);
    drawPixel(ctx, 6, 1, g);
    drawPixel(ctx, 1, 6, g);
    drawPixel(ctx, 6, 6, g);
    // Dark accents
    drawPixel(ctx, 0, 3, dg);
    drawPixel(ctx, 7, 4, dg);
    drawPixel(ctx, 3, 0, dg);
    drawPixel(ctx, 4, 7, dg);
    // Red berries
    drawPixel(ctx, 1, 2, '#cc2222');
    drawPixel(ctx, 6, 5, '#cc2222');
    drawPixel(ctx, 3, 7, '#cc2222');
    // Red bow at bottom center
    drawPixel(ctx, 3, 6, '#cc2222');
    drawPixel(ctx, 4, 6, '#cc2222');
    drawPixel(ctx, 2, 7, '#ee3333');
    drawPixel(ctx, 5, 7, '#ee3333');
  });
}

function makeSpiderWeb() {
  return getCachedSprite('spider_web', 8, 8, (ctx) => {
    const c = '#cccccc';
    // Corner web radiating from top-left
    // Radial lines
    for (let i = 0; i < 8; i++) { drawPixel(ctx, 0, i, c); }
    for (let i = 0; i < 8; i++) { drawPixel(ctx, i, 0, c); }
    // Diagonal
    for (let i = 0; i < 7; i++) { drawPixel(ctx, i, i, c); }
    // Arc lines
    drawPixel(ctx, 1, 3, c);
    drawPixel(ctx, 2, 2, c);
    drawPixel(ctx, 3, 1, c);
    // Outer arc
    drawPixel(ctx, 2, 5, c);
    drawPixel(ctx, 3, 4, c);
    drawPixel(ctx, 4, 3, c);
    drawPixel(ctx, 5, 2, c);
    // Tiny spider
    drawPixel(ctx, 4, 4, '#222222');
    drawPixel(ctx, 3, 3, '#333333');
  });
}

function makeCandyBowl() {
  return getCachedSprite('candy_bowl', 8, 8, (ctx) => {
    // Bowl
    drawRect(ctx, 1, 4, 6, 3, '#8b6f47');
    drawRect(ctx, 0, 4, 8, 1, '#9a7a50');
    drawRect(ctx, 2, 7, 4, 1, '#7a5a30');
    // Candies poking out
    drawPixel(ctx, 2, 3, '#e63946');
    drawPixel(ctx, 3, 2, '#f4a261');
    drawPixel(ctx, 4, 3, '#2a9d8f');
    drawPixel(ctx, 5, 2, '#8338ec');
    drawPixel(ctx, 3, 3, '#e9c46a');
    drawPixel(ctx, 5, 3, '#457b9d');
  });
}

function makeHeartDisplay() {
  return getCachedSprite('heart_display', 16, 8, (ctx) => {
    // Display case base
    drawRect(ctx, 0, 5, 16, 3, '#f0e4d0');
    drawRect(ctx, 0, 5, 16, 1, '#d4c8b4');
    // Hearts
    const colors = ['#ff6b81', '#e63946', '#ff4d6d', '#ff8fa3'];
    for (let i = 0; i < 4; i++) {
      const hx = 1 + i * 4;
      const hy = 2;
      drawPixel(ctx, hx, hy, colors[i]);
      drawPixel(ctx, hx + 2, hy, colors[i]);
      drawPixel(ctx, hx, hy + 1, colors[i]);
      drawPixel(ctx, hx + 1, hy + 1, colors[i]);
      drawPixel(ctx, hx + 2, hy + 1, colors[i]);
      drawPixel(ctx, hx + 1, hy + 2, colors[i]);
    }
  });
}

function makeGooglyEyes() {
  return getCachedSprite('googly_eyes', 8, 8, (ctx) => {
    // Two googly eyes on a pill bottle silhouette
    // Bottle
    drawRect(ctx, 1, 2, 6, 6, '#dddddd');
    drawRect(ctx, 2, 0, 4, 3, '#cc8833');
    // Eyes
    drawRect(ctx, 1, 3, 3, 3, '#ffffff');
    drawRect(ctx, 4, 3, 3, 3, '#ffffff');
    // Pupils (slightly off-center for comedy)
    drawPixel(ctx, 2, 4, '#111111');
    drawPixel(ctx, 6, 5, '#111111');
  });
}

function makeAutumnGarland() {
  return getCachedSprite('autumn_garland', 16, 8, (ctx) => {
    // Draped string
    const colors = ['#cc6600', '#8b4513', '#cc3300', '#e8a020', '#886622'];
    // String
    drawRect(ctx, 0, 2, 16, 1, '#5a4030');
    // Drape curve
    drawPixel(ctx, 4, 3, '#5a4030');
    drawPixel(ctx, 8, 4, '#5a4030');
    drawPixel(ctx, 12, 3, '#5a4030');
    // Leaves hanging
    for (let i = 0; i < 6; i++) {
      const lx = 1 + i * 2 + (i > 2 ? 1 : 0);
      const ly = 3 + ((i % 3 === 1) ? 1 : 0);
      drawPixel(ctx, lx, ly, colors[i % colors.length]);
      drawPixel(ctx, lx, ly + 1, colors[(i + 1) % colors.length]);
    }
  });
}

function makeConfettiSprite() {
  return getCachedSprite('confetti_deco', 16, 8, (ctx) => {
    const colors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#8338ec'];
    // Scatter confetti pieces
    for (let i = 0; i < 12; i++) {
      const cx = Math.floor(Math.random() * 14) + 1;
      const cy = Math.floor(Math.random() * 6) + 1;
      drawPixel(ctx, cx, cy, colors[i % colors.length]);
    }
  });
}

// ---- Animated sprite: Christmas lights ----
// Returns a function that draws blinking lights into a provided ctx at (x, y)
function drawChristmasLights(ctx, x, y, width, time) {
  const colors = ['#ff0000', '#00cc00', '#0066ff', '#ffcc00', '#ff00ff'];
  const spacing = 3;
  const count = Math.floor(width / spacing);
  // Wire
  ctx.fillStyle = '#333333';
  ctx.fillRect(x, y, width, 1);
  for (let i = 0; i < count; i++) {
    const blink = Math.sin(time * 3 + i * 1.8) > -0.3;
    if (blink) {
      ctx.fillStyle = colors[i % colors.length];
    } else {
      ctx.fillStyle = '#444444';
    }
    ctx.fillRect(x + i * spacing + 1, y + 1, 1, 1);
  }
}

// ---- Particle-like ambient effects ----

class AmbientParticle {
  constructor(type, bounds) {
    this.type = type;
    this.bounds = bounds;
    this.reset();
  }

  reset() {
    const b = this.bounds;
    this.x = b.x + Math.random() * b.w;
    this.y = b.y - 2 + Math.random() * b.h;
    this.vx = (Math.random() - 0.3) * 8;
    this.vy = 2 + Math.random() * 6;
    this.life = 3 + Math.random() * 4;
    this.maxLife = this.life;
    this.wobble = Math.random() * Math.PI * 2;
    this.size = 1 + Math.floor(Math.random() * 2);

    if (this.type === 'snowflake') {
      this.vy = 3 + Math.random() * 5;
      this.vx = (Math.random() - 0.5) * 4;
    } else if (this.type === 'confetti_particle') {
      this.vy = 4 + Math.random() * 8;
      this.vx = (Math.random() - 0.5) * 10;
      this.life = 2 + Math.random() * 3;
      this.maxLife = this.life;
      this.color = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261'][Math.floor(Math.random() * 5)];
    }
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) { this.reset(); return; }
    this.wobble += dt * 2;
    this.x += (this.vx + Math.sin(this.wobble) * 3) * dt;
    this.y += this.vy * dt;
    // Wrap if out of bounds
    if (this.y > this.bounds.y + this.bounds.h + 4) { this.reset(); }
    if (this.x < this.bounds.x - 4 || this.x > this.bounds.x + this.bounds.w + 4) { this.reset(); }
  }

  render(ctx) {
    const alpha = Math.min(1, (this.life / this.maxLife) * 2);
    ctx.globalAlpha = alpha * 0.6;

    switch (this.type) {
      case 'green_leaf': {
        ctx.fillStyle = '#5a8a50';
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
        ctx.fillStyle = '#3a6a30';
        ctx.fillRect(Math.round(this.x) + 1, Math.round(this.y), 1, 1);
        break;
      }
      case 'brown_leaf': {
        const colors = ['#8b6914', '#a07828', '#6b4f2e'];
        ctx.fillStyle = colors[Math.floor(this.wobble) % 3];
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
        break;
      }
      case 'snowflake': {
        ctx.fillStyle = '#ffffff';
        const sx = Math.round(this.x);
        const sy = Math.round(this.y);
        ctx.fillRect(sx, sy, 1, 1);
        if (this.size > 1) {
          ctx.globalAlpha = alpha * 0.3;
          ctx.fillRect(sx - 1, sy, 1, 1);
          ctx.fillRect(sx + 1, sy, 1, 1);
          ctx.fillRect(sx, sy - 1, 1, 1);
          ctx.fillRect(sx, sy + 1, 1, 1);
        }
        break;
      }
      case 'confetti_particle': {
        ctx.fillStyle = this.color || '#e63946';
        ctx.fillRect(Math.round(this.x), Math.round(this.y), 1, 1);
        break;
      }
      case 'pink_heart': {
        ctx.fillStyle = '#ff6b81';
        const hx = Math.round(this.x);
        const hy = Math.round(this.y);
        ctx.fillRect(hx, hy, 1, 1);
        ctx.fillRect(hx + 1, hy, 1, 1);
        ctx.fillRect(hx - 1, hy, 1, 1);
        ctx.fillRect(hx, hy + 1, 1, 1);
        break;
      }
    }
    ctx.globalAlpha = 1;
  }
}

// ---- Season / Holiday detection ----

function detectSeasonInfo(date) {
  const month = date.getMonth();   // 0-11
  const day = date.getDate();
  const dow = date.getDay();       // 0=Sun

  // Check special days first (they override seasons)
  // New Year's Day
  if (month === 0 && day === 1) {
    return { season: 'winter', holiday: 'new_year' };
  }
  // Valentine's Day
  if (month === 1 && day === 14) {
    return { season: 'winter', holiday: 'valentines' };
  }
  // April Fools
  if (month === 3 && day === 1) {
    return { season: 'spring', holiday: 'april_fools' };
  }
  // Halloween
  if (month === 9 && day === 31) {
    return { season: 'fall', holiday: 'halloween' };
  }
  // Thanksgiving week (US: 4th Thursday of November)
  if (month === 10) {
    // Find the 4th Thursday
    let thursdayCount = 0;
    let thanksgivingDay = 0;
    for (let d = 1; d <= 30; d++) {
      const testDate = new Date(date.getFullYear(), 10, d);
      if (testDate.getDay() === 4) {
        thursdayCount++;
        if (thursdayCount === 4) { thanksgivingDay = d; break; }
      }
    }
    // Thanksgiving week = Thu through Sun
    if (day >= thanksgivingDay && day <= thanksgivingDay + 3) {
      return { season: 'fall', holiday: 'thanksgiving' };
    }
  }

  // Seasons by month
  if (month >= 2 && month <= 4) {
    return { season: 'spring', holiday: null };
  }
  if (month >= 5 && month <= 7) {
    return { season: 'summer', holiday: null };
  }
  if (month >= 8 && month <= 10) {
    return { season: 'fall', holiday: null };
  }
  // Dec, Jan, Feb
  return { season: 'winter', holiday: null };
}

// ---- Palette overrides per season ----

const PALETTE_OVERRIDES = {
  spring: {
    FLOOR: '#e4dcc4',
    FLOOR_DARK: '#d8d0b8',
    WALL: '#ecE4d0',
    CUSTOMER_FLOOR: '#e0dcc0',
    accent1: '#ff88aa',   // pink
    accent2: '#88cc44',   // bright green
  },
  summer: {
    FLOOR: '#e8dcc0',
    FLOOR_DARK: '#dcd0b0',
    WALL: '#f0e8d4',
    CUSTOMER_FLOOR: '#e4dcc0',
    accent1: '#ffdd44',   // warm yellow
    accent2: '#fffff0',   // bright white
  },
  fall: {
    FLOOR: '#dcd0b4',
    FLOOR_DARK: '#d0c4a8',
    WALL: '#e4d8c0',
    CUSTOMER_FLOOR: '#d8ccb0',
    accent1: '#dd8833',   // orange
    accent2: '#8b6f47',   // brown
  },
  winter: {
    FLOOR: '#dce4ec',
    FLOOR_DARK: '#d0d8e0',
    WALL: '#e8e8f0',
    CUSTOMER_FLOOR: '#d8dce4',
    accent1: '#88aadd',   // cool blue
    accent2: '#fff8ee',   // warm indoor glow
  },
};

// ========================================================================
// SeasonalDecorations class
// ========================================================================

export class SeasonalDecorations {
  constructor() {
    this._seasonInfo = null;
    this._decorations = null;
    this._ambientParticles = [];
    this._time = 0;
    this._lastDetect = 0;
  }

  /**
   * Detect current season/holiday from real date.
   * Caches result and re-checks every 60 seconds.
   * @returns {{ season: string, holiday: string|null }}
   */
  detectSeason() {
    const now = Date.now();
    if (this._seasonInfo && now - this._lastDetect < 60000) {
      return this._seasonInfo;
    }
    this._seasonInfo = detectSeasonInfo(new Date());
    this._lastDetect = now;
    // Invalidate decorations cache when season changes
    this._decorations = null;
    this._ambientParticles = [];
    return this._seasonInfo;
  }

  /**
   * Get decorative overlay sprites to render on the map.
   * @param {number} mapCols - Number of tile columns
   * @param {number} mapRows - Number of tile rows
   * @param {number} tileSize - Pixel size of one tile
   * @returns {Array<{ x: number, y: number, sprite: HTMLCanvasElement, layer: string }>}
   */
  getDecorations(mapCols, mapRows, tileSize) {
    if (this._decorations) return this._decorations;

    const info = this.detectSeason();
    const decos = [];

    // Entrance area: around row 1-2, col 2-6
    // Counter: row 7-8
    // Workspace: rows 9-13
    // Back wall: rows 16-17
    // Customer area: rows 2-6
    // Notice board / wall area: row 0-1

    const ts = tileSize;

    // ---- Holiday overrides ----
    if (info.holiday === 'new_year') {
      decos.push({ x: 2 * ts, y: 0, sprite: makeSign('HAPPY NEW YEAR', '#2244aa', '#ffffff'), layer: 'above' });
      decos.push({ x: 6 * ts, y: 2 * ts, sprite: makeConfettiSprite(), layer: 'above' });
      this._initParticles('confetti_particle', mapCols, mapRows, tileSize, 8);
      this._decorations = decos;
      return decos;
    }

    if (info.holiday === 'valentines') {
      decos.push({ x: 2 * ts, y: 0, sprite: makeSign('BE MINE', '#ff6b81', '#ffffff'), layer: 'above' });
      decos.push({ x: 3 * ts, y: 7 * ts, sprite: makeHeartDisplay(), layer: 'above' });
      this._initParticles('pink_heart', mapCols, mapRows, tileSize, 5);
      this._decorations = decos;
      return decos;
    }

    if (info.holiday === 'april_fools') {
      // Googly eyes on pill bottles (subtle)
      decos.push({ x: 6 * ts, y: 10 * ts, sprite: makeGooglyEyes(), layer: 'above' });
      decos.push({ x: 8 * ts, y: 11 * ts, sprite: makeGooglyEyes(), layer: 'above' });
      decos.push({ x: 4 * ts, y: 14 * ts, sprite: makeGooglyEyes(), layer: 'above' });
      this._decorations = decos;
      return decos;
    }

    if (info.holiday === 'halloween') {
      decos.push({ x: 2 * ts, y: 1 * ts, sprite: makeJackOLantern(), layer: 'below' });
      decos.push({ x: 0, y: 0, sprite: makeSpiderWeb(), layer: 'above' });
      decos.push({ x: 10 * ts, y: 7 * ts, sprite: makeCandyBowl(), layer: 'above' });
      this._decorations = decos;
      return decos;
    }

    if (info.holiday === 'thanksgiving') {
      decos.push({ x: 3 * ts, y: 0, sprite: makeSign('CLOSED THU', '#8b6f47', '#ffffff'), layer: 'above' });
      decos.push({ x: 1 * ts, y: 7 * ts, sprite: makeAutumnGarland(), layer: 'above' });
      decos.push({ x: 5 * ts, y: 1 * ts, sprite: makePumpkin(), layer: 'below' });
      this._initParticles('brown_leaf', mapCols, mapRows, tileSize, 4);
      this._decorations = decos;
      return decos;
    }

    // ---- Seasonal decorations ----
    switch (info.season) {
      case 'spring':
        decos.push({ x: 2 * ts, y: 2 * ts, sprite: makeFlowerPot('#ff88aa'), layer: 'below' });
        decos.push({ x: 10 * ts, y: 2 * ts, sprite: makeFlowerPot('#ffcc44'), layer: 'below' });
        decos.push({ x: 3 * ts, y: 0, sprite: makeSign('ALLERGY SZN', '#88cc44', '#333333'), layer: 'above' });
        this._initParticles('green_leaf', mapCols, mapRows, tileSize, 5);
        break;

      case 'summer':
        decos.push({ x: 3 * ts, y: 0, sprite: makeSign('STAY HYDRATED', '#44aadd', '#ffffff'), layer: 'above' });
        decos.push({ x: 6 * ts, y: 7 * ts + 4, sprite: makeFanSprite(), layer: 'above' });
        decos.push({ x: 11 * ts, y: 1 * ts, sprite: makeSunglassesRack(), layer: 'below' });
        break;

      case 'fall':
        decos.push({ x: 2 * ts, y: 2 * ts, sprite: makePumpkin(), layer: 'below' });
        decos.push({ x: 2 * ts, y: 7 * ts, sprite: makeSign('FLU SHOTS', '#dd4444', '#ffffff'), layer: 'above' });
        this._initParticles('brown_leaf', mapCols, mapRows, tileSize, 5);
        break;

      case 'winter':
        // Wreath on back wall
        decos.push({ x: 6 * ts, y: 16 * ts, sprite: makeWreath(), layer: 'above' });
        // Holiday hours sign
        decos.push({ x: 3 * ts, y: 0, sprite: makeSign('HOLIDAY HRS', '#cc2222', '#ffffff'), layer: 'above' });
        // Snowflake particles in customer area
        this._initParticles('snowflake', mapCols, mapRows, tileSize, 6);
        // Christmas lights are rendered dynamically in render()
        break;
    }

    this._decorations = decos;
    return decos;
  }

  /**
   * Initialize ambient particles for the current season.
   */
  _initParticles(type, mapCols, mapRows, tileSize, count) {
    if (this._ambientParticles.length > 0) return;
    // Customer area: cols 2-11, rows 2-6
    const bounds = {
      x: 2 * tileSize,
      y: 2 * tileSize,
      w: 9 * tileSize,
      h: 4 * tileSize,
    };
    for (let i = 0; i < count; i++) {
      this._ambientParticles.push(new AmbientParticle(type, bounds));
    }
  }

  /**
   * Render decorations. Called after base map, before entities.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} mapCols
   * @param {number} mapRows
   * @param {number} tileSize
   */
  render(ctx, mapCols, mapRows, tileSize) {
    const decos = this.getDecorations(mapCols, mapRows, tileSize);
    const info = this.detectSeason();
    this._time += 1 / 60; // approximate frame time

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Render 'below' layer decorations
    for (let i = 0; i < decos.length; i++) {
      if (decos[i].layer === 'below') {
        ctx.drawImage(decos[i].sprite, Math.round(decos[i].x), Math.round(decos[i].y));
      }
    }

    // Render 'above' layer decorations
    for (let i = 0; i < decos.length; i++) {
      if (decos[i].layer === 'above') {
        ctx.drawImage(decos[i].sprite, Math.round(decos[i].x), Math.round(decos[i].y));
      }
    }

    // Winter: animated Christmas lights along counter (row 7)
    if (info.season === 'winter' && !info.holiday) {
      drawChristmasLights(ctx, 0, 7 * tileSize - 2, 13 * tileSize, this._time);
    }

    // Render ambient particles
    for (let i = 0; i < this._ambientParticles.length; i++) {
      this._ambientParticles[i].update(1 / 60);
      this._ambientParticles[i].render(ctx);
    }

    ctx.restore();
  }

  /**
   * Get color palette overrides for current season.
   * @returns {object} Key-value pairs of color overrides, or empty object.
   */
  getPaletteOverrides() {
    const info = this.detectSeason();
    return PALETTE_OVERRIDES[info.season] || {};
  }
}
