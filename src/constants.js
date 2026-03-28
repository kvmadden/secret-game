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

  // Pharmacy palette — warm Stardew-inspired tones
  FLOOR: '#e0d4c0',
  FLOOR_DARK: '#d4c8b4',
  COUNTER_TOP: '#f0e4d0',
  COUNTER_FRONT: '#8b6f47',
  SHELF: '#9a7a50',
  SHELF_DARK: '#7a5a30',
  WALL: '#e8dcc8',
  CEILING: '#f4ece0',
  BACK_WALL: '#e0d8c8',

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
  // Classic frustrations
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
  // Pharmacy-specific humor
  "Can you just give me one pill?",
  "I left my insurance card at home.",
  "My doctor's office is closed.",
  "What do you mean prior auth?",
  "I don't have a copay.",
  "It was $4 last month.",
  "The app says it's ready!",
  "Can you check the back?",
  "I'll wait.",
  "I'm parked in the fire lane.",
  "Do you have this in liquid?",
  "My friend takes the same thing.",
  "What's taking so long? It's just pills.",
  "I was here 10 minutes ago.",
  "Can I speak to the pharmacist?",
  "...you ARE the pharmacist?",
  "My other pharmacy never did this.",
  "GoodRx says $7.",
  "Can you call my doctor for me?",
  "I don't need a consultation.",
  "Just put it through my insurance.",
  "Is this generic?",
  "I need all 12 prescriptions today.",
  "I have a coupon somewhere...",
  "My grandson set up the app.",
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

// ========== SHIFT DAYS ==========
export const SHIFT_DAYS = [
  { name: 'Monday',    modifier: 'Weekend Backlog',     desc: 'Scripts pile up faster',          scriptMult: 1.4, eventMult: 1.0, rageMult: 1.0 },
  { name: 'Tuesday',   modifier: 'Steady Tuesday',      desc: 'A normal day. Enjoy it.',         scriptMult: 1.0, eventMult: 1.0, rageMult: 1.0 },
  { name: 'Wednesday', modifier: 'Insurance Day',       desc: 'Patients angrier about copays',   scriptMult: 1.0, eventMult: 1.0, rageMult: 1.3 },
  { name: 'Thursday',  modifier: 'Short Staffed',       desc: 'Burnout rises faster',            scriptMult: 1.0, eventMult: 1.0, rageMult: 1.0, burnoutMult: 1.4 },
  { name: 'Friday',    modifier: 'Weekend Prep Rush',   desc: 'Everyone needs meds before the weekend', scriptMult: 1.3, eventMult: 1.2, rageMult: 1.0 },
  { name: 'Saturday',  modifier: 'Skeleton Crew',       desc: 'Drive-thru chaos, short patience', scriptMult: 1.0, eventMult: 1.3, rageMult: 1.2, driveMult: 2.0 },
  { name: 'Sunday',    modifier: 'Solo Sunday',         desc: 'Just you. All day.',              scriptMult: 1.2, eventMult: 1.1, rageMult: 1.1 },
];

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
