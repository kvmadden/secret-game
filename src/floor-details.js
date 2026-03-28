// floor-details.js - Dynamic floor detail and marks system for 2D pixel art pharmacy game
// Scuff marks, wet footprints, spills, dropped items, wheel tracks, polish reflections.
// Draws below characters but above base floor tiles. Max 50 active marks.

const MAX_MARKS = 50;
const TILE_SIZE = 16;

// Fade durations in seconds
const FOOTPRINT_WET_MAX_AGE = 10;
const FOOTPRINT_DRY_MAX_AGE = 30;
const SCUFF_MAX_AGE = 60;
const PAPER_MAX_AGE = 120;
const PILL_MAX_AGE = 90;
const WHEEL_MAX_AGE = 45;
const POLISH_MAX_AGE = Infinity;
const SPILL_MAX_AGE = Infinity; // stays until cleared

// Spill spread rate (px per second, very slow)
const SPILL_SPREAD_RATE = 0.08;
const SPILL_MAX_RADIUS = 5;

// Pill bounce animation duration
const PILL_BOUNCE_DURATION = 0.4;

// Colors
const SCUFF_COLOR = '#5a5550';
const FOOTPRINT_WET_COLOR = '#6b6058';
const FOOTPRINT_DRY_COLOR = '#c8bca8';
const PAPER_COLORS = ['#fff8ee', '#f5f0e1', '#ece4d4'];
const PAPER_SHADOW = 'rgba(0,0,0,0.12)';
const POLISH_COLOR = 'rgba(255,255,245,0.08)';
const WHEEL_COLOR = '#8a8278';

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return (rand(min, max) | 0);
}

function pickOne(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

// Generate an irregular blob shape as array of {dx, dy} offsets from center
function generateBlobPixels(radius) {
  const pixels = [];
  const r = Math.max(1, Math.round(radius));
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Include pixel if within radius with random edge erosion
      if (dist < r - 0.3 || (dist < r + 0.5 && Math.random() > 0.45)) {
        pixels.push({ dx, dy });
      }
    }
  }
  return pixels;
}

export class FloorDetailSystem {
  constructor(mapCols, mapRows, tileSize) {
    this.mapCols = mapCols || 16;
    this.mapRows = mapRows || 20;
    this.tileSize = tileSize || TILE_SIZE;
    this.marks = [];
  }

  // ---- Internal helpers ----

  _tileToPixel(col, row) {
    return {
      x: col * this.tileSize + (this.tileSize / 2),
      y: row * this.tileSize + (this.tileSize / 2),
    };
  }

  _addMark(mark) {
    // Enforce cap — remove oldest when full
    while (this.marks.length >= MAX_MARKS) {
      // Find oldest (highest age ratio)
      let oldestIdx = 0;
      let oldestRatio = -1;
      for (let i = 0; i < this.marks.length; i++) {
        const m = this.marks[i];
        const ratio = m.maxAge === Infinity ? m.age / 9999 : m.age / m.maxAge;
        if (ratio > oldestRatio) {
          oldestRatio = ratio;
          oldestIdx = i;
        }
      }
      this.marks.splice(oldestIdx, 1);
    }
    this.marks.push(mark);
  }

  // ---- Public: Add marks ----

  addFootprint(col, row, facing, wet) {
    const pos = this._tileToPixel(col, row);
    // Slight random offset within tile
    const ox = rand(-3, 3);
    const oy = rand(-3, 3);
    const maxAge = wet ? FOOTPRINT_WET_MAX_AGE : FOOTPRINT_DRY_MAX_AGE;

    this._addMark({
      type: 'footprint',
      x: pos.x + ox,
      y: pos.y + oy,
      col, row,
      facing: facing || 'down',
      wet: !!wet,
      age: 0,
      maxAge,
      alpha: wet ? 0.6 : 0.12,
      baseAlpha: wet ? 0.6 : 0.12,
    });
  }

  addScuffMark(col, row) {
    const pos = this._tileToPixel(col, row);
    const angle = rand(0, Math.PI);
    const length = randInt(2, 5);

    this._addMark({
      type: 'scuff',
      x: pos.x + rand(-4, 4),
      y: pos.y + rand(-4, 4),
      col, row,
      angle,
      length,
      age: 0,
      maxAge: SCUFF_MAX_AGE,
      alpha: rand(0.2, 0.45),
      baseAlpha: rand(0.2, 0.45),
    });
  }

  addSpill(col, row, color, size) {
    const pos = this._tileToPixel(col, row);
    const radius = Math.max(1.5, Math.min(3, size || rand(1.5, 3)));
    const pixels = generateBlobPixels(radius);

    this._addMark({
      type: 'spill',
      x: pos.x + rand(-2, 2),
      y: pos.y + rand(-2, 2),
      col, row,
      color: color || '#6b4a2e',
      radius,
      currentRadius: radius,
      pixels,
      age: 0,
      maxAge: SPILL_MAX_AGE,
      alpha: 0.55,
      baseAlpha: 0.55,
    });
  }

  addPaperDrop(col, row) {
    const pos = this._tileToPixel(col, row);
    const w = Math.random() > 0.5 ? 4 : 3;
    const h = Math.random() > 0.5 ? 3 : 2;
    const angle = rand(-0.3, 0.3);

    this._addMark({
      type: 'paper',
      x: pos.x + rand(-4, 4),
      y: pos.y + rand(-4, 4),
      col, row,
      w, h,
      angle,
      color: pickOne(PAPER_COLORS),
      age: 0,
      maxAge: PAPER_MAX_AGE,
      alpha: 0.85,
      baseAlpha: 0.85,
    });
  }

  addPillDrop(col, row, color) {
    const pos = this._tileToPixel(col, row);
    const pillColor = color || pickOne(['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#ffffff', '#e9c46a']);
    const size = Math.random() > 0.5 ? 2 : 1;

    this._addMark({
      type: 'pill',
      x: pos.x + rand(-4, 4),
      y: pos.y + rand(-4, 4),
      col, row,
      color: pillColor,
      size,
      age: 0,
      maxAge: PILL_MAX_AGE,
      alpha: 0.9,
      baseAlpha: 0.9,
      // Bounce animation state
      bounceTime: 0,
      bouncing: true,
      bounceStartY: pos.y + rand(-4, 4) - 6, // start slightly above
    });
  }

  addWheelTrack(col, row, direction) {
    const pos = this._tileToPixel(col, row);
    const dir = direction || 'down';

    this._addMark({
      type: 'wheel',
      x: pos.x,
      y: pos.y,
      col, row,
      direction: dir,
      age: 0,
      maxAge: WHEEL_MAX_AGE,
      alpha: 0.25,
      baseAlpha: 0.25,
    });
  }

  _addPolishReflection(col, row) {
    const pos = this._tileToPixel(col, row);
    this._addMark({
      type: 'polish',
      x: pos.x + rand(-3, 3),
      y: pos.y + rand(-3, 3),
      col, row,
      age: 0,
      maxAge: POLISH_MAX_AGE,
      alpha: 0.08,
      baseAlpha: 0.08,
      shimmerPhase: rand(0, Math.PI * 2),
    });
  }

  // ---- Automatic generation ----

  generateTraffic(pharmacistPath, patientPositions, weather) {
    const isRainy = weather === 'rain' || weather === 'rainy';

    // Pharmacist path: footprints if rainy, occasional scuffs
    if (pharmacistPath && pharmacistPath.length > 0) {
      for (let i = 0; i < pharmacistPath.length; i++) {
        const p = pharmacistPath[i];
        if (!p) continue;

        // Determine facing from path direction
        let facing = 'down';
        if (i > 0 && pharmacistPath[i - 1]) {
          const prev = pharmacistPath[i - 1];
          const dx = p.col - prev.col;
          const dy = p.row - prev.row;
          if (Math.abs(dx) > Math.abs(dy)) {
            facing = dx > 0 ? 'right' : 'left';
          } else {
            facing = dy > 0 ? 'down' : 'up';
          }
        }

        if (isRainy && Math.random() < 0.3) {
          this.addFootprint(p.col, p.row, facing, true);
        } else if (Math.random() < 0.05) {
          this.addScuffMark(p.col, p.row);
        }
      }
    }

    // Patient positions: occasional footprints and scuffs
    if (patientPositions && patientPositions.length > 0) {
      for (let i = 0; i < patientPositions.length; i++) {
        const p = patientPositions[i];
        if (!p) continue;
        if (isRainy && Math.random() < 0.15) {
          this.addFootprint(p.col, p.row, 'down', true);
        }
        if (Math.random() < 0.03) {
          this.addScuffMark(p.col, p.row);
        }
      }
    }

    // Randomly add polish reflections on empty floor tiles
    if (Math.random() < 0.02) {
      const col = randInt(0, this.mapCols);
      const row = randInt(0, this.mapRows);
      this._addPolishReflection(col, row);
    }
  }

  // ---- Lifecycle ----

  update(dt) {
    for (let i = this.marks.length - 1; i >= 0; i--) {
      const m = this.marks[i];
      m.age += dt;

      // Pill bounce animation
      if (m.type === 'pill' && m.bouncing) {
        m.bounceTime += dt;
        if (m.bounceTime >= PILL_BOUNCE_DURATION) {
          m.bouncing = false;
        }
      }

      // Spill slow spread
      if (m.type === 'spill' && m.currentRadius < SPILL_MAX_RADIUS) {
        m.currentRadius = Math.min(SPILL_MAX_RADIUS, m.currentRadius + SPILL_SPREAD_RATE * dt);
        // Regenerate pixels if radius crossed an integer boundary
        const newR = Math.round(m.currentRadius);
        const oldR = Math.round(m.currentRadius - SPILL_SPREAD_RATE * dt);
        if (newR > oldR) {
          m.pixels = generateBlobPixels(m.currentRadius);
        }
      }

      // Polish shimmer
      if (m.type === 'polish') {
        m.alpha = 0.04 + 0.06 * Math.abs(Math.sin(m.shimmerPhase + m.age * 0.5));
      }

      // Fade marks that have a finite maxAge
      if (m.maxAge !== Infinity) {
        const lifeRatio = m.age / m.maxAge;
        if (lifeRatio >= 1) {
          this.marks.splice(i, 1);
          continue;
        }
        // Start fading at 60% of life
        if (lifeRatio > 0.6) {
          const fadeRatio = (lifeRatio - 0.6) / 0.4;
          m.alpha = m.baseAlpha * (1 - fadeRatio);
        }
      }
    }
  }

  render(ctx) {
    for (let i = 0; i < this.marks.length; i++) {
      const m = this.marks[i];
      if (m.alpha <= 0.005) continue;

      switch (m.type) {
        case 'footprint': this._renderFootprint(ctx, m); break;
        case 'scuff':     this._renderScuff(ctx, m); break;
        case 'spill':     this._renderSpill(ctx, m); break;
        case 'paper':     this._renderPaper(ctx, m); break;
        case 'pill':      this._renderPill(ctx, m); break;
        case 'wheel':     this._renderWheel(ctx, m); break;
        case 'polish':    this._renderPolish(ctx, m); break;
      }
    }
  }

  clear() {
    this.marks.length = 0;
  }

  // ---- Renderers ----

  _renderFootprint(ctx, m) {
    const color = m.wet ? FOOTPRINT_WET_COLOR : FOOTPRINT_DRY_COLOR;
    ctx.globalAlpha = m.alpha;
    ctx.fillStyle = color;

    // Two small ovals representing shoe prints
    // Orientation changes based on facing
    let ox1, oy1, ox2, oy2;
    switch (m.facing) {
      case 'up':
        ox1 = -2; oy1 = 1; ox2 = 2; oy2 = 1;
        break;
      case 'down':
        ox1 = -2; oy1 = -1; ox2 = 2; oy2 = -1;
        break;
      case 'left':
        ox1 = 1; oy1 = -2; ox2 = 1; oy2 = 2;
        break;
      case 'right':
        ox1 = -1; oy1 = -2; ox2 = -1; oy2 = 2;
        break;
      default:
        ox1 = -2; oy1 = -1; ox2 = 2; oy2 = -1;
    }

    // Left shoe oval
    ctx.beginPath();
    ctx.ellipse(m.x + ox1, m.y + oy1, 1.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right shoe oval
    ctx.beginPath();
    ctx.ellipse(m.x + ox2, m.y + oy2, 1.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  _renderScuff(ctx, m) {
    ctx.globalAlpha = m.alpha;
    ctx.strokeStyle = SCUFF_COLOR;
    ctx.lineWidth = 1;

    const cos = Math.cos(m.angle);
    const sin = Math.sin(m.angle);
    const halfLen = m.length / 2;

    ctx.beginPath();
    ctx.moveTo(m.x - cos * halfLen, m.y - sin * halfLen);
    ctx.lineTo(m.x + cos * halfLen, m.y + sin * halfLen);
    ctx.stroke();

    ctx.globalAlpha = 1;
  }

  _renderSpill(ctx, m) {
    ctx.globalAlpha = m.alpha;
    ctx.fillStyle = m.color;

    const pixels = m.pixels;
    for (let j = 0; j < pixels.length; j++) {
      ctx.fillRect(m.x + pixels[j].dx, m.y + pixels[j].dy, 1, 1);
    }

    ctx.globalAlpha = 1;
  }

  _renderPaper(ctx, m) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle);

    // Shadow
    ctx.globalAlpha = m.alpha * 0.5;
    ctx.fillStyle = PAPER_SHADOW;
    ctx.fillRect(-m.w / 2 + 0.5, -m.h / 2 + 0.5, m.w, m.h);

    // Paper
    ctx.globalAlpha = m.alpha;
    ctx.fillStyle = m.color;
    ctx.fillRect(-m.w / 2, -m.h / 2, m.w, m.h);

    // Faint edge line for definition
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-m.w / 2, -m.h / 2, m.w, m.h);

    ctx.restore();
  }

  _renderPill(ctx, m) {
    let drawY = m.y;

    // Bounce animation: simple parabolic arc
    if (m.bouncing) {
      const t = m.bounceTime / PILL_BOUNCE_DURATION; // 0..1
      // Parabola: starts at bounceStartY, lands at m.y, bounces up to midpoint
      const bounceHeight = 4;
      if (t < 0.5) {
        // First drop
        const t2 = t / 0.5;
        drawY = m.bounceStartY + (m.y - m.bounceStartY) * t2;
      } else {
        // Bounce back up and settle
        const t2 = (t - 0.5) / 0.5;
        const peak = m.y - bounceHeight * (1 - t2);
        drawY = m.y - bounceHeight * Math.sin(t2 * Math.PI);
      }
    }

    ctx.globalAlpha = m.alpha;
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(m.x, drawY, m.size, 0, Math.PI * 2);
    ctx.fill();

    // Tiny highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(m.x - m.size + 1, drawY - m.size + 1, 1, 1);

    ctx.globalAlpha = 1;
  }

  _renderWheel(ctx, m) {
    ctx.globalAlpha = m.alpha;
    ctx.strokeStyle = WHEEL_COLOR;
    ctx.lineWidth = 1;

    const halfTile = this.tileSize / 2;
    const gap = 1; // half the gap between parallel tracks

    if (m.direction === 'up' || m.direction === 'down') {
      // Vertical parallel lines
      ctx.beginPath();
      ctx.moveTo(m.x - gap, m.y - halfTile);
      ctx.lineTo(m.x - gap, m.y + halfTile);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(m.x + gap, m.y - halfTile);
      ctx.lineTo(m.x + gap, m.y + halfTile);
      ctx.stroke();
    } else {
      // Horizontal parallel lines
      ctx.beginPath();
      ctx.moveTo(m.x - halfTile, m.y - gap);
      ctx.lineTo(m.x + halfTile, m.y - gap);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(m.x - halfTile, m.y + gap);
      ctx.lineTo(m.x + halfTile, m.y + gap);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  _renderPolish(ctx, m) {
    ctx.globalAlpha = m.alpha;
    ctx.fillStyle = POLISH_COLOR;

    // Small diamond-shaped highlight
    ctx.beginPath();
    ctx.moveTo(m.x, m.y - 2);
    ctx.lineTo(m.x + 1.5, m.y);
    ctx.lineTo(m.x, m.y + 2);
    ctx.lineTo(m.x - 1.5, m.y);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}
