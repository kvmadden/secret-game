/**
 * Chapter introduction and transition narrative text.
 * Each entry: chapterId, title, subtitle, introText[], outroText[], transitionText, leaderIntro.
 * Chapter 7 introText varies by ending lane.
 */

export const CHAPTER_INTROS = {

  prologue: {
    chapterId: 'prologue',
    title: 'Prologue',
    subtitle: 'Congratulations, Doctor.',
    introText: [
      '"Congratulations, Doctor." The diploma is real. The title is real. The 4AM alarm that starts tomorrow is real.',
      'Four years of rotations, exams, and pretending to be confident. Now the pretending has to work.',
      'Your first store assignment came by email. A PDF with a start date, a dress code, and a parking policy.',
      'Nobody tells you how quiet it gets the night before your first shift.',
    ],
    outroText: [
      'You set two alarms. Then a third.',
      'The white coat is hanging on the door. Still has the tags on.',
    ],
    transitionText: 'Morning comes whether you sleep or not.',
    leaderIntro: null,
  },

  ch1: {
    chapterId: 'ch1',
    title: 'Chapter 1',
    subtitle: 'Welcome Aboard',
    introText: [
      'The white coat feels stiff. The badge has your name on it, spelled right, which feels like a small miracle.',
      'Everything smells like floor wax and hand sanitizer. The pharmacy is smaller than you imagined.',
      'Someone hands you a login. Someone else hands you a stack of SOPs. A third person asks if you can check a prescription.',
      'You have not been here five minutes.',
    ],
    outroText: [
      'The coat fits different at the end of the day. Heavier, somehow. Your feet hurt in places you didn\'t know feet could hurt.',
      'You verified 200 prescriptions. You remember maybe four of them.',
      'Tomorrow you do it again.',
    ],
    transitionText: 'They need you somewhere else this week.',
    leaderIntro: 'Your field leader is The Cheerleader. Warm smile. Encouraging words. Genuinely believes you\'ll be great.',
  },

  ch2: {
    chapterId: 'ch2',
    title: 'Chapter 2',
    subtitle: 'Float Season',
    introText: [
      'Your name is on a rotation list now. A different store every week. Sometimes every three days.',
      'You never know where the spatulas are. The counting trays are always in the wrong drawer. The printer jams differently at each location.',
      'Every pharmacist-in-charge has a system. None of them are the same system.',
      'You learn to read a pharmacy in the first ten minutes. Where things are filed. Who actually runs the place. Which tech to trust.',
    ],
    outroText: [
      'You\'ve worked nine stores in six weeks. Every store is the same kind of broken in different ways.',
      'The drive-through is always understaffed. The shelves are always behind. The phone never stops.',
    ],
    transitionText: 'They gave you a home store. You\'ll wish they hadn\'t.',
    leaderIntro: 'Your field leader is The Ghost. Exists mostly as a voicemail greeting and an occasional email.',
  },

  ch3: {
    chapterId: 'ch3',
    title: 'Chapter 3',
    subtitle: 'Goldfish Bowl',
    introText: [
      'The pharmacy is a fishbowl. Three glass walls and a counter. Every customer can see everything.',
      'Every mistake is public. Every phone call is overheard. Every conversation with a tech happens in front of an audience.',
      'You learn to have difficult conversations at a volume that carries confidence but not content.',
      'Someone is always watching. Waiting. Judging the speed of your hands.',
    ],
    outroText: [
      'You learned to perform competence while drowning. Calm face, steady hands, controlled voice.',
      'The customers don\'t know how close it gets some days. That\'s the whole point.',
    ],
    transitionText: 'People started calling you first.',
    leaderIntro: 'Your field leader is The Fake Helper. Shows up with solutions that create more problems.',
  },

  ch4: {
    chapterId: 'ch4',
    title: 'Chapter 4',
    subtitle: 'The Reliable One',
    introText: [
      'Your phone rings more now. Not personal calls. Coverage requests. Questions about formulary changes. Can you stay late.',
      'You said yes too many times and now yes is expected. The schedule has your name in ink where others are written in pencil.',
      'Being reliable is a trap that feels like a compliment.',
    ],
    outroText: [
      'The cost of being good at your job is that your job gets bigger. Nobody adjusts the pay.',
      'You missed something this week. Not at work. Something outside of work. You can\'t remember what.',
    ],
    transitionText: 'They made you PIC.',
    leaderIntro: 'Your field leader is The Rescuer. Genuinely trusts you. That trust becomes weight.',
  },

  ch5: {
    chapterId: 'ch5',
    title: 'Chapter 5',
    subtitle: 'PIC',
    introText: [
      'The keys to the pharmacy are in your pocket now. You feel them when you walk.',
      'The schedule is yours. The complaints are yours. The labor budget is a spreadsheet someone emailed you without explanation.',
      'You open. You close. You answer for everything that happens in between.',
      'Ownership without authority. Responsibility without resources.',
    ],
    outroText: [
      'You own this pharmacy the way a tenant owns an apartment. You maintain it. You answer for it. You don\'t control it.',
      'The DM has opinions about your vaccine numbers. You have opinions about your staffing.',
    ],
    transitionText: 'The district noticed you.',
    leaderIntro: 'Your field leader is The Metrics Hawk. Dashboards. Scorecards. Throughput targets. Everything is a number.',
  },

  ch6: {
    chapterId: 'ch6',
    title: 'Chapter 6',
    subtitle: 'We Need You Everywhere',
    introText: [
      'Your name is in emails you\'ve never seen. Someone volunteered you for a pilot program.',
      'You are a "district resource" now. That means your calendar belongs to other people.',
      'Three stores need coverage this week. A new grad needs mentoring. There\'s a compliance audit Thursday.',
      'You stopped being a pharmacist somewhere in here. You became a solution.',
    ],
    outroText: [
      'There was a moment — Tuesday, maybe — when you realized your usefulness stopped belonging to you.',
      'They needed you everywhere. Which meant you were never fully anywhere.',
    ],
    transitionText: 'What did it make you?',
    leaderIntro: 'Your field leader is The Polished Visitor. Moves through stores like a campaign stop. Remembers your name. Forgets your problems.',
  },

  ch7: {
    chapterId: 'ch7',
    title: 'Chapter 7',
    subtitle: 'What It Made You',
    introText: {
      builder: [
        'You stayed. Not because they asked you to, but because the store needed someone who would.',
        'The team is better now. The workflow makes sense. The shelves are caught up.',
        'You built something. It\'s not glamorous. It works.',
      ],
      escape: [
        'You left. Packed the white coat in a box in the closet.',
        'The alarm doesn\'t go off at 4AM anymore. Your phone doesn\'t ring on Saturdays.',
        'Some people call it quitting. You call it the first honest decision you made in years.',
      ],
      climber: [
        'Corporate noticed. They always notice the ones who say yes and deliver.',
        'The offer came by email. New title. New territory. An office without a drive-through window.',
        'You\'re moving up. Whether that\'s forward is a different question.',
      ],
      quiet_pro: [
        'Nobody noticed. That was the whole point.',
        'You come in. You verify. You counsel. You go home. The patients get what they need.',
        'There is no award for consistency. That\'s fine.',
      ],
      martyr: [
        'You gave everything. The store runs on you and everyone knows it.',
        'Your body keeps a ledger your paycheck doesn\'t reflect.',
        'They\'ll name a break room after you. They won\'t fix the staffing.',
      ],
      burnout_end: [
        'You stared at the ceiling for an hour before getting up today.',
        'The prescriptions blur together. The customers blur together. The days blur together.',
        'Something has to change. You\'re not sure you have the energy to figure out what.',
      ],
    },
    outroText: null,
    transitionText: null,
    leaderIntro: null,
  },
};
