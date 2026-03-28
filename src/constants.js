// ========== TIMING ==========
export const GAME_DURATION = 360; // 6 minutes in seconds
export const TICK_RATE = 1000 / 60; // 60fps
export const VERIFY_TIME = 4; // seconds to verify a script
export const SERVE_TIME = 3;  // seconds to serve a patient

// ========== PHASES ==========
export const PHASES = [
  { name: 'OPENING',      start: 0,    end: 0.18, label: 'Opening' },
  { name: 'BUILDING',     start: 0.18, end: 0.38, label: 'Building' },
  { name: 'LUNCH_CLOSE',  start: 0.38, end: 0.55, label: 'Lunch Close' },
  { name: 'REOPEN_RUSH',  start: 0.55, end: 0.78, label: 'Reopen Rush' },
  { name: 'LATE_DRAG',    start: 0.78, end: 1.0,  label: 'Late Drag' },
];

// ========== SHIFT TIMES (display) ==========
export const SHIFT_START_HOUR = 9;  // 9:00 AM
export const SHIFT_END_HOUR = 15;   // 3:00 PM (6 hour shift)

// ========== COLORS ==========
export const COLORS = {
  QUEUE: '#00d4ff',
  RAGE: '#ff4444',
  BURNOUT: '#ff8800',

  // Pharmacy palette
  FLOOR: '#ccc8ba',
  FLOOR_DARK: '#c0bcae',
  COUNTER_TOP: '#e0dcd4',
  COUNTER_FRONT: '#4a3a2a',
  SHELF: '#7a6545',
  SHELF_DARK: '#5a4525',
  WALL: '#d8d4cc',
  CEILING: '#e8e4dc',
  BACK_WALL: '#d0ccc4',

  // Station accents
  VERIFY: '#00d4ff',
  PICKUP: '#00cc66',
  CONSULT: '#aa66ff',
  PHONE: '#ff8800',
  DRIVE: '#ff4466',
};

// ========== TILE SIZE ==========
export const TILE_SIZE = 16;
export const SCALE = 2;

// ========== PHARMACY MAP DIMENSIONS (in tiles) ==========
// Portrait-friendly compressed board: everything visible at once
export const MAP_COLS = 16;
export const MAP_ROWS = 20;

// ========== STATION POSITIONS (tile coords) ==========
// Three-band layout: public (top), workspace (middle), drive (side)
export const STATIONS = {
  pickup:  { col: 3,  row: 8,  label: 'PICK UP',      color: COLORS.PICKUP,  icon: '🛍' },
  consult: { col: 10, row: 8,  label: 'CONSULT',      color: COLORS.CONSULT, icon: '💬' },
  verify:  { col: 6,  row: 12, label: 'VERIFY',       color: COLORS.VERIFY,  icon: '💊' },
  phone:   { col: 2,  row: 13, label: 'PHONE',        color: COLORS.PHONE,   icon: '📞' },
  drive:   { col: 13, row: 12, label: 'DRIVE THRU',   color: COLORS.DRIVE,   icon: '🚗' },
};

// Pharmacist spawn position (center of workspace)
export const PHARMACIST_START = { col: 7, row: 11 };

// ========== METER SETTINGS ==========
export const METER_MAX = 100;

// Phase-based event intervals (seconds between events)
export const PHASE_EVENT_INTERVAL = {
  OPENING:     { min: 4, max: 7 },
  BUILDING:    { min: 2.5, max: 4.5 },
  LUNCH_CLOSE: { min: 999, max: 999 },
  REOPEN_RUSH: { min: 1.5, max: 3 },
  LATE_DRAG:   { min: 3, max: 5.5 },
};

// Phase-based ambient meter pressure per second
export const PHASE_AMBIENT = {
  OPENING:     { queue: 0.2,  rage: 0.15, burnout: 0.08 },
  BUILDING:    { queue: 0.4,  rage: 0.3,  burnout: 0.15 },
  LUNCH_CLOSE: { queue: 0.7,  rage: 0.9,  burnout: -0.12 },
  REOPEN_RUSH: { queue: 0.6,  rage: 0.45, burnout: 0.25 },
  LATE_DRAG:   { queue: 0.25, rage: 0.2,  burnout: 0.2 },
};

// Script pipeline intervals (seconds between new scripts entering)
export const PHASE_SCRIPT_INTERVAL = {
  OPENING:     { min: 7, max: 12 },
  BUILDING:    { min: 4, max: 7 },
  LUNCH_CLOSE: { min: 999, max: 999 },
  REOPEN_RUSH: { min: 2.5, max: 5 },
  LATE_DRAG:   { min: 5, max: 9 },
};

// ========== DEFER SETTINGS ==========
export const DEFER_RETURN_MIN = 12;
export const DEFER_RETURN_MAX = 22;

// ========== PHARMACIST MOVEMENT ==========
export const PHARMACIST_SPEED = 5; // tiles per second (slowed for strategy)

// ========== PATIENT SETTINGS ==========
export const MAX_PATIENTS_PER_STATION = 3;
export const PATIENT_LEAVE_THRESHOLD = 0; // patience at which they leave

export const PATIENT_PALETTES = [
  { hair: '#3a2a1a', shirt: '#4466aa', skin: '#e8b88a' },
  { hair: '#8b6914', shirt: '#aa4444', skin: '#d4a574' },
  { hair: '#1a1a1a', shirt: '#44aa66', skin: '#c49060' },
  { hair: '#cc8833', shirt: '#6644aa', skin: '#e8c8a0' },
  { hair: '#555555', shirt: '#aa6644', skin: '#8b6240' },
  { hair: '#2a1a0a', shirt: '#44aaaa', skin: '#d4a574' },
  { hair: '#994422', shirt: '#888844', skin: '#e8b88a' },
  { hair: '#1a2a1a', shirt: '#aa4488', skin: '#c49060' },
  { hair: '#443322', shirt: '#5588aa', skin: '#e0c090' },
  { hair: '#111111', shirt: '#cc6644', skin: '#8b6240' },
];

export const PATIENT_BARKS = [
  "I've been waiting forever.",
  "How long does this take?",
  "You never answer the phone.",
  "Just one quick question.",
  "While I'm here…",
  "I called this in yesterday!",
  "My doctor said it'd be ready.",
  "Is there a manager?",
  "I need this TODAY.",
  "How much longer?",
  "This never happened at Walgreens.",
  "I'm too old for this app.",
  "I have somewhere to be.",
  "Can you hurry up?",
  "My insurance covers this.",
  "I drove 30 minutes for this.",
];

// ========== PIPELINE DANGER THRESHOLDS ==========
export const PIPELINE_QUEUE_PRESSURE_MULT = 0.06; // per unverified script per second
export const PIPELINE_RAGE_PRESSURE_MULT = 0.03;  // per ready-but-unserved script

// ========== ESCALATION ==========
export const MAX_ESCALATION_CHAIN = 3; // After 3 escalations, event expires with full penalty

// ========== DIFFICULTY ==========
export const DIFFICULTY = {
  EASY:   { label: 'Easy',   meterMult: 0.7, eventMult: 1.3, ambientMult: 0.6, patienceMult: 0.6 },
  NORMAL: { label: 'Normal', meterMult: 1.0, eventMult: 1.0, ambientMult: 1.0, patienceMult: 1.0 },
  HARD:   { label: 'Hard',   meterMult: 1.4, eventMult: 0.7, ambientMult: 1.5, patienceMult: 1.4 },
};

// ========== COMBO ==========
export const COMBO_WINDOW = 10; // seconds to chain another handle for combo
export const COMBO_BONUS_PER_STACK = 2.5; // extra meter relief per combo stack

// ========== RESULTS ==========
export const WIN_TITLES = [
  { title: 'HELD TOGETHER', flavor: 'You kept the store open. That was the assignment.' },
  { title: 'SURVIVED', flavor: "Someone is writing a Google review right now." },
  { title: 'STILL STANDING', flavor: "You'll do it again tomorrow." },
  { title: 'SHIFT COMPLETE', flavor: "Clock out. Don't look back." },
];

export const LOSS_TITLES = {
  queue:   { title: 'QUEUE COLLAPSE', flavor: 'The line reached the blood pressure machine.' },
  rage:    { title: 'THEY WANT YOUR NAME', flavor: 'Corporate will hear about this. All of it.' },
  burnout: { title: 'BURNED OUT', flavor: 'You stared at a vial for 30 seconds and forgot why.' },
};

// ========== LUNCH MESSAGES ==========
export const LUNCH_MESSAGES = [
  'Mandatory lunch break.',
  'Patients piling up...',
  '"Are you serious right now?"',
  'They were still waiting.',
  '"Can\'t you just open early?"',
  'The line is growing.',
  '"I\'ll just wait here."',
  'The phone is ringing.',
  'Someone knocked on the gate.',
  '"This is unacceptable."',
];
