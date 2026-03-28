// camera-juice.js - Camera "juice" effects system for game feel enhancement
// Adds subtle camera movements: shake, zoom pulse, slow motion, focus pull, etc.
// All values tuned for pixel art at low resolution (~3px max shake, ~5% max zoom).

export class CameraJuice {
  constructor() {
    // Active shake effects (stack additively)
    this._shakes = [];

    // Active zoom pulse effects (stack multiplicatively)
    this._zoomPulses = [];

    // Slow motion state
    this._slowMotion = null;
    this._timeScale = 1.0;

    // Focus pull state
    this._focusPull = null;

    // Breathe state (continuous idle oscillation)
    this._breathe = null;

    // Hitstop state
    this._hitstopFrames = 0;

    // Rumble state (continuous low-frequency shake)
    this._rumble = null;

    // Internal clock for phase-based noise
    this._clock = 0;

    // Cached outputs
    this._shakeOffset = { x: 0, y: 0 };
    this._zoomModifier = 1.0;
    this._focusOffset = null;
  }

  // ---------------------------------------------------------------------------
  // Trigger effects
  // ---------------------------------------------------------------------------

  /**
   * Directional shake on event completion.
   * Uses sin/cos with random phase offsets for organic, Perlin-like movement.
   * Decays exponentially.
   * @param {number} intensity - Max pixel displacement (clamped to 3)
   * @param {number} duration  - Seconds until fully decayed
   */
  impactShake(intensity = 2, duration = 0.3) {
    intensity = Math.min(intensity, 3);
    this._shakes.push({
      intensity,
      duration,
      elapsed: 0,
      // Random phase offsets give each shake a unique direction pattern
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      // Higher frequency for snappy impact feel
      frequency: 25 + Math.random() * 10,
      type: 'impact',
    });
  }

  /**
   * Continuous low-frequency rumble (e.g. meter critical warning).
   * Runs until stopped via onMeterSafe() or until duration elapses.
   * @param {number} intensity - Max pixel displacement (kept low, ~0.5-1)
   * @param {number} duration  - Seconds, or Infinity for indefinite
   */
  rumble(intensity = 0.8, duration = Infinity) {
    intensity = Math.min(intensity, 1.5);
    this._rumble = {
      intensity,
      duration,
      elapsed: 0,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      // Low frequency 2-4 Hz for rumble feel
      frequency: 2 + Math.random() * 2,
    };
  }

  /**
   * Brief zoom in/out with spring physics (overshoot + settle).
   * @param {number} amount   - Zoom delta (e.g. 0.03 = 3% zoom in)
   * @param {number} duration - Seconds for full spring settle
   */
  zoomPulse(amount = 0.03, duration = 0.4) {
    amount = Math.min(Math.abs(amount), 0.05) * Math.sign(amount || 1);
    this._zoomPulses.push({
      amount,
      duration,
      elapsed: 0,
      // Spring parameters
      damping: 5.0,
      frequency: 12.0,
    });
  }

  /**
   * Slow time for dramatic moments. Smoothly ramps in/out.
   * @param {number} factor   - Time scale (0.5 = half speed)
   * @param {number} duration - Seconds of real time at slow speed
   */
  slowMotion(factor = 0.5, duration = 0.5) {
    factor = Math.max(0.1, Math.min(factor, 1.0));
    this._slowMotion = {
      targetFactor: factor,
      duration,
      elapsed: 0,
      rampTime: 0.1, // ease-in-out ramp duration
      state: 'ramp-in', // ramp-in -> hold -> ramp-out
    };
  }

  /**
   * Briefly shift camera focus to a world point, then return.
   * Uses smooth lerp for both directions.
   * @param {number} targetX  - World X to look at
   * @param {number} targetY  - World Y to look at
   * @param {number} duration - Total seconds (travel + hold + return)
   */
  focusPull(targetX, targetY, duration = 0.6) {
    this._focusPull = {
      targetX,
      targetY,
      duration,
      elapsed: 0,
      // Split: 25% travel to, 50% hold, 25% travel back
      travelIn: duration * 0.25,
      hold: duration * 0.5,
      travelOut: duration * 0.25,
    };
  }

  /**
   * Continuous subtle zoom oscillation for idle state.
   * Very subtle - meant to be almost imperceptible but adds life.
   * @param {number} amplitude - Zoom oscillation amount (default 0.002)
   * @param {number} frequency - Oscillation speed in Hz (default 0.4)
   */
  breathe(amplitude = 0.002, frequency = 0.4) {
    this._breathe = {
      amplitude: Math.min(amplitude, 0.005),
      frequency,
    };
  }

  /**
   * Freeze game for N frames on impact. Game time stops but the
   * hitstop counter still ticks down each update call.
   * @param {number} frames - Number of frames to freeze
   */
  hitstop(frames = 3) {
    this._hitstopFrames = Math.max(this._hitstopFrames, Math.floor(frames));
  }

  // ---------------------------------------------------------------------------
  // Update per frame
  // ---------------------------------------------------------------------------

  /**
   * Advance all active effects. Call once per frame.
   * @param {number} dt - Delta time in seconds (real time, not scaled)
   */
  update(dt) {
    this._clock += dt;

    // --- Hitstop: tick down but don't advance other time-based effects ---
    if (this._hitstopFrames > 0) {
      this._hitstopFrames--;
      // Still update shake offset so it's available if needed
      this._updateShakeOffset(0);
      this._updateZoomModifier(0);
      return;
    }

    // --- Shakes ---
    this._updateShakes(dt);
    this._updateShakeOffset(dt);

    // --- Rumble ---
    if (this._rumble) {
      this._rumble.elapsed += dt;
      if (this._rumble.elapsed >= this._rumble.duration) {
        this._rumble = null;
      }
    }

    // --- Zoom pulses ---
    this._updateZoomPulses(dt);
    this._updateZoomModifier(dt);

    // --- Slow motion ---
    this._updateSlowMotion(dt);

    // --- Focus pull ---
    this._updateFocusPull(dt);
  }

  // ---------------------------------------------------------------------------
  // Getters - apply these to camera before rendering
  // ---------------------------------------------------------------------------

  /**
   * Combined shake offset from all active shakes + rumble.
   * @returns {{x: number, y: number}}
   */
  getShakeOffset() {
    return this._shakeOffset;
  }

  /**
   * Combined zoom modifier from all active zoom pulses + breathe.
   * @returns {number} Multiplier (1.0 = no change)
   */
  getZoomModifier() {
    return this._zoomModifier;
  }

  /**
   * Current time scale from slow motion effect.
   * @returns {number} Multiplier (1.0 = normal speed)
   */
  getTimeScale() {
    return this._timeScale;
  }

  /**
   * Current focus offset, or null if no focus pull is active.
   * @returns {{x: number, y: number}|null}
   */
  getFocusOffset() {
    return this._focusOffset;
  }

  /**
   * Whether the game is currently in a hitstop freeze.
   * @returns {boolean}
   */
  isHitstop() {
    return this._hitstopFrames > 0;
  }

  // ---------------------------------------------------------------------------
  // Convenience triggers for common game events
  // ---------------------------------------------------------------------------

  /** Small satisfying shake + zoom pulse on successful event */
  onEventComplete() {
    this.impactShake(1.5, 0.2);
    this.zoomPulse(0.02, 0.3);
  }

  /** Harder shake + slight zoom out on failure */
  onEventFail() {
    this.impactShake(2.5, 0.35);
    this.zoomPulse(-0.015, 0.4);
  }

  /** Zoom pulse that scales with combo count */
  onCombo(count) {
    const amount = Math.min(0.015 + count * 0.005, 0.05);
    const duration = Math.min(0.3 + count * 0.02, 0.5);
    this.zoomPulse(amount, duration);
    if (count >= 3) {
      this.hitstop(2);
    }
  }

  /** Start rumble when meter enters critical zone */
  onMeterCritical() {
    this.rumble(0.6, Infinity);
  }

  /** Stop rumble when meter returns to safe zone */
  onMeterSafe() {
    this._rumble = null;
  }

  /** Dramatic zoom pulse + brief slowmo on phase transition */
  onPhaseChange() {
    this.zoomPulse(0.04, 0.5);
    this.slowMotion(0.4, 0.6);
    this.hitstop(4);
  }

  /** Big shake + zoom out + slowmo on game over */
  onGameOver() {
    this.impactShake(3, 0.5);
    this.zoomPulse(-0.04, 0.8);
    this.slowMotion(0.3, 1.0);
    this.hitstop(6);
  }

  /** Gentle zoom pulse + brief slowmo on victory */
  onGameWin() {
    this.zoomPulse(0.03, 0.6);
    this.slowMotion(0.6, 0.8);
  }

  // ---------------------------------------------------------------------------
  // Internal update helpers
  // ---------------------------------------------------------------------------

  /** Advance shake timers, remove expired ones */
  _updateShakes(dt) {
    for (let i = this._shakes.length - 1; i >= 0; i--) {
      this._shakes[i].elapsed += dt;
      if (this._shakes[i].elapsed >= this._shakes[i].duration) {
        this._shakes.splice(i, 1);
      }
    }
  }

  /** Compute combined shake offset from all active shakes + rumble */
  _updateShakeOffset(_dt) {
    let x = 0;
    let y = 0;

    // Impact shakes: sin/cos with phase offsets, exponential decay
    for (const shake of this._shakes) {
      const t = shake.elapsed;
      const progress = t / shake.duration;
      // Exponential decay - fast falloff for snappy feel
      const decay = Math.exp(-progress * 4.0) * (1.0 - progress);
      const angle = t * shake.frequency;

      x += Math.sin(angle + shake.phaseX) * shake.intensity * decay;
      y += Math.cos(angle + shake.phaseY) * shake.intensity * decay;
    }

    // Rumble: low-frequency continuous shake
    if (this._rumble) {
      const rt = this._rumble.elapsed;
      const freq = this._rumble.frequency * Math.PI * 2;
      // Use two slightly different frequencies for organic movement
      x += Math.sin(rt * freq + this._rumble.phaseX) * this._rumble.intensity;
      y += Math.cos(rt * freq * 1.3 + this._rumble.phaseY) * this._rumble.intensity * 0.7;
    }

    // Round to whole pixels for pixel-art crispness
    this._shakeOffset.x = Math.round(x);
    this._shakeOffset.y = Math.round(y);
  }

  /** Advance zoom pulse timers, remove expired ones */
  _updateZoomPulses(dt) {
    for (let i = this._zoomPulses.length - 1; i >= 0; i--) {
      this._zoomPulses[i].elapsed += dt;
      if (this._zoomPulses[i].elapsed >= this._zoomPulses[i].duration) {
        this._zoomPulses.splice(i, 1);
      }
    }
  }

  /** Compute combined zoom modifier from all zoom pulses + breathe */
  _updateZoomModifier(_dt) {
    let zoom = 1.0;

    // Zoom pulses: damped spring physics
    for (const pulse of this._zoomPulses) {
      const t = pulse.elapsed;
      const progress = t / pulse.duration;
      // Damped spring: e^(-d*t) * sin(f*t)
      const spring =
        Math.exp(-pulse.damping * progress) *
        Math.sin(pulse.frequency * t) *
        pulse.amount;
      zoom *= 1.0 + spring;
    }

    // Breathe: continuous subtle oscillation
    if (this._breathe) {
      const wave = Math.sin(this._clock * this._breathe.frequency * Math.PI * 2);
      zoom *= 1.0 + wave * this._breathe.amplitude;
    }

    this._zoomModifier = zoom;
  }

  /** Update slow motion ramp in/hold/ramp out */
  _updateSlowMotion(dt) {
    if (!this._slowMotion) {
      // Smoothly return to 1.0 if no active effect
      this._timeScale += (1.0 - this._timeScale) * Math.min(1.0, dt * 15);
      if (Math.abs(this._timeScale - 1.0) < 0.001) {
        this._timeScale = 1.0;
      }
      return;
    }

    const sm = this._slowMotion;
    sm.elapsed += dt;

    const rampIn = sm.rampTime;
    const holdEnd = sm.duration - sm.rampTime;
    const total = sm.duration;

    if (sm.elapsed >= total) {
      // Effect finished
      this._slowMotion = null;
      return;
    }

    let target;
    if (sm.elapsed < rampIn) {
      // Ramp in: ease-in-out from 1.0 to target factor
      const t = sm.elapsed / rampIn;
      const ease = t * t * (3.0 - 2.0 * t); // smoothstep
      target = 1.0 + (sm.targetFactor - 1.0) * ease;
    } else if (sm.elapsed < holdEnd) {
      // Hold at target factor
      target = sm.targetFactor;
    } else {
      // Ramp out: ease-in-out from target factor back to 1.0
      const t = (sm.elapsed - holdEnd) / sm.rampTime;
      const ease = t * t * (3.0 - 2.0 * t); // smoothstep
      target = sm.targetFactor + (1.0 - sm.targetFactor) * ease;
    }

    this._timeScale = target;
  }

  /** Update focus pull: lerp to target, hold, lerp back */
  _updateFocusPull(dt) {
    if (!this._focusPull) {
      this._focusOffset = null;
      return;
    }

    const fp = this._focusPull;
    fp.elapsed += dt;

    if (fp.elapsed >= fp.duration) {
      this._focusPull = null;
      this._focusOffset = null;
      return;
    }

    let lerpFactor;

    if (fp.elapsed < fp.travelIn) {
      // Travel to target: smooth ease-out
      const t = fp.elapsed / fp.travelIn;
      lerpFactor = 1.0 - (1.0 - t) * (1.0 - t); // ease-out quadratic
    } else if (fp.elapsed < fp.travelIn + fp.hold) {
      // Hold at target
      lerpFactor = 1.0;
    } else {
      // Travel back: smooth ease-in
      const t = (fp.elapsed - fp.travelIn - fp.hold) / fp.travelOut;
      lerpFactor = 1.0 - t * t; // ease-in quadratic (inverted)
    }

    this._focusOffset = {
      x: fp.targetX * lerpFactor,
      y: fp.targetY * lerpFactor,
    };
  }
}
