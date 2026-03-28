// weather-renderer.js - Visual effects for non-rain weather types
// Snow, fog, hot, cold, drizzle, storm, overcast
// Uses a 100-particle object pool for performance.

const POOL_SIZE = 100;

function createParticle() {
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 1, type: '', phase: 0, alpha: 1 };
}

export class WeatherRenderer {
  constructor() {
    this.pool = [];
    for (let i = 0; i < POOL_SIZE; i++) this.pool.push(createParticle());
    this.time = 0;
    this.lightningTimer = 10 + Math.random() * 5;
    this.lightningFlash = 0;
    this.frostGrowth = 0;
    this.breathPuffs = [];
  }

  _spawn(type, x, y, vx, vy, life, size) {
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (p.life <= 0) {
        p.type = type; p.x = x; p.y = y; p.vx = vx; p.vy = vy;
        p.life = life; p.maxLife = life; p.size = size;
        p.phase = Math.random() * Math.PI * 2; p.alpha = 1;
        return p;
      }
    }
    return null;
  }

  update(dt, weatherType, intensity) {
    this.time += dt;
    const spawnRate = intensity * 0.8;

    // Update existing particles
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.min(1, p.life / (p.maxLife * 0.3));
    }

    // Update breath puffs for cold
    for (let i = this.breathPuffs.length - 1; i >= 0; i--) {
      const b = this.breathPuffs[i];
      b.life -= dt;
      b.y -= 8 * dt;
      b.size += 4 * dt;
      if (b.life <= 0) this.breathPuffs.splice(i, 1);
    }

    // Storm lightning timer
    if (weatherType === 'storm') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningFlash = 0.25;
        this.lightningTimer = 8 + Math.random() * 7;
      }
      if (this.lightningFlash > 0) this.lightningFlash *= Math.pow(0.05, dt);
    }

    // Frost accumulation for cold
    if (weatherType === 'cold') {
      this.frostGrowth = Math.min(1, this.frostGrowth + dt * 0.03 * intensity);
    } else {
      this.frostGrowth = Math.max(0, this.frostGrowth - dt * 0.1);
    }

    // Spawn new particles based on weather type (probabilistic per frame)
    if (weatherType === 'snow') this._spawnSnow(spawnRate, dt);
    else if (weatherType === 'drizzle') this._spawnDrizzle(spawnRate, dt);
    else if (weatherType === 'storm') this._spawnStorm(spawnRate, dt);
    else if (weatherType === 'hot') this._spawnHeat(spawnRate, dt);
    else if (weatherType === 'cold') this._spawnCold(spawnRate, dt);
  }

  _spawnSnow(rate, dt) {
    const count = Math.floor(rate * 3 * dt * 60);
    for (let i = 0; i < count; i++) {
      if (Math.random() > 0.4) continue;
      const sz = 1 + Math.random();
      this._spawn('snow', Math.random(), -0.02, (Math.random() - 0.5) * 0.01, 0.02 + Math.random() * 0.02, 4 + Math.random() * 3, sz);
    }
  }

  _spawnDrizzle(rate, dt) {
    const count = Math.floor(rate * 2 * dt * 60);
    for (let i = 0; i < count; i++) {
      if (Math.random() > 0.35) continue;
      this._spawn('drizzle', Math.random(), -0.01, 0.002, 0.12 + Math.random() * 0.04, 1.5, 0.5 + Math.random() * 0.3);
    }
  }

  _spawnStorm(rate, dt) {
    const count = Math.floor(rate * 5 * dt * 60);
    for (let i = 0; i < count; i++) {
      if (Math.random() > 0.5) continue;
      this._spawn('storm', Math.random(), -0.02, 0.04 + Math.random() * 0.02, 0.2 + Math.random() * 0.1, 1.0, 0.6 + Math.random() * 0.4);
    }
  }

  _spawnHeat(rate, dt) {
    if (Math.random() < rate * dt * 2) {
      this._spawn('heat', Math.random(), 0.7 + Math.random() * 0.3, 0, -0.015 - Math.random() * 0.01, 3 + Math.random() * 2, 2);
    }
  }

  _spawnCold(rate, dt) {
    if (Math.random() < rate * dt * 0.3) {
      const side = Math.random() < 0.5 ? 0 : 1;
      const cx = side === 0 ? Math.random() * 0.35 : 0.65 + Math.random() * 0.35;
      const cy = 0.3 + Math.random() * 0.5;
      this.breathPuffs.push({ x: cx, y: cy, size: 3, life: 1.5, maxLife: 1.5 });
    }
  }

  render(ctx, w, h, weatherType, intensity) {
    if (!weatherType || weatherType === 'clear' || weatherType === 'cloudy' || weatherType === 'rain') return;

    ctx.save();

    if (weatherType === 'snow') this._renderSnow(ctx, w, h, intensity);
    else if (weatherType === 'fog') this._renderFog(ctx, w, h, intensity);
    else if (weatherType === 'hot') this._renderHot(ctx, w, h, intensity);
    else if (weatherType === 'cold') this._renderCold(ctx, w, h, intensity);
    else if (weatherType === 'drizzle') this._renderDrizzle(ctx, w, h, intensity);
    else if (weatherType === 'storm') this._renderStorm(ctx, w, h, intensity);
    else if (weatherType === 'overcast') this._renderOvercast(ctx, w, h, intensity);

    ctx.restore();
  }

  // ---- SNOW ----
  _renderSnow(ctx, w, h, intensity) {
    const t = this.time;
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (p.life <= 0 || p.type !== 'snow') continue;
      const px = p.x * w + Math.sin(t * 1.5 + p.phase) * 12;
      const py = p.y * h;
      if (py < 0 || py > h || px < -5 || px > w + 5) continue;
      const a = p.alpha * 0.7;
      ctx.globalAlpha = a;
      ctx.fillStyle = Math.random() > 0.3 ? '#ffffff' : '#d0e8ff';
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Snow accumulation line at bottom
    ctx.globalAlpha = 0.25 * intensity;
    ctx.fillStyle = '#e8f0ff';
    ctx.fillRect(0, h - 2, w, 2);
    ctx.globalAlpha = 1;
  }

  // ---- FOG ----
  _renderFog(ctx, w, h, intensity) {
    const t = this.time;
    const alpha = 0.15 + intensity * 0.1;
    // Two drifting gradient circles for layered fog
    for (let layer = 0; layer < 2; layer++) {
      const ox = Math.sin(t * 0.15 + layer * 2.5) * w * 0.15;
      const oy = Math.cos(t * 0.1 + layer * 1.8) * h * 0.08;
      const cx = w * (0.3 + layer * 0.4) + ox;
      const cy = h * 0.5 + oy;
      const r = Math.max(w, h) * 0.6;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, `rgba(180, 180, 190, ${(alpha * 0.8).toFixed(3)})`);
      grad.addColorStop(0.5, `rgba(160, 165, 175, ${(alpha * 0.4).toFixed(3)})`);
      grad.addColorStop(1, 'rgba(160, 165, 175, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    // Flat wash for overall visibility reduction
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = '#a0a5b0';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  // ---- HOT / HEAT SHIMMER ----
  _renderHot(ctx, w, h, intensity) {
    const t = this.time;
    // Warm tint overlay
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255, 200, 100, 0.05)';
    ctx.fillRect(0, 0, w, h);

    // Heat shimmer wavy lines in bottom third
    const startY = h * 0.67;
    const lineCount = Math.floor(8 * intensity);
    ctx.globalAlpha = 0.04 + intensity * 0.02;
    ctx.strokeStyle = 'rgba(255, 220, 150, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < lineCount; i++) {
      const baseY = startY + (i / lineCount) * (h - startY);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const waveY = baseY + Math.sin(x * 0.02 + t * 2 + i * 1.1) * (2 + intensity * 2);
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }

    // Rising heat haze particles
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (p.life <= 0 || p.type !== 'heat') continue;
      const px = p.x * w + Math.sin(t * 3 + p.phase) * 6;
      const py = p.y * h;
      if (py < 0) continue;
      ctx.globalAlpha = p.alpha * 0.08;
      ctx.strokeStyle = 'rgba(255, 200, 120, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.sin(t * 4 + p.phase) * 4, py - 8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ---- COLD / FROST ----
  _renderCold(ctx, w, h, intensity) {
    // Blue tint overlay
    ctx.fillStyle = 'rgba(150, 200, 255, 0.06)';
    ctx.fillRect(0, 0, w, h);

    // Frost crystals creeping from corners
    const growth = this.frostGrowth;
    if (growth > 0.01) {
      ctx.globalAlpha = 0.2 * growth;
      ctx.strokeStyle = '#c0deff';
      ctx.lineWidth = 1;
      const corners = [[0, 0], [w, 0], [0, h], [w, h]];
      for (let c = 0; c < 4; c++) {
        const [bx, by] = corners[c];
        const reach = growth * Math.min(w, h) * 0.2;
        // Draw branching pixel frost pattern (seeded by corner index)
        this._drawFrostBranch(ctx, bx, by, reach, c * 1.7 + 0.5, 3);
      }
    }

    // Breath puffs
    for (let i = 0; i < this.breathPuffs.length; i++) {
      const b = this.breathPuffs[i];
      const fade = b.life / b.maxLife;
      ctx.globalAlpha = fade * 0.15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x * w, b.y * h, b.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _drawFrostBranch(ctx, x, y, len, seed, depth) {
    if (depth <= 0 || len < 2) return;
    const angle = seed * 2.3 + depth * 0.8;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
    // Two sub-branches
    this._drawFrostBranch(ctx, x + dx, y + dy, len * 0.55, seed + 1.2, depth - 1);
    this._drawFrostBranch(ctx, x + dx, y + dy, len * 0.45, seed - 0.9, depth - 1);
  }

  // ---- DRIZZLE ----
  _renderDrizzle(ctx, w, h, intensity) {
    // Light mist overlay
    ctx.globalAlpha = 0.03 * intensity;
    ctx.fillStyle = '#b0c0d4';
    ctx.fillRect(0, 0, w, h);

    // Thin slow drops
    ctx.strokeStyle = '#8898bc';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (p.life <= 0 || p.type !== 'drizzle') continue;
      const px = p.x * w;
      const py = p.y * h;
      if (py < 0 || py > h) continue;
      ctx.globalAlpha = p.alpha * 0.35;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 0.3, py + 4 + p.size * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ---- STORM ----
  _renderStorm(ctx, w, h, intensity) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 20, 0.1)';
    ctx.fillRect(0, 0, w, h);

    // Wind-angled rain drops
    ctx.strokeStyle = '#7888b0';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (p.life <= 0 || p.type !== 'storm') continue;
      const px = p.x * w;
      const py = p.y * h;
      if (py < -10 || py > h + 10) continue;
      ctx.globalAlpha = p.alpha * 0.5;
      const len = 6 + p.size * 4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + len * 0.5, py + len);
      ctx.stroke();
    }

    // Lightning flash
    if (this.lightningFlash > 0.005) {
      ctx.globalAlpha = this.lightningFlash;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;
  }

  // ---- OVERCAST ----
  _renderOvercast(ctx, w, h, intensity) {
    ctx.fillStyle = `rgba(40, 40, 60, ${(0.08 * intensity).toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
  }
}
