// campaign-ch3.js — Chapter 3: Goldfish Bowl
// Field leader: The Fake Helper (appears supportive, adds interruptions)
// Theme: "The work is not only hard. It is exposed."

export const CHAPTER_3 = {

  meta: {
    id: 'ch3',
    title: 'Goldfish Bowl',
    subtitle: 'The work is not only hard. It is exposed.',
    leaderType: 'fake_helper',
  },

  shifts: [
    {
      id: 'c3_since_youre_here',
      title: 'Since You\'re Here',
      description:
        'Non-stop "since you\'re here" interruptions. Customers treat you '
        + 'as available for anything — aisle help, OTC advice, blood pressure '
        + 'checks, returns. The public sees no boundary.',
      type: 'shift',
      difficulty: {
        ambientMult: 1.2,
        eventMult: 1.1,
        meterMult: 1.0,
      },
      meterOffsets: { queue: 8, safety: 0, rage: 10, burnout: 8, scrutiny: 5 },
      weather: 'clear',
      barks: [
        'Since you\'re here, can you check my blood pressure?',
        'Where\'s the Tylenol?',
        'Can you look up if this interacts with my medicine?',
        'My insurance card doesn\'t work at the register.',
        'Are you the pharmacist? I have a quick question.',
        'I just need one thing, it\'ll only take a second.',
        'Can you come out from back there and show me?',
        'You look like you know — is this the right one for allergies?',
      ],
    },
    {
      id: 'c3_cant_be_rude',
      title: 'Can\'t Be Rude',
      description:
        'Sticky social encounters. Lonely regulars eating your time, '
        + 'patients who won\'t leave, public expectation of warmth '
        + 'while you drown behind the counter.',
      type: 'shift',
      difficulty: {
        ambientMult: 1.0,
        eventMult: 1.1,
        meterMult: 1.1,
      },
      meterOffsets: { queue: 5, safety: 0, rage: 12, burnout: 10, scrutiny: 8 },
      weather: 'clear',
      barks: [
        'My grandson never visits anymore. Do you have a minute?',
        'Let me tell you about every medication I\'ve ever taken.',
        'I\'m not done yet — I have twenty more questions.',
        'You\'re the only one who listens to me.',
        'I brought photos of my rash. Want to see?',
        'Hold on, I wrote my questions down somewhere...',
        'Can I just talk to you for a minute? Just one minute.',
        'You remind me of my daughter. She\'s a nurse.',
      ],
    },
    {
      id: 'c3_surprise_visit',
      title: 'Surprise Visit During Collapse',
      description:
        'SIGNATURE SHIFT. The store is already falling apart — then your '
        + 'field leader walks in and forces your attention outward. '
        + 'You must perform competence while everything burns.',
      type: 'shift',
      signature: true,
      difficulty: {
        ambientMult: 1.3,
        eventMult: 1.3,
        meterMult: 1.2,
      },
      meterOffsets: { queue: 12, safety: 8, rage: 10, burnout: 10, scrutiny: 15 },
      weather: 'clear',
      barks: [
        'I\'ve been waiting twenty minutes!',
        'Your leader is watching you from the front.',
        'She\'s taking notes on her tablet.',
        'The drive-thru line is around the building.',
        '"How are we doing back here?" She smiles. She already knows.',
        'A customer asks your leader if she works here. She laughs.',
        'Three people in line. Two on hold. One at pickup. Leader at the counter.',
        '"I just want to see how you handle the flow."',
        'The phone won\'t stop ringing and she\'s still standing there.',
      ],
    },
  ],

  decisions: [
    {
      id: 'c3_aisle_help',
      afterShift: 'c3_since_youre_here',
      prompt: 'A patient drags you into the aisle and the swarm starts.',
      choices: [
        {
          text: 'Walk them all the way — every single one.',
          effects: { rage: -5, burnout: +5, reputation: +3 },
        },
        {
          text: 'Keep pointing and return to the bench.',
          effects: { burnout: -3, rage: +3 },
        },
        {
          text: 'Find another employee to handle the floor.',
          effects: { teamStrength: +3, rage: +5, reputation: -2 },
        },
      ],
    },
    {
      id: 'c3_lonely_regular',
      afterShift: 'c3_cant_be_rude',
      prompt: 'A lonely regular is eating your time.',
      choices: [
        {
          text: 'Stay warm and listen. They need this.',
          effects: { burnout: +8, reputation: +5, clinicalIntegrity: +2 },
        },
        {
          text: 'Keep it kind but short.',
          effects: { burnout: +3, reputation: +2 },
        },
        {
          text: 'Cut them off. You have work to do.',
          effects: { burnout: -3, rage: +5, reputation: -3 },
        },
      ],
    },
    {
      id: 'c3_visit_collapse',
      afterShift: 'c3_surprise_visit',
      prompt: 'Your field leader is here during the worst day.',
      choices: [
        {
          text: 'Perform competence. Smile through it.',
          effects: { reputation: +5, burnout: +8, leadershipAlignment: +5 },
        },
        {
          text: 'Ignore her. Keep the bench moving.',
          effects: { clinicalIntegrity: +5, reputation: +2 },
        },
        {
          text: 'Ask her to actually help.',
          effects: { teamStrength: +3, leadershipAlignment: -5, reputation: -3 },
        },
      ],
    },
  ],

  storyNodes: [
    {
      id: 'c3_intro',
      type: 'story',
      text: [
        'Chapter 3 — Goldfish Bowl.',
        'You knew the work was hard. You didn\'t know everyone was watching.',
        'The pharmacy counter has no walls. Customers see you sweat. '
          + 'They see you hesitate. They see the line behind them '
          + 'and they still want your undivided attention.',
        'Your field leader — The Fake Helper — shows up with a smile '
          + 'and a clipboard. "I\'m here to support you," she says. '
          + 'She does not touch a single prescription.',
        'Every interaction is public. Every shortcut is visible. '
          + 'Every human moment is someone else\'s inconvenience.',
        'The work is not only hard. It is exposed.',
      ],
    },
    {
      id: 'c3_result',
      type: 'chapter_result',
      text: [
        'Chapter 3 — Complete.',
        'You survived the goldfish bowl. The customers watched. '
          + 'The leader watched. The cameras watched.',
        'You learned that pharmacy has no backstage. '
          + 'There is no place to collect yourself, no moment that belongs to you.',
        'The Fake Helper filed her report. '
          + '"Great energy. Keep it up." She was here for forty minutes.',
        'You were here for twelve hours.',
        'The exposure doesn\'t end. You just stop noticing the glass.',
      ],
    },
  ],
};
