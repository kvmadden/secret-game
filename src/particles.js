// particles.js - Particle engine for 2D pixel art pharmacy game
// Supports sparkles, confetti, paper scraps, pills, dust, hearts,
// anger marks, money, steam, rain splashes, and leaf drift.

const MAX_PARTICLES = 200;

const PARTICLE_DEFAULTS = {
  sparkle:  { gravity: -0.02, friction: 0.97, life: 0.6,  size: 2, spread: 30, speed: 40  },
  confetti: { gravity: 0.15,  friction: 0.99, life: 1.5,  size: 3, spread: 60, speed: 80  },
  paper:    { gravity: 0.04,  friction: 0.98, life: 2.0,  size: 3, spread: 40, speed: 30  },
  pill:     { gravity: 0.18,  friction: 0.95, life: 1.2,  size: 2, spread: 50, speed: 70  },
  dust:     { gravity: -0.01, friction: 0.94, life: 0.5,  size: 3, spread: 20, speed: 20  },
  heart:    { gravity: -0.06, friction: 0.97, life: 1.0,  size: 3, spread: 20, speed: 35  },
  anger:    { gravity: -0.03, friction: 0.93, life: 0.5,  size: 3, spread: 25, speed: 50  },
  money:    { gravity: -0.05, friction: 0.97, life: 1.2,  size: 3, spread: 20, speed: 40  },
  steam:    { gravity: -0.03, friction: 0.96, life: 1.5,  size: 2, spread: 10, speed: 15  },
  rain:     { gravity: 0.0,   friction: 0.90, life: 0.3,  size: 2, spread: 2,  speed: 5   },
  leaf:     { gravity: 0.03,  friction: 0.99, life: 2.5,  size: 3, spread: 30, speed: 20  },
};

const SPARKLE_COLORS = ['#fffbe6', '#ffe066', '#ffffff', '#ffd700'];
const CONFETTI_COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#8338ec'];
const PAPER_COLORS = ['#fff8ee', '#f5f0e1', '#ece4d4', '#ffffff'];
const PILL_COLORS = ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#ffffff', '#e9c46a'];
const DUST_COLORS = ['#a89070', '#8b7355', '#c4a882', '#7a6652'];
const HEART_COLORS = ['#ff6b81', '#e63946', '#ff4d6d', '#ff8fa3'];
const ANGER_COLORS = ['#e63946', '#c1121f', '#ff4d4d'];
const MONEY_COLORS = ['#2d6a4f', '#40916c', '#52b788', '#74c69d'];
const STEAM_COLORS = ['#b0b0b0', '#c8c8c8', '#a0a0a0', '#d0d0d0'];
const RAIN_COLORS = ['#ffffff', '#dbeafe', '#e0e7ff'];
const LEAF_COLORS = ['#588157', '#3a5a40', '#a3b18a', '#8b6914', '#6b4f2e'];

function pickColor(colors) {
  return colors[(Math.random() * colors.length) | 0];
}

function colorsForType(type) {
  switch (type) {
    case 'sparkle':  return SPARKLE_COLORS;
    case 'confetti': return CONFETTI_COLORS;
    case 'paper':    return PAPER_COLORS;
    case 'pill':     return PILL_COLORS;
    case 'dust':     return DUST_COLORS;
    case 'heart':    return HEART_COLORS;
    case 'anger':    return ANGER_COLORS;
    case 'money':    return MONEY_COLORS;
    case 'steam':    return STEAM_COLORS;
    case 'rain':     return RAIN_COLORS;
    case 'leaf':     return LEAF_COLORS;
    default:         return SPARKLE_COLORS;
  }
}

class Particle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0;
    this.size = 1;
    this.color = '#ffffff';
    this.type = 'sparkle';
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.gravity = 0;
    this.friction = 0.98;
    this.alpha = 1;
    this.scale = 1;
    // Extra fields for type-specific behaviour
    this.wobble = 0;
    this.wobbleSpeed = 0;
  }

  init(type, x, y, options) {
    const def = PARTICLE_DEFAULTS[type] || PARTICLE_DEFAULTS.sparkle;
    const opts = options || {};

    this.active = true;
    this.type = type;
    this.x = x + (Math.random() - 0.5) * (opts.spread ?? def.spread);
    this.y = y + (Math.random() - 0.5) * (opts.spread ?? def.spread);

    const angle = Math.random() * Math.PI * 2;
    const speed = (opts.speed ?? def.speed) * (0.5 + Math.random() * 0.5);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.maxLife = (opts.life ?? def.life) * (0.7 + Math.random() * 0.6);
    this.life = this.maxLife;
    this.size = opts.size ?? def.size;
    this.color = opts.color ?? pickColor(colorsForType(type));
    this.gravity = opts.gravity ?? def.gravity;
    this.friction = opts.friction ?? def.friction;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 4;
    this.alpha = 1;
    this.scale = 1;

    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 2 + Math.random() * 3;

    // Type-specific velocity adjustments
    switch (type) {
      case 'heart':
      case 'money':
        // Float upward
        this.vy = -(Math.abs(this.vy) * 0.5 + 10);
        this.vx *= 0.4;
        break;
      case 'confetti':
        // Burst upward then fall
        this.vy = -Math.abs(this.vy) * 0.8 - 20;
        break;
      case 'paper':
        // Gentle downward flutter
        this.vy = Math.abs(this.vy) * 0.3 + 5;
        this.vx *= 0.6;
        break;
      case 'rain':
        // Expand in place
        this.vx = 0;
        this.vy = 0;
        break;
      case 'steam':
        // Rise gently
        this.vy = -(Math.abs(this.vy) * 0.3 + 8);
        this.vx *= 0.3;
        break;
      case 'leaf':
        // Drift to the right and down
        this.vx = Math.abs(this.vx) * 0.4 + 8;
        this.vy = Math.abs(this.vy) * 0.2 + 3;
        break;
      case 'dust':
        // Expand outward from center
        this.vx *= 0.5;
        this.vy *= 0.5;
        break;
      case 'anger':
        // Pop outward briefly
        this.vy = -Math.abs(this.vy) * 0.6 - 15;
        break;
      case 'pill':
        // Scatter with strong downward bounce potential
        this.vy = -Math.abs(this.vy) * 0.5 - 20;
        break;
    }

    return this;
  }

  update(dt) {
    if (!this.active) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    const t = this.life / this.maxLife; // 1 = fresh, 0 = dead

    // Physics
    this.vy += this.gravity * 60 * dt; // gravity in px/s scaled to dt
    this.vx *= Math.pow(this.friction, dt * 60);
    this.vy *= Math.pow(this.friction, dt * 60);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotationSpeed * dt;
    this.wobble += this.wobbleSpeed * dt;

    // Type-specific updates
    switch (this.type) {
      case 'sparkle':
        // Twinkle by oscillating alpha
        this.alpha = t * (0.5 + 0.5 * Math.sin(this.wobble * 10));
        this.scale = t;
        break;
      case 'confetti':
        this.alpha = Math.min(1, t * 2);
        break;
      case 'paper':
        // Sway side to side
        this.vx += Math.sin(this.wobble) * 0.8;
        this.alpha = Math.min(1, t * 2);
        break;
      case 'pill':
        // Bounce off ground (at spawn y + 20)
        this.alpha = Math.min(1, t * 2);
        break;
      case 'dust':
        this.alpha = t * 0.7;
        this.scale = 1 + (1 - t) * 2; // expand over life
        break;
      case 'heart':
        // Gentle sway
        this.vx += Math.sin(this.wobble) * 0.5;
        this.alpha = t;
        this.scale = 0.5 + t * 0.5;
        break;
      case 'anger':
        this.alpha = t;
        this.scale = 0.8 + (1 - t) * 0.5;
        break;
      case 'money':
        this.vx += Math.sin(this.wobble) * 0.3;
        this.alpha = t;
        break;
      case 'steam':
        this.alpha = t * 0.4;
        this.scale = 0.8 + (1 - t) * 1.5;
        this.vx += Math.sin(this.wobble) * 0.3;
        break;
      case 'rain':
        this.alpha = t;
        this.scale = 1 + (1 - t) * 3; // ring expands
        break;
      case 'leaf':
        // Flutter rotation and sway
        this.vx += Math.sin(this.wobble) * 0.4;
        this.vy += Math.cos(this.wobble * 0.7) * 0.2;
        this.alpha = Math.min(1, t * 2);
        break;
      default:
        this.alpha = t;
        break;
    }
  }
}

// ---- Rendering helpers (pixel-art appropriate, no anti-aliasing) ----

function renderSparkle(ctx, p) {
  const s = Math.max(1, Math.round(p.size * p.scale));
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  // Cross / plus shape
  const cx = Math.round(p.x);
  const cy = Math.round(p.y);
  ctx.fillRect(cx, cy - s, 1, s * 2 + 1);
  ctx.fillRect(cx - s, cy, s * 2 + 1, 1);
}

function renderConfetti(ctx, p) {
  const s = Math.max(1, Math.round(p.size));
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.save();
  ctx.translate(Math.round(p.x), Math.round(p.y));
  ctx.rotate(p.rotation);
  ctx.fillRect(-((s / 2) | 0), -((s / 2) | 0), s, Math.max(1, (s * 0.6) | 0));
  ctx.restore();
}

function renderPaper(ctx, p) {
  const w = Math.max(2, Math.round(p.size * 1.5));
  const h = Math.max(1, Math.round(p.size));
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.save();
  ctx.translate(Math.round(p.x), Math.round(p.y));
  ctx.rotate(p.rotation);
  ctx.fillRect(-((w / 2) | 0), -((h / 2) | 0), w, h);
  ctx.restore();
}

function renderPill(ctx, p) {
  const s = Math.max(1, Math.round(p.size));
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  const cx = Math.round(p.x);
  const cy = Math.round(p.y);
  // Capsule: two dots wide, one dot tall (pixel capsule)
  ctx.fillRect(cx - s, cy, s * 2, s);
  // White half
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx, cy, s, s);
}

function renderDust(ctx, p) {
  const s = Math.max(1, Math.round(p.size * p.scale));
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  const cx = Math.round(p.x);
  const cy = Math.round(p.y);
  // Blocky circle approximation
  ctx.fillRect(cx - s, cy - ((s * 0.5) | 0), s * 2, Math.max(1, s));
  ctx.fillRect(cx - ((s * 0.5) | 0), cy - s, Math.max(1, s), s * 2);
}

function renderHeart(ctx, p) {
  const s = Math.max(1, Math.round(p.size * p.scale));
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  const cx = Math.round(p.x);
  const cy = Math.round(p.y);
  // Tiny pixel heart: 2 bumps on top, point at bottom
  if (s <= 2) {
    ctx.fillRect(cx - 1, cy - 1, 1, 1);
    ctx.fillRect(cx + 1, cy - 1, 1, 1);
    ctx.fillRect(cx - 2, cy, 1, 1);
    ctx.fillRect(cx, cy, 1, 1);
    ctx.fillRect(cx + 2, cy, 1, 1);
    ctx.fillRect(cx - 1, cy + 1, 3, 1);
    ctx.fillRect(cx, cy + 2, 1, 1);
  } else {
    // Larger heart
    ctx.fillRect(cx - s, cy - s, s, s);
    ctx.fillRect(cx + 1, cy - s, s, s);
    ctx.fillRect(cx - s, cy, s * 2 + 1, s);
    ctx.fillRect(cx - s + 1, cy + s, s * 2 - 1, 1);
  }
}

function renderAnger(ctx, p) {
  const s = Math.max(1, Math.round(p.size * p.scale));
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  const cx = Math.round(p.x);
  const cy = Math.round(p.y);
  // Anger vein: cross pattern with gaps
  ctx.fillRect(cx - s, cy - s, 1, s);
  ctx.fillRect(cx + s, cy - s, 1, s);
  ctx.fillRect(cx - s, cy + 1, 1, s);
  ctx.fillRect(cx + s, cy + 1, 1, s);
  ctx.fillRect(cx - s, cy, s, 1);
  ctx.fillRect(cx + 1, cy, s, 1);
}

function renderMoney(ctx, p) {
  const s = Math.max(1, Math.round(p.size));
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  const cx = Math.round(p.x);
  const cy = Math.round(p.y);
  if (s <= 2) {
    // Tiny coin: filled square with highlight
    ctx.fillRect(cx - 1, cy - 1, 3, 3);
    ctx.fillStyle = '#b7e4c7';
    ctx.fillRect(cx, cy - 1, 1, 3);
  } else {
    // Dollar sign shape
    ctx.fillRect(cx, cy - s, 1, s * 2 + 1); // vertical bar
    ctx.fillRect(cx - 1, cy - s, 3, 1);     // top bar
    ctx.fillRect(cx - 1, cy, 3, 1);          // mid bar
    ctx.fillRect(cx - 1, cy + s, 3, 1);      // bottom bar
    ctx.fillRect(cx - 1, cy - s, 1, s + 1);  // left upper
    ctx.fillRect(cx + 1, cy, 1, s + 1);      // right lower
  }
}

function renderSteam(ctx, p) {
  const s = Math.max(1, Math.round(p.size * p.scale));
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  const cx = Math.round(p.x);
  const cy = Math.round(p.y);
  // Wispy blob
  ctx.fillRect(cx - s, cy, s * 2 + 1, 1);
  ctx.fillRect(cx - ((s * 0.5) | 0), cy - 1, Math.max(1, s), 1);
}

function renderRain(ctx, p) {
  const s = Math.max(1, Math.round(p.size * p.scale));
  ctx.globalAlpha = p.alpha;
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 1;
  const cx = Math.round(p.x);
  const cy = Math.round(p.y);
  // Expanding ring (pixel approx)
  ctx.fillStyle = p.color;
  ctx.fillRect(cx - s, cy, s * 2 + 1, 1);
  ctx.fillRect(cx, cy - s, 1, s * 2 + 1);
  if (s > 1) {
    ctx.fillRect(cx - s, cy - 1, 1, 3);
    ctx.fillRect(cx + s, cy - 1, 1, 3);
    ctx.fillRect(cx - 1, cy - s, 3, 1);
    ctx.fillRect(cx - 1, cy + s, 3, 1);
  }
}

function renderLeaf(ctx, p) {
  const s = Math.max(1, Math.round(p.size));
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.save();
  ctx.translate(Math.round(p.x), Math.round(p.y));
  ctx.rotate(p.rotation);
  // Leaf: diamond-ish shape
  ctx.fillRect(0, -s, 1, s * 2);           // center vein
  ctx.fillRect(-1, -((s * 0.5) | 0), 3, Math.max(1, s)); // body
  ctx.restore();
}

const RENDERERS = {
  sparkle:  renderSparkle,
  confetti: renderConfetti,
  paper:    renderPaper,
  pill:     renderPill,
  dust:     renderDust,
  heart:    renderHeart,
  anger:    renderAnger,
  money:    renderMoney,
  steam:    renderSteam,
  rain:     renderRain,
  leaf:     renderLeaf,
};

class ParticleSystem {
  constructor() {
    /** @type {Particle[]} */
    this.particles = [];
    /** @type {Particle[]} */
    this.pool = [];

    // Pre-allocate the pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool.push(new Particle());
    }
  }

  /**
   * Acquire a particle from the pool, or recycle the oldest active one.
   * @returns {Particle}
   */
  _acquire() {
    // Try the inactive pool first
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    // Recycle oldest active particle
    if (this.particles.length > 0) {
      const recycled = this.particles.shift();
      recycled.active = false;
      return recycled;
    }
    return new Particle();
  }

  /**
   * Emit particles of a given type at (x, y).
   * @param {string} type - One of: sparkle, confetti, paper, pill, dust, heart, anger, money, steam, rain, leaf
   * @param {number} x - Spawn x position
   * @param {number} y - Spawn y position
   * @param {number} count - Number of particles to spawn
   * @param {object} [options] - Optional overrides: color, size, speed, spread, life, gravity, friction
   */
  emit(type, x, y, count, options) {
    const n = Math.min(count, MAX_PARTICLES);
    for (let i = 0; i < n; i++) {
      // Enforce hard cap
      if (this.particles.length >= MAX_PARTICLES) {
        // Recycle oldest
        const old = this.particles.shift();
        old.active = false;
        this.pool.push(old);
      }
      const p = this._acquire();
      p.init(type, x, y, options);
      this.particles.push(p);
    }
  }

  /**
   * Update all particles. Call once per frame.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    let writeIdx = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.update(dt);
      if (p.active) {
        this.particles[writeIdx++] = p;
      } else {
        this.pool.push(p);
      }
    }
    this.particles.length = writeIdx;
  }

  /**
   * Render all active particles to the provided canvas context.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      const renderer = RENDERERS[p.type];
      if (renderer) {
        renderer(ctx, p);
      } else {
        // Fallback: simple filled square
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(
          Math.round(p.x) - ((p.size / 2) | 0),
          Math.round(p.y) - ((p.size / 2) | 0),
          Math.max(1, p.size),
          Math.max(1, p.size)
        );
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /**
   * Remove all active particles, returning them to the pool.
   */
  clear() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.active = false;
      this.pool.push(p);
    }
    this.particles.length = 0;
  }
}

export { ParticleSystem };
export default ParticleSystem;
