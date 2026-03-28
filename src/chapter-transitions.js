/**
 * Between-chapter transition scenes.
 * Each transition bridges two chapters with short narrative text,
 * varying slightly based on campaign state (burnout, reputation, etc.).
 */

export const CHAPTER_TRANSITIONS = {

  prologue_to_ch1: {
    id: 'prologue_to_ch1',
    fromChapter: 'prologue',
    toChapter: 'ch1',
    sceneTitle: 'The Drive',
    timeSkip: 'The next morning',
    visualHint: 'dawn breaking over a strip mall parking lot',
    stateCheck: (state) => state.burnout > 30 ? 'anxious' : 'default',
    variants: {
      default: [
        'The alarm won. You were dressed before the second one went off.',
        'The drive was shorter than you expected. Strip mall. Chain coffee place. A sign that says PHARMACY in letters taller than you are.',
        'You parked in the wrong spot. Someone will tell you later. For now, you just sit in the car for a minute with the engine off.',
        'Deep breath. Badge clipped on. Door open. Here we go.',
      ],
      anxious: [
        'You were awake before the alarm. Had been for an hour.',
        'The drive felt longer than it should have. Every red light was a chance to turn around. You didn\'t.',
        'The parking lot was almost empty. Too early. You sat in the car and watched the dashboard clock until it felt less ridiculous to walk in.',
        'Your hands were steady. That surprised you.',
      ],
    },
    narration: [
      'The alarm won. You were dressed before the second one went off.',
      'The drive was shorter than you expected. Strip mall. Chain coffee place. A sign that says PHARMACY in letters taller than you are.',
      'You parked in the wrong spot. Someone will tell you later. For now, you just sit in the car for a minute with the engine off.',
      'Deep breath. Badge clipped on. Door open. Here we go.',
    ],
  },

  ch1_to_ch2: {
    id: 'ch1_to_ch2',
    fromChapter: 'ch1',
    toChapter: 'ch2',
    sceneTitle: 'The List',
    timeSkip: 'Two weeks later',
    visualHint: 'a printed schedule taped to a break room wall',
    stateCheck: (state) => state.burnout > 50 ? 'high_burnout' : 'default',
    variants: {
      default: [
        'Your name appeared on the float list. They needed someone reliable, and someone told them that was you.',
        'Nine stores in the district. You\'d seen one. Now they wanted you to learn the rest, three days at a time.',
        'You bought a better pair of shoes. The old ones didn\'t survive week one.',
        'Every store has the same corporate layout and completely different energy. You\'ll figure that out soon.',
      ],
      high_burnout: [
        'Your name appeared on the float list. You barely recovered from the last week, and already they need you somewhere else.',
        'Nine stores. New logins, new alarm codes, new faces who won\'t remember yours. The schedule arrived as a PDF with no explanation.',
        'You bought a better pair of shoes. The old ones gave up before you did.',
        'The car becomes your office between stores. Coffee in the cupholder. GPS running. Eyes forward.',
      ],
    },
    narration: [
      'Your name appeared on the float list. They needed someone reliable, and someone told them that was you.',
      'Nine stores in the district. You\'d seen one. Now they wanted you to learn the rest, three days at a time.',
      'You bought a better pair of shoes. The old ones didn\'t survive week one.',
      'Every store has the same corporate layout and completely different energy. You\'ll figure that out soon.',
    ],
  },

  ch2_to_ch3: {
    id: 'ch2_to_ch3',
    fromChapter: 'ch2',
    toChapter: 'ch3',
    sceneTitle: 'Home Store',
    timeSkip: 'Six weeks later',
    visualHint: 'keys being handed over across a pharmacy counter',
    stateCheck: (state) => state.reputation > 60 ? 'respected' : 'default',
    variants: {
      default: [
        'They gave you a home store. Store 1847. The one on Miller Road with the drive-through that sticks.',
        'You have your own login that doesn\'t expire. A locker with your name on tape. A parking spot nobody told you about but everyone respects.',
        'The techs sized you up the first morning. You could feel it. New pharmacist. How long will this one last.',
        'The fishbowl starts now. Every shift, three glass walls and a waiting room full of people who need something from you.',
      ],
      respected: [
        'They gave you a home store. Store 1847. The one on Miller Road. Word traveled that you were solid.',
        'The lead tech shook your hand on day one. That doesn\'t always happen. Someone from your float rotation put in a good word.',
        'You have your own login, your own locker, your own section of counter that nobody else uses. It almost feels like yours.',
        'The fishbowl starts now. But at least the techs aren\'t testing you. Not yet.',
      ],
    },
    narration: [
      'They gave you a home store. Store 1847. The one on Miller Road with the drive-through that sticks.',
      'You have your own login that doesn\'t expire. A locker with your name on tape. A parking spot nobody told you about but everyone respects.',
      'The techs sized you up the first morning. You could feel it. New pharmacist. How long will this one last.',
      'The fishbowl starts now. Every shift, three glass walls and a waiting room full of people who need something from you.',
    ],
  },

  ch3_to_ch4: {
    id: 'ch3_to_ch4',
    fromChapter: 'ch3',
    toChapter: 'ch4',
    sceneTitle: 'The Phone',
    timeSkip: 'Three months later',
    visualHint: 'a phone buzzing on a nightstand in the dark',
    stateCheck: (state) => state.burnout > 60 ? 'high_burnout' : 'default',
    variants: {
      default: [
        'People started calling you first. Not the help desk. Not the DM. You.',
        'Coverage gaps. Formulary questions. "Can you just check something real quick." The calls came at dinner. On your day off. During the eleven minutes between closing one store and driving home.',
        'You said yes. You kept saying yes. It felt good to be needed. It felt like proof you belonged here.',
        'The schedule filled in around you like water around a rock. You stopped noticing when your days off disappeared.',
        'Someone called you reliable. You weren\'t sure if it was a compliment or a warning.',
      ],
      high_burnout: [
        'People started calling you first. You started letting it ring.',
        'Coverage gaps. Formulary questions. Requests dressed up as favors. The phone became the thing you dreaded most, and it was always in your pocket.',
        'You said yes because saying no required an explanation you didn\'t have the energy for.',
        'Your days off stopped feeling like days off. They felt like shifts you hadn\'t been scheduled for yet.',
        'Someone called you reliable. You heard "available."',
      ],
    },
    narration: [
      'People started calling you first. Not the help desk. Not the DM. You.',
      'Coverage gaps. Formulary questions. "Can you just check something real quick." The calls came at dinner. On your day off. During the eleven minutes between closing one store and driving home.',
      'You said yes. You kept saying yes. It felt good to be needed. It felt like proof you belonged here.',
      'The schedule filled in around you like water around a rock. You stopped noticing when your days off disappeared.',
      'Someone called you reliable. You weren\'t sure if it was a compliment or a warning.',
    ],
  },

  ch4_to_ch5: {
    id: 'ch4_to_ch5',
    fromChapter: 'ch4',
    toChapter: 'ch5',
    sceneTitle: 'The Keys',
    timeSkip: 'Four months later',
    visualHint: 'a set of pharmacy keys on a lanyard, placed on a desk',
    stateCheck: (state) => state.leadershipAlignment > 50 ? 'aligned' : 'default',
    variants: {
      default: [
        'They made you PIC. Pharmacist-in-charge. The email was two sentences and a PDF of updated responsibilities.',
        'Nobody asked. It wasn\'t really a promotion. The last PIC transferred and you were already doing the work.',
        'The keys arrived in an envelope from the district office. A full ring. Front door, pharmacy gate, safe, narcotics cabinet. They weighed more than you expected.',
        'You clipped them to your belt and felt something shift. Not pride exactly. Ownership. The weight of a thing that was now yours to keep running.',
      ],
      aligned: [
        'They made you PIC. The DM called personally, which apparently means they think you\'re going places.',
        'The promotion wasn\'t a surprise. You\'d been running the store in everything but title for weeks. Now the title caught up.',
        'The keys arrived with a card from the district office. "Congratulations on your new role." Pre-printed. But the DM added a handwritten line at the bottom.',
        'You clipped them to your belt. The weight felt earned. Whether that lasts is a different question.',
      ],
    },
    narration: [
      'They made you PIC. Pharmacist-in-charge. The email was two sentences and a PDF of updated responsibilities.',
      'Nobody asked. It wasn\'t really a promotion. The last PIC transferred and you were already doing the work.',
      'The keys arrived in an envelope from the district office. A full ring. Front door, pharmacy gate, safe, narcotics cabinet. They weighed more than you expected.',
      'You clipped them to your belt and felt something shift. Not pride exactly. Ownership. The weight of a thing that was now yours to keep running.',
    ],
  },

  ch5_to_ch6: {
    id: 'ch5_to_ch6',
    fromChapter: 'ch5',
    toChapter: 'ch6',
    sceneTitle: 'The Email',
    timeSkip: 'Six months later',
    visualHint: 'a laptop screen glowing in a dark kitchen',
    stateCheck: (state) => state.burnout > 70 ? 'high_burnout' : state.reputation > 70 ? 'noticed' : 'default',
    variants: {
      default: [
        'The district noticed you. That was the phrase they used. "We\'ve noticed your work at 1847."',
        'An email appeared with your name cc\'d on a thread that started three weeks before anyone told you about it. A pilot program. A "district resource" role. Your calendar was already being discussed.',
        'You read it at 11PM in your kitchen. The laptop light was the only light on in the apartment.',
        'They were offering you more. More stores. More responsibility. More of everything except time and staff.',
      ],
      high_burnout: [
        'The district noticed you. You wished they hadn\'t.',
        'An email chain three weeks deep, your name dropped in like an afterthought. Pilot program. Coverage coordination. "Leveraging your flexibility." You read it twice to make sure it said what you thought it said.',
        'You closed the laptop. Opened it again. Read it a third time. The kitchen was dark.',
        'They wanted more. You weren\'t sure there was more to give. But the thread was already moving.',
      ],
      noticed: [
        'The district noticed you. Your metrics were clean, your complaints were low, and someone above your DM read a report with your store number on it.',
        'The email came with a calendar invite already attached. A pilot program. District-level coordination. The kind of role that looks good on a resume and bad on a sleep schedule.',
        'You read it in the parking lot after close. The store was dark behind you.',
        'This was the next step. Whether you wanted it or not, the ladder was under your feet.',
      ],
    },
    narration: [
      'The district noticed you. That was the phrase they used. "We\'ve noticed your work at 1847."',
      'An email appeared with your name cc\'d on a thread that started three weeks before anyone told you about it. A pilot program. A "district resource" role. Your calendar was already being discussed.',
      'You read it at 11PM in your kitchen. The laptop light was the only light on in the apartment.',
      'They were offering you more. More stores. More responsibility. More of everything except time and staff.',
    ],
  },

  ch6_to_ch7: {
    id: 'ch6_to_ch7',
    fromChapter: 'ch6',
    toChapter: 'ch7',
    sceneTitle: 'The Mirror',
    timeSkip: 'One year in',
    visualHint: 'car driving past a pharmacy at night, lights still on inside',
    stateCheck: (state) => {
      if (state.burnout > 80) return 'burned';
      if (state.teamStrength > 60) return 'grounded';
      return 'default';
    },
    variants: {
      default: [
        'A year. You\'ve been doing this for a year. The diploma on the wall has dust on the frame.',
        'You drove past a pharmacy last night. Not yours. The lights were still on at 9:45. Someone was in there, counting, verifying, answering the phone. You knew exactly what that felt like.',
        'The job made you something. You\'re still figuring out what.',
        'Tomorrow is another shift. But today, just for a second, you stopped and looked at what you\'ve built. Or what\'s been built out of you.',
      ],
      burned: [
        'A year. It feels longer. Your body keeps time differently than the calendar.',
        'You drove past a pharmacy last night. The lights were on. Someone was still in there. You felt something between sympathy and dread.',
        'The job took something. You can feel the shape of what\'s missing even if you can\'t name it.',
        'Tomorrow is another shift. You\'ll show up. You always show up. That\'s the problem and the proof.',
      ],
      grounded: [
        'A year. The team made it. Not without losses, not without bad weeks, but they made it.',
        'You drove past a pharmacy last night. The lights were on. You thought about the person inside and hoped they had a good tech with them.',
        'The job shaped you. The people beside you kept you from breaking.',
        'Tomorrow is another shift. But the team is solid. Whatever comes next, you won\'t face it alone.',
      ],
    },
    narration: [
      'A year. You\'ve been doing this for a year. The diploma on the wall has dust on the frame.',
      'You drove past a pharmacy last night. Not yours. The lights were still on at 9:45. Someone was in there, counting, verifying, answering the phone. You knew exactly what that felt like.',
      'The job made you something. You\'re still figuring out what.',
      'Tomorrow is another shift. But today, just for a second, you stopped and looked at what you\'ve built. Or what\'s been built out of you.',
    ],
  },
};
