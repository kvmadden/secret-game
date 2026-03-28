// achievements.js - Achievement/badge system for Over The Bridge pharmacy survival game
// No external dependencies. No imports.
import { CAMPAIGN_ACHIEVEMENTS } from './campaign-achievements-data.js';

const STORAGE_KEY = 'otb-achievements';

const ACHIEVEMENT_DEFS = [
  // === Survival ===
  { id: 'first_shift', name: 'First Shift', description: 'Complete your first shift', category: 'Survival', icon: '💊', hidden: false, target: 1 },
  { id: 'iron_will', name: 'Iron Will', description: 'Complete a shift with no meters over 80', category: 'Survival', icon: '🛡️', hidden: false, target: 1 },
  { id: 'perfect_day', name: 'Perfect Day', description: 'Complete a shift with all meters under 50', category: 'Survival', icon: '🌟', hidden: false, target: 1 },
  { id: 'danger_zone', name: 'Danger Zone', description: 'Survive with a meter at 95+', category: 'Survival', icon: '⚠️', hidden: false, target: 1 },
  { id: 'five_star', name: 'Five-Star Pharmacist', description: 'Get grade A on a shift', category: 'Survival', icon: '⭐', hidden: false, target: 1 },
  { id: 'flawless_week', name: 'Flawless Week', description: 'Complete full campaign with no losses', category: 'Survival', icon: '🏆', hidden: false, target: 1 },

  // === Speed ===
  { id: 'speed_demon', name: 'Speed Demon', description: 'Handle 5 events in under 30 seconds', category: 'Speed', icon: '⚡', hidden: false, target: 1 },
  { id: 'combo_master', name: 'Combo Master', description: 'Reach a 5x combo', category: 'Speed', icon: '🔥', hidden: false, target: 1 },
  { id: 'combo_king', name: 'Combo King', description: 'Reach a 10x combo', category: 'Speed', icon: '👑', hidden: false, target: 1 },
  { id: 'lightning_hands', name: 'Lightning Hands', description: 'Rush 3 events in a row', category: 'Speed', icon: '🖐️', hidden: false, target: 1 },

  // === Endurance ===
  { id: 'marathon', name: 'Marathon', description: 'Survive 5 segments in Endless mode', category: 'Endurance', icon: '🏃', hidden: false, target: 5 },
  { id: 'iron_pharmacist', name: 'Iron Pharmacist', description: 'Survive 10 segments in Endless mode', category: 'Endurance', icon: '💪', hidden: false, target: 10 },
  { id: 'no_relief', name: 'No Relief', description: 'Survive 15 segments in Endless mode', category: 'Endurance', icon: '🧱', hidden: false, target: 15 },

  // === Humor/Story ===
  { id: 'customer_wrong', name: 'The Customer Is Always Wrong', description: 'Max out the rage meter', category: 'Humor', icon: '😤', hidden: false, target: 1 },
  { id: 'burned_crisp', name: 'Burned to a Crisp', description: 'Lose to burnout 3 times', category: 'Humor', icon: '🔥', hidden: false, target: 3 },
  { id: 'phone_tag', name: 'Phone Tag', description: 'Handle 10 phone events in one shift', category: 'Humor', icon: '📞', hidden: false, target: 10 },
  { id: 'drive_thru_hero', name: 'Drive-Thru Hero', description: 'Handle 8 drive-thru events in one shift', category: 'Humor', icon: '🚗', hidden: false, target: 8 },
  { id: 'pill_counter', name: 'Pill Counter', description: 'Verify 20 scripts in one shift', category: 'Humor', icon: '💊', hidden: false, target: 20 },
  { id: 'the_closer', name: 'The Closer', description: 'Survive the Late Drag phase 10 times', category: 'Humor', icon: '🌙', hidden: false, target: 10 },
  { id: 'sunday_warrior', name: 'Sunday Warrior', description: 'Win on a Sunday shift', category: 'Humor', icon: '☀️', hidden: false, target: 1 },
  { id: 'corporate_smile', name: 'Corporate Smile', description: 'Keep scrutiny under 20 for a full shift', category: 'Humor', icon: '😁', hidden: false, target: 1 },
  { id: 'queue_whisperer', name: 'Queue Whisperer', description: 'Keep queue under 30 for a full shift', category: 'Humor', icon: '🤫', hidden: false, target: 1 },

  // === Campaign ===
  { id: 'ending_builder', name: 'Builder', description: 'Reach the Builder ending', category: 'Campaign', icon: '🔨', hidden: false, target: 1 },
  { id: 'ending_escape', name: 'Escape Artist', description: 'Reach the Escape ending', category: 'Campaign', icon: '🚪', hidden: false, target: 1 },
  { id: 'ending_climber', name: 'Climber', description: 'Reach the Climber ending', category: 'Campaign', icon: '🧗', hidden: false, target: 1 },
  { id: 'ending_quiet', name: 'Quiet Professional', description: 'Reach the Quiet Pro ending', category: 'Campaign', icon: '🤐', hidden: false, target: 1 },
  { id: 'ending_martyr', name: 'Martyr', description: 'Reach the Martyr ending', category: 'Campaign', icon: '🕯️', hidden: false, target: 1 },
  { id: 'seen_it_all', name: 'Seen It All', description: 'Reach all 5 endings', category: 'Campaign', icon: '🗺️', hidden: false, target: 5 },

  // === Hidden ===
  { id: 'triple_defer', name: '???', description: 'Defer the same event 3 times', category: 'Hidden', icon: '🔄', hidden: true, target: 1 },
  { id: 'lunch_champ', name: 'Lunch Break Champion', description: 'Do nothing during lunch close', category: 'Hidden', icon: '🥪', hidden: true, target: 1 },
  { id: 'the_stare', name: 'The Stare', description: 'Leave pharmacist idle for 30 seconds', category: 'Hidden', icon: '👁️', hidden: true, target: 1 },
  { id: 'rubber_duck', name: 'Rubber Duck', description: 'Click the pharmacist sprite 10 times', category: 'Hidden', icon: '🦆', hidden: true, target: 10 },
  { id: 'overachiever', name: 'Overachiever', description: 'Unlock 25 other achievements', category: 'Hidden', icon: '🎖️', hidden: true, target: 25 },
];

export class AchievementSystem {
  constructor() {
    this._achievements = ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      progress: 0,
      unlocked: false,
      unlockedAt: null,
    }));
    this._listeners = [];
    this._index = {};
    for (let i = 0; i < this._achievements.length; i++) {
      this._index[this._achievements[i].id] = this._achievements[i];
    }

    // Merge campaign achievements if available
    if (typeof CAMPAIGN_ACHIEVEMENTS !== 'undefined') {
      for (const ach of CAMPAIGN_ACHIEVEMENTS) {
        if (!this._achievements.find(a => a.id === ach.id)) {
          const entry = { ...ach, progress: 0, unlocked: false, unlockedAt: null };
          this._achievements.push(entry);
          this._index[entry.id] = entry;
        }
      }
    }
  }

  /**
   * Check if an event triggers any achievement. Returns array of newly unlocked achievements.
   * @param {string} event - The event name
   * @param {object} data - Event-specific data
   * @returns {Array} Newly unlocked achievements
   */
  check(event, data) {
    const newlyUnlocked = [];
    const d = data || {};

    switch (event) {
      case 'shift_complete': {
        // First Shift
        this._increment('first_shift', 1);
        // Iron Will - no meters over 80
        if (d.maxMeter !== undefined && d.maxMeter <= 80) {
          this._increment('iron_will', 1);
        }
        // Perfect Day - all meters under 50
        if (d.maxMeter !== undefined && d.maxMeter < 50) {
          this._increment('perfect_day', 1);
        }
        // Five-Star Pharmacist - grade A
        if (d.grade === 'A') {
          this._increment('five_star', 1);
        }
        // Sunday Warrior
        if (d.day === 'Sunday' || d.dayOfWeek === 0) {
          this._increment('sunday_warrior', 1);
        }
        // Corporate Smile - scrutiny stayed under 20
        if (d.maxScrutiny !== undefined && d.maxScrutiny < 20) {
          this._increment('corporate_smile', 1);
        }
        // Queue Whisperer - queue stayed under 30
        if (d.maxQueue !== undefined && d.maxQueue < 30) {
          this._increment('queue_whisperer', 1);
        }
        break;
      }

      case 'meter_critical': {
        // Danger Zone - survived with meter at 95+
        if (d.value !== undefined && d.value >= 95) {
          this._increment('danger_zone', 1);
        }
        // The Customer Is Always Wrong - rage maxed out
        if (d.meter === 'rage' && d.value >= 100) {
          this._increment('customer_wrong', 1);
        }
        break;
      }

      case 'campaign_complete': {
        if (d.noLosses) {
          this._increment('flawless_week', 1);
        }
        break;
      }

      case 'events_burst': {
        // Speed Demon - 5 events in under 30 seconds
        if (d.count >= 5 && d.elapsed !== undefined && d.elapsed <= 30) {
          this._increment('speed_demon', 1);
        }
        break;
      }

      case 'combo': {
        if (d.count >= 5) {
          this._increment('combo_master', 1);
        }
        if (d.count >= 10) {
          this._increment('combo_king', 1);
        }
        break;
      }

      case 'rush_streak': {
        if (d.count >= 3) {
          this._increment('lightning_hands', 1);
        }
        break;
      }

      case 'endless_segment': {
        const seg = d.segment || d.count || 0;
        this._setProgress('marathon', Math.min(seg, 5));
        this._setProgress('iron_pharmacist', Math.min(seg, 10));
        this._setProgress('no_relief', Math.min(seg, 15));
        break;
      }

      case 'burnout_loss': {
        this._increment('burned_crisp', 1);
        break;
      }

      case 'phone_event': {
        this._increment('phone_tag', 1);
        break;
      }

      case 'drive_thru_event': {
        this._increment('drive_thru_hero', 1);
        break;
      }

      case 'script_verified': {
        this._increment('pill_counter', 1);
        break;
      }

      case 'late_drag_survived': {
        this._increment('the_closer', 1);
        break;
      }

      case 'ending_reached': {
        const endingMap = {
          builder: 'ending_builder',
          escape: 'ending_escape',
          climber: 'ending_climber',
          quiet: 'ending_quiet',
          quiet_pro: 'ending_quiet',
          martyr: 'ending_martyr',
        };
        const achId = endingMap[d.ending];
        if (achId) {
          this._increment(achId, 1);
        }
        // Check Seen It All
        const endingIds = ['ending_builder', 'ending_escape', 'ending_climber', 'ending_quiet', 'ending_martyr'];
        const endingsUnlocked = endingIds.filter(eid => this._index[eid].unlocked).length;
        this._setProgress('seen_it_all', endingsUnlocked);
        break;
      }

      case 'event_deferred': {
        if (d.times >= 3) {
          this._increment('triple_defer', 1);
        }
        break;
      }

      case 'lunch_close_idle': {
        this._increment('lunch_champ', 1);
        break;
      }

      case 'idle': {
        if (d.seconds >= 30) {
          this._increment('the_stare', 1);
        }
        break;
      }

      case 'sprite_click': {
        this._increment('rubber_duck', 1);
        break;
      }

      default:
        break;
    }

    // Check overachiever meta-achievement
    const totalUnlocked = this._achievements.filter(a => a.unlocked && a.id !== 'overachiever').length;
    this._setProgress('overachiever', totalUnlocked);

    // Collect newly unlocked this cycle
    for (const ach of this._achievements) {
      if (ach.unlocked && ach._justUnlocked) {
        newlyUnlocked.push(this._toPublic(ach));
        delete ach._justUnlocked;
      }
    }

    return newlyUnlocked;
  }

  /**
   * Returns array of unlocked achievement objects.
   */
  getUnlocked() {
    return this._achievements
      .filter(a => a.unlocked)
      .map(a => this._toPublic(a));
  }

  /**
   * Returns array of locked achievement objects.
   */
  getLocked() {
    return this._achievements
      .filter(a => !a.unlocked)
      .map(a => this._toPublic(a));
  }

  /**
   * Returns all achievements.
   */
  getAll() {
    return this._achievements.map(a => this._toPublic(a));
  }

  /**
   * Get progress toward a specific achievement.
   * @param {string} id
   * @returns {object|null} { id, name, progress, target, percent, unlocked } or null
   */
  getProgress(id) {
    const ach = this._index[id];
    if (!ach) return null;
    return {
      id: ach.id,
      name: ach.name,
      progress: ach.progress,
      target: ach.target,
      percent: Math.min(100, Math.floor((ach.progress / ach.target) * 100)),
      unlocked: ach.unlocked,
    };
  }

  /**
   * Reset all progress.
   */
  reset() {
    for (const ach of this._achievements) {
      ach.progress = 0;
      ach.unlocked = false;
      ach.unlockedAt = null;
      delete ach._justUnlocked;
    }
  }

  /**
   * Save achievement state to localStorage.
   */
  save() {
    if (typeof localStorage === 'undefined') return;
    const state = {};
    for (const ach of this._achievements) {
      state[ach.id] = {
        progress: ach.progress,
        unlocked: ach.unlocked,
        unlockedAt: ach.unlockedAt,
      };
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_e) {
      // Storage full or unavailable - silently fail
    }
  }

  /**
   * Load achievement state from localStorage.
   */
  load() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      for (const ach of this._achievements) {
        const saved = state[ach.id];
        if (saved) {
          ach.progress = saved.progress || 0;
          ach.unlocked = !!saved.unlocked;
          ach.unlockedAt = saved.unlockedAt || null;
        }
      }
    } catch (_e) {
      // Corrupt data - silently fail, keep defaults
    }
  }

  /**
   * Register a listener called when any achievement unlocks.
   * @param {function} fn - receives the unlocked achievement object
   * @returns {function} unsubscribe function
   */
  onUnlock(fn) {
    this._listeners.push(fn);
    return () => {
      const idx = this._listeners.indexOf(fn);
      if (idx !== -1) this._listeners.splice(idx, 1);
    };
  }

  /**
   * Check if an achievement is unlocked.
   * @param {string} achievementId
   * @returns {boolean}
   */
  isUnlocked(achievementId) {
    const ach = this._index[achievementId];
    return ach ? ach.unlocked : false;
  }

  /**
   * Manually unlock an achievement by id.
   * @param {string} achievementId
   */
  unlock(achievementId) {
    this._increment(achievementId, Infinity);
  }

  /**
   * Check campaign-specific achievements based on campaign state.
   * @param {object} campaignState
   */
  checkCampaignAchievements(campaignState) {
    const { chapter, shiftId, grade, ending, flags, stats } = campaignState;

    // Chapter completion checks
    if (chapter) {
      this.unlock(`${chapter}_complete`);
    }

    // Ending checks
    if (ending) {
      this.unlock(`ending_${ending}`);
      // Check if all endings have been seen
      const endingAchs = ['ending_builder', 'ending_climber', 'ending_escape', 'ending_quiet_pro', 'ending_burnout', 'ending_martyr'];
      if (endingAchs.every(id => this.isUnlocked(id))) {
        this.unlock('all_endings');
      }
    }

    // Grade checks
    if (grade === 'S' && shiftId === 'c5_offsite_clinic') {
      this.unlock('perfect_offsite');
    }

    // Flag-based checks
    if (flags) {
      if (flags.includes('survived_overnight_path')) this.unlock('survived_overnight');
      if (flags.includes('actively_looking_for_exit')) this.unlock('exit_planned');
      if (flags.includes('trained_new_hire')) this.unlock('trained_new_hire_ach');
    }

    // Shift-specific checks
    if (shiftId === 'c2_overnight' && grade !== 'F') this.unlock('survived_overnight');
    if (shiftId === 'c4_no_relief' && grade !== 'F') this.unlock('survived_no_relief');
    if (shiftId === 'c6_visit_never_comes' && grade !== 'F') this.unlock('survived_visit');
  }

  // --- Internal helpers ---

  _increment(id, amount) {
    const ach = this._index[id];
    if (!ach || ach.unlocked) return;
    ach.progress = Math.min(ach.progress + amount, ach.target);
    if (ach.progress >= ach.target) {
      this._unlock(ach);
    }
  }

  _setProgress(id, value) {
    const ach = this._index[id];
    if (!ach || ach.unlocked) return;
    ach.progress = Math.min(value, ach.target);
    if (ach.progress >= ach.target) {
      this._unlock(ach);
    }
  }

  _unlock(ach) {
    if (ach.unlocked) return;
    ach.unlocked = true;
    ach.unlockedAt = Date.now();
    ach._justUnlocked = true;
    const pub = this._toPublic(ach);
    for (const fn of this._listeners) {
      try { fn(pub); } catch (_e) { /* listener error */ }
    }
  }

  _toPublic(ach) {
    return {
      id: ach.id,
      name: ach.hidden && !ach.unlocked ? '???' : ach.name,
      description: ach.hidden && !ach.unlocked ? 'Keep playing to discover this achievement' : ach.description,
      category: ach.category,
      icon: ach.hidden && !ach.unlocked ? '❓' : ach.icon,
      hidden: ach.hidden,
      progress: ach.progress,
      target: ach.target,
      unlocked: ach.unlocked,
      unlockedAt: ach.unlockedAt,
    };
  }
}
