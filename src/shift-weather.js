// shift-weather.js - Weather assignment and effects for campaign shifts

const WEATHER_EFFECTS = {
  clear:    { meterMods: {} },
  cloudy:   { meterMods: {} },
  overcast: { meterMods: {} },
  drizzle:  { meterMods: { queue: 1, burnout: 1 } },
  rain:     { meterMods: { queue: 2 } },
  storm:    { meterMods: { rage: 3, burnout: 2 } },
  hot:      { meterMods: { burnout: 2, rage: 2 } },
  cold:     { meterMods: { queue: -2, burnout: 1 } },
  snow:     { meterMods: { queue: -3, burnout: 1 } },
  fog:      { meterMods: { queue: -1 } },
};

const WEATHER_DESCRIPTIONS = {
  clear:    'Bright and clear outside — a beautiful day.',
  cloudy:   'Overcast skies with clouds rolling in.',
  overcast: 'A flat gray sky presses down on everything.',
  drizzle:  'A light drizzle mists the windows.',
  rain:     'Steady rain drums against the building.',
  storm:    'A storm rages outside — thunder rattles the shelves.',
  hot:      'Oppressive heat shimmers off the parking lot.',
  cold:     'Bitter cold keeps most people indoors.',
  snow:     'Snow blankets everything in muffled silence.',
  fog:      'Thick fog erases the world beyond the doors.',
};

const SHIFT_WEATHER = {
  // Chapter 1
  c1_shadow_day: {
    type: 'clear', intensity: 0.2,
    effects: WEATHER_EFFECTS.clear,
    visualHint: 'warm-sunlight', ambientSound: 'birds-gentle',
  },
  c1_solo_sunday: {
    type: 'cloudy', intensity: 0.4,
    effects: WEATHER_EFFECTS.cloudy,
    visualHint: 'dim-overcast', ambientSound: 'wind-light',
  },
  c1_thrown_in: {
    type: 'rain', intensity: 0.7,
    effects: WEATHER_EFFECTS.rain,
    visualHint: 'rain-streaks', ambientSound: 'rain-steady',
  },
  // Chapter 2
  c2_bad_handoff: {
    type: 'overcast', intensity: 0.5,
    effects: WEATHER_EFFECTS.overcast,
    visualHint: 'flat-gray', ambientSound: 'hum-fluorescent',
  },
  c2_different_bench: {
    type: 'hot', intensity: 0.8,
    effects: WEATHER_EFFECTS.hot,
    visualHint: 'heat-haze', ambientSound: 'ac-straining',
  },
  c2_overnight: {
    type: 'fog', intensity: 0.9,
    effects: WEATHER_EFFECTS.fog,
    visualHint: 'fog-glow', ambientSound: 'fog-muffled',
  },
  // Chapter 3
  c3_since_youre_here: {
    type: 'clear', intensity: 0.1,
    effects: WEATHER_EFFECTS.clear,
    visualHint: 'bright-ironic', ambientSound: 'birds-cheerful',
  },
  c3_cant_be_rude: {
    type: 'drizzle', intensity: 0.4,
    effects: WEATHER_EFFECTS.drizzle,
    visualHint: 'mist-windows', ambientSound: 'drizzle-soft',
  },
  c3_surprise_visit: {
    type: 'storm', intensity: 1.0,
    effects: WEATHER_EFFECTS.storm,
    visualHint: 'lightning-flicker', ambientSound: 'thunder-rolling',
  },
  // Chapter 4
  c4_can_you_stay: {
    type: 'rain', intensity: 0.6,
    effects: WEATHER_EFFECTS.rain,
    visualHint: 'rain-window-longing', ambientSound: 'rain-heavy',
  },
  c4_no_relief: {
    type: 'storm', intensity: 0.9,
    effects: WEATHER_EFFECTS.storm,
    visualHint: 'storm-endurance', ambientSound: 'storm-relentless',
  },
  c4_cover_once: {
    type: 'cold', intensity: 0.7,
    effects: WEATHER_EFFECTS.cold,
    visualHint: 'frost-edges', ambientSound: 'wind-hollow',
  },
  // Chapter 5
  c5_first_week_pic: {
    type: 'clear', intensity: 0.3,
    effects: WEATHER_EFFECTS.clear,
    visualHint: 'morning-light', ambientSound: 'morning-calm',
  },
  c5_new_hire: {
    type: 'cloudy', intensity: 0.4,
    effects: WEATHER_EFFECTS.cloudy,
    visualHint: 'uncertain-sky', ambientSound: 'wind-shifting',
  },
  c5_offsite_clinic: {
    type: 'hot', intensity: 0.9,
    effects: WEATHER_EFFECTS.hot,
    visualHint: 'tent-swelter', ambientSound: 'fans-struggling',
  },
  // Chapter 6
  c6_problem_store: {
    type: 'storm', intensity: 1.0,
    effects: WEATHER_EFFECTS.storm,
    visualHint: 'storm-chaos', ambientSound: 'thunder-constant',
  },
  c6_visit_never_comes: {
    type: 'clear', intensity: 0.1,
    effects: WEATHER_EFFECTS.clear,
    visualHint: 'wasted-sunshine', ambientSound: 'birds-mocking',
  },
  c6_district_resource: {
    type: 'overcast', intensity: 0.6,
    effects: WEATHER_EFFECTS.overcast,
    visualHint: 'corporate-gray', ambientSound: 'hvac-drone',
  },
  // Chapter 7
  c7_hold_it_together: {
    type: 'storm', intensity: 1.0,
    effects: WEATHER_EFFECTS.storm,
    visualHint: 'storm-final', ambientSound: 'storm-peak',
  },
  c7_bigger_table: {
    type: 'clear', intensity: 0.2,
    effects: WEATHER_EFFECTS.clear,
    visualHint: 'open-sky', ambientSound: 'breeze-gentle',
  },
  c7_last_day: {
    type: 'clear', intensity: 0.3,
    effects: WEATHER_EFFECTS.clear,
    visualHint: 'golden-hour', ambientSound: 'quiet-warmth',
  },
  c7_just_the_work: {
    type: 'cloudy', intensity: 0.5,
    effects: WEATHER_EFFECTS.cloudy,
    visualHint: 'neutral-sky', ambientSound: 'ambient-hum',
  },
  c7_last_straw: {
    type: 'storm', intensity: 1.0,
    effects: WEATHER_EFFECTS.storm,
    visualHint: 'storm-breaking', ambientSound: 'thunder-crack',
  },
  c7_one_more_time: {
    type: 'rain', intensity: 0.5,
    effects: WEATHER_EFFECTS.rain,
    visualHint: 'rain-farewell', ambientSound: 'rain-gentle',
  },
};

function getWeatherForShift(shiftId) {
  return SHIFT_WEATHER[shiftId] || {
    type: 'clear', intensity: 0,
    effects: WEATHER_EFFECTS.clear,
    visualHint: 'default', ambientSound: 'silence',
  };
}

function getWeatherEffects(weatherType) {
  const entry = WEATHER_EFFECTS[weatherType];
  return entry ? { ...entry.meterMods } : {};
}

function getWeatherDescription(weatherType) {
  return WEATHER_DESCRIPTIONS[weatherType] || 'The weather is unremarkable.';
}

export {
  SHIFT_WEATHER,
  getWeatherForShift,
  getWeatherEffects,
  getWeatherDescription,
};
