// emotions.js - Emotion/mood indicator system for 2D pixel art pharmacy game
// Small pixel art icons that appear above characters' heads in thought bubbles

const EMOTION_DEFAULTS = {
  duration: 2.0,
  bubblePad: 4,
  bubbleRadius: 3,
  tailSize: 3,
  yOffset: -20,       // how far above entity position
  enterTime: 0.2,     // pop-in duration
  exitTime: 0.25,     // fade-out duration
  enterOvershoot: 1.3, // scale overshoot on enter
};

// ---- Pixel art drawing helpers ----

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w || 1, h || 1);
}

function drawPixels(ctx, ox, oy, rows, palette) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch !== '.' && palette[ch]) {
        px(ctx, ox + c, oy + r, 1, 1, palette[ch]);
      }
    }
  }
}

// ---- Procedural pixel art sprites (each fits roughly in 8x8) ----

const SPRITES = {
  heart(ctx, ox, oy, t) {
    // 7x6 pixel heart
    const p = { r: '#e03040' };
    const rows = [
      '.r.r.',
      'rrrrr',
      'rrrrr',
      '.rrr.',
      '..r..',
    ];
    const pulse = 1.0 + 0.15 * Math.sin(t * 6);
    ctx.save();
    ctx.translate(ox + 3, oy + 3);
    ctx.scale(pulse, pulse);
    drawPixels(ctx, -2.5, -2.5, rows, p);
    ctx.restore();
  },

  anger(ctx, ox, oy, t) {
    // Red cross/vein mark, manga style
    const c = '#e03040';
    const bounce = Math.abs(Math.sin(t * 8)) * 1.5;
    const by = oy - bounce;
    // Draw an X-shaped vein mark
    px(ctx, ox, by, 1, 1, c);
    px(ctx, ox + 4, by, 1, 1, c);
    px(ctx, ox + 1, by + 1, 1, 1, c);
    px(ctx, ox + 3, by + 1, 1, 1, c);
    px(ctx, ox + 2, by + 2, 1, 1, c);
    px(ctx, ox + 1, by + 3, 1, 1, c);
    px(ctx, ox + 3, by + 3, 1, 1, c);
    px(ctx, ox, by + 4, 1, 1, c);
    px(ctx, ox + 4, by + 4, 1, 1, c);
  },

  sweat(ctx, ox, oy, t) {
    // Blue teardrop that slides down
    const slide = (t * 2) % 1.0; // 0..1 repeating
    const dy = slide * 4;
    const alpha = 1.0 - slide * 0.5;
    ctx.globalAlpha *= alpha;
    const c1 = '#60a0e0';
    const c2 = '#80c0ff';
    // teardrop shape 3x5
    px(ctx, ox + 1, oy + dy, 1, 1, c2);
    px(ctx, ox, oy + 1 + dy, 1, 1, c1);
    px(ctx, ox + 1, oy + 1 + dy, 1, 1, c1);
    px(ctx, ox + 2, oy + 1 + dy, 1, 1, c1);
    px(ctx, ox, oy + 2 + dy, 1, 1, c1);
    px(ctx, ox + 1, oy + 2 + dy, 1, 1, c1);
    px(ctx, ox + 2, oy + 2 + dy, 1, 1, c1);
    px(ctx, ox + 1, oy + 3 + dy, 1, 1, c1);
    ctx.globalAlpha /= alpha;
  },

  question(ctx, ox, oy, t) {
    // Yellow "?" wobbles
    const wobble = Math.sin(t * 5) * 1.5;
    const c = '#e0c020';
    const rows = [
      '.rr.',
      'r..r',
      '...r',
      '..r.',
      '.r..',
      '.r..',
      '....',
      '.r..',
    ];
    drawPixels(ctx, ox + wobble, oy, rows, { r: c });
  },

  exclamation(ctx, ox, oy, t) {
    // Red "!" bounces up
    const bounce = Math.abs(Math.sin(t * 7)) * 2;
    const c = '#e03040';
    const by = oy - bounce;
    // vertical bar
    px(ctx, ox + 1, by, 1, 1, c);
    px(ctx, ox + 1, by + 1, 1, 1, c);
    px(ctx, ox + 1, by + 2, 1, 1, c);
    px(ctx, ox + 1, by + 3, 1, 1, c);
    px(ctx, ox + 1, by + 4, 1, 1, c);
    // dot
    px(ctx, ox + 1, by + 6, 1, 1, c);
  },

  money(ctx, ox, oy, t) {
    // Green "$" with spin/scale
    const scale = 1.0 + 0.2 * Math.sin(t * 5);
    const c = '#30b050';
    const rows = [
      '..r..',
      '.rrr.',
      'r....',
      '.rrr.',
      '....r',
      '.rrr.',
      '..r..',
    ];
    ctx.save();
    ctx.translate(ox + 3, oy + 3);
    ctx.scale(scale, scale);
    drawPixels(ctx, -2.5, -3.5, rows, { r: c });
    ctx.restore();
  },

  music(ctx, ox, oy, t) {
    // Music notes float up wavy
    const c1 = '#6060d0';
    const c2 = '#a060c0';
    // Two notes at different phases
    for (let i = 0; i < 2; i++) {
      const phase = t * 3 + i * 2.5;
      const frac = (phase % 2.0) / 2.0; // 0..1
      const nx = ox + i * 4 + Math.sin(phase * 2) * 2;
      const ny = oy + 4 - frac * 6;
      const alpha = 1.0 - frac * 0.6;
      ctx.globalAlpha *= alpha;
      const cc = i === 0 ? c1 : c2;
      // note head (2x2)
      px(ctx, nx, ny + 2, 2, 2, cc);
      // note stem
      px(ctx, nx + 1, ny, 1, 1, cc);
      px(ctx, nx + 1, ny + 1, 1, 1, cc);
      // flag
      px(ctx, nx + 2, ny, 1, 1, cc);
      px(ctx, nx + 2, ny + 1, 1, 1, cc);
      ctx.globalAlpha /= alpha;
    }
  },

  skull(ctx, ox, oy, t) {
    // Gray skull, slow pulse
    const pulse = 1.0 + 0.08 * Math.sin(t * 3);
    const p = { w: '#d0d0d0', d: '#808080', b: '#404040' };
    const rows = [
      '.www.',
      'wwwww',
      'wbwbw',
      'wwwww',
      '.dwd.',
      '.w.w.',
    ];
    ctx.save();
    ctx.translate(ox + 3, oy + 3);
    ctx.scale(pulse, pulse);
    drawPixels(ctx, -2.5, -3, rows, p);
    ctx.restore();
  },

  star(ctx, ox, oy, t) {
    // Golden star with twinkle (rotate + scale)
    const rot = t * 2;
    const scale = 0.9 + 0.2 * Math.sin(t * 6);
    const c = '#e0c030';
    const c2 = '#f0e060';
    ctx.save();
    ctx.translate(ox + 3, oy + 3);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    // Simple 5-point pixel star
    const rows = [
      '..c..',
      '..c..',
      'ccccc',
      '.ccc.',
      '.c.c.',
    ];
    drawPixels(ctx, -2.5, -2.5, rows, { c: c });
    // center highlight
    px(ctx, -0.5, -0.5, 1, 1, c2);
    ctx.restore();
  },

  zzz(ctx, ox, oy, t) {
    // Gray "Z"s float up in sequence
    const c = '#909090';
    for (let i = 0; i < 3; i++) {
      const phase = (t * 1.5 + i * 0.6) % 2.0;
      const frac = phase / 2.0;
      const zx = ox + i * 2.5;
      const zy = oy + 4 - frac * 7;
      const alpha = (1.0 - frac) * (0.5 + i * 0.25);
      const s = 0.6 + i * 0.2;
      ctx.globalAlpha *= Math.max(0, alpha);
      ctx.save();
      ctx.translate(zx + 1, zy + 1);
      ctx.scale(s, s);
      // tiny Z: 3x3
      px(ctx, -1, -1, 3, 1, c);
      px(ctx, 0, 0, 1, 1, c);
      px(ctx, -1, 1, 3, 1, c);
      ctx.restore();
      ctx.globalAlpha /= Math.max(0.01, alpha);
    }
  },

  thumbsup(ctx, ox, oy, t) {
    // Green thumbs up
    const bounce = Math.abs(Math.sin(t * 4)) * 1;
    const c = '#40b050';
    const c2 = '#60d070';
    const by = oy - bounce;
    // thumb (vertical bar)
    px(ctx, ox + 2, by, 1, 1, c2);
    px(ctx, ox + 2, by + 1, 1, 1, c);
    px(ctx, ox + 2, by + 2, 1, 1, c);
    // fist (horizontal block)
    px(ctx, ox, by + 3, 1, 1, c);
    px(ctx, ox + 1, by + 3, 1, 1, c);
    px(ctx, ox + 2, by + 3, 1, 1, c);
    px(ctx, ox + 3, by + 3, 1, 1, c);
    px(ctx, ox, by + 4, 1, 1, c);
    px(ctx, ox + 1, by + 4, 1, 1, c);
    px(ctx, ox + 2, by + 4, 1, 1, c);
    px(ctx, ox + 3, by + 4, 1, 1, c);
  },

  phone(ctx, ox, oy, t) {
    // Blue phone icon with vibrate shake
    const shake = Math.sin(t * 30) * (Math.sin(t * 4) > 0 ? 1 : 0);
    const c = '#4080d0';
    const c2 = '#80b0f0';
    const sx = ox + shake;
    // phone body 3x6
    px(ctx, sx, oy, 3, 1, c);
    px(ctx, sx, oy + 1, 3, 1, c2);
    px(ctx, sx, oy + 2, 3, 1, c2);
    px(ctx, sx, oy + 3, 3, 1, c2);
    px(ctx, sx, oy + 4, 3, 1, c);
    px(ctx, sx + 1, oy + 5, 1, 1, c);
  },

  pill(ctx, ox, oy, t) {
    // Colored capsule, bounce
    const bounce = Math.abs(Math.sin(t * 6)) * 2;
    const by = oy - bounce;
    const c1 = '#e04060';
    const c2 = '#f0f0f0';
    // capsule 5x3
    px(ctx, ox + 1, by, 1, 1, c1);
    px(ctx, ox + 2, by, 1, 1, c1);
    px(ctx, ox, by + 1, 1, 1, c1);
    px(ctx, ox + 1, by + 1, 1, 1, c1);
    px(ctx, ox + 2, by + 1, 1, 1, c2);
    px(ctx, ox + 3, by + 1, 1, 1, c2);
    px(ctx, ox + 1, by + 2, 1, 1, c1);
    px(ctx, ox + 2, by + 2, 1, 1, c2);
  },

  clock(ctx, ox, oy, t) {
    // Orange clock with tick animation
    const c = '#e09030';
    const c2 = '#f0c060';
    const c3 = '#803000';
    // circular face 5x5
    const rows = [
      '.ccc.',
      'cdddc',
      'cdhdc',
      'cdddc',
      '.ccc.',
    ];
    drawPixels(ctx, ox, oy, rows, { c: c, d: c2, h: c3 });
    // tick hand - rotates
    const angle = t * 3;
    const hx = Math.round(Math.cos(angle) * 1.5);
    const hy = Math.round(Math.sin(angle) * 1.5);
    px(ctx, ox + 2 + hx, oy + 2 + hy, 1, 1, c3);
  },

  spiral(ctx, ox, oy, t) {
    // Purple dizzy spiral, rotates
    const c = '#9050c0';
    const c2 = '#b070e0';
    ctx.save();
    ctx.translate(ox + 3, oy + 3);
    ctx.rotate(t * 4);
    // Draw a small spiral via pixels at rotated positions
    const pts = [
      [0, 0], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0],
      [-1, -1], [0, -1], [1, -1], [2, -1], [2, 0], [2, 1],
      [2, 2], [1, 2], [0, 2], [-1, 2], [-2, 2], [-2, 1],
      [-2, 0], [-2, -1], [-2, -2],
    ];
    for (let i = 0; i < pts.length; i++) {
      const col = i < pts.length / 2 ? c : c2;
      px(ctx, pts[i][0], pts[i][1], 1, 1, col);
    }
    ctx.restore();
  },
};

// ---- Active emotion instance ----

class EmotionInstance {
  constructor(entityId, type, x, y, duration) {
    this.entityId = entityId;
    this.type = type;
    this.x = x;
    this.y = y;
    this.duration = duration;
    this.elapsed = 0;
    this.alive = true;

    // Compute sprite bounding size for bubble
    this.spriteW = 8;
    this.spriteH = 8;
  }

  update(dt) {
    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.alive = false;
    }
  }

  // Returns current animation phase values
  getPhase() {
    const { elapsed, duration } = this;
    const enterT = EMOTION_DEFAULTS.enterTime;
    const exitT = EMOTION_DEFAULTS.exitTime;
    const exitStart = duration - exitT;

    let scale = 1;
    let alpha = 1;
    let floatY = 0;

    if (elapsed < enterT) {
      // Enter phase: pop in with overshoot
      const p = elapsed / enterT;
      const overshoot = EMOTION_DEFAULTS.enterOvershoot;
      // Cubic ease-out with overshoot
      const ep = 1 - Math.pow(1 - p, 3);
      scale = ep * overshoot;
      if (p > 0.6) {
        // Settle back from overshoot
        const settle = (p - 0.6) / 0.4;
        scale = overshoot - (overshoot - 1) * settle;
      }
      alpha = Math.min(1, p * 3);
    } else if (elapsed > exitStart && exitStart > enterT) {
      // Exit phase: fade + shrink
      const p = (elapsed - exitStart) / exitT;
      scale = 1 - p * 0.5;
      alpha = 1 - p;
      floatY = -p * 3;
    } else {
      // Hold phase
      const holdT = elapsed - enterT;
      floatY = Math.sin(holdT * 2) * 0.5;
    }

    return { scale: Math.max(0, scale), alpha: Math.max(0, Math.min(1, alpha)), floatY };
  }

  render(ctx) {
    const spriteFn = SPRITES[this.type];
    if (!spriteFn) return;

    const { scale, alpha, floatY } = this.getPhase();
    if (alpha <= 0) return;

    const pad = EMOTION_DEFAULTS.bubblePad;
    const bw = this.spriteW + pad * 2;
    const bh = this.spriteH + pad * 2;
    const tailH = EMOTION_DEFAULTS.tailSize;

    // Bubble center position (above entity)
    const bx = Math.round(this.x - bw / 2);
    const by = Math.round(this.y + EMOTION_DEFAULTS.yOffset + floatY - bh / 2);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Apply scale around bubble center
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    // Draw thought bubble background (rounded rect)
    this._drawBubble(ctx, bx, by, bw, bh, tailH);

    // Draw the sprite inside the bubble
    const spriteX = bx + pad;
    const spriteY = by + pad;

    // Hold animation time (time since enter finished)
    const holdT = Math.max(0, this.elapsed - EMOTION_DEFAULTS.enterTime);
    spriteFn(ctx, spriteX, spriteY, holdT);

    ctx.restore();
  }

  _drawBubble(ctx, x, y, w, h, tailH) {
    const r = EMOTION_DEFAULTS.bubbleRadius;

    // White bubble with slight shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    this._roundRect(ctx, x + 1, y + 1, w, h, r);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    this._roundRect(ctx, x, y, w, h, r);
    ctx.fill();

    // Thin border
    ctx.strokeStyle = '#a0a0a0';
    ctx.lineWidth = 0.5;
    this._roundRect(ctx, x, y, w, h, r);
    ctx.stroke();

    // Tail (small triangle pointing down)
    const tailX = x + w / 2;
    const tailY = y + h;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(tailX - tailH, tailY - 0.5);
    ctx.lineTo(tailX, tailY + tailH);
    ctx.lineTo(tailX + tailH, tailY - 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a0a0a0';
    ctx.lineWidth = 0.5;
    // Only stroke the two outer edges of the tail, not the top
    ctx.beginPath();
    ctx.moveTo(tailX - tailH, tailY - 0.5);
    ctx.lineTo(tailX, tailY + tailH);
    ctx.lineTo(tailX + tailH, tailY - 0.5);
    ctx.stroke();
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}

// ---- Main EmotionSystem class ----

export class EmotionSystem {
  constructor() {
    /** @type {Map<string, EmotionInstance>} */
    this.active = new Map();
  }

  /**
   * Show an emotion above an entity.
   * @param {string} entityId - Unique entity identifier
   * @param {string} type - Emotion type (heart, anger, sweat, question, etc.)
   * @param {number} x - World x position of entity
   * @param {number} y - World y position of entity (top of sprite)
   * @param {number} [duration] - Display duration in seconds (default 2)
   */
  show(entityId, type, x, y, duration) {
    if (!SPRITES[type]) {
      console.warn(`EmotionSystem: unknown emotion type "${type}"`);
      return;
    }
    const dur = duration != null ? duration : EMOTION_DEFAULTS.duration;
    this.active.set(entityId, new EmotionInstance(entityId, type, x, y, dur));
  }

  /**
   * Update all active emotions.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    for (const [id, inst] of this.active) {
      inst.update(dt);
      if (!inst.alive) {
        this.active.delete(id);
      }
    }
  }

  /**
   * Render all active emotions.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    for (const inst of this.active.values()) {
      inst.render(ctx);
    }
  }

  /**
   * Remove emotion for a specific entity.
   * @param {string} entityId
   */
  clear(entityId) {
    this.active.delete(entityId);
  }

  /**
   * Remove all active emotions.
   */
  clearAll() {
    this.active.clear();
  }
}
