/**
 * Event pool and escalation logic.
 * Each event has: station, title, description, duration, meter effects,
 * whether it can be deferred, and its escalated version.
 */

import { DEFER_RETURN_MIN, DEFER_RETURN_MAX } from './constants.js';
import { EVENT_CLASSIFICATIONS, EVENT_TIERS, TIER_SPAWN_WEIGHTS, getEventTier } from './event-hierarchy.js';
import { AMBIENT_EVENTS } from './ambient-events-expanded.js';
import { PRESSURE_EVENTS } from './pressure-events-expanded.js';
import { SIGNATURE_EVENTS } from './signature-events.js';

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
      id: 'controlled_count',
      title: 'CONTROLLED COUNT',
      desc: 'Narcotics count is off by two.',
      station: 'verify',
      duration: 10,
      effects: { queue: -3, rage: -2, burnout: 7, safety: -5 },
      ignoreEffects: { burnout: 5, queue: 3, safety: 6, scrutiny: 4 },
      canDefer: true,
      escalatesTo: 'controlled_audit',
    },
    {
      id: 'wrong_drug',
      title: 'WRONG DRUG',
      desc: 'Prescriber sent wrong med.',
      station: 'verify',
      duration: 8,
      effects: { queue: -5, rage: -4, burnout: 4, safety: -6 },
      ignoreEffects: { rage: 5, queue: 4, safety: 8 },
      canDefer: true,
      escalatesTo: 'wrong_drug_urgent',
    },
    {
      id: 'compounding_request',
      title: 'COMPOUNDING REQUEST',
      desc: 'Patient needs custom cream. You don\'t compound.',
      station: 'verify',
      duration: 8,
      effects: { queue: -4, rage: -6, burnout: 5 },
      ignoreEffects: { rage: 7, burnout: 3 },
      canDefer: true,
      escalatesTo: 'compounding_urgent',
    },
    {
      id: 'compounding_urgent',
      title: 'COMPOUNDING CRISIS',
      desc: 'They drove 40 minutes. They need it TODAY.',
      station: 'verify',
      duration: 10,
      effects: { queue: -6, rage: -10, burnout: 6 },
      ignoreEffects: { rage: 10, scrutiny: 3 },
      canDefer: false,
    },
    {
      id: 'vaccine_walk_in',
      title: 'WALK-IN VACCINE',
      desc: 'No appointment. Wants COVID + flu + shingles.',
      station: 'verify',
      duration: 12,
      effects: { queue: -6, rage: -4, burnout: 8, safety: -3 },
      ignoreEffects: { rage: 5, queue: 4 },
      canDefer: true,
    },
    {
      id: 'med_sync',
      title: 'MED SYNC REQUEST',
      desc: 'Patient wants all 12 meds on same fill date.',
      station: 'verify',
      duration: 11,
      effects: { queue: -5, rage: -3, burnout: 8 },
      ignoreEffects: { rage: 4, burnout: 4 },
      canDefer: true,
    },
    {
      id: 'partial_fill',
      title: 'PARTIAL FILL',
      desc: 'Wholesaler shortage. Only have 14 of 30.',
      station: 'verify',
      duration: 7,
      effects: { queue: -3, rage: -5, burnout: 4 },
      ignoreEffects: { rage: 6, scrutiny: 2 },
      canDefer: false,
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
      id: 'refund_dispute',
      title: 'REFUND DISPUTE',
      desc: '"I returned this last week."',
      station: 'pickup',
      duration: 8,
      effects: { queue: -4, rage: -9, burnout: 4 },
      ignoreEffects: { rage: 7, queue: 3 },
      canDefer: true,
      escalatesTo: 'refund_manager',
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
    {
      id: 'wrong_patient',
      title: 'WRONG PATIENT',
      desc: 'Two John Smiths. You grabbed the wrong one.',
      station: 'pickup',
      duration: 8,
      effects: { queue: -4, rage: -6, safety: -8, burnout: 4 },
      ignoreEffects: { safety: 10, scrutiny: 5 },
      canDefer: false,
    },
    {
      id: 'goodrx_warrior',
      title: 'GOODRX WARRIOR',
      desc: '"The app says $7.43. Why is it $312?"',
      station: 'pickup',
      duration: 9,
      effects: { queue: -5, rage: -8, burnout: 6 },
      ignoreEffects: { rage: 8, queue: 4 },
      canDefer: false,
    },
    {
      id: 'hipaa_complaint',
      title: 'HIPAA COMPLAINT',
      desc: '"You said my name too loud."',
      station: 'pickup',
      duration: 6,
      effects: { queue: -2, rage: -6, scrutiny: -5, burnout: 3 },
      ignoreEffects: { scrutiny: 7, rage: 4 },
      canDefer: false,
    },
    {
      id: 'bag_check',
      title: 'BAG CHECK',
      desc: 'Patient opens bag, questions every single item.',
      station: 'pickup',
      duration: 10,
      effects: { queue: -6, rage: -3, burnout: 5 },
      ignoreEffects: { rage: 5, queue: 5 },
      canDefer: false,
    },
    {
      id: 'otc_recommendation',
      title: 'OTC ADVICE',
      desc: '"Which cold medicine is best? List them all."',
      station: 'pickup',
      duration: 7,
      effects: { queue: -4, rage: -4, burnout: 3 },
      ignoreEffects: { rage: 3, queue: 2 },
      canDefer: true,
      escalatesTo: 'otc_escalated',
    },
    {
      id: 'otc_escalated',
      title: 'OTC MELTDOWN',
      desc: '"I bought the wrong one. I need a refund AND advice."',
      station: 'pickup',
      duration: 9,
      effects: { queue: -6, rage: -8, burnout: 5 },
      ignoreEffects: { rage: 9 },
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
      effects: { queue: -3, rage: -4, burnout: 3, safety: -3 },
      ignoreEffects: { rage: 5, burnout: 2, safety: 5, scrutiny: 3 },
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
    {
      id: 'side_effect_panic',
      title: 'SIDE EFFECT PANIC',
      desc: '"I Googled my medication. Am I dying?"',
      station: 'consult',
      duration: 8,
      effects: { queue: -3, rage: -4, burnout: 5, safety: -2 },
      ignoreEffects: { rage: 5, safety: 3 },
      canDefer: true,
    },
    {
      id: 'supplement_interaction',
      title: 'SUPPLEMENT CHECK',
      desc: 'Patient takes 15 supplements. Wants interaction check.',
      station: 'consult',
      duration: 12,
      effects: { queue: -5, rage: -2, burnout: 8, safety: -4 },
      ignoreEffects: { safety: 5, burnout: 4 },
      canDefer: true,
    },
    {
      id: 'new_diagnosis',
      title: 'NEW DIAGNOSIS',
      desc: 'Patient just got diagnosed. Needs everything explained.',
      station: 'consult',
      duration: 10,
      effects: { queue: -4, rage: -2, burnout: 6 },
      ignoreEffects: { rage: 3, burnout: 3 },
      canDefer: false,
    },
    {
      id: 'med_disposal',
      title: 'MED DISPOSAL',
      desc: 'Elderly patient brought a grocery bag of expired meds.',
      station: 'consult',
      duration: 8,
      effects: { queue: -3, rage: -1, burnout: 5, safety: -3 },
      ignoreEffects: { scrutiny: 3, safety: 4 },
      canDefer: true,
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
    {
      id: 'insurance_hell',
      title: 'INSURANCE HOLD',
      desc: 'On hold with insurance. Elevator music plays.',
      station: 'phone',
      duration: 15,
      effects: { queue: -4, rage: -2, burnout: 10 },
      ignoreEffects: { burnout: 6, queue: 5 },
      canDefer: true,
      escalatesTo: 'insurance_disconnect',
    },
    {
      id: 'insurance_disconnect',
      title: 'DISCONNECTED',
      desc: 'After 12 minutes on hold. They hung up.',
      station: 'phone',
      duration: 15,
      effects: { queue: -5, rage: -3, burnout: 12 },
      ignoreEffects: { burnout: 8, rage: 5 },
      canDefer: false,
    },
    {
      id: 'nurse_callback',
      title: 'NURSE CALLBACK',
      desc: 'Nurse wants to change dose. Can\'t find the chart.',
      station: 'phone',
      duration: 9,
      effects: { queue: -3, rage: -2, burnout: 5, safety: -3 },
      ignoreEffects: { safety: 5, burnout: 3 },
      canDefer: true,
    },
    {
      id: 'patient_refill_call',
      title: 'REFILL BY PHONE',
      desc: '"I can\'t use the app. Can you take all 8 refills?"',
      station: 'phone',
      duration: 10,
      effects: { queue: -5, rage: -3, burnout: 6 },
      ignoreEffects: { queue: 4, burnout: 3 },
      canDefer: true,
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
    {
      id: 'honking',
      title: 'HONKING',
      desc: 'Car behind is laying on the horn.',
      station: 'drive',
      duration: 4,
      effects: { queue: -3, rage: -6, burnout: 3 },
      ignoreEffects: { rage: 5, burnout: 2 },
      canDefer: false,
    },
    {
      id: 'wrong_window_drive',
      title: 'WRONG PHARMACY',
      desc: '"This isn\'t the Walgreens?"',
      station: 'drive',
      duration: 3,
      effects: { queue: -1, rage: -2, burnout: 1 },
      ignoreEffects: { rage: 2 },
      canDefer: false,
    },
    {
      id: 'wrong_window',
      title: 'WRONG LANE',
      desc: 'Patient at drive-thru wants to drop off. Not pick up.',
      station: 'drive',
      duration: 6,
      effects: { queue: -3, rage: -5, burnout: 3 },
      ignoreEffects: { rage: 6 },
      canDefer: false,
    },
    {
      id: 'drive_consult',
      title: 'DRIVE-THRU CONSULT',
      desc: 'Full medication review... through a window... in rain.',
      station: 'drive',
      duration: 11,
      effects: { queue: -6, rage: -4, burnout: 7, safety: -2 },
      ignoreEffects: { rage: 5, burnout: 4 },
      canDefer: false,
    },
    {
      id: 'car_line',
      title: 'CAR LINE BACKUP',
      desc: 'Drive-thru line is blocking the parking lot.',
      station: 'drive',
      duration: 7,
      effects: { queue: -8, rage: -6, burnout: 3 },
      ignoreEffects: { rage: 8, queue: 6 },
      canDefer: true,
    },
    {
      id: 'drive_payment_issue',
      title: 'PAYMENT DECLINE',
      desc: 'Card declined. Patient searching car for cash.',
      station: 'drive',
      duration: 8,
      effects: { queue: -5, rage: -4, burnout: 4 },
      ignoreEffects: { rage: 5, queue: 3 },
      canDefer: false,
    },
  ],

  // ========== POSITIVE EVENTS (random moments of relief) ==========
  positive: [
    {
      id: 'nice_patient',
      title: 'KIND WORDS',
      desc: '"You\'re doing great. Thank you."',
      station: 'pickup',
      duration: 3,
      effects: { burnout: -8, rage: -5 },
      ignoreEffects: {},
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'cookies_from_patient',
      title: 'COOKIES!',
      desc: 'Regular brought homemade cookies for the whole team.',
      station: 'pickup',
      duration: 2,
      effects: { burnout: -6, rage: -3 },
      ignoreEffects: {},
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'good_review',
      title: 'FIVE-STAR REVIEW',
      desc: 'Patient left a glowing Google review mentioning you by name.',
      station: 'consult',
      duration: 2,
      effects: { burnout: -5, scrutiny: -4 },
      ignoreEffects: {},
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'helpful_tech',
      title: 'HELPFUL TECH',
      desc: 'Tech anticipated the rush and pre-filled the fast movers.',
      station: 'verify',
      duration: 3,
      effects: { queue: -6, burnout: -4 },
      ignoreEffects: {},
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'smooth_insurance',
      title: 'SMOOTH INSURANCE',
      desc: 'Prior auth approved on first call. In under 2 minutes.',
      station: 'phone',
      duration: 2,
      effects: { burnout: -5, queue: -4, rage: -2 },
      ignoreEffects: {},
      canDefer: false,
      isPositive: true,
    },
  ],

  // ========== TRUE POSITIVE EVENTS (genuinely good moments) ==========
  truePositive: [
    {
      id: 'rockstar_tech',
      title: 'ROCKSTAR TECH',
      desc: 'Tech handled 5 scripts while you were on the phone.',
      station: 'verify',
      duration: 3,
      effects: { queue: -6, burnout: -3, safety: -2 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'clinical_save',
      title: 'CLINICAL SAVE',
      desc: 'You caught a dangerous interaction.',
      station: 'verify',
      duration: 4,
      effects: { safety: -8, scrutiny: -3, burnout: -2 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'patient_defends',
      title: 'PATIENT DEFENDS YOU',
      desc: "'Leave them alone, they're doing their best.'",
      station: 'pickup',
      duration: 2,
      effects: { rage: -6, burnout: -4 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'they_apologize',
      title: 'THEY APOLOGIZE',
      desc: "'I'm sorry I yelled. Bad day.'",
      station: 'pickup',
      duration: 2,
      effects: { rage: -5, burnout: -3 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'real_thank_you',
      title: 'REAL THANK YOU',
      desc: 'Patient wrote a card. By hand.',
      station: 'pickup',
      duration: 2,
      effects: { burnout: -5, scrutiny: -2 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'training_paid_off',
      title: 'TRAINING PAID OFF',
      desc: 'New tech just handled a crisis solo.',
      station: 'verify',
      duration: 3,
      effects: { queue: -4, burnout: -3, safety: -2 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'true_doctor_moment',
      title: 'TRUE DOCTOR MOMENT',
      desc: 'Your clinical knowledge genuinely helped someone.',
      station: 'consult',
      duration: 4,
      effects: { burnout: -5, scrutiny: -3, safety: -3 },
      canDefer: false,
      isPositive: true,
    },
  ],

  // ========== RELIEF EVENTS (temporary breathing room) ==========
  relief: [
    {
      id: 'phone_pause',
      title: 'PHONE PAUSE',
      desc: 'Phones went quiet. Enjoy it.',
      station: 'phone',
      duration: 2,
      effects: { burnout: -2, queue: -2 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'quiet_five',
      title: 'QUIET FIVE MINUTES',
      desc: "Nobody's yelling. Suspicious.",
      station: 'verify',
      duration: 2,
      effects: { burnout: -2 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'line_thins',
      title: 'LINE THINS OUT',
      desc: 'Wait... is no one in line?',
      station: 'pickup',
      duration: 2,
      effects: { queue: -5, rage: -3 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'smooth_reopen',
      title: 'SMOOTH REOPEN',
      desc: "Post-lunch rush wasn't as bad as expected.",
      station: 'pickup',
      duration: 3,
      effects: { queue: -4, rage: -4 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'insurance_goes_through',
      title: 'INSURANCE GOES THROUGH',
      desc: 'First try. No prior auth.',
      station: 'verify',
      duration: 2,
      effects: { queue: -3, burnout: -1 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'batch_ready',
      title: 'BATCH VERIFY',
      desc: 'Quick batch — 3 scripts ready at once.',
      station: 'verify',
      duration: 5,
      effects: { queue: -8, burnout: 1 },
      canDefer: false,
      isPositive: true,
    },
  ],

  // ========== COMIC EVENTS (humor and humanity) ==========
  comic: [
    {
      id: 'drive_thru_dog',
      title: 'DRIVE-THRU DOG',
      desc: 'Dog in the car. Very excited to see you.',
      station: 'drive',
      duration: 2,
      effects: { burnout: -3 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'coworker_joke',
      title: 'COWORKER ONE-LINER',
      desc: "Tech: 'If I wanted abuse, I'd call my ex.'",
      station: 'verify',
      duration: 1,
      effects: { burnout: -2 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'harmless_weird',
      title: 'HARMLESS WEIRD',
      desc: 'Patient wants to know if you sell live fish.',
      station: 'consult',
      duration: 2,
      effects: { burnout: -1 },
      canDefer: false,
      isPositive: true,
    },
    {
      id: 'kid_waves',
      title: 'KID WAVES',
      desc: "Little kid at pickup waves and says 'hi doctor.'",
      station: 'pickup',
      duration: 1,
      effects: { burnout: -2 },
      canDefer: false,
      isPositive: true,
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
    {
      id: 'super_glue',
      title: "WHERE'S THE SUPER GLUE?",
      desc: '"It used to be in aisle 4."',
      station: 'consult',
      duration: 2,
      effects: { burnout: 2 },
      ignoreEffects: { rage: 2 },
      canDefer: false,
      isInterrupt: true,
    },
    {
      id: 'not_my_dept',
      title: 'NOT MY DEPARTMENT',
      desc: 'Front store radio: "Pharmacy, line 2."',
      station: 'phone',
      duration: 3,
      effects: { burnout: 2 },
      ignoreEffects: { rage: 3 },
      canDefer: false,
      isInterrupt: true,
    },
  ],

  // ========== LEADERSHIP / CORPORATE PRESSURE ==========
  leadership: [
    {
      id: 'dm_visit',
      title: 'DM SURPRISE VISIT',
      desc: 'District manager just walked in.',
      station: 'consult',
      duration: 10,
      effects: { scrutiny: -10, burnout: 6, rage: -2 },
      ignoreEffects: { scrutiny: 12, burnout: 4 },
      canDefer: false,
    },
    {
      id: 'metrics_call',
      title: 'METRICS CALL',
      desc: '"Why are your numbers slipping?"',
      station: 'phone',
      duration: 8,
      effects: { scrutiny: -8, burnout: 5 },
      ignoreEffects: { scrutiny: 10 },
      canDefer: true,
      escalatesTo: 'metrics_escalation',
    },
    {
      id: 'urgent_email',
      title: 'URGENT EMAIL',
      desc: 'Corporate wants a response. Today.',
      station: 'verify',
      duration: 6,
      effects: { scrutiny: -6, burnout: 4 },
      ignoreEffects: { scrutiny: 8 },
      canDefer: true,
      escalatesTo: 'email_followup',
    },
    {
      id: 'complaint_filed',
      title: 'COMPLAINT FILED',
      desc: 'Patient filed formal complaint.',
      station: 'pickup',
      duration: 7,
      effects: { scrutiny: -7, rage: -4, burnout: 5 },
      ignoreEffects: { scrutiny: 9, rage: 5 },
      canDefer: false,
    },
    {
      id: 'survey_score',
      title: 'LOW SURVEY SCORE',
      desc: 'NPS dropped below threshold.',
      station: 'verify',
      duration: 5,
      effects: { scrutiny: -5, burnout: 3 },
      ignoreEffects: { scrutiny: 7 },
      canDefer: true,
    },
  ],

  // ========== INSURANCE / PAYMENT CHAOS ==========
  insurance: [
    {
      id: 'prior_auth_wall',
      title: 'PRIOR AUTH WALL',
      desc: 'Insurance wants 3 forms for 1 pill.',
      station: 'verify',
      duration: 9,
      effects: { queue: -5, rage: -6, burnout: 5, scrutiny: 2 },
      ignoreEffects: { rage: 7, queue: 4 },
      canDefer: true,
      escalatesTo: 'prior_auth_meltdown',
    },
    {
      id: 'free_last_time',
      title: '"IT WAS FREE LAST TIME"',
      desc: 'Copay changed. Patient in denial.',
      station: 'pickup',
      duration: 7,
      effects: { rage: -8, burnout: 3 },
      ignoreEffects: { rage: 8 },
      canDefer: false,
    },
    {
      id: 'goodrx_drama',
      title: 'GOODRX SAYS $7',
      desc: '"But your price is $47."',
      station: 'pickup',
      duration: 6,
      effects: { queue: -3, rage: -6, burnout: 3 },
      ignoreEffects: { rage: 6 },
      canDefer: false,
    },
    {
      id: 'insurance_lapsed',
      title: 'INSURANCE LAPSED',
      desc: 'Card expired. Patient didn\'t know.',
      station: 'verify',
      duration: 8,
      effects: { queue: -4, rage: -7, burnout: 4 },
      ignoreEffects: { rage: 6, queue: 3 },
      canDefer: true,
    },
    {
      id: 'coupon_chaos',
      title: 'COUPON CHAOS',
      desc: 'Three coupons, none compatible.',
      station: 'pickup',
      duration: 6,
      effects: { queue: -3, rage: -5, burnout: 3 },
      ignoreEffects: { rage: 5 },
      canDefer: false,
    },
  ],

  // ========== STAFFING / LABOR FRICTION ==========
  staffing: [
    {
      id: 'tech_callout',
      title: 'TECH CALLED OUT',
      desc: 'Down one tech. Pipeline slows.',
      station: 'verify',
      duration: 5,
      effects: { queue: 6, burnout: 5, scrutiny: 2 },
      ignoreEffects: { queue: 4, burnout: 3 },
      canDefer: false,
    },
    {
      id: 'break_demand',
      title: 'BREAK TIME',
      desc: 'Tech needs their legally required break.',
      station: 'verify',
      duration: 4,
      effects: { queue: 4, burnout: -3 },
      ignoreEffects: { burnout: 4, scrutiny: 3 },
      canDefer: true,
    },
    {
      id: 'worst_relief',
      title: 'WORST RELIEF TECH',
      desc: 'Relief tech asks where everything is.',
      station: 'verify',
      duration: 7,
      effects: { queue: -2, burnout: 5, safety: 3 },
      ignoreEffects: { safety: 4, queue: 3 },
      canDefer: false,
    },
    {
      id: 'solo_open',
      title: 'SOLO OPEN',
      desc: 'Nobody else showed up.',
      station: 'verify',
      duration: 3,
      effects: { burnout: 8, scrutiny: 3 },
      ignoreEffects: { burnout: 5 },
      canDefer: false,
    },
  ],

  // ========== REGULATORY / BOARD / SAFETY ==========
  regulatory: [
    {
      id: 'board_inspection',
      title: 'BOARD INSPECTION',
      desc: 'State board inspector at the counter.',
      station: 'verify',
      duration: 12,
      effects: { safety: -10, scrutiny: -8, burnout: 8 },
      ignoreEffects: { safety: 12, scrutiny: 14 },
      canDefer: false,
    },
    {
      id: 'med_recall',
      title: 'MEDICATION RECALL',
      desc: 'FDA recall. Pull all stock immediately.',
      station: 'verify',
      duration: 10,
      effects: { safety: -12, queue: -3, burnout: 6 },
      ignoreEffects: { safety: 15, scrutiny: 8 },
      canDefer: false,
    },
    {
      id: 'expired_stock',
      title: 'EXPIRED STOCK',
      desc: 'Found expired meds on the shelf.',
      station: 'verify',
      duration: 7,
      effects: { safety: -6, burnout: 4 },
      ignoreEffects: { safety: 8, scrutiny: 4 },
      canDefer: true,
      escalatesTo: 'expired_audit',
    },
    {
      id: 'hipaa_breach',
      title: 'HIPAA CONCERN',
      desc: 'Patient info visible at counter.',
      station: 'pickup',
      duration: 5,
      effects: { safety: -5, scrutiny: -4, burnout: 3 },
      ignoreEffects: { safety: 7, scrutiny: 8 },
      canDefer: false,
    },
    {
      id: 'wrong_patient',
      title: 'WRONG PATIENT',
      desc: 'Almost gave meds to wrong person.',
      station: 'pickup',
      duration: 8,
      effects: { safety: -10, rage: -3, burnout: 5 },
      ignoreEffects: { safety: 12, scrutiny: 6, rage: 4 },
      canDefer: false,
    },
    {
      id: 'allergy_flag',
      title: 'ALLERGY FLAG',
      desc: 'System caught a dangerous interaction.',
      station: 'verify',
      duration: 9,
      effects: { safety: -8, queue: -2, burnout: 4 },
      ignoreEffects: { safety: 14 },
      canDefer: false,
    },
    {
      id: 'temp_log',
      title: 'FRIDGE TEMP LOG',
      desc: 'Vaccine fridge reading is off.',
      station: 'verify',
      duration: 6,
      effects: { safety: -5, scrutiny: -3, burnout: 3 },
      ignoreEffects: { safety: 7, scrutiny: 5 },
      canDefer: true,
    },
  ],

  // ========== TECHNOLOGY / SYSTEM FAILURES ==========
  tech: [
    {
      id: 'system_crash',
      title: 'SYSTEM DOWN',
      desc: 'Pharmacy software just crashed.',
      station: 'verify',
      duration: 8,
      effects: { queue: 8, burnout: 6, safety: 4 },
      ignoreEffects: { queue: 6, safety: 5 },
      canDefer: false,
    },
    {
      id: 'printer_jam',
      title: 'PRINTER JAM',
      desc: 'Label printer is jammed. Again.',
      station: 'verify',
      duration: 4,
      effects: { queue: 3, burnout: 2 },
      ignoreEffects: { queue: 4 },
      canDefer: false,
    },
    {
      id: 'register_freeze',
      title: 'REGISTER FROZEN',
      desc: 'POS system not responding.',
      station: 'pickup',
      duration: 5,
      effects: { queue: 5, rage: 3, burnout: 2 },
      ignoreEffects: { queue: 5, rage: 4 },
      canDefer: false,
    },
    {
      id: 'e_script_error',
      title: 'E-SCRIPT ERROR',
      desc: 'Electronic script came in garbled.',
      station: 'verify',
      duration: 7,
      effects: { queue: -3, safety: -4, burnout: 4 },
      ignoreEffects: { safety: 6, queue: 4 },
      canDefer: true,
    },
  ],

  // ========== STICKY SOCIAL ENCOUNTERS / "CAN'T BE RUDE" ==========
  social: [
    {
      id: 'lonely_regular',
      title: 'LONELY REGULAR',
      desc: 'They just want to talk. For 20 minutes.',
      station: 'pickup',
      duration: 8,
      effects: { burnout: 5, queue: 3 },
      ignoreEffects: { rage: 3 },
      canDefer: false,
      isInterrupt: false,
    },
    {
      id: 'how_are_kids',
      title: 'HOW ARE THE KIDS?',
      desc: "You don't have kids.",
      station: 'pickup',
      duration: 4,
      effects: { burnout: 2 },
      ignoreEffects: { rage: 2 },
      canDefer: false,
      isInterrupt: false,
    },
    {
      id: 'patient_friend',
      title: "THINKS YOU'RE FRIENDS",
      desc: 'Brought you cookies. Needs 30 minutes.',
      station: 'consult',
      duration: 9,
      effects: { burnout: 4, queue: 4 },
      ignoreEffects: { rage: 4, burnout: 2 },
      canDefer: false,
      isInterrupt: false,
    },
    {
      id: 'cant_be_rude',
      title: "CAN'T BE RUDE",
      desc: 'Elderly patient telling a long story.',
      station: 'pickup',
      duration: 7,
      effects: { burnout: 3, queue: 3 },
      ignoreEffects: { rage: 5 },
      canDefer: false,
      isInterrupt: false,
    },
  ],

  // ========== GUILT TRIP AT COUNTER ==========
  guilt: [
    {
      id: 'sick_kid',
      title: 'MY KID IS SICK',
      desc: 'Uses child as emotional leverage.',
      station: 'pickup',
      duration: 6,
      effects: { rage: -5, burnout: 4, safety: 2 },
      ignoreEffects: { rage: 6 },
      canDefer: false,
      isInterrupt: false,
    },
    {
      id: 'mom_is_dying',
      title: 'MY MOM IS DYING',
      desc: 'Needs compassion AND speed.',
      station: 'pickup',
      duration: 7,
      effects: { rage: -6, burnout: 5 },
      ignoreEffects: { rage: 7 },
      canDefer: false,
      isInterrupt: false,
    },
    {
      id: 'no_one_cares',
      title: 'NO ONE CARES ABOUT ME',
      desc: 'Emotional collapse at counter.',
      station: 'consult',
      duration: 8,
      effects: { rage: -4, burnout: 6, scrutiny: 2 },
      ignoreEffects: { rage: 5, scrutiny: 3 },
      canDefer: false,
      isInterrupt: false,
    },
  ],

  // ========== PHONE TRAPS ==========
  phone_trap: [
    {
      id: 'lonely_caller',
      title: 'LONELY CALLER',
      desc: "Won't stop talking. Can't hang up.",
      station: 'phone',
      duration: 10,
      effects: { burnout: 5, queue: 4 },
      ignoreEffects: { rage: 4 },
      canDefer: false,
      isInterrupt: false,
    },
    {
      id: 'transfer_hold',
      title: 'TRANSFER HOLD HELL',
      desc: 'On hold 20 min, they answered when you stepped away.',
      station: 'phone',
      duration: 8,
      effects: { queue: -3, rage: -4, burnout: 5 },
      ignoreEffects: { rage: 5, queue: 4 },
      canDefer: false,
      isInterrupt: false,
    },
    {
      id: 'call_own_insurance',
      title: 'CALL YOUR OWN INSURANCE',
      desc: 'Patient expects you to handle their insurer.',
      station: 'phone',
      duration: 9,
      effects: { rage: -5, burnout: 4 },
      ignoreEffects: { rage: 6 },
      canDefer: false,
      isInterrupt: false,
    },
  ],

  // ========== PULLED INTO THE AISLE / GOT SWARMED ==========
  aisle: [
    {
      id: 'aisle_swarm',
      title: 'GOT SWARMED',
      desc: 'Stepped out, now 3 people asking questions.',
      station: 'consult',
      duration: 10,
      effects: { queue: 5, burnout: 5, safety: 3 },
      ignoreEffects: { rage: 4, queue: 3 },
      canDefer: false,
      isInterrupt: false,
    },
    {
      id: 'aisle_trap',
      title: 'AISLE TRAP',
      desc: 'Left to help one person, trapped by two more.',
      station: 'consult',
      duration: 8,
      effects: { queue: 4, burnout: 4 },
      ignoreEffects: { rage: 3, queue: 3 },
      canDefer: false,
      isInterrupt: false,
    },
    {
      id: 'drive_shopping',
      title: 'DRIVE-THRU SHOPPING',
      desc: 'Wants you to grab items from the store.',
      station: 'drive',
      duration: 7,
      effects: { queue: 3, burnout: 3, rage: -3 },
      ignoreEffects: { rage: 5 },
      canDefer: false,
      isInterrupt: false,
    },
  ],

  // ========== LEGENDARY ABSURDITY (very rare) ==========
  absurd: [
    {
      id: 'rat_pharmacy',
      title: 'RAT IN THE PHARMACY',
      desc: 'There is a rat. In the pharmacy.',
      station: 'consult',
      duration: 6,
      effects: { safety: 8, scrutiny: 5, burnout: 3 },
      ignoreEffects: { safety: 10, scrutiny: 8 },
      canDefer: false,
      isInterrupt: false,
    },
    {
      id: 'car_building',
      title: 'CAR INTO BUILDING',
      desc: 'Someone drove into the storefront.',
      station: 'pickup',
      duration: 12,
      effects: { safety: 10, scrutiny: 8, queue: 10, rage: 5 },
      ignoreEffects: { safety: 12, scrutiny: 10 },
      canDefer: false,
      isInterrupt: false,
    },
    {
      id: 'checked_out_rph',
      title: 'CHECKED-OUT PHARMACIST',
      desc: 'Your partner pharmacist just... left.',
      station: 'verify',
      duration: 8,
      effects: { burnout: 8, safety: 5, scrutiny: 3 },
      ignoreEffects: { safety: 8, scrutiny: 5 },
      canDefer: false,
      isInterrupt: false,
    },
  ],
};

// Escalated event variants
const ESCALATED_EVENTS = {
  compounding_urgent: {
    id: 'compounding_urgent',
    title: 'COMPOUNDING CRISIS',
    desc: 'They drove 40 minutes. They need it TODAY.',
    station: 'verify',
    duration: 10,
    effects: { queue: -6, rage: -10, burnout: 6 },
    ignoreEffects: { rage: 10, scrutiny: 3 },
    canDefer: false,
    isEscalated: true,
  },
  otc_escalated: {
    id: 'otc_escalated',
    title: 'OTC MELTDOWN',
    desc: '"I bought the wrong one. I need a refund AND advice."',
    station: 'pickup',
    duration: 9,
    effects: { queue: -6, rage: -8, burnout: 5 },
    ignoreEffects: { rage: 9 },
    canDefer: false,
    isEscalated: true,
  },
  insurance_disconnect: {
    id: 'insurance_disconnect',
    title: 'DISCONNECTED',
    desc: 'After 12 minutes on hold. They hung up.',
    station: 'phone',
    duration: 15,
    effects: { queue: -5, rage: -3, burnout: 12 },
    ignoreEffects: { burnout: 8, rage: 5 },
    canDefer: false,
    isEscalated: true,
  },
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
    effects: { queue: -2, rage: -6, burnout: 7, scrutiny: 5, safety: 4 },
    ignoreEffects: { rage: 8, burnout: 3, scrutiny: 6 },
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
  controlled_audit: {
    id: 'controlled_audit',
    title: 'CONTROLLED AUDIT',
    desc: 'DEA paperwork trail. Cannot skip.',
    station: 'verify',
    duration: 12,
    effects: { queue: -2, rage: -1, burnout: 10, safety: -8, scrutiny: 6 },
    ignoreEffects: { burnout: 8, rage: 4, safety: 10, scrutiny: 8 },
    canDefer: false,
    isEscalated: true,
  },
  refund_manager: {
    id: 'refund_manager',
    title: 'WANTS A MANAGER',
    desc: '"Get me your supervisor. NOW."',
    station: 'pickup',
    duration: 9,
    effects: { queue: -4, rage: -12, burnout: 6, scrutiny: 4 },
    ignoreEffects: { rage: 10, scrutiny: 5 },
    canDefer: false,
    isEscalated: true,
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
  metrics_escalation: {
    id: 'metrics_escalation',
    title: 'METRICS REVIEW',
    desc: 'DM scheduling a formal sit-down.',
    station: 'phone',
    duration: 10,
    effects: { scrutiny: -12, burnout: 7 },
    ignoreEffects: { scrutiny: 14, burnout: 5 },
    canDefer: false,
    isEscalated: true,
  },
  email_followup: {
    id: 'email_followup',
    title: 'EMAIL FOLLOW-UP',
    desc: '"Per my last email..." from corporate.',
    station: 'verify',
    duration: 8,
    effects: { scrutiny: -9, burnout: 5 },
    ignoreEffects: { scrutiny: 12 },
    canDefer: false,
    isEscalated: true,
  },
  prior_auth_meltdown: {
    id: 'prior_auth_meltdown',
    title: 'PRIOR AUTH MELTDOWN',
    desc: 'Patient crying. Insurance still saying no.',
    station: 'verify',
    duration: 10,
    effects: { queue: -5, rage: -10, burnout: 7, scrutiny: 3 },
    ignoreEffects: { rage: 12, scrutiny: 5 },
    canDefer: false,
    isEscalated: true,
  },
  expired_audit: {
    id: 'expired_audit',
    title: 'EXPIRED STOCK AUDIT',
    desc: 'Board wants a full shelf review.',
    station: 'verify',
    duration: 14,
    effects: { safety: -10, scrutiny: -6, burnout: 10 },
    ignoreEffects: { safety: 14, scrutiny: 12 },
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
  const corePools = ['verify', 'pickup', 'consult', 'phone', 'drive'];
  const interruptChance = phaseName === 'OPENING' ? 0.1 :
                          phaseName === 'BUILDING' ? 0.2 :
                          phaseName === 'REOPEN_RUSH' ? 0.3 : 0.25;

  if (Math.random() < interruptChance) {
    const pool = EVENT_POOL.interrupt;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Positive events (5% chance, any phase except opening)
  if (Math.random() < 0.05 && phaseName !== 'OPENING' && EVENT_POOL.positive) {
    const pool = EVENT_POOL.positive;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // True positive events (5% chance, not in opening or lunch close)
  if (Math.random() < 0.05 && phaseName !== 'OPENING' && phaseName !== 'LUNCH_CLOSE') {
    const pool = EVENT_POOL.truePositive;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Relief events (6% chance, any phase except opening)
  if (Math.random() < 0.06 && phaseName !== 'OPENING') {
    const pool = EVENT_POOL.relief;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Comic events (4% chance, any phase)
  if (Math.random() < 0.04) {
    const pool = EVENT_POOL.comic;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Leadership events ramp up in later phases (10-18% chance)
  const leadershipChance = phaseName === 'OPENING' ? 0.03 :
                           phaseName === 'BUILDING' ? 0.08 :
                           phaseName === 'REOPEN_RUSH' ? 0.15 :
                           phaseName === 'LATE_DRAG' ? 0.18 : 0;
  if (Math.random() < leadershipChance && EVENT_POOL.leadership) {
    const pool = EVENT_POOL.leadership;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Insurance chaos (12% chance after opening)
  if (Math.random() < 0.12 && phaseName !== 'OPENING' && EVENT_POOL.insurance) {
    const pool = EVENT_POOL.insurance;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Staffing events (8% chance, higher in late drag)
  const staffingChance = phaseName === 'LATE_DRAG' ? 0.12 : 0.06;
  if (Math.random() < staffingChance && EVENT_POOL.staffing) {
    const pool = EVENT_POOL.staffing;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Regulatory / safety events (rare but impactful, ramp in later phases)
  const regulatoryChance = phaseName === 'OPENING' ? 0.02 :
                           phaseName === 'BUILDING' ? 0.05 :
                           phaseName === 'REOPEN_RUSH' ? 0.08 :
                           phaseName === 'LATE_DRAG' ? 0.10 : 0;
  if (Math.random() < regulatoryChance && EVENT_POOL.regulatory) {
    const pool = EVENT_POOL.regulatory;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Tech/system failure events (6% flat chance)
  if (Math.random() < 0.06 && EVENT_POOL.tech) {
    const pool = EVENT_POOL.tech;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Social encounters (8% chance, not in opening)
  if (Math.random() < 0.08 && phaseName !== 'OPENING' && EVENT_POOL.social) {
    const pool = EVENT_POOL.social;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Guilt trip events (6% chance, not in opening)
  if (Math.random() < 0.06 && phaseName !== 'OPENING' && EVENT_POOL.guilt) {
    const pool = EVENT_POOL.guilt;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Phone trap events (5% chance, any phase)
  if (Math.random() < 0.05 && EVENT_POOL.phone_trap) {
    const pool = EVENT_POOL.phone_trap;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Aisle swarm events (6% chance, not in opening)
  if (Math.random() < 0.06 && phaseName !== 'OPENING' && EVENT_POOL.aisle) {
    const pool = EVENT_POOL.aisle;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  // Legendary absurdity (1% chance, only in REOPEN_RUSH or LATE_DRAG)
  if (Math.random() < 0.01 && (phaseName === 'REOPEN_RUSH' || phaseName === 'LATE_DRAG') && EVENT_POOL.absurd) {
    const pool = EVENT_POOL.absurd;
    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  const poolKey = corePools[Math.floor(Math.random() * corePools.length)];
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
      safety: (originalEvent.effects.safety || 0) * 1.3,
      rage: (originalEvent.effects.rage || 0) * 1.3,
      burnout: (originalEvent.effects.burnout || 0) * 1.3,
      scrutiny: (originalEvent.effects.scrutiny || 0) * 1.3 + 2,
    },
    ignoreEffects: {
      rage: (originalEvent.ignoreEffects?.rage || 0) * 1.5,
      queue: (originalEvent.ignoreEffects?.queue || 0) * 1.5,
      safety: (originalEvent.ignoreEffects?.safety || 0) * 1.5,
      burnout: (originalEvent.ignoreEffects?.burnout || 0) * 1.5,
      scrutiny: (originalEvent.ignoreEffects?.scrutiny || 0) * 1.5 + 2,
    },
    canDefer: false,
    isEscalated: true,
  };
}

// Get defer return time
export function getDeferTime() {
  return DEFER_RETURN_MIN + Math.random() * (DEFER_RETURN_MAX - DEFER_RETURN_MIN);
}

// ========== TIERED EVENT SYSTEM ==========

/**
 * Combined expanded event pools, organised by tier.
 */
export const ALL_EVENTS_EXPANDED = {
  ambient: AMBIENT_EVENTS,
  pressure: PRESSURE_EVENTS,
  signature: SIGNATURE_EVENTS,
};

/**
 * Pick a random event from a specific tier, with optional station and phase filters.
 *
 * @param {'ambient'|'pressure'|'signature'} tier - The tier to draw from.
 * @param {string} [station] - Optional station to filter events by.
 * @param {string} [phase]   - Current phase name (unused in filter but available for future weighting).
 * @returns {object|null} A shallow copy of a matching event, or null if none found.
 */
export function getEventByTier(tier, station, phase) {
  const pool = ALL_EVENTS_EXPANDED[tier];
  if (!pool || pool.length === 0) return null;

  let candidates = pool;
  if (station) {
    candidates = pool.filter(e => e.station === station);
  }

  if (candidates.length === 0) return null;

  // Use TIER_SPAWN_WEIGHTS for the given phase to validate the tier is active
  if (phase && TIER_SPAWN_WEIGHTS[phase]) {
    const weight = TIER_SPAWN_WEIGHTS[phase][tier] || 0;
    if (weight <= 0) return null;
  }

  const idx = Math.floor(Math.random() * candidates.length);
  return { ...candidates[idx] };
}

/**
 * Pick a random event using the tiered spawn-weight system.
 *
 * Uses TIER_SPAWN_WEIGHTS for the given phase to probabilistically select a tier,
 * then picks a random event from that tier. If chapter is provided, chapter-specific
 * events within the selected tier receive a higher selection weight.
 *
 * Falls back to the existing getRandomEventAny if the tier system yields nothing.
 *
 * @param {string} phase   - Current shift phase (e.g. 'OPENING', 'BUILDING', etc.).
 * @param {number} [chapter] - Current chapter number (0-based); used to boost chapter-specific events.
 * @returns {object} A shallow copy of the selected event.
 */
export function getRandomEventTiered(phase, chapter) {
  const weights = TIER_SPAWN_WEIGHTS[phase];
  if (!weights) {
    // Phase not in weight table — fall back to legacy picker
    return getRandomEventAny(phase);
  }

  // Weighted random tier selection
  const roll = Math.random();
  let cumulative = 0;
  let selectedTier = null;

  for (const tier of [EVENT_TIERS.AMBIENT, EVENT_TIERS.PRESSURE, EVENT_TIERS.SIGNATURE]) {
    cumulative += weights[tier] || 0;
    if (roll < cumulative) {
      selectedTier = tier;
      break;
    }
  }

  // Safety net — rounding might leave us without a tier
  if (!selectedTier) {
    selectedTier = EVENT_TIERS.AMBIENT;
  }

  const pool = ALL_EVENTS_EXPANDED[selectedTier];
  if (!pool || pool.length === 0) {
    return getRandomEventAny(phase);
  }

  let selected = null;

  // If chapter is provided, try to weight chapter-specific events higher
  if (chapter !== undefined && chapter !== null) {
    const chapterEvents = pool.filter(e => e.chapter === chapter);
    const genericEvents = pool.filter(e => e.chapter === undefined || e.chapter === null);

    if (chapterEvents.length > 0 && Math.random() < 0.4) {
      // 40% chance to pick a chapter-specific event when available
      selected = chapterEvents[Math.floor(Math.random() * chapterEvents.length)];
    } else if (genericEvents.length > 0) {
      selected = genericEvents[Math.floor(Math.random() * genericEvents.length)];
    }
  }

  // Default: pick uniformly from the full tier pool
  if (!selected) {
    selected = pool[Math.floor(Math.random() * pool.length)];
  }

  return { ...selected };
}

/**
 * Tags all existing events in EVENT_POOL and ESCALATED_EVENTS with a `tier`
 * property based on EVENT_CLASSIFICATIONS. Events not found in the classification
 * map default to 'ambient'.
 *
 * This mutates the event objects in place so that downstream code can read
 * `event.tier` without an extra lookup.
 */
export function tagExistingEvents() {
  // Tag events in EVENT_POOL
  for (const poolKey of Object.keys(EVENT_POOL)) {
    const pool = EVENT_POOL[poolKey];
    if (!Array.isArray(pool)) continue;
    for (const event of pool) {
      if (!event.tier) {
        event.tier = getEventTier(event.id) || EVENT_TIERS.AMBIENT;
      }
    }
  }

  // Tag escalated events
  for (const eventId of Object.keys(ESCALATED_EVENTS)) {
    const event = ESCALATED_EVENTS[eventId];
    if (!event.tier) {
      event.tier = getEventTier(event.id) || EVENT_TIERS.PRESSURE;
    }
  }
}
