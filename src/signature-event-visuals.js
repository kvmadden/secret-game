/** Visual effects for signature events. Border pulses, particles,
 *  vignette, and entry/exit transitions on the game canvas each frame. */

const RED = [255, 50, 50], ORANGE = [255, 160, 40];
const PURPLE = [160, 80, 220], YELLOW = [240, 220, 60];
const PT_PAPER = 'paper', PT_SPARK = 'spark', PT_CLOCK = 'clock', PT_ALERT = 'alert';

export const EVENT_VISUAL_CONFIGS = {
  sig_dea_audit:        { borderColor: PURPLE, particleType: PT_PAPER, intensity: 0.9 },
  sig_board_inspector:  { borderColor: PURPLE, particleType: PT_PAPER, intensity: 0.85 },
  sig_opioid_dilemma:   { borderColor: RED,    particleType: PT_ALERT, intensity: 1.0 },
  sig_pharmacist_down:  { borderColor: RED,    particleType: PT_ALERT, intensity: 1.0 },
  sig_karen_supreme:    { borderColor: RED,    particleType: PT_ALERT, intensity: 0.8 },
  sig_the_recall:       { borderColor: RED,    particleType: PT_PAPER, intensity: 0.9 },
  sig_flu_shot_frenzy:  { borderColor: ORANGE, particleType: PT_ALERT, intensity: 0.85 },
  sig_system_meltdown:  { borderColor: ORANGE, particleType: PT_SPARK, intensity: 0.95 },
  sig_power_outage:     { borderColor: ORANGE, particleType: PT_SPARK, intensity: 0.9 },
  sig_the_long_wait:    { borderColor: YELLOW, particleType: PT_CLOCK, intensity: 0.7 },
};

const MAX_PARTICLES = 24;
const ENTRY_DARK_DUR = 0.3, ENTRY_SWEEP_DUR = 0.4, TITLE_DUR = 2.0, EXIT_DUR = 0.5;

export class SignatureEventVisuals {
  constructor() {
    this._active = false;
    this._eventId = null;
    this._cfg = null;
    this._elapsed = 0;
    this._phase = 'idle'; // idle | entry_dark | entry_sweep | active | exit
    this._phaseTime = 0;
    this._title = '';
    this._particles = [];
    this._borderPulse = 0;
  }

  startEvent(eventId) {
    this._active = true;
    this._eventId = eventId;
    this._cfg = EVENT_VISUAL_CONFIGS[eventId] || EVENT_VISUAL_CONFIGS.sig_the_recall;
    this._elapsed = 0;
    this._phase = 'entry_dark';
    this._phaseTime = 0;
    this._title = eventId.replace(/^sig_/, '').replace(/_/g, ' ').toUpperCase();
    this._particles.length = 0;
    this._borderPulse = 0;
  }

  endEvent() {
    if (!this._active) return;
    this._phase = 'exit';
    this._phaseTime = 0;
  }

  isActive() {
    return this._active;
  }

  update(dt) {
    if (!this._active) return;
    this._elapsed += dt;
    this._phaseTime += dt;
    this._borderPulse += dt * 3;

    // Phase transitions
    if (this._phase === 'entry_dark' && this._phaseTime >= ENTRY_DARK_DUR) {
      this._phase = 'entry_sweep';
      this._phaseTime = 0;
    } else if (this._phase === 'entry_sweep' && this._phaseTime >= ENTRY_SWEEP_DUR + TITLE_DUR) {
      this._phase = 'active';
      this._phaseTime = 0;
    } else if (this._phase === 'exit' && this._phaseTime >= EXIT_DUR) {
      this._active = false;
      this._phase = 'idle';
      this._particles.length = 0;
      return;
    }

    // Spawn particles during active / entry_sweep
    if (this._phase === 'entry_sweep' || this._phase === 'active') {
      this._tickParticles(dt);
    }
  }

  render(ctx, w, h) {
    if (!this._active) return;
    const cfg = this._cfg;

    if (this._phase === 'entry_dark') {
      this._renderEntryDark(ctx, w, h);
    } else if (this._phase === 'entry_sweep') {
      this._renderEntrySweep(ctx, w, h);
    }

    if (this._phase === 'entry_sweep' || this._phase === 'active') {
      this._renderParticles(ctx, w, h);
      this._renderBorder(ctx, w, h, cfg);
      this._renderVignette(ctx, w, h, cfg.intensity);
    }

    if (this._phase === 'exit') {
      this._renderExit(ctx, w, h);
    }
  }

  // ---- entry effects ----

  _renderEntryDark(ctx, w, h) {
    const t = Math.min(this._phaseTime / ENTRY_DARK_DUR, 1);
    ctx.save();
    ctx.globalAlpha = 0.6 * t;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  _renderEntrySweep(ctx, w, h) {
    const t = this._phaseTime;
    // Sweep line (first 0.4s)
    if (t < ENTRY_SWEEP_DUR) {
      const prog = t / ENTRY_SWEEP_DUR;
      const y = prog * h;
      ctx.save();
      ctx.globalAlpha = 0.9 * (1 - prog);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, y - 3, w, 6);
      ctx.restore();
    }
    // Fading title
    const titleStart = ENTRY_SWEEP_DUR * 0.5;
    if (t > titleStart) {
      const titleT = (t - titleStart) / TITLE_DUR;
      const alpha = titleT < 0.15 ? titleT / 0.15 : Math.max(0, 1 - (titleT - 0.6) / 0.4);
      if (alpha > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(alpha, 1);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + Math.round(h * 0.07) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 12;
        ctx.fillText(this._title, w * 0.5, h * 0.45);
        ctx.restore();
      }
    }
    // Residual darken fading out
    const darkFade = Math.max(0, 1 - t / 0.5);
    if (darkFade > 0) {
      ctx.save();
      ctx.globalAlpha = 0.6 * darkFade;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // ---- border pulse ----

  _renderBorder(ctx, w, h, cfg) {
    const pulse = (Math.sin(this._borderPulse) + 1) * 0.5;
    const alpha = 0.12 + pulse * 0.18 * cfg.intensity;
    const [r, g, b] = cfg.borderColor;
    const thick = 4 + pulse * 3;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = thick;
    ctx.strokeRect(thick * 0.5, thick * 0.5, w - thick, h - thick);
    ctx.restore();
  }

  // ---- vignette ----

  _renderVignette(ctx, w, h, intensity) {
    const r = Math.max(w, h) * 0.7;
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, r * 0.4, w * 0.5, h * 0.5, r);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.save();
    ctx.globalAlpha = 0.25 * intensity;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // ---- particles ----

  _tickParticles(dt) {
    // Spawn
    if (this._particles.length < MAX_PARTICLES && Math.random() < 0.3) {
      this._particles.push(this._spawnParticle());
    }
    // Update
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this._particles[i] = this._particles[this._particles.length - 1];
        this._particles.pop();
      }
    }
  }

  _spawnParticle() {
    return {
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.03,
      vy: -0.01 - Math.random() * 0.03,
      life: 3 + Math.random() * 3,
      maxLife: 6,
      size: 2 + Math.random() * 3,
      angle: Math.random() * Math.PI * 2,
    };
  }

  _renderParticles(ctx, w, h) {
    const type = this._cfg.particleType;
    const [cr, cg, cb] = this._cfg.borderColor;
    ctx.save();
    for (const p of this._particles) {
      const alpha = Math.min(p.life / p.maxLife, 1) * 0.6;
      if (alpha <= 0) continue;
      const px = p.x * w;
      const py = p.y * h;
      const sz = p.size;
      ctx.globalAlpha = alpha;

      if (type === PT_PAPER) {
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.angle + p.life);
        ctx.fillRect(-sz, -sz * 0.6, sz * 2, sz * 1.2);
        ctx.restore();
      } else if (type === PT_SPARK) {
        ctx.fillStyle = '#fff';
        ctx.shadowColor = `rgb(${cr},${cg},${cb})`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, sz * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (type === PT_CLOCK) {
        ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.moveTo(px, py);
        const a = p.life * 2;
        ctx.lineTo(px + Math.cos(a) * sz * 0.7, py + Math.sin(a) * sz * 0.7);
        ctx.stroke();
      } else {
        // PT_ALERT - exclamation mark
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.font = `bold ${Math.round(sz * 4)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', px, py);
      }
    }
    ctx.restore();
  }

  // ---- exit transition ----

  _renderExit(ctx, w, h) {
    const t = Math.min(this._phaseTime / EXIT_DUR, 1);
    // Bright flash fading out
    const flash = Math.max(0, 1 - t * 2);
    if (flash > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3 * flash;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    // Fading border + vignette
    const fade = 1 - t;
    if (fade > 0 && this._cfg) {
      ctx.save();
      ctx.globalAlpha = fade;
      this._renderBorder(ctx, w, h, this._cfg);
      this._renderVignette(ctx, w, h, this._cfg.intensity * fade);
      ctx.restore();
    }
    // Dissipating particles
    if (this._particles.length > 0) {
      ctx.save();
      ctx.globalAlpha = fade;
      this._renderParticles(ctx, w, h);
      ctx.restore();
    }
  }
}
