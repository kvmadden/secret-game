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
  FLOOR: '#d4cfc4',
  FLOOR_DARK: '#c4bfb4',
  COUNTER_TOP: '#e8e4dc',
  COUNTER_FRONT: '#5a4a3a',
  SHELF: '#8b7355',
  SHELF_DARK: '#6b5335',
  WALL: '#e0dcd4',
  CEILING: '#f0ece4',
  BACK_WALL: '#d8d4cc',

  // Station accents
  VERIFY: '#00d4ff',
  PICKUP: '#00cc66',
  CONSULT: '#aa66ff',
  PHONE: '#ff8800',
  DRIVE: '#ff4466',
};

// ========== TILE SIZE ==========
export const TILE_SIZE = 16;
export const SCALE = 2; // Render at 2x

// ========== PHARMACY MAP DIMENSIONS (in tiles) ==========
export const MAP_COLS = 40; // Wide pharmacy
export const MAP_ROWS = 14; // Shallow

// ========== STATION POSITIONS (tile coords) ==========
export const STATIONS = {
  verify:  { col: 4,  row: 8, label: 'VERIFICATION', color: COLORS.VERIFY, icon: '💊' },
  pickup:  { col: 10, row: 6, label: 'PICK UP',      color: COLORS.PICKUP, icon: '🛍' },
  consult: { col: 17, row: 6, label: 'CONSULT',      color: COLORS.CONSULT, icon: '💬' },
  phone:   { col: 24, row: 8, label: 'PHONE',        color: COLORS.PHONE, icon: '📞' },
  drive:   { col: 35, row: 6, label: 'DRIVE THRU',   color: COLORS.DRIVE, icon: '🚗' },
};

// Pharmacist spawn position
export const PHARMACIST_START = { col: 14, row: 9 };

// ========== METER SETTINGS ==========
export const METER_MAX = 100;

// Phase-based event intervals (seconds between events)
export const PHASE_EVENT_INTERVAL = {
  OPENING:     { min: 5, max: 8 },
  BUILDING:    { min: 3, max: 5.5 },
  LUNCH_CLOSE: { min: 999, max: 999 }, // No events during lunch
  REOPEN_RUSH: { min: 1.8, max: 3.5 },
  LATE_DRAG:   { min: 3.5, max: 6 },
};

// Phase-based ambient meter pressure per second
export const PHASE_AMBIENT = {
  OPENING:     { queue: 0.15, rage: 0.1,  burnout: 0.05 },
  BUILDING:    { queue: 0.3,  rage: 0.2,  burnout: 0.1 },
  LUNCH_CLOSE: { queue: 0.6,  rage: 0.8,  burnout: -0.15 },
  REOPEN_RUSH: { queue: 0.5,  rage: 0.35, burnout: 0.2 },
  LATE_DRAG:   { queue: 0.2,  rage: 0.15, burnout: 0.15 },
};

// Script pipeline intervals (seconds between new scripts entering)
export const PHASE_SCRIPT_INTERVAL = {
  OPENING:     { min: 8, max: 14 },
  BUILDING:    { min: 5, max: 9 },
  LUNCH_CLOSE: { min: 999, max: 999 },
  REOPEN_RUSH: { min: 3, max: 6 },
  LATE_DRAG:   { min: 6, max: 10 },
};

// ========== DEFER SETTINGS ==========
export const DEFER_RETURN_MIN = 15;
export const DEFER_RETURN_MAX = 25;

// ========== PHARMACIST MOVEMENT ==========
export const PHARMACIST_SPEED = 6; // tiles per second

// ========== PATIENT COLORS ==========
export const PATIENT_PALETTES = [
  { hair: '#3a2a1a', shirt: '#4466aa' },
  { hair: '#8b6914', shirt: '#aa4444' },
  { hair: '#1a1a1a', shirt: '#44aa66' },
  { hair: '#cc8833', shirt: '#6644aa' },
  { hair: '#555555', shirt: '#aa6644' },
  { hair: '#2a1a0a', shirt: '#44aaaa' },
  { hair: '#994422', shirt: '#888844' },
  { hair: '#1a2a1a', shirt: '#aa4488' },
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
];

// ========== RESULTS ==========
export const WIN_TITLES = [
  { title: 'HELD TOGETHER', flavor: 'You kept the store open. That was the assignment.' },
  { title: 'SURVIVED', flavor: "Someone is writing a Google review right now." },
  { title: 'STILL STANDING', flavor: "You'll do it again tomorrow." },
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
];
