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

// --- Helper: noise burst (white noise via rapid random-freq sawtooth) ---
function noiseBurst(duration, volume = 0.01, delay = 0) {
  if (muted) return;
  try {
    const ctx = getCtx();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    source.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    source.start(t);
    source.stop(t + duration);
  } catch (e) {
    // Audio not available
  }
}

// --- Helper: filtered noise burst with bandpass ---
function filteredNoise(duration, freq, Q, volume = 0.01, delay = 0) {
  if (muted) return;
  try {
    const ctx = getCtx();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = Q;
    const gain = ctx.createGain();
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    source.start(t);
    source.stop(t + duration);
  } catch (e) {
    // Audio not available
  }
}

// Typing on keyboard — rapid soft clicks
export function playTyping(count) {
  if (muted) return;
  const n = Math.max(3, Math.min(8, count || 5));
  for (let i = 0; i < n; i++) {
    const pitch = 3000 + Math.random() * 1500;
    const d = i * (0.04 + Math.random() * 0.02);
    tone(pitch, 0.015, 'square', 0.012, d);
    tone(pitch * 0.7, 0.01, 'sine', 0.008, d);
    filteredNoise(0.01, 4000, 2, 0.006, d);
  }
}

// Pill counting — small metallic rattling clicks
export function playPillCount() {
  if (muted) return;
  const pills = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < pills; i++) {
    const d = i * (0.06 + Math.random() * 0.03);
    tone(5000 + Math.random() * 2000, 0.008, 'sine', 0.015, d);
    tone(3500 + Math.random() * 1000, 0.006, 'triangle', 0.01, d + 0.002);
    tone(7000 + Math.random() * 1000, 0.005, 'sine', 0.008, d);
  }
}

// Bag rustling — paper/plastic crinkle
export function playBagRustle() {
  if (muted) return;
  for (let i = 0; i < 4; i++) {
    const d = i * 0.04;
    noiseBurst(0.03 + Math.random() * 0.02, 0.015, d);
    filteredNoise(0.04, 2000 + Math.random() * 3000, 1.5, 0.01, d);
  }
  noiseBurst(0.06, 0.008, 0.18);
}

// Receipt printing — mechanical whirr + paper feed
export function playReceiptPrint() {
  if (muted) return;
  try {
    const ctx = getCtx();
    // Low mechanical whirr
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.value = 80;
    const t = ctx.currentTime;
    gain1.gain.setValueAtTime(0.02, t);
    gain1.gain.setValueAtTime(0.02, t + 0.4);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc1.start(t);
    osc1.stop(t + 0.5);

    // Second harmonic layer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sawtooth';
    osc2.frequency.value = 160;
    gain2.gain.setValueAtTime(0.008, t);
    gain2.gain.setValueAtTime(0.008, t + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc2.start(t);
    osc2.stop(t + 0.5);
  } catch (e) {
    // Audio not available
  }
  // Paper feed noise bursts
  for (let i = 0; i < 6; i++) {
    filteredNoise(0.05, 3000 + Math.random() * 2000, 1, 0.008, i * 0.07);
  }
  // Final tear
  noiseBurst(0.04, 0.02, 0.45);
}

// Door swoosh — automatic door opening
export function playDoorSwoosh() {
  if (muted) return;
  try {
    const ctx = getCtx();
    // Whoosh: descending filtered noise
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
    gain.gain.setValueAtTime(0.015, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);

    // Airy layer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(300, t);
    osc2.frequency.exponentialRampToValueAtTime(60, t + 0.3);
    gain2.gain.setValueAtTime(0.02, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc2.start(t);
    osc2.stop(t + 0.35);
  } catch (e) {
    // Audio not available
  }
  noiseBurst(0.2, 0.01);
}

// PA announcement tone — the ding before an announcement
export function playPATone() {
  if (muted) return;
  // Two-tone chime like a store PA system
  tone(830, 0.25, 'sine', 0.03);
  tone(1245, 0.25, 'sine', 0.025, 0.01);
  tone(622, 0.35, 'sine', 0.02, 0.28);
  // Gentle shimmer layer
  tone(830, 0.25, 'triangle', 0.01);
}

// Coin drop — payment transaction
export function playCoinDrop() {
  if (muted) return;
  // Primary metallic ring
  tone(4200, 0.08, 'sine', 0.025);
  tone(3800, 0.06, 'sine', 0.02, 0.01);
  // Bounce hits
  tone(4500, 0.04, 'sine', 0.018, 0.1);
  tone(4800, 0.03, 'sine', 0.012, 0.16);
  // Settling vibration
  tone(3600, 0.02, 'triangle', 0.008, 0.2);
}

// Scanner beep — barcode scan
export function playScannerBeep() {
  if (muted) return;
  tone(2400, 0.1, 'sine', 0.03);
  tone(2400, 0.1, 'square', 0.01);
  tone(2400, 0.1, 'triangle', 0.015);
  // Short confirmation blip
  tone(3200, 0.03, 'sine', 0.02, 0.12);
}

// Fridge open — cold hiss + seal break
export function playFridgeOpen() {
  if (muted) return;
  // Seal pop
  tone(300, 0.04, 'square', 0.025);
  tone(150, 0.03, 'sine', 0.015);
  // Cold air hiss
  noiseBurst(0.15, 0.012, 0.03);
  filteredNoise(0.2, 5000, 0.5, 0.008, 0.03);
  // Hum ramp up
  tone(60, 0.3, 'sine', 0.01, 0.05);
}

// Fridge close — thud + seal compression
export function playFridgeClose() {
  if (muted) return;
  // Heavy thud
  tone(80, 0.08, 'sine', 0.03);
  tone(60, 0.1, 'sine', 0.02, 0.01);
  // Seal compression
  tone(200, 0.04, 'square', 0.012, 0.05);
  // Rattle
  tone(150 + Math.random() * 50, 0.03, 'triangle', 0.008, 0.08);
}

// Keyboard tap — single key press on computer
export function playKeyTap() {
  if (muted) return;
  const pitch = 3200 + Math.random() * 800;
  tone(pitch, 0.012, 'square', 0.015);
  tone(pitch * 0.6, 0.008, 'sine', 0.008, 0.002);
  filteredNoise(0.008, 4000, 3, 0.006);
}

// Stamp — ink stamp on prescription
export function playStamp() {
  if (muted) return;
  // Impact thud
  tone(120, 0.06, 'sine', 0.035);
  tone(80, 0.08, 'sine', 0.025, 0.01);
  // Surface slap texture
  noiseBurst(0.03, 0.02);
  // Slight ink squish
  filteredNoise(0.04, 800, 2, 0.008, 0.03);
  tone(200, 0.03, 'triangle', 0.01, 0.02);
}

// Drawer open — cash drawer or filing
export function playDrawerOpen() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    const t = ctx.currentTime;
    // Sliding friction: rising pitch
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(250, t + 0.15);
    gain.gain.setValueAtTime(0.015, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.2);
  } catch (e) {
    // Audio not available
  }
  // Rail rattle
  for (let i = 0; i < 3; i++) {
    tone(180 + Math.random() * 80, 0.02, 'square', 0.008, i * 0.05);
  }
  // Stop thump
  tone(90, 0.05, 'sine', 0.02, 0.18);
}

// Drawer close — cash drawer or filing
export function playDrawerClose() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    const t = ctx.currentTime;
    // Sliding friction: descending pitch
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.12);
    gain.gain.setValueAtTime(0.015, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch (e) {
    // Audio not available
  }
  // Slam
  tone(70, 0.08, 'sine', 0.03, 0.12);
  tone(50, 0.06, 'sine', 0.02, 0.13);
  // Latch click
  tone(2000, 0.01, 'square', 0.015, 0.16);
}

// Velcro — blood pressure cuff
export function playVelcro() {
  if (muted) return;
  // Rapid crackle of velcro tearing
  for (let i = 0; i < 12; i++) {
    const d = i * 0.015;
    filteredNoise(0.012, 3000 + Math.random() * 4000, 1, 0.012, d);
    noiseBurst(0.008, 0.006, d + 0.005);
  }
  // Trailing crinkle
  for (let i = 0; i < 4; i++) {
    filteredNoise(0.02, 2000 + Math.random() * 2000, 2, 0.006, 0.18 + i * 0.03);
  }
}

// Water cooler gurgle
export function playWaterCooler() {
  if (muted) return;
  try {
    const ctx = getCtx();
    // Bubbling: modulated low sine
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.value = 200;
    lfo.type = 'sine';
    lfo.frequency.value = 8;
    lfoGain.gain.value = 80;

    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.setValueAtTime(0.02, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 0.45);
    lfo.stop(t + 0.45);

    // Second bubble layer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.value = 350;
    gain2.gain.setValueAtTime(0.01, t + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc2.start(t + 0.1);
    osc2.stop(t + 0.35);
  } catch (e) {
    // Audio not available
  }
  // Gurgle pops
  for (let i = 0; i < 3; i++) {
    tone(250 + Math.random() * 150, 0.03, 'sine', 0.012, 0.05 + i * 0.1);
  }
}

// Cart wheels — shopping cart rolling
export function playCartWheels() {
  if (muted) return;
  try {
    const ctx = getCtx();
    // Rumble: low modulated oscillator
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.value = 80;
    lfo.type = 'sine';
    lfo.frequency.value = 12;
    lfoGain.gain.value = 30;

    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.015, t + 0.1);
    gain.gain.setValueAtTime(0.015, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 0.5);
    lfo.stop(t + 0.5);

    // Wheel rattle layer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sawtooth';
    osc2.frequency.value = 150;
    gain2.gain.setValueAtTime(0.001, t);
    gain2.gain.linearRampToValueAtTime(0.008, t + 0.1);
    gain2.gain.setValueAtTime(0.008, t + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc2.start(t);
    osc2.stop(t + 0.5);
  } catch (e) {
    // Audio not available
  }
  // Caster clicks
  for (let i = 0; i < 5; i++) {
    tone(300 + Math.random() * 100, 0.01, 'square', 0.005, i * 0.08 + Math.random() * 0.02);
  }
}

// Success jingle — achievement unlock (longer, more musical)
export function playAchievementUnlock() {
  if (muted) return;
  // C major arpeggio with sparkle
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    tone(freq, 0.15, 'sine', 0.03, i * 0.08);
    tone(freq, 0.15, 'triangle', 0.015, i * 0.08);
  });
  // Final shimmer chord
  tone(1047, 0.4, 'sine', 0.025, 0.45);
  tone(1319, 0.4, 'sine', 0.02, 0.45);
  tone(1568, 0.5, 'sine', 0.02, 0.45);
  // Sparkle texture
  for (let i = 0; i < 6; i++) {
    tone(2000 + Math.random() * 3000, 0.03, 'sine', 0.008, 0.45 + i * 0.06);
  }
}

// Combo escalation — each combo level gets more triumphant
export function playComboEscalation(level) {
  if (muted) return;
  const lv = Math.max(1, Math.min(10, level || 1));
  // Base note rises with level
  const base = 400 + lv * 60;
  const vol = 0.015 + lv * 0.002;
  const noteCount = Math.min(2 + lv, 8);

  for (let i = 0; i < noteCount; i++) {
    const freq = base * Math.pow(1.25, i / 2);
    const d = i * (0.06 - lv * 0.002);
    tone(freq, 0.08 + lv * 0.01, 'triangle', Math.min(vol, 0.04), Math.max(d, i * 0.02));
    // Harmony layer at higher levels
    if (lv >= 4) {
      tone(freq * 1.5, 0.06, 'sine', vol * 0.5, Math.max(d, i * 0.02));
    }
  }
  // Sparkle flourish at high levels
  if (lv >= 7) {
    for (let i = 0; i < lv - 4; i++) {
      tone(3000 + Math.random() * 2000, 0.02, 'sine', 0.008, 0.3 + i * 0.04);
    }
  }
}

// Stress heartbeat — low thumping that speeds up with stress
export function playHeartbeat(stress) {
  if (muted) return;
  const s = Math.max(0, Math.min(1, stress || 0));
  const vol = 0.01 + s * 0.025;
  // Double-thump heartbeat (lub-dub)
  // Lub (louder)
  tone(50, 0.08, 'sine', vol);
  tone(40, 0.1, 'sine', vol * 0.8, 0.01);
  // Dub (softer, slightly delayed)
  const dubDelay = 0.12 - s * 0.04;
  tone(60, 0.06, 'sine', vol * 0.6, dubDelay);
  tone(45, 0.07, 'sine', vol * 0.5, dubDelay + 0.01);
  // Sub-bass body
  tone(30, 0.12, 'sine', vol * 0.4);
}

// Rain on roof — continuous ambient for rainy weather
let rainNoiseSource = null;
let rainGainNode = null;
let rainFilterNode = null;
let rainInterval = null;

export function startRainAmbient() {
  if (muted) return;
  if (rainNoiseSource) return; // Already running
  try {
    const ctx = getCtx();
    // Create looping noise buffer for rain
    const bufferLen = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferLen; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    rainNoiseSource = ctx.createBufferSource();
    rainNoiseSource.buffer = buffer;
    rainNoiseSource.loop = true;

    rainFilterNode = ctx.createBiquadFilter();
    rainFilterNode.type = 'lowpass';
    rainFilterNode.frequency.value = 3000;
    rainFilterNode.Q.value = 0.5;

    rainGainNode = ctx.createGain();
    rainGainNode.gain.value = 0.012;

    rainNoiseSource.connect(rainFilterNode);
    rainFilterNode.connect(rainGainNode);
    rainGainNode.connect(ctx.destination);
    rainNoiseSource.start();

    // Occasional drip accents
    rainInterval = setInterval(() => {
      if (muted) return;
      if (Math.random() < 0.3) {
        tone(2000 + Math.random() * 2000, 0.01, 'sine', 0.006);
      }
    }, 400);
  } catch (e) {
    // Audio not available
  }
}

export function stopRainAmbient() {
  try {
    if (rainNoiseSource) {
      rainNoiseSource.stop();
      rainNoiseSource = null;
      rainGainNode = null;
      rainFilterNode = null;
    }
    if (rainInterval) {
      clearInterval(rainInterval);
      rainInterval = null;
    }
  } catch (e) {
    // Already stopped
  }
}

// Thunder crack
export function playThunder() {
  if (muted) return;
  try {
    const ctx = getCtx();
    // Initial crack — bright noise burst
    const crackLen = Math.floor(ctx.sampleRate * 0.08);
    const crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
    const crackData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackLen; i++) {
      crackData[i] = (Math.random() * 2 - 1);
    }
    const crack = ctx.createBufferSource();
    crack.buffer = crackBuf;
    const crackGain = ctx.createGain();
    crack.connect(crackGain);
    crackGain.connect(ctx.destination);
    const t = ctx.currentTime;
    crackGain.gain.setValueAtTime(0.04, t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    crack.start(t);
    crack.stop(t + 0.08);

    // Rumble — low frequency rolling
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 50;
    gain.gain.setValueAtTime(0.03, t + 0.05);
    gain.gain.setValueAtTime(0.025, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    osc.start(t + 0.05);
    osc.stop(t + 1.0);

    // Second rumble harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sawtooth';
    osc2.frequency.value = 35;
    gain2.gain.setValueAtTime(0.015, t + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc2.start(t + 0.1);
    osc2.stop(t + 0.8);
  } catch (e) {
    // Audio not available
  }
  // Distant crackle
  for (let i = 0; i < 4; i++) {
    noiseBurst(0.04, 0.008, 0.15 + i * 0.12 + Math.random() * 0.05);
  }
}

// Clock tick — for timer tension
export function playClockTick() {
  if (muted) return;
  // Sharp tick
  tone(4000, 0.008, 'square', 0.02);
  tone(2500, 0.006, 'sine', 0.012, 0.002);
  // Subtle body resonance
  tone(800, 0.015, 'sine', 0.005, 0.003);
}

// --- Campaign chapter sound cues ---

// Field leader arrival — short authoritative ascending tone
export function playLeaderArrival() {
  if (muted) return;
  tone(523, 0.1, 'sine', 0.04);       // C5
  tone(659, 0.1, 'sine', 0.04, 0.1);  // E5
}

// Decision moment — soft contemplative descending chime with slight echo
export function playDecisionChime() {
  if (muted) return;
  // Primary notes
  tone(784, 0.15, 'triangle', 0.035);       // G4
  tone(659, 0.15, 'triangle', 0.035, 0.15); // E4
  tone(523, 0.15, 'triangle', 0.035, 0.3);  // C4
  // Subtle delay echo layer
  tone(784, 0.12, 'triangle', 0.012, 0.08);
  tone(659, 0.12, 'triangle', 0.012, 0.23);
  tone(523, 0.12, 'triangle', 0.012, 0.38);
}

// Chapter complete — triumphant ascending fanfare with final sustain
export function playChapterComplete() {
  if (muted) return;
  tone(262, 0.2, 'square', 0.025);       // C4
  tone(330, 0.2, 'square', 0.025, 0.2);  // E4
  tone(392, 0.2, 'square', 0.025, 0.4);  // G4
  tone(523, 0.4, 'square', 0.03, 0.6);   // C5 sustained
  // Soften with a sine layer on the final note
  tone(523, 0.5, 'sine', 0.02, 0.6);
}

// Between-chapter transition — ambient wash fading in and out over 2s
export function playTransitionAmbient() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const duration = 2.0;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Brownian noise: accumulated random walk
    let val = 0;
    for (let i = 0; i < bufferSize; i++) {
      val += (Math.random() * 2 - 1) * 0.06;
      val = Math.max(-1, Math.min(1, val));
      data[i] = val;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    const gain = ctx.createGain();
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.02, t + 1.0);
    gain.gain.linearRampToValueAtTime(0.001, t + 2.0);
    source.start(t);
    source.stop(t + duration);
  } catch (e) {
    // Audio not available
  }
}

// Campaign flag set — subtle acknowledgment ping
export function playFlagNotification() {
  if (muted) return;
  tone(440, 0.08, 'sine', 0.015); // A4, very soft and brief
}

// Signature event start — dramatic low tone with vibrato and sub-bass
export function playSignatureEventStart() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    // Main C3 with vibrato
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(131, t); // C3
    // Vibrato via LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5;
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + 0.5);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t);
    osc.stop(t + 0.5);
    // Sub-bass rumble underneath
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.type = 'sine';
    sub.frequency.value = 55;
    subGain.gain.setValueAtTime(0.025, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    sub.start(t);
    sub.stop(t + 0.5);
  } catch (e) {
    // Audio not available
  }
}

// Ending reveal — emotional chord with gentle fade
export function playEndingReveal() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const notes = [262, 330, 392]; // C4, E4, G4
    for (const freq of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.025, t);
      gain.gain.setValueAtTime(0.025, t + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
      osc.start(t);
      osc.stop(t + 1.0);
    }
  } catch (e) {
    // Audio not available
  }
}

// --- Chapter-to-music-phase mapping for campaign ---
export const CHAPTER_MUSIC_PHASES = {
  ch1: 'OPENING',      // Gentle, learning
  ch2: 'BUILDING',     // Building momentum
  ch3: 'BUILDING',     // Exposure pressure
  ch4: 'REOPEN_RUSH',  // Endurance
  ch5: 'REOPEN_RUSH',  // Responsibility
  ch6: 'LATE_DRAG',    // Weariness
  ch7: 'CLOSING',      // Resolution
};
