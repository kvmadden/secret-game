// customer-types.js - Customer type definitions with unique behaviors and appearances
// Adds variety to patients like Stardew Valley's diverse villager types

export const CUSTOMER_TYPES = {
  elderly_regular: {
    id: 'elderly_regular',
    name: 'Elderly Regular',
    weight: 15,
    visual: {
      heightMod: -1,
      widthMod: 0,
      hairStyle: 'bald_top',
      hairColorRange: ['#cccccc', '#aaaaaa', '#ffffff'],
      accessory: 'glasses',
      walkSpeed: 0.7,
      posture: 'hunched',
    },
    behavior: {
      patienceMult: 0.6,
      rageMult: 0.8,
      talkative: true,
      consultChance: 0.4,
    },
    barks: [
      "I can't read this label.",
      "Is this the same as my old medicine?",
      "My doctor changed everything.",
      "I've been coming here 30 years.",
      "What happened to the other pharmacist?",
      "Can you open this for me?",
    ],
  },

  angry_parent: {
    id: 'angry_parent',
    name: 'Angry Parent',
    weight: 12,
    visual: {
      heightMod: 0,
      widthMod: 0,
      hairStyle: 'ponytail',
      hairColorRange: ['#5c3317', '#8b4513', '#2c1608'],
      accessory: null,
      walkSpeed: 1.3,
      posture: 'leaning_forward',
    },
    behavior: {
      patienceMult: 0.4,
      rageMult: 1.4,
      talkative: true,
      consultChance: 0.2,
    },
    barks: [
      "My kid is sick in the car.",
      "How much longer? Seriously?",
      "The doctor called this in an hour ago!",
      "I don't have time for this.",
      "Can't you just grab it off the shelf?",
      "I'll go to the other pharmacy next time.",
    ],
  },

  young_professional: {
    id: 'young_professional',
    name: 'Young Professional',
    weight: 10,
    visual: {
      heightMod: 1,
      widthMod: 0,
      hairStyle: 'neat_short',
      hairColorRange: ['#1a1a1a', '#3b2f2f', '#4a3728'],
      accessory: 'phone_in_hand',
      walkSpeed: 1.2,
      posture: 'upright',
    },
    behavior: {
      patienceMult: 0.5,
      rageMult: 1.1,
      talkative: false,
      consultChance: 0.1,
    },
    barks: [
      "I'm on my lunch break.",
      "Can I pay with Apple Pay?",
      "Just text me when it's ready.",
      "Is there an app for refills?",
      "I have a meeting in 20 minutes.",
      "Do you do delivery?",
    ],
  },

  college_student: {
    id: 'college_student',
    name: 'College Student',
    weight: 8,
    visual: {
      heightMod: 0,
      widthMod: -1,
      hairStyle: 'messy',
      hairColorRange: ['#3b2f2f', '#1a1a1a', '#c2185b', '#1565c0'],
      accessory: 'backpack',
      walkSpeed: 1.0,
      posture: 'slouched',
    },
    behavior: {
      patienceMult: 0.8,
      rageMult: 0.6,
      talkative: false,
      consultChance: 0.5,
    },
    barks: [
      "This is my first time picking up a prescription.",
      "Do I need my insurance card?",
      "My mom usually does this...",
      "How much is this gonna cost?",
      "Wait, I need to call my parents.",
      "Is there a generic version?",
      "I don't understand the copay thing.",
    ],
  },

  chronic_patient: {
    id: 'chronic_patient',
    name: 'Chronic Patient',
    weight: 14,
    visual: {
      heightMod: 0,
      widthMod: 1,
      hairStyle: 'short_practical',
      hairColorRange: ['#5c3317', '#8b4513', '#3b2f2f', '#999999'],
      accessory: 'pill_organizer',
      walkSpeed: 0.9,
      posture: 'normal',
    },
    behavior: {
      patienceMult: 1.2,
      rageMult: 0.7,
      talkative: false,
      consultChance: 0.15,
    },
    barks: [
      "Same thing as last month.",
      "The refill should be ready.",
      "You already have my info on file.",
      "I take seven medications. I know the drill.",
      "Is the manufacturer the same this time?",
      "Don't forget the test strips.",
    ],
  },

  karen: {
    id: 'karen',
    name: 'Karen',
    weight: 6,
    visual: {
      heightMod: 0,
      widthMod: 1,
      hairStyle: 'big_blowout',
      hairColorRange: ['#daa520', '#f5deb3', '#e8c56d'],
      accessory: 'large_sunglasses_on_head',
      walkSpeed: 1.1,
      posture: 'chest_out',
    },
    behavior: {
      patienceMult: 0.2,
      rageMult: 2.0,
      talkative: true,
      consultChance: 0.3,
    },
    barks: [
      "I want to speak to the manager.",
      "This is unacceptable.",
      "I've been waiting for FIVE minutes.",
      "The other pharmacy never makes me wait.",
      "I'm calling corporate.",
      "Do you even know who I am?",
      "I want your name and employee number.",
      "This will be on Yelp.",
    ],
  },

  nice_grandma: {
    id: 'nice_grandma',
    name: 'Nice Grandma',
    weight: 10,
    visual: {
      heightMod: -2,
      widthMod: 1,
      hairStyle: 'curly_perm',
      hairColorRange: ['#d8d8d8', '#c0c0c0', '#e8dff5'],
      accessory: 'handbag',
      walkSpeed: 0.6,
      posture: 'hunched',
    },
    behavior: {
      patienceMult: 2.0,
      rageMult: 0.1,
      talkative: true,
      consultChance: 0.2,
    },
    barks: [
      "Take your time, dear.",
      "You all work so hard here.",
      "I brought cookies for the staff!",
      "You remind me of my grandchild.",
      "What a lovely pharmacy.",
      "I'm in no rush, sweetie.",
    ],
  },

  hypochondriac: {
    id: 'hypochondriac',
    name: 'Hypochondriac',
    weight: 7,
    visual: {
      heightMod: 0,
      widthMod: 0,
      hairStyle: 'thinning',
      hairColorRange: ['#5c3317', '#3b2f2f', '#8b4513'],
      accessory: 'face_mask',
      walkSpeed: 0.9,
      posture: 'tense',
    },
    behavior: {
      patienceMult: 0.9,
      rageMult: 0.5,
      talkative: true,
      consultChance: 0.8,
    },
    barks: [
      "What are ALL the side effects?",
      "I read online that this causes...",
      "Can this interact with vitamins?",
      "I think I'm having a reaction already.",
      "Is this the one that was recalled?",
      "Should I be worried about this rash?",
      "My WebMD search says...",
    ],
  },

  tech_savvy: {
    id: 'tech_savvy',
    name: 'Tech Savvy',
    weight: 8,
    visual: {
      heightMod: 0,
      widthMod: 0,
      hairStyle: 'undercut',
      hairColorRange: ['#1a1a1a', '#3b2f2f'],
      accessory: 'smartwatch',
      walkSpeed: 1.1,
      posture: 'upright',
    },
    behavior: {
      patienceMult: 0.6,
      rageMult: 1.0,
      talkative: true,
      consultChance: 0.25,
    },
    barks: [
      "The app says it's ready.",
      "I got a notification 10 minutes ago.",
      "Can you scan this QR code?",
      "Your website shows it in stock.",
      "I already entered my info online.",
      "Why can't I just order this on Amazon?",
      "My health tracker says I need this.",
    ],
  },

  new_parent: {
    id: 'new_parent',
    name: 'New Parent',
    weight: 8,
    visual: {
      heightMod: 0,
      widthMod: 0,
      hairStyle: 'disheveled',
      hairColorRange: ['#5c3317', '#8b4513', '#3b2f2f'],
      accessory: 'baby_carrier',
      walkSpeed: 0.8,
      posture: 'tired_lean',
    },
    behavior: {
      patienceMult: 0.7,
      rageMult: 0.9,
      talkative: true,
      consultChance: 0.6,
    },
    barks: [
      "Is this safe for a 3-month-old?",
      "The pediatrician said to come here.",
      "I haven't slept in days.",
      "Can you double-check the dosage?",
      "Do you have the dye-free version?",
      "She won't stop crying...",
      "What's the infant dose for this?",
    ],
  },

  athlete: {
    id: 'athlete',
    name: 'Athlete',
    weight: 5,
    visual: {
      heightMod: 2,
      widthMod: 1,
      hairStyle: 'buzz_cut',
      hairColorRange: ['#1a1a1a', '#5c3317', '#daa520'],
      accessory: 'headband',
      walkSpeed: 1.4,
      posture: 'upright',
    },
    behavior: {
      patienceMult: 0.5,
      rageMult: 0.9,
      talkative: false,
      consultChance: 0.3,
    },
    barks: [
      "I have practice in 30 minutes.",
      "Is this banned by the NCAA?",
      "Got anything for muscle recovery?",
      "Where's the protein powder?",
      "Will this make me drowsy before a game?",
      "I need the sports tape too.",
    ],
  },

  snowbird: {
    id: 'snowbird',
    name: 'Snowbird',
    weight: 5,
    visual: {
      heightMod: -1,
      widthMod: 0,
      hairStyle: 'short_styled',
      hairColorRange: ['#c0c0c0', '#d8d8d8', '#ffffff'],
      accessory: 'sun_hat',
      walkSpeed: 0.8,
      posture: 'normal',
    },
    behavior: {
      patienceMult: 0.7,
      rageMult: 1.1,
      talkative: true,
      consultChance: 0.35,
    },
    barks: [
      "I need to transfer from my pharmacy up north.",
      "Here's my insurance from another state.",
      "We just got into town last week.",
      "My doctor is in Michigan, is that a problem?",
      "The pharmacy back home does it differently.",
      "I only need enough for three months.",
      "Can you call my regular pharmacy?",
    ],
  },

  nurse_offduty: {
    id: 'nurse_offduty',
    name: 'Off-Duty Nurse',
    weight: 6,
    visual: {
      heightMod: 0,
      widthMod: 0,
      hairStyle: 'pulled_back',
      hairColorRange: ['#5c3317', '#1a1a1a', '#8b4513', '#daa520'],
      accessory: 'scrubs',
      walkSpeed: 1.0,
      posture: 'upright',
    },
    behavior: {
      patienceMult: 1.0,
      rageMult: 1.3,
      talkative: true,
      consultChance: 0.1,
    },
    barks: [
      "I know what this is for, just fill it.",
      "The doctor wrote the wrong dose.",
      "I work at the hospital down the street.",
      "Shouldn't that be the extended release?",
      "I can read the NDC if that helps.",
      "That interaction flag is clinically irrelevant.",
    ],
  },

  homeless_person: {
    id: 'homeless_person',
    name: 'Homeless Person',
    weight: 4,
    visual: {
      heightMod: 0,
      widthMod: -1,
      hairStyle: 'unkempt_long',
      hairColorRange: ['#5c3317', '#3b2f2f', '#8b4513'],
      accessory: 'worn_jacket',
      walkSpeed: 0.7,
      posture: 'hunched',
    },
    behavior: {
      patienceMult: 2.0,
      rageMult: 0.2,
      talkative: false,
      consultChance: 0.15,
    },
    barks: [
      "Is there a discount program?",
      "I lost my insurance card.",
      "Thank you for helping me.",
      "I just need this one.",
      "The clinic sent me here.",
      "I'll wait. I'm not in a hurry.",
    ],
  },

  vip_regular: {
    id: 'vip_regular',
    name: 'VIP Regular',
    weight: 5,
    visual: {
      heightMod: 1,
      widthMod: 1,
      hairStyle: 'slicked_back',
      hairColorRange: ['#3b2f2f', '#1a1a1a', '#555555'],
      accessory: 'expensive_watch',
      walkSpeed: 1.0,
      posture: 'chest_out',
    },
    behavior: {
      patienceMult: 0.3,
      rageMult: 1.8,
      talkative: true,
      consultChance: 0.1,
    },
    barks: [
      "The owner knows me personally.",
      "I expect this to be ready when I arrive.",
      "I spend a lot of money here.",
      "Don't you know who I am?",
      "I shouldn't have to wait in line.",
      "Get me someone who can actually help.",
      "I'll have a word with management.",
    ],
  },

  delivery_driver: {
    id: 'delivery_driver',
    name: 'Delivery Driver',
    weight: 6,
    visual: {
      heightMod: 0,
      widthMod: 0,
      hairStyle: 'cap_hair',
      hairColorRange: ['#3b2f2f', '#1a1a1a', '#5c3317'],
      accessory: 'baseball_cap',
      walkSpeed: 1.5,
      posture: 'leaning_forward',
    },
    behavior: {
      patienceMult: 0.3,
      rageMult: 1.2,
      talkative: false,
      consultChance: 0.05,
    },
    barks: [
      "I'm double-parked outside.",
      "I got 12 more stops today.",
      "Drive-thru, in and out.",
      "Just the pickup, nothing else.",
      "My route is already behind.",
      "Can I get a bag? I'm on a bike.",
    ],
  },

  caregiver: {
    id: 'caregiver',
    name: 'Caregiver',
    weight: 8,
    visual: {
      heightMod: 0,
      widthMod: 0,
      hairStyle: 'practical_bob',
      hairColorRange: ['#5c3317', '#8b4513', '#3b2f2f', '#999999'],
      accessory: 'tote_bag',
      walkSpeed: 0.9,
      posture: 'tired_lean',
    },
    behavior: {
      patienceMult: 1.3,
      rageMult: 0.6,
      talkative: true,
      consultChance: 0.45,
    },
    barks: [
      "I'm picking up for my mother.",
      "She takes five different medications.",
      "Can you print the instructions larger?",
      "He doesn't remember what he's on.",
      "I have three pickups under different names.",
      "Is this one the morning pill or the night one?",
      "I'm sorry, I have a list somewhere...",
    ],
  },
};

// Pre-compute total weight for weighted random selection
const _typeList = Object.values(CUSTOMER_TYPES);
const _totalWeight = _typeList.reduce((sum, t) => sum + t.weight, 0);

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Returns a function that produces deterministic floats in [0, 1).
 */
function _seededRandom(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a customer type based on weighted random selection.
 * @param {number} seed - Integer seed for deterministic selection
 * @returns {object} A customer type definition from CUSTOMER_TYPES
 */
export function getRandomCustomerType(seed) {
  const rng = _seededRandom(seed);
  const roll = rng() * _totalWeight;

  let cumulative = 0;
  for (let i = 0; i < _typeList.length; i++) {
    cumulative += _typeList[i].weight;
    if (roll < cumulative) {
      return _typeList[i];
    }
  }

  // Fallback (should not happen, but safety net)
  return _typeList[_typeList.length - 1];
}

/**
 * Returns flattened gameplay modifiers for a customer type.
 * @param {object|string} type - A customer type object or type id string
 * @returns {{ patienceMult: number, rageMult: number, walkSpeed: number, consultChance: number }}
 */
export function getCustomerModifiers(type) {
  const resolved = typeof type === 'string' ? CUSTOMER_TYPES[type] : type;

  if (!resolved) {
    // Return neutral defaults for unknown types
    return {
      patienceMult: 1.0,
      rageMult: 1.0,
      walkSpeed: 1.0,
      consultChance: 0.2,
    };
  }

  return {
    patienceMult: resolved.behavior.patienceMult,
    rageMult: resolved.behavior.rageMult,
    walkSpeed: resolved.visual.walkSpeed,
    consultChance: resolved.behavior.consultChance,
  };
}
