// campaign-ch7.js — Chapter 7: What It Made You
// Field leader: Variable (determined by ending lane)
// Theme: "The days that define the career."
// Principle: "Of course this is where your career went."

function routeSelection(
  { burnout, reputation, teamStrength, storeReadiness, leadershipAlignment, clinicalIntegrity },
  flags = {},
) {
  if (burnout > 75 && clinicalIntegrity > 60) return 'martyr';
  if (burnout > 75) return 'burnout_end';
  if (flags.actively_looking_for_exit && leadershipAlignment < 40) return 'escape';
  if (leadershipAlignment + reputation > 130 && flags.accepted_stretch_role) return 'climber';
  if (teamStrength + storeReadiness > 130 && clinicalIntegrity > 50) return 'builder';
  const mid = (v) => v >= 25 && v <= 75;
  if (
    clinicalIntegrity > 65
    && mid(burnout) && mid(reputation) && mid(teamStrength)
    && mid(storeReadiness) && mid(leadershipAlignment)
  ) return 'quiet_pro';
  return 'quiet_pro';
}

const endingLanes = {
  builder: {
    title: 'THE BUILDER',
    theme: 'Your people and your investment actually matter.',
    finalShift: {
      id: 'c7_hold_it_together', title: 'Hold It Together',
      description: 'The store you built faces its hardest day. Your people and your investment are tested.',
      type: 'shift',
      difficulty: { ambientMult: 1.3, eventMult: 1.2, meterMult: 1.0 },
      meterOffsets: { queue: 10, safety: 5, rage: 8, burnout: 10, scrutiny: 5 },
      barks: [
        'Two techs called out. Your bench is thin.',
        'The new hire you trained six months ago just handled it.',
        'DM wants a walkthrough today — of course.',
        'Patient says this is the only pharmacy that gets it right.',
        'System update mid-rush. Classic.',
      ],
    },
  },
  climber: {
    title: 'THE CLIMBER',
    theme: 'You are being pulled upward. The question is what kind of climber you become.',
    finalShift: {
      id: 'c7_bigger_table', title: 'Bigger Table',
      description: 'District meeting. Regional eyes. Corporate presentation. The ladder keeps going.',
      type: 'shift',
      difficulty: { ambientMult: 1.1, eventMult: 1.1, meterMult: 1.2 },
      meterOffsets: { queue: 5, safety: 5, rage: 5, burnout: 8, scrutiny: 18 },
      barks: [
        'Regional VP is on the call.',
        'Your metrics deck better be tight.',
        'Someone just asked about your incident rate.',
        'They want you to present the labor model to the room.',
        'The DM you replaced is watching from the back row.',
      ],
    },
  },
  escape: {
    title: 'THE ESCAPE',
    theme: 'You got out. Not everyone does.',
    finalShift: {
      id: 'c7_last_day', title: 'Last Day on the Bench',
      description: 'Same work, different emotional meaning. You know you are leaving.',
      type: 'shift',
      difficulty: { ambientMult: 1.0, eventMult: 1.0, meterMult: 1.0 },
      meterOffsets: { queue: 8, safety: 5, rage: 5, burnout: 5, scrutiny: 5 },
      barks: [
        'Two weeks left. Nobody knows yet.',
        'A tech asks if you saw the new schedule — you won\'t be on it.',
        'Patient thanks you. You almost say something.',
        'The offer letter is in your bag.',
        'Everything looks the same. Nothing feels the same.',
      ],
    },
  },
  quiet_pro: {
    title: 'THE QUIET PROFESSIONAL',
    theme: 'You never made a scene. You just did the work.',
    finalShift: {
      id: 'c7_just_the_work', title: 'Just the Work',
      description: 'Another day. Same bench. Same patients. But you preserved something.',
      type: 'shift',
      difficulty: { ambientMult: 1.1, eventMult: 1.0, meterMult: 1.0 },
      meterOffsets: { queue: 8, safety: 5, rage: 6, burnout: 8, scrutiny: 6 },
      barks: [
        'Same parking lot. Same door code.',
        'The floater yesterday left a mess. You clean it up.',
        'A regular patient remembers your name.',
        'Nobody from corporate visits today. Nobody notices.',
        'You catch a drug interaction the system missed.',
      ],
    },
  },
  burnout_end: {
    title: 'BURNED OUT',
    theme: 'You stared at the ceiling one morning and didn\'t get up.',
    finalShift: {
      id: 'c7_last_straw', title: 'Last Straw',
      description: 'Everything you held together is fraying. The system finally takes too much.',
      type: 'shift',
      difficulty: { ambientMult: 1.4, eventMult: 1.3, meterMult: 1.2 },
      meterOffsets: { queue: 15, safety: 10, rage: 12, burnout: 20, scrutiny: 10 },
      barks: [
        'You forgot to eat again.',
        'Three voicemails from the DM. You haven\'t listened.',
        'The tech asks if you\'re okay. You say fine.',
        'Hands are shaking during verification.',
        'You sit in the car for twenty minutes before walking in.',
      ],
    },
  },
  martyr: {
    title: 'THE MARTYR',
    theme: 'You gave everything. They took it.',
    finalShift: {
      id: 'c7_one_more_time', title: 'One More Time',
      description: 'High integrity. High reputation. Severe burnout. You gave everything.',
      type: 'shift',
      difficulty: { ambientMult: 1.5, eventMult: 1.4, meterMult: 1.3 },
      meterOffsets: { queue: 15, safety: 12, rage: 14, burnout: 18, scrutiny: 14 },
      barks: [
        'They know you won\'t say no. That\'s the problem.',
        'Board of Pharmacy would be proud. Your body is not.',
        'Another twelve-hour day with no overlap.',
        'Patient writes a letter to corporate praising you. Nobody forwards it.',
        'You dream about counting pills.',
      ],
    },
  },
};

// ── SEALING DECISIONS ───────────────────────────────────────────────
// One per lane. The final choice — doesn't change the lane, just flavors it.

const sealingDecisions = {
  builder: {
    id: 'c7_seal_builder', afterShift: 'c7_hold_it_together', major: true,
    prompt: 'The store survived its worst day. What do you carry forward?',
    choices: [
      { text: 'This proved it. I\'m doubling down on this store and these people.',
        effects: { teamStrength: +5, storeReadiness: +5, burnout: +3 }, flavor: 'roots' },
      { text: 'I built something — now I need to protect myself too.',
        effects: { burnout: -5, teamStrength: +2 }, flavor: 'balance' },
      { text: 'If they won\'t resource us properly, I\'ll escalate. Loudly.',
        effects: { leadershipAlignment: -5, reputation: +3, teamStrength: +3 }, flavor: 'fight' },
    ],
  },
  climber: {
    id: 'c7_seal_climber', afterShift: 'c7_bigger_table', major: true,
    prompt: 'You have a seat at the bigger table. What do you do with it?',
    choices: [
      { text: 'Advocate for the stores. Use the access to push for staffing.',
        effects: { teamStrength: +5, leadershipAlignment: -3, reputation: +5 }, flavor: 'advocate' },
      { text: 'Play the game. Learn the language. Keep climbing.',
        effects: { leadershipAlignment: +8, clinicalIntegrity: -3 }, flavor: 'ascend' },
      { text: 'Take the title. Use it as leverage for something outside.',
        effects: { reputation: +3, leadershipAlignment: +2 }, flavor: 'exit_strategy' },
    ],
  },
  escape: {
    id: 'c7_seal_escape', afterShift: 'c7_last_day', major: true,
    prompt: 'Last shift is over. You walk out. What stays with you?',
    choices: [
      { text: 'Relief. Pure relief.',
        effects: { burnout: -15 }, flavor: 'relief' },
      { text: 'Guilt. The people I\'m leaving behind.',
        effects: { burnout: -5, teamStrength: -3 }, flavor: 'guilt' },
      { text: 'Anger. It never should have been this way.',
        effects: { burnout: -8, clinicalIntegrity: +3 }, flavor: 'anger' },
    ],
  },
  quiet_pro: {
    id: 'c7_seal_quiet_pro', afterShift: 'c7_just_the_work', major: true,
    prompt: 'Another year passes. Same bench. What is this to you?',
    choices: [
      { text: 'This is enough. The patients are enough.',
        effects: { clinicalIntegrity: +5, burnout: -3 }, flavor: 'peace' },
      { text: 'I\'m still here because I haven\'t found the exit yet.',
        effects: { burnout: +5 }, flavor: 'stuck' },
      { text: 'Someone has to do it right. Might as well be me.',
        effects: { clinicalIntegrity: +3, reputation: +3 }, flavor: 'duty' },
    ],
  },
  burnout_end: {
    id: 'c7_seal_burnout', afterShift: 'c7_last_straw', major: true,
    prompt: 'You\'re sitting in the car. Engine off. What now?',
    choices: [
      { text: 'Call in. Just today. Just this once.',
        effects: { burnout: -5 }, flavor: 'pause' },
      { text: 'Go in. You always go in.',
        effects: { burnout: +10, clinicalIntegrity: +2 }, flavor: 'grind' },
      { text: 'Open the job board on your phone.',
        effects: { burnout: -3 }, flavor: 'search' },
    ],
  },
  martyr: {
    id: 'c7_seal_martyr', afterShift: 'c7_one_more_time', major: true,
    prompt: 'They asked you to cover another store this weekend. Again.',
    choices: [
      { text: 'Yes. Because the patients need someone who cares.',
        effects: { burnout: +10, clinicalIntegrity: +5, reputation: +3 }, flavor: 'sacrifice' },
      { text: 'No. For the first time, no.',
        effects: { burnout: -10, leadershipAlignment: -5 }, flavor: 'boundary' },
      { text: 'Yes — but I\'m documenting everything. This ends somewhere.',
        effects: { burnout: +5, clinicalIntegrity: +3, reputation: +5 }, flavor: 'record' },
    ],
  },
};

// ── STORY NODES ─────────────────────────────────────────────────────
// Narrative beats bracketing the final shift. Each lane gets an intro and outro.

const storyNodes = {
  builder_intro: {
    id: 'c7_sn_builder_intro', lane: 'builder', position: 'before_shift',
    text: 'You look around the pharmacy and see your fingerprints on everything. '
      + 'The workflow. The schedule. The way the techs talk to each other. '
      + 'Today will test whether any of it holds.',
  },
  builder_outro: {
    id: 'c7_sn_builder_outro', lane: 'builder', position: 'after_decision',
    text: 'The store is still standing. So are you. Of course this is where your career went.',
  },
  climber_intro: {
    id: 'c7_sn_climber_intro', lane: 'climber', position: 'before_shift',
    text: 'The conference room is bigger than your pharmacy. '
      + 'Everyone here has a title. You earned yours on the bench.',
  },
  climber_outro: {
    id: 'c7_sn_climber_outro', lane: 'climber', position: 'after_decision',
    text: 'The ladder keeps going. Of course this is where your career went.',
  },
  escape_intro: {
    id: 'c7_sn_escape_intro', lane: 'escape', position: 'before_shift',
    text: 'You badge in for the last time. The barcode still works. '
      + 'The printer still jams. Everything is exactly the same except you.',
  },
  escape_outro: {
    id: 'c7_sn_escape_outro', lane: 'escape', position: 'after_decision',
    text: 'You turn in your keys and walk to the parking lot. Of course this is where your career went.',
  },
  quiet_pro_intro: {
    id: 'c7_sn_quiet_pro_intro', lane: 'quiet_pro', position: 'before_shift',
    text: 'No fanfare. No crisis. Just the bench, the queue, and the work. '
      + 'You have been here a thousand times.',
  },
  quiet_pro_outro: {
    id: 'c7_sn_quiet_pro_outro', lane: 'quiet_pro', position: 'after_decision',
    text: 'Tomorrow will look the same. Of course this is where your career went.',
  },
  burnout_intro: {
    id: 'c7_sn_burnout_intro', lane: 'burnout_end', position: 'before_shift',
    text: 'The alarm goes off and you lie there. Your body knows before your mind does.',
  },
  burnout_outro: {
    id: 'c7_sn_burnout_outro', lane: 'burnout_end', position: 'after_decision',
    text: 'The system doesn\'t notice one more person leaving. Of course this is where your career went.',
  },
  martyr_intro: {
    id: 'c7_sn_martyr_intro', lane: 'martyr', position: 'before_shift',
    text: 'Everyone knows your name. Patients. Techs. The board. '
      + 'You are the best pharmacist in the district and the most exhausted person in the building.',
  },
  martyr_outro: {
    id: 'c7_sn_martyr_outro', lane: 'martyr', position: 'after_decision',
    text: 'You gave everything. They took it. Of course this is where your career went.',
  },
};

// ── EXPORT ──────────────────────────────────────────────────────────

export const CHAPTER_7 = {
  meta: {
    id: 'ch7',
    title: 'What It Made You',
    subtitle: 'The days that define the career.',
    leaderType: 'variable',
  },
  endingLanes,
  routeSelection,
  sealingDecisions,
  storyNodes,
};
