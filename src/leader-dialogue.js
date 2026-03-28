// leader-dialogue.js — Per-chapter field leader dialogue for campaign mode
// Each leader has a distinct management personality that colors every interaction.

export const LEADER_DIALOGUE = {

  // ── CHAPTER 1: THE CHEERLEADER ──────────────────────────────────────────
  ch1: {
    leaderId: 'cheerleader',

    chapterMessages: [
      "You're doing amazing! Seriously, first week and you're already handling it.",
      "I know it's a lot, but honestly? You're picking it up faster than most.",
      "Just keep doing what you're doing. You've got great instincts.",
      "I told the DM about you — I said 'this one's going to be great.'",
      "Don't stress about the queue. It always looks worse than it is.",
      "I remember my first week. You're doing way better than I did!",
      "If you ever need anything, seriously, I'm just a phone call away.",
      "The patients love you already. I can tell.",
      "Every pharmacist feels overwhelmed at first. It passes!",
      "You should be proud of yourself. I mean that.",
    ],

    preShiftMessages: {
      c1_shift1: [
        "Welcome welcome welcome! So excited to have you on the team!",
        "Your mentor today is one of our best. You're in great hands.",
        "Just soak it all in today. No pressure at all!",
      ],
      c1_shift2: [
        "You've totally got this. Yesterday was proof!",
        "I'll have my phone on if you need anything. Anything at all.",
        "Sundays are mellow. You'll be fine, I promise.",
      ],
      c1_shift3: [
        "I know this is last-minute, and I'm so sorry, but I know you can handle it.",
        "Think of it as a compliment — they asked for someone good!",
        "You're going to walk out of there feeling like a rockstar.",
      ],
    },

    postShiftMessages: {
      c1_shift1: [
        "See? I knew you'd be a natural!",
        "Your mentor had nothing but good things to say.",
        "Day one: crushed it!",
      ],
      c1_shift2: [
        "You survived solo! That's huge! How do you feel?",
        "I heard it went great. I'm not surprised at all.",
        "Every day is going to feel a little more comfortable.",
      ],
      c1_shift3: [
        "Okay, that was a tough one. But you handled it!",
        "Even when it's hard, you're learning so much.",
        "Every day is a learning opportunity, even the rough ones!",
      ],
    },

    decisionComments: {
      c1_dec1: {
        0: "Rest is important too! Take care of yourself. We'll figure it out.",
        1: "That's the spirit! But make sure you're taking care of you too, okay?",
        2: "Setting boundaries is so healthy. I'm proud of you for that.",
      },
    },
  },

  // ── CHAPTER 2: THE GHOST ────────────────────────────────────────────────
  ch2: {
    leaderId: 'ghost',

    chapterMessages: [
      "Hey sorry just saw this. Everything okay?",
      "In a meeting. Will call you back.",
      "[Message read 3:47 PM]",
    ],

    preShiftMessages: {
      c2_shift1: [
        "Store keys are under the mat if nobody's there yet.",
        "Should be a standard day. Reach out if anything comes up.",
      ],
      c2_shift2: [
        "This store's team is solid. You'll be fine.",
      ],
      c2_shift3: [
        "Overnight protocols are in the binder. Somewhere.",
        "Call the after-hours line if something goes sideways. They usually answer.",
      ],
    },

    postShiftMessages: {
      c2_shift1: [
        "Hey, how'd it go? Sorry I missed your call earlier.",
      ],
      c2_shift2: [],
      c2_shift3: [
        "Just saw you closed out the overnight. Thanks for covering that.",
        "Hope it wasn't too bad. I'll try to get you help next time.",
      ],
    },

    decisionComments: {
      c2_dec1: {
        0: "Good call. I'll loop in compliance when I get a chance.",
        1: "Appreciate you handling that. Sorry I wasn't around.",
        2: "Yeah, probably smart. Let me know if anything changes.",
      },
      c2_dec2: {
        0: "Works for me. I'll keep you on the rotation.",
        1: "I'll see what's available. No promises though.",
        2: "Sure, we can try that. I'll update the schedule... eventually.",
      },
    },
  },

  // ── CHAPTER 3: THE FAKE HELPER ──────────────────────────────────────────
  ch3: {
    leaderId: 'fake_helper',

    chapterMessages: [
      "Hey! Just checking in. How's everything going? Need any help?",
      "I was thinking — while I'm here, can you walk me through your workflow?",
      "Oh, one more thing — can you pull together those outdates numbers before you leave?",
      "I brought coffee! Also, corporate wants a cycle count by end of day.",
      "You're handling this so well. By the way, I need your input on a staffing doc.",
      "Let me know if I can take anything off your plate! Also, the DM wants readback logs.",
      "I'm going to shadow you for a bit, just to see how things flow. Don't mind me.",
      "Quick question — do you have five minutes? It'll only take twenty.",
      "I just want to make sure you have everything you need. Can you show me the queue?",
      "Super helpful having you here. Oh — while I've got you, quick task...",
    ],

    preShiftMessages: {
      c3_shift1: [
        "I'm going to pop in today! Just want to see how you're doing.",
        "Let me know if you need anything — I'll be around.",
        "I might have a couple small things for you, nothing major.",
      ],
      c3_shift2: [
        "DM visit today. I'll be there to support you!",
        "Just be yourself. I'll handle the optics.",
        "I prepped some talking points for you. Check your email.",
      ],
    },

    postShiftMessages: {
      c3_shift1: [
        "Great job today. I told the DM we've got things under control here.",
        "I think our check-in really helped things run smoother, don't you?",
      ],
      c3_shift2: [
        "The DM was impressed. I think our preparation really showed.",
        "We make a good team. I'll mention that in my report.",
        "I highlighted a few wins from today in the weekly recap. We both looked good.",
      ],
    },

    decisionComments: {
      c3_dec1: {
        0: "That's dedication! I'll make sure leadership sees that kind of commitment.",
        1: "Oh — sure, of course. Self-care is important. I just hope the line doesn't back up.",
        2: "Smart. Delegation is key. That's actually something I was going to suggest.",
      },
    },
  },

  // ── CHAPTER 4: THE RESCUER/USER ─────────────────────────────────────────
  ch4: {
    leaderId: 'rescuer_user',

    chapterMessages: [
      "I put you here because I trust you. Nobody else could handle this store.",
      "I know I keep asking a lot. I wouldn't if I had anyone else as strong as you.",
      "The new tech told me you're the best pharmacist they've worked with. That's all you.",
      "I genuinely appreciate what you do. I hope you know that.",
      "When the DM asks me who my most reliable person is, I say your name. Every time.",
      "I tried to get you help today. Couldn't make it work. I'm sorry.",
      "You're the reason this district isn't falling apart. I mean that sincerely.",
      "I feel bad about the hours. But you handle it better than anyone.",
      "Thank you for picking up that shift. I owe you one. Again.",
      "I'm putting in a good word for you at the regional level. You deserve it.",
    ],

    preShiftMessages: {
      c4_shift1: [
        "I need my best person on this. That's you.",
        "I know it's another long one. I wouldn't ask if it wasn't important.",
      ],
      c4_shift2: [
        "The new tech is nervous. You're the only one I trust to train them right.",
        "Just be yourself with them. They'll learn more from you in one day than a week of modules.",
      ],
      c4_shift3: [
        "I'm sorry about the double load. I tried to get coverage.",
        "You're the only one who can keep both sides running. I'll make it up to you.",
        "I know this isn't fair. But I need you.",
      ],
    },

    postShiftMessages: {
      c4_shift1: [
        "Thank you. I know that wasn't easy.",
        "I really appreciate you staying. It didn't go unnoticed.",
      ],
      c4_shift2: [
        "The new tech said you were incredible. That's the kind of leader you are.",
        "Thank you for being patient with them. Not everyone would be.",
      ],
      c4_shift3: [
        "I don't know how you do it. Seriously. Thank you.",
        "You held it together when most people would've walked out. I see that.",
        "I submitted a recognition form for you. It's the least I can do.",
      ],
    },

    decisionComments: {
      c4_dec1: {
        0: "I knew I could count on you. This is going to make a real difference.",
        1: "I understand. I do. I just... I'll figure something else out.",
        2: "That's fair. Let me see what I can move around on the staffing side.",
      },
    },
  },

  // ── CHAPTER 5: THE METRICS HAWK ─────────────────────────────────────────
  ch5: {
    leaderId: 'metrics_hawk',

    chapterMessages: [
      "Your wait time is averaging 14.2 minutes. Target is 12.",
      "Vaccine throughput: 18 this week. Goal was 25. What's the plan?",
      "Readback compliance dropped to 88%. Needs to be 95 by Friday.",
      "Script count is tracking 6% below forecast. Need to close the gap.",
      "MTM completion rate: 62%. That's bottom quartile for the district.",
      "Patient satisfaction score came in at 3.7. Regional average is 4.1.",
      "Your cost-per-script is trending up. Review your ordering patterns.",
      "Immunization attach rate: 11%. Benchmark is 18%. Push the flu shots.",
      "NPS dipped again. Make sure we're prompting the survey at pickup.",
      "Good news — your fill accuracy is 99.2%. Keep that where it is.",
      "Labor efficiency ratio: 1.08. We need that under 1.0.",
    ],

    preShiftMessages: {
      c5_shift1: [
        "Morning. Your dashboard shows three reds and a yellow. Let's get those green.",
        "I sent you the weekly scorecard. Focus areas highlighted.",
        "Labor budget is tight today. Watch the overtime threshold.",
      ],
      c5_shift2: [
        "Board concern came in last night. That's going to hit your compliance score.",
        "Patient complaint is logged. Response time is a tracked metric — handle it today.",
        "Two fires, one shift. Prioritize by impact to the scorecard.",
      ],
    },

    postShiftMessages: {
      c5_shift1: [
        "End-of-day numbers: wait time 13.1, fill count 247, vaccines 4. Mixed bag.",
        "I'll send the recap. A few metrics moved in the right direction.",
      ],
      c5_shift2: [
        "Compliance score held. That's the priority. Everything else is recoverable.",
        "I logged the incident response times. You were within SLA on the complaint.",
        "Rough day on paper, but the numbers tell a better story than it felt.",
      ],
    },

    decisionComments: {
      c5_dec1: {
        0: "Productivity per tech-hour should improve. Monitor the output numbers.",
        1: "Even distribution. Predictable. Won't move the needle but won't break anything.",
        2: "Your overtime is going to spike. I'll flag it but it's your call, PIC.",
      },
    },
  },

  // ── CHAPTER 6: THE POLISHED VISITOR ─────────────────────────────────────
  ch6: {
    leaderId: 'polished_visitor',

    chapterMessages: [
      "The regional team has been really impressed with your trajectory.",
      "We're building a narrative around high-performing stores. Yours is in the deck.",
      "I want to make sure we're telling the right story when leadership visits.",
      "Quick thought — can we reframe that incident as a process improvement win?",
      "The optics on your district are strong. Let's keep that momentum.",
      "I'm cc'ing you on an email to regional. Good visibility for you.",
      "Corporate is rolling out a new initiative. I want you to be the pilot site.",
      "Perception matters as much as performance. Keep that in mind today.",
      "There's a town hall next month. I'd love for you to present a success story.",
      "Between us — your DM is being evaluated too. Make the district look good.",
    ],

    preShiftMessages: {
      c6_shift1: [
        "This store has a reputation. I want you to change the narrative.",
        "Think of this as a turnaround story. Leadership loves a turnaround story.",
        "Document any quick wins. We'll want those for the quarterly review.",
      ],
      c6_shift2: [
        "Coverage crisis is not the framing we want. Let's call it 'adaptive staffing.'",
        "I know it's thin today. Focus on what's visible to patients.",
        "If anyone from corporate calls, we're 'managing through a transition period.'",
      ],
    },

    postShiftMessages: {
      c6_shift1: [
        "Let's debrief on optics. What's the story we tell from today?",
        "I think there's a narrative here about resilience. I'll draft something.",
      ],
      c6_shift2: [
        "Good survival. Now let's package that into something presentable.",
        "I'm going to position today as a proof of concept for lean operations.",
        "Regional doesn't need to know the details. Just the outcomes.",
      ],
    },

    decisionComments: {
      c6_dec1: {
        0: "Great. This is a leadership story. I'll make sure the right people see it.",
        1: "Floating keeps you flexible but doesn't build a brand. Think about that.",
        2: "I hear you, but leading with problems isn't how you get promoted.",
      },
    },
  },

  // ── CHAPTER 7: VARIES BY ENDING LANE ────────────────────────────────────
  ch7: {
    leaderId: 'varies',

    chapterMessages: [
      "However this ends, you earned it.",
      "The career shaped you. Not the other way around.",
      "There's no right answer to any of this. There never was.",
      "Some days you wonder if it was worth it. Then someone thanks you.",
      "You showed up. Every single time. That's more than most.",
    ],

    preShiftMessages: {
      c7_shift1: [
        "Last chapter. Whatever you've become, this shift is yours.",
        "No one's watching. No metrics. Just the work.",
      ],
    },

    postShiftMessages: {
      c7_shift1: [
        "And that's what it made you.",
        "The white coat fits differently now.",
      ],
    },

    // Ending-lane-specific dialogue
    endingMessages: {
      builder: [
        "You built something. The store runs because of what you put in place.",
        "The techs still talk about you at the ones you left behind.",
      ],
      escape: [
        "You got out. Don't feel guilty about it.",
        "Not everyone makes it to the other side. You did.",
      ],
      climber: [
        "The ladder keeps going. The view changes. The weight doesn't.",
        "They'll say you were ambitious. You know it was more complicated than that.",
      ],
      quiet_pro: [
        "You never made a scene. You just did the work.",
        "The patients never knew how hard it was. That was the point.",
      ],
      martyr: [
        "You gave everything. Some days you wish you hadn't.",
        "They'll never fully understand what it cost you.",
      ],
      burnout_end: [
        "The alarm goes off and you stare at the ceiling.",
        "You were good at it. That was the problem.",
      ],
    },

    decisionComments: {},
  },
};
