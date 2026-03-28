/**
 * Event pool and escalation logic.
 * Each event has: station, title, description, duration, meter effects,
 * whether it can be deferred, and its escalated version.
 */

import { DEFER_RETURN_MIN, DEFER_RETURN_MAX } from './constants.js';

// Event definitions
const EVENT_POOL = {
  // ========== VERIFY STATION ==========
  verify: [
    {
      id: 'insurance_reject',
      title: 'INSURANCE REJECT',
      desc: 'Claim denied. Patient confused.',
      station: 'verify',
      duration: 9,
      effects: { queue: -5, rage: -8, burnout: 4 },
      ignoreEffects: { rage: 6 },
      canDefer: false,
      escalatesTo: 'insurance_meltdown',
    },
    {
      id: 'prior_auth',
      title: 'PRIOR AUTH NEEDED',
      desc: "Doctor's office isn't answering.",
      station: 'verify',
      duration: 7,
      effects: { queue: -4, rage: -3, burnout: 3 },
      ignoreEffects: { rage: 4, queue: 3 },
      canDefer: true,
      escalatesTo: 'prior_auth_urgent',
    },
    {
      id: 'just_do_it',
      title: 'JUST DO IT',
      desc: "Patient wants override you can't do.",
      station: 'verify',
      duration: 6,
      effects: { queue: -3, rage: -10, burnout: 5 },
      ignoreEffects: { rage: 8 },
      canDefer: false,
    },
    {
      id: 'wrong_drug',
      title: 'WRONG DRUG',
      desc: 'Prescriber sent wrong med.',
      station: 'verify',
      duration: 8,
      effects: { queue: -5, rage: -4, burnout: 4 },
      ignoreEffects: { rage: 5, queue: 4 },
      canDefer: true,
      escalatesTo: 'wrong_drug_urgent',
    },
  ],

  // ========== PICKUP STATION ==========
  pickup: [
    {
      id: 'price_dispute',
      title: 'PRICE DISPUTE',
      desc: '"That\'s not what I was told."',
      station: 'pickup',
      duration: 7,
      effects: { queue: -3, rage: -8, burnout: 3 },
      ignoreEffects: { rage: 7 },
      canDefer: false,
    },
    {
      id: 'sticky_regular',
      title: 'STICKY REGULAR',
      desc: '"You always help me with this."',
      station: 'pickup',
      duration: 10,
      effects: { queue: -2, rage: -5, burnout: 5 },
      ignoreEffects: { rage: 4, queue: 5 },
      canDefer: false,
      escalatesTo: 'regular_offended',
    },
    {
      id: 'since_im_here',
      title: "SINCE I'M HERE…",
      desc: '3 more requests at counter.',
      station: 'pickup',
      duration: 8,
      effects: { queue: -4, rage: -4, burnout: 4 },
      ignoreEffects: { rage: 3, queue: 4 },
      canDefer: true,
      escalatesTo: 'still_going',
    },
    {
      id: 'pinpad_confusion',
      title: 'PINPAD CONFUSION',
      desc: '"What do I press?"',
      station: 'pickup',
      duration: 4,
      effects: { queue: -2, rage: -3, burnout: 1 },
      ignoreEffects: { rage: 3 },
      canDefer: false,
    },
  ],

  // ========== CONSULT STATION ==========
  consult: [
    {
      id: 'counsel_required',
      title: 'COUNSEL REQUIRED',
      desc: 'New med, legal requirement.',
      station: 'consult',
      duration: 8,
      effects: { queue: -3, rage: -4, burnout: 3 },
      ignoreEffects: { rage: 5, burnout: 2 },
      canDefer: true,
      escalatesTo: 'skipped_counsel',
    },
    {
      id: 'quick_question',
      title: 'QUICK QUESTION',
      desc: 'Never just one.',
      station: 'consult',
      duration: 9,
      effects: { queue: -2, rage: -5, burnout: 4 },
      ignoreEffects: { rage: 4 },
      canDefer: true,
      escalatesTo: 'still_asking',
    },
    {
      id: 'wrong_window',
      title: 'WRONG WINDOW',
      desc: "Everyone's confused.",
      station: 'consult',
      duration: 4,
      effects: { queue: -2, rage: -2, burnout: 1 },
      ignoreEffects: { rage: 2 },
      canDefer: false,
    },
    {
      id: 'aisle_help',
      title: 'AISLE HELP',
      desc: 'Find an OTC item.',
      station: 'consult',
      duration: 7,
      effects: { queue: -2, rage: -4, burnout: 3 },
      ignoreEffects: { rage: 3 },
      canDefer: true,
      escalatesTo: 'aisle_help_angry',
    },
  ],

  // ========== PHONE STATION ==========
  phone: [
    {
      id: 'patient_callback',
      title: 'PATIENT CALLBACK',
      desc: 'Wants info about meds.',
      station: 'phone',
      duration: 8,
      effects: { queue: -2, rage: -5, burnout: 3 },
      ignoreEffects: { rage: 5 },
      canDefer: true,
      escalatesTo: 'called_again',
    },
    {
      id: 'doctor_calling',
      title: 'DOCTOR CALLING',
      desc: 'New order incoming.',
      station: 'phone',
      duration: 6,
      effects: { queue: -3, rage: -3, burnout: 2 },
      ignoreEffects: { rage: 4, queue: 3 },
      canDefer: false,
      addsScript: true,
    },
    {
      id: 'transfer_request',
      title: 'TRANSFER REQUEST',
      desc: 'Rx transfer from another pharmacy.',
      station: 'phone',
      duration: 7,
      effects: { queue: -3, rage: -3, burnout: 3 },
      ignoreEffects: { rage: 4 },
      canDefer: true,
      addsScript: true,
      escalatesTo: 'transfer_angry',
    },
    {
      id: 'never_answer',
      title: 'NEVER ANSWER',
      desc: 'Patient furious about calls.',
      station: 'phone',
      duration: 6,
      effects: { queue: -1, rage: -10, burnout: 4 },
      ignoreEffects: { rage: 8 },
      canDefer: false,
    },
  ],

  // ========== DRIVE-THRU ==========
  drive: [
    {
      id: 'drive_order',
      title: 'DRIVE-THRU ORDER',
      desc: 'Shopping through window.',
      station: 'drive',
      duration: 8,
      effects: { queue: -6, rage: -4, burnout: 3 },
      ignoreEffects: { rage: 4, queue: 5 },
      canDefer: false,
    },
    {
      id: 'delivery_mixup',
      title: 'DELIVERY MIX-UP',
      desc: '"Wasn\'t this delivered?"',
      station: 'drive',
      duration: 5,
      effects: { queue: -2, rage: -4, burnout: 2 },
      ignoreEffects: { rage: 4 },
      canDefer: true,
      escalatesTo: 'delivery_angry',
    },
    {
      id: 'three_cars',
      title: '3 CARS DEEP',
      desc: 'Drive-thru backing up.',
      station: 'drive',
      duration: 6,
      effects: { queue: -7, rage: -6, burnout: 4 },
      ignoreEffects: { rage: 6, queue: 6 },
      canDefer: false,
    },
  ],

  // ========== NOT MY PROBLEM INTERRUPTS ==========
  interrupt: [
    {
      id: 'bathroom_key',
      title: 'BATHROOM KEY',
      desc: '"Where\'s the bathroom?"',
      station: 'pickup', // happens at counter
      duration: 2,
      effects: { burnout: 1 },
      ignoreEffects: { rage: 2 },
      canDefer: false,
      isInterrupt: true,
    },
    {
      id: 'front_register',
      title: 'FRONT REGISTER',
      desc: '"Can you check me out?"',
      station: 'pickup',
      duration: 3,
      effects: { burnout: 2 },
      ignoreEffects: { rage: 3 },
      canDefer: false,
      isInterrupt: true,
    },
    {
      id: 'wheres_the',
      title: "WHERE'S THE…",
      desc: '"Where\'s the Tylenol?"',
      station: 'consult',
      duration: 2,
      effects: { burnout: 1 },
      ignoreEffects: { rage: 2 },
      canDefer: false,
      isInterrupt: true,
    },
    {
      id: 'store_complaint',
      title: 'STORE COMPLAINT',
      desc: '"This store is always slow."',
      station: 'consult',
      duration: 3,
      effects: { rage: -2, burnout: 2 },
      ignoreEffects: { rage: 5 },
      canDefer: false,
      isInterrupt: true,
    },
    {
      id: 'flu_shot',
      title: 'FLU SHOT WALK-IN',
      desc: '"Can I just get one quick?"',
      station: 'consult',
      duration: 4,
      effects: { burnout: 2, queue: -1 },
      ignoreEffects: { rage: 3 },
      canDefer: false,
      isInterrupt: true,
    },
    {
      id: 'coupon_question',
      title: 'COUPON QUESTION',
      desc: '"Does this work on prescriptions?"',
      station: 'pickup',
      duration: 2,
      effects: { burnout: 1 },
      ignoreEffects: { rage: 2 },
      canDefer: false,
      isInterrupt: true,
    },
  ],
};

// Escalated event variants
const ESCALATED_EVENTS = {
  insurance_meltdown: {
    id: 'insurance_meltdown',
    title: 'INSURANCE MELTDOWN',
    desc: '"I need to speak to SOMEONE."',
    station: 'verify',
    duration: 7,
    effects: { queue: -4, rage: -12, burnout: 6 },
    ignoreEffects: { rage: 10 },
    canDefer: false,
    isEscalated: true,
  },
  prior_auth_urgent: {
    id: 'prior_auth_urgent',
    title: 'PRIOR AUTH URGENT',
    desc: 'Patient needs meds today. Doctor still MIA.',
    station: 'verify',
    duration: 9,
    effects: { queue: -5, rage: -8, burnout: 5 },
    ignoreEffects: { rage: 8 },
    canDefer: false,
    isEscalated: true,
  },
  wrong_drug_urgent: {
    id: 'wrong_drug_urgent',
    title: 'WRONG DRUG — PATIENT HERE',
    desc: 'They drove 20 minutes.',
    station: 'verify',
    duration: 8,
    effects: { queue: -5, rage: -10, burnout: 5 },
    ignoreEffects: { rage: 9 },
    canDefer: false,
    isEscalated: true,
  },
  regular_offended: {
    id: 'regular_offended',
    title: 'REGULAR OFFENDED',
    desc: '"I come here EVERY week."',
    station: 'pickup',
    duration: 8,
    effects: { queue: -3, rage: -9, burnout: 5 },
    ignoreEffects: { rage: 8 },
    canDefer: false,
    isEscalated: true,
  },
  still_going: {
    id: 'still_going',
    title: 'STILL GOING',
    desc: 'Line growing behind them.',
    station: 'pickup',
    duration: 10,
    effects: { queue: -6, rage: -6, burnout: 5 },
    ignoreEffects: { rage: 7, queue: 6 },
    canDefer: false,
    isEscalated: true,
  },
  skipped_counsel: {
    id: 'skipped_counsel',
    title: 'SKIPPED COUNSEL',
    desc: 'Corporate will hear about this.',
    station: 'consult',
    duration: 8,
    effects: { queue: -2, rage: -6, burnout: 7 },
    ignoreEffects: { rage: 8, burnout: 3 },
    canDefer: false,
    isEscalated: true,
  },
  still_asking: {
    id: 'still_asking',
    title: 'STILL ASKING',
    desc: 'They have a list now.',
    station: 'consult',
    duration: 10,
    effects: { queue: -3, rage: -7, burnout: 5 },
    ignoreEffects: { rage: 6 },
    canDefer: false,
    isEscalated: true,
  },
  aisle_help_angry: {
    id: 'aisle_help_angry',
    title: 'STILL LOOKING',
    desc: '"Can\'t anyone help around here?"',
    station: 'consult',
    duration: 6,
    effects: { queue: -2, rage: -8, burnout: 3 },
    ignoreEffects: { rage: 7 },
    canDefer: false,
    isEscalated: true,
  },
  called_again: {
    id: 'called_again',
    title: 'CALLED AGAIN',
    desc: 'Third time calling today.',
    station: 'phone',
    duration: 7,
    effects: { queue: -2, rage: -8, burnout: 4 },
    ignoreEffects: { rage: 8 },
    canDefer: true,
    escalatesTo: 'at_counter_angry',
    isEscalated: true,
  },
  at_counter_angry: {
    id: 'at_counter_angry',
    title: 'AT COUNTER ANGRY',
    desc: '"I drove here because you never answer."',
    station: 'pickup',
    duration: 8,
    effects: { queue: -3, rage: -12, burnout: 6 },
    ignoreEffects: { rage: 12 },
    canDefer: false,
    isEscalated: true,
  },
  transfer_angry: {
    id: 'transfer_angry',
    title: 'TRANSFER ANGRY',
    desc: '"My other pharmacy had it YESTERDAY."',
    station: 'phone',
    duration: 8,
    effects: { queue: -3, rage: -10, burnout: 5 },
    ignoreEffects: { rage: 9 },
    canDefer: false,
    isEscalated: true,
    addsScript: true,
  },
  delivery_angry: {
    id: 'delivery_angry',
    title: 'DELIVERY FURIOUS',
    desc: '"I\'m blocking the lane until this is fixed."',
    station: 'drive',
    duration: 7,
    effects: { queue: -4, rage: -10, burnout: 5 },
    ignoreEffects: { rage: 9, queue: 5 },
    canDefer: false,
    isEscalated: true,
  },
};

// Get a random event for a given station pool
export function getRandomEvent(stationType, phaseName) {
  const pool = EVENT_POOL[stationType];
  if (!pool || pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return { ...pool[idx] };
}

// Get a random event from any pool, weighted by phase
export function getRandomEventAny(phaseName) {
  // Weight interrupt events lower in early phases
  const pools = ['verify', 'pickup', 'consult', 'phone', 'drive'];
  const interruptChance = phaseName === 'OPENING' ? 0.1 :
                          phaseName === 'BUILDING' ? 0.2 :
                          phaseName === 'REOPEN_RUSH' ? 0.3 : 0.25;

  if (Math.random() < interruptChance) {
    const pool = EVENT_POOL.interrupt;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  const poolKey = pools[Math.floor(Math.random() * pools.length)];
  return getRandomEvent(poolKey, phaseName);
}

// Get escalated version of an event
export function getEscalatedEvent(originalEvent) {
  if (originalEvent.escalatesTo && ESCALATED_EVENTS[originalEvent.escalatesTo]) {
    return { ...ESCALATED_EVENTS[originalEvent.escalatesTo] };
  }
  // If no specific escalation, return same event with worse effects
  return {
    ...originalEvent,
    title: originalEvent.title + ' (AGAIN)',
    duration: Math.max(originalEvent.duration - 1, 3),
    effects: {
      queue: (originalEvent.effects.queue || 0) * 1.3,
      rage: (originalEvent.effects.rage || 0) * 1.3,
      burnout: (originalEvent.effects.burnout || 0) * 1.3,
    },
    ignoreEffects: {
      rage: (originalEvent.ignoreEffects?.rage || 0) * 1.5,
      queue: (originalEvent.ignoreEffects?.queue || 0) * 1.5,
      burnout: (originalEvent.ignoreEffects?.burnout || 0) * 1.5,
    },
    canDefer: false,
    isEscalated: true,
  };
}

// Get defer return time
export function getDeferTime() {
  return DEFER_RETURN_MIN + Math.random() * (DEFER_RETURN_MAX - DEFER_RETURN_MIN);
}
