/**
 * Endless Mode — "No Relief"
 * Chained emergency coverage survival. The day that refuses to end.
 * Survive segments, get asked to stay, carry fatigue forward.
 */

import { SHIFT_DAYS, WEATHER_TYPES } from './constants.js';

let EVENT_TIERS;
try {
  ({ EVENT_TIERS } = await import('./event-hierarchy.js'));
} catch (_) {
  EVENT_TIERS = { AMBIENT: 'ambient', PRESSURE: 'pressure', SIGNATURE: 'signature' };
}

// ========== SEGMENT TYPES ==========
// Each segment is a different store/situation with unique flavor

const SEGMENT_TYPES = [
  {
    id: 'late_close',
    name: 'Late Close',
    desc: 'Closing pharmacist called out. Can you finish the night?',
    prompt: 'The closing pharmacist just called. Food poisoning. Can you stay?',
    flavor: 'The parking lot is emptying. The pharmacy is not.',
    durationMult: 1.0,
    ambientMult: 1.0,
    eventMult: 1.0,
    meterOffsets: { queue: 5, burnout: 0 },
  },
  {
    id: 'overnight',
    name: 'Overnight',
    desc: '24-hour store. Someone has to be here.',
    prompt: 'No overnight pharmacist tonight. You\'re the only option.',
    flavor: '2 AM. The fluorescent lights have never been louder.',
    durationMult: 0.8,
    ambientMult: 0.7,
    eventMult: 0.6,
    meterOffsets: { burnout: 10, safety: 8 },
  },
  {
    id: 'early_open',
    name: 'Early Open',
    desc: 'Opening pharmacist is late. Can you cover?',
    prompt: 'Morning pharmacist stuck in traffic. Can you open?',
    flavor: 'You haven\'t slept. The line is already forming.',
    durationMult: 0.9,
    ambientMult: 1.2,
    eventMult: 1.1,
    meterOffsets: { queue: 10, burnout: 5 },
  },
  {
    id: 'problem_store',
    name: 'Problem Store',
    desc: 'Worst store in the district. No one else will go.',
    prompt: 'Store #247 lost their third pharmacist this month. Can you cover until relief?',
    flavor: 'The shelves are half-empty. The staff looks haunted.',
    durationMult: 1.0,
    ambientMult: 1.3,
    eventMult: 1.2,
    meterOffsets: { queue: 8, rage: 5, safety: 5, scrutiny: 3 },
  },
  {
    id: 'flu_rush',
    name: 'Flu Rush',
    desc: 'Vaccine walk-ins overwhelming everything.',
    prompt: 'Regional says flu shots are priority. Store needs a pharmacist NOW.',
    flavor: 'The waiting area is standing room only.',
    durationMult: 0.9,
    ambientMult: 1.4,
    eventMult: 1.3,
    meterOffsets: { queue: 15, burnout: 5, scrutiny: 5 },
  },
  {
    id: 'skeleton_crew',
    name: 'Skeleton Crew',
    desc: 'Two techs called out. It\'s just you and one trainee.',
    prompt: 'Two techs down. Can you hold the bench until afternoon?',
    flavor: 'The trainee is trying. That\'s the best you can say.',
    durationMult: 1.0,
    ambientMult: 1.1,
    eventMult: 1.0,
    meterOffsets: { burnout: 8, safety: 8 },
  },
  {
    id: 'dm_store',
    name: 'DM\'s Store',
    desc: 'District manager\'s home store. Everything is being watched.',
    prompt: 'DM\'s home store needs coverage. She\'ll be there.',
    flavor: 'Every mistake is a data point.',
    durationMult: 1.0,
    ambientMult: 1.0,
    eventMult: 1.1,
    meterOffsets: { scrutiny: 15, burnout: 3 },
  },
  {
    id: 'holiday_eve',
    name: 'Holiday Eve',
    desc: 'Day before a holiday. Everyone needs everything.',
    prompt: 'Tomorrow\'s a holiday. Every patient in the district is here TODAY.',
    flavor: 'The phone hasn\'t stopped. The drive-thru wraps the building.',
    durationMult: 1.1,
    ambientMult: 1.5,
    eventMult: 1.4,
    meterOffsets: { queue: 20, rage: 10 },
  },
];

// Between-segment prompts — escalate in tone as segments increase
const EXTENSION_PROMPTS = [
  // Segments 2-3: polite asks
  { minSeg: 2, weight: 10, prompt: 'Can you stay a bit longer?', sub: 'Relief is running late.' },
  { minSeg: 2, weight: 10, prompt: 'Would you mind covering until close?', sub: 'I know it\'s a lot to ask.' },
  // Segments 3-5: direct asks
  { minSeg: 3, weight: 8, prompt: 'We need you at another store.', sub: 'Their pharmacist just walked out.' },
  { minSeg: 3, weight: 8, prompt: 'No one else is available.', sub: 'You\'re the only licensed pharmacist in range.' },
  { minSeg: 4, weight: 6, prompt: 'Regional leader is asking directly.', sub: 'This one comes from above.' },
  // Segments 5+: desperate
  { minSeg: 5, weight: 5, prompt: 'Please.', sub: 'There is no one else.' },
  { minSeg: 5, weight: 5, prompt: 'One more. That\'s it. I promise.', sub: 'You know that\'s not true.' },
  { minSeg: 6, weight: 4, prompt: 'The store will close without you.', sub: 'Patients won\'t get their meds.' },
  { minSeg: 7, weight: 3, prompt: 'Are you still here?', sub: 'You\'ve lost count of the hours.' },
];

// Endless mode name candidates for the UI
const ENDLESS_NAMES = ['No Relief', 'One More Shift', 'Past Close', 'Can You Stay?', 'Longest Day'];

export class EndlessMode {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.segment = 0;          // current segment number (1-based when active)
    this.totalSegments = 0;    // how many completed
    this.hoursAwake = 0;       // persistent fatigue counter
    this.fatigue = 0;          // 0-100, dedicated fatigue meter
    this.segmentResults = [];
    this.currentSegmentType = null;
    this.cashedOut = false;
  }

  start() {
    this.reset();
    this.active = true;
    this.segment = 1;
    this.hoursAwake = 0;
    this.fatigue = 0;
    this.campaignBonuses = null; // Set externally if player has campaign unlocks
    this.pickSegment();
  }

  isActive() {
    return this.active;
  }

  pickSegment() {
    // First segment is always a normal late close
    if (this.segment === 1) {
      this.currentSegmentType = SEGMENT_TYPES[0];
      return;
    }
    // Later: weighted random, avoid repeating last
    const lastId = this.segmentResults.length > 0
      ? this.segmentResults[this.segmentResults.length - 1].segmentType
      : null;
    const available = SEGMENT_TYPES.filter(s => s.id !== lastId);
    this.currentSegmentType = available[Math.floor(Math.random() * available.length)];
  }

  getSegmentInfo() {
    return {
      segment: this.segment,
      type: this.currentSegmentType,
      hoursAwake: this.hoursAwake,
      fatigue: this.fatigue,
    };
  }

  getShiftDay() {
    // Rotate through days
    const idx = (this.segment - 1) % SHIFT_DAYS.length;
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

  getStartingMeters() {
    const seg = this.currentSegmentType;
    const offsets = seg.meterOffsets || {};
    // Fatigue carries forward and compounds
    const fatigueEffect = this.fatigue * 0.3;
    return {
      queue: Math.max(0, Math.min(40, 5 + (offsets.queue || 0))),
      safety: Math.max(0, Math.min(40, 2 + (offsets.safety || 0) + fatigueEffect * 0.3)),
      rage: Math.max(0, Math.min(40, 3 + (offsets.rage || 0))),
      burnout: Math.max(0, Math.min(50, fatigueEffect + (offsets.burnout || 0))),
      scrutiny: Math.max(0, Math.min(40, (offsets.scrutiny || 0))),
    };
  }

  getDifficultyMults() {
    const seg = this.currentSegmentType;
    // Each segment after the first gets harder
    const scaleFactor = 1 + (this.segment - 1) * 0.08;
    return {
      ambientMult: (seg.ambientMult || 1) * scaleFactor,
      eventMult: (seg.eventMult || 1) * scaleFactor,
      durationMult: seg.durationMult || 1,
    };
  }

  recordSegmentResult(won, meters, stats) {
    this.segmentResults.push({
      segment: this.segment,
      segmentType: this.currentSegmentType.id,
      segmentName: this.currentSegmentType.name,
      won,
      meters: { ...meters },
    });

    // Update fatigue — it always increases
    this.hoursAwake += 6; // each segment ≈ 6 hours
    if (won) {
      this.fatigue = Math.min(100, this.fatigue + 12 + this.segment * 3);
    } else {
      this.fatigue = Math.min(100, this.fatigue + 20);
    }

    this.totalSegments = this.segmentResults.length;
  }

  getExtensionPrompt() {
    const eligible = EXTENSION_PROMPTS.filter(p => this.segment >= p.minSeg);
    if (eligible.length === 0) {
      return { prompt: 'Can you stay?', sub: 'There\'s no one else.' };
    }
    const totalWeight = eligible.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const p of eligible) {
      roll -= p.weight;
      if (roll <= 0) return { prompt: p.prompt, sub: p.sub };
    }
    return eligible[eligible.length - 1];
  }

  advanceSegment() {
    this.segment++;
    this.pickSegment();
  }

  cashOut() {
    this.cashedOut = true;
    this.active = false;
  }

  collapse() {
    this.active = false;
  }

  getEndlessSummary() {
    const segNames = this.segmentResults.map(r => r.segmentName);
    return {
      segments: this.totalSegments,
      survived: this.segmentResults.filter(r => r.won).length,
      hoursAwake: this.hoursAwake,
      fatigue: this.fatigue,
      cashedOut: this.cashedOut,
      results: this.segmentResults,
      storeNames: segNames,
    };
  }

  getEndMessage() {
    if (this.cashedOut) {
      if (this.totalSegments >= 6) return { title: 'LEGENDARY', flavor: `${this.hoursAwake} hours. You finally said no.` };
      if (this.totalSegments >= 4) return { title: 'IRON WILL', flavor: `${this.hoursAwake} hours on the bench. Relief finally came.` };
      if (this.totalSegments >= 2) return { title: 'CLOCKED OUT', flavor: 'You did more than anyone asked.' };
      return { title: 'SMART MOVE', flavor: 'Sometimes the best play is going home.' };
    }
    // Collapsed
    if (this.totalSegments >= 5) return { title: 'STILL HERE', flavor: `${this.hoursAwake} hours. Your body gave out before your will did.` };
    if (this.totalSegments >= 3) return { title: 'PUSHED TOO FAR', flavor: 'You should have gone home two stores ago.' };
    return { title: 'NOT TODAY', flavor: 'Some days you just can\'t hold it together.' };
  }

  getSegmentEventWeights(segmentIndex) {
    // Early segments: more ambient, less pressure
    // Later segments: more pressure, occasional signature
    const ambient = Math.max(30, 70 - segmentIndex * 8);
    const pressure = Math.min(50, 25 + segmentIndex * 5);
    const signature = Math.min(20, segmentIndex >= 3 ? (segmentIndex - 2) * 5 : 0);
    return { ambient, pressure, signature };
  }

  applyFatigueEffects() {
    const effects = {};
    if (this.fatigue > 30) effects.blurVision = true;  // visual effect hint
    if (this.fatigue > 50) effects.slowerInput = 0.9;  // 90% input speed
    if (this.fatigue > 70) effects.meterDrift = 0.5;   // meters drift up passively
    if (this.fatigue > 85) effects.randomMistakes = true; // occasional auto-errors
    return effects;
  }

  getEndlessBarks(segmentIndex) {
    const barks = [
      // Early segments
      ["You're still here?", "Didn't your shift end hours ago?", "They couldn't find anyone else?"],
      // Mid segments
      ["How long have you been working?", "You look exhausted.", "When was the last time you ate?"],
      // Late segments
      ["Are you okay?", "You should go home.", "I'm worried about you.", "Your hands are shaking."],
      // Very late
      ["Please go home.", "This isn't safe anymore.", "When did you last sleep?", "Someone call someone."],
    ];
    const tier = Math.min(3, Math.floor(segmentIndex / 2));
    return barks[tier];
  }

  applyCampaignBonuses(campaignState) {
    if (!campaignState) return;
    const bonuses = {};
    // Ch4 complete: +10% fatigue resistance (fatigue gain * 0.9)
    if (campaignState.ch4Complete) bonuses.fatigueResistance = 0.9;
    // Ch6 complete: supervisor events disabled in endless
    if (campaignState.ch6Complete) bonuses.disableSupervisor = true;
    // Perfect campaign: starting fatigue reduced by 10
    if (campaignState.perfectCampaign) {
      bonuses.startingFatigueReduction = 10;
      this.fatigue = Math.max(0, this.fatigue - 10);
    }
    this.campaignBonuses = bonuses;
    return bonuses;
  }

  getModeName() {
    return ENDLESS_NAMES[Math.floor(Math.random() * ENDLESS_NAMES.length)];
  }
}
