// campaign-ch2.js — Chapter 2: Float Season
// Field leader: The Ghost (absent, hard to reach, unreliable)
// Theme: "You are useful. So the system sends you everywhere."

export const CHAPTER_2 = {

  meta: {
    id: 'ch2',
    title: 'Float Season',
    subtitle: 'You are useful. So the system sends you everywhere.',
    leaderType: 'ghost',
  },

  shifts: [
    {
      id: 'c2_bad_handoff',
      title: 'Bad Handoff',
      description:
        'Arrive at a new store. Previous pharmacist left a mess. '
        + 'Incomplete scripts, unanswered voicemails, confused patients.',
      type: 'shift',
      difficulty: {
        ambientMult: 1.0,
        eventMult: 1.0,
        meterMult: 1.0,
      },
      meterOffsets: { queue: 12, safety: 8, rage: 5, burnout: 5, scrutiny: 0 },
      weather: 'overcast',
      barks: [
        'The last pharmacist didn\'t finish any of this.',
        'There are six voicemails marked urgent from yesterday.',
        'I was told my prescription would be ready. That was two days ago.',
        'Who even worked here before you?',
        'The will-call bin is a disaster.',
        'Nobody told me there was a new pharmacist today.',
      ],
    },
    {
      id: 'c2_different_bench',
      title: 'Different Bench Same Fire',
      description:
        'Another unfamiliar store, everything in a different place, '
        + "staff doesn't know you.",
      type: 'shift',
      difficulty: {
        ambientMult: 1.1,
        eventMult: 1.0,
        meterMult: 1.0,
      },
      meterOffsets: { queue: 8, safety: 5, rage: 8, burnout: 8, scrutiny: 5 },
      weather: 'clear',
      barks: [
        'That\'s not how we do it here.',
        'The fast movers are on the left wall, not the right.',
        'Are you the float? Great. The printer is broken.',
        'Our regular pharmacist keeps the C-IIs in a different spot.',
        'I don\'t know you, so I\'m going to watch you closely.',
        'You\'re the third different pharmacist this month.',
      ],
    },
    {
      id: 'c2_overnight',
      title: 'Overnight Weirdness',
      description:
        '24-hour overnight. Stranger energy, different patients, '
        + 'isolation, unpredictability.',
      type: 'shift',
      isSignatureShift: true,
      difficulty: {
        ambientMult: 0.8,
        eventMult: 1.2,
        meterMult: 1.1,
        gameDuration: 390,
      },
      meterOffsets: { queue: 0, safety: 5, rage: 0, burnout: 15, scrutiny: 0 },
      weather: 'night',
      barks: [
        'You got any of those behind-the-counter allergy pills?',
        'Security guard pokes his head in. "Still alive back here?"',
        'A regular slides up at 2 AM. "Same thing as last Tuesday."',
        'The fluorescent lights hum louder when nobody else is around.',
        'Someone is standing in the cold aisle staring at nothing.',
        'A woman in scrubs rushes in. "Just got off a twelve. Need my refill before I crash."',
      ],
    },
  ],

  decisions: [
    {
      id: 'c2_bad_handoff_dec',
      afterShift: 'c2_bad_handoff',
      prompt: 'What do you do with the mess you inherited?',
      choices: [
        {
          text: 'Fix it quietly. Stay late if you have to.',
          effects: { storeReadiness: +8, burnout: +5 },
        },
        {
          text: 'Call it out. Document everything and escalate.',
          effects: { reputation: -3, leadershipAlignment: -5, storeReadiness: +5 },
        },
        {
          text: 'Do the minimum. Not your store, not your problem.',
          effects: { burnout: -3, storeReadiness: -3 },
        },
      ],
    },
    {
      id: 'c2_adapt_store',
      afterShift: 'c2_different_bench',
      prompt: 'How do you adapt to a store with a different personality?',
      choices: [
        {
          text: 'Blend in and survive. Match their rhythm.',
          effects: { burnout: -3, reputation: +3 },
        },
        {
          text: 'Take control fast. Impose your workflow.',
          effects: { reputation: +5, teamStrength: -3, leadershipAlignment: +3 },
        },
        {
          text: 'Lean on the team. Ask questions, earn trust.',
          effects: { teamStrength: +5, reputation: +2 },
        },
      ],
    },
    {
      id: 'c2_coverage_asks',
      afterShift: 'c2_overnight',
      prompt: 'Do you keep accepting these oddball coverage asks?',
      choices: [
        {
          text: 'Yes, if they need me. That\'s the job.',
          effects: { reputation: +5, burnout: +8, leadershipAlignment: +5 },
        },
        {
          text: 'Only if it\'s truly necessary. Set some limits.',
          effects: { burnout: +3, leadershipAlignment: +2 },
        },
        {
          text: 'No. This is not sustainable.',
          effects: { burnout: -5, leadershipAlignment: -5, reputation: -3 },
        },
      ],
    },
  ],

  storyNodes: [
    {
      id: 'c2_intro',
      type: 'story',
      text: [
        'They put your name on the float list.',
        'No home store. No regular team. No consistent schedule. '
          + 'Just a phone number and a willingness to show up wherever they send you.',
        'The Ghost -- your field leader -- exists mostly as a voicemail '
          + 'you can never reach. Sometimes an email arrives three days late. '
          + 'Sometimes nothing at all.',
        '"Call me if you need anything." You tried. Twice.',
        'Every store is a different puzzle: different layout, different '
          + 'staff, different expectations. The only constant is you.',
        'You are useful. So the system sends you everywhere.',
      ],
    },
    {
      id: 'c2_result',
      type: 'chapter_result',
      text: [
        'Chapter 2 -- Complete.',
        'You learned to walk into a store cold and make it work. '
          + 'You learned that every bench has its own language and every '
          + 'team has its own ghosts.',
        'The Ghost never called back. You stopped expecting it.',
        'You adapted. That is not the same thing as thriving, '
          + 'but it kept you standing.',
        'Float season ends when they decide it ends. Not before.',
      ],
    },
  ],
};
