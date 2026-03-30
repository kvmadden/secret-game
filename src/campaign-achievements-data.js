// campaign-achievements-data.js - Campaign-specific achievements for pharmacy survival game

export const CAMPAIGN_ACHIEVEMENTS = [
  // ── Chapter Completion (7) ──────────────────────────────────
  {
    id: 'ch1_complete',
    title: 'Welcome Aboard',
    description: 'Complete Chapter 1',
    category: 'chapter_completion',
    condition: { type: 'chapter_complete', value: 1 },
    icon: '🏪',
    hidden: false
  },
  {
    id: 'ch2_complete',
    title: 'Road Warrior',
    description: 'Complete Chapter 2',
    category: 'chapter_completion',
    condition: { type: 'chapter_complete', value: 2 },
    icon: '🛣️',
    hidden: false
  },
  {
    id: 'ch3_complete',
    title: 'Glass House',
    description: 'Complete Chapter 3',
    category: 'chapter_completion',
    condition: { type: 'chapter_complete', value: 3 },
    icon: '🏠',
    hidden: false
  },
  {
    id: 'ch4_complete',
    title: 'Iron Horse',
    description: 'Complete Chapter 4',
    category: 'chapter_completion',
    condition: { type: 'chapter_complete', value: 4 },
    icon: '🐎',
    hidden: false
  },
  {
    id: 'ch5_complete',
    title: 'The Keys',
    description: 'Complete Chapter 5',
    category: 'chapter_completion',
    condition: { type: 'chapter_complete', value: 5 },
    icon: '🔑',
    hidden: false
  },
  {
    id: 'ch6_complete',
    title: 'District Asset',
    description: 'Complete Chapter 6',
    category: 'chapter_completion',
    condition: { type: 'chapter_complete', value: 6 },
    icon: '📋',
    hidden: false
  },
  {
    id: 'ch7_complete',
    title: 'Career Day',
    description: 'Complete Chapter 7',
    category: 'chapter_completion',
    condition: { type: 'chapter_complete', value: 7 },
    icon: '🎓',
    hidden: false
  },

  // ── Ending Achievements (6) ─────────────────────────────────
  {
    id: 'ending_builder',
    title: 'Foundation',
    description: 'Reach The Builder ending',
    category: 'ending',
    condition: { type: 'ending_reached', value: 'builder' },
    icon: '🧱',
    hidden: false
  },
  {
    id: 'ending_climber',
    title: 'Corner Office',
    description: 'Reach The Climber ending',
    category: 'ending',
    condition: { type: 'ending_reached', value: 'climber' },
    icon: '🏢',
    hidden: false
  },
  {
    id: 'ending_escape',
    title: 'Free Bird',
    description: 'Reach The Escape ending',
    category: 'ending',
    condition: { type: 'ending_reached', value: 'escape' },
    icon: '🕊️',
    hidden: false
  },
  {
    id: 'ending_quiet_pro',
    title: 'Steady Hands',
    description: 'Reach The Quiet Professional ending',
    category: 'ending',
    condition: { type: 'ending_reached', value: 'quiet_pro' },
    icon: '🤲',
    hidden: false
  },
  {
    id: 'ending_burnout',
    title: 'Empty Tank',
    description: 'Reach The Burnout ending',
    category: 'ending',
    condition: { type: 'ending_reached', value: 'burnout_end' },
    icon: '🕯️',
    hidden: true
  },
  {
    id: 'ending_martyr',
    title: 'Everything You Had',
    description: 'Reach The Martyr ending',
    category: 'ending',
    condition: { type: 'ending_reached', value: 'martyr' },
    icon: '💔',
    hidden: true
  },

  // ── Decision Achievements (6) ──────────────────────────────
  {
    id: 'always_stayed',
    title: 'Never Said No',
    description: 'Said yes to every extra ask in Chapter 4',
    category: 'decision',
    condition: { type: 'flag_set', value: 'ch4_never_refused' },
    icon: '✅',
    hidden: false
  },
  {
    id: 'always_left',
    title: 'Boundaries',
    description: 'Always chose self-preservation options',
    category: 'decision',
    condition: { type: 'flag_set', value: 'always_self_preserve' },
    icon: '🛡️',
    hidden: false
  },
  {
    id: 'team_first_pic',
    title: 'For the Team',
    description: 'Chose team-first as your PIC identity',
    category: 'decision',
    condition: { type: 'flag_set', value: 'pic_identity_team' },
    icon: '🤝',
    hidden: false
  },
  {
    id: 'safety_first_pic',
    title: 'Do No Harm',
    description: 'Chose safety-first as your PIC identity',
    category: 'decision',
    condition: { type: 'flag_set', value: 'pic_identity_safety' },
    icon: '⚕️',
    hidden: false
  },
  {
    id: 'called_it_out',
    title: 'Whistleblower',
    description: 'Called out problems at least 3 times',
    category: 'decision',
    condition: { type: 'stat_check', value: { stat: 'callouts', min: 3 } },
    icon: '📢',
    hidden: false
  },
  {
    id: 'exit_planned',
    title: 'Two Weeks Notice',
    description: 'Started looking for an exit in Chapter 6',
    category: 'decision',
    condition: { type: 'flag_set', value: 'ch6_exit_search' },
    icon: '📝',
    hidden: false
  },

  // ── Signature Event Achievements (4) ───────────────────────
  {
    id: 'survived_overnight',
    title: 'Graveyard Shift',
    description: 'Completed Overnight Weirdness',
    category: 'signature_event',
    condition: { type: 'flag_set', value: 'event_overnight_complete' },
    icon: '🌙',
    hidden: false
  },
  {
    id: 'survived_no_relief',
    title: 'Still Standing',
    description: 'Completed No Relief Coming without failing',
    category: 'signature_event',
    condition: { type: 'flag_set', value: 'event_no_relief_perfect' },
    icon: '💪',
    hidden: false
  },
  {
    id: 'survived_visit',
    title: 'All Dressed Up',
    description: 'Survived The Visit That Never Comes',
    category: 'signature_event',
    condition: { type: 'flag_set', value: 'event_visit_survived' },
    icon: '👔',
    hidden: false
  },
  {
    id: 'perfect_offsite',
    title: 'Clinic Champion',
    description: 'Got S rank on Off-Site Clinic Day',
    category: 'signature_event',
    condition: { type: 'shift_grade', value: { event: 'offsite_clinic', grade: 'S' } },
    icon: '🏆',
    hidden: false
  },

  // ── Hidden / Special (2) ───────────────────────────────────
  {
    id: 'all_endings',
    title: 'Every Path',
    description: 'Seen all 6 endings',
    category: 'special',
    condition: { type: 'stat_check', value: { stat: 'endings_seen', min: 6 } },
    icon: '🌟',
    hidden: true
  },
  {
    id: 'perfect_campaign',
    title: 'Flawless',
    description: 'Won every shift with A rank or better',
    category: 'special',
    condition: { type: 'stat_check', value: { stat: 'worst_grade', min: 'A' } },
    icon: '💎',
    hidden: true
  }
];
