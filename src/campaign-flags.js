// campaign-flags.js - Campaign flag tracking system

const DECISION_FLAG_MAP = {
  // Chapter 1: First Day
  c1_stay_late:       { 0: { counters: ['stayed_late_count'] }, 1: {}, 2: {} },
  c1_framing:         { 0: { counters: ['said_yes_count'] }, 1: { counters: ['preserved_standards_count'] }, 2: {} },
  c1_mentor_guidance: { 0: { counters: ['protected_team_count'] }, 1: { counters: ['said_yes_count'] }, 2: {} },

  // Chapter 2: Settling In
  c2_bad_handoff:     { 0: { counters: ['preserved_standards_count'] }, 1: { counters: ['said_yes_count'] }, 2: {} },
  c2_adapt_store:     { 0: { counters: ['said_yes_count'] }, 1: { counters: ['preserved_standards_count'] }, 2: { flags: ['backed_down_for_optics'] } },
  c2_coverage_asks:   { 0: { counters: ['stayed_late_count'] }, 1: { counters: ['protected_team_count'] }, 2: {} },

  // Chapter 3: The Weight
  c3_aisle_help:      { 0: { counters: ['said_yes_count'] }, 1: {}, 2: { counters: ['preserved_standards_count'] } },
  c3_lonely_regular:  { 0: { counters: ['protected_team_count'] }, 1: { counters: ['stayed_late_count'] }, 2: {} },
  c3_visit_collapse:  { 0: { counters: ['said_yes_count', 'stayed_late_count'] }, 1: { flags: ['backed_down_for_optics'] }, 2: { counters: ['preserved_standards_count'] } },

  // Chapter 4: Holding the Line
  c4_can_you_stay:    { 0: { counters: ['stayed_late_count'] }, 1: { counters: ['protected_team_count'] }, 2: {} },
  c4_no_relief:       { 0: { counters: ['said_yes_count'] }, 1: { counters: ['preserved_standards_count'] }, 2: { flags: ['actively_looking_for_exit'] } },
  c4_cover_once:      { 0: { counters: ['stayed_late_count', 'said_yes_count'] }, 1: { counters: ['protected_team_count'] }, 2: {} },

  // Chapter 5: Crossroads
  c5_pic_identity:    { 0: { flags: ['took_manager_role'] }, 1: { counters: ['preserved_standards_count'] }, 2: { flags: ['actively_looking_for_exit'] } },
  c5_new_hire:        { 0: { flags: ['trained_new_hire'] }, 1: { counters: ['said_yes_count'] }, 2: {} },
  c5_offsite:         { 0: { flags: ['accepted_stretch_role'] }, 1: { flags: ['backed_down_for_optics'] }, 2: {} },

  // Chapter 6: The Fork
  c6_problem_store:   { 0: { counters: ['protected_team_count'] }, 1: { flags: ['backed_down_for_optics'] }, 2: { counters: ['preserved_standards_count'] } },
  c6_visit_absurd:    { 0: { counters: ['said_yes_count'] }, 1: { counters: ['preserved_standards_count'] }, 2: { flags: ['actively_looking_for_exit'] } },
  c6_district_fork:   { 0: { flags: ['took_manager_role', 'accepted_stretch_role'] }, 1: { flags: ['survived_overnight_path'] }, 2: { flags: ['actively_looking_for_exit'] } },
};

const THRESHOLD_CONFIG = [
  { counter: 'said_yes_count',            threshold: 4, flag: 'said_yes_often' },
  { counter: 'protected_team_count',      threshold: 3, flag: 'protected_team_often' },
  { counter: 'stayed_late_count',         threshold: 3, flag: 'stayed_late_often' },
  { counter: 'preserved_standards_count', threshold: 4, flag: 'preserved_standards' },
];

const FLAG_DESCRIPTIONS = {
  said_yes_often:           'Consistently agreed to extra demands',
  protected_team_often:     'Repeatedly stood up for team members',
  stayed_late_often:        'Frequently stayed past scheduled hours',
  accepted_stretch_role:    'Took on responsibilities beyond the job description',
  trained_new_hire:         'Invested time in training a new team member',
  backed_down_for_optics:   'Chose appearance over principle when pressured',
  preserved_standards:      'Maintained professional standards despite pressure',
  actively_looking_for_exit:'Began exploring ways out of the current situation',
  took_manager_role:        'Stepped into a management position',
  survived_overnight_path:  'Made it through the overnight shift arc',
};

const ALL_FLAGS = Object.keys(FLAG_DESCRIPTIONS);

export class CampaignFlags {
  constructor() {
    this.flags = {};
    for (const name of ALL_FLAGS) {
      this.flags[name] = false;
    }
    this.counters = {};
    for (const { counter } of THRESHOLD_CONFIG) {
      this.counters[counter] = 0;
    }
  }

  recordChoice(choiceId, choiceIndex) {
    const mapping = DECISION_FLAG_MAP[choiceId];
    if (!mapping) return;
    const effects = mapping[choiceIndex];
    if (!effects) return;

    if (effects.flags) {
      for (const flagName of effects.flags) {
        if (flagName in this.flags) {
          this.flags[flagName] = true;
        }
      }
    }
    if (effects.counters) {
      for (const counterName of effects.counters) {
        if (counterName in this.counters) {
          this.counters[counterName]++;
        }
      }
    }
    this.evaluateThresholds();
  }

  checkFlag(flagName) {
    return this.flags[flagName] === true;
  }

  getActiveFlags() {
    return ALL_FLAGS.filter(name => this.flags[name]);
  }

  evaluateThresholds() {
    for (const { counter, threshold, flag } of THRESHOLD_CONFIG) {
      if (this.counters[counter] >= threshold) {
        this.flags[flag] = true;
      }
    }
  }

  serialize() {
    return {
      flags: { ...this.flags },
      counters: { ...this.counters },
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.flags) {
      for (const name of ALL_FLAGS) {
        this.flags[name] = data.flags[name] === true;
      }
    }
    if (data.counters) {
      for (const key of Object.keys(this.counters)) {
        this.counters[key] = data.counters[key] || 0;
      }
    }
  }

  getFlagSummary() {
    const summary = {};
    for (const name of ALL_FLAGS) {
      summary[name] = {
        active: this.flags[name],
        description: FLAG_DESCRIPTIONS[name],
      };
    }
    return summary;
  }
}
