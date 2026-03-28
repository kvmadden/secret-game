// campaign-ch4.js — Chapter 4: The Reliable One
// Field leader: The Rescuer-User (genuinely trusts you, trust becomes burden)
// Theme: "Competence attracts more burden."

export const CHAPTER_4 = {

  meta: {
    id: 'ch4',
    title: 'The Reliable One',
    subtitle: 'Competence attracts more burden.',
    leaderType: 'rescuer_user',
  },

  shifts: [
    {
      id: 'c4_can_you_stay',
      title: 'Can You Stay?',
      description:
        "End of shift but you're asked to stay. Extended shift with mounting fatigue.",
      type: 'shift',
      difficulty: {
        ambientMult: 1.1,
        eventMult: 1.0,
        meterMult: 1.1,
        gameDuration: 420,
      },
      meterOffsets: {
        queue: 8,
        safety: 5,
        rage: 5,
        burnout: 15,
        scrutiny: 5,
      },
      barks: [
        'The closing pharmacist called out.',
        'Can you just stay until...?',
        'We really need you.',
        "I know you've been here all day, but...",
        "You're the only one who can handle this.",
      ],
    },
    {
      id: 'c4_no_relief',
      title: 'No Relief Coming',
      description:
        'SIGNATURE SHIFT. You believe handoff is coming. Then it fails. '
        + 'Then backup fails. Day extends into exhaustion.',
      type: 'shift',
      difficulty: {
        ambientMult: 1.2,
        eventMult: 1.2,
        meterMult: 1.2,
        gameDuration: 420,
      },
      meterOffsets: {
        queue: 10,
        safety: 8,
        rage: 10,
        burnout: 20,
        scrutiny: 8,
      },
      signatureShift: true,
      barks: [
        'They said someone was coming at 3.',
        'Still no one?',
        "I've been here since 7 AM.",
        'The backup cancelled too?',
        'Are you seriously still here?',
      ],
    },
    {
      id: 'c4_cover_once',
      title: 'Cover Just This Once',
      description:
        'Asked to cover yet another store. The ask is framed as temporary '
        + "and grateful, but it's clearly a pattern.",
      type: 'shift',
      difficulty: {
        ambientMult: 1.1,
        eventMult: 1.1,
        meterMult: 1.0,
      },
      meterOffsets: {
        queue: 10,
        safety: 5,
        rage: 8,
        burnout: 12,
        scrutiny: 5,
      },
      barks: [
        "Oh, you're the one they sent?",
        "We've had three different pharmacists this week.",
        'At least you seem competent.',
        'How long are you here for?',
      ],
    },
  ],

  decisions: [
    {
      id: 'c4_stay_decision',
      afterShift: 'c4_can_you_stay',
      prompt: 'The closing pharmacist called out. Will you stay?',
      choices: [
        {
          text: 'Say yes immediately.',
          effects: { reputation: +8, burnout: +12, leadershipAlignment: +5 },
        },
        {
          text: 'Say yes, but set limits.',
          effects: { reputation: +3, burnout: +5, leadershipAlignment: +2 },
        },
        {
          text: 'Say no.',
          effects: { burnout: -8, reputation: -5, leadershipAlignment: -5 },
        },
      ],
    },
    {
      id: 'c4_no_relief_decision',
      afterShift: 'c4_no_relief',
      prompt: 'No one is coming. The shift stretches on. What do you do?',
      choices: [
        {
          text: 'Hold it together yourself.',
          effects: { burnout: +15, reputation: +8, clinicalIntegrity: -3 },
        },
        {
          text: 'Cut corners to survive.',
          effects: { burnout: +5, clinicalIntegrity: -8, reputation: +3 },
        },
        {
          text: 'Escalate and force the issue.',
          effects: { burnout: +5, leadershipAlignment: -8, teamStrength: +5 },
        },
      ],
    },
    {
      id: 'c4_cover_decision',
      afterShift: 'c4_cover_once',
      prompt: "They need you at another store. Just this once — again. What's your answer?",
      choices: [
        {
          text: 'Go.',
          effects: { reputation: +5, burnout: +10, leadershipAlignment: +5 },
        },
        {
          text: 'Negotiate terms first.',
          effects: { reputation: +2, burnout: +5, leadershipAlignment: +2 },
        },
        {
          text: 'Refuse.',
          effects: { burnout: -8, reputation: -5, leadershipAlignment: -8 },
        },
      ],
    },
  ],

  storyNodes: [
    {
      id: 'c4_intro',
      type: 'story',
      text: [
        'Somewhere along the way you became the person everyone calls.',
        'The Rescuer-User — your field leader — trusts you completely. '
          + 'She tells you so, often, with genuine warmth.',
        '"I don\'t know what we\'d do without you."',
        'She means it. That is the problem.',
        'Every call-out, every gap, every emergency — your name '
          + 'comes up first. Not as punishment. As faith.',
        'You are the reliable one. The one who says yes. '
          + 'The one who stays.',
        'Competence attracts more burden.',
      ],
    },
    {
      id: 'c4_result',
      type: 'chapter_result',
      text: [
        'Chapter 4 — Complete.',
        'You held it together. You always do. '
          + "That's what they count on.",
        'The Rescuer-User thanks you and means every word. '
          + 'She will call again tomorrow.',
        'Your name is first on every list — coverage, overtime, '
          + 'emergencies. Not because they want to hurt you.',
        'Because you never said no.',
        'Reliability has a price. You are paying it.',
      ],
    },
  ],
};
