/**
 * Enhanced speech bubble system for 2D pixel art pharmacy game.
 *
 * Stardew Valley-quality speech bubbles with typewriter text,
 * multiple bubble styles, and emotion-colored borders.
 * Drawn entirely on HTML Canvas with pixel-art rendering (fillRect).
 */

const MAX_BUBBLES = 6;

const TYPEWRITER_SPEED = {
  speech:  40,
  thought: 40,
  shout:   40,
  whisper: 40,
  system:  60,
  phone:   40,
};

const EMOTION_COLORS = {
  happy:    { r: 50,  g: 160, b: 50  },
  angry:    { r: 200, g: 40,  b: 40  },
  sad:      { r: 60,  g: 100, b: 200 },
  confused: { r: 210, g: 190, b: 40  },
  neutral:  { r: 80,  g: 60,  b: 40  },
};

const MIN_WIDTH = 30;
const MAX_WIDTH = 90;
const FONT_SIZE = 6;
const LINE_HEIGHT = 8;
const PADDING = 4;
const CORNER = 2;           // pixel-art corner cutoff
const BOUNCE_DURATION = 0.2;
const TAIL_HEIGHT = 5;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Measure text width using monospace at FONT_SIZE px (each char ~ FONT_SIZE * 0.6). */
function measureText(text) {
  return Math.ceil(text.length * FONT_SIZE * 0.6);
}

/** Word-wrap text to fit within maxW pixels. Returns array of lines. */
function wrapText(text, maxW) {
  const charW = FONT_SIZE * 0.6;
  const maxChars = Math.max(1, Math.floor(maxW / charW));
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    if (word.length > maxChars) {
      // Force-break long words
      if (line) { lines.push(line); line = ''; }
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars));
      }
      continue;
    }
    const test = line ? line + ' ' + word : word;
    if (test.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/** Draw a pixel-art rounded rectangle using fillRect (corner cutoff). */
function drawPixelRoundedRect(ctx, x, y, w, h, c) {
  // Main body
  ctx.fillRect(x + c, y, w - c * 2, h);
  // Left/right strips (inset by corner)
  ctx.fillRect(x, y + c, c, h - c * 2);
  ctx.fillRect(x + w - c, y + c, c, h - c * 2);
}

/** Draw a pixel-art rounded rect border (1px wide). */
function strokePixelRoundedRect(ctx, x, y, w, h, c) {
  // Top edge
  ctx.fillRect(x + c, y, w - c * 2, 1);
  // Bottom edge
  ctx.fillRect(x + c, y + h - 1, w - c * 2, 1);
  // Left edge
  ctx.fillRect(x, y + c, 1, h - c * 2);
  // Right edge
  ctx.fillRect(x + w - 1, y + c, 1, h - c * 2);
  // Corner pixels (1px diagonal fills for pixel look)
  ctx.fillRect(x + c - 1, y + 1, 1, c - 1);
  ctx.fillRect(x + 1, y + c - 1, c - 1, 1);
  ctx.fillRect(x + w - c, y + 1, 1, c - 1);
  ctx.fillRect(x + w - 2, y + c - 1, c - 1, 1);
  ctx.fillRect(x + c - 1, y + h - c, 1, c - 1);
  ctx.fillRect(x + 1, y + h - c, c - 1, 1);
  ctx.fillRect(x + w - c, y + h - c, 1, c - 1);
  ctx.fillRect(x + w - 2, y + h - c, c - 1, 1);
}

/* ------------------------------------------------------------------ */
/*  Bubble class (internal)                                            */
/* ------------------------------------------------------------------ */

class Bubble {
  constructor(entityId, text, options) {
    this.entityId = entityId;
    this.fullText = text;
    this.style = options.style || 'speech';
    this.emotion = options.emotion || 'neutral';
    this.duration = options.duration != null ? options.duration : 4;
    this.onComplete = options.onComplete || null;

    // Entity world position (updated externally)
    this.ex = 0;
    this.ey = 0;

    // Typewriter
    this.charIndex = 0;
    const speed = TYPEWRITER_SPEED[this.style] || 40;
    this.charInterval = 1 / speed;
    this.charTimer = 0;
    this.textDone = false;

    // Lifetime (counts down after typewriter finishes)
    this.age = 0;
    this.lifeTimer = 0;
    this.alive = true;

    // Bounce animation
    this.bounceTime = 0;

    // Shake (for angry emotion)
    this.shakeOffset = 0;

    // Phone static noise seed
    this.noiseSeed = Math.random() * 1000;

    // Pre-compute layout
    this._computeLayout();
  }

  _computeLayout() {
    const textW = measureText(this.fullText);
    const contentW = Math.min(MAX_WIDTH - PADDING * 2, Math.max(MIN_WIDTH - PADDING * 2, textW));
    this.bubbleW = contentW + PADDING * 2;
    this.lines = wrapText(this.fullText, contentW);
    this.bubbleH = PADDING * 2 + this.lines.length * LINE_HEIGHT;
  }

  update(dt) {
    if (!this.alive) return;

    this.age += dt;

    // Bounce
    if (this.bounceTime < BOUNCE_DURATION) {
      this.bounceTime = Math.min(this.bounceTime + dt, BOUNCE_DURATION);
    }

    // Typewriter
    if (!this.textDone) {
      this.charTimer += dt;
      while (this.charTimer >= this.charInterval && this.charIndex < this.fullText.length) {
        this.charIndex++;
        this.charTimer -= this.charInterval;
      }
      if (this.charIndex >= this.fullText.length) {
        this.textDone = true;
        this.lifeTimer = 0;
      }
    } else {
      // Count down duration after text is fully revealed
      this.lifeTimer = (this.lifeTimer || 0) + dt;
      if (this.duration > 0 && this.lifeTimer >= this.duration) {
        this.alive = false;
        if (this.onComplete) this.onComplete();
      }
    }

    // Angry shake
    if (this.emotion === 'angry') {
      this.shakeOffset = (Math.random() - 0.5) * 1.5;
    } else {
      this.shakeOffset = 0;
    }
  }

  render(ctx) {
    if (!this.alive) return;

    // Bounce scale factor
    let scale = 1;
    if (this.bounceTime < BOUNCE_DURATION) {
      const t = this.bounceTime / BOUNCE_DURATION;
      // overshoot: 0->1.15->1.0
      if (t < 0.5) {
        scale = 1 + 0.3 * (t / 0.5);  // 1.0 -> 1.15 mapped over first half... 0.3*1 = too much, use 0.15
      } else {
        scale = 1.15 - 0.15 * ((t - 0.5) / 0.5);
      }
      // Correct overshoot curve
      const p = t;
      scale = 1 + 0.15 * Math.sin(p * Math.PI);
    }

    const bw = this.bubbleW;
    const bh = this.bubbleH;

    // Bubble positioned above entity, centered horizontally
    const baseX = Math.round(this.ex - bw / 2 + this.shakeOffset);
    const baseY = Math.round(this.ey - bh - TAIL_HEIGHT - 2);

    ctx.save();

    // Apply bounce scale around bubble center
    if (scale !== 1) {
      const cx = baseX + bw / 2;
      const cy = baseY + bh / 2;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
    }

    // Fade out in last 0.4s of life
    let alpha = 1;
    if (this.textDone && this.duration > 0) {
      const remaining = this.duration - (this.lifeTimer || 0);
      if (remaining < 0.4) {
        alpha = Math.max(0, remaining / 0.4);
      }
    }
    ctx.globalAlpha = alpha;

    const eColor = EMOTION_COLORS[this.emotion] || EMOTION_COLORS.neutral;

    // Dispatch to style-specific renderer
    switch (this.style) {
      case 'thought':  this._renderThought(ctx, baseX, baseY, bw, bh, eColor); break;
      case 'shout':    this._renderShout(ctx, baseX, baseY, bw, bh, eColor); break;
      case 'whisper':  this._renderWhisper(ctx, baseX, baseY, bw, bh, eColor); break;
      case 'system':   this._renderSystem(ctx, baseX, baseY, bw, bh, eColor); break;
      case 'phone':    this._renderPhone(ctx, baseX, baseY, bw, bh, eColor); break;
      default:         this._renderSpeech(ctx, baseX, baseY, bw, bh, eColor); break;
    }

    // Draw text (all styles)
    this._renderText(ctx, baseX, baseY, bw, bh);

    ctx.restore();
  }

  /* ---- Style renderers ---- */

  _renderSpeech(ctx, x, y, w, h, ec) {
    // White fill
    ctx.fillStyle = '#fff';
    drawPixelRoundedRect(ctx, x, y, w, h, CORNER);

    // Emotion border
    ctx.fillStyle = `rgb(${ec.r},${ec.g},${ec.b})`;
    strokePixelRoundedRect(ctx, x, y, w, h, CORNER);

    // Tail pointing down-left (small triangle made of rects)
    const tx = x + 6;
    const ty = y + h;
    ctx.fillStyle = '#fff';
    ctx.fillRect(tx, ty, 4, 1);
    ctx.fillRect(tx, ty + 1, 3, 1);
    ctx.fillRect(tx, ty + 2, 2, 1);
    ctx.fillRect(tx, ty + 3, 1, 1);
    // Tail border
    ctx.fillStyle = `rgb(${ec.r},${ec.g},${ec.b})`;
    ctx.fillRect(tx + 4, ty, 1, 1);
    ctx.fillRect(tx + 3, ty + 1, 1, 1);
    ctx.fillRect(tx + 2, ty + 2, 1, 1);
    ctx.fillRect(tx + 1, ty + 3, 1, 1);
    ctx.fillRect(tx, ty + 4, 1, 1);
  }

  _renderThought(ctx, x, y, w, h, ec) {
    // White cloud fill
    ctx.fillStyle = '#fff';
    drawPixelRoundedRect(ctx, x, y, w, h, CORNER);

    // Border
    ctx.fillStyle = `rgb(${ec.r},${ec.g},${ec.b})`;
    strokePixelRoundedRect(ctx, x, y, w, h, CORNER);

    // Circle-dot tail (3 small circles descending)
    const tx = x + 6;
    const ty = y + h + 2;
    ctx.fillStyle = '#fff';
    ctx.fillRect(tx, ty, 3, 3);
    ctx.fillRect(tx - 2, ty + 5, 2, 2);
    ctx.fillRect(tx - 3, ty + 9, 1, 1);
    // Dot borders
    ctx.fillStyle = `rgb(${ec.r},${ec.g},${ec.b})`;
    strokePixelRoundedRect(ctx, tx, ty, 3, 3, 0);
    strokePixelRoundedRect(ctx, tx - 2, ty + 5, 2, 2, 0);
    ctx.fillRect(tx - 3, ty + 9, 1, 1);
  }

  _renderShout(ctx, x, y, w, h, ec) {
    // Red tinted fill
    ctx.fillStyle = 'rgba(255, 230, 230, 1)';
    drawPixelRoundedRect(ctx, x, y, w, h, CORNER);

    // Jagged/spiky border drawn with zigzag
    ctx.fillStyle = `rgb(${Math.min(255, ec.r + 60)},${Math.max(0, ec.g - 20)},${Math.max(0, ec.b - 20)})`;
    const spike = 2;
    // Top edge zigzag
    for (let px = x + CORNER; px < x + w - CORNER; px += spike * 2) {
      ctx.fillRect(px, y - 1, spike, 1);
      ctx.fillRect(px + spike, y, spike, 1);
    }
    // Bottom edge zigzag
    for (let px = x + CORNER; px < x + w - CORNER; px += spike * 2) {
      ctx.fillRect(px, y + h, spike, 1);
      ctx.fillRect(px + spike, y + h - 1, spike, 1);
    }
    // Left edge zigzag
    for (let py = y + CORNER; py < y + h - CORNER; py += spike * 2) {
      ctx.fillRect(x - 1, py, 1, spike);
      ctx.fillRect(x, py + spike, 1, spike);
    }
    // Right edge zigzag
    for (let py = y + CORNER; py < y + h - CORNER; py += spike * 2) {
      ctx.fillRect(x + w, py, 1, spike);
      ctx.fillRect(x + w - 1, py + spike, 1, spike);
    }

    // Tail
    const tx = x + 6;
    const ty = y + h;
    ctx.fillStyle = 'rgba(255, 230, 230, 1)';
    ctx.fillRect(tx, ty, 4, 1);
    ctx.fillRect(tx + 1, ty + 1, 3, 1);
    ctx.fillRect(tx + 1, ty + 2, 2, 1);
  }

  _renderWhisper(ctx, x, y, w, h, ec) {
    // Lighter, more transparent fill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    drawPixelRoundedRect(ctx, x, y, w, h, CORNER);

    // Dashed border
    ctx.fillStyle = `rgba(${ec.r},${ec.g},${ec.b},0.6)`;
    const dash = 2;
    const gap = 2;
    // Top
    for (let px = x + CORNER; px < x + w - CORNER; px += dash + gap) {
      const len = Math.min(dash, x + w - CORNER - px);
      ctx.fillRect(px, y, len, 1);
    }
    // Bottom
    for (let px = x + CORNER; px < x + w - CORNER; px += dash + gap) {
      const len = Math.min(dash, x + w - CORNER - px);
      ctx.fillRect(px, y + h - 1, len, 1);
    }
    // Left
    for (let py = y + CORNER; py < y + h - CORNER; py += dash + gap) {
      const len = Math.min(dash, y + h - CORNER - py);
      ctx.fillRect(x, py, 1, len);
    }
    // Right
    for (let py = y + CORNER; py < y + h - CORNER; py += dash + gap) {
      const len = Math.min(dash, y + h - CORNER - py);
      ctx.fillRect(x + w - 1, py, 1, len);
    }
    // No tail for whisper
  }

  _renderSystem(ctx, x, y, w, h, ec) {
    // Dark background, no tail
    ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
    drawPixelRoundedRect(ctx, x, y, w, h, CORNER);

    // Subtle border
    ctx.fillStyle = 'rgba(100, 100, 120, 0.8)';
    strokePixelRoundedRect(ctx, x, y, w, h, CORNER);
  }

  _renderPhone(ctx, x, y, w, h, ec) {
    // Slightly blue-tinted fill
    ctx.fillStyle = 'rgba(240, 245, 255, 1)';
    drawPixelRoundedRect(ctx, x, y, w, h, CORNER);

    // Border
    ctx.fillStyle = `rgb(${ec.r},${ec.g},${ec.b})`;
    strokePixelRoundedRect(ctx, x, y, w, h, CORNER);

    // Phone icon (top-left inside padding) - tiny 4x6 handset
    const ix = x + 2;
    const iy = y + 2;
    ctx.fillStyle = '#555';
    ctx.fillRect(ix, iy, 3, 1);
    ctx.fillRect(ix, iy + 1, 1, 4);
    ctx.fillRect(ix + 2, iy + 1, 1, 4);
    ctx.fillRect(ix, iy + 5, 3, 1);

    // Pixel noise / static effect (a few random bright pixels)
    const seed = (this.noiseSeed + this.age * 50) | 0;
    ctx.fillStyle = 'rgba(180, 200, 255, 0.4)';
    for (let i = 0; i < 6; i++) {
      const hash = ((seed * (i + 1) * 7919) & 0xFFFF);
      const nx = x + CORNER + (hash % (w - CORNER * 2));
      const ny = y + CORNER + ((hash >> 4) % (h - CORNER * 2));
      ctx.fillRect(nx, ny, 1, 1);
    }

    // Tail
    const tx = x + 6;
    const ty = y + h;
    ctx.fillStyle = 'rgba(240, 245, 255, 1)';
    ctx.fillRect(tx, ty, 4, 1);
    ctx.fillRect(tx, ty + 1, 3, 1);
    ctx.fillRect(tx, ty + 2, 2, 1);
    ctx.fillRect(tx, ty + 3, 1, 1);
    ctx.fillStyle = `rgb(${ec.r},${ec.g},${ec.b})`;
    ctx.fillRect(tx + 4, ty, 1, 1);
    ctx.fillRect(tx + 3, ty + 1, 1, 1);
    ctx.fillRect(tx + 2, ty + 2, 1, 1);
    ctx.fillRect(tx + 1, ty + 3, 1, 1);
    ctx.fillRect(tx, ty + 4, 1, 1);
  }

  /* ---- Text rendering ---- */

  _renderText(ctx, bx, by, bw, bh) {
    const isSystem = this.style === 'system';
    const isWhisper = this.style === 'whisper';
    const fontSize = isWhisper ? FONT_SIZE - 1 : FONT_SIZE;
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    // Figure out how many characters to show (typewriter)
    const visibleChars = this.charIndex;

    // Walk through wrapped lines, rendering char by char up to visibleChars
    let charsSoFar = 0;
    const textX = bx + PADDING;
    let textY = by + PADDING;

    // For confused emotion, append '?' after text
    const suffix = (this.emotion === 'confused' && this.textDone) ? ' ?' : '';

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i] + (i === this.lines.length - 1 ? suffix : '');
      const lineStart = charsSoFar;

      // Count chars consumed by earlier lines (use original lines, not with suffix)
      const origLine = this.lines[i];
      const charsInOrigLine = origLine.length;
      // How many chars of this line are visible?
      let showCount;
      if (i < this.lines.length - 1) {
        showCount = Math.min(charsInOrigLine, Math.max(0, visibleChars - charsSoFar));
        // Also account for the space between words/lines
        charsSoFar += charsInOrigLine;
        // Add 1 for the implicit space/newline between wrapped lines when counting against fullText
        if (i < this.lines.length - 1) {
          // Check if fullText has a space at this boundary
          const nextIdx = charsSoFar;
          if (nextIdx < this.fullText.length && this.fullText[nextIdx] === ' ') {
            charsSoFar++;
          }
        }
      } else {
        showCount = Math.min(charsInOrigLine, Math.max(0, visibleChars - charsSoFar));
        charsSoFar += charsInOrigLine;
      }

      const visible = line.slice(0, showCount + (this.textDone && i === this.lines.length - 1 ? suffix.length : 0));
      if (visible.length === 0) { textY += LINE_HEIGHT; continue; }

      // Shadow
      ctx.fillStyle = isSystem ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)';
      ctx.fillText(visible, textX + 1, textY + 1);

      // Main text
      ctx.fillStyle = isSystem ? '#e8e8f0' : '#1a1a1a';
      if (isWhisper) ctx.fillStyle = '#444';
      ctx.fillText(visible, textX, textY);

      textY += LINE_HEIGHT;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  SpeechBubbleSystem                                                 */
/* ------------------------------------------------------------------ */

export class SpeechBubbleSystem {
  constructor() {
    /** @type {Map<string, Bubble>} */
    this.bubbles = new Map();
    /** @type {Map<string, {x: number, y: number}>} */
    this.entityPositions = new Map();
  }

  /**
   * Show a speech bubble for an entity.
   * @param {string} entityId
   * @param {string} text
   * @param {object} [options]
   * @param {string} [options.style]    - speech|thought|shout|whisper|system|phone
   * @param {string} [options.emotion]  - happy|angry|sad|confused|neutral
   * @param {number} [options.duration] - seconds after typewriter completes (0 = infinite)
   * @param {function} [options.onComplete] - called when bubble expires
   */
  show(entityId, text, options = {}) {
    // Enforce max bubbles — remove oldest if at limit
    if (this.bubbles.size >= MAX_BUBBLES && !this.bubbles.has(entityId)) {
      const oldest = this.bubbles.keys().next().value;
      this.bubbles.delete(oldest);
    }

    const bubble = new Bubble(entityId, text, options);

    // Apply known entity position
    const pos = this.entityPositions.get(entityId);
    if (pos) {
      bubble.ex = pos.x;
      bubble.ey = pos.y;
    }

    this.bubbles.set(entityId, bubble);
  }

  /**
   * Update entity world position for bubble anchoring.
   * @param {string} entityId
   * @param {number} x
   * @param {number} y
   */
  setEntityPosition(entityId, x, y) {
    this.entityPositions.set(entityId, { x, y });
    const bubble = this.bubbles.get(entityId);
    if (bubble) {
      bubble.ex = x;
      bubble.ey = y;
    }
  }

  /**
   * Advance all bubbles by dt seconds.
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    for (const [id, bubble] of this.bubbles) {
      // Sync position each frame
      const pos = this.entityPositions.get(id);
      if (pos) {
        bubble.ex = pos.x;
        bubble.ey = pos.y;
      }

      bubble.update(dt);

      if (!bubble.alive) {
        this.bubbles.delete(id);
      }
    }
  }

  /**
   * Render all active bubbles to the canvas context.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (const bubble of this.bubbles.values()) {
      bubble.render(ctx);
    }
    ctx.restore();
  }

  /**
   * Immediately dismiss a specific entity's bubble.
   * @param {string} entityId
   */
  dismiss(entityId) {
    const bubble = this.bubbles.get(entityId);
    if (bubble) {
      bubble.alive = false;
      if (bubble.onComplete) bubble.onComplete();
      this.bubbles.delete(entityId);
    }
  }

  /** Remove all active bubbles immediately. */
  clear() {
    this.bubbles.clear();
  }
}
