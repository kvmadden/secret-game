// difficulty-curves.js - Difficulty scaling system for the pharmacy campaign.
// Combines chapter baselines, within-shift progression, persistent state,
// and phase-based intensity into final difficulty parameters.

// ── Chapter baseline multipliers ───────────────────────────────────────
// Each chapter ramps the overall difficulty floor.
const chapterBaseline = {
  ch1: 0.6,
  ch2: 0.85,
  ch3: 1.0,
  ch4: 1.1,
  ch5: 1.15,
  ch6: 1.25,
  ch7: 1.3,
};

// ── Within-chapter shift progression ───────────────────────────────────
// Shift 0 is an easier intro, shift 1 is standard, shift 2 is the
// signature / climax encounter.
const shiftProgression = {
  0: 0.85,
  1: 1.0,
  2: 1.15,
};

// ── Phase difficulty weights ───────────────────────────────────────────
// Controls how each in-shift phase modifies event spawn intensity.
// LUNCH_CLOSE is 0 because the pharmacy is closed during that window.
export const PHASE_DIFFICULTY_WEIGHTS = {
  OPENING:      0.6,
  BUILDING:     0.9,
  LUNCH_CLOSE:  0.0,
  REOPEN_RUSH:  1.3,
  LATE_DRAG:    1.1,
};

// ── Base drift rates per phase (units/s) ───────────────────────────────
const PHASE_BASE_DRIFT = {
  OPENING:      0.02,
  BUILDING:     0.05,
  LUNCH_CLOSE:  0.0,
  REOPEN_RUSH:  0.08,
  LATE_DRAG:    0.06,
};

// ── State modifiers ────────────────────────────────────────────────────
// Persistent campaign state (burnout, team strength, etc.) nudges
// difficulty up or down so the game responds to past player choices.
function stateModifiers(state = {}) {
  const mods = { ambientMult: 0, eventMult: 0, meterMult: 0, meterDriftMods: {} };
  const { burnout = 50, teamStrength = 50, storeReadiness = 50,
          clinicalIntegrity = 50, leadershipAlignment = 50 } = state;

  // Burnout — exhausted pharmacist makes everything harder
  if (burnout > 80) {
    mods.ambientMult += 0.2;
    mods.meterMult   += 0.1;
  } else if (burnout > 60) {
    mods.ambientMult += 0.1;
    mods.eventMult   += 0.05;
  }

  // Team strength — strong team absorbs pressure, weak team adds it
  if (teamStrength < 30)      mods.eventMult += 0.15;
  else if (teamStrength > 70) mods.eventMult -= 0.1;

  // Store readiness — unprepared store raises ambient noise
  if (storeReadiness < 30)      mods.ambientMult += 0.1;
  else if (storeReadiness > 70) mods.ambientMult -= 0.1;

  // Clinical integrity — low integrity causes safety meter to drift up
  if (clinicalIntegrity < 30) {
    mods.meterDriftMods.safety = 0.05;   // +0.05 units/s
  }

  // Leadership alignment — high alignment calms scrutiny meter
  if (leadershipAlignment > 70) {
    mods.meterDriftMods.scrutiny = -0.03; // -0.03 units/s
  }

  return mods;
}

// ── Core difficulty calculator ─────────────────────────────────────────
// Merges chapter baseline, shift progression, and state into one object
// that the rest of the engine can consume directly.
function calculateShiftDifficulty(chapterId, shiftIndex, state = {}) {
  const base = chapterBaseline[chapterId] ?? 1.0;
  const prog = shiftProgression[shiftIndex] ?? 1.0;
  const combined = base * prog;

  const sMods = stateModifiers(state);

  return {
    ambientMult:   combined + sMods.ambientMult,
    eventMult:     combined + sMods.eventMult,
    meterMult:     combined + sMods.meterMult,
    meterDriftMods: { ...sMods.meterDriftMods },
  };
}

// ── Event spawn rate ───────────────────────────────────────────────────
// Converts the difficulty object into a concrete events-per-minute rate.
// Base rate is 3 events/min, clamped to [1.5, 6].
const BASE_EVENTS_PER_MIN = 3;
const MIN_EVENTS_PER_MIN  = 1.5;
const MAX_EVENTS_PER_MIN  = 6;

function getEventSpawnRate(difficulty) {
  const raw = BASE_EVENTS_PER_MIN * (difficulty.eventMult || 1.0);
  return Math.min(MAX_EVENTS_PER_MIN, Math.max(MIN_EVENTS_PER_MIN, raw));
}

// ── Per-meter ambient drift rate ───────────────────────────────────────
// Returns the drift rate (units/s) for a given meter during a given phase,
// incorporating the difficulty's meterMult and any meter-specific drift
// modifiers produced by persistent state.
function getMeterDriftRate(meterId, difficulty, phase) {
  const baseDrift = PHASE_BASE_DRIFT[phase] ?? 0;
  const mult      = difficulty.meterMult || 1.0;
  const specific  = (difficulty.meterDriftMods && difficulty.meterDriftMods[meterId]) || 0;

  return baseDrift * mult + specific;
}

// ── Aggregate export ───────────────────────────────────────────────────
export const DIFFICULTY_CURVES = {
  chapterBaseline,
  shiftProgression,
  stateModifiers,
  calculateShiftDifficulty,
  getEventSpawnRate,
  getMeterDriftRate,
};

// Named exports for convenience
export {
  calculateShiftDifficulty,
  getEventSpawnRate,
  getMeterDriftRate,
  stateModifiers,
};
