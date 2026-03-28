// Field leader/supervisor archetypes for the campaign
// Each chapter has a distinct leader personality that changes the pressure dynamic

export const FIELD_LEADERS = {
  cheerleader: {
    id: 'cheerleader',
    name: 'Sarah Mitchell',
    title: 'The Cheerleader',
    personality: 'Warm, upbeat, encouraging. Says all the right things. Solves nothing directly.',
    chapter: 'ch1',
    dialogue: {
      greeting: [
        "Welcome to the team! We're so excited to have you!",
        "You're going to do great, I can feel it!",
        "This is going to be a wonderful journey!",
      ],
      checkIn: [
        "How's everything going? You look like you've got this!",
        "Just checking in — you're doing amazing!",
        "Need anything? I'm always just a call away!",
      ],
      praise: [
        "See? I knew you could handle it!",
        "That's the kind of initiative we love to see!",
        "You're a natural!",
      ],
      pressure: [
        "Every day is a learning opportunity!",
        "I believe in you — you've got the tools!",
        "Just keep that positive energy flowing!",
      ],
      crisis: [
        "Challenges make us stronger!",
        "I know this is tough, but I've seen you handle tough!",
        "We'll debrief after — you've got this right now!",
      ],
      farewell: [
        "Amazing first chapter! I'm so proud of your growth!",
        "You're ready for the next step — I just know it!",
        "Keep that energy! The team needs people like you!",
      ],
    },
    behaviorModifiers: { scrutinyMod: -0.1, moraleMod: 0.1, helpfulness: 0.2 },
    visualHint: 'Bright smile, clipboard, company polo, lanyard with too many badges',
  },

  ghost: {
    id: 'ghost',
    name: 'Mark Reynolds',
    title: 'The Ghost',
    personality: 'Absent. Hard to reach. Unreliable when help is needed. Visible later when asking what went wrong.',
    chapter: 'ch2',
    dialogue: {
      greeting: [
        "Hey — sorry, running to a meeting. We'll connect later.",
        "Good to meet you. I'll send you my number. [never does]",
        "Welcome aboard. Gotta run — call if you need anything.",
      ],
      checkIn: [
        "Sorry I missed your call — what did you need?",
        "Hey, just seeing this now. Everything okay?",
        "My schedule's been crazy. How'd it go?",
      ],
      praise: [
        "Heard good things. Keep it up.",
        "Sounds like you handled that well.",
        "Nice work — sorry I wasn't around for it.",
      ],
      pressure: [
        "I'll try to swing by tomorrow.",
        "Let me look into that and get back to you.",
        "I'm sure you'll figure it out — you're resourceful.",
      ],
      crisis: [
        "[voicemail] Hey, it's Mark. Call me back when you can.",
        "Just saw your messages. What happened?",
        "I wish I'd been there. What do you need now?",
      ],
      farewell: [
        "You really held it down out there. Sorry I couldn't be more present.",
        "I owe you one. Seriously.",
        "Let's get coffee sometime and catch up. [never happens]",
      ],
    },
    behaviorModifiers: { scrutinyMod: 0.0, moraleMod: -0.1, helpfulness: 0.05 },
    visualHint: 'Always in motion, phone to ear, half-turned away, slightly rumpled',
  },

  fake_helper: {
    id: 'fake_helper',
    name: 'Dana Prescott',
    title: 'The Fake Helper',
    personality: 'Appears supportive. Asks if you need anything. Then stands in the way, asks questions, or adds interruptions.',
    chapter: 'ch3',
    dialogue: {
      greeting: [
        "I'm here for you — whatever you need, just ask!",
        "I want to make sure you feel supported today.",
        "Let me know how I can help. I mean it!",
      ],
      checkIn: [
        "How are you doing? Also, can you pull those reports when you get a sec?",
        "Just observing your workflow — don't mind me!",
        "I noticed you do [thing] differently. Have you tried it this way?",
      ],
      praise: [
        "Great job today! I think my being here really helped.",
        "See? Having support makes all the difference!",
        "I'll mention how well things went in my report.",
      ],
      pressure: [
        "I hate to add to your plate, but since I'm here...",
        "One more thing — it'll only take a minute.",
        "While you're at it, can you also...?",
      ],
      crisis: [
        "I'm going to step back and let you handle this — you're the expert!",
        "I'd help but I don't want to get in the way.",
        "Should I call someone? Actually, you probably know better than me.",
      ],
      farewell: [
        "I think we made a great team today!",
        "I'll put in a good word. This visit was really productive.",
        "Same time next month? I think regular check-ins are so valuable.",
      ],
    },
    behaviorModifiers: { scrutinyMod: 0.15, moraleMod: -0.05, helpfulness: 0.1 },
    visualHint: 'Professional smile, notepad, stands too close, nods too much',
  },

  rescuer_user: {
    id: 'rescuer_user',
    name: 'James Whitfield',
    title: 'The Rescuer-User',
    personality: 'Genuinely trusts you. That trust becomes the problem. You get used because you can handle it.',
    chapter: 'ch4',
    dialogue: {
      greeting: [
        "I'm putting you here because you're my best. I trust you.",
        "I know this is a lot to ask, but you're the one I count on.",
        "Thank you for doing this. It means more than you know.",
      ],
      checkIn: [
        "How are you holding up? I know I keep asking a lot.",
        "You always make it look easy. That's why I lean on you.",
        "I appreciate you more than I can express.",
      ],
      praise: [
        "You're the reason this district runs.",
        "I don't know what I'd do without you. Honestly.",
        "Every time I need someone reliable, your name comes up first.",
      ],
      pressure: [
        "I know you can handle this. That's not flattery — it's fact.",
        "One more thing — and I hate to ask — but you're the only one who can.",
        "I wouldn't ask if there was anyone else. There isn't.",
      ],
      crisis: [
        "I'm sorry. I should have planned better. Can you hold it together?",
        "This is my fault, not yours. But I need you right now.",
        "After this, I promise we'll get you some relief. I mean it this time.",
      ],
      farewell: [
        "You carried us. I won't forget that.",
        "I owe you a real break. Let me see what I can do.",
        "You're the kind of pharmacist this company doesn't deserve.",
      ],
    },
    behaviorModifiers: { scrutinyMod: -0.05, moraleMod: 0.05, helpfulness: 0.3 },
    visualHint: 'Tired eyes, genuine warmth, always asking for one more thing',
  },

  metrics_hawk: {
    id: 'metrics_hawk',
    name: 'Kevin Park',
    title: 'The Metrics Hawk',
    personality: 'Labor. Wait time. Vaccines. Throughput. Optics. Scorecards. Everything is a number.',
    chapter: 'ch5',
    dialogue: {
      greeting: [
        "Let's look at your numbers from last week.",
        "I pulled your scorecard. We need to talk about wait times.",
        "Good morning. Your vaccine throughput is behind target.",
      ],
      checkIn: [
        "Your wait time is averaging 14 minutes. Target is 10.",
        "How many vaccines today? We need 8 more to hit monthly.",
        "Labor is trending 3% over. Where can we cut?",
      ],
      praise: [
        "Your numbers improved 12% this quarter. Nice work.",
        "Store 47 is using your workflow as a model. Good job.",
        "Throughput is up. Keep that trajectory.",
      ],
      pressure: [
        "District is watching these numbers closely.",
        "We can't afford to miss target two months in a row.",
        "I need your action plan by end of day.",
      ],
      crisis: [
        "What happened to your metrics today?",
        "I need an explanation for these numbers.",
        "This is going in my report. What's the recovery plan?",
      ],
      farewell: [
        "Solid quarter. Let's push for top 3 in the district next time.",
        "I'll share your numbers with regional. They'll be pleased.",
        "Numbers don't lie. You're trending in the right direction.",
      ],
    },
    behaviorModifiers: { scrutinyMod: 0.2, moraleMod: -0.1, helpfulness: 0.15 },
    visualHint: 'Tablet in hand, graphs on screen, pressed shirt, efficiency personified',
  },

  polished_visitor: {
    id: 'polished_visitor',
    name: 'Victoria Chen',
    title: 'The Polished Visitor',
    personality: 'Executive. Composed. Image-aware. Feels corporate and appearance-sensitive.',
    chapter: 'ch6',
    dialogue: {
      greeting: [
        "The regional team is very excited about your potential.",
        "I've heard great things. Let's see what we're working with.",
        "Thank you for making time. I know you're busy.",
      ],
      checkIn: [
        "How's the team culture here? That's important to us.",
        "Walk me through your patient experience strategy.",
        "What's your vision for this store's growth?",
      ],
      praise: [
        "Very impressive operation. I'll mention this to regional.",
        "You have a real presence. People respond to that.",
        "This is exactly the kind of leadership we're developing.",
      ],
      pressure: [
        "The optics on this need to be right.",
        "Regional is watching. Let's make sure we're camera-ready.",
        "Perception matters as much as performance at this level.",
      ],
      crisis: [
        "Let's not let this define the narrative.",
        "We need to control the story here.",
        "I'll handle the messaging. You handle the operations.",
      ],
      farewell: [
        "Let's debrief on the optics next week.",
        "You're on the radar now. That's a good thing. Usually.",
        "I'll be recommending you for the development track.",
      ],
    },
    behaviorModifiers: { scrutinyMod: 0.25, moraleMod: -0.05, helpfulness: 0.1 },
    visualHint: 'Blazer, heels, perfect posture, never wrinkled, always composed',
  },

  ladder_climber: {
    id: 'ladder_climber',
    name: 'Derek Morrison',
    title: 'The Ladder Climber',
    personality: 'Filters everything through visibility and upward impression. Politics and optics-heavy.',
    chapter: 'ch6',
    dialogue: {
      greeting: [
        "I want to align on messaging before the regional visit.",
        "Let's make sure we're telling the right story with our numbers.",
        "I'm building a case for our district. I need wins.",
      ],
      checkIn: [
        "How does this look from the outside?",
        "Is there anything we should... reframe before the report?",
        "I need you to make me look good on this one. Us. Make us look good.",
      ],
      praise: [
        "That played well with regional. Nice work.",
        "I mentioned your name in the leadership call. You're welcome.",
        "Keep performing like this and doors will open. For both of us.",
      ],
      pressure: [
        "I can't have surprises right now. Not with my review coming.",
        "Let's keep the narrative clean.",
        "Visibility cuts both ways. Right now, everyone's watching.",
      ],
      crisis: [
        "We need to contain this before it reaches the VP.",
        "Who knows about this? Let's keep the circle small.",
        "I'll frame the narrative. You fix the problem.",
      ],
      farewell: [
        "Good quarter. I'll make sure the right people know your name.",
        "We're a good team. I see big things ahead. For both of us.",
        "Stay visible. Stay clean. The rest takes care of itself.",
      ],
    },
    behaviorModifiers: { scrutinyMod: 0.2, moraleMod: -0.1, helpfulness: 0.05 },
    visualHint: 'Always camera-ready, strategic handshake, eyes on the next rung',
  },

  competent_unicorn: {
    id: 'competent_unicorn',
    name: 'Dr. Rachel Torres',
    title: 'The Competent Unicorn',
    personality: 'Rare. Actually understands pharmacy. Can help in the right ways. Used sparingly so it feels special.',
    chapter: 'special',
    dialogue: {
      greeting: [
        "I worked the bench for 15 years before this desk. What do you need?",
        "I remember what it's like. Tell me what's actually happening.",
        "Skip the corporate talk. What's broken?",
      ],
      checkIn: [
        "How's your tech support? Are they actually trained?",
        "Are you eating? Drinking water? Taking your breaks?",
        "What's the one thing that would actually help right now?",
      ],
      praise: [
        "You're doing it right. That matters more than the numbers say.",
        "I wish more pharmacists had your instincts.",
        "The patients are lucky to have you. Don't forget that.",
      ],
      pressure: [
        "I know the metrics don't reflect reality. I'm trying to change that.",
        "Do what's right for the patient. I'll handle the politics.",
        "You shouldn't have to choose between safety and speed. But today you might.",
      ],
      crisis: [
        "I'm here. What do you need me to do?",
        "Let me take the phones. You focus on the bench.",
        "I'll call the doctor myself. You handle the patient.",
      ],
      farewell: [
        "You remind me why I got into this. Thank you.",
        "If you ever need someone who actually gets it, call me.",
        "Take care of yourself. The bench will always need more. You won't always have more to give.",
      ],
    },
    behaviorModifiers: { scrutinyMod: -0.15, moraleMod: 0.2, helpfulness: 0.8 },
    visualHint: 'Comfortable shoes, reading glasses, actually helps, slightly tired eyes that have seen everything',
  },
};
