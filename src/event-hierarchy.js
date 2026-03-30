/**
 * Event classification system - 3-tier event hierarchy.
 *
 * AMBIENT_PRESSURE  - daily background strain (phones, drive-thru, lunch mob, etc.)
 * PRESSURE_EVENTS   - common disruptive cards that matter but don't define the day
 * SIGNATURE_EVENTS  - the defining ordeal or set-piece of a shift
 */

// ── Tier enum ───────────────────────────────────────────────────────
export const EVENT_TIERS = Object.freeze({
  AMBIENT: 'ambient',
  PRESSURE: 'pressure',
  SIGNATURE: 'signature',
});

// ── Classification map ──────────────────────────────────────────────
// Every event ID in the game assigned to exactly one tier.

const AMBIENT_EVENTS = [
  'phone_hold', 'drive_order', 'insurance_reject', 'pickup_dispute',
  'lunch_rush', 'pa_fax', 'walk_in_vaccine', 'refill_too_early',
  'wrong_number', 'price_check', 'otc_question', 'bag_check',
  'pinpad_confused', 'regular_chat',
];

const PRESSURE_EVENTS = [
  'fake_script', 'pharmacist_callout', 'transfer_hold_hell', 'tech_late',
  'delivery_confusion', 'coupon_circus', 'lonely_caller_trap',
  'drive_shopping_request', 'compounding_request', 'med_sync',
  'partial_fill', 'wrong_patient', 'goodrx_warrior', 'hipaa_complaint',
  'side_effect_panic', 'supplement_interaction', 'insurance_hell',
  'insurance_disconnect', 'nurse_callback', 'wrong_window',
  'drive_payment_issue',
];

// Signature event IDs are defined in signature-events.js.
// We keep a reference list here so the classifier stays complete.
const SIGNATURE_EVENTS = [
  'sig_dea_audit', 'sig_system_meltdown', 'sig_flu_shot_frenzy', 'sig_karen_supreme',
  'sig_pharmacist_down', 'sig_the_long_wait', 'sig_opioid_dilemma', 'sig_power_outage',
  'sig_board_inspector', 'sig_the_recall',
];

// Build the lookup map
export const EVENT_CLASSIFICATIONS = Object.freeze(
  [
    ...AMBIENT_EVENTS.map(id => [id, EVENT_TIERS.AMBIENT]),
    ...PRESSURE_EVENTS.map(id => [id, EVENT_TIERS.PRESSURE]),
    ...SIGNATURE_EVENTS.map(id => [id, EVENT_TIERS.SIGNATURE]),
  ].reduce((map, [id, tier]) => { map[id] = tier; return map; }, {}),
);

// ── Queries ─────────────────────────────────────────────────────────

/**
 * Returns the tier for a given event ID, or undefined if unknown.
 */
export function getEventTier(eventId) {
  return EVENT_CLASSIFICATIONS[eventId];
}

/**
 * Returns an array of event IDs belonging to the requested tier.
 */
export function getEventsByTier(tier) {
  return Object.entries(EVENT_CLASSIFICATIONS)
    .filter(([, t]) => t === tier)
    .map(([id]) => id);
}

// ── Spawn-weight table (per shift phase) ────────────────────────────
// Values are normalised probabilities that sum to 1 per phase.

export const TIER_SPAWN_WEIGHTS = Object.freeze({
  OPENING: Object.freeze({
    [EVENT_TIERS.AMBIENT]: 0.80,
    [EVENT_TIERS.PRESSURE]: 0.20,
    [EVENT_TIERS.SIGNATURE]: 0.00,
  }),
  BUILDING: Object.freeze({
    [EVENT_TIERS.AMBIENT]: 0.60,
    [EVENT_TIERS.PRESSURE]: 0.35,
    [EVENT_TIERS.SIGNATURE]: 0.05,
  }),
  LUNCH_CLOSE: Object.freeze({
    [EVENT_TIERS.AMBIENT]: 1.00,
    [EVENT_TIERS.PRESSURE]: 0.00,
    [EVENT_TIERS.SIGNATURE]: 0.00,
  }),
  REOPEN_RUSH: Object.freeze({
    [EVENT_TIERS.AMBIENT]: 0.40,
    [EVENT_TIERS.PRESSURE]: 0.50,
    [EVENT_TIERS.SIGNATURE]: 0.10,
  }),
  LATE_DRAG: Object.freeze({
    [EVENT_TIERS.AMBIENT]: 0.50,
    [EVENT_TIERS.PRESSURE]: 0.40,
    [EVENT_TIERS.SIGNATURE]: 0.10,
  }),
});

// ── Signature spawn gating ──────────────────────────────────────────

const TUTORIAL_SHIFTS = new Set([0]); // shift index 0 is always tutorial
const SIGNATURE_TARGET_SHIFT = 2;     // 3rd shift (0-indexed) is the standout

/**
 * Determines whether a signature event is allowed to spawn right now.
 *
 * Rules:
 *  - Never during tutorial shifts.
 *  - Maximum one signature event per shift.
 *  - Each chapter should have roughly one standout signature shift,
 *    usually the 3rd shift (index 2). Other shifts *can* get one at
 *    reduced probability but it is not guaranteed.
 *
 * @param {number} chapter       - Current chapter number (0-based).
 * @param {number} shiftIndex    - Shift index within the chapter (0-based).
 * @param {Array}  currentEvents - Array of active event objects this shift.
 * @returns {{ allowed: boolean, weight: number }}
 *   `allowed` - hard gate; if false, never spawn.
 *   `weight`  - multiplier (0-1) to scale the base signature weight.
 */
export function shouldSpawnSignature(chapter, shiftIndex, currentEvents) {
  // Never in tutorial shifts
  if (TUTORIAL_SHIFTS.has(shiftIndex)) {
    return { allowed: false, weight: 0 };
  }

  // Max one signature per shift
  const hasSignature = (currentEvents || []).some(
    e => getEventTier(e.id) === EVENT_TIERS.SIGNATURE,
  );
  if (hasSignature) {
    return { allowed: false, weight: 0 };
  }

  // The target shift gets full weight; others get a reduced chance
  const isTargetShift = shiftIndex === SIGNATURE_TARGET_SHIFT;
  const weight = isTargetShift ? 1.0 : 0.25;

  return { allowed: true, weight };
}
