/**
 * In-game canvas toast notification system.
 *
 * Pixel-art styled popup messages that slide in from the right,
 * stack vertically at the top of the canvas, and fade out.
 * Drawn entirely on canvas — no DOM elements.
 */

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 2.5;
const TOAST_HEIGHT = 20;
const TOAST_PADDING = 3;
const TOAST_GAP = 2;
const TOAST_TOP_Y = 4;
const ICON_SIZE = 8;
const SLIDE_SPEED = 280;      // px/sec for enter/exit
const FADE_START = 0.4;       // seconds before end to start fading

const TOAST_TYPES = {
  info:        { bg: [40, 80, 140],   border: [70, 130, 200],  text: '#d0e8ff' },
  success:     { bg: [30, 100, 50],   border: [60, 170, 80],   text: '#c0ffc8' },
  warning:     { bg: [140, 90, 20],   border: [210, 150, 40],  text: '#fff0c0' },
  danger:      { bg: [130, 30, 30],   border: [200, 60, 60],   text: '#ffc8c8' },
  combo:       { bg: [120, 100, 20],  border: [220, 190, 50],  text: '#fff8b0' },
  achievement: { bg: [80, 40, 130],   border: [150, 80, 220],  text: '#e8d0ff' },
};

/* ---- procedural 8x8 icon bitmaps (1 = filled pixel) ---- */
const ICON_BITMAPS = {
  info: [
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,0,0,1,1,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
  ],
  success: [
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,1,
    0,0,0,0,0,0,1,1,
    0,0,0,0,0,1,1,0,
    1,1,0,0,1,1,0,0,
    0,1,1,1,1,0,0,0,
    0,0,1,1,0,0,0,0,
    0,0,0,0,0,0,0,0,
  ],
  warning: [
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,0,1,1,1,1,0,0,
    0,1,1,0,0,1,1,0,
    0,1,1,0,0,1,1,0,
    1,1,1,1,1,1,1,1,
    1,1,1,0,0,1,1,1,
  ],
  danger: [
    1,0,0,0,0,0,0,1,
    0,1,0,0,0,0,1,0,
    0,0,1,0,0,1,0,0,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,1,0,0,1,0,0,
    0,1,0,0,0,0,1,0,
    1,0,0,0,0,0,0,1,
  ],
  combo: [
    0,0,0,1,1,0,0,0,
    0,0,1,1,1,1,0,0,
    0,1,1,1,1,1,1,0,
    1,1,1,0,0,1,1,1,
    1,1,1,0,0,1,1,1,
    0,1,1,1,1,1,1,0,
    0,0,1,1,1,1,0,0,
    0,0,0,1,1,0,0,0,
  ],
  achievement: [
    0,0,0,1,1,0,0,0,
    0,1,0,1,1,0,1,0,
    0,0,1,1,1,1,0,0,
    1,1,1,1,1,1,1,1,
    0,0,1,1,1,1,0,0,
    0,1,0,1,1,0,1,0,
    0,0,0,1,1,0,0,0,
    0,0,0,0,0,0,0,0,
  ],
};

function drawIcon(ctx, type, x, y, color) {
  const bitmap = ICON_BITMAPS[type] || ICON_BITMAPS.info;
  ctx.fillStyle = color;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (bitmap[row * 8 + col]) {
        ctx.fillRect(x + col, y + row, 1, 1);
      }
    }
  }
}

/**
 * Draw a pixel-art double-line bordered rectangle.
 * Outer border 1px, 1px gap, inner border 1px.
 */
function drawPixelBox(ctx, x, y, w, h, bgColor, borderColor, alpha) {
  ctx.globalAlpha = alpha * 0.85;
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, w, h);

  // Outer border
  ctx.globalAlpha = alpha;
  ctx.fillStyle = borderColor;
  // top
  ctx.fillRect(x, y, w, 1);
  // bottom
  ctx.fillRect(x, y + h - 1, w, 1);
  // left
  ctx.fillRect(x, y, 1, h);
  // right
  ctx.fillRect(x + w - 1, y, 1, h);

  // Inner border (1px inset from outer)
  ctx.globalAlpha = alpha * 0.5;
  // top
  ctx.fillRect(x + 2, y + 2, w - 4, 1);
  // bottom
  ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
  // left
  ctx.fillRect(x + 2, y + 2, 1, h - 4);
  // right
  ctx.fillRect(x + w - 3, y + 2, 1, h - 4);

  ctx.globalAlpha = 1;
}

function rgbStr(arr) {
  return `rgb(${arr[0]},${arr[1]},${arr[2]})`;
}

function rgbStrBright(arr, factor) {
  return `rgb(${Math.min(255, arr[0] * factor | 0)},${Math.min(255, arr[1] * factor | 0)},${Math.min(255, arr[2] * factor | 0)})`;
}

export class ToastSystem {
  constructor() {
    /** @type {Array<Toast>} active toasts currently being rendered */
    this.active = [];
    /** @type {Array<Toast>} queued toasts waiting for a slot */
    this.queue = [];
  }

  /**
   * Show a toast message.
   * @param {string} message
   * @param {object} [options]
   * @param {'info'|'success'|'warning'|'danger'|'combo'|'achievement'} [options.type='info']
   * @param {number} [options.duration=2.5] seconds
   * @param {string} [options.icon] override icon type
   * @param {string} [options.color] override text color
   */
  show(message, options = {}) {
    const type = options.type || 'info';
    const duration = options.duration != null ? options.duration : DEFAULT_DURATION;
    const icon = options.icon || type;
    const color = options.color || null;

    const toast = {
      message,
      type,
      duration,
      icon,
      colorOverride: color,
      age: 0,
      state: 'entering',   // entering | visible | exiting | done
      slideOffset: 0,       // positive = offscreen to the right
      alpha: 1,
      slot: -1,
    };

    if (this.active.length < MAX_VISIBLE) {
      toast.slot = this._nextSlot();
      toast.slideOffset = 200;
      this.active.push(toast);
    } else {
      this.queue.push(toast);
    }
  }

  /**
   * Update all toasts. Call once per frame.
   * @param {number} dt delta time in seconds
   */
  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const t = this.active[i];
      t.age += dt;

      // State machine
      if (t.state === 'entering') {
        t.slideOffset -= SLIDE_SPEED * dt;
        if (t.slideOffset <= 0) {
          t.slideOffset = 0;
          t.state = 'visible';
        }
        t.alpha = 1 - (t.slideOffset / 200);
      } else if (t.state === 'visible') {
        t.alpha = 1;
        if (t.age >= t.duration - FADE_START) {
          t.state = 'exiting';
        }
      } else if (t.state === 'exiting') {
        const exitProgress = (t.age - (t.duration - FADE_START)) / FADE_START;
        t.alpha = Math.max(0, 1 - exitProgress);
        t.slideOffset = -exitProgress * 60; // slide left
      }

      // Remove when done
      if (t.age >= t.duration) {
        t.state = 'done';
        this.active.splice(i, 1);
      }
    }

    // Promote from queue
    while (this.queue.length > 0 && this.active.length < MAX_VISIBLE) {
      const next = this.queue.shift();
      next.slot = this._nextSlot();
      next.slideOffset = 200;
      next.state = 'entering';
      next.age = 0;
      this.active.push(next);
    }
  }

  /**
   * Render all active toasts on the canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} screenWidth canvas width in logical pixels
   */
  render(ctx, screenWidth) {
    if (this.active.length === 0) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    for (const t of this.active) {
      const style = TOAST_TYPES[t.type] || TOAST_TYPES.info;

      // Measure text to size the toast
      ctx.font = '7px monospace';
      const textWidth = ctx.measureText(t.message).width;
      const toastWidth = Math.ceil(TOAST_PADDING * 2 + ICON_SIZE + 4 + textWidth + 2);
      const toastX = Math.floor((screenWidth - toastWidth) / 2 + t.slideOffset);
      const toastY = TOAST_TOP_Y + t.slot * (TOAST_HEIGHT + TOAST_GAP);

      // Draw box
      drawPixelBox(
        ctx, toastX, toastY, toastWidth, TOAST_HEIGHT,
        rgbStr(style.bg), rgbStr(style.border), t.alpha
      );

      // Draw icon
      const iconX = toastX + TOAST_PADDING + 1;
      const iconY = toastY + Math.floor((TOAST_HEIGHT - ICON_SIZE) / 2);
      ctx.globalAlpha = t.alpha;
      drawIcon(ctx, t.icon, iconX, iconY, rgbStrBright(style.border, 1.4));

      // Draw text
      const textX = iconX + ICON_SIZE + 3;
      const textY = toastY + Math.floor(TOAST_HEIGHT / 2) + 3;
      ctx.font = '7px monospace';
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.colorOverride || style.text;
      ctx.fillText(t.message, textX, textY);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /**
   * Remove all active and queued toasts immediately.
   */
  clear() {
    this.active.length = 0;
    this.queue.length = 0;
  }

  /** Find the lowest unused slot index (0, 1, or 2). */
  _nextSlot() {
    const used = new Set(this.active.map(t => t.slot));
    for (let s = 0; s < MAX_VISIBLE; s++) {
      if (!used.has(s)) return s;
    }
    return 0;
  }
}
