/**
 * Campaign mode — 7-day week progression with between-shift decisions.
 * Tracks persistent state across shifts: upgrades, reputation, morale carry-over.
 */

import { SHIFT_DAYS, WEATHER_TYPES } from './constants.js';

// ========== BETWEEN-SHIFT DECISIONS ==========
// Each decision has 3 choices with different trade-offs

const DECISION_POOL = [
  {
    id: 'overtime',
    prompt: 'Corporate is offering overtime hours.',
    choices: [
      { label: 'ACCEPT', desc: 'Extra pay, but start tired.', effects: { money: 2, burnoutStart: 15 } },
      { label: 'DECLINE', desc: 'Protect your energy.', effects: { burnoutStart: -5 } },
      { label: 'NEGOTIATE', desc: 'Half shift OT. Balanced.', effects: { money: 1, burnoutStart: 5 } },
    ],
  },
  {
    id: 'staff_request',
    prompt: 'You can request an extra tech for tomorrow.',
    choices: [
      { label: 'REQUEST TECH', desc: 'Slower script pressure.', effects: { scriptSpeedMult: 0.7, scrutinyStart: 5 } },
      { label: 'GO SOLO', desc: 'Prove you can handle it.', effects: { scrutinyStart: -5, burnoutStart: 8 } },
      { label: 'ASK INTERN', desc: 'Free help, but... safety.', effects: { scriptSpeedMult: 0.85, safetyStart: 10 } },
    ],
  },
  {
    id: 'rest_night',
    prompt: 'How do you spend your evening?',
    choices: [
      { label: 'SLEEP EARLY', desc: 'Fresh start tomorrow.', effects: { burnoutStart: -10 } },
      { label: 'STUDY CE', desc: 'Continuing education. Impress the DM.', effects: { scrutinyStart: -8, burnoutStart: 5 } },
      { label: 'GO OUT', desc: 'You need a life. Right?', effects: { burnoutStart: -3, rageMult: 0.9 } },
    ],
  },
  {
    id: 'equipment',
    prompt: 'The counting machine is acting up.',
    choices: [
      { label: 'FIX IT', desc: 'Takes time, but safer.', effects: { safetyStart: -8, burnoutStart: 5 } },
      { label: 'REPORT IT', desc: 'Let corporate handle it.', effects: { scrutinyStart: 5, safetyStart: 3 } },
      { label: 'WORK AROUND', desc: 'Count by hand. It\'s fine.', effects: { safetyStart: 8, burnoutStart: 3 } },
    ],
  },
  {
    id: 'complaint_response',
    prompt: 'A patient filed a complaint about yesterday.',
    choices: [
      { label: 'APOLOGIZE', desc: 'Smooth it over.', effects: { rageStart: -5, scrutinyStart: -3 } },
      { label: 'DOCUMENT', desc: 'Paper trail protects you.', effects: { scrutinyStart: -8, burnoutStart: 5 } },
      { label: 'IGNORE', desc: 'It\'ll blow over.', effects: { scrutinyStart: 8 } },
    ],
  },
  {
    id: 'training_offer',
    prompt: 'Corporate wants you at a training seminar.',
    choices: [
      { label: 'ATTEND', desc: 'Good optics. Less rest.', effects: { scrutinyStart: -10, burnoutStart: 10 } },
      { label: 'SKIP', desc: 'You need the rest more.', effects: { burnoutStart: -5, scrutinyStart: 5 } },
      { label: 'SEND NOTES', desc: '"I reviewed the materials."', effects: { scrutinyStart: -3 } },
    ],
  },
  {
    id: 'drive_thru',
    prompt: 'The drive-thru speaker is broken again.',
    choices: [
      { label: 'CLOSE IT', desc: 'One less station. Patients angry.', effects: { rageStart: 10, burnoutStart: -5 } },
      { label: 'SHOUT', desc: 'Yell through the window. It works.', effects: { burnoutStart: 5 } },
      { label: 'FIX IT', desc: 'You\'re not maintenance, but...', effects: { burnoutStart: 8, safetyStart: -3 } },
    ],
  },
  {
    id: 'lunch_policy',
    prompt: 'New policy: staggered lunches or close the gate?',
    choices: [
      { label: 'CLOSE GATE', desc: 'Standard. Patients hate it.', effects: { rageStart: 5 } },
      { label: 'STAGGER', desc: 'No break for you, less rage buildup.', effects: { burnoutStart: 8, rageMult: 0.85 } },
      { label: 'SKIP LUNCH', desc: 'You don\'t need to eat. Right?', effects: { burnoutStart: 15, scriptSpeedMult: 0.8 } },
    ],
  },
  {
    id: 'social_media',
    prompt: 'Someone tagged the pharmacy in a bad review.',
    choices: [
      { label: 'RESPOND', desc: 'Professional reply. Takes effort.', effects: { rageStart: -5, burnoutStart: 5, scrutinyStart: -3 } },
      { label: 'DELETE', desc: 'If you can\'t see it...', effects: { scrutinyStart: 5 } },
      { label: 'IGNORE', desc: 'Don\'t feed the trolls.', effects: { rageStart: 3 } },
    ],
  },
  {
    id: 'inventory',
    prompt: 'Inventory shipment is short. What do you do?',
    choices: [
      { label: 'BORROW', desc: 'Call another store. Owe them.', effects: { queueStart: -5, scrutinyStart: 3 } },
      { label: 'SHORT FILL', desc: 'Give partial fills. Patients wait.', effects: { rageStart: 8, safetyStart: 3 } },
      { label: 'REORDER STAT', desc: 'Costs extra, but it arrives.', effects: { queueStart: -3, scrutinyStart: 5 } },
    ],
  },
  {
    id: 'new_tech',
    prompt: 'New tech starts tomorrow. They need training.',
    choices: [
      { label: 'TRAIN THEM', desc: 'Slow day, but invest in future.', effects: { scriptSpeedMult: 1.3, burnoutStart: -3 } },
      { label: 'SINK OR SWIM', desc: 'They\'ll figure it out.', effects: { safetyStart: 8 } },
      { label: 'PAIR UP', desc: 'Shadow an experienced tech.', effects: { scriptSpeedMult: 1.1, safetyStart: 3 } },
    ],
  },
  {
    id: 'flu_season',
    prompt: 'Flu season is ramping up. Vaccine walk-ins expected.',
    choices: [
      { label: 'OPEN CLINIC', desc: 'More work, more visibility.', effects: { queueStart: 10, scrutinyStart: -5 } },
      { label: 'BY APPT ONLY', desc: 'Manageable, but patients complain.', effects: { rageStart: 5 } },
      { label: 'DECLINE ALL', desc: 'Focus on scripts. Corporate won\'t like it.', effects: { scrutinyStart: 10, burnoutStart: -5 } },
    ],
  },
];

// Campaign narrative messages per day
const DAY_NARRATIVES = [
  { day: 1, intro: "Monday. First day of the week. The weekend backlog is real.", flavor: "Deep breath. You've done this before." },
  { day: 2, intro: "Tuesday. Yesterday wasn't great, but today could be different.", flavor: "The regulars are already in line." },
  { day: 3, intro: "Wednesday. Hump day. Insurance companies pick today to reject everything.", flavor: "Your feet already hurt." },
  { day: 4, intro: "Thursday. You can see Friday from here.", flavor: "Someone called out. Of course they did." },
  { day: 5, intro: "Friday. Everyone needs their meds before the weekend.", flavor: "The drive-thru line is wrapped around the building." },
  { day: 6, intro: "Saturday. Skeleton crew. It's just you and the chaos.", flavor: "At least the phones are quieter. Maybe." },
  { day: 7, intro: "Sunday. The final shift. One more day and you made it.", flavor: "Your replacement is already running late." },
];

const CAMPAIGN_END_MESSAGES = {
  perfect: { title: 'PHARMACIST OF THE YEAR', flavor: 'Corporate is impressed. That never happens.' },
  great:   { title: 'SURVIVED THE WEEK', flavor: 'You didn\'t lose your license. That\'s the bar.' },
  decent:  { title: 'STILL EMPLOYED', flavor: 'The district manager has "concerns." But you\'re here.' },
  rough:   { title: 'BARELY MADE IT', flavor: 'HR wants to talk. Bring your documentation.' },
  fail:    { title: 'TERMINATED', flavor: 'Your badge didn\'t work this morning.' },
};

export class Campaign {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.day = 0;           // 0 = not started, 1-7 = current day
    this.totalDays = 7;
    this.reputation = 50;   // 0-100, public perception
    this.money = 0;         // accumulated from good shifts
    this.morale = 50;       // persistent morale carry-over

    // Per-shift modifiers from decisions
    this.shiftModifiers = {
      burnoutStart: 0,
      safetyStart: 0,
      scrutinyStart: 0,
      rageStart: 0,
      queueStart: 0,
      scriptSpeedMult: 1.0,
      rageMult: 1.0,
    };

    // Track results per day
    this.dayResults = [];

    // Decision history
    this.decisionsUsed = new Set();

    // Available decisions for next shift (picked at shift end)
    this.pendingDecision = null;
  }

  start() {
    this.reset();
    this.active = true;
    this.day = 1;
  }

  isActive() {
    return this.active;
  }

  getCurrentDay() {
    return this.day;
  }

  getShiftDay() {
    // Map campaign day to SHIFT_DAYS (Mon=0, Sun=6)
    const idx = Math.min(this.day - 1, SHIFT_DAYS.length - 1);
    return SHIFT_DAYS[idx];
  }

  getWeather() {
    const totalWeight = WEATHER_TYPES.reduce((sum, w) => sum + w.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const w of WEATHER_TYPES) {
      roll -= w.weight;
      if (roll <= 0) return w;
    }
    return WEATHER_TYPES[0];
  }

  getDayNarrative() {
    return DAY_NARRATIVES[this.day - 1] || DAY_NARRATIVES[0];
  }

  getStartingMeters() {
    const m = this.shiftModifiers;
    // Base meters with carry-over from morale and decisions
    const moraleEffect = (50 - this.morale) * 0.2; // low morale = start tired
    return {
      queue: Math.max(0, Math.min(30, 5 + (m.queueStart || 0))),
      safety: Math.max(0, Math.min(30, 2 + (m.safetyStart || 0))),
      rage: Math.max(0, Math.min(30, 3 + (m.rageStart || 0))),
      burnout: Math.max(0, Math.min(40, moraleEffect + (m.burnoutStart || 0))),
      scrutiny: Math.max(0, Math.min(30, (m.scrutinyStart || 0) + (this.day > 1 ? this.day * 2 : 0))),
    };
  }

  getScriptSpeedMult() {
    return this.shiftModifiers.scriptSpeedMult || 1.0;
  }

  getRageMult() {
    return this.shiftModifiers.rageMult || 1.0;
  }

  // Called when a shift ends
  recordShiftResult(won, meters, stats, grade) {
    const result = { day: this.day, won, meters: { ...meters }, stats: { ...stats }, grade };
    this.dayResults.push(result);

    // Update persistent state
    if (won) {
      this.money += grade === 'S' ? 4 : grade === 'A' ? 3 : grade === 'B' ? 2 : 1;
      this.reputation = Math.min(100, this.reputation + (grade === 'S' ? 8 : grade === 'A' ? 5 : grade === 'B' ? 2 : -2));
      this.morale = Math.max(0, Math.min(100, this.morale - meters.burnout * 0.3 + 10));
    } else {
      this.money = Math.max(0, this.money - 1);
      this.reputation = Math.max(0, this.reputation - 10);
      this.morale = Math.max(0, this.morale - 15);
    }

    // Pick a decision for between-shift
    this.pickDecision();
  }

  pickDecision() {
    // Filter out recently used decisions
    const available = DECISION_POOL.filter(d => !this.decisionsUsed.has(d.id));
    if (available.length === 0) {
      this.decisionsUsed.clear();
      this.pendingDecision = DECISION_POOL[Math.floor(Math.random() * DECISION_POOL.length)];
    } else {
      this.pendingDecision = available[Math.floor(Math.random() * available.length)];
    }
  }

  getPendingDecision() {
    return this.pendingDecision;
  }

  applyDecision(choiceIndex) {
    if (!this.pendingDecision) return;

    const choice = this.pendingDecision.choices[choiceIndex];
    if (!choice) return;

    const effects = choice.effects;
    this.decisionsUsed.add(this.pendingDecision.id);
    this.pendingDecision = null;

    // Reset modifiers for next shift
    this.shiftModifiers = {
      burnoutStart: effects.burnoutStart || 0,
      safetyStart: effects.safetyStart || 0,
      scrutinyStart: effects.scrutinyStart || 0,
      rageStart: effects.rageStart || 0,
      queueStart: effects.queueStart || 0,
      scriptSpeedMult: effects.scriptSpeedMult || 1.0,
      rageMult: effects.rageMult || 1.0,
    };

    if (effects.money) {
      this.money += effects.money;
    }
  }

  advanceDay() {
    this.day++;
    return this.day <= this.totalDays;
  }

  isComplete() {
    return this.day > this.totalDays;
  }

  getCampaignGrade() {
    const wins = this.dayResults.filter(r => r.won).length;
    const gradeOrder = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
    const avgGrade = this.dayResults.reduce((sum, r) => sum + (gradeOrder[r.grade] || 1), 0) / Math.max(1, this.dayResults.length);

    if (wins >= 7 && avgGrade >= 4.5) return 'perfect';
    if (wins >= 5 && avgGrade >= 3.5) return 'great';
    if (wins >= 4) return 'decent';
    if (wins >= 2) return 'rough';
    return 'fail';
  }

  getCampaignEndMessage() {
    const grade = this.getCampaignGrade();
    return CAMPAIGN_END_MESSAGES[grade] || CAMPAIGN_END_MESSAGES.fail;
  }

  getCampaignSummary() {
    return {
      days: this.dayResults.length,
      wins: this.dayResults.filter(r => r.won).length,
      losses: this.dayResults.filter(r => !r.won).length,
      reputation: this.reputation,
      morale: this.morale,
      money: this.money,
      results: this.dayResults,
      grade: this.getCampaignGrade(),
    };
  }
}
