// campaign-grading.js - Enhanced grading system for pharmacy campaign

export const GRADE_THRESHOLDS = [
  { minScore: 95, label: 'S', color: '#ffd700', description: 'Perfect. Not a single crack.' },
  { minScore: 85, label: 'A', color: '#44cc44', description: 'Excellent. Almost flawless.' },
  { minScore: 70, label: 'B', color: '#4488cc', description: 'Good. Solid work under pressure.' },
  { minScore: 55, label: 'C', color: '#ccaa44', description: 'Acceptable. You survived.' },
  { minScore: 40, label: 'D', color: '#cc8844', description: 'Rough. Barely held together.' },
  { minScore: 0,  label: 'F', color: '#cc4444', description: 'Failed. The bench broke you.' },
];

function scoreToGrade(score) {
  const clamped = Math.max(0, Math.min(100, score));
  for (const tier of GRADE_THRESHOLDS) {
    if (clamped >= tier.minScore) return { ...tier, score: clamped };
  }
  return { ...GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1], score: clamped };
}

export function calculateShiftGrade(won, meters, stats, shiftConfig) {
  let score = 100;

  // Loss penalty
  if (!won) score -= 60;

  // Per-meter penalties
  if (meters && Array.isArray(meters)) {
    for (const val of meters) {
      if (val > 80) score -= 8;
      else if (val > 60) score -= 4;
      else if (val > 40) score -= 2;
    }

    // Average meter penalty
    const avg = meters.reduce((s, v) => s + v, 0) / (meters.length || 1);
    if (avg > 50) score -= (avg - 50) * 0.3;
  }

  // Event penalties
  if (stats) {
    if (stats.eventsIgnored) score -= stats.eventsIgnored * 2;
    if (stats.eventsDeferred > 3) score -= (stats.eventsDeferred - 3) * 1;
  }

  // Bonuses
  if (stats) {
    if (stats.prescriptionsPerMinute > 2) score += 3;
    if (meters && Array.isArray(meters) && meters.every(v => v <= 60)) score += 5;
    if (stats.allEventsHandled) score += 5;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  return scoreToGrade(score);
}

export function calculateCampaignGrade(shiftGrades, endingLane) {
  if (!shiftGrades || shiftGrades.length === 0) return scoreToGrade(0);

  let avg = shiftGrades.reduce((s, g) => s + g.score, 0) / shiftGrades.length;

  // Ending bonuses/penalties
  const endingMods = {
    builder: 3,
    quiet_pro: 2,
    climber: 1,
    escape: 0,
    martyr: 1,
    burnout_end: -5,
  };
  if (endingLane && endingMods[endingLane] !== undefined) {
    avg += endingMods[endingLane];
  }

  return scoreToGrade(avg);
}

const GRADE_EMOJIS = { S: '\u2605', A: '\u25C6', B: '\u25CF', C: '\u25CB', D: '\u25B3', F: '\u2715' };

export function getGradeEmoji(grade) {
  return GRADE_EMOJIS[grade] || '\u25CB';
}

const GRADE_MESSAGES = {
  S: [
    'Flawless shift.',
    'Not a single dropped ball.',
    'The bench never looked better.',
  ],
  A: [
    'Nearly perfect.',
    'Just a few cracks.',
    'Impressive work.',
  ],
  B: [
    'Solid day.',
    'Could be worse.',
    'The bench held.',
  ],
  C: [
    'You survived.',
    'Messy but done.',
    'Tomorrow will be better. Maybe.',
  ],
  D: [
    'Barely.',
    'That was ugly.',
    'At least nobody died. Probably.',
  ],
  F: [
    'The bench won.',
    "You'll think about this shift at 3 AM.",
    'Everyone has bad days. This was yours.',
  ],
};

export function getGradeMessage(grade, shiftId) {
  const pool = GRADE_MESSAGES[grade] || GRADE_MESSAGES.F;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

export const PERSONAL_BEST_TRACKER = {
  _key(shiftId) {
    return `campaign_pb_${shiftId}`;
  },

  checkPersonalBest(shiftId, score) {
    const prev = this.getPersonalBest(shiftId);
    if (score > prev) {
      try {
        localStorage.setItem(this._key(shiftId), String(score));
      } catch (_) { /* storage unavailable */ }
      return true;
    }
    return false;
  },

  getPersonalBest(shiftId) {
    try {
      const val = localStorage.getItem(this._key(shiftId));
      return val !== null ? Number(val) : 0;
    } catch (_) {
      return 0;
    }
  },

  isNewRecord(shiftId, score) {
    return score > this.getPersonalBest(shiftId);
  },
};
