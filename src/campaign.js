/**
 * Campaign mode -- multi-chapter story progression with persistent variables.
 * Navigates through CAMPAIGN_NODES (story, shift, decision, chapter_result, ending).
 * Tracks 6 persistent variables that influence shift difficulty and determine endings.
 */

import { SHIFT_DAYS, WEATHER_TYPES } from './constants.js';
import { CAMPAIGN_NODES as CAMPAIGN_NODES_ARR, CHAPTERS, ENDING_LANES } from './campaign-nodes.js';
import { CampaignFlags } from './campaign-flags.js';
import { selectEndingRoute } from './route-selection.js';
import { CampaignStats } from './campaign-stats.js';

// Convert array to id-keyed lookup map
const CAMPAIGN_NODES = {};
for (const node of CAMPAIGN_NODES_ARR) {
  CAMPAIGN_NODES[node.id] = node;
}

// ========== BETWEEN-SHIFT DECISIONS ==========
// Each decision has 3 choices whose effects modify the 6 persistent variables.

const DECISION_POOL = [
  {
    id: 'overtime',
    prompt: 'Corporate is offering overtime hours.',
    choices: [
      { label: 'ACCEPT', desc: 'Extra pay, but start tired.', effects: { burnout: 15, reputation: 3 } },
      { label: 'DECLINE', desc: 'Protect your energy.', effects: { burnout: -10 } },
      { label: 'NEGOTIATE', desc: 'Half shift OT. Balanced.', effects: { burnout: 5, leadershipAlignment: 3 } },
    ],
  },
  {
    id: 'staff_request',
    prompt: 'You can request an extra tech for tomorrow.',
    choices: [
      { label: 'REQUEST TECH', desc: 'Slower script pressure.', effects: { teamStrength: 8, leadershipAlignment: -3 } },
      { label: 'GO SOLO', desc: 'Prove you can handle it.', effects: { burnout: 8, reputation: 5 } },
      { label: 'ASK INTERN', desc: 'Free help, but... safety.', effects: { teamStrength: 4, clinicalIntegrity: -5 } },
    ],
  },
  {
    id: 'rest_night',
    prompt: 'How do you spend your evening?',
    choices: [
      { label: 'SLEEP EARLY', desc: 'Fresh start tomorrow.', effects: { burnout: -10 } },
      { label: 'STUDY CE', desc: 'Continuing education. Impress the DM.', effects: { clinicalIntegrity: 8, burnout: 5 } },
      { label: 'GO OUT', desc: 'You need a life. Right?', effects: { burnout: -3, teamStrength: 3 } },
    ],
  },
  {
    id: 'equipment',
    prompt: 'The counting machine is acting up.',
    choices: [
      { label: 'FIX IT', desc: 'Takes time, but safer.', effects: { storeReadiness: 8, burnout: 5 } },
      { label: 'REPORT IT', desc: 'Let corporate handle it.', effects: { leadershipAlignment: 5, storeReadiness: -3 } },
      { label: 'WORK AROUND', desc: 'Count by hand. It\'s fine.', effects: { clinicalIntegrity: -5, burnout: 3 } },
    ],
  },
  {
    id: 'complaint_response',
    prompt: 'A patient filed a complaint about yesterday.',
    choices: [
      { label: 'APOLOGIZE', desc: 'Smooth it over.', effects: { reputation: 5, leadershipAlignment: 3 } },
      { label: 'DOCUMENT', desc: 'Paper trail protects you.', effects: { clinicalIntegrity: 5, burnout: 5 } },
      { label: 'IGNORE', desc: 'It\'ll blow over.', effects: { reputation: -5, leadershipAlignment: -5 } },
    ],
  },
  {
    id: 'training_offer',
    prompt: 'Corporate wants you at a training seminar.',
    choices: [
      { label: 'ATTEND', desc: 'Good optics. Less rest.', effects: { leadershipAlignment: 10, burnout: 10 } },
      { label: 'SKIP', desc: 'You need the rest more.', effects: { burnout: -5, leadershipAlignment: -5 } },
      { label: 'SEND NOTES', desc: '"I reviewed the materials."', effects: { leadershipAlignment: 3, clinicalIntegrity: 3 } },
    ],
  },
  {
    id: 'drive_thru',
    prompt: 'The drive-thru speaker is broken again.',
    choices: [
      { label: 'CLOSE IT', desc: 'One less station. Patients angry.', effects: { reputation: -5, burnout: -5 } },
      { label: 'SHOUT', desc: 'Yell through the window. It works.', effects: { burnout: 5, teamStrength: -3 } },
      { label: 'FIX IT', desc: 'You\'re not maintenance, but...', effects: { storeReadiness: 8, burnout: 8 } },
    ],
  },
  {
    id: 'lunch_policy',
    prompt: 'New policy: staggered lunches or close the gate?',
    choices: [
      { label: 'CLOSE GATE', desc: 'Standard. Patients hate it.', effects: { reputation: -3, storeReadiness: 3 } },
      { label: 'STAGGER', desc: 'No break for you, less rage buildup.', effects: { burnout: 8, teamStrength: 5 } },
      { label: 'SKIP LUNCH', desc: 'You don\'t need to eat. Right?', effects: { burnout: 15, storeReadiness: 5 } },
    ],
  },
  {
    id: 'social_media',
    prompt: 'Someone tagged the pharmacy in a bad review.',
    choices: [
      { label: 'RESPOND', desc: 'Professional reply. Takes effort.', effects: { reputation: 8, burnout: 5 } },
      { label: 'DELETE', desc: 'If you can\'t see it...', effects: { leadershipAlignment: -3, reputation: -3 } },
      { label: 'IGNORE', desc: 'Don\'t feed the trolls.', effects: { reputation: -5 } },
    ],
  },
  {
    id: 'inventory',
    prompt: 'Inventory shipment is short. What do you do?',
    choices: [
      { label: 'BORROW', desc: 'Call another store. Owe them.', effects: { storeReadiness: 5, teamStrength: 3 } },
      { label: 'SHORT FILL', desc: 'Give partial fills. Patients wait.', effects: { clinicalIntegrity: -5, reputation: -3 } },
      { label: 'REORDER STAT', desc: 'Costs extra, but it arrives.', effects: { storeReadiness: 8, leadershipAlignment: -3 } },
    ],
  },
  {
    id: 'new_tech',
    prompt: 'New tech starts tomorrow. They need training.',
    choices: [
      { label: 'TRAIN THEM', desc: 'Slow day, but invest in future.', effects: { teamStrength: 10, burnout: -3 } },
      { label: 'SINK OR SWIM', desc: 'They\'ll figure it out.', effects: { clinicalIntegrity: -5, teamStrength: -5 } },
      { label: 'PAIR UP', desc: 'Shadow an experienced tech.', effects: { teamStrength: 5, clinicalIntegrity: 3 } },
    ],
  },
  {
    id: 'flu_season',
    prompt: 'Flu season is ramping up. Vaccine walk-ins expected.',
    choices: [
      { label: 'OPEN CLINIC', desc: 'More work, more visibility.', effects: { reputation: 8, burnout: 8 } },
      { label: 'BY APPT ONLY', desc: 'Manageable, but patients complain.', effects: { reputation: -3, storeReadiness: 5 } },
      { label: 'DECLINE ALL', desc: 'Focus on scripts. Corporate won\'t like it.', effects: { leadershipAlignment: -8, burnout: -5 } },
    ],
  },
];

// ========== ENDING MESSAGES ==========

const CAMPAIGN_END_MESSAGES = {
  builder:     { title: 'THE BUILDER', flavor: 'You made this place better than you found it.' },
  escape:      { title: 'THE ESCAPE', flavor: 'You got out. Maybe that was the right call.' },
  climber:     { title: 'THE CLIMBER', flavor: 'Corporate noticed. Promotion incoming.' },
  quiet_pro:   { title: 'THE QUIET PRO', flavor: 'Nobody noticed. That was the whole point.' },
  martyr:      { title: 'THE MARTYR', flavor: 'You gave everything. Was it worth it?' },
  burnout_end: { title: 'BURNED OUT', flavor: 'You stared at the ceiling for an hour before getting up today.' },
  default:     { title: 'SURVIVED', flavor: 'The week ended. You\'re still here.' },
};

// ========== HELPER: clamp ==========

function clamp(val, lo, hi) {
  return Math.max(lo, Math.min(hi, val));
}

// ========== CAMPAIGN CLASS ==========

export class Campaign {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.totalDays = 16;

    // 6 persistent variables (0-100)
    this.burnout = 10;
    this.reputation = 50;
    this.teamStrength = 50;
    this.storeReadiness = 50;
    this.leadershipAlignment = 50;
    this.clinicalIntegrity = 50;

    // Node navigation
    this.currentNodeId = null;
    this.shiftsCompleted = 0;

    // Backward-compat shiftModifiers derived from persistent state
    this.shiftModifiers = this._deriveShiftModifiers();

    // Track results per day
    this.dayResults = [];

    // Decision history
    this.decisionsUsed = new Set();
    this.pendingDecision = null;

    // Ending lane once determined
    this.endingLane = null;

    // Enhanced campaign flag system and stats tracking
    this.flags = new CampaignFlags();
    this.campaignStats = new CampaignStats();
  }

  // ===== Lifecycle =====

  start() {
    this.reset();
    this.active = true;
    this.currentNodeId = 'p_intro';
    this.shiftModifiers = this._deriveShiftModifiers();
  }

  isActive() {
    return this.active;
  }

  // ===== Node navigation =====

  getCurrentNode() {
    if (!this.currentNodeId) return null;
    return CAMPAIGN_NODES[this.currentNodeId] || null;
  }

  getNodeType() {
    const node = this.getCurrentNode();
    return node ? node.type : null;
  }

  getCurrentChapter() {
    const node = this.getCurrentNode();
    if (!node || !node.chapter) return null;
    return CHAPTERS[node.chapter] || null;
  }

  getCurrentDay() {
    return this.shiftsCompleted + 1;
  }

  getShiftDay() {
    const idx = Math.min(this.shiftsCompleted, SHIFT_DAYS.length - 1);
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

  // ===== Narrative =====

  getDayNarrative() {
    const node = this.getCurrentNode();
    const chapter = this.getCurrentChapter();
    return {
      intro: node ? node.content : '',
      flavor: chapter ? chapter.subtitle : '',
    };
  }

  // ===== Starting meters =====

  getStartingMeters() {
    const node = this.getCurrentNode();
    const offsets = (node && node.difficulty && node.difficulty.meterOffsets) || {};

    // Base from node difficulty
    let queue   = 5  + (offsets.queue    || 0);
    let safety  = 2  + (offsets.safety   || 0);
    let rage    = 3  + (offsets.rage     || 0);
    let burnout = 0  + (offsets.burnout  || 0);
    let scrutiny = 0 + (offsets.scrutiny || 0);

    // Persistent variable influence
    if (this.burnout > 60)            burnout  += Math.round((this.burnout - 60) * 0.4);
    if (this.teamStrength < 30)       safety   += Math.round((30 - this.teamStrength) * 0.3);
    if (this.storeReadiness < 30)     queue    += Math.round((30 - this.storeReadiness) * 0.3);
    if (this.leadershipAlignment > 70) scrutiny -= Math.round((this.leadershipAlignment - 70) * 0.3);
    if (this.clinicalIntegrity < 30)  safety   += Math.round((30 - this.clinicalIntegrity) * 0.3);

    return {
      queue:    clamp(queue,    0, 30),
      safety:   clamp(safety,   0, 30),
      rage:     clamp(rage,     0, 30),
      burnout:  clamp(burnout,  0, 40),
      scrutiny: clamp(scrutiny, 0, 30),
    };
  }

  // ===== Shift modifiers (backward compat) =====

  _deriveShiftModifiers() {
    return {
      burnoutStart:    clamp(Math.round((this.burnout - 10) * 0.3), -10, 20),
      safetyStart:     clamp(Math.round((50 - this.clinicalIntegrity) * 0.2), -10, 15),
      scrutinyStart:   clamp(Math.round((50 - this.leadershipAlignment) * 0.2), -10, 15),
      scriptSpeedMult: clamp(0.8 + (this.teamStrength - 50) * 0.006, 0.6, 1.4),
      rageMult:        1.0,
    };
  }

  getScriptSpeedMult() {
    return this.shiftModifiers.scriptSpeedMult || 1.0;
  }

  getRageMult() {
    return this.shiftModifiers.rageMult || 1.0;
  }

  // ===== Shift result =====

  recordShiftResult(won, meters, stats, grade) {
    const result = {
      day: this.getCurrentDay(),
      won,
      meters: { ...meters },
      stats: { ...stats },
      grade,
    };
    this.dayResults.push(result);
    this.shiftsCompleted++;

    // Track shift in enhanced campaign stats
    this.campaignStats.recordShift(this.currentNodeId, won, grade, meters, stats, result.day);

    // Update persistent variables from shift outcome
    if (won) {
      this.reputation = clamp(this.reputation + (grade === 'S' ? 8 : grade === 'A' ? 5 : grade === 'B' ? 2 : -2), 0, 100);
      this.burnout = clamp(this.burnout + Math.round(meters.burnout * 0.2) - 3, 0, 100);
      this.clinicalIntegrity = clamp(this.clinicalIntegrity + (meters.safety < 30 ? 2 : -3), 0, 100);
    } else {
      this.reputation = clamp(this.reputation - 10, 0, 100);
      this.burnout = clamp(this.burnout + 8, 0, 100);
      this.clinicalIntegrity = clamp(this.clinicalIntegrity - 5, 0, 100);
    }

    // Re-derive modifiers
    this.shiftModifiers = this._deriveShiftModifiers();

    // Pick a decision for between-shift
    this.pickDecision();
  }

  // ===== Decisions =====

  pickDecision() {
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
    const decisionId = this.pendingDecision.id;
    this.decisionsUsed.add(decisionId);
    this.pendingDecision = null;

    // Apply effects to persistent variables
    const vars = ['burnout', 'reputation', 'teamStrength', 'storeReadiness', 'leadershipAlignment', 'clinicalIntegrity'];
    for (const v of vars) {
      if (effects[v] !== undefined) {
        this[v] = clamp(this[v] + effects[v], 0, 100);
      }
    }

    // Record choice in the campaign flag system
    this.flags.recordChoice(decisionId, choiceIndex);
    this.flags.evaluateThresholds();

    // Re-derive backward-compat modifiers
    this.shiftModifiers = this._deriveShiftModifiers();
  }

  // ===== Node advancement =====

  advanceToNextNode() {
    const node = this.getCurrentNode();
    if (!node) return false;

    // Determine the next node id
    let nextId = null;

    if (typeof node.next === 'string') {
      nextId = node.next;
    } else if (Array.isArray(node.next)) {
      // Array of strings or {condition, id} branch objects
      for (const branch of node.next) {
        if (typeof branch === 'string') {
          nextId = branch;
          break;
        }
        if (branch.condition && !this._evaluateCondition(branch.condition)) {
          continue;
        }
        nextId = branch.id || branch.next;
        break;
      }
      // Fallback to last entry if no condition matched
      if (!nextId && node.next.length > 0) {
        const fallback = node.next[node.next.length - 1];
        nextId = typeof fallback === 'string' ? fallback : (fallback.id || fallback.next);
      }
    }

    if (!nextId) return false;

    this.currentNodeId = nextId;
    this.shiftModifiers = this._deriveShiftModifiers();
    return true;
  }

  _evaluateCondition(condition) {
    // Condition format: { variable: 'burnout', op: '>', value: 60 }
    if (!condition) return true;
    const val = this[condition.variable];
    if (val === undefined) return true;
    switch (condition.op) {
      case '>':  return val > condition.value;
      case '>=': return val >= condition.value;
      case '<':  return val < condition.value;
      case '<=': return val <= condition.value;
      case '==': return val === condition.value;
      default:   return true;
    }
  }

  advanceDay() {
    // Try to advance to the next node
    const advanced = this.advanceToNextNode();
    if (!advanced) return false;

    // Check if we've reached the end
    const node = this.getCurrentNode();
    if (!node) return false;
    if (node.type === 'ending') {
      this.endingLane = this._determineEndingLane();
      return false;
    }

    return true;
  }

  isComplete() {
    const node = this.getCurrentNode();
    return !node || (node && node.type === 'ending') || this.shiftsCompleted >= this.totalDays;
  }

  // ===== Ending determination =====

  // NOTE: The enhanced ending system via getEnhancedEnding() / selectEndingRoute()
  // could replace this legacy logic. Kept as fallback for backward compatibility.
  _determineEndingLane() {
    const { burnout, reputation, teamStrength, storeReadiness, leadershipAlignment, clinicalIntegrity } = this;

    // Check lanes in priority order
    if (burnout > 75) {
      // Burnout fallback -- but check martyr first
      if (clinicalIntegrity > 60) return 'martyr';
      return 'burnout_end';
    }
    if (teamStrength + storeReadiness > 120) return 'builder';
    if (burnout > 60 && leadershipAlignment < 40) return 'escape';
    if (leadershipAlignment + reputation > 120) return 'climber';
    if (clinicalIntegrity > 60 &&
        burnout >= 30 && burnout <= 70 &&
        reputation >= 30 && reputation <= 70 &&
        teamStrength >= 30 && teamStrength <= 70 &&
        storeReadiness >= 30 && storeReadiness <= 70 &&
        leadershipAlignment >= 30 && leadershipAlignment <= 70) {
      return 'quiet_pro';
    }
    if (burnout > 60 && clinicalIntegrity > 60) return 'martyr';

    // Default
    return 'default';
  }

  // ===== Grading & summary =====

  getCampaignGrade() {
    const wins = this.dayResults.filter(r => r.won).length;
    const total = this.dayResults.length;
    if (total === 0) return 'fail';

    const gradeOrder = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
    const avgGrade = this.dayResults.reduce((sum, r) => sum + (gradeOrder[r.grade] || 1), 0) / total;

    if (wins >= total && avgGrade >= 4.5) return 'perfect';
    if (wins >= total * 0.7 && avgGrade >= 3.5) return 'great';
    if (wins >= total * 0.5) return 'decent';
    if (wins >= total * 0.25) return 'rough';
    return 'fail';
  }

  getCampaignEndMessage() {
    if (this.endingLane && CAMPAIGN_END_MESSAGES[this.endingLane]) {
      return CAMPAIGN_END_MESSAGES[this.endingLane];
    }
    const grade = this.getCampaignGrade();
    // Map grade to an ending message
    const gradeToLane = {
      perfect: 'climber',
      great: 'builder',
      decent: 'quiet_pro',
      rough: 'burnout_end',
      fail: 'burnout_end',
    };
    return CAMPAIGN_END_MESSAGES[gradeToLane[grade]] || CAMPAIGN_END_MESSAGES.default;
  }

  getCampaignSummary() {
    return {
      days: this.dayResults.length,
      wins: this.dayResults.filter(r => r.won).length,
      losses: this.dayResults.filter(r => !r.won).length,
      reputation: this.reputation,
      burnout: this.burnout,
      teamStrength: this.teamStrength,
      storeReadiness: this.storeReadiness,
      leadershipAlignment: this.leadershipAlignment,
      clinicalIntegrity: this.clinicalIntegrity,
      results: this.dayResults,
      grade: this.getCampaignGrade(),
      endingLane: this.endingLane || this._determineEndingLane(),
    };
  }

  // ===== Enhanced ending system =====

  getEnhancedEnding() {
    const result = selectEndingRoute({
      burnout: this.burnout,
      reputation: this.reputation,
      teamStrength: this.teamStrength,
      storeReadiness: this.storeReadiness,
      leadershipAlignment: this.leadershipAlignment,
      clinicalIntegrity: this.clinicalIntegrity,
    }, this.flags);
    return result;
  }

  // ===== Flag & stats accessors =====

  getFlags() {
    return this.flags.getActiveFlags();
  }

  getStats() {
    return this.campaignStats.getFullSummary();
  }

  // ===== Serialization =====

  serialize() {
    return {
      active: this.active,
      totalDays: this.totalDays,
      burnout: this.burnout,
      reputation: this.reputation,
      teamStrength: this.teamStrength,
      storeReadiness: this.storeReadiness,
      leadershipAlignment: this.leadershipAlignment,
      clinicalIntegrity: this.clinicalIntegrity,
      currentNodeId: this.currentNodeId,
      shiftsCompleted: this.shiftsCompleted,
      dayResults: this.dayResults,
      decisionsUsed: [...this.decisionsUsed],
      endingLane: this.endingLane,
      flags: this.flags.serialize(),
      campaignStats: this.campaignStats.serialize(),
    };
  }

  deserialize(data) {
    this.active = data.active;
    this.totalDays = data.totalDays;
    this.burnout = data.burnout;
    this.reputation = data.reputation;
    this.teamStrength = data.teamStrength;
    this.storeReadiness = data.storeReadiness;
    this.leadershipAlignment = data.leadershipAlignment;
    this.clinicalIntegrity = data.clinicalIntegrity;
    this.currentNodeId = data.currentNodeId;
    this.shiftsCompleted = data.shiftsCompleted;
    this.dayResults = data.dayResults || [];
    this.decisionsUsed = new Set(data.decisionsUsed || []);
    this.endingLane = data.endingLane;
    this.shiftModifiers = this._deriveShiftModifiers();

    // Restore enhanced flag and stats systems
    if (data.flags) {
      this.flags = new CampaignFlags();
      this.flags.deserialize(data.flags);
    }
    if (data.campaignStats) {
      this.campaignStats = CampaignStats.deserialize(data.campaignStats);
    }
  }
}
