// campaign-ch1.js — Chapter 1: Welcome Aboard
// Field leader: The Cheerleader (warm, upbeat, encouraging)
// Theme: "Support first. Then they take it away."

export const CHAPTER_1 = {

  meta: {
    id: 'ch1',
    title: 'Welcome Aboard',
    subtitle: 'Support first. Then they take it away.',
    leaderType: 'cheerleader',
  },

  shifts: [
    {
      id: 'c1_shadow_day',
      title: 'Shadow Day',
      description: 'Slow Sunday. A seasoned pharmacist walks you through everything.',
      type: 'shift',
      difficulty: {
        ambientMult: 0.5,
        eventMult: 0.4,
        meterMult: 0.6,
        gameDuration: 300,
      },
      meterOffsets: { queue: 0, safety: 0, rage: 0, burnout: 0, scrutiny: 0 },
      tutorialEnabled: true,
      mentorPresent: true,
      weather: 'clear',
      barks: [
        'The senior pharmacist nods encouragingly.',
        'Take your time on this one.',
        "Watch how I handle the phone — you'll need that.",
        'Sunday pace. Enjoy it while it lasts.',
        "Don't worry about the queue, I've got overflow.",
      ],
    },
    {
      id: 'c1_solo_sunday',
      title: 'Solo Sunday',
      description:
        "Same store, same Sunday... but the senior pharmacist isn't here.",
      type: 'shift',
      difficulty: {
        ambientMult: 0.8,
        eventMult: 0.7,
        meterMult: 0.8,
        gameDuration: 330,
      },
      meterOffsets: { queue: 5, safety: 0, rage: 5, burnout: 0, scrutiny: 0 },
      mentorPresent: false,
      weather: 'clear',
      barks: [
        "Where's the other pharmacist?",
        "You're by yourself today?",
        'I thought there were supposed to be two of you.',
        'This line is getting long...',
        'Can I get some help over here?',
      ],
    },
    {
      id: 'c1_thrown_in',
      title: 'Thrown In',
      description: 'Called to cover at a busier store. No handoff. No mercy.',
      type: 'shift',
      difficulty: {
        ambientMult: 1.0,
        eventMult: 1.0,
        meterMult: 1.0,
        gameDuration: 360,
      },
      meterOffsets: {
        queue: 10,
        safety: 5,
        rage: 8,
        burnout: 5,
        scrutiny: 5,
      },
      mentorPresent: false,
      firstRetryShift: true,
      weather: 'clear',
      barks: [
        'Are you the new one?',
        'The other pharmacist left an hour ago.',
        "There's a stack of scripts nobody touched.",
        'The drive-thru has been ringing for ten minutes.',
        'Good luck.',
        "We've been waiting.",
      ],
    },
  ],

  decisions: [
    {
      id: 'c1_mentor_guidance',
      afterShift: 'c1_shadow_day',
      prompt: "How do you receive the mentor's guidance?",
      choices: [
        {
          text: 'Take it to heart — this matters.',
          effects: { clinicalIntegrity: +5, burnout: -3 },
        },
        {
          text: 'Focus on speed — I need to be faster.',
          effects: { reputation: +3, clinicalIntegrity: -2 },
        },
        {
          text: 'Just survive the day.',
          effects: { burnout: -5 },
        },
      ],
    },
    {
      id: 'c1_stay_late',
      afterShift: 'c1_solo_sunday',
      prompt: 'Stay late unpaid or leave on time?',
      choices: [
        {
          text: 'Stay and clean it up.',
          effects: { reputation: +5, burnout: +8, storeReadiness: +5 },
        },
        {
          text: 'Leave on time.',
          effects: { burnout: -5, reputation: -3, leadershipAlignment: -2 },
        },
        {
          text: 'Split the difference — one more hour.',
          effects: { reputation: +2, burnout: +3, storeReadiness: +3 },
        },
      ],
    },
    {
      id: 'c1_framing',
      afterShift: 'c1_thrown_in',
      prompt: 'How do you frame what just happened?',
      choices: [
        {
          text: 'I can handle this.',
          effects: {
            reputation: +5,
            leadershipAlignment: +5,
            burnout: +5,
          },
        },
        {
          text: 'I need more support.',
          effects: { teamStrength: +3, leadershipAlignment: -3 },
        },
        {
          text: 'This is not what I thought it would be.',
          effects: { burnout: -3, clinicalIntegrity: +3 },
        },
      ],
    },
  ],

  storyNodes: [
    {
      id: 'c1_intro',
      type: 'story',
      text: [
        'Your first day behind the pharmacy counter.',
        'The Cheerleader — your field leader — greets you with a grin '
          + "and a lanyard. She's warm, upbeat, and full of promises.",
        '"You\'re going to love it here. We\'re a family."',
        'She means it. For now.',
        'This week you learn the bench: intake, data entry, fill, '
          + 'verification, pickup. A seasoned pharmacist shows you the ropes.',
        'By the end of the chapter, that pharmacist is gone '
          + "and you're holding it together alone.",
        'Support first. Then they take it away.',
      ],
    },
    {
      id: 'c1_result',
      type: 'chapter_result',
      text: [
        'Chapter 1 — Complete.',
        'You learned the stations. You met the customers. '
          + 'You discovered what a queue looks like when nobody is coming to help.',
        'The Cheerleader calls it "growth."',
        'You call it Monday.',
        'The bench is yours now — for better or worse.',
      ],
    },
  ],
};
