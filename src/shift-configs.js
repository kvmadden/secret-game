// shift-configs.js - Difficulty and configuration data for all campaign shifts

const BASE = {
  gameDuration: 360,
  difficulty: { ambientMult: 1.0, eventMult: 1.0, meterMult: 1.0 },
  meterOffsets: { queue: 0, safety: 0, rage: 0, burnout: 0, scrutiny: 0 },
  specialRules: {
    mentorPresent: false, tutorialEnabled: false, extendedShift: false,
    signatureShift: false, highScrutiny: false, understaffed: false,
    newHirePresent: false, offsiteClinic: false
  },
  eventWeightOverrides: {},
  ambientPressureLevel: 'medium',
  maxConcurrentEvents: 3
};

function shift(overrides) {
  const s = { ...BASE, ...overrides };
  s.difficulty = { ...BASE.difficulty, ...overrides.difficulty };
  s.meterOffsets = { ...BASE.meterOffsets, ...overrides.meterOffsets };
  s.specialRules = { ...BASE.specialRules, ...overrides.specialRules };
  s.eventWeightOverrides = overrides.eventWeightOverrides || {};
  return s;
}

export const SHIFT_CONFIGS = {
  // ── Chapter 1: Orientation ────────────────────────────────────────
  c1_shadow_day: shift({
    id: 'c1_shadow_day', chapter: 1, shiftIndex: 0,
    difficulty: { ambientMult: 0.5, eventMult: 0.5, meterMult: 0.6 },
    weather: 'clear', timeOfDay: 'morning', storeType: 'home',
    specialRules: { mentorPresent: true, tutorialEnabled: true },
    ambientPressureLevel: 'low', maxConcurrentEvents: 2
  }),
  c1_solo_sunday: shift({
    id: 'c1_solo_sunday', chapter: 1, shiftIndex: 1,
    difficulty: { ambientMult: 0.7, eventMult: 0.7, meterMult: 0.8 },
    weather: 'cloudy', timeOfDay: 'afternoon', storeType: 'home',
    ambientPressureLevel: 'low', maxConcurrentEvents: 2
  }),
  c1_thrown_in: shift({
    id: 'c1_thrown_in', chapter: 1, shiftIndex: 2,
    difficulty: { ambientMult: 0.9, eventMult: 0.9, meterMult: 1.0 },
    meterOffsets: { queue: 5 },
    weather: 'rain', timeOfDay: 'afternoon', storeType: 'home',
    specialRules: { understaffed: true },
    ambientPressureLevel: 'medium', maxConcurrentEvents: 3
  }),

  // ── Chapter 2: Floating ──────────────────────────────────────────
  c2_bad_handoff: shift({
    id: 'c2_bad_handoff', chapter: 2, shiftIndex: 0,
    difficulty: { ambientMult: 0.9, eventMult: 0.9, meterMult: 1.0 },
    meterOffsets: { queue: 8, safety: 5 },
    weather: 'cloudy', timeOfDay: 'afternoon', storeType: 'float',
    eventWeightOverrides: { backlog: 1.4 },
    ambientPressureLevel: 'medium', maxConcurrentEvents: 3
  }),
  c2_different_bench: shift({
    id: 'c2_different_bench', chapter: 2, shiftIndex: 1,
    difficulty: { ambientMult: 1.0, eventMult: 0.9, meterMult: 1.0 },
    meterOffsets: { burnout: 5 },
    weather: 'hot', timeOfDay: 'morning', storeType: 'float',
    ambientPressureLevel: 'medium', maxConcurrentEvents: 3
  }),
  c2_overnight: shift({
    id: 'c2_overnight', chapter: 2, shiftIndex: 2,
    gameDuration: 420,
    difficulty: { ambientMult: 1.0, eventMult: 1.0, meterMult: 1.0 },
    meterOffsets: { burnout: 10 },
    weather: 'clear', timeOfDay: 'night', storeType: 'overnight',
    specialRules: { signatureShift: true, extendedShift: true },
    ambientPressureLevel: 'medium', maxConcurrentEvents: 3
  }),

  // ── Chapter 3: Expectations ──────────────────────────────────────
  c3_since_youre_here: shift({
    id: 'c3_since_youre_here', chapter: 3, shiftIndex: 0,
    difficulty: { ambientMult: 1.0, eventMult: 1.05, meterMult: 1.0 },
    meterOffsets: { queue: 5, rage: 5 },
    weather: 'rain', timeOfDay: 'morning', storeType: 'home',
    eventWeightOverrides: { interruption: 1.6 },
    ambientPressureLevel: 'medium', maxConcurrentEvents: 3
  }),
  c3_cant_be_rude: shift({
    id: 'c3_cant_be_rude', chapter: 3, shiftIndex: 1,
    difficulty: { ambientMult: 1.0, eventMult: 1.05, meterMult: 1.0 },
    meterOffsets: { rage: 8 },
    weather: 'cloudy', timeOfDay: 'afternoon', storeType: 'home',
    eventWeightOverrides: { social: 1.5, customer_complaint: 1.3 },
    ambientPressureLevel: 'medium', maxConcurrentEvents: 3
  }),
  c3_surprise_visit: shift({
    id: 'c3_surprise_visit', chapter: 3, shiftIndex: 2,
    difficulty: { ambientMult: 1.05, eventMult: 1.1, meterMult: 1.1 },
    meterOffsets: { scrutiny: 12, queue: 5 },
    weather: 'clear', timeOfDay: 'morning', storeType: 'home',
    specialRules: { signatureShift: true, highScrutiny: true },
    ambientPressureLevel: 'high', maxConcurrentEvents: 3
  }),

  // ── Chapter 4: Endurance ─────────────────────────────────────────
  c4_can_you_stay: shift({
    id: 'c4_can_you_stay', chapter: 4, shiftIndex: 0,
    gameDuration: 480,
    difficulty: { ambientMult: 1.05, eventMult: 1.1, meterMult: 1.1 },
    meterOffsets: { burnout: 10, queue: 5 },
    weather: 'storm', timeOfDay: 'evening', storeType: 'home',
    specialRules: { extendedShift: true },
    ambientPressureLevel: 'high', maxConcurrentEvents: 4
  }),
  c4_no_relief: shift({
    id: 'c4_no_relief', chapter: 4, shiftIndex: 1,
    gameDuration: 480,
    difficulty: { ambientMult: 1.1, eventMult: 1.15, meterMult: 1.15 },
    meterOffsets: { burnout: 15, queue: 8, rage: 5 },
    weather: 'hot', timeOfDay: 'afternoon', storeType: 'home',
    specialRules: { signatureShift: true, extendedShift: true, understaffed: true },
    ambientPressureLevel: 'high', maxConcurrentEvents: 4
  }),
  c4_cover_once: shift({
    id: 'c4_cover_once', chapter: 4, shiftIndex: 2,
    difficulty: { ambientMult: 1.1, eventMult: 1.1, meterMult: 1.1 },
    meterOffsets: { burnout: 12, rage: 8 },
    weather: 'cold', timeOfDay: 'morning', storeType: 'float',
    eventWeightOverrides: { fatigue: 1.4 },
    ambientPressureLevel: 'high', maxConcurrentEvents: 4
  }),

  // ── Chapter 5: Ownership ─────────────────────────────────────────
  c5_first_week_pic: shift({
    id: 'c5_first_week_pic', chapter: 5, shiftIndex: 0,
    difficulty: { ambientMult: 1.1, eventMult: 1.1, meterMult: 1.1 },
    meterOffsets: { scrutiny: 8, queue: 8 },
    weather: 'clear', timeOfDay: 'morning', storeType: 'home',
    ambientPressureLevel: 'high', maxConcurrentEvents: 4
  }),
  c5_new_hire: shift({
    id: 'c5_new_hire', chapter: 5, shiftIndex: 1,
    difficulty: { ambientMult: 1.15, eventMult: 1.1, meterMult: 1.1 },
    meterOffsets: { queue: 10, safety: 8 },
    weather: 'cloudy', timeOfDay: 'afternoon', storeType: 'home',
    specialRules: { newHirePresent: true },
    eventWeightOverrides: { training: 1.5 },
    ambientPressureLevel: 'high', maxConcurrentEvents: 4
  }),
  c5_offsite_clinic: shift({
    id: 'c5_offsite_clinic', chapter: 5, shiftIndex: 2,
    difficulty: { ambientMult: 1.15, eventMult: 1.15, meterMult: 1.15 },
    meterOffsets: { queue: 12, safety: 10, burnout: 8 },
    weather: 'rain', timeOfDay: 'morning', storeType: 'offsite',
    specialRules: { signatureShift: true, offsiteClinic: true },
    ambientPressureLevel: 'high', maxConcurrentEvents: 4
  }),

  // ── Chapter 6: Politics ──────────────────────────────────────────
  c6_problem_store: shift({
    id: 'c6_problem_store', chapter: 6, shiftIndex: 0,
    difficulty: { ambientMult: 1.2, eventMult: 1.2, meterMult: 1.2 },
    meterOffsets: { queue: 15, rage: 10, safety: 8 },
    weather: 'storm', timeOfDay: 'afternoon', storeType: 'problem',
    specialRules: { understaffed: true },
    ambientPressureLevel: 'extreme', maxConcurrentEvents: 5
  }),
  c6_visit_never_comes: shift({
    id: 'c6_visit_never_comes', chapter: 6, shiftIndex: 1,
    difficulty: { ambientMult: 1.25, eventMult: 1.2, meterMult: 1.2 },
    meterOffsets: { scrutiny: 15, burnout: 10, queue: 10 },
    weather: 'clear', timeOfDay: 'morning', storeType: 'home',
    specialRules: { signatureShift: true, highScrutiny: true },
    ambientPressureLevel: 'extreme', maxConcurrentEvents: 4
  }),
  c6_district_resource: shift({
    id: 'c6_district_resource', chapter: 6, shiftIndex: 2,
    difficulty: { ambientMult: 1.3, eventMult: 1.25, meterMult: 1.2 },
    meterOffsets: { burnout: 12, scrutiny: 10, rage: 8 },
    weather: 'cold', timeOfDay: 'evening', storeType: 'float',
    eventWeightOverrides: { political: 1.5, corporate: 1.3 },
    ambientPressureLevel: 'extreme', maxConcurrentEvents: 5
  }),

  // ── Chapter 7: Final Shifts (6 lanes) ────────────────────────────
  c7_hold_it_together: shift({
    id: 'c7_hold_it_together', chapter: 7, shiftIndex: 0,
    difficulty: { ambientMult: 1.3, eventMult: 1.3, meterMult: 1.3 },
    meterOffsets: { burnout: 15, queue: 12, rage: 10 },
    weather: 'storm', timeOfDay: 'evening', storeType: 'home',
    specialRules: { understaffed: true },
    ambientPressureLevel: 'extreme', maxConcurrentEvents: 5
  }),
  c7_bigger_table: shift({
    id: 'c7_bigger_table', chapter: 7, shiftIndex: 1,
    difficulty: { ambientMult: 1.1, eventMult: 1.2, meterMult: 1.1 },
    meterOffsets: { scrutiny: 12, queue: 10 },
    weather: 'clear', timeOfDay: 'morning', storeType: 'home',
    eventWeightOverrides: { political: 1.6, corporate: 1.4 },
    ambientPressureLevel: 'high', maxConcurrentEvents: 4
  }),
  c7_last_day: shift({
    id: 'c7_last_day', chapter: 7, shiftIndex: 2,
    difficulty: { ambientMult: 0.8, eventMult: 0.8, meterMult: 0.9 },
    meterOffsets: { burnout: 20 },
    weather: 'cloudy', timeOfDay: 'afternoon', storeType: 'home',
    ambientPressureLevel: 'low', maxConcurrentEvents: 2
  }),
  c7_just_the_work: shift({
    id: 'c7_just_the_work', chapter: 7, shiftIndex: 3,
    difficulty: { ambientMult: 1.0, eventMult: 1.0, meterMult: 1.0 },
    weather: 'clear', timeOfDay: 'morning', storeType: 'home',
    ambientPressureLevel: 'medium', maxConcurrentEvents: 3
  }),
  c7_last_straw: shift({
    id: 'c7_last_straw', chapter: 7, shiftIndex: 4,
    difficulty: { ambientMult: 1.4, eventMult: 1.4, meterMult: 1.3 },
    meterOffsets: { burnout: 18, rage: 15, queue: 15, safety: 10, scrutiny: 10 },
    weather: 'snow', timeOfDay: 'night', storeType: 'problem',
    specialRules: { understaffed: true, extendedShift: true },
    ambientPressureLevel: 'extreme', maxConcurrentEvents: 5
  }),
  c7_one_more_time: shift({
    id: 'c7_one_more_time', chapter: 7, shiftIndex: 5,
    gameDuration: 420,
    difficulty: { ambientMult: 1.2, eventMult: 1.15, meterMult: 1.1 },
    meterOffsets: { burnout: 10, queue: 8 },
    weather: 'rain', timeOfDay: 'overnight', storeType: 'overnight',
    specialRules: { extendedShift: true },
    ambientPressureLevel: 'high', maxConcurrentEvents: 4
  })
};

/** Get all shifts for a given chapter number */
export function getShiftsForChapter(chapter) {
  return Object.values(SHIFT_CONFIGS).filter(s => s.chapter === chapter);
}

/** Get the signature shift for a chapter (if any) */
export function getSignatureShift(chapter) {
  return Object.values(SHIFT_CONFIGS).find(
    s => s.chapter === chapter && s.specialRules.signatureShift
  ) || null;
}
