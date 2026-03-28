/**
 * Procedural audio using Web Audio API.
 * All sounds generated — no audio files needed.
 */

let audioCtx = null;
let muted = false;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (iOS requires user gesture)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function tone(freq, duration, type = 'square', volume = 0.04, delay = 0) {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  } catch (e) {
    // Audio not available
  }
}

// UI click / card tap
export function playClick() {
  tone(900, 0.04, 'square', 0.03);
}

// New event card appears
export function playEventSpawn() {
  tone(440, 0.08, 'triangle', 0.04);
  tone(550, 0.06, 'triangle', 0.03, 0.06);
}

// Escalated event returns
export function playEscalation() {
  tone(200, 0.15, 'sawtooth', 0.04);
  tone(180, 0.2, 'sawtooth', 0.03, 0.12);
}

// Pharmacist starts walking to station
export function playDispatch() {
  tone(660, 0.06, 'square', 0.025);
  tone(880, 0.06, 'square', 0.02, 0.05);
}

// Work completed successfully
export function playComplete() {
  tone(523, 0.08, 'triangle', 0.04);
  tone(659, 0.08, 'triangle', 0.04, 0.08);
  tone(784, 0.12, 'triangle', 0.05, 0.16);
}

// Defer an event
export function playDefer() {
  tone(400, 0.1, 'square', 0.03);
  tone(300, 0.15, 'square', 0.03, 0.08);
}

// Phone ringing
export function playPhoneRing() {
  tone(1200, 0.08, 'sine', 0.03);
  tone(1000, 0.08, 'sine', 0.03, 0.1);
  tone(1200, 0.08, 'sine', 0.03, 0.25);
  tone(1000, 0.08, 'sine', 0.03, 0.35);
}

// Meter warning pulse (meter > 75)
export function playMeterWarning() {
  tone(220, 0.2, 'sawtooth', 0.02);
}

// Phase change fanfare
export function playPhaseChange() {
  tone(440, 0.1, 'triangle', 0.035);
  tone(554, 0.1, 'triangle', 0.035, 0.1);
  tone(659, 0.15, 'triangle', 0.04, 0.2);
}

// Lunch starts — ominous
export function playLunchStart() {
  tone(220, 0.3, 'sine', 0.04);
  tone(200, 0.3, 'sine', 0.04, 0.25);
  tone(180, 0.4, 'sine', 0.04, 0.5);
}

// Reopen rush — alarm
export function playReopenRush() {
  for (let i = 0; i < 4; i++) {
    tone(800, 0.08, 'square', 0.04, i * 0.12);
    tone(1000, 0.08, 'square', 0.04, i * 0.12 + 0.06);
  }
}

// Game over
export function playGameOver() {
  tone(440, 0.2, 'sawtooth', 0.05);
  tone(350, 0.2, 'sawtooth', 0.05, 0.2);
  tone(280, 0.3, 'sawtooth', 0.05, 0.4);
  tone(220, 0.5, 'sawtooth', 0.04, 0.6);
}

// Game won
export function playWin() {
  tone(523, 0.1, 'triangle', 0.04);
  tone(659, 0.1, 'triangle', 0.04, 0.1);
  tone(784, 0.1, 'triangle', 0.04, 0.2);
  tone(1047, 0.25, 'triangle', 0.05, 0.3);
}

// Patient bark / speech bubble appears
export function playBark() {
  tone(600, 0.03, 'square', 0.015);
}

// Doorbell chime — when patient enters store
export function playDoorbell() {
  tone(1047, 0.12, 'sine', 0.025);
  tone(1319, 0.12, 'sine', 0.025, 0.1);
}

// Cash register ding — on serve patient
export function playRegisterDing() {
  tone(2000, 0.06, 'sine', 0.03);
  tone(2500, 0.1, 'sine', 0.025, 0.05);
}

// Paper shuffle — on verify script
export function playPaperShuffle() {
  // White noise burst simulated with rapid tones
  for (let i = 0; i < 3; i++) {
    tone(200 + Math.random() * 300, 0.02, 'sawtooth', 0.008, i * 0.03);
  }
}

// Positive event — cheerful ping
export function playPositiveEvent() {
  tone(880, 0.08, 'sine', 0.03);
  tone(1100, 0.08, 'sine', 0.03, 0.06);
  tone(1320, 0.12, 'sine', 0.035, 0.12);
}

// Combo chain — ascending arpeggio
export function playCombo(count) {
  const baseFreq = 600 + Math.min(count, 8) * 80;
  tone(baseFreq, 0.06, 'triangle', 0.035);
  tone(baseFreq * 1.25, 0.06, 'triangle', 0.035, 0.05);
  tone(baseFreq * 1.5, 0.1, 'triangle', 0.04, 0.1);
}

// Rush start — urgent quick burst
export function playRush() {
  tone(800, 0.04, 'sawtooth', 0.03);
  tone(1000, 0.04, 'sawtooth', 0.03, 0.03);
  tone(1200, 0.06, 'sawtooth', 0.035, 0.06);
}

// Ambient pharmacy hum — continuous low drone
let ambientOsc = null;
let ambientGain = null;

export function startAmbient() {
  if (muted) return;
  try {
    const ctx = getCtx();
    ambientOsc = ctx.createOscillator();
    ambientGain = ctx.createGain();
    ambientOsc.connect(ambientGain);
    ambientGain.connect(ctx.destination);
    ambientOsc.type = 'sine';
    ambientOsc.frequency.value = 60;
    ambientGain.gain.value = 0.008;
    ambientOsc.start();
  } catch (e) {
    // Audio not available
  }
}

export function stopAmbient() {
  try {
    if (ambientOsc) {
      ambientOsc.stop();
      ambientOsc = null;
    }
  } catch (e) {
    // Already stopped
  }
}

// Footstep — soft tap
let lastFootstepTime = 0;
export function playFootstep() {
  const now = Date.now();
  if (now - lastFootstepTime < 180) return; // Throttle
  lastFootstepTime = now;
  tone(100 + Math.random() * 60, 0.03, 'sine', 0.012);
}

// Patient storm-out — angry stomp
export function playStormOut() {
  tone(150, 0.08, 'sawtooth', 0.03);
  tone(120, 0.1, 'sawtooth', 0.03, 0.08);
}

// Gate close / open — metal rattling
export function playGateClose() {
  for (let i = 0; i < 6; i++) {
    tone(100 + Math.random() * 80, 0.05, 'sawtooth', 0.015, i * 0.06);
  }
  tone(80, 0.3, 'sine', 0.02, 0.35);
}

export function playGateOpen() {
  for (let i = 0; i < 4; i++) {
    tone(120 + Math.random() * 60, 0.04, 'sawtooth', 0.012, i * 0.07);
  }
}

// Mute toggle
export function toggleMute() {
  muted = !muted;
  if (muted && ambientOsc) {
    try { ambientGain.gain.value = 0; } catch (e) {}
  } else if (!muted && ambientGain) {
    try { ambientGain.gain.value = 0.008; } catch (e) {}
  }
  return muted;
}

export function isMuted() {
  return muted;
}
