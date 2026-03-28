/**
 * Pixel art sprite drawing - all sprites drawn programmatically on canvas.
 * Sprites use a 16x16 base grid, rendered at configurable scale.
 */

import { PATIENT_PALETTES } from './constants.js';

// Cache for pre-rendered sprites
const spriteCache = new Map();

function getCacheKey(name, ...args) {
  return `${name}_${args.join('_')}`;
}

function createSpriteCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Helper: draw a pixel (1x1 at sprite scale)
function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

// Helper: fill rect in pixel coords
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// ========== PHARMACIST SPRITE (16x16) ==========
// Stardew Valley quality: 6 walk frames, 10+ colors, stress states, idle breathing/blink
function drawPharmacistFrame(facing, frame, stress, time) {
  // stress: 0-1, affects visual appearance
  // time: animation clock for idle blink/breathing (optional)
  const stressLevel = stress < 0.3 ? 0 : stress < 0.5 ? 1 : stress < 0.7 ? 2 : 3;
  const t = time || 0;
  // Blink: eyes closed for ~0.15s every ~3s
  const blinkCycle = t % 3.0;
  const isBlinking = (frame === 0 && blinkCycle > 2.85);
  // Breathing for idle: chest expand on sine cycle (~2s period)
  const breathPhase = Math.sin(t * Math.PI);
  const isIdle = (frame === 0);
  const breathExpand = isIdle ? (breathPhase > 0.7 ? 1 : 0) : 0;

  // Quantize blink and breath for caching
  const blinkKey = isBlinking ? 1 : 0;
  const breathKey = breathExpand;
  const key = getCacheKey('pharmacist', facing, frame, stressLevel, blinkKey, breathKey);
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  const flip = facing === 'left';

  // === PALETTE (12 colors) ===
  const skinBase = stressLevel >= 3 ? '#e8a078' : '#e8b88a';  // reddened at high stress
  const skinShadow = stressLevel >= 3 ? '#d08868' : '#d4a070';
  const hairBase = '#5a3820';
  const hairHighlight = '#7a5838';
  const coatBase = stressLevel >= 3 ? '#e8e4dc' : '#f4f0e8';
  const coatHighlight = '#faf8f2';
  const coatShadow = stressLevel >= 3 ? '#ccc8c0' : '#dcd8d0';
  const pantsBase = '#3a3a4a';
  const pantsShadow = '#2c2c3a';
  const shoeColor = '#22180e';
  const badgeGreen = '#4a9a5a';
  const badgeLight = '#60b870';
  const outline = '#3a2820';

  // Mid-stride frames get head bob (0.5px up) and hip sway (1px)
  const isMidStride = (frame === 2 || frame === 5);
  const headBob = isMidStride ? -0.5 : 0;
  // Hip sway: shift body 1px on extended frames
  const hipSway = isMidStride ? (frame === 2 ? (flip ? -1 : 1) : (flip ? 1 : -1)) : 0;

  // Stress posture: shoulders raised 1px at medium+ stress
  const shoulderRaise = stressLevel >= 1 ? -1 : 0;

  // === SHADOW ===
  ctx.fillStyle = 'rgba(60,40,20,0.3)';
  ctx.beginPath();
  ctx.ellipse(8, 15.2, 4, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // === LEGS (6 walk frames with arm swing) ===
  // Leg positions: [leftLegX, leftLegY, leftLegH, rightLegX, rightLegY, rightLegH]
  // Arms: [leftArmX, leftArmY, leftArmH, rightArmX, rightArmY, rightArmH]
  const bx = hipSway; // body x offset for sway
  if (frame === 0 || frame === 3) {
    // Standing neutral
    rect(ctx, 5 + bx, 12, 2, 3, pantsBase);
    rect(ctx, 9 + bx, 12, 2, 3, pantsBase);
    // Inner leg shadow
    rect(ctx, 7 + bx, 12, 2, 2, pantsShadow);
    // Shoes
    rect(ctx, 5 + bx, 14, 2, 1, shoeColor);
    rect(ctx, 9 + bx, 14, 2, 1, shoeColor);
  } else if (frame === 1) {
    // Right leg forward, left leg back
    const fwd = flip ? -1 : 1;
    rect(ctx, 5 + bx - fwd, 12, 2, 3, pantsBase);    // left leg (back)
    rect(ctx, 9 + bx + fwd, 11, 2, 4, pantsBase);     // right leg (forward)
    rect(ctx, 9 + bx + fwd, 12, 2, 1, pantsShadow);   // right leg shadow
    rect(ctx, 5 + bx - fwd, 14, 2, 1, shoeColor);
    rect(ctx, 9 + bx + fwd, 14, 2, 1, shoeColor);
  } else if (frame === 2) {
    // Right leg extended, left leg back extended
    const fwd = flip ? -1 : 1;
    rect(ctx, 5 + bx - fwd * 2, 12, 2, 3, pantsBase);  // left leg far back
    rect(ctx, 9 + bx + fwd * 2, 11, 2, 4, pantsBase);   // right leg far forward
    rect(ctx, 7 + bx, 12, 2, 2, pantsShadow);            // center shadow
    rect(ctx, 5 + bx - fwd * 2, 14, 2, 1, shoeColor);
    rect(ctx, 9 + bx + fwd * 2, 14, 2, 1, shoeColor);
  } else if (frame === 4) {
    // Left leg forward, right leg back (mirror of frame 1)
    const fwd = flip ? -1 : 1;
    rect(ctx, 5 + bx + fwd, 11, 2, 4, pantsBase);     // left leg (forward)
    rect(ctx, 9 + bx - fwd, 12, 2, 3, pantsBase);     // right leg (back)
    rect(ctx, 5 + bx + fwd, 12, 2, 1, pantsShadow);   // left leg shadow
    rect(ctx, 5 + bx + fwd, 14, 2, 1, shoeColor);
    rect(ctx, 9 + bx - fwd, 14, 2, 1, shoeColor);
  } else if (frame === 5) {
    // Left leg extended, right leg back extended (mirror of frame 2)
    const fwd = flip ? -1 : 1;
    rect(ctx, 5 + bx + fwd * 2, 11, 2, 4, pantsBase);   // left leg far forward
    rect(ctx, 9 + bx - fwd * 2, 12, 2, 3, pantsBase);   // right leg far back
    rect(ctx, 7 + bx, 12, 2, 2, pantsShadow);             // center shadow
    rect(ctx, 5 + bx + fwd * 2, 14, 2, 1, shoeColor);
    rect(ctx, 9 + bx - fwd * 2, 14, 2, 1, shoeColor);
  }

  // === LAB COAT BODY ===
  const bodyY = 6 + shoulderRaise;
  const bodyH = 7 - shoulderRaise;
  // Main coat
  rect(ctx, 4 + bx, bodyY, 8, bodyH, coatBase);
  // Highlight edge on left side
  rect(ctx, 4 + bx, bodyY, 1, bodyH - 2, coatHighlight);
  // Shadow on right fold
  rect(ctx, 11 + bx, bodyY, 1, bodyH - 1, coatShadow);
  // Bottom shadow fold
  rect(ctx, 4 + bx, 10, 8, 3, coatShadow);
  // Center coat line (buttons)
  rect(ctx, 8 + bx, bodyY + 1, 1, bodyH - 2, coatShadow);
  px(ctx, 8 + bx, bodyY + 2, '#c8c4b8'); // button
  px(ctx, 8 + bx, bodyY + 4, '#c8c4b8'); // button
  // Collar / neckline
  rect(ctx, 4 + bx, bodyY, 8, 1, coatShadow);
  px(ctx, 7 + bx, bodyY, skinBase); // V-neck showing skin
  px(ctx, 8 + bx, bodyY, skinBase);
  // Chest breathing expansion
  if (breathExpand) {
    rect(ctx, 3 + bx, bodyY + 2, 1, 2, coatBase);
    rect(ctx, 12 + bx, bodyY + 2, 1, 2, coatBase);
  }
  // Coat hem
  rect(ctx, 4 + bx, 12, 8, 1, coatShadow);
  // Pocket shadows
  rect(ctx, 5 + bx, 9, 2, 2, coatShadow);
  rect(ctx, 9 + bx, 9, 2, 2, coatShadow);

  // === ARMS (swing with walk) ===
  if (frame === 0 || frame === 3) {
    // Arms at sides
    rect(ctx, 3 + bx, 7 + shoulderRaise, 1, 5, coatBase);
    rect(ctx, 12 + bx, 7 + shoulderRaise, 1, 5, coatBase);
    // Hands at rest
    px(ctx, 3 + bx, 11 + shoulderRaise, skinBase);
    px(ctx, 12 + bx, 11 + shoulderRaise, skinBase);
  } else if (frame === 1 || frame === 2) {
    // Left arm forward, right arm back
    const ext = frame === 2 ? 2 : 1;
    const armFwd = flip ? 1 : -1;
    // Left arm forward
    rect(ctx, 3 + bx + armFwd * ext, 7 + shoulderRaise, 1, 4, coatBase);
    px(ctx, 3 + bx + armFwd * ext, 10 + shoulderRaise, skinBase);
    // Right arm back
    rect(ctx, 12 + bx - armFwd * ext, 7 + shoulderRaise, 1, 4, coatBase);
    px(ctx, 12 + bx - armFwd * ext, 10 + shoulderRaise, skinBase);
  } else if (frame === 4 || frame === 5) {
    // Right arm forward, left arm back
    const ext = frame === 5 ? 2 : 1;
    const armFwd = flip ? 1 : -1;
    // Right arm forward
    rect(ctx, 12 + bx + armFwd * ext, 7 + shoulderRaise, 1, 4, coatBase);
    px(ctx, 12 + bx + armFwd * ext, 10 + shoulderRaise, skinBase);
    // Left arm back
    rect(ctx, 3 + bx - armFwd * ext, 7 + shoulderRaise, 1, 4, coatBase);
    px(ctx, 3 + bx - armFwd * ext, 10 + shoulderRaise, skinBase);
  }

  // === NAME BADGE with detail ===
  const badgeSide = flip ? 9 + bx : 5 + bx;
  rect(ctx, badgeSide, 8, 2, 2, badgeGreen);
  px(ctx, badgeSide + 1, 8, badgeLight); // badge highlight
  px(ctx, badgeSide, 7, badgeGreen);      // lanyard clip
  px(ctx, badgeSide, bodyY, '#3a8848');   // lanyard to collar

  // === HEAD (6x5, with bob on mid-stride) ===
  const hy = 1 + headBob;
  // Base skin
  rect(ctx, 5, hy, 6, 6, skinBase);
  // Chin/neck shadow
  rect(ctx, 6, hy + 4.5, 4, 1.5, skinShadow);
  // Rosy cheeks
  px(ctx, 5, hy + 4, '#e0a080');
  px(ctx, 10, hy + 4, '#e0a080');
  // Ears with shadow
  px(ctx, 4, hy + 2, skinBase);
  px(ctx, 4, hy + 3, skinShadow);
  px(ctx, 11, hy + 2, skinBase);
  px(ctx, 11, hy + 3, skinShadow);

  // === HAIR (2-tone) ===
  rect(ctx, 5, hy - 1, 6, 2, hairBase);
  rect(ctx, 4, hy - 1, 1, 4, hairBase);
  rect(ctx, 11, hy - 1, 1, 4, hairBase);
  // Hair highlights
  px(ctx, 6, hy - 1, hairHighlight);
  px(ctx, 8, hy - 1, hairHighlight);
  px(ctx, 9, hy - 1, hairHighlight);

  // === EYES (white + pupil + highlight) ===
  if (isBlinking) {
    // Closed eyes (blink) — just a line
    if (facing === 'left') {
      px(ctx, 6, hy + 3, '#2a2018');
      px(ctx, 8, hy + 3, '#2a2018');
    } else if (facing === 'right') {
      px(ctx, 7, hy + 3, '#2a2018');
      px(ctx, 9, hy + 3, '#2a2018');
    } else {
      px(ctx, 6, hy + 3, '#2a2018');
      px(ctx, 9, hy + 3, '#2a2018');
    }
  } else {
    // Open eyes
    const wideEye = stressLevel >= 3; // wider eyes at high stress
    if (facing === 'left') {
      px(ctx, 6, hy + 2, '#fff'); px(ctx, 6, hy + 3, '#fff');
      px(ctx, 6, hy + 3, '#2a2018'); // pupil
      if (wideEye) px(ctx, 6, hy + 2, '#e8e8ff');
      px(ctx, 8, hy + 2, '#fff'); px(ctx, 8, hy + 3, '#fff');
      px(ctx, 8, hy + 3, '#2a2018');
      if (wideEye) px(ctx, 8, hy + 2, '#e8e8ff');
      // Tiny highlight
      px(ctx, 6, hy + 2, '#fff');
      px(ctx, 8, hy + 2, '#fff');
    } else if (facing === 'right') {
      px(ctx, 7, hy + 2, '#fff'); px(ctx, 7, hy + 3, '#fff');
      px(ctx, 7, hy + 3, '#2a2018');
      if (wideEye) px(ctx, 7, hy + 2, '#e8e8ff');
      px(ctx, 9, hy + 2, '#fff'); px(ctx, 9, hy + 3, '#fff');
      px(ctx, 9, hy + 3, '#2a2018');
      if (wideEye) px(ctx, 9, hy + 2, '#e8e8ff');
      px(ctx, 7, hy + 2, '#fff');
      px(ctx, 9, hy + 2, '#fff');
    } else {
      px(ctx, 6, hy + 2, '#fff'); px(ctx, 6, hy + 3, '#fff');
      px(ctx, 6, hy + 3, '#2a2018');
      if (wideEye) px(ctx, 6, hy + 2, '#e8e8ff');
      px(ctx, 9, hy + 2, '#fff'); px(ctx, 9, hy + 3, '#fff');
      px(ctx, 9, hy + 3, '#2a2018');
      if (wideEye) px(ctx, 9, hy + 2, '#e8e8ff');
      px(ctx, 6, hy + 2, '#fff');
      px(ctx, 9, hy + 2, '#fff');
    }
  }

  // === EYEBROWS & STRESS VISUALS ===
  if (stressLevel >= 1) {
    // Low stress: furrowed brows
    px(ctx, 6, hy + 1, hairBase);
    px(ctx, 9, hy + 1, hairBase);
  }
  if (stressLevel >= 2) {
    // Medium stress: thicker brows + sweat
    px(ctx, 5, hy + 1, '#4a3020');
    px(ctx, 10, hy + 1, '#4a3020');
    // Sweat drops (animated if we have time)
    const sweatY = hy + 1 + (t ? Math.floor(t * 3) % 2 : 0);
    px(ctx, 12, sweatY, '#8ac8e8');
    px(ctx, 12, sweatY + 1, '#a0d8f0');
  }
  if (stressLevel >= 3) {
    // High stress: second sweat drop + reddened face tint overlay
    px(ctx, 3, hy + 2, '#8ac8e8');
    px(ctx, 3, hy + 3, '#a0d8f0');
    // Reddened face tint (overlay with low alpha)
    ctx.fillStyle = 'rgba(200,80,60,0.12)';
    ctx.fillRect(5, hy, 6, 5);
  }

  // === MOUTH ===
  if (stressLevel >= 3) {
    // Tense grimace
    px(ctx, 7, hy + 4, '#a06050');
    px(ctx, 8, hy + 4, '#a06050');
  } else if (stressLevel >= 2) {
    // Worried frown
    px(ctx, 7, hy + 4, '#b87060');
    px(ctx, 8, hy + 4, '#b87060');
  } else {
    // Normal / slight smile
    px(ctx, 7, hy + 4, '#c08070');
    px(ctx, 8, hy + 4, '#c08070');
  }

  // === OUTLINE (warm brown edges) ===
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.5;
  // Head outline
  ctx.strokeRect(4.5, hy - 0.5, 7, 6.5);
  // Body outline
  ctx.strokeRect(3.5 + bx, 5.5 + shoulderRaise, 9, 8 - shoulderRaise);

  spriteCache.set(key, c);
  return c;
}

const PATIENT_HAIR_COLORS = [
  '#3a2a1a', '#8b6914', '#1a1a1a', '#cc8833', '#555555',
  '#2a1a0a', '#994422', '#1a2a1a', '#664422', '#aa7733',
  '#bb9944', '#774422', '#333333', '#2a2a2a',
];
const PATIENT_SHIRT_COLORS = [
  '#4466aa', '#aa4444', '#44aa66', '#6644aa', '#aa6644',
  '#44aaaa', '#888844', '#aa4488', '#5588aa', '#cc6644',
  '#5577bb', '#bb5566', '#448877', '#7766aa', '#cc8855', '#557799',
];
const PATIENT_SKIN_TONES = [
  '#f0c8a0', '#e8c8a0', '#e8b88a', '#d4a574',
  '#c49060', '#b07848', '#a06838', '#8b6240',
];

function drawPatientSprite(paletteIndex, emotionLevel) {
  // emotionLevel: 0=calm, 1=impatient, 2=angry
  // paletteIndex acts as patient ID for deterministic variety
  const id = paletteIndex;
  const key = getCacheKey('patient', paletteIndex, emotionLevel);
  if (spriteCache.has(key)) return spriteCache.get(key);

  const palette = PATIENT_PALETTES[paletteIndex % PATIENT_PALETTES.length];
  const skin = palette.skin || '#e8b88a';
  const skinBlush = blendColor(skin, '#e08060', 0.35);
  const skinShadow = darkenColor(skin);
  const hairBase = palette.hair;
  const hairHighlight = lightenColor(hairBase);
  const shirtBase = palette.shirt;
  const shirtShadow = darkenColor(shirtBase);
  const pantsBase = palette.pants || '#3a3848';
  const pantsShadow = darkenColor(pantsBase);
  const shoeColor = palette.shoes || '#2a2018';

  // Deterministic pseudo-random helpers using patient id
  const hashA = (id * 7 + 3) % 100;
  const hashB = (id * 13 + 11) % 100;
  const hashC = (id * 17 + 5) % 100;
  const hashD = (id * 23 + 7) % 100;

  // Height variation: -1, 0, or +1 pixel
  const heightVar = ((id * 11 + 2) % 3) - 1; // -1, 0, or 1

  // Hair style: 8 styles
  const hairStyle = (id * 3 + 1) % 8;

  // Accessories
  const hasGlasses = hashA < 25;        // ~25%
  const hasMask = !hasGlasses && hashB < 15;  // ~15% (not with glasses overlap)
  const hasLanyard = hashC < 10;        // ~10%

  const c = createSpriteCanvas(16, 17); // 17 tall for height variation
  const ctx = c.getContext('2d');

  // Y offset for height variation (taller patients start higher)
  const yo = 1 - heightVar; // base y-offset: shorter=2, normal=1, taller=0

  const outline = '#3a2820';

  // Shadow
  ctx.fillStyle = 'rgba(60,40,20,0.25)';
  ctx.beginPath();
  ctx.ellipse(8, yo + 15, 3.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- LEGS & FEET ---
  // Wider stance when angry
  const legSpread = emotionLevel >= 2 ? 1 : 0;
  const leftLegX = 5 - legSpread;
  const rightLegX = 9 + legSpread;

  // Legs with pants shading
  rect(ctx, leftLegX, yo + 12, 2, 3, pantsBase);
  rect(ctx, rightLegX, yo + 12, 2, 3, pantsBase);
  // Pants shadow (inner edge)
  px(ctx, leftLegX + 1, yo + 13, pantsShadow);
  px(ctx, rightLegX, yo + 13, pantsShadow);

  // Shoes
  rect(ctx, leftLegX, yo + 14, 2, 1, shoeColor);
  rect(ctx, rightLegX, yo + 14, 2, 1, shoeColor);

  // Impatient foot tap indicator (small mark under foot)
  if (emotionLevel === 1) {
    px(ctx, rightLegX + 2, yo + 14, 'rgba(60,40,20,0.3)');
  }

  // --- BODY (SHIRT) ---
  rect(ctx, 4, yo + 6, 8, 7, shirtBase);
  // Shirt fold shadow (center crease + sides)
  rect(ctx, 4, yo + 6, 1, 7, shirtShadow);
  rect(ctx, 11, yo + 6, 1, 7, shirtShadow);
  px(ctx, 7, yo + 9, shirtShadow);  // center fold
  px(ctx, 8, yo + 10, shirtShadow); // center fold
  // Bottom hem shadow
  rect(ctx, 4, yo + 12, 8, 1, shirtShadow);
  // Sleeves
  rect(ctx, 3, yo + 7, 1, 3, shirtBase);
  rect(ctx, 12, yo + 7, 1, 3, shirtBase);
  // Collar
  rect(ctx, 6, yo + 6, 4, 1, shirtShadow);
  px(ctx, 7, yo + 6, skin); // neck visible
  px(ctx, 8, yo + 6, skin); // neck visible

  // --- HANDS ---
  if (emotionLevel >= 2) {
    // Clenched fists: 2x1 squares
    rect(ctx, 2, yo + 10, 2, 1, skin);
    rect(ctx, 12, yo + 10, 2, 1, skin);
  } else if (emotionLevel === 1) {
    // Crossed arms: hands overlap body
    px(ctx, 5, yo + 9, skin);
    px(ctx, 10, yo + 9, skin);
    // Arm cross lines
    px(ctx, 4, yo + 8, shirtShadow);
    px(ctx, 11, yo + 8, shirtShadow);
  } else {
    // Relaxed hands at sides
    px(ctx, 3, yo + 10, skin);
    px(ctx, 12, yo + 10, skin);
  }

  // --- LANYARD/BADGE accessory ---
  if (hasLanyard) {
    const badgeSide = (id % 2 === 0) ? 5 : 9;
    px(ctx, badgeSide, yo + 6, '#4a8a5a'); // lanyard from neck
    px(ctx, badgeSide, yo + 7, '#4a8a5a');
    rect(ctx, badgeSide, yo + 8, 2, 2, '#5a9a6a'); // badge
    px(ctx, badgeSide, yo + 8, '#ffffff');           // badge text dot
  }

  // --- HEAD ---
  rect(ctx, 5, yo + 1, 6, 6, skin);
  // Chin shadow
  rect(ctx, 6, yo + 6, 4, 1, skinShadow);
  // Ears
  px(ctx, 4, yo + 3, skinShadow);
  px(ctx, 11, yo + 3, skinShadow);

  // --- ROSY CHEEKS (calm only, or always subtle) ---
  if (emotionLevel === 0) {
    px(ctx, 5, yo + 4, skinBlush);
    px(ctx, 10, yo + 4, skinBlush);
  } else {
    // Subtle blush even when upset
    px(ctx, 5, yo + 4, blendColor(skin, '#e08060', 0.15));
    px(ctx, 10, yo + 4, blendColor(skin, '#e08060', 0.15));
  }

  // --- HAIR: 8 styles with base + highlight ---
  // Common top hair for most styles
  if (hairStyle !== 3 && hairStyle !== 7) {
    rect(ctx, 5, yo + 0, 6, 2, hairBase);
  }

  if (hairStyle === 0) {
    // Style 0: Short cropped — tight to head, no side extension
    rect(ctx, 5, yo + 0, 6, 2, hairBase);
    px(ctx, 4, yo + 1, hairBase);
    px(ctx, 11, yo + 1, hairBase);
    px(ctx, 7, yo + 0, hairHighlight); // highlight strand
  } else if (hairStyle === 1) {
    // Style 1: Long straight — extends down sides
    rect(ctx, 4, yo + 0, 1, 4, hairBase);
    rect(ctx, 11, yo + 0, 1, 4, hairBase);
    px(ctx, 6, yo + 0, hairHighlight);
    px(ctx, 8, yo + 0, hairHighlight);
  } else if (hairStyle === 2) {
    // Style 2: Ponytail — hair on top + tail extending right
    rect(ctx, 4, yo + 0, 1, 3, hairBase);
    rect(ctx, 11, yo + 0, 1, 3, hairBase);
    // Ponytail on right side
    rect(ctx, 12, yo + 1, 1, 3, hairBase);
    px(ctx, 13, yo + 2, hairBase);
    px(ctx, 13, yo + 3, hairBase);
    px(ctx, 5, yo + 0, hairHighlight); // top highlight
  } else if (hairStyle === 3) {
    // Style 3: Bald/buzzcut — just a thin line on top
    rect(ctx, 5, yo + 0, 6, 1, hairBase);
    // Very subtle stubble dots
    px(ctx, 6, yo + 1, blendColor(skin, hairBase, 0.2));
    px(ctx, 9, yo + 1, blendColor(skin, hairBase, 0.2));
  } else if (hairStyle === 4) {
    // Style 4: Curly/afro — rounded, 2px taller (extends above normal bounds)
    rect(ctx, 4, yo - 1, 8, 1, hairBase);  // top row (extends up)
    rect(ctx, 3, yo + 0, 10, 2, hairBase); // wide middle
    rect(ctx, 4, yo + 2, 1, 1, hairBase);  // side curls
    rect(ctx, 11, yo + 2, 1, 1, hairBase);
    // Curl highlights
    px(ctx, 5, yo - 1, hairHighlight);
    px(ctx, 9, yo - 1, hairHighlight);
    px(ctx, 7, yo + 0, hairHighlight);
  } else if (hairStyle === 5) {
    // Style 5: Bob cut — chin length, wider
    rect(ctx, 4, yo + 0, 8, 2, hairBase);   // top, wider
    rect(ctx, 3, yo + 1, 1, 4, hairBase);   // left side down to chin
    rect(ctx, 12, yo + 1, 1, 4, hairBase);  // right side down to chin
    rect(ctx, 4, yo + 4, 1, 1, hairBase);   // chin tuck left
    rect(ctx, 11, yo + 4, 1, 1, hairBase);  // chin tuck right
    px(ctx, 6, yo + 0, hairHighlight);
    px(ctx, 9, yo + 0, hairHighlight);
  } else if (hairStyle === 6) {
    // Style 6: Messy/spiky — jagged top edge
    rect(ctx, 5, yo + 0, 6, 2, hairBase);
    // Spiky top: alternating pixels above hairline
    px(ctx, 5, yo - 1, hairBase);
    px(ctx, 7, yo - 1, hairBase);
    px(ctx, 9, yo - 1, hairBase);
    px(ctx, 11, yo - 1, hairBase);
    // Side tufts
    px(ctx, 4, yo + 0, hairBase);
    px(ctx, 11, yo + 0, hairBase);
    // Highlights on spikes
    px(ctx, 5, yo - 1, hairHighlight);
    px(ctx, 9, yo - 1, hairHighlight);
  } else if (hairStyle === 7) {
    // Style 7: Hat/cap — flat top with brim, uses hair color as hat color
    const hatColor = hairBase;
    const hatBrim = darkenColor(hatColor);
    rect(ctx, 4, yo + 0, 8, 2, hatColor);   // hat body
    rect(ctx, 3, yo + 2, 10, 1, hatBrim);   // brim (wider)
    px(ctx, 6, yo + 0, lightenColor(hatColor)); // hat highlight
    px(ctx, 7, yo + 0, lightenColor(hatColor));
    // Show a sliver of hair under hat
    px(ctx, 4, yo + 2, hairBase);
    px(ctx, 11, yo + 2, hairBase);
  }

  // --- EYES ---
  if (emotionLevel < 2) {
    // Normal eyes: white sclera + dark pupil
    px(ctx, 6, yo + 3, '#ffffff');
    px(ctx, 6, yo + 4, '#2a2018');
    px(ctx, 9, yo + 3, '#ffffff');
    px(ctx, 9, yo + 4, '#2a2018');
    // Tiny eye highlight
    px(ctx, 6, yo + 3, '#ffffff');
    px(ctx, 9, yo + 3, '#ffffff');
  }

  // --- EMOTION-SPECIFIC DETAILS ---
  if (emotionLevel === 0) {
    // Calm: slight smile, relaxed posture
    px(ctx, 7, yo + 5, darkenColor(skin));
    px(ctx, 8, yo + 5, darkenColor(skin));
    // Smile curve (slightly lighter above mouth)
    px(ctx, 6, yo + 5, blendColor(skin, '#c08070', 0.15));
    px(ctx, 9, yo + 5, blendColor(skin, '#c08070', 0.15));
  } else if (emotionLevel === 1) {
    // Impatient: furrowed brow, mouth turned down
    // Furrowed brows (angled inward)
    px(ctx, 5, yo + 2, darkenColor(hairBase));
    px(ctx, 6, yo + 2, darkenColor(hairBase));
    px(ctx, 9, yo + 2, darkenColor(hairBase));
    px(ctx, 10, yo + 2, darkenColor(hairBase));
    // Mouth turned down
    px(ctx, 7, yo + 5, '#a07050');
    px(ctx, 8, yo + 5, '#a07050');
    px(ctx, 6, yo + 5, blendColor(skin, '#a07050', 0.2)); // frown corners
    px(ctx, 9, yo + 5, blendColor(skin, '#a07050', 0.2));
  } else {
    // Angry: red tint, sharp eyebrows, wide mouth, clenched fists
    // Red-tinted face
    rect(ctx, 5, yo + 1, 6, 6, blendColor(skin, '#ff4444', 0.18));
    // Chin shadow on red face
    rect(ctx, 6, yo + 6, 4, 1, darkenColor(blendColor(skin, '#ff4444', 0.18)));
    // Re-draw ears with tint
    px(ctx, 4, yo + 3, darkenColor(blendColor(skin, '#ff4444', 0.12)));
    px(ctx, 11, yo + 3, darkenColor(blendColor(skin, '#ff4444', 0.12)));
    // Angry eyes: narrower, darker
    px(ctx, 6, yo + 3, '#ffffff');
    px(ctx, 6, yo + 4, '#1a1010');
    px(ctx, 9, yo + 3, '#ffffff');
    px(ctx, 9, yo + 4, '#1a1010');
    // Sharp angled eyebrows (inner higher than outer)
    px(ctx, 5, yo + 3, '#2a1a10');
    px(ctx, 6, yo + 2, '#2a1a10');
    px(ctx, 9, yo + 2, '#2a1a10');
    px(ctx, 10, yo + 3, '#2a1a10');
    // Open angry mouth
    rect(ctx, 7, yo + 5, 2, 1, '#993333');
    // Overall warm red tint overlay
    ctx.fillStyle = 'rgba(200, 60, 30, 0.08)';
    ctx.fillRect(0, 0, 16, 17);
  }

  // --- GLASSES accessory ---
  if (hasGlasses) {
    const glassFrame = '#3a3a4a';
    // Left lens
    rect(ctx, 5, yo + 3, 2, 2, 'rgba(180,210,240,0.3)'); // lens tint
    ctx.strokeStyle = glassFrame;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(5, yo + 3, 2, 2);
    // Right lens
    rect(ctx, 9, yo + 3, 2, 2, 'rgba(180,210,240,0.3)');
    ctx.strokeRect(9, yo + 3, 2, 2);
    // Bridge
    rect(ctx, 7, yo + 3, 2, 0.5, glassFrame);
    // Temples (side arms)
    px(ctx, 4, yo + 3, glassFrame);
    px(ctx, 11, yo + 3, glassFrame);
  }

  // --- MASK accessory ---
  if (hasMask) {
    const maskColor = '#88bbdd';
    const maskShadow = '#70a0c0';
    rect(ctx, 5, yo + 4, 6, 2, maskColor);
    // Mask shadow/fold
    px(ctx, 7, yo + 5, maskShadow);
    px(ctx, 8, yo + 5, maskShadow);
    // Ear loops
    px(ctx, 4, yo + 4, '#99ccdd');
    px(ctx, 11, yo + 4, '#99ccdd');
  }

  // --- OUTLINES (Stardew-style warm brown) ---
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.5;
  // Head outline
  ctx.strokeRect(4.5, yo + 0.5, 7, 6);
  // Body outline
  ctx.strokeRect(3.5, yo + 5.5, 9, 9);

  spriteCache.set(key, c);
  return c;
}

function lightenColor(hex) {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 30);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 30);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 30);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function blendColor(hex1, hex2, amount) {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * amount);
  const g = Math.round(g1 + (g2 - g1) * amount);
  const b = Math.round(b1 + (b2 - b1) * amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ========== SPEECH BUBBLE ==========
function drawSpeechBubble(text, maxWidth) {
  maxWidth = maxWidth || 100;
  const key = getCacheKey('bubble', text, maxWidth);
  if (spriteCache.has(key)) return spriteCache.get(key);

  // Measure text
  const tempCanvas = createSpriteCanvas(1, 1);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = '8px monospace';

  // Word wrap
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    const test = currentLine ? currentLine + ' ' + word : word;
    if (tempCtx.measureText(test).width > maxWidth - 8) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = 10;
  const w = Math.min(maxWidth, Math.max(...lines.map(l => tempCtx.measureText(l).width)) + 10);
  const h = lines.length * lineHeight + 8;

  const c = createSpriteCanvas(Math.ceil(w), Math.ceil(h) + 6);
  const ctx = c.getContext('2d');

  // Bubble background — warm cream with brown outline
  ctx.fillStyle = '#faf4e8';
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 3);
  ctx.fill();
  ctx.stroke();

  // Tail
  ctx.fillStyle = '#faf4e8';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 3, h);
  ctx.lineTo(w / 2, h + 5);
  ctx.lineTo(w / 2 + 3, h);
  ctx.fill();
  ctx.strokeStyle = '#5a4030';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 3, h);
  ctx.lineTo(w / 2, h + 5);
  ctx.lineTo(w / 2 + 3, h);
  ctx.stroke();
  // Cover the gap
  ctx.fillStyle = '#faf4e8';
  ctx.fillRect(w / 2 - 3, h - 1, 6, 2);

  // Text
  ctx.fillStyle = '#3a2820';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], w / 2, 10 + i * lineHeight);
  }

  spriteCache.set(key, c);
  return c;
}

// ========== TILE SPRITES ==========

function drawFloorTile(variant) {
  const key = getCacheKey('floor', variant);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Base floor — warm golden VCT tiles (Stardew warmth)
  const bases = ['#ddd0b8', '#dfd2ba', '#dbd0b6', '#ded1b9', '#dccfb7', '#e0d3bb', '#daceb5'];
  rect(ctx, 0, 0, 16, 16, bases[variant % bases.length]);

  // VCT tile grid lines
  ctx.fillStyle = '#cfc2aa';
  ctx.fillRect(0, 0, 16, 1);
  ctx.fillRect(0, 0, 1, 16);
  // Inner highlight edge
  ctx.fillStyle = '#e6d9c4';
  ctx.fillRect(1, 1, 15, 1);
  ctx.fillRect(1, 1, 1, 15);

  // Scuff marks and wear patterns
  const seed = variant * 13;
  if (seed % 7 === 0) {
    // Dark scuff
    ctx.fillStyle = '#c8bca4';
    ctx.fillRect(3, 8, 4, 1);
    px(ctx, 4, 9, '#c8bca4');
  }
  if (seed % 11 === 0) {
    // Light scratch
    ctx.fillStyle = '#e2d6c0';
    ctx.fillRect(6, 4, 1, 5);
  }
  if (seed % 5 === 0) {
    // Speckle cluster
    px(ctx, 4, 7, '#ccbfa8');
    px(ctx, 11, 3, '#d0c3ac');
    px(ctx, 8, 12, '#ccbfa8');
  }
  if (seed % 9 === 0) {
    // Heel mark
    ctx.fillStyle = '#c4b89e';
    ctx.fillRect(9, 10, 3, 1);
    px(ctx, 10, 11, '#c4b89e');
  }
  if (seed % 13 === 0) {
    // Faint cross-pattern (wax buildup)
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, 7, 16, 2);
    ctx.fillRect(7, 0, 2, 16);
  }

  spriteCache.set(key, c);
  return c;
}

function drawCounterTopTile() {
  const key = 'counter_top';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Laminate counter top — warm cream
  rect(ctx, 0, 0, 16, 16, '#f0e4d0');
  // Subtle grain
  ctx.fillStyle = '#e8dcc8';
  for (let i = 0; i < 16; i += 3) {
    ctx.fillRect(0, i, 16, 1);
  }
  // Edge highlight
  rect(ctx, 0, 0, 16, 1, '#f8ecd8');

  spriteCache.set(key, c);
  return c;
}

function drawCounterFrontTile() {
  const key = 'counter_front';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Dark front panel — warm oak
  rect(ctx, 0, 0, 16, 16, '#8b6f47');
  // Panel lines
  rect(ctx, 0, 0, 16, 1, '#9a7e56');
  rect(ctx, 0, 15, 16, 1, '#7a5f37');
  // Vertical panel details — wood grain
  rect(ctx, 7, 0, 1, 16, '#7a5f37');
  rect(ctx, 8, 0, 1, 16, '#9a7e56');

  spriteCache.set(key, c);
  return c;
}

function drawShelfTile(row) {
  const key = getCacheKey('shelf', row);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Shelf back panel — warm wood
  rect(ctx, 0, 0, 16, 16, '#7a5a30');
  // Vertical support brackets
  rect(ctx, 0, 0, 1, 16, '#6a4a20');
  rect(ctx, 15, 0, 1, 16, '#6a4a20');

  // Shelf surfaces (3 shelves) — warm oak
  rect(ctx, 0, 0, 16, 2, '#9a7a50');
  rect(ctx, 0, 1, 16, 1, '#aa8a60'); // highlight
  rect(ctx, 0, 7, 16, 2, '#9a7a50');
  rect(ctx, 0, 8, 16, 1, '#aa8a60');
  rect(ctx, 0, 14, 16, 2, '#9a7a50');
  rect(ctx, 0, 15, 16, 1, '#aa8a60');

  // Medicine items on each shelf — varied types
  const seed = row * 17;
  for (let shelf = 0; shelf < 2; shelf++) {
    const sy = shelf === 0 ? 2 : 9;
    const shelfSeed = seed + shelf * 7;

    for (let i = 0; i < 5; i++) {
      const bx = 1 + i * 3;
      const itemType = (shelfSeed + i * 3) % 6;

      if (itemType === 0) {
        // Amber vial (round pill bottle)
        const h = 4;
        rect(ctx, bx, sy + (5 - h), 2, h, '#c8884a');
        rect(ctx, bx, sy + (5 - h), 2, 1, '#e0c090'); // cap
        px(ctx, bx, sy + (5 - h) + 2, '#fff'); // label
        px(ctx, bx + 1, sy + (5 - h) + 2, '#fff');
      } else if (itemType === 1) {
        // White pharmacy box (tall)
        const h = 5;
        rect(ctx, bx, sy + (5 - h), 2, h, '#f0f0f0');
        rect(ctx, bx, sy + (5 - h), 2, 1, '#cc3333'); // red stripe
        px(ctx, bx, sy + (5 - h) + 2, '#ccc'); // text line
      } else if (itemType === 2) {
        // Short amber vial
        const h = 3;
        rect(ctx, bx, sy + (5 - h), 2, h, '#d4a060');
        rect(ctx, bx, sy + (5 - h), 2, 1, '#ddd');
      } else if (itemType === 3) {
        // Blue box (generic brand)
        const h = 4;
        rect(ctx, bx, sy + (5 - h), 2, h, '#4466aa');
        rect(ctx, bx, sy + (5 - h), 2, 1, '#4466aa');
        px(ctx, bx, sy + (5 - h) + 2, '#88aadd'); // label
      } else if (itemType === 4) {
        // Green box
        const h = 4;
        rect(ctx, bx, sy + (5 - h), 2, h, '#448844');
        px(ctx, bx, sy + (5 - h) + 1, '#88cc88');
        px(ctx, bx + 1, sy + (5 - h) + 1, '#88cc88');
      } else {
        // Tall amber with visible pills
        const h = 5;
        rect(ctx, bx, sy + (5 - h), 2, h, '#c8884a');
        rect(ctx, bx, sy + (5 - h), 2, 1, '#e8c090');
        // Visible pills through amber
        px(ctx, bx, sy + (5 - h) + 3, '#e0b070');
        px(ctx, bx + 1, sy + (5 - h) + 2, '#e0b070');
      }
    }
  }

  // Shadow under items on shelf
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(1, 6, 14, 1);
  ctx.fillRect(1, 13, 14, 1);

  spriteCache.set(key, c);
  return c;
}

function drawWallTile() {
  const key = 'wall';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  rect(ctx, 0, 0, 16, 16, '#e8dcc8');
  // Drop ceiling grid
  rect(ctx, 0, 15, 16, 1, '#d8ccb8');
  rect(ctx, 15, 0, 1, 16, '#d8ccb8');

  spriteCache.set(key, c);
  return c;
}

function drawBackWallTile(variant) {
  const key = getCacheKey('backwall', variant);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Wall base — warm
  rect(ctx, 0, 0, 16, 16, '#e0d8c8');
  // Baseboard molding
  rect(ctx, 0, 13, 16, 1, '#c8bcaa');
  rect(ctx, 0, 14, 16, 2, '#b8ac9a');

  const type = variant % 8;

  if (type === 0) {
    // Clipboard with papers
    rect(ctx, 5, 2, 6, 9, '#c8a060');
    rect(ctx, 5, 2, 6, 1, '#b89050'); // clip
    px(ctx, 8, 2, '#888'); // clip metal
    rect(ctx, 6, 3, 4, 7, '#fff');
    rect(ctx, 7, 4, 2, 1, '#aaa');
    rect(ctx, 7, 6, 2, 1, '#aaa');
    rect(ctx, 7, 8, 2, 1, '#aaa');
  } else if (type === 1) {
    // Medication fridge
    rect(ctx, 2, 1, 12, 12, '#c8c8cc');
    rect(ctx, 3, 2, 10, 5, '#d8ddf0');
    rect(ctx, 3, 8, 10, 4, '#d8ddf0');
    rect(ctx, 13, 4, 1, 2, '#999');
    rect(ctx, 13, 10, 1, 1, '#999');
    // Temperature display
    rect(ctx, 4, 2, 3, 2, '#224422');
    px(ctx, 5, 3, '#44ff44');
  } else if (type === 2) {
    // Bulletin board / notice board
    rect(ctx, 2, 1, 12, 10, '#8b6b3a');
    rect(ctx, 3, 2, 10, 8, '#a08050');
    // Pinned notes
    rect(ctx, 4, 3, 3, 3, '#fff');
    px(ctx, 5, 3, '#ff4444'); // pin
    rect(ctx, 8, 3, 4, 2, '#ffffaa');
    px(ctx, 9, 3, '#4444ff'); // pin
    rect(ctx, 4, 7, 4, 2, '#aaddff');
    rect(ctx, 9, 6, 3, 3, '#ffddaa');
    px(ctx, 10, 6, '#44aa44'); // pin
  } else if (type === 3) {
    // Stacked storage boxes
    rect(ctx, 2, 6, 6, 7, '#c8a868');
    rect(ctx, 2, 6, 6, 1, '#b89858');
    rect(ctx, 3, 8, 4, 1, '#aaa'); // label
    rect(ctx, 8, 4, 6, 9, '#c8a868');
    rect(ctx, 8, 4, 6, 1, '#b89858');
    rect(ctx, 9, 6, 4, 1, '#aaa');
    // Small box on top
    rect(ctx, 9, 1, 4, 3, '#d4b878');
    rect(ctx, 10, 2, 2, 1, '#bbb');
  } else if (type === 4) {
    // Fire extinguisher + exit sign
    // Exit sign
    rect(ctx, 4, 1, 8, 3, '#cc2222');
    ctx.fillStyle = '#fff';
    // Tiny "EXIT" text approximation
    px(ctx, 5, 2, '#fff'); px(ctx, 6, 2, '#fff');
    px(ctx, 8, 2, '#fff'); px(ctx, 9, 2, '#fff');
    px(ctx, 10, 2, '#fff'); px(ctx, 11, 2, '#fff');
    // Extinguisher
    rect(ctx, 6, 5, 4, 7, '#cc2222');
    rect(ctx, 7, 5, 2, 1, '#222');
    px(ctx, 9, 6, '#888'); // handle
    rect(ctx, 7, 8, 2, 1, '#aa1111'); // label band
  } else if (type === 5) {
    // Schedule board / whiteboard
    rect(ctx, 2, 1, 12, 10, '#eee');
    rect(ctx, 2, 1, 12, 1, '#999'); // frame top
    rect(ctx, 2, 10, 12, 1, '#999');
    rect(ctx, 2, 1, 1, 10, '#999');
    rect(ctx, 13, 1, 1, 10, '#999');
    // Written schedule
    rect(ctx, 4, 3, 6, 1, '#3366cc');
    rect(ctx, 4, 5, 8, 1, '#333');
    rect(ctx, 4, 7, 5, 1, '#cc3333');
    rect(ctx, 4, 9, 7, 1, '#333');
  } else if (type === 6) {
    // Wall outlet + paper towel dispenser
    rect(ctx, 4, 3, 8, 6, '#bbb');
    rect(ctx, 5, 4, 6, 4, '#ccc');
    rect(ctx, 6, 7, 4, 1, '#fff'); // paper edge
    // Outlet below
    rect(ctx, 6, 10, 4, 2, '#e8e4dc');
    px(ctx, 7, 11, '#444');
    px(ctx, 9, 11, '#444');
  } else {
    // Plain wall with electrical conduit
    rect(ctx, 7, 0, 2, 13, '#bbb');
    rect(ctx, 7, 0, 2, 1, '#aaa');
    // Junction box
    rect(ctx, 5, 5, 6, 4, '#999');
    rect(ctx, 6, 6, 4, 2, '#aaa');
  }

  spriteCache.set(key, c);
  return c;
}

// ========== STATION MARKERS ==========
function drawStationMarker(color, label) {
  const key = getCacheKey('station', color, label);
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Glowing dot on floor
  ctx.fillStyle = color + '44';
  ctx.beginPath();
  ctx.arc(8, 8, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color + '88';
  ctx.beginPath();
  ctx.arc(8, 8, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(8, 8, 1.5, 0, Math.PI * 2);
  ctx.fill();

  spriteCache.set(key, c);
  return c;
}

// ========== VERIFICATION BENCH DETAIL ==========
function drawVerifyBench() {
  const key = 'verify_bench';
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(32, 16);
  const ctx = c.getContext('2d');

  // Desk
  rect(ctx, 0, 6, 32, 10, '#8b7355');
  rect(ctx, 0, 6, 32, 2, '#9b8365');

  // Monitor
  rect(ctx, 3, 0, 10, 7, '#333');
  rect(ctx, 4, 1, 8, 5, '#4477aa');
  // Text on screen
  rect(ctx, 5, 2, 3, 1, '#88bbee');
  rect(ctx, 5, 4, 5, 1, '#88bbee');
  // Stand
  rect(ctx, 7, 7, 2, 2, '#555');

  // Keyboard
  rect(ctx, 15, 8, 8, 3, '#444');
  rect(ctx, 16, 9, 6, 1, '#666');

  // Papers
  rect(ctx, 25, 7, 5, 7, '#fff');
  rect(ctx, 26, 8, 3, 1, '#aaa');
  rect(ctx, 26, 10, 3, 1, '#aaa');

  spriteCache.set(key, c);
  return c;
}

// ========== PHONE ==========
function drawPhone(ringing) {
  const key = getCacheKey('phone', ringing);
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Phone base — warm dark
  rect(ctx, 3, 8, 10, 6, '#2a2420');
  rect(ctx, 4, 9, 8, 4, '#3a3430');

  // Handset
  if (!ringing) {
    rect(ctx, 3, 6, 10, 3, '#1a1410');
    rect(ctx, 3, 6, 3, 2, '#1a1410');
    rect(ctx, 10, 6, 3, 2, '#1a1410');
  } else {
    // Handset lifted/vibrating
    rect(ctx, 2, 3, 3, 5, '#1a1410');
    rect(ctx, 11, 3, 3, 5, '#1a1410');
    rect(ctx, 4, 3, 8, 2, '#1a1410');
    // Ring indicators — warm orange
    px(ctx, 1, 2, '#e8a040');
    px(ctx, 14, 2, '#e8a040');
    px(ctx, 0, 1, '#e8a040');
    px(ctx, 15, 1, '#e8a040');
  }

  // Buttons
  for (let r = 0; r < 2; r++) {
    for (let c2 = 0; c2 < 3; c2++) {
      px(ctx, 6 + c2 * 2, 10 + r * 2, '#7a7068');
    }
  }

  spriteCache.set(key, c);
  return c;
}

// ========== REGISTER / PICKUP AREA ==========
function drawRegister() {
  const key = 'register';
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Register base — warm dark
  rect(ctx, 2, 6, 12, 8, '#4a4038');
  // Screen
  rect(ctx, 3, 2, 10, 5, '#2a2420');
  rect(ctx, 4, 3, 8, 3, '#2a5a3a');
  // Text on screen
  rect(ctx, 5, 4, 4, 1, '#60c080');
  // Keypad
  rect(ctx, 3, 8, 4, 4, '#5a5048');
  // Receipt slot
  rect(ctx, 9, 7, 4, 1, '#6a6058');
  // Receipt paper
  rect(ctx, 10, 4, 2, 4, '#f0ede5');

  spriteCache.set(key, c);
  return c;
}

// ========== SIGN ==========
function drawSign(text, bgColor) {
  const key = getCacheKey('sign', text, bgColor);
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(48, 12);
  const ctx = c.getContext('2d');

  // Background
  rect(ctx, 0, 0, 48, 12, bgColor || '#cc2233');
  rect(ctx, 1, 1, 46, 10, bgColor || '#cc2233');

  // Border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 47, 11);

  // Text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 24, 7);

  spriteCache.set(key, c);
  return c;
}

// ========== DRIVE THRU CAR ==========
function drawCar(color) {
  const key = getCacheKey('car', color);
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(24, 16);
  const ctx = c.getContext('2d');

  // Car body (top-down view)
  rect(ctx, 2, 3, 20, 10, color || '#4466aa');
  // Roof
  rect(ctx, 5, 5, 14, 6, color ? darkenColor(color) : '#335599');
  // Windshield — warm tint
  rect(ctx, 4, 4, 4, 8, '#90aabb');
  // Rear window
  rect(ctx, 18, 5, 3, 6, '#90aabb');
  // Wheels — warm dark
  rect(ctx, 1, 2, 3, 3, '#2a2018');
  rect(ctx, 1, 11, 3, 3, '#2a2018');
  rect(ctx, 19, 2, 3, 3, '#2a2018');
  rect(ctx, 19, 11, 3, 3, '#2a2018');

  spriteCache.set(key, c);
  return c;
}

function darkenColor(hex) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 30);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 30);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 30);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ========== SNEEZE GUARD ==========
function drawSneezeGuard() {
  const key = 'sneeze_guard';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Transparent plexiglass
  ctx.fillStyle = 'rgba(200, 220, 240, 0.3)';
  ctx.fillRect(6, 0, 4, 14);
  // Frame
  ctx.fillStyle = '#999';
  ctx.fillRect(6, 0, 1, 14);
  ctx.fillRect(9, 0, 1, 14);
  ctx.fillRect(6, 0, 4, 1);

  spriteCache.set(key, c);
  return c;
}

// ========== WAITING CHAIRS ==========
function drawChair() {
  const key = 'chair';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Seat — warm brown wood
  rect(ctx, 3, 8, 10, 4, '#8a7050');
  // Back
  rect(ctx, 3, 4, 10, 5, '#9a8060');
  rect(ctx, 4, 5, 8, 3, '#7a6040');
  // Legs
  rect(ctx, 3, 12, 2, 3, '#6a5030');
  rect(ctx, 11, 12, 2, 3, '#6a5030');

  spriteCache.set(key, c);
  return c;
}

// ========== BROCHURE RACK ==========
function drawBrochureRack() {
  const key = 'brochure_rack';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Wire rack frame
  rect(ctx, 2, 2, 12, 12, '#888');
  rect(ctx, 3, 3, 10, 10, '#aaa');

  // Brochures
  rect(ctx, 4, 3, 3, 5, '#ee6644');
  rect(ctx, 8, 3, 3, 5, '#4488ee');
  rect(ctx, 4, 9, 3, 4, '#44bb66');
  rect(ctx, 8, 9, 3, 4, '#eeaa22');

  spriteCache.set(key, c);
  return c;
}

// ========== COUNTING TRAY ==========
function drawCountingTray() {
  const key = 'counting_tray';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Tray
  rect(ctx, 1, 4, 14, 10, '#e8e4dc');
  rect(ctx, 2, 5, 12, 8, '#f0ece4');
  // Divider
  rect(ctx, 8, 5, 1, 8, '#ddd');
  // Spatula
  rect(ctx, 11, 2, 2, 8, '#ccc');
  rect(ctx, 11, 1, 2, 2, '#bbb');

  // A few pills
  px(ctx, 4, 8, '#ff8866');
  px(ctx, 5, 9, '#ff8866');
  px(ctx, 6, 7, '#fff');

  spriteCache.set(key, c);
  return c;
}

// ========== SIGNATURE PAD ==========
function drawSignaturePad() {
  const key = 'sig_pad';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  rect(ctx, 2, 4, 12, 8, '#333');
  rect(ctx, 3, 5, 10, 5, '#446633');
  // Stylus
  rect(ctx, 12, 2, 2, 6, '#555');
  px(ctx, 12, 8, '#777');
  // "Sign here" text
  rect(ctx, 4, 7, 6, 1, '#88aa66');

  spriteCache.set(key, c);
  return c;
}

// ========== DRIVE THRU WINDOW ==========
function drawDriveThruWindow() {
  const key = 'dt_window';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Window frame
  rect(ctx, 0, 0, 16, 16, '#888');
  // Glass
  rect(ctx, 1, 1, 14, 14, '#aaccdd');
  // Reflection
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(2, 2, 5, 12);
  // Sliding track
  rect(ctx, 0, 7, 16, 2, '#666');

  spriteCache.set(key, c);
  return c;
}

// ========== PILL BOTTLES ON COUNTER ==========
function drawPillBottles() {
  const key = 'pill_bottles';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Amber vials
  rect(ctx, 1, 6, 4, 8, '#c8884a');
  rect(ctx, 1, 5, 4, 2, '#ddd');
  rect(ctx, 2, 7, 2, 2, '#fff'); // label

  rect(ctx, 7, 4, 3, 10, '#c8884a');
  rect(ctx, 7, 3, 3, 2, '#ddd');

  // White box
  rect(ctx, 12, 5, 4, 9, '#f0f0f0');
  rect(ctx, 12, 5, 4, 2, '#cc3333');
  rect(ctx, 13, 8, 2, 2, '#aaa');

  spriteCache.set(key, c);
  return c;
}

// ========== RX BAGS ==========
function drawRxBags() {
  const key = 'rx_bags';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // White pharmacy bag
  rect(ctx, 1, 3, 8, 11, '#fff');
  rect(ctx, 1, 3, 8, 2, '#fff');
  // Stapled top
  rect(ctx, 3, 3, 4, 1, '#ccc');
  px(ctx, 5, 3, '#888');
  // Rx label
  rect(ctx, 2, 7, 6, 3, '#eee');
  rect(ctx, 3, 8, 2, 1, '#44aa44');

  // Second bag behind
  rect(ctx, 9, 4, 6, 10, '#f8f8f8');
  rect(ctx, 10, 7, 4, 3, '#eee');

  spriteCache.set(key, c);
  return c;
}

// ========== RECEIPT PRINTER (16x16) ==========
function drawReceiptPrinter() {
  const key = getCacheKey('receiptPrinter');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Printer body
  rect(ctx, 3, 8, 10, 6, '#d8d4cc');
  rect(ctx, 4, 9, 8, 4, '#c8c4bc');
  // Top slot
  rect(ctx, 4, 7, 8, 2, '#3a3a3a');
  // Paper coming out
  rect(ctx, 5, 2, 6, 6, '#f0ede5');
  // Paper curl
  rect(ctx, 5, 2, 6, 1, '#e8e5dd');
  rect(ctx, 6, 1, 4, 1, '#f0ede5');
  // Text lines on paper
  for (let i = 0; i < 3; i++) {
    rect(ctx, 6, 3 + i, 4, 0.5, '#aaa');
  }
  // Status LED
  px(ctx, 11, 10, '#44ff88');
  // Shadow
  rect(ctx, 3, 14, 10, 1, 'rgba(0,0,0,0.15)');

  spriteCache.set(key, c);
  return c;
}

// ========== DROP-OFF BIN (16x16) ==========
function drawDropOffBin() {
  const key = getCacheKey('dropOffBin');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Bin body — wire basket
  rect(ctx, 2, 5, 12, 9, '#8a8578');
  // Inner darker area
  rect(ctx, 3, 6, 10, 7, '#6a6558');
  // Wire grid pattern
  ctx.strokeStyle = '#9a9588';
  ctx.lineWidth = 0.5;
  for (let gy = 7; gy < 13; gy += 2) {
    ctx.beginPath();
    ctx.moveTo(3, gy);
    ctx.lineTo(13, gy);
    ctx.stroke();
  }
  for (let gx = 5; gx < 13; gx += 3) {
    ctx.beginPath();
    ctx.moveTo(gx, 6);
    ctx.lineTo(gx, 13);
    ctx.stroke();
  }
  // Prescription papers sticking out
  rect(ctx, 4, 3, 5, 4, '#f0ede5');
  rect(ctx, 6, 4, 4, 3, '#e8e5dd');
  // Rx symbol
  ctx.fillStyle = '#4466aa';
  ctx.font = '4px monospace';
  ctx.fillText('Rx', 5, 7);
  // Label
  rect(ctx, 3, 12, 10, 2, '#cc2233');
  ctx.fillStyle = '#fff';
  ctx.font = '3px monospace';
  ctx.fillText('DROP', 4, 14);

  spriteCache.set(key, c);
  return c;
}

// ========== COMPUTER MONITOR (16x16) ==========
function drawComputerMonitor() {
  const key = getCacheKey('monitor');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Monitor bezel — warm dark
  rect(ctx, 2, 2, 12, 9, '#2a2420');
  // Screen — warm blue
  rect(ctx, 3, 3, 10, 7, '#1a3850');
  // Screen content — Rx software
  rect(ctx, 4, 4, 8, 1, '#2a5878');
  rect(ctx, 4, 6, 5, 0.5, '#3a7090');
  rect(ctx, 4, 7, 6, 0.5, '#3a7090');
  rect(ctx, 4, 8, 4, 0.5, '#3a7090');
  // Screen glow — warm green
  px(ctx, 10, 4, '#60c880');
  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let sl = 3; sl < 10; sl += 2) { ctx.fillRect(3, sl, 10, 1); }
  // Stand
  rect(ctx, 6, 11, 4, 2, '#3a3028');
  // Base
  rect(ctx, 4, 13, 8, 1, '#4a4038');
  // Power LED
  px(ctx, 8, 10, '#50b868');

  spriteCache.set(key, c);
  return c;
}

// ========== BLOOD PRESSURE MACHINE (16x16) ==========
function drawBPMachine() {
  const key = getCacheKey('bpMachine');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Pole
  rect(ctx, 7, 6, 2, 9, '#aaa8a0');
  // Base — heavy flat base
  rect(ctx, 3, 14, 10, 2, '#8a8880');
  rect(ctx, 4, 13, 8, 1, '#9a9890');
  // Machine head
  rect(ctx, 3, 1, 10, 6, '#d8d4cc');
  rect(ctx, 4, 2, 8, 4, '#e0dcd4');
  // Screen
  rect(ctx, 5, 2, 6, 3, '#1a4a2a');
  // Screen readout
  ctx.fillStyle = '#44ff88';
  ctx.font = '3px monospace';
  ctx.fillText('120', 5.5, 4.5);
  // Cuff holder
  rect(ctx, 2, 5, 3, 3, '#445566');
  // Arm rest
  rect(ctx, 1, 8, 5, 2, '#6a6558');

  spriteCache.set(key, c);
  return c;
}

// ========== TRASH BIN (16x16) ==========
function drawTrashBin() {
  const key = getCacheKey('trashBin');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Bin body — warm gray
  rect(ctx, 4, 5, 9, 10, '#5a5850');
  rect(ctx, 5, 5, 7, 10, '#6a6858');
  // Lid
  rect(ctx, 3, 3, 11, 3, '#7a7868');
  rect(ctx, 4, 2, 9, 1, '#8a8878');
  // Swing flap
  rect(ctx, 5, 3, 7, 1, '#6a6858');
  // Foot pedal
  rect(ctx, 5, 15, 4, 1, '#4a4840');
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(8, 15.5, 5, 1, 0, 0, Math.PI * 2);
  ctx.fill();

  spriteCache.set(key, c);
  return c;
}

// ========== EXPORTS ==========
export const Sprites = {
  pharmacist: drawPharmacistFrame,
  patient: drawPatientSprite,
  speechBubble: drawSpeechBubble,
  floorTile: drawFloorTile,
  counterTop: drawCounterTopTile,
  counterFront: drawCounterFrontTile,
  shelf: drawShelfTile,
  wall: drawWallTile,
  backWall: drawBackWallTile,
  stationMarker: drawStationMarker,
  verifyBench: drawVerifyBench,
  phone: drawPhone,
  register: drawRegister,
  sign: drawSign,
  car: drawCar,
  sneezeGuard: drawSneezeGuard,
  chair: drawChair,
  brochureRack: drawBrochureRack,
  countingTray: drawCountingTray,
  signaturePad: drawSignaturePad,
  driveThruWindow: drawDriveThruWindow,
  pillBottles: drawPillBottles,
  rxBags: drawRxBags,
  receiptPrinter: drawReceiptPrinter,
  dropOffBin: drawDropOffBin,
  computerMonitor: drawComputerMonitor,
  bpMachine: drawBPMachine,
  trashBin: drawTrashBin,
};
