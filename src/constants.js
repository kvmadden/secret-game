// ========== TILE TYPES ==========
export const TILE = {
  FLOOR: 0,
  COUNTER_TOP: 1,
  COUNTER_FRONT: 2,
  SHELF: 3,
  WALL: 4,
  BACK_WALL: 5,
  CUSTOMER_FLOOR: 6,
  WORKSPACE: 7,
  DRIVE_LANE: 8,
  STORE_FLOOR: 9,
  HALF_WALL: 10,
};

// ========== TIMING ==========
export const GAME_DURATION = 420; // 7 minutes in seconds
export const TICK_RATE = 1000 / 60; // 60fps
export const VERIFY_TIME = 3; // seconds to verify a script
export const SERVE_TIME = 2;  // seconds to serve a patient

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
  SAFETY: '#ffcc00',
  RAGE: '#ff4444',
  BURNOUT: '#ff8800',
  SCRUTINY: '#cc66ff',

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
  OPENING:     { min: 14, max: 22 },
  BUILDING:    { min: 8, max: 13 },
  LUNCH_CLOSE: { min: 999, max: 999 },
  REOPEN_RUSH: { min: 5, max: 9 },
  LATE_DRAG:   { min: 7, max: 12 },
};

// Phase-based ambient meter pressure per second
export const PHASE_AMBIENT = {
  OPENING:     { queue: 0.03, safety: 0.01, rage: 0.02, burnout: 0.01, scrutiny: 0.0 },
  BUILDING:    { queue: 0.08, safety: 0.03, rage: 0.06, burnout: 0.03, scrutiny: 0.01 },
  LUNCH_CLOSE: { queue: 0.2,  safety: 0.02, rage: 0.25, burnout: -0.15, scrutiny: 0.03 },
  REOPEN_RUSH: { queue: 0.15, safety: 0.05, rage: 0.12, burnout: 0.06, scrutiny: 0.03 },
  LATE_DRAG:   { queue: 0.06, safety: 0.03, rage: 0.05, burnout: 0.05, scrutiny: 0.02 },
};

// Script pipeline intervals (seconds between new scripts entering)
export const PHASE_SCRIPT_INTERVAL = {
  OPENING:     { min: 25, max: 40 },
  BUILDING:    { min: 10, max: 16 },
  LUNCH_CLOSE: { min: 999, max: 999 },
  REOPEN_RUSH: { min: 7, max: 12 },
  LATE_DRAG:   { min: 12, max: 18 },
};

// ========== DEFER SETTINGS ==========
export const DEFER_RETURN_MIN = 20;
export const DEFER_RETURN_MAX = 35;

// ========== PHARMACIST MOVEMENT ==========
export const PHARMACIST_SPEED = 5; // tiles per second (slowed for strategy)

// ========== PATIENT SETTINGS ==========
export const MAX_PATIENTS_PER_STATION = 3;
export const PATIENT_LEAVE_THRESHOLD = 0; // patience at which they leave

export const PATIENT_PALETTES = [
  { hair: '#3a2a1a', shirt: '#4466aa', skin: '#e8b88a', pants: '#3a3848', shoes: '#2a2018' },
  { hair: '#8b6914', shirt: '#aa4444', skin: '#d4a574', pants: '#4a4438', shoes: '#4a3020' },
  { hair: '#1a1a1a', shirt: '#44aa66', skin: '#c49060', pants: '#3e3e50', shoes: '#2a2018' },
  { hair: '#cc8833', shirt: '#6644aa', skin: '#e8c8a0', pants: '#484040', shoes: '#3a2820' },
  { hair: '#555555', shirt: '#aa6644', skin: '#8b6240', pants: '#3a4040', shoes: '#1a1810' },
  { hair: '#2a1a0a', shirt: '#44aaaa', skin: '#d4a574', pants: '#3a3848', shoes: '#4a3020' },
  { hair: '#994422', shirt: '#888844', skin: '#e8b88a', pants: '#4a4438', shoes: '#2a2018' },
  { hair: '#1a2a1a', shirt: '#aa4488', skin: '#c49060', pants: '#3e3e50', shoes: '#3a2820' },
  { hair: '#443322', shirt: '#5588aa', skin: '#e0c090', pants: '#484040', shoes: '#2a2018' },
  { hair: '#111111', shirt: '#cc6644', skin: '#8b6240', pants: '#3a4040', shoes: '#1a1810' },
  { hair: '#664422', shirt: '#5577bb', skin: '#f0c8a0', pants: '#3a3a4a', shoes: '#2a2018' },
  { hair: '#2a2a2a', shirt: '#bb5566', skin: '#b07848', pants: '#484040', shoes: '#4a3020' },
  { hair: '#aa7733', shirt: '#448877', skin: '#e8d0a8', pants: '#3e3e50', shoes: '#2a2018' },
  { hair: '#774422', shirt: '#7766aa', skin: '#d0a070', pants: '#3a3848', shoes: '#3a2820' },
  { hair: '#333333', shirt: '#cc8855', skin: '#a06838', pants: '#4a4438', shoes: '#1a1810' },
  { hair: '#bb9944', shirt: '#557799', skin: '#e8c090', pants: '#3a4040', shoes: '#2a2018' },
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
  // Social humiliation / entitlement theater
  "How long does it take to put pills in a bottle?",
  "You're not a real doctor.",
  "I could do your job in my sleep.",
  "My tax dollars pay your salary.",
  "I'll have your license.",
  "Do you even know what you're doing?",
  "I'm going to call corporate.",
  "This is why Amazon is winning.",
  "I want your name and badge number.",
  "I used to be in healthcare. This is wrong.",
  "My nephew is a doctor. He says this is ridiculous.",
  "I'm posting this on Facebook.",
  "You people are the problem with healthcare.",
  "I know the owner.",
  "I'll just go to CVS.",
  "Must be nice to stand around all day.",
  "Are you even listening to me?",
  "I'm calling my lawyer.",
  "You clearly don't care about patients.",
  "This is a HIPAA violation.",
  "I've been a customer here for 20 YEARS.",
  "My doctor will hear about this.",
  "I'm calling the news.",
  "You think you're better than me?",
  "I didn't go to school for this kind of treatment.",
  // Medical misunderstandings
  "Can I take this with grapefruit?",
  "My friend takes this. Can I have some?",
  "I stopped taking it because I felt better.",
  "I've been cutting them in half to save money.",
  "Can I get the one from the commercial?",
  "The internet says I shouldn't take this.",
  "I lost my meds on vacation.",
  "My dog ate my prescription.",
  "Can you just give me a sample?",
  "I need something for my 'nerves.'",
  // Entitled / absurd
  "I've been waiting in my car for five minutes.",
  "Can't you just LOOK at the computer?",
  "My cousin is a vet tech. She says this is wrong.",
  "I have a flight in two hours.",
  "Do you do returns?",
  "This pill is a different shade of white.",
  "I need ALL of them today.",
  "Can you bubble-wrap this?",
  "I need a note for my boss.",
  "My chiropractor told me to stop all medications.",
  // Oddly specific
  "I counted. There are only 29 pills.",
  "This bottle cap is too hard to open.",
  "Can you write 'take with love' on the label?",
  "I need this in chewable.",
  "Do you have a bathroom?",
  "Can you check if my doctor called back? ...today.",
  "I'm allergic to the blue ones.",
  "My other pharmacy gives me 90 days.",
  "I was here yesterday, you told me to come back today.",
  "I need to talk to you about my cat.",
  // Rare gems
  "You're the ONLY one who helps me. Thank you.",
  "My grandson is in pharmacy school! Any advice?",
  "I brought you cookies. Don't tell anyone.",
  "I know you're busy. Take your time.",
  "Sorry for yelling last time.",
  "How do you do this every day?",
  "You saved my life last year. Just wanted you to know.",
  "I pray for you pharmacy people.",
  "Is there anything I can do to help?",
  "You look tired. Please take care of yourself.",
];

// ========== PIPELINE DANGER THRESHOLDS ==========
export const PIPELINE_QUEUE_PRESSURE_MULT = 0.025; // per unverified script per second
export const PIPELINE_RAGE_PRESSURE_MULT = 0.015;  // per ready-but-unserved script
export const PIPELINE_SAFETY_PRESSURE_MULT = 0.02;  // rushed scripts increase safety risk

// ========== ESCALATION ==========
export const MAX_ESCALATION_CHAIN = 3; // After 3 escalations, event expires with full penalty

// ========== DIFFICULTY ==========
export const DIFFICULTY = {
  EASY:   { label: 'Easy',   meterMult: 0.5, eventMult: 1.5, ambientMult: 0.4, patienceMult: 0.4 },
  NORMAL: { label: 'Normal', meterMult: 0.8, eventMult: 1.0, ambientMult: 0.8, patienceMult: 0.8 },
  HARD:   { label: 'Hard',   meterMult: 1.2, eventMult: 0.8, ambientMult: 1.2, patienceMult: 1.2 },
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

// ========== WEATHER ==========
export const WEATHER_TYPES = [
  { name: 'Sunny',    weight: 4, lightTint: [255, 240, 180], lightAlpha: 0.04, desc: 'Clear and warm' },
  { name: 'Cloudy',   weight: 3, lightTint: [180, 190, 210], lightAlpha: 0.03, desc: 'Gray skies' },
  { name: 'Rainy',    weight: 2, lightTint: [140, 160, 200], lightAlpha: 0.05, desc: 'Rain outside', hasRain: true },
  { name: 'Stormy',   weight: 1, lightTint: [100, 110, 140], lightAlpha: 0.06, desc: 'Thunder rumbles', hasRain: true, hasThunder: true },
];

// ========== RESULTS ==========
export const WIN_TITLES = [
  { title: 'HELD TOGETHER', flavor: 'You kept the store open. That was the assignment.' },
  { title: 'SURVIVED', flavor: "Someone is writing a Google review right now." },
  { title: 'STILL STANDING', flavor: "You'll do it again tomorrow." },
  { title: 'SHIFT COMPLETE', flavor: "Clock out. Don't look back." },
  { title: 'CLOSING TIME', flavor: "The gate comes down. You earned this silence." },
  { title: 'ANOTHER DAY', flavor: "The pills are counted. The queue is clear. For now." },
  { title: 'MADE IT', flavor: "Your feet hurt but your license is intact." },
  { title: 'OFF THE CLOCK', flavor: "Tomorrow's problem is tomorrow's." },
];

export const LOSS_TITLES = {
  queue:    { title: 'QUEUE COLLAPSE', flavor: 'The line reached the blood pressure machine.' },
  safety:   { title: 'NEAR MISS', flavor: 'You almost dispensed the wrong thing. Almost.' },
  rage:     { title: 'THEY WANT YOUR NAME', flavor: 'Corporate will hear about this. All of it.' },
  burnout:  { title: 'BURNED OUT', flavor: 'You stared at a vial for 30 seconds and forgot why.' },
  scrutiny: { title: 'UNDER REVIEW', flavor: 'District manager is on the phone. For you.' },
};

// Extended loss flavors per meter
export const LOSS_FLAVORS = {
  queue: [
    'The line reached the blood pressure machine.',
    'People are queuing outside. In the rain.',
    'The drive-thru line is blocking the road.',
    'They opened a second line at the register. There is no second register.',
  ],
  safety: [
    'You almost dispensed the wrong thing. Almost.',
    'The board will want to see your notes.',
    'A near-miss report just got filed. By you.',
    'You caught it. This time.',
  ],
  rage: [
    'Corporate will hear about this. All of it.',
    'Someone just posted a one-star review. With photos.',
    'A patient asked for the complaint form. You ran out.',
    '"I will NEVER come here again." They\'ll be back Monday.',
  ],
  burnout: [
    'You stared at a vial for 30 seconds and forgot why.',
    'You counted the same bottle three times.',
    'You accidentally put someone on hold. An hour ago.',
    'You considered a career in literally anything else.',
  ],
  scrutiny: [
    'District manager is on the phone. For you.',
    'Your metrics are "flagged." Whatever that means.',
    'Corporate sent an email with your name in the subject line.',
    'The DM just walked in. Unannounced.',
  ],
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

// ========== PHARMACIST THOUGHTS ==========
export const PHARMACIST_THOUGHTS = [
  "Did I check that interaction...",
  "How many more hours...",
  "I should eat something.",
  "Focus. You've got this.",
  "Is that count right?",
  "I need coffee.",
  "Deep breaths.",
  "Three more hours.",
  "They're doing their best too.",
  "Tomorrow is a new day.",
  "I chose this. Right?",
  "Just one more patient.",
  "The queue will slow down.",
  "At least it's not raining... wait.",
  "I wonder if that script was right.",
  "Note to self: recount the C2s.",
  "My feet hurt.",
  "Lunch feels like it was yesterday.",
  "Almost closing time.",
  "Stay sharp. People depend on you.",
];

// ========== GRADE THRESHOLDS ==========
export const GRADE_THRESHOLDS = {
  S: { maxAvg: 20, label: 'LEGENDARY', color: '#ffd700' },
  A: { maxAvg: 35, label: 'EXCELLENT', color: '#44dd44' },
  B: { maxAvg: 50, label: 'GOOD', color: '#44aadd' },
  C: { maxAvg: 65, label: 'ADEQUATE', color: '#dddd44' },
  D: { maxAvg: 80, label: 'STRUGGLING', color: '#dd8844' },
  F: { maxAvg: 100, label: 'CRITICAL', color: '#dd4444' },
};

// ========== STATION DESCRIPTIONS ==========
export const STATION_DESCRIPTIONS = {
  pickup: { name: 'Pick Up Window', desc: 'Where patients collect their prescriptions', emoji: '🛍️' },
  consult: { name: 'Consultation Area', desc: 'Private counseling space for patient questions', emoji: '💬' },
  verify: { name: 'Verification Bench', desc: 'Where prescriptions are checked and counted', emoji: '💊' },
  phone: { name: 'Phone Station', desc: "Doctors' offices, insurance, and angry patients", emoji: '📞' },
  drive: { name: 'Drive-Thru Window', desc: 'Convenience for those who refuse to park', emoji: '🚗' },
};

// ========== COMBO NAMES ==========
export const COMBO_NAMES = [
  '', 'Nice!', 'Great!', 'Awesome!', 'Amazing!',
  'INCREDIBLE!', 'UNSTOPPABLE!', 'GODLIKE!', 'LEGENDARY!', 'PHARMACIST OF THE YEAR!', 'BEYOND MORTAL!'
];

// ========== WEATHER EFFECTS ==========
export const WEATHER_EFFECTS = {
  Sunny: { moodBoost: 0.05, patienceMod: 1.05, ambientLight: 1.1 },
  Cloudy: { moodBoost: 0, patienceMod: 1.0, ambientLight: 0.95 },
  Rainy: { moodBoost: -0.05, patienceMod: 0.9, ambientLight: 0.85, wetFloors: true },
  Stormy: { moodBoost: -0.1, patienceMod: 0.8, ambientLight: 0.7, wetFloors: true, powerFlicker: true },
};

// ========== CAMPAIGN ==========
export const CAMPAIGN_CHAPTER_ORDER = ['prologue', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'];

export const CHAPTER_TITLES = {
  prologue: 'Congratulations, Doctor',
  ch1: 'Welcome Aboard',
  ch2: 'Float Season',
  ch3: 'Goldfish Bowl',
  ch4: 'The Reliable One',
  ch5: 'PIC',
  ch6: 'We Need You Everywhere',
  ch7: 'What It Made You',
};

export const CHAPTER_SUBTITLES = {
  prologue: 'The diploma is real. The 4AM alarm that starts tomorrow is real.',
  ch1: 'Support first. Then they take it away.',
  ch2: 'You are useful. So the system sends you everywhere.',
  ch3: 'The work is not only hard. It is exposed.',
  ch4: 'Competence attracts more burden.',
  ch5: 'You wanted influence. Now you own consequences.',
  ch6: 'Too useful to leave alone.',
  ch7: 'The days that define the career.',
};

export const EVENT_TIERS = { AMBIENT: 'ambient', PRESSURE: 'pressure', SIGNATURE: 'signature' };

export const ENDING_LANE_IDS = ['builder', 'climber', 'escape', 'quiet_pro', 'burnout_end', 'martyr'];

export const CAMPAIGN_FLAG_NAMES = [
  'said_yes_often', 'protected_team_often', 'stayed_late_often',
  'accepted_stretch_role', 'trained_new_hire', 'backed_down_for_optics',
  'preserved_standards', 'actively_looking_for_exit', 'took_manager_role',
  'survived_overnight_path'
];

export const LEADER_TYPES = {
  cheerleader: 'The Cheerleader',
  ghost: 'The Ghost',
  fake_helper: 'The Fake Helper',
  rescuer_user: 'The Rescuer-User',
  metrics_hawk: 'The Metrics Hawk',
  polished_visitor: 'The Polished Visitor',
  ladder_climber: 'The Ladder Climber',
  competent_unicorn: 'The Competent Unicorn',
};

export const SHIFT_COUNT_TARGET = 18; // 3 shifts per chapter × 6 main chapters

export const SIGNATURE_EVENT_PAIRINGS = {
  ch1: 'thrown_in',
  ch2: 'overnight_weirdness',
  ch3: 'surprise_visit_collapse',
  ch4: 'no_relief_coming',
  ch5: 'offsite_clinic',
  ch6: 'visit_that_never_comes',
};
