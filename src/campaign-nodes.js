// campaign-nodes.js — Chapter spine data for campaign mode (pure data, no logic)
//
// DUAL SYSTEM:
//   Legacy nodes  — CAMPAIGN_NODES / CHAPTERS / ENDING_LANES / CHAPTER_DECISIONS
//     The original flat-array campaign data. Still exported for backward
//     compatibility with existing game logic and UI code.
//
//   Expanded nodes — getExpandedChapters() and helpers
//     Richer per-chapter data pulled from dedicated chapter files
//     (campaign-ch1.js … campaign-ch7.js), chapter intros, transitions,
//     and field-leader metadata. Use these for the expanded campaign
//     architecture.

import { CHAPTER_1 } from './campaign-ch1.js';
import { CHAPTER_2 } from './campaign-ch2.js';
import { CHAPTER_3 } from './campaign-ch3.js';
import { CHAPTER_4 } from './campaign-ch4.js';
import { CHAPTER_5 } from './campaign-ch5.js';
import { CHAPTER_6 } from './campaign-ch6.js';
import { CHAPTER_7 } from './campaign-ch7.js';
import { CHAPTER_INTROS } from './chapter-intros.js';
import { CHAPTER_TRANSITIONS } from './chapter-transitions.js';
import { FIELD_LEADERS } from './field-leaders.js';

export const CHAPTERS = [
  { id: 0, title: 'Prologue',           subtitle: 'Congratulations, Doctor — School, sacrifice, exams, debt, pride — retail reality.' },
  { id: 1, title: 'Welcome Aboard',     subtitle: 'Support first. Then they take it away.' },
  { id: 2, title: 'Float Season',       subtitle: 'You are useful. So the system sends you everywhere.' },
  { id: 3, title: 'Goldfish Bowl',      subtitle: 'The work is not only hard. It is exposed.' },
  { id: 4, title: 'The Reliable One',   subtitle: 'Competence attracts more burden.' },
  { id: 5, title: 'PIC',                subtitle: 'You wanted influence. Now you own consequences.' },
  { id: 6, title: 'We Need You Everywhere', subtitle: 'Too useful to leave alone.' },
  { id: 7, title: 'What It Made You',   subtitle: 'The days that define the career.' },
];

export const CAMPAIGN_NODES = [

  // ── PROLOGUE (chapter 0) ──────────────────────────────────────────────
  {
    id: 'p_intro',
    chapter: 0,
    type: 'story',
    title: 'Congratulations, Doctor',
    content: 'You did it. Eight years of school. Six figures of debt. Three letters after your name. The white coat fits well.',
    next: ['c1_intro'],
  },

  // ── CHAPTER 1 — Welcome Aboard ────────────────────────────────────────
  {
    id: 'c1_intro',
    chapter: 1,
    type: 'story',
    title: 'First Day',
    content: 'First day. They assigned you to a quiet Sunday store. Another pharmacist will show you around.',
    next: ['c1_shift1'],
  },
  {
    id: 'c1_shift1',
    chapter: 1,
    type: 'shift',
    title: 'Shadow Day',
    content: 'Slow Sunday store. Mentor present.',
    difficulty: {
      ambientMult: 0.7,
      eventMult: 0.7,
      meterMult: 0.8,
      meterOffsets: { burnout: -5 },
      interruptWeight: 0.1,
      desc: 'Slow Sunday store. Mentor present.',
    },
    next: ['c1_mid1'],
  },
  {
    id: 'c1_mid1',
    chapter: 1,
    type: 'story',
    title: 'On Your Own',
    content: "Your mentor says goodnight. 'You'll be fine on your own tomorrow.' They seem sure. You're not.",
    next: ['c1_shift2'],
  },
  {
    id: 'c1_shift2',
    chapter: 1,
    type: 'shift',
    title: 'Solo Sunday',
    content: 'Same store. No mentor. Just you.',
    difficulty: {
      ambientMult: 1.0,
      eventMult: 1.0,
      meterMult: 1.0,
      meterOffsets: {},
      interruptWeight: 0.15,
      desc: 'Same store. No mentor. Just you.',
    },
    next: ['c1_mid2'],
  },
  {
    id: 'c1_mid2',
    chapter: 1,
    type: 'story',
    title: 'Emergency Coverage',
    content: "Phone rings at 4 PM. Another store needs emergency coverage tomorrow. 'You're the closest licensed pharmacist.'",
    next: ['c1_shift3'],
  },
  {
    id: 'c1_shift3',
    chapter: 1,
    type: 'shift',
    title: 'Thrown In',
    content: 'Higher volume. Unfamiliar store. Faster.',
    difficulty: {
      ambientMult: 1.2,
      eventMult: 1.3,
      meterMult: 1.1,
      meterOffsets: { queue: 8 },
      interruptWeight: 0.2,
      desc: 'Higher volume. Unfamiliar store. Faster.',
    },
    next: ['c1_dec1'],
  },
  {
    id: 'c1_dec1',
    chapter: 1,
    type: 'decision',
    title: 'Exhaustion',
    content: "Three shifts in three days. You're exhausted.",
    choices: [
      {
        label: 'REST',
        desc: 'Call in tomorrow. Protect yourself.',
        effects: { burnout: -15, reputation: -5, leadershipAlignment: -5 },
      },
      {
        label: 'PUSH THROUGH',
        desc: 'They need you. Show up.',
        effects: { burnout: 10, reputation: 8, leadershipAlignment: 5 },
      },
      {
        label: 'SET BOUNDARIES',
        desc: 'Agree to two days, not three.',
        effects: { burnout: -5, reputation: 3, clinicalIntegrity: 5 },
      },
    ],
    next: ['c1_result'],
  },
  {
    id: 'c1_result',
    chapter: 1,
    type: 'chapter_result',
    title: 'Chapter 1 Complete',
    content: "I really got thrown into this fast. But I'm still here.",
    next: ['c2_intro'],
  },

  // ── CHAPTER 2 — Float Season ──────────────────────────────────────────
  {
    id: 'c2_intro',
    chapter: 2,
    type: 'story',
    title: 'The Float List',
    content: 'They put you on the float list. Different store every week. No home base.',
    next: ['c2_shift1'],
  },
  {
    id: 'c2_shift1',
    chapter: 2,
    type: 'shift',
    title: 'Disorganized Store',
    content: 'Messy shelves. Missing labels. Nothing where it should be.',
    difficulty: {
      ambientMult: 1.1,
      eventMult: 1.0,
      meterMult: 1.0,
      meterOffsets: { safety: 8 },
      interruptWeight: 0.15,
      desc: 'Messy shelves. Missing labels. Nothing where it should be.',
    },
    next: ['c2_dec1'],
  },
  {
    id: 'c2_dec1',
    chapter: 2,
    type: 'decision',
    title: 'Safety Hazard',
    content: 'This store is a safety hazard. What do you do?',
    choices: [
      {
        label: 'REPORT IT',
        desc: 'File a safety concern with corporate.',
        effects: { clinicalIntegrity: 8, storeReadiness: 5, leadershipAlignment: 5, reputation: -3 },
      },
      {
        label: 'FIX IT YOURSELF',
        desc: 'Reorganize what you can on your shift.',
        effects: { burnout: 8, storeReadiness: 8, clinicalIntegrity: 3 },
      },
      {
        label: 'JUST SURVIVE',
        desc: 'Not your store. Not your problem.',
        effects: { burnout: -3, clinicalIntegrity: -5 },
      },
    ],
    next: ['c2_shift2'],
  },
  {
    id: 'c2_shift2',
    chapter: 2,
    type: 'shift',
    title: 'Great Techs Store',
    content: 'This team actually runs well. Enjoy it.',
    difficulty: {
      ambientMult: 0.8,
      eventMult: 0.9,
      meterMult: 0.9,
      meterOffsets: { burnout: -5 },
      interruptWeight: 0.1,
      desc: 'This team actually runs well. Enjoy it.',
    },
    next: ['c2_mid1'],
  },
  {
    id: 'c2_mid1',
    chapter: 2,
    type: 'story',
    title: 'Overnight Call',
    content: "The overnight pharmacist quit. No replacement. The 24-hour store needs someone tonight.",
    next: ['c2_shift3'],
  },
  {
    id: 'c2_shift3',
    chapter: 2,
    type: 'shift',
    title: 'Overnight',
    content: 'First overnight. Quieter, but the fatigue is different.',
    difficulty: {
      ambientMult: 0.7,
      eventMult: 0.6,
      meterMult: 1.1,
      meterOffsets: { burnout: 12, safety: 6 },
      interruptWeight: 0.05,
      desc: 'First overnight. Quieter, but the fatigue is different.',
    },
    next: ['c2_dec2'],
  },
  {
    id: 'c2_dec2',
    chapter: 2,
    type: 'decision',
    title: 'Float or Home',
    content: 'They want to keep you floating. Or you can request a home store.',
    choices: [
      {
        label: 'KEEP FLOATING',
        desc: 'More experience. More miles.',
        effects: { reputation: 5, burnout: 5, teamStrength: -5 },
      },
      {
        label: 'REQUEST HOME STORE',
        desc: 'Stability. Roots. A real team.',
        effects: { teamStrength: 8, burnout: -5, reputation: -3 },
      },
      {
        label: 'NEGOTIATE BOTH',
        desc: 'Float two days, home store three.',
        effects: { reputation: 3, teamStrength: 3 },
      },
    ],
    next: ['c2_result'],
  },
  {
    id: 'c2_result',
    chapter: 2,
    type: 'chapter_result',
    title: 'Chapter 2 Complete',
    content: 'You are useful, so the system sends you everywhere.',
    next: ['c3_intro'],
  },

  // ── CHAPTER 3 — Goldfish Bowl ─────────────────────────────────────────
  {
    id: 'c3_intro',
    chapter: 3,
    type: 'story',
    title: 'The Fishbowl',
    content: 'Everyone can see you. The counter is a fishbowl. Every patient, every tech, every front-store employee knows where you are.',
    next: ['c3_shift1'],
  },
  {
    id: 'c3_shift1',
    chapter: 3,
    type: 'shift',
    title: 'Fishbowl Shift',
    content: "High interrupt rate. 'Since you're here...' everything.",
    difficulty: {
      ambientMult: 1.0,
      eventMult: 1.2,
      meterMult: 1.0,
      meterOffsets: {},
      interruptWeight: 0.4,
      desc: "High interrupt rate. 'Since you're here...' everything.",
    },
    next: ['c3_dec1'],
  },
  {
    id: 'c3_dec1',
    chapter: 3,
    type: 'decision',
    title: 'No Break',
    content: "You haven't had a bathroom break in 6 hours. A patient is approaching.",
    choices: [
      {
        label: 'HOLD IT',
        desc: 'Smile. Help the patient. Suffer.',
        effects: { burnout: 8, reputation: 3, clinicalIntegrity: -3 },
      },
      {
        label: 'SET A BOUNDARY',
        desc: "'I'll be right back.' Walk away.",
        effects: { burnout: -5, reputation: -3, clinicalIntegrity: 5 },
      },
      {
        label: 'ASK TECH TO COVER',
        desc: 'Delegate for 2 minutes.',
        effects: { teamStrength: 3, burnout: -3 },
      },
    ],
    next: ['c3_shift2'],
  },
  {
    id: 'c3_shift2',
    chapter: 3,
    type: 'shift',
    title: 'Public Scrutiny Day',
    content: 'DM visiting. Surveys due. Complaints pending.',
    difficulty: {
      ambientMult: 1.1,
      eventMult: 1.3,
      meterMult: 1.1,
      meterOffsets: { scrutiny: 12 },
      interruptWeight: 0.3,
      desc: 'DM visiting. Surveys due. Complaints pending.',
    },
    next: ['c3_result'],
  },
  {
    id: 'c3_result',
    chapter: 3,
    type: 'chapter_result',
    title: 'Chapter 3 Complete',
    content: 'The work is not only hard. It is exposed.',
    next: ['c4_intro'],
  },

  // ── CHAPTER 4 — The Reliable One ──────────────────────────────────────
  {
    id: 'c4_intro',
    chapter: 4,
    type: 'story',
    title: 'Relied Upon',
    content: "You're not the new person anymore. People rely on you now. That's the problem.",
    next: ['c4_shift1'],
  },
  {
    id: 'c4_shift1',
    chapter: 4,
    type: 'shift',
    title: 'Coverage Ask',
    content: 'Asked to stay late. Again.',
    difficulty: {
      ambientMult: 1.1,
      eventMult: 1.1,
      meterMult: 1.0,
      meterOffsets: { burnout: 8 },
      interruptWeight: 0.2,
      desc: 'Asked to stay late. Again.',
    },
    next: ['c4_shift2'],
  },
  {
    id: 'c4_shift2',
    chapter: 4,
    type: 'shift',
    title: 'Training Day',
    content: "New tech. You're responsible for their mistakes.",
    difficulty: {
      ambientMult: 1.0,
      eventMult: 1.0,
      meterMult: 1.0,
      meterOffsets: { safety: 6 },
      interruptWeight: 0.15,
      desc: "New tech. You're responsible for their mistakes.",
    },
    next: ['c4_dec1'],
  },
  {
    id: 'c4_dec1',
    chapter: 4,
    type: 'decision',
    title: 'Scheduling Responsibility',
    content: 'They want you to take on scheduling responsibility. No extra pay.',
    choices: [
      {
        label: 'ACCEPT',
        desc: 'More weight. More trust.',
        effects: { reputation: 8, leadershipAlignment: 8, burnout: 8 },
      },
      {
        label: 'DECLINE',
        desc: "'That's not in my job description.'",
        effects: { burnout: -5, leadershipAlignment: -8, reputation: -3 },
      },
      {
        label: 'COUNTER',
        desc: "'I'll do it if you fix the staffing gaps.'",
        effects: { reputation: 3, teamStrength: 5, leadershipAlignment: -3 },
      },
    ],
    next: ['c4_shift3'],
  },
  {
    id: 'c4_shift3',
    chapter: 4,
    type: 'shift',
    title: 'Double Duty',
    content: "Running two stations' worth of work.",
    difficulty: {
      ambientMult: 1.3,
      eventMult: 1.4,
      meterMult: 1.2,
      meterOffsets: { queue: 10, burnout: 5 },
      interruptWeight: 0.25,
      desc: "Running two stations' worth of work.",
    },
    next: ['c4_result'],
  },
  {
    id: 'c4_result',
    chapter: 4,
    type: 'chapter_result',
    title: 'Chapter 4 Complete',
    content: 'Competence attracts more burden.',
    next: ['c5_intro'],
  },

  // ── CHAPTER 5 — PIC ───────────────────────────────────────────────────
  {
    id: 'c5_intro',
    chapter: 5,
    type: 'story',
    title: 'Pharmacist in Charge',
    content: 'Pharmacist in Charge. Three words that change everything. The schedule is yours. The staffing is yours. The consequences are yours.',
    next: ['c5_shift1'],
  },
  {
    id: 'c5_shift1',
    chapter: 5,
    type: 'shift',
    title: 'First PIC Shift',
    content: 'You own the bench. Schedule, staffing, closings.',
    difficulty: {
      ambientMult: 1.2,
      eventMult: 1.2,
      meterMult: 1.1,
      meterOffsets: { scrutiny: 8 },
      interruptWeight: 0.25,
      desc: 'You own the bench. Schedule, staffing, closings.',
    },
    next: ['c5_dec1'],
  },
  {
    id: 'c5_dec1',
    chapter: 5,
    type: 'decision',
    title: 'Labor Budget Cut',
    content: 'Labor budget cut. Someone loses hours.',
    choices: [
      {
        label: 'CUT THE WEAKEST',
        desc: 'Performance-based. Fair but harsh.',
        effects: { teamStrength: -8, leadershipAlignment: 8, reputation: -3 },
      },
      {
        label: 'SPREAD IT EVEN',
        desc: 'Everyone takes a small hit.',
        effects: { teamStrength: -3, burnout: 3, reputation: 3 },
      },
      {
        label: 'ABSORB IT YOURSELF',
        desc: 'Work extra hours to cover the gap.',
        effects: { burnout: 12, teamStrength: 5, clinicalIntegrity: 3 },
      },
    ],
    next: ['c5_shift2'],
  },
  {
    id: 'c5_shift2',
    chapter: 5,
    type: 'shift',
    title: 'PIC Under Fire',
    content: 'Board concern + patient complaint same day.',
    difficulty: {
      ambientMult: 1.2,
      eventMult: 1.3,
      meterMult: 1.2,
      meterOffsets: { scrutiny: 12, safety: 5 },
      interruptWeight: 0.2,
      desc: 'Board concern + patient complaint same day.',
    },
    next: ['c5_result'],
  },
  {
    id: 'c5_result',
    chapter: 5,
    type: 'chapter_result',
    title: 'Chapter 5 Complete',
    content: 'You wanted influence. Now you own consequences.',
    next: ['c6_intro'],
  },

  // ── CHAPTER 6 — We Need You Everywhere ────────────────────────────────
  {
    id: 'c6_intro',
    chapter: 6,
    type: 'story',
    title: 'Known by Name',
    content: "The district knows your name now. That's not a compliment. It means they call you when things break.",
    next: ['c6_shift1'],
  },
  {
    id: 'c6_shift1',
    chapter: 6,
    type: 'shift',
    title: 'Problem Store',
    content: 'Worst store in the district. Third pharmacist this month.',
    difficulty: {
      ambientMult: 1.4,
      eventMult: 1.3,
      meterMult: 1.2,
      meterOffsets: { queue: 10, rage: 8, safety: 5, scrutiny: 5 },
      interruptWeight: 0.3,
      desc: 'Worst store in the district. Third pharmacist this month.',
    },
    next: ['c6_dec1'],
  },
  {
    id: 'c6_dec1',
    chapter: 6,
    type: 'decision',
    title: 'Transfer Request',
    content: 'District wants you to transfer permanently to fix the problem store.',
    choices: [
      {
        label: 'ACCEPT TRANSFER',
        desc: 'Build something from the wreckage.',
        effects: { reputation: 5, storeReadiness: 8, teamStrength: -5, leadershipAlignment: 8 },
      },
      {
        label: 'STAY FLOATING',
        desc: "Keep moving. Don't get stuck.",
        effects: { reputation: -3, burnout: 5, teamStrength: -3 },
      },
      {
        label: 'PUSH BACK',
        desc: "'Fix the systemic issues first.'",
        effects: { leadershipAlignment: -10, clinicalIntegrity: 8, reputation: -5 },
      },
    ],
    next: ['c6_shift2'],
  },
  {
    id: 'c6_shift2',
    chapter: 6,
    type: 'shift',
    title: 'District Emergency',
    content: 'Coverage crisis. Skeleton crew. Everyone stretched thin.',
    difficulty: {
      ambientMult: 1.3,
      eventMult: 1.4,
      meterMult: 1.3,
      meterOffsets: { burnout: 10, queue: 8 },
      interruptWeight: 0.25,
      desc: 'Coverage crisis. Skeleton crew. Everyone stretched thin.',
    },
    next: ['c6_result'],
  },
  {
    id: 'c6_result',
    chapter: 6,
    type: 'chapter_result',
    title: 'Chapter 6 Complete',
    content: 'Too useful to leave alone.',
    next: ['c7_intro'],
  },

  // ── CHAPTER 7 — What It Made You ──────────────────────────────────────
  {
    id: 'c7_intro',
    chapter: 7,
    type: 'story',
    title: 'Final Chapter',
    content: 'Final chapter. The career chose you as much as you chose it. What did it make you?',
    next: ['c7_shift1'],
  },
  {
    id: 'c7_shift1',
    chapter: 7,
    type: 'shift',
    title: 'Final Shift',
    content: "Everything you've learned. Everything you've endured.",
    difficulty: {
      ambientMult: 1.2,
      eventMult: 1.2,
      meterMult: 1.1,
      meterOffsets: {},
      interruptWeight: 0.2,
      desc: "Everything you've learned. Everything you've endured.",
    },
    next: ['c7_result'],
  },
  {
    id: 'c7_result',
    chapter: 7,
    type: 'chapter_result',
    title: 'Chapter 7 Complete',
    content: "And that's what it made you.",
    next: ['ending'],
  },

  // ── ENDING ────────────────────────────────────────────────────────────
  {
    id: 'ending',
    chapter: 7,
    type: 'ending',
    title: 'Career End',
    content: 'determined by persistent state',
    next: [],
  },
];

export const ENDING_LANES = {
  builder: {
    title: 'THE BUILDER',
    flavor: 'You built something real. The store runs because of you.',
    condition: 'high teamStrength + storeReadiness',
  },
  escape: {
    title: 'THE ESCAPE',
    flavor: 'You got out. Not everyone does.',
    condition: 'high burnout + low leadershipAlignment',
  },
  climber: {
    title: 'THE CLIMBER',
    flavor: 'District. Region. Corporate. The ladder keeps going.',
    condition: 'high leadershipAlignment + reputation',
  },
  quiet_pro: {
    title: 'THE QUIET PROFESSIONAL',
    flavor: 'You never made a scene. You just did the work.',
    condition: 'high clinicalIntegrity + moderate everything',
  },
  martyr: {
    title: 'THE MARTYR',
    flavor: 'You gave everything. They took it.',
    condition: 'high burnout + high clinicalIntegrity',
  },
  burnout_end: {
    title: 'THE BURNOUT',
    flavor: "You stared at the ceiling one morning and didn't get up.",
    condition: 'very high burnout + low everything else',
  },
};

export const CHAPTER_DECISIONS = {
  c1_dec1: CAMPAIGN_NODES.find(n => n.id === 'c1_dec1'),
  c2_dec1: CAMPAIGN_NODES.find(n => n.id === 'c2_dec1'),
  c2_dec2: CAMPAIGN_NODES.find(n => n.id === 'c2_dec2'),
  c3_dec1: CAMPAIGN_NODES.find(n => n.id === 'c3_dec1'),
  c4_dec1: CAMPAIGN_NODES.find(n => n.id === 'c4_dec1'),
  c5_dec1: CAMPAIGN_NODES.find(n => n.id === 'c5_dec1'),
  c6_dec1: CAMPAIGN_NODES.find(n => n.id === 'c6_dec1'),
};

// ── Expanded campaign architecture ──────────────────────────────────────

const CHAPTER_IMPORTS = [
  CHAPTER_1,
  CHAPTER_2,
  CHAPTER_3,
  CHAPTER_4,
  CHAPTER_5,
  CHAPTER_6,
  CHAPTER_7,
];

/**
 * Returns the full expanded chapter array assembled from per-chapter data
 * files. Each entry combines meta, shifts, decisions, and storyNodes from
 * its CHAPTER_X import.
 */
export function getExpandedChapters() {
  return CHAPTER_IMPORTS.map((ch) => ({
    meta:       ch.meta,
    shifts:     ch.shifts     || [],
    decisions:  ch.decisions  || [],
    storyNodes: ch.storyNodes || [],
  }));
}

/**
 * Returns the field leader assigned to the given chapter.
 * @param {number|string} chapterId
 */
export function getChapterLeader(chapterId) {
  return FIELD_LEADERS[chapterId] ?? null;
}

/**
 * Returns the intro text / data for a chapter.
 * @param {number|string} chapterId
 */
export function getChapterIntro(chapterId) {
  return CHAPTER_INTROS[chapterId] ?? null;
}

/**
 * Returns transition data when moving from one chapter to the next.
 * @param {number|string} fromChapter
 * @param {number|string} toChapter
 */
export function getTransition(fromChapter, toChapter) {
  const key = `${fromChapter}_${toChapter}`;
  return CHAPTER_TRANSITIONS[key] ?? null;
}
