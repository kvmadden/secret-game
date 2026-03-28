export class MeterVisuals {
  constructor() {
    this._time = 0;

    // Smoothed intensity values (0-1) per meter
    this._queueIntensity = 0;
    this._safetyIntensity = 0;
    this._rageIntensity = 0;
    this._burnoutIntensity = 0;
    this._scrutinyIntensity = 0;

    // Combined state
    this._anyCritical = false;
    this._allLow = false;

    // Shake state
    this._shakeX = 0;
    this._shakeY = 0;

    // Eyelid effect
    this._eyelidHeight = 0;

    // Arrow scroll offset for queue pressure
    this._arrowScroll = 0;

    // Smoothing factor for intensity transitions
    this._smoothing = 3.0;
  }

  // ---------- public API ----------

  update(meters, dt) {
    this._time += dt;

    const q = meters.queue || 0;
    const s = meters.safety || 0;
    const r = meters.rage || 0;
    const b = meters.burnout || 0;
    const sc = meters.scrutiny || 0;

    // Target intensities
    const tQueue = q > 60 ? (q - 60) / 40 : 0;
    const tSafety = s > 50 ? (s - 50) / 50 : 0;
    const tRage = r > 60 ? (r - 60) / 40 : 0;
    const tBurnout = b > 50 ? (b - 50) / 50 : 0;
    const tScrutiny = sc > 60 ? (sc - 60) / 40 : 0;

    // Smooth toward targets
    const rate = 1 - Math.exp(-this._smoothing * dt);
    this._queueIntensity += (tQueue - this._queueIntensity) * rate;
    this._safetyIntensity += (tSafety - this._safetyIntensity) * rate;
    this._rageIntensity += (tRage - this._rageIntensity) * rate;
    this._burnoutIntensity += (tBurnout - this._burnoutIntensity) * rate;
    this._scrutinyIntensity += (tScrutiny - this._scrutinyIntensity) * rate;

    // Combined checks
    this._anyCritical = q > 85 || s > 85 || r > 85 || b > 85 || sc > 85;
    this._allLow = q < 30 && s < 30 && r < 30 && b < 30 && sc < 30;

    // Arrow scroll for queue
    this._arrowScroll += dt * 40 * (0.5 + this._queueIntensity);

    // Shake for rage >85
    if (r > 85) {
      const shakeStrength = ((r - 85) / 15) * 2.0;
      this._shakeX = (Math.random() - 0.5) * shakeStrength;
      this._shakeY = (Math.random() - 0.5) * shakeStrength;
    } else {
      this._shakeX *= 0.8;
      this._shakeY *= 0.8;
    }

    // Eyelid for burnout >80
    if (b > 80) {
      const eyelidTarget = ((b - 80) / 20) * 0.18;
      this._eyelidHeight += (eyelidTarget - this._eyelidHeight) * rate;
    } else {
      this._eyelidHeight += (0 - this._eyelidHeight) * rate;
    }
  }

  render(ctx, w, h) {
    ctx.save();

    // Apply screen shake offset
    if (Math.abs(this._shakeX) > 0.01 || Math.abs(this._shakeY) > 0.01) {
      ctx.translate(this._shakeX, this._shakeY);
    }

    // --- All-low warm glow ---
    if (this._allLow) {
      this._renderWarmGlow(ctx, w, h);
    }

    // --- Queue pressure: cyan tint + arrows ---
    if (this._queueIntensity > 0.001) {
      this._renderQueuePressure(ctx, w, h);
    }

    // --- Safety risk: yellow pulse + scan lines ---
    if (this._safetyIntensity > 0.001) {
      this._renderSafetyRisk(ctx, w, h);
    }

    // --- Public rage: red vignette + pulse ---
    if (this._rageIntensity > 0.001) {
      this._renderRage(ctx, w, h);
    }

    // --- Burnout: desaturation + blur + tunnel vision ---
    if (this._burnoutIntensity > 0.001) {
      this._renderBurnout(ctx, w, h);
    }

    // --- Scrutiny: purple + spotlight + grid ---
    if (this._scrutinyIntensity > 0.001) {
      this._renderScrutiny(ctx, w, h);
    }

    // --- Combined critical: heartbeat pulse ---
    if (this._anyCritical) {
      this._renderCriticalPulse(ctx, w, h);
    }

    // --- Vignette (always present at varying strength) ---
    this._renderVignette(ctx, w, h);

    // --- Eyelid (burnout heavy) ---
    if (this._eyelidHeight > 0.001) {
      this._renderEyelid(ctx, w, h);
    }

    ctx.restore();
  }

  getColorShift() {
    let r = 0, g = 0, b = 0, a = 0;

    // Queue: cyan
    r += 0;
    g += this._queueIntensity * 0.4;
    b += this._queueIntensity * 0.5;

    // Safety: yellow
    r += this._safetyIntensity * 0.5;
    g += this._safetyIntensity * 0.4;
    b += 0;

    // Rage: red
    r += this._rageIntensity * 0.6;
    g += 0;
    b += 0;

    // Burnout: orange
    r += this._burnoutIntensity * 0.4;
    g += this._burnoutIntensity * 0.2;
    b += 0;

    // Scrutiny: purple
    r += this._scrutinyIntensity * 0.3;
    g += 0;
    b += this._scrutinyIntensity * 0.4;

    // Warm glow when all low
    if (this._allLow) {
      r += 0.1;
      g += 0.06;
      b += 0.02;
    }

    a = Math.min(1, r + g + b) * 0.08;

    return {
      r: Math.min(1, r),
      g: Math.min(1, g),
      b: Math.min(1, b),
      a
    };
  }

  getDesaturation() {
    return Math.min(1, this._burnoutIntensity * 0.7);
  }

  getPulseIntensity() {
    const ragePulse = this._rageIntensity;
    const criticalPulse = this._anyCritical ? 0.3 : 0;
    return Math.min(1, ragePulse + criticalPulse);
  }

  getVignetteStrength() {
    let v = 0;
    v += this._rageIntensity * 0.3;
    v += this._burnoutIntensity * 0.5;
    v += this._scrutinyIntensity * 0.2;
    if (this._anyCritical) v += 0.15;
    if (this._allLow) v = Math.max(v - 0.1, 0);
    return Math.min(1, v);
  }

  // ---------- private rendering ----------

  _renderWarmGlow(ctx, w, h) {
    // Gentle warm radial glow from center
    ctx.globalCompositeOperation = 'screen';
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    grad.addColorStop(0, 'rgba(255, 220, 160, 0.04)');
    grad.addColorStop(0.5, 'rgba(255, 200, 120, 0.02)');
    grad.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  _renderQueuePressure(ctx, w, h) {
    const i = this._queueIntensity;
    const alpha = i * 0.06;

    // Cyan tint at screen edges
    ctx.globalCompositeOperation = 'screen';
    const edgeWidth = w * 0.15;

    // Right edge (queue area assumed to be right side)
    const grad = ctx.createLinearGradient(w, 0, w - edgeWidth, 0);
    grad.addColorStop(0, `rgba(0, 220, 255, ${alpha})`);
    grad.addColorStop(1, 'rgba(0, 220, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(w - edgeWidth, 0, edgeWidth, h);

    // Left edge (lighter)
    const gradL = ctx.createLinearGradient(0, 0, edgeWidth * 0.5, 0);
    gradL.addColorStop(0, `rgba(0, 200, 240, ${alpha * 0.4})`);
    gradL.addColorStop(1, 'rgba(0, 200, 240, 0)');
    ctx.fillStyle = gradL;
    ctx.fillRect(0, 0, edgeWidth * 0.5, h);

    // Scrolling arrow indicators pointing right
    if (i > 0.1) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = i * 0.07;
      ctx.strokeStyle = '#00ddff';
      ctx.lineWidth = 1;

      const spacing = 24;
      const arrowSize = 4;
      const offset = this._arrowScroll % spacing;

      for (let y = -spacing + offset; y < h + spacing; y += spacing) {
        const x = w - edgeWidth * 0.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + arrowSize, y + arrowSize);
        ctx.lineTo(x, y + arrowSize * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  _renderSafetyRisk(ctx, w, h) {
    const i = this._safetyIntensity;

    // Yellow warning pulse at edges (slow sine)
    const pulse = (Math.sin(this._time * 2.0) + 1) * 0.5;
    const alpha = i * pulse * 0.05;

    ctx.globalCompositeOperation = 'screen';
    const borderSize = 6;

    ctx.fillStyle = `rgba(255, 220, 0, ${alpha})`;
    ctx.fillRect(0, 0, w, borderSize);
    ctx.fillRect(0, h - borderSize, w, borderSize);
    ctx.fillRect(0, 0, borderSize, h);
    ctx.fillRect(w - borderSize, 0, borderSize, h);

    // Scan line effect (horizontal lines like a medical monitor)
    if (i > 0.15) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = i * 0.03;
      ctx.strokeStyle = '#cccc00';
      ctx.lineWidth = 1;

      const scanSpeed = this._time * 30;
      const scanSpacing = 4;

      for (let y = 0; y < h; y += scanSpacing) {
        const lineAlpha = (Math.sin((y + scanSpeed) * 0.5) + 1) * 0.5;
        if (lineAlpha > 0.7) {
          ctx.beginPath();
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(w, y + 0.5);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
    }

    // Hazard stripes at >80 (safety intensity > 0.6)
    if (i > 0.6) {
      const hazardAlpha = (i - 0.6) * 0.08;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = hazardAlpha;

      const stripeW = 8;
      const borderH = 4;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, borderH);
      ctx.fillRect(0, h - borderH, w, borderH);

      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2;
      for (let x = -borderH; x < w + borderH; x += stripeW * 2) {
        // Top border
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + borderH, borderH);
        ctx.stroke();
        // Bottom border
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + borderH, h - borderH);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  _renderRage(ctx, w, h) {
    const i = this._rageIntensity;

    // Red vignette that pulses at angry frequency (faster sine)
    const pulse = (Math.sin(this._time * 5.5) + 1) * 0.5;
    const vigAlpha = i * (0.04 + pulse * 0.04);

    ctx.globalCompositeOperation = 'multiply';
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.6, `rgba(255, ${Math.round(200 - i * 150)}, ${Math.round(200 - i * 180)}, 1)`);
    grad.addColorStop(1, `rgba(${Math.round(180 - i * 80)}, ${Math.round(40 - i * 30)}, ${Math.round(40 - i * 30)}, 1)`);
    ctx.fillStyle = grad;
    ctx.globalAlpha = vigAlpha + 0.02;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    // Darken and redden screen edges
    ctx.globalCompositeOperation = 'source-over';
    const edgeAlpha = i * 0.06;
    const edgeGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.65);
    edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    edgeGrad.addColorStop(0.7, `rgba(80, 0, 0, ${edgeAlpha * 0.5})`);
    edgeGrad.addColorStop(1, `rgba(60, 0, 0, ${edgeAlpha})`);
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
  }

  _renderBurnout(ctx, w, h) {
    const i = this._burnoutIntensity;

    // Desaturation via grayscale overlay
    const desatAlpha = i * 0.08;
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = `rgba(128, 128, 128, ${desatAlpha})`;
    ctx.fillRect(0, 0, w, h);

    // Slight blur simulation: overlay at tiny offset with low alpha
    if (i > 0.2) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = i * 0.05;
      try {
        ctx.drawImage(ctx.canvas, 0.5, 0.5);
      } catch (_e) {
        // noop if canvas is tainted
      }
      ctx.globalAlpha = 1;
    }

    // Orange fatigue tint
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(200, 120, 40, ${i * 0.03})`;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
  }

  _renderScrutiny(ctx, w, h) {
    const i = this._scrutinyIntensity;

    // Purple tint overlay
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(140, 60, 200, ${i * 0.04})`;
    ctx.fillRect(0, 0, w, h);

    // Spotlight effect: bright center, dark edges (being watched)
    ctx.globalCompositeOperation = 'multiply';
    const spot = ctx.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, w * 0.55);
    spot.addColorStop(0, 'rgba(255, 255, 255, 1)');
    spot.addColorStop(0.5, `rgba(230, 220, 255, 1)`);
    spot.addColorStop(1, `rgba(${Math.round(180 - i * 60)}, ${Math.round(160 - i * 80)}, ${Math.round(200 - i * 40)}, 1)`);
    ctx.globalAlpha = i * 0.08 + 0.01;
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    // Grid/crosshair overlay (surveillance camera feel)
    if (i > 0.15) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = i * 0.025;
      ctx.strokeStyle = '#9040cc';
      ctx.lineWidth = 0.5;

      const gridSize = 32;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
        ctx.stroke();
      }

      // Center crosshair
      const cx = w / 2;
      const cy = h / 2;
      const chSize = 12;
      ctx.globalAlpha = i * 0.04;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - chSize, cy);
      ctx.lineTo(cx + chSize, cy);
      ctx.moveTo(cx, cy - chSize);
      ctx.lineTo(cx, cy + chSize);
      ctx.stroke();

      // Corner brackets
      const bracketLen = 8;
      const bracketInset = 20;
      ctx.beginPath();
      // Top-left
      ctx.moveTo(bracketInset, bracketInset + bracketLen);
      ctx.lineTo(bracketInset, bracketInset);
      ctx.lineTo(bracketInset + bracketLen, bracketInset);
      // Top-right
      ctx.moveTo(w - bracketInset - bracketLen, bracketInset);
      ctx.lineTo(w - bracketInset, bracketInset);
      ctx.lineTo(w - bracketInset, bracketInset + bracketLen);
      // Bottom-left
      ctx.moveTo(bracketInset, h - bracketInset - bracketLen);
      ctx.lineTo(bracketInset, h - bracketInset);
      ctx.lineTo(bracketInset + bracketLen, h - bracketInset);
      // Bottom-right
      ctx.moveTo(w - bracketInset - bracketLen, h - bracketInset);
      ctx.lineTo(w - bracketInset, h - bracketInset);
      ctx.lineTo(w - bracketInset, h - bracketInset - bracketLen);
      ctx.stroke();

      ctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  _renderCriticalPulse(ctx, w, h) {
    // Heartbeat brightness oscillation at 1.2 Hz
    const heartbeat = Math.pow((Math.sin(this._time * 1.2 * Math.PI * 2) + 1) * 0.5, 3);
    const alpha = heartbeat * 0.04;

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(255, 240, 230, ${alpha})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  _renderVignette(ctx, w, h) {
    const strength = this.getVignetteStrength();
    if (strength < 0.001) return;

    const alpha = strength * 0.1;
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  _renderEyelid(ctx, w, h) {
    // Dark bar descending from top (heavy eyelid)
    const barHeight = this._eyelidHeight * h;
    if (barHeight < 1) return;

    const grad = ctx.createLinearGradient(0, 0, 0, barHeight);
    grad.addColorStop(0, 'rgba(15, 10, 5, 0.6)');
    grad.addColorStop(0.7, 'rgba(15, 10, 5, 0.3)');
    grad.addColorStop(1, 'rgba(15, 10, 5, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, barHeight);
  }
}
