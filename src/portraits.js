/**
 * Character portrait sprites (32x32) for dialogue and UI.
 * Stardew Valley style: expressive eyes, pixel outlines, warm skin tones.
 */
const portraitCache = new Map();
function createCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}
function px(ctx, x, y, color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
function rect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
// Draw multiple single pixels of same color
function pxs(ctx, color, coords) {
  ctx.fillStyle = color;
  for (let i = 0; i < coords.length; i += 2) ctx.fillRect(coords[i], coords[i+1], 1, 1);
}

const P = {
  o: '#3a2820', skin: '#e8b88a', skinSh: '#d4a070', white: '#f4f0e8',
  wSh: '#dcd8d0', ew: '#f8f8f0', eb: '#1a1018', mouth: '#8a3030',
  rosy: '#d08878', gray: '#a0a0a8', grayL: '#c0c0c8', hair: '#5a3820',
  hairHi: '#7a5838', badge: '#4a9a5a', red: '#c83030', blond: '#d4a830',
  blondL: '#e8c050', hl: '#f8f8ff',
};

// Common: draw standard head outline for oval face
function headOutline(ctx, o) {
  rect(ctx, 10, 5, 12, 1, o); // top
  rect(ctx, 8, 7, 1, 13, o); rect(ctx, 23, 7, 1, 13, o); // sides
  pxs(ctx, o, [9,6, 22,6, 9,20, 9,21, 22,20, 22,21]); // corners
  rect(ctx, 10, 22, 12, 1, o); // chin
}

// ========== PHARMACIST ==========
function drawPharmacistPortrait(stress) {
  stress = stress || 0;
  const sk = stress < 0.3 ? 0 : stress < 0.6 ? 1 : 2;
  const key = `pharm_${sk}`;
  if (portraitCache.has(key)) return portraitCache.get(key);
  const c = createCanvas(32, 32), ctx = c.getContext('2d'), o = P.o;
  const skin = sk >= 2 ? '#e0a078' : P.skin, skinSh = sk >= 2 ? '#c88860' : P.skinSh;
  // Shoulders + coat
  rect(ctx, 6, 24, 20, 8, P.white);
  rect(ctx, 8, 24, 16, 2, P.wSh);
  pxs(ctx, P.wSh, [14,24, 17,24, 15,25, 16,25]);
  rect(ctx, 5, 24, 1, 8, o); rect(ctx, 26, 24, 1, 8, o); rect(ctx, 6, 31, 20, 1, o);
  rect(ctx, 9, 26, 4, 3, P.badge); rect(ctx, 10, 27, 2, 1, '#60b870');
  // Neck + head
  rect(ctx, 13, 22, 6, 3, skin); rect(ctx, 13, 23, 6, 1, skinSh);
  rect(ctx, 10, 6, 12, 16, skin); rect(ctx, 9, 8, 1, 12, skin); rect(ctx, 22, 8, 1, 12, skin);
  rect(ctx, 10, 19, 12, 2, skinSh);
  headOutline(ctx, o);
  // Hair
  rect(ctx, 9, 3, 14, 4, P.hair); rect(ctx, 8, 5, 1, 4, P.hair); rect(ctx, 23, 5, 1, 4, P.hair);
  pxs(ctx, P.hairHi, [12,3, 13,3, 14,3, 12,4, 13,4, 14,4, 17,4, 18,4]);
  rect(ctx, 9, 2, 14, 1, o); pxs(ctx, o, [8,3, 8,4, 24,3, 24,4, 23,5]);
  // Eyes (Stardew: 4x4 white, 2x2 pupil, highlight)
  rect(ctx, 11, 11, 4, 4, P.ew); rect(ctx, 17, 11, 4, 4, P.ew);
  pxs(ctx, '#405080', [12,12, 13,12, 18,12, 19,12]);
  pxs(ctx, P.eb, [12,13, 13,13, 18,13, 19,13]);
  pxs(ctx, P.hl, [12,11, 19,11]);
  // Nose + ears
  pxs(ctx, skinSh, [15,15, 16,15, 15,16, 9,13, 22,13]);
  pxs(ctx, skin, [9,12, 22,12]);
  // Expression by stress
  if (sk === 0) {
    rect(ctx, 14, 18, 4, 1, P.mouth); pxs(ctx, P.mouth, [13,17, 18,17]);
  } else if (sk === 1) {
    rect(ctx, 13, 18, 6, 1, P.mouth);
    pxs(ctx, o, [11,9, 12,10, 20,9, 19,10]);
  } else {
    rect(ctx, 13, 17, 6, 2, P.mouth); pxs(ctx, P.ew, [14,18, 16,18]);
    pxs(ctx, o, [11,9, 12,9, 19,9, 20,9]);
    px(ctx, 7, 10, '#80b8e0'); px(ctx, 7, 11, '#60a0d0');
  }
  portraitCache.set(key, c); return c;
}

// ========== ELDERLY PATIENT ==========
function drawElderlyPatientPortrait() {
  const key = 'elderly'; if (portraitCache.has(key)) return portraitCache.get(key);
  const c = createCanvas(32, 32), ctx = c.getContext('2d'), o = P.o;
  const skin = '#e0b888', skinSh = '#c8a070';
  // Shoulders - cardigan
  rect(ctx, 6, 25, 20, 7, '#607848');
  rect(ctx, 5, 25, 1, 7, o); rect(ctx, 26, 25, 1, 7, o); rect(ctx, 6, 31, 20, 1, o);
  rect(ctx, 13, 24, 6, 3, '#c8c0a8');
  // Neck + head
  rect(ctx, 13, 22, 6, 3, skin);
  rect(ctx, 10, 7, 12, 15, skin); rect(ctx, 9, 9, 1, 11, skin); rect(ctx, 22, 9, 1, 11, skin);
  rect(ctx, 10, 20, 12, 1, skinSh);
  pxs(ctx, skinSh, [10,14, 21,14, 10,16, 21,16]); // wrinkles
  // Outline
  rect(ctx, 10, 6, 12, 1, o); rect(ctx, 8, 8, 1, 12, o); rect(ctx, 23, 8, 1, 12, o);
  pxs(ctx, o, [9,7, 22,7, 9,20, 9,21, 22,20, 22,21]); rect(ctx, 10, 22, 12, 1, o);
  // Gray hair
  rect(ctx, 9, 4, 14, 4, P.grayL); rect(ctx, 8, 6, 1, 4, P.grayL); rect(ctx, 23, 6, 1, 4, P.grayL);
  rect(ctx, 11, 4, 3, 1, P.white);
  rect(ctx, 9, 3, 14, 1, o); pxs(ctx, o, [8,4, 8,5, 24,4, 24,5]);
  // Glasses + eyes
  rect(ctx, 10, 11, 5, 4, '#607088'); rect(ctx, 11, 12, 3, 2, P.ew);
  rect(ctx, 17, 11, 5, 4, '#607088'); rect(ctx, 18, 12, 3, 2, P.ew);
  rect(ctx, 15, 12, 2, 1, '#607088');
  pxs(ctx, P.eb, [12,12]); pxs(ctx, '#405060', [12,13, 19,13]); px(ctx, 19, 12, P.eb);
  pxs(ctx, P.hl, [13,12, 20,12]);
  // Smile + nose + cheeks
  rect(ctx, 13, 18, 6, 1, P.mouth); pxs(ctx, P.mouth, [12,17, 19,17]);
  pxs(ctx, skinSh, [11,17, 20,17, 15,15, 16,15, 15,16]);
  pxs(ctx, P.rosy, [10,16, 11,16, 20,16, 21,16]);
  portraitCache.set(key, c); return c;
}

// ========== ANGRY CUSTOMER ==========
function drawAngryCustomerPortrait() {
  const key = 'angry'; if (portraitCache.has(key)) return portraitCache.get(key);
  const c = createCanvas(32, 32), ctx = c.getContext('2d'), o = P.o;
  const skin = '#d08060', skinSh = '#b86848';
  // Shoulders - polo
  rect(ctx, 5, 25, 22, 7, '#2858a0');
  rect(ctx, 4, 25, 1, 7, o); rect(ctx, 27, 25, 1, 7, o); rect(ctx, 5, 31, 22, 1, o);
  rect(ctx, 13, 24, 6, 2, '#3068b0');
  // Neck (thick) + head (wider)
  rect(ctx, 12, 22, 8, 3, skin);
  rect(ctx, 9, 7, 14, 15, skin); rect(ctx, 8, 9, 1, 11, skin); rect(ctx, 23, 9, 1, 11, skin);
  rect(ctx, 9, 20, 14, 1, skinSh);
  // Outline (wider jaw)
  rect(ctx, 9, 6, 14, 1, o); rect(ctx, 7, 8, 1, 13, o); rect(ctx, 24, 8, 1, 13, o);
  pxs(ctx, o, [8,7, 23,7, 8,21, 23,21]); rect(ctx, 9, 22, 14, 1, o);
  // Dark short hair
  rect(ctx, 9, 4, 14, 4, '#3a2828'); rect(ctx, 8, 6, 1, 3, '#3a2828'); rect(ctx, 23, 6, 1, 3, '#3a2828');
  rect(ctx, 9, 3, 14, 1, o); pxs(ctx, o, [8,4, 8,5, 24,4, 24,5]);
  // Angry brows (thick V)
  rect(ctx, 10, 9, 4, 1, o); rect(ctx, 18, 9, 4, 1, o);
  pxs(ctx, o, [14,10, 17,10, 10,10, 21,10]);
  // Eyes (narrow, squinting)
  rect(ctx, 11, 12, 4, 3, P.ew); rect(ctx, 17, 12, 4, 3, P.ew);
  rect(ctx, 11, 11, 4, 1, skin); rect(ctx, 17, 11, 4, 1, skin); // squint
  pxs(ctx, '#604020', [12,12, 18,12]);
  pxs(ctx, P.eb, [12,13, 13,13, 18,13, 19,13]);
  // Open yelling mouth
  rect(ctx, 12, 17, 8, 4, P.mouth); rect(ctx, 13, 18, 6, 2, '#501818');
  rect(ctx, 13, 17, 6, 1, P.ew); // teeth
  // Red cheeks + flared nose
  rect(ctx, 8, 15, 2, 2, '#c06050'); rect(ctx, 22, 15, 2, 2, '#c06050');
  pxs(ctx, skinSh, [15,14, 16,14, 14,15, 17,15, 15,15, 16,15]);
  // Anger vein
  pxs(ctx, P.red, [25,5, 26,4, 27,5, 26,6]);
  portraitCache.set(key, c); return c;
}

// ========== KAREN ==========
function drawKarenPortrait() {
  const key = 'karen'; if (portraitCache.has(key)) return portraitCache.get(key);
  const c = createCanvas(32, 32), ctx = c.getContext('2d'), o = P.o;
  const skin = P.skin, skinSh = P.skinSh;
  // Shoulders - blazer
  rect(ctx, 5, 25, 22, 7, '#484058');
  rect(ctx, 4, 25, 1, 7, o); rect(ctx, 27, 25, 1, 7, o); rect(ctx, 5, 31, 22, 1, o);
  rect(ctx, 13, 24, 6, 2, '#e0d0d8');
  // Neck + head
  rect(ctx, 13, 22, 6, 3, skin);
  rect(ctx, 10, 7, 12, 15, skin); rect(ctx, 9, 9, 1, 11, skin); rect(ctx, 22, 9, 1, 11, skin);
  rect(ctx, 10, 19, 12, 2, skinSh);
  headOutline(ctx, o);
  // "The haircut" - asymmetric bob, big volume
  const hc = P.blond, hcL = P.blondL;
  rect(ctx, 7, 1, 18, 7, hc); rect(ctx, 6, 3, 1, 4, hc); rect(ctx, 25, 3, 1, 4, hc);
  rect(ctx, 6, 7, 3, 10, hc); rect(ctx, 5, 8, 1, 8, hc); // long left
  rect(ctx, 23, 7, 2, 5, hc); // short right
  pxs(ctx, hcL, [10,2, 11,2, 12,2, 13,2, 10,3, 11,3, 12,3, 13,3, 18,2, 19,2, 20,2, 18,3, 7,8, 7,9, 7,10]);
  rect(ctx, 7, 0, 18, 1, o);
  pxs(ctx, o, [5,1, 6,1, 26,1, 5,2, 26,2, 4,3, 4,4, 4,5, 4,6, 4,7, 26,3, 26,4, 26,5, 26,6, 26,7]);
  pxs(ctx, o, [4,8, 4,9, 4,10, 4,11, 4,12, 4,13, 4,14, 4,15, 5,16, 6,17, 25,7]);
  // Judgmental half-lidded eyes
  rect(ctx, 11, 12, 4, 3, P.ew); rect(ctx, 17, 12, 4, 3, P.ew);
  rect(ctx, 11, 11, 4, 2, skin); rect(ctx, 17, 11, 4, 2, skin);
  pxs(ctx, P.eb, [12,13, 13,13, 12,14, 18,13, 19,13, 18,14]);
  rect(ctx, 11, 10, 4, 1, o); rect(ctx, 17, 10, 4, 1, o); // thin brows
  // Pursed lips + pointed nose
  rect(ctx, 13, 18, 6, 1, '#b05050');
  pxs(ctx, skinSh, [14,19, 17,19, 15,14, 16,14, 15,15, 16,15, 14,16, 13,17]);
  // Earrings
  pxs(ctx, '#d0a020', [9,14, 22,14]);
  portraitCache.set(key, c); return c;
}

// ========== NICE GRANDMA ==========
function drawNiceGrandmaPortrait() {
  const key = 'grandma'; if (portraitCache.has(key)) return portraitCache.get(key);
  const c = createCanvas(32, 32), ctx = c.getContext('2d'), o = P.o;
  const skin = '#e8c098', skinSh = '#d0a880';
  // Shoulders - floral blouse
  rect(ctx, 6, 25, 20, 7, '#8060a0');
  rect(ctx, 5, 25, 1, 7, o); rect(ctx, 26, 25, 1, 7, o); rect(ctx, 6, 31, 20, 1, o);
  pxs(ctx, '#c090c0', [10,27, 14,28, 20,27, 17,29]); // floral dots
  rect(ctx, 12, 24, 8, 2, '#f0e8e0'); pxs(ctx, '#f0e8e0', [11,25, 20,25]); // lace collar
  // Neck + head
  rect(ctx, 13, 22, 6, 3, skin);
  rect(ctx, 10, 7, 12, 15, skin); rect(ctx, 9, 9, 1, 11, skin); rect(ctx, 22, 9, 1, 11, skin);
  rect(ctx, 10, 19, 12, 2, skinSh);
  headOutline(ctx, o);
  // Hair bun
  rect(ctx, 12, 0, 8, 4, P.grayL); rect(ctx, 13, 0, 6, 1, P.gray);
  pxs(ctx, P.grayL, [11,1, 11,2, 20,1, 20,2]);
  rect(ctx, 9, 4, 14, 4, P.grayL); rect(ctx, 8, 6, 1, 4, P.grayL); rect(ctx, 23, 6, 1, 4, P.grayL);
  rect(ctx, 12, 4, 3, 1, P.white);
  pxs(ctx, o, [12,0, 11,1, 20,1, 10,0, 11,0, 20,0, 21,0]);
  rect(ctx, 12, 0, 8, 1, o); // bun top - fix: overwrite
  pxs(ctx, o, [11,0, 20,0]); // bun corners
  pxs(ctx, o, [8,3, 24,3, 7,5, 7,6, 7,7, 7,8, 7,9, 24,5, 24,6, 24,7]);
  // Warm eyes
  rect(ctx, 11, 11, 4, 4, P.ew); rect(ctx, 17, 11, 4, 4, P.ew);
  pxs(ctx, '#506030', [12,12, 13,12, 12,13, 18,12, 19,12, 18,13]);
  pxs(ctx, '#688040', [12,12, 18,12]); // green iris
  pxs(ctx, P.hl, [12,11, 19,11]);
  pxs(ctx, skinSh, [10,13, 21,13]); // smile lines
  // Big warm smile
  rect(ctx, 13, 17, 6, 1, P.mouth); pxs(ctx, P.mouth, [12,17, 19,17]);
  rect(ctx, 13, 18, 6, 1, '#c06060');
  pxs(ctx, skinSh, [11,16, 20,16, 15,14, 16,14, 15,15, 10,10, 21,10]);
  // Rosy cheeks (prominent)
  rect(ctx, 9, 15, 3, 2, P.rosy); rect(ctx, 20, 15, 3, 2, P.rosy);
  portraitCache.set(key, c); return c;
}

// ========== KID PATIENT ==========
function drawKidPatientPortrait() {
  const key = 'kid'; if (portraitCache.has(key)) return portraitCache.get(key);
  const c = createCanvas(32, 32), ctx = c.getContext('2d'), o = P.o;
  const skin = '#f0c89a', skinSh = '#e0b080';
  // Shoulders - striped tee
  rect(ctx, 8, 26, 16, 6, '#d04040');
  rect(ctx, 8, 28, 16, 1, P.white); rect(ctx, 8, 30, 16, 1, P.white);
  rect(ctx, 7, 26, 1, 6, o); rect(ctx, 24, 26, 1, 6, o); rect(ctx, 8, 31, 16, 1, o);
  // Neck + head (rounder, bigger)
  rect(ctx, 14, 24, 4, 3, skin);
  rect(ctx, 9, 7, 14, 16, skin); rect(ctx, 8, 9, 1, 12, skin); rect(ctx, 23, 9, 1, 12, skin);
  rect(ctx, 10, 6, 12, 1, skin);
  // Outline (rounder)
  rect(ctx, 10, 5, 12, 1, o); rect(ctx, 7, 8, 1, 14, o); rect(ctx, 24, 8, 1, 14, o);
  pxs(ctx, o, [8,7, 9,6, 23,7, 22,6, 8,22, 23,22]); rect(ctx, 9, 23, 14, 1, o);
  // Messy reddish hair
  const hc = '#a05030', hcL = '#c06840';
  rect(ctx, 9, 3, 14, 5, hc); rect(ctx, 8, 5, 1, 4, hc); rect(ctx, 23, 5, 1, 4, hc);
  pxs(ctx, hc, [10,2, 14,2, 19,2, 12,1, 17,1]); // tufts
  rect(ctx, 11, 3, 3, 2, hcL); pxs(ctx, hcL, [18,4, 19,4]);
  pxs(ctx, o, [9,2, 11,1, 12,1, 13,2, 14,2, 16,1, 17,1, 18,2, 19,2, 22,2]);
  pxs(ctx, o, [7,4, 7,5, 7,6, 7,7, 24,4, 24,5, 24,6, 24,7, 8,3, 23,3]);
  // BIG eyes (kid proportions)
  rect(ctx, 10, 11, 5, 5, P.ew); rect(ctx, 17, 11, 5, 5, P.ew);
  rect(ctx, 11, 12, 3, 3, '#305080'); rect(ctx, 18, 12, 3, 3, '#305080');
  rect(ctx, 12, 13, 2, 2, P.eb); rect(ctx, 19, 13, 2, 2, P.eb);
  pxs(ctx, P.hl, [11,11, 12,11, 19,11, 20,11]);
  // Small worried mouth + tiny nose
  rect(ctx, 14, 19, 4, 1, P.mouth); pxs(ctx, skinSh, [13,19, 18,19, 15,17, 16,17]);
  // Runny nose + band-aid
  px(ctx, 16, 18, '#80c880');
  rect(ctx, 20, 16, 4, 2, '#e8c880');
  pxs(ctx, '#d0b068', [21,16, 22,16, 21,17, 22,17]);
  // Rosy cheek + freckles
  pxs(ctx, P.rosy, [10,17, 11,17]);
  pxs(ctx, skinSh, [11,15, 13,16, 19,15, 21,14]);
  portraitCache.set(key, c); return c;
}

export const Portraits = {
  pharmacistPortrait: drawPharmacistPortrait,
  elderlyPatientPortrait: drawElderlyPatientPortrait,
  angryCustomerPortrait: drawAngryCustomerPortrait,
  karenPortrait: drawKarenPortrait,
  niceGrandmaPortrait: drawNiceGrandmaPortrait,
  kidPatientPortrait: drawKidPatientPortrait,
};
