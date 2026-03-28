// campaign-ch5.js — Chapter 5: PIC
// Field leader: The Metrics Hawk (labor, wait time, vaccines, throughput, scorecards)
// Theme: "You wanted influence. Now you own consequences."

export const CHAPTER_5 = {

  meta: {
    id: 'ch5',
    title: 'PIC',
    subtitle: 'You wanted influence. Now you own consequences.',
    leaderType: 'metrics_hawk',
  },

  shifts: [
    {
      id: 'c5_first_week_pic',
      title: 'First Week as PIC',
      description:
        "You're the pharmacist-in-charge now. Everything is your responsibility. "
        + 'Staff looks to you.',
      type: 'shift',
      difficulty: {
        ambientMult: 1.1,
        eventMult: 1.1,
        meterMult: 1.0,
      },
      meterOffsets: {
        queue: 5,
        safety: 5,
        rage: 5,
        burnout: 8,
        scrutiny: 12,
      },
      barks: [
        "You're the PIC now? Good luck.",
        'The schedule needs to be posted by Friday.',
        "We're short on flu shots.",
        'The DM wants your action plan by end of week.',
        'Are you approving this overtime?',
      ],
    },
    {
      id: 'c5_new_hire',
      title: 'New Hire Burden',
      description:
        'Training a new tech while running the store. '
        + 'They slow everything down but you need to invest.',
      type: 'shift',
      difficulty: {
        ambientMult: 1.0,
        eventMult: 1.0,
        meterMult: 1.1,
      },
      meterOffsets: {
        queue: 12,
        safety: 8,
        rage: 8,
        burnout: 10,
        scrutiny: 8,
      },
      barks: [
        'Where does this go?',
        'The register is doing something weird.',
        'Can you check if I did this right?',
        "I don't know how to process this.",
        "Sorry, I'm still learning.",
      ],
    },
    {
      id: 'c5_offsite_clinic',
      title: 'Off-Site Clinic Day',
      description:
        'SIGNATURE SHIFT. You and a tech are off-site doing a vaccination clinic. '
        + 'Different gameplay shape. Leadership messages about throughput and hours.',
      type: 'shift',
      difficulty: {
        ambientMult: 1.3,
        eventMult: 1.2,
        meterMult: 1.1,
        gameDuration: 390,
      },
      meterOffsets: {
        queue: 15,
        safety: 5,
        rage: 5,
        burnout: 12,
        scrutiny: 15,
      },
      barks: [
        'How many vaccines have you done?',
        'We need to hit 50 today.',
        'The consent forms are running out.',
        "Someone's having a reaction.",
        'Corporate wants a photo op.',
      ],
    },
  ],

  decisions: [
    {
      id: 'c5_pic_identity',
      afterShift: 'c5_first_week_pic',
      major: true,
      prompt: 'What kind of PIC are you?',
      choices: [
        {
          text: 'Team-first — protect my people above all.',
          effects: {
            teamStrength: +10,
            leadershipAlignment: -5,
            reputation: +3,
          },
        },
        {
          text: 'Numbers-first — hit the metrics, earn the trust.',
          effects: {
            leadershipAlignment: +10,
            teamStrength: -5,
            reputation: +5,
          },
        },
        {
          text: 'Safety-first — clinical integrity is non-negotiable.',
          effects: {
            clinicalIntegrity: +10,
            leadershipAlignment: -3,
            reputation: +2,
          },
        },
      ],
    },
    {
      id: 'c5_new_hire',
      afterShift: 'c5_new_hire',
      prompt: 'How do you handle the new tech?',
      choices: [
        {
          text: 'Train them properly — invest the time now.',
          effects: { teamStrength: +8, burnout: +8, storeReadiness: +5 },
        },
        {
          text: 'Throw them into the workflow — sink or swim.',
          effects: { teamStrength: -3, burnout: -3, storeReadiness: +3 },
        },
        {
          text: 'Keep them on low-stakes tasks only.',
          effects: { teamStrength: +3, burnout: +3, storeReadiness: -2 },
        },
      ],
    },
    {
      id: 'c5_offsite',
      afterShift: 'c5_offsite_clinic',
      prompt: 'The clinic is behind pace. What do you prioritize?',
      choices: [
        {
          text: 'Push throughput — hit the number.',
          effects: {
            leadershipAlignment: +8,
            clinicalIntegrity: -5,
            reputation: +5,
          },
        },
        {
          text: 'Keep quality high — every patient gets full attention.',
          effects: {
            clinicalIntegrity: +8,
            leadershipAlignment: -3,
            reputation: +3,
          },
        },
        {
          text: 'Game the optics a little — close enough counts.',
          effects: {
            leadershipAlignment: +5,
            clinicalIntegrity: -3,
            reputation: +3,
          },
        },
      ],
    },
  ],

  storyNodes: [
    {
      id: 'c5_intro',
      type: 'story',
      text: [
        'They gave you the keys.',
        'Pharmacist-in-charge. PIC. Three letters that mean every '
          + 'mistake, every delay, every complaint rolls uphill to you.',
        'The Metrics Hawk — your field leader — doesn\'t do pep talks. '
          + 'She does dashboards. Labor hours. Wait-time percentiles. '
          + 'Vaccination throughput. Weekly scorecards with your name on them.',
        '"I don\'t need you to be liked. I need your numbers to be green."',
        'Your staff watches to see what kind of leader you\'ll be. '
          + 'Corporate watches to see if you\'ll hit target.',
        'You wanted influence. Now you own consequences.',
      ],
    },
    {
      id: 'c5_result',
      type: 'chapter_result',
      text: [
        'Chapter 5 — Complete.',
        'You learned what ownership actually means. Not the title, '
          + 'not the keys — the weight.',
        'Every staffing gap, every missed metric, every undertrained tech '
          + 'traces back to you now. The Metrics Hawk doesn\'t care about excuses. '
          + 'She cares about trend lines.',
        'You chose who you are as a PIC. Your team noticed. '
          + 'Leadership noticed. The scorecard noticed.',
        'The store is yours. So are the consequences.',
      ],
    },
  ],
};
