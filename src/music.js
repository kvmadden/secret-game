/**
 * Procedural Stardew Valley-style background music system.
 * All music generated via Web Audio API — no audio file imports.
 *
 * Warm, cozy aesthetic: triangle waves for melody (acoustic guitar feel),
 * sine waves for bass and pads, gentle envelopes for soft attack/release.
 * Capped at 4 simultaneous voices.
 */

// ── Note frequencies (octave 3-5) ──────────────────────────────
const NOTE_FREQ = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
  A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  A5: 880.00, B5: 987.77,
};

// ── Chord definitions (as arrays of note names) ────────────────
const CHORDS = {
  // C major family
  C:    ['C3', 'E4', 'G4'],
  Dm:   ['D3', 'F4', 'A4'],
  Em:   ['E3', 'G4', 'B4'],
  F:    ['F3', 'A4', 'C5'],
  G:    ['G3', 'B4', 'D5'],
  Am:   ['A3', 'C4', 'E4'],
  // Extra voicings
  C7:   ['C3', 'E4', 'B4'],
  G7:   ['G3', 'B4', 'F4'],
  Fmaj7:['F3', 'A4', 'E5'],
};

// ── Pentatonic scales for melody generation ────────────────────
const SCALE_C_MAJOR_PENTA = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'];
const SCALE_A_MINOR_PENTA = ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5'];

// ── Phase configurations ───────────────────────────────────────
const PHASE_CONFIG = {
  OPENING: {
    bpm: 90,
    key: 'major',
    progression: ['C', 'G', 'Am', 'F'],
    scale: SCALE_C_MAJOR_PENTA,
    melodyDensity: 0.5,     // fraction of beats with melody notes
    bassVolume: 0.025,
    melodyVolume: 0.03,
    chordVolume: 0.015,
    percVolume: 0.008,
    swingAmount: 0.02,      // gentle swing feel
    useEighths: false,
    description: 'gentle hopeful morning',
  },
  BUILDING: {
    bpm: 108,
    key: 'major',
    progression: ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C'],
    scale: SCALE_C_MAJOR_PENTA,
    melodyDensity: 0.65,
    bassVolume: 0.028,
    melodyVolume: 0.032,
    chordVolume: 0.018,
    percVolume: 0.01,
    swingAmount: 0.015,
    useEighths: true,
    description: 'slightly more energetic',
  },
  LUNCH_CLOSE: {
    bpm: 80,
    key: 'minor',
    progression: ['Am', 'Dm', 'Em', 'Am'],
    scale: SCALE_A_MINOR_PENTA,
    melodyDensity: 0.35,
    bassVolume: 0.03,
    melodyVolume: 0.025,
    chordVolume: 0.02,
    percVolume: 0.006,
    swingAmount: 0.0,
    useEighths: false,
    description: 'ominous tense',
  },
  REOPEN_RUSH: {
    bpm: 120,
    key: 'minor',
    progression: ['Am', 'G', 'F', 'Em', 'Am', 'G', 'F', 'G'],
    scale: SCALE_A_MINOR_PENTA,
    melodyDensity: 0.75,
    bassVolume: 0.03,
    melodyVolume: 0.035,
    chordVolume: 0.02,
    percVolume: 0.015,
    swingAmount: 0.0,
    useEighths: true,
    description: 'urgent faster',
  },
  LATE_DRAG: {
    bpm: 76,
    key: 'major',
    progression: ['C', 'Am', 'F', 'G7'],
    scale: SCALE_C_MAJOR_PENTA,
    melodyDensity: 0.3,
    bassVolume: 0.02,
    melodyVolume: 0.022,
    chordVolume: 0.012,
    percVolume: 0.004,
    swingAmount: 0.025,
    useEighths: false,
    description: 'tired winding down',
  },
};

// ── Deterministic-ish seeded random for repeatable melodies ────
function seededRandom(seed) {
  let s = seed | 0;
  return function () {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ── MusicSystem class ──────────────────────────────────────────
export class MusicSystem {
  constructor() {
    /** @type {AudioContext|null} */
    this._ctx = null;
    /** @type {GainNode|null} */
    this._masterGain = null;

    this._phase = null;
    this._playing = false;
    this._muted = false;
    this._volume = 1.0;

    // Scheduling state
    this._schedulerTimer = null;
    this._nextBeatTime = 0;
    this._beatIndex = 0;
    this._activeVoices = [];   // track active oscillator nodes for cleanup
    this._melodySeed = 42;
    this._rand = seededRandom(42);

    // Crossfade state
    this._fadeGainCurrent = null;
    this._fadeGainNext = null;
    this._crossfading = false;

    // Lookahead scheduling constants
    this._scheduleAhead = 0.15;  // seconds to look ahead
    this._schedulerInterval = 80; // ms between scheduler calls
  }

  // ── Audio context (lazy, handles iOS suspension) ─────────────
  _ensureCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = this._muted ? 0 : this._volume;
      this._masterGain.connect(this._ctx.destination);
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._ctx;
  }

  // ── Public API ───────────────────────────────────────────────

  /** Begin playing music for the given phase. */
  start(phase) {
    const cfg = PHASE_CONFIG[phase];
    if (!cfg) return;

    this._ensureCtx();
    this._phase = phase;
    this._playing = true;
    this._beatIndex = 0;
    this._melodySeed = Math.floor(Math.random() * 10000);
    this._rand = seededRandom(this._melodySeed);
    this._nextBeatTime = this._ctx.currentTime + 0.1;

    // Create a gain node for this phase's layer
    this._fadeGainCurrent = this._ctx.createGain();
    this._fadeGainCurrent.gain.value = 1.0;
    this._fadeGainCurrent.connect(this._masterGain);

    this._startScheduler();
  }

  /** Transition to a new phase with crossfade. */
  setPhase(phase) {
    if (!this._playing) {
      this.start(phase);
      return;
    }
    if (phase === this._phase) return;

    const cfg = PHASE_CONFIG[phase];
    if (!cfg) return;

    this._ensureCtx();
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const fadeDuration = 2.0;

    // Fade out current layer
    if (this._fadeGainCurrent) {
      const oldGain = this._fadeGainCurrent;
      oldGain.gain.setValueAtTime(oldGain.gain.value, now);
      oldGain.gain.linearRampToValueAtTime(0, now + fadeDuration);
      // Disconnect old layer after fade completes
      setTimeout(() => {
        try { oldGain.disconnect(); } catch (_) { /* already disconnected */ }
      }, (fadeDuration + 0.5) * 1000);
    }

    // Stop current scheduler
    this._stopScheduler();

    // Set up new phase
    this._phase = phase;
    this._beatIndex = 0;
    this._melodySeed = Math.floor(Math.random() * 10000);
    this._rand = seededRandom(this._melodySeed);
    this._nextBeatTime = ctx.currentTime + 0.05;

    // New gain layer, fade in
    this._fadeGainCurrent = ctx.createGain();
    this._fadeGainCurrent.gain.setValueAtTime(0, now);
    this._fadeGainCurrent.gain.linearRampToValueAtTime(1.0, now + fadeDuration);
    this._fadeGainCurrent.connect(this._masterGain);

    this._startScheduler();
  }

  /** Fade out and stop all music. */
  stop() {
    if (!this._playing) return;
    this._playing = false;
    this._stopScheduler();

    if (this._fadeGainCurrent && this._ctx) {
      const now = this._ctx.currentTime;
      const g = this._fadeGainCurrent;
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0, now + 1.0);
      setTimeout(() => {
        try { g.disconnect(); } catch (_) { /* ok */ }
      }, 1500);
    }

    // Clean up active voices
    for (const v of this._activeVoices) {
      try { v.stop(); } catch (_) { /* already stopped */ }
    }
    this._activeVoices = [];
  }

  /** Set master volume (0-1). */
  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._masterGain && this._ctx && !this._muted) {
      const ctx = this._ctx;
      this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, ctx.currentTime);
      this._masterGain.gain.linearRampToValueAtTime(this._volume, ctx.currentTime + 0.1);
    }
  }

  /** Toggle mute on/off. */
  toggleMute() {
    this._muted = !this._muted;
    if (this._masterGain && this._ctx) {
      const now = this._ctx.currentTime;
      this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, now);
      this._masterGain.gain.linearRampToValueAtTime(
        this._muted ? 0 : this._volume, now + 0.05
      );
    }
  }

  /** Returns true if muted. */
  isMuted() {
    return this._muted;
  }

  // ── Scheduler ────────────────────────────────────────────────

  _startScheduler() {
    this._stopScheduler();
    this._schedulerTimer = setInterval(() => this._schedule(), this._schedulerInterval);
  }

  _stopScheduler() {
    if (this._schedulerTimer !== null) {
      clearInterval(this._schedulerTimer);
      this._schedulerTimer = null;
    }
  }

  /**
   * Lookahead scheduler — schedules notes slightly ahead of real time
   * to avoid timing jitter from setInterval.
   */
  _schedule() {
    if (!this._playing || !this._ctx) return;

    const cfg = PHASE_CONFIG[this._phase];
    if (!cfg) return;

    const beatDuration = 60.0 / cfg.bpm;

    // Prune finished voices (keep list bounded)
    const now = this._ctx.currentTime;
    this._activeVoices = this._activeVoices.filter(v => {
      try {
        // Oscillators that have ended throw on access; filter them
        return v._endTime > now;
      } catch (_) {
        return false;
      }
    });

    while (this._nextBeatTime < now + this._scheduleAhead) {
      this._scheduleBeat(this._nextBeatTime, this._beatIndex, cfg, beatDuration);
      this._nextBeatTime += beatDuration;
      this._beatIndex++;
    }
  }

  // ── Beat scheduling ──────────────────────────────────────────

  _scheduleBeat(time, beatIdx, cfg, beatDur) {
    const progLen = cfg.progression.length;
    // Each chord lasts 4 beats (one bar)
    const chordIdx = Math.floor(beatIdx / 4) % progLen;
    const chord = CHORDS[cfg.progression[chordIdx]];
    const beatInBar = beatIdx % 4;
    const bassNote = chord[0]; // root

    // Voice 1: Bass (plays on beat 1 and 3)
    if (beatInBar === 0 || beatInBar === 2) {
      this._playBass(time, bassNote, beatDur * 1.8, cfg.bassVolume);
    }

    // Voice 2: Chord pad (plays on beat 1, gentle strum on beat 3)
    if (beatInBar === 0) {
      this._playChordPad(time, chord, beatDur * 3.5, cfg.chordVolume);
    } else if (beatInBar === 2) {
      this._playChordPad(time, chord, beatDur * 1.5, cfg.chordVolume * 0.6);
    }

    // Voice 3: Melody (pentatonic, guided by chord tones)
    if (this._rand() < cfg.melodyDensity) {
      const note = this._pickMelodyNote(cfg.scale, chord);
      const dur = cfg.useEighths && this._rand() > 0.5
        ? beatDur * 0.45
        : beatDur * 0.8;
      this._playMelody(time + cfg.swingAmount * (beatInBar % 2), note, dur, cfg.melodyVolume);
    }

    // Eighth note melody pass (for BUILDING and REOPEN_RUSH)
    if (cfg.useEighths && this._rand() < cfg.melodyDensity * 0.4) {
      const note2 = this._pickMelodyNote(cfg.scale, chord);
      this._playMelody(time + beatDur * 0.5, note2, beatDur * 0.35, cfg.melodyVolume * 0.7);
    }

    // Voice 4: Percussion (soft pulse)
    this._playPerc(time, beatInBar, cfg.percVolume, beatDur);
  }

  // ── Pick a melody note biased toward chord tones ─────────────
  _pickMelodyNote(scale, chord) {
    const r = this._rand();
    if (r < 0.45) {
      // Pick a chord tone that exists in our frequency table
      const ct = chord[1 + Math.floor(this._rand() * (chord.length - 1))];
      return ct;
    }
    // Pick from pentatonic scale
    return scale[Math.floor(this._rand() * scale.length)];
  }

  // ── Voice: Bass (sine wave, warm low tone) ───────────────────
  _playBass(time, note, duration, volume) {
    if (!this._fadeGainCurrent) return;
    const ctx = this._ctx;
    const freq = NOTE_FREQ[note];
    if (!freq) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this._fadeGainCurrent);

    // Soft attack, sustained, gentle release
    const attack = 0.08;
    const release = Math.min(duration * 0.4, 0.3);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + attack);
    gain.gain.setValueAtTime(volume, time + duration - release);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    osc.stop(time + duration + 0.01);
    osc._endTime = time + duration + 0.01;
    this._activeVoices.push(osc);
  }

  // ── Voice: Chord pad (triangle wave, acoustic guitar feel) ───
  _playChordPad(time, chord, duration, volume) {
    if (!this._fadeGainCurrent) return;
    const ctx = this._ctx;

    // Stagger notes slightly for a gentle strum effect
    for (let i = 1; i < chord.length; i++) {
      const freq = NOTE_FREQ[chord[i]];
      if (!freq) continue;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;
      // Slight detune for warmth
      osc.detune.value = (Math.random() - 0.5) * 6;
      osc.connect(gain);
      gain.connect(this._fadeGainCurrent);

      const strum = i * 0.03; // 30ms between strum notes
      const attack = 0.06;
      const release = Math.min(duration * 0.35, 0.4);
      const noteStart = time + strum;
      const noteEnd = noteStart + duration;

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.exponentialRampToValueAtTime(volume, noteStart + attack);
      gain.gain.setValueAtTime(volume * 0.8, noteEnd - release);
      gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

      osc.start(noteStart);
      osc.stop(noteEnd + 0.01);
      osc._endTime = noteEnd + 0.01;
      this._activeVoices.push(osc);
    }
  }

  // ── Voice: Melody (sine + triangle blend, piano-like) ────────
  _playMelody(time, note, duration, volume) {
    if (!this._fadeGainCurrent) return;
    const ctx = this._ctx;
    const freq = NOTE_FREQ[note];
    if (!freq) return;

    // Primary: sine wave for warmth
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    osc1.connect(gain1);
    gain1.connect(this._fadeGainCurrent);

    // Secondary: triangle wave an octave up, very quiet, for shimmer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;
    osc2.connect(gain2);
    gain2.connect(this._fadeGainCurrent);

    const attack = 0.03;
    const decay = 0.08;
    const sustain = volume * 0.65;
    const release = Math.min(duration * 0.4, 0.25);

    // ADSR for primary
    gain1.gain.setValueAtTime(0.001, time);
    gain1.gain.exponentialRampToValueAtTime(volume, time + attack);
    gain1.gain.exponentialRampToValueAtTime(sustain, time + attack + decay);
    gain1.gain.setValueAtTime(sustain, time + duration - release);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + duration);

    // Shimmer layer (much quieter)
    const shimVol = volume * 0.2;
    gain2.gain.setValueAtTime(0.001, time);
    gain2.gain.exponentialRampToValueAtTime(shimVol, time + attack);
    gain2.gain.exponentialRampToValueAtTime(shimVol * 0.5, time + attack + decay);
    gain2.gain.setValueAtTime(shimVol * 0.5, time + duration - release);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.start(time);
    osc1.stop(time + duration + 0.01);
    osc1._endTime = time + duration + 0.01;

    osc2.start(time);
    osc2.stop(time + duration + 0.01);
    osc2._endTime = time + duration + 0.01;

    this._activeVoices.push(osc1, osc2);
  }

  // ── Voice: Percussion (soft pulse, no harsh clicks) ──────────
  _playPerc(time, beatInBar, volume, beatDur) {
    if (!this._fadeGainCurrent) return;
    if (volume <= 0.001) return;
    const ctx = this._ctx;

    // Beat 0: low thud (kick-like)
    if (beatInBar === 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);
      osc.connect(gain);
      gain.connect(this._fadeGainCurrent);

      gain.gain.setValueAtTime(volume * 1.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.start(time);
      osc.stop(time + 0.2);
      osc._endTime = time + 0.2;
      this._activeVoices.push(osc);
    }

    // Beat 2: softer thud
    if (beatInBar === 2) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);
      osc.connect(gain);
      gain.connect(this._fadeGainCurrent);

      gain.gain.setValueAtTime(volume * 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.start(time);
      osc.stop(time + 0.15);
      osc._endTime = time + 0.15;
      this._activeVoices.push(osc);
    }

    // Off-beats: high-frequency tick (hi-hat-like, using filtered square)
    if (beatInBar === 1 || beatInBar === 3) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 6000 + Math.random() * 2000;
      osc.connect(gain);
      gain.connect(this._fadeGainCurrent);

      gain.gain.setValueAtTime(volume * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

      osc.start(time);
      osc.stop(time + 0.03);
      osc._endTime = time + 0.03;
      this._activeVoices.push(osc);
    }
  }
}
