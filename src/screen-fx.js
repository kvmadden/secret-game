/**
 * Post-processing effects for the pharmacy game canvas.
 *
 * Applies subtle visual layers after all game rendering is complete:
 * warm color grading, bloom, scanlines, stress distortion,
 * flash effects, transition wipes, and time-of-day tinting.
 *
 * All effects use canvas compositing operations with low alpha
 * values to enhance without distracting.
 */

const GAME_DURATION = 360;

// ---------- Color constants ----------

const METER_COLORS = {
  queue:    { r: 0,   g: 212, b: 255 },
  safety:   { r: 255, g: 204, b: 0   },
  rage:     { r: 255, g: 68,  b: 68  },
  burnout:  { r: 255, g: 136, b: 0   },
  scrutiny: { r: 204, g: 102, b: 255 },
};

// Time-of-day tints: [r, g, b, alpha]
const TOD_MORNING   = [255, 220, 140, 0.05];  // golden
const TOD_MIDDAY    = [255, 255, 255, 0.00];  // neutral (no tint)
const TOD_AFTERNOON = [255, 180, 100, 0.04];  // amber
const TOD_EVENING   = [120, 140, 200, 0.06];  // cool blue

export class ScreenFX {
  constructor() {
    // Scanline toggle
    this.scanlinesEnabled = true;

    // Active flash effects: { type, alpha, decay, r, g, b }
    this.flashes = [];

    // Active transition: { type, progress, duration, direction }
    this.transition = null;

    // Cached scanline pattern (created lazily)
    this._scanlinePattern = null;
    this._scanlinePatternW = 0;
    this._scanlinePatternH = 0;

    // Off-screen canvas for chromatic aberration
    this._aberrationCanvas = null;
    this._aberrationCtx = null;
  }

  // =====================================================
  //  Public API
  // =====================================================

  /**
   * Call each frame after all game rendering.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w  canvas width (CSS pixels * dpr)
   * @param {number} h  canvas height
   * @param {object} gameState  { time, elapsed, meters, phase }
   */
  applyEffects(ctx, w, h, gameState) {
    ctx.save();
    // Reset any transform so effects cover the full canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const progress = gameState.time / GAME_DURATION; // 0-1
    const burnout = gameState.meters.burnout;

    // 1) Warm color grading
    this._applyWarmGrading(ctx, w, h);

    // 2) Time-of-day tint
    this._applyTimeOfDay(ctx, w, h, progress);

    // 3) Bloom / edge glow from high meters
    this._applyBloom(ctx, w, h, gameState.meters);

    // 4) Stress distortion (burnout > 70)
    if (burnout > 70) {
      this._applyStressDistortion(ctx, w, h, burnout);
    }

    // 5) Vignette (always subtle, intensifies with burnout)
    this._applyVignette(ctx, w, h, burnout);

    // 6) Scanlines
    if (this.scanlinesEnabled) {
      this._applyScanlines(ctx, w, h);
    }

    // 7) Flash effects
    this._processFlashes(ctx, w, h, gameState.elapsed);

    // 8) Transition wipe
    this._processTransition(ctx, w, h, gameState.elapsed);

    ctx.restore();
  }

  // ---------- Flash triggers ----------

  /** Full-screen white flash (game over). */
  flashWhite(duration = 0.5) {
    this.flashes.push({
      r: 255, g: 255, b: 255,
      alpha: 0.6,
      decay: 0.6 / duration,
    });
  }

  /** Red pulse (meter critical). */
  flashRed(duration = 0.35) {
    this.flashes.push({
      r: 255, g: 40, b: 40,
      alpha: 0.15,
      decay: 0.15 / duration,
    });
  }

  /** Green pulse (positive event). */
  flashGreen(duration = 0.3) {
    this.flashes.push({
      r: 60, g: 255, b: 100,
      alpha: 0.12,
      decay: 0.12 / duration,
    });
  }

  // ---------- Transition triggers ----------

  /** Circle iris-out wipe for scene changes. */
  irisOut(duration = 0.8) {
    this.transition = {
      type: 'iris',
      progress: 0,
      duration,
      direction: 'out', // circle shrinks
    };
  }

  /** Fade to black. */
  fadeToBlack(duration = 0.6) {
    this.transition = {
      type: 'fade',
      progress: 0,
      duration,
      direction: 'out',
    };
  }

  /** Fade from black (reverse). */
  fadeFromBlack(duration = 0.6) {
    this.transition = {
      type: 'fade',
      progress: 0,
      duration,
      direction: 'in',
    };
  }

  /** Circle iris-in (opening). */
  irisIn(duration = 0.8) {
    this.transition = {
      type: 'iris',
      progress: 0,
      duration,
      direction: 'in',
    };
  }

  // =====================================================
  //  Private — individual effects
  // =====================================================

  /**
   * 1) Warm color grading — overlay with warm amber, shift blues
   *    toward purple with a very faint magenta screen pass.
   */
  _applyWarmGrading(ctx, w, h) {
    // Warm amber overlay — boosts oranges
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(180, 130, 60, 0.03)';
    ctx.fillRect(0, 0, w, h);

    // Faint magenta screen pass — nudges blues toward purple
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(60, 20, 40, 0.02)';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * 2) Bloom / colored edge glow based on highest meter.
   */
  _applyBloom(ctx, w, h, meters) {
    // Find the highest meter
    let maxVal = 0;
    let maxKey = 'queue';
    for (const key in meters) {
      if (meters[key] > maxVal) {
        maxVal = meters[key];
        maxKey = key;
      }
    }

    // Only show bloom when a meter is elevated
    if (maxVal < 50) return;

    const intensity = (maxVal - 50) / 50; // 0–1 over 50–100 range
    const color = METER_COLORS[maxKey] || METER_COLORS.queue;
    const alpha = intensity * 0.07; // max 0.07

    ctx.globalCompositeOperation = 'screen';

    // Four edge gradients
    const edgeSize = Math.min(w, h) * 0.25;

    // Left edge
    const gl = ctx.createRadialGradient(0, h / 2, 0, 0, h / 2, edgeSize);
    gl.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`);
    gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, edgeSize, h);

    // Right edge
    const gr = ctx.createRadialGradient(w, h / 2, 0, w, h / 2, edgeSize);
    gr.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(w - edgeSize, 0, edgeSize, h);

    // Top edge
    const gt = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, edgeSize);
    gt.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`);
    gt.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gt;
    ctx.fillRect(0, 0, w, edgeSize);

    // Bottom edge
    const gb = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, edgeSize);
    gb.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`);
    gb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gb;
    ctx.fillRect(0, h - edgeSize, w, edgeSize);

    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * 3) Scanline overlay — faint horizontal lines every 3px.
   */
  _applyScanlines(ctx, w, h) {
    // Rebuild pattern if canvas size changed
    if (!this._scanlinePattern || this._scanlinePatternW !== w || this._scanlinePatternH !== h) {
      this._buildScanlinePattern(w, h);
    }

    if (this._scanlinePattern) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 1; // alpha is baked into the pattern
      ctx.fillStyle = this._scanlinePattern;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  _buildScanlinePattern(w, h) {
    // Small pattern tile: 1px wide, 3px tall
    const patCanvas = document.createElement('canvas');
    patCanvas.width = 1;
    patCanvas.height = 3;
    const pCtx = patCanvas.getContext('2d');

    // Row 0 & 1: fully transparent (no darkening)
    pCtx.clearRect(0, 0, 1, 3);

    // Row 2: very subtle dark line
    pCtx.fillStyle = 'rgba(0, 0, 0, 0.025)'; // alpha 0.025 -> subtle
    pCtx.fillRect(0, 2, 1, 1);

    try {
      this._scanlinePattern = pCtx.createPattern(patCanvas, 'repeat');
    } catch (_e) {
      this._scanlinePattern = null;
    }
    this._scanlinePatternW = w;
    this._scanlinePatternH = h;
  }

  /**
   * 4) Stress distortion — chromatic aberration + wave at high burnout.
   */
  _applyStressDistortion(ctx, w, h, burnout) {
    const intensity = (burnout - 70) / 30; // 0–1 over 70–100 range
    const t = performance.now() / 1000;

    // --- Chromatic aberration: shift red channel 1-2px ---
    const shift = Math.round(1 + intensity);

    // Ensure offscreen canvas
    if (!this._aberrationCanvas || this._aberrationCanvas.width !== w || this._aberrationCanvas.height !== h) {
      this._aberrationCanvas = document.createElement('canvas');
      this._aberrationCanvas.width = w;
      this._aberrationCanvas.height = h;
      this._aberrationCtx = this._aberrationCanvas.getContext('2d');
    }

    const offCtx = this._aberrationCtx;
    offCtx.clearRect(0, 0, w, h);

    // Copy main canvas to offscreen
    offCtx.drawImage(ctx.canvas, 0, 0);

    // Draw offset red channel with low alpha for fringe effect
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.04 * intensity;
    ctx.drawImage(this._aberrationCanvas, shift, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // --- Subtle wave distortion via thin horizontal slices ---
    if (intensity > 0.4) {
      const waveIntensity = (intensity - 0.4) / 0.6; // 0-1 in 0.4-1 range
      const sliceHeight = 4;
      const maxOffset = Math.ceil(waveIntensity * 2); // max 2px

      ctx.globalAlpha = 0.03 * waveIntensity;
      ctx.globalCompositeOperation = 'source-over';
      for (let y = 0; y < h; y += sliceHeight * 3) {
        const offset = Math.sin(t * 2.5 + y * 0.05) * maxOffset;
        ctx.drawImage(
          this._aberrationCanvas,
          0, y, w, sliceHeight,
          offset, y, w, sliceHeight,
        );
      }
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Vignette — dark corners/edges, intensifies with burnout.
   */
  _applyVignette(ctx, w, h, burnout) {
    const baseAlpha = 0.15;
    const stressBonus = burnout > 70 ? ((burnout - 70) / 30) * 0.2 : 0;
    const alpha = baseAlpha + stressBonus;

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.sqrt(cx * cx + cy * cy);

    const grad = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${alpha})`);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * 7) Time-of-day tint based on game progress (0-1).
   */
  _applyTimeOfDay(ctx, w, h, progress) {
    let tint;

    if (progress < 0.25) {
      // Morning: golden
      tint = this._lerpTint(TOD_MORNING, TOD_MIDDAY, progress / 0.25);
    } else if (progress < 0.55) {
      // Midday: neutral (lerp from midday to midday, effectively constant)
      tint = TOD_MIDDAY;
    } else if (progress < 0.80) {
      // Afternoon: amber
      tint = this._lerpTint(TOD_MIDDAY, TOD_AFTERNOON, (progress - 0.55) / 0.25);
    } else {
      // Evening: blue-ish
      tint = this._lerpTint(TOD_AFTERNOON, TOD_EVENING, (progress - 0.80) / 0.20);
    }

    if (tint[3] < 0.005) return; // skip if alpha negligible

    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(${Math.round(tint[0])},${Math.round(tint[1])},${Math.round(tint[2])},${tint[3].toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Linear interpolate between two [r,g,b,a] tints.
   */
  _lerpTint(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
      a[3] + (b[3] - a[3]) * t,
    ];
  }

  // ---------- Flashes ----------

  _processFlashes(ctx, w, h, dt) {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      if (f.alpha <= 0) {
        this.flashes.splice(i, 1);
        continue;
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(${f.r},${f.g},${f.b},${f.alpha.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);

      f.alpha -= f.decay * dt;
      if (f.alpha < 0) f.alpha = 0;
    }
  }

  // ---------- Transitions ----------

  _processTransition(ctx, w, h, dt) {
    if (!this.transition) return;

    const tr = this.transition;
    tr.progress += dt / tr.duration;

    if (tr.progress >= 1) {
      // Draw final frame then clear
      this._drawTransitionFrame(ctx, w, h, 1, tr);
      this.transition = null;
      return;
    }

    this._drawTransitionFrame(ctx, w, h, tr.progress, tr);
  }

  _drawTransitionFrame(ctx, w, h, progress, tr) {
    // For 'in' direction, reverse the progress so the effect uncovers
    const t = tr.direction === 'in' ? 1 - progress : progress;

    if (tr.type === 'fade') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(0,0,0,${t.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);

    } else if (tr.type === 'iris') {
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.sqrt(cx * cx + cy * cy);
      // Circle shrinks from maxRadius to 0 as t goes 0->1
      const radius = maxRadius * (1 - t);

      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.arc(cx, cy, Math.max(0, radius), 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = '#000';
      ctx.fill();
    }
  }
}
