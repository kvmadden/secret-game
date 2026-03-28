// campaign-ch6.js — Chapter 6: We Need You Everywhere
// Field leader: The Polished Visitor / Ladder Climber
// Theme: "Too useful to leave alone."

export const CHAPTER_6 = {

  meta: {
    id: 'ch6',
    title: 'We Need You Everywhere',
    subtitle: 'Too useful to leave alone.',
    leaderType: 'polished_visitor',
  },

  shifts: [
    {
      id: 'c6_problem_store',
      title: 'Problem Store',
      description:
        "Sent to the district's worst store. Bigger, uglier, more visible, "
        + 'more politically charged.',
      type: 'shift',
      difficulty: {
        ambientMult: 1.3,
        eventMult: 1.3,
        meterMult: 1.2,
      },
      meterOffsets: {
        queue: 15,
        safety: 10,
        rage: 12,
        burnout: 10,
        scrutiny: 10,
      },
      barks: [
        "Oh great, another pharmacist who won't last.",
        'The last PIC transferred out.',
        "This store's been on the watch list for months.",
        "Corporate's been here three times this quarter.",
        'You should see the complaint file.',
      ],
    },
    {
      id: 'c6_visit_never_comes',
      title: 'The Visit That Never Comes',
      description:
        'SIGNATURE SHIFT. VIP/executive visit announced. Team bends the day '
        + 'around looking perfect. ETA slips. Cancelled after hours of '
        + '"visit mode."',
      type: 'shift',
      signatureShift: true,
      difficulty: {
        ambientMult: 1.1,
        eventMult: 1.0,
        meterMult: 1.1,
      },
      meterOffsets: {
        queue: 8,
        safety: 5,
        rage: 5,
        burnout: 12,
        scrutiny: 20,
      },
      barks: [
        'The regional VP is coming at 2.',
        'Actually, they pushed to 3:30.',
        'Make sure everything looks perfect.',
        'They want to see our workflow.',
        'Update: visit rescheduled to next week. Thanks for your efforts!',
      ],
    },
    {
      id: 'c6_district_resource',
      title: 'District Resource',
      description:
        "You're no longer just running your store. You're a district asset, "
        + 'bouncing between fires, coaching, and metrics presentations.',
      type: 'shift',
      difficulty: {
        ambientMult: 1.2,
        eventMult: 1.2,
        meterMult: 1.1,
      },
      meterOffsets: {
        queue: 10,
        safety: 5,
        rage: 8,
        burnout: 15,
        scrutiny: 12,
      },
      barks: [
        'Can you mentor the new PIC at Store 47?',
        'We need you on that conference call at 2.',
        'Your numbers look great — can you share your playbook?',
        'District meeting Thursday, prep a slide.',
        "You're on the short list for the regional role.",
      ],
    },
  ],

  decisions: [
    {
      id: 'c6_problem_store_decision',
      afterShift: 'c6_problem_store',
      prompt:
        "You've been dropped into the district's worst store. How do you handle it?",
      choices: [
        {
          text: 'Take charge fast.',
          effects: { reputation: +8, burnout: +8, leadershipAlignment: +5 },
        },
        {
          text: 'Stabilize quietly.',
          effects: { storeReadiness: +5, burnout: +5, teamStrength: +3 },
        },
        {
          text: 'Just survive the shift.',
          effects: { burnout: -3, reputation: -3 },
        },
      ],
    },
    {
      id: 'c6_visit_absurd',
      afterShift: 'c6_visit_never_comes',
      prompt:
        'The visit was cancelled after hours of performance theater. '
        + 'What now?',
      choices: [
        {
          text: 'Stay polished anyway.',
          effects: { leadershipAlignment: +5, burnout: +5, reputation: +3 },
        },
        {
          text: 'Let the store exhale.',
          effects: { teamStrength: +5, burnout: -3, leadershipAlignment: -3 },
        },
        {
          text: 'Call out how absurd this was.',
          effects: {
            leadershipAlignment: -8,
            reputation: -3,
            clinicalIntegrity: +3,
          },
        },
      ],
    },
    {
      id: 'c6_district_fork',
      afterShift: 'c6_district_resource',
      prompt:
        'They want to make you a district resource permanently. '
        + 'This is the fork.',
      majorFork: true,
      choices: [
        {
          text: 'Take the stretch role.',
          effects: {
            leadershipAlignment: +10,
            reputation: +8,
            burnout: +10,
          },
        },
        {
          text: 'Stay and build your store.',
          effects: {
            teamStrength: +8,
            storeReadiness: +8,
            clinicalIntegrity: +5,
          },
        },
        {
          text: 'Start looking for the exit.',
          effects: {
            burnout: -10,
            leadershipAlignment: -10,
            reputation: -5,
          },
          flags: { actively_looking_for_exit: true },
        },
      ],
    },
  ],

  storyNodes: [
    {
      id: 'c6_intro',
      type: 'story',
      text: [
        'Your name keeps coming up in rooms you never enter.',
        'The Polished Visitor — your field leader — moves through '
          + 'the district like a campaign. Firm handshake, pressed shirt, '
          + 'metrics on the tip of his tongue.',
        'He noticed you. Not the way the Rescuer-User noticed you — '
          + 'not with warmth. With calculation.',
        '"You\'re too good to stay in one place," he tells you. '
          + 'It sounds like a compliment. It is a deployment.',
        'Problem stores, district projects, conference calls, '
          + 'stretch assignments. They need you everywhere because '
          + 'everywhere is on fire and you keep not burning.',
        'Too useful to leave alone.',
      ],
    },
    {
      id: 'c6_result',
      type: 'chapter_result',
      text: [
        'Chapter 6 — Complete.',
        'You were everywhere. The problem store, the phantom visit, '
          + 'the district stage. They moved you like a chess piece '
          + 'and called it opportunity.',
        'The Polished Visitor wrote your name into three reports '
          + 'and two presentations. He is pleased.',
        'But being needed everywhere means belonging nowhere. '
          + 'Your own store ran without you. Your own team learned '
          + 'to stop waiting.',
        'The cost of being indispensable is never being still.',
        'They will need you again tomorrow. And the day after that.',
      ],
    },
  ],
};
