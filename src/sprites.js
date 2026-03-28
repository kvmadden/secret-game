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
function drawPharmacistFrame(facing, frame, stress) {
  // stress: 0-1, affects visual appearance
  const stressLevel = Math.floor((stress || 0) * 2); // 0, 1, 2
  const key = getCacheKey('pharmacist', facing, frame, stressLevel);
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  const flip = facing === 'left';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(8, 15, 4, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (dark pants) with walk animation
  if (frame === 0) {
    // Standing
    rect(ctx, 5, 12, 2, 3, '#2a2a3a');
    rect(ctx, 9, 12, 2, 3, '#2a2a3a');
  } else if (frame === 1) {
    // Walk frame 1 — stride
    rect(ctx, flip ? 7 : 4, 12, 2, 3, '#2a2a3a');
    rect(ctx, flip ? 10 : 7, 13, 2, 2, '#2a2a3a');
    // Arm swing
    rect(ctx, flip ? 12 : 2, 7, 1, 5, '#f0f0f0');
    rect(ctx, flip ? 3 : 13, 8, 1, 3, '#f0f0f0');
  } else if (frame === 2) {
    // Walk frame 2 — opposite stride
    rect(ctx, flip ? 10 : 7, 12, 2, 3, '#2a2a3a');
    rect(ctx, flip ? 7 : 4, 13, 2, 2, '#2a2a3a');
    rect(ctx, flip ? 3 : 13, 7, 1, 5, '#f0f0f0');
    rect(ctx, flip ? 12 : 2, 8, 1, 3, '#f0f0f0');
  }

  // Shoes
  if (frame === 0) {
    rect(ctx, 5, 14, 2, 1, '#1a1a1a');
    rect(ctx, 9, 14, 2, 1, '#1a1a1a');
  } else if (frame === 1) {
    rect(ctx, flip ? 7 : 4, 14, 2, 1, '#1a1a1a');
    rect(ctx, flip ? 10 : 7, 14, 2, 1, '#1a1a1a');
  } else {
    rect(ctx, flip ? 10 : 7, 14, 2, 1, '#1a1a1a');
    rect(ctx, flip ? 7 : 4, 14, 2, 1, '#1a1a1a');
  }

  // Lab coat body
  const coatColor = stressLevel >= 2 ? '#e8e8e8' : '#f0f0f0';
  rect(ctx, 4, 6, 8, 7, coatColor);
  if (frame === 0) {
    rect(ctx, 3, 7, 1, 4, coatColor); // left sleeve
    rect(ctx, 12, 7, 1, 4, coatColor); // right sleeve
  }

  // Coat details — buttons, seams, pockets
  rect(ctx, 8, 7, 1, 5, '#e0e0e0'); // center button line
  px(ctx, 8, 8, '#ccc'); // button
  px(ctx, 8, 10, '#ccc'); // button
  rect(ctx, 4, 6, 8, 1, '#e8e8e8'); // collar
  // Collar V-neck
  px(ctx, 7, 6, '#e8b88a');
  px(ctx, 8, 6, '#e8b88a');
  // Lab coat pockets
  rect(ctx, 5, 9, 2, 2, '#e4e4e4');
  rect(ctx, 9, 9, 2, 2, '#e4e4e4');
  // Coat hem shadow
  rect(ctx, 4, 12, 8, 1, '#d8d8d8');

  // Hands
  if (frame === 0) {
    rect(ctx, 3, 11, 1, 1, '#e8b88a');
    rect(ctx, 12, 11, 1, 1, '#e8b88a');
  }

  // Name badge (green) with lanyard
  const badgeSide = flip ? 9 : 5;
  rect(ctx, badgeSide, 8, 2, 2, '#22aa44');
  px(ctx, badgeSide, 7, '#22aa44');
  px(ctx, badgeSide, 6, '#228833');

  // Head
  rect(ctx, 5, 2, 6, 5, '#e8b88a');
  // Ears
  px(ctx, 4, 3, '#e0b080');
  px(ctx, 11, 3, '#e0b080');
  // Hair — fuller
  rect(ctx, 5, 1, 6, 2, '#4a3020');
  rect(ctx, 4, 1, 1, 3, '#4a3020');
  rect(ctx, 11, 1, 1, 3, '#4a3020');
  px(ctx, 5, 1, '#5a4030'); // hair highlight

  // Eyes — direction-aware with stress
  if (facing === 'left') {
    px(ctx, 6, 4, '#222');
    px(ctx, 8, 4, '#222');
    if (stressLevel >= 1) {
      px(ctx, 6, 4, '#333'); // bags under eyes
      px(ctx, 8, 4, '#333');
    }
  } else if (facing === 'right') {
    px(ctx, 7, 4, '#222');
    px(ctx, 9, 4, '#222');
  } else {
    px(ctx, 6, 4, '#222');
    px(ctx, 9, 4, '#222');
  }

  // Eyebrows — show stress
  if (stressLevel >= 1) {
    px(ctx, 6, 3, '#5a4030');
    px(ctx, 9, 3, '#5a4030');
  }
  if (stressLevel >= 2) {
    // Furrowed brows
    px(ctx, 5, 3, '#4a3020');
    px(ctx, 10, 3, '#4a3020');
    // Sweat drop
    px(ctx, 12, 2, '#88ccff');
    px(ctx, 12, 3, '#aaddff');
  }

  // Mouth
  px(ctx, 7, 5, stressLevel >= 2 ? '#c88060' : '#d09070');
  px(ctx, 8, 5, stressLevel >= 2 ? '#c88060' : '#d09070');

  spriteCache.set(key, c);
  return c;
}

// ========== PATIENT SPRITE (16x16) ==========
function drawPatientSprite(paletteIndex, emotionLevel) {
  // emotionLevel: 0=calm, 1=impatient, 2=angry
  const key = getCacheKey('patient', paletteIndex, emotionLevel);
  if (spriteCache.has(key)) return spriteCache.get(key);

  const palette = PATIENT_PALETTES[paletteIndex % PATIENT_PALETTES.length];
  const skin = palette.skin || '#e8b88a';
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(8, 15, 3.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (jeans/pants)
  const pantsColor = paletteIndex % 3 === 0 ? '#3a3a55' : paletteIndex % 3 === 1 ? '#4a4a3a' : '#444466';
  rect(ctx, 5, 12, 2, 3, pantsColor);
  rect(ctx, 9, 12, 2, 3, pantsColor);
  // Shoes
  const shoeColor = paletteIndex % 2 === 0 ? '#2a2a2a' : '#5a3a2a';
  rect(ctx, 5, 14, 2, 1, shoeColor);
  rect(ctx, 9, 14, 2, 1, shoeColor);

  // Body (shirt) with shading
  rect(ctx, 4, 6, 8, 7, palette.shirt);
  // Shirt shadow on sides
  rect(ctx, 4, 6, 1, 7, darkenColor(palette.shirt));
  rect(ctx, 11, 6, 1, 7, darkenColor(palette.shirt));
  // Sleeves
  rect(ctx, 3, 7, 1, 3, palette.shirt);
  rect(ctx, 12, 7, 1, 3, palette.shirt);
  // Collar
  rect(ctx, 6, 6, 4, 1, darkenColor(palette.shirt));
  px(ctx, 7, 6, skin); // neck visible

  // Hands
  px(ctx, 3, 10, skin);
  px(ctx, 12, 10, skin);

  // Head with more shape
  rect(ctx, 5, 2, 6, 5, skin);
  // Chin highlight
  px(ctx, 7, 6, darkenColor(skin));
  px(ctx, 8, 6, darkenColor(skin));
  // Ears
  px(ctx, 4, 3, darkenColor(skin));
  px(ctx, 11, 3, darkenColor(skin));

  // Hair — varied styles based on palette
  const hairStyle = paletteIndex % 4;
  rect(ctx, 5, 1, 6, 2, palette.hair);
  if (hairStyle === 0) {
    // Full hair
    rect(ctx, 4, 1, 1, 3, palette.hair);
    rect(ctx, 11, 1, 1, 3, palette.hair);
    px(ctx, 5, 1, lightenColor(palette.hair));
  } else if (hairStyle === 1) {
    // Short sides
    rect(ctx, 4, 2, 1, 1, palette.hair);
    rect(ctx, 11, 2, 1, 1, palette.hair);
  } else if (hairStyle === 2) {
    // Longer hair
    rect(ctx, 4, 1, 1, 4, palette.hair);
    rect(ctx, 11, 1, 1, 4, palette.hair);
    rect(ctx, 5, 1, 6, 1, lightenColor(palette.hair));
  } else {
    // Buzz cut
    rect(ctx, 5, 1, 6, 1, palette.hair);
  }

  // Eyes
  px(ctx, 6, 4, '#222');
  px(ctx, 9, 4, '#222');

  // Emotion-specific details
  if (emotionLevel === 0) {
    // Calm — small smile
    px(ctx, 7, 5, darkenColor(skin));
    px(ctx, 8, 5, darkenColor(skin));
  } else if (emotionLevel === 1) {
    // Impatient — frown, crossed arms look
    px(ctx, 7, 5, '#aa7755');
    px(ctx, 8, 5, '#aa7755');
    // Slight yellow tinge
    ctx.fillStyle = 'rgba(255, 200, 0, 0.08)';
    ctx.fillRect(0, 0, 16, 16);
    // Furrowed brows
    px(ctx, 5, 3, palette.hair);
    px(ctx, 10, 3, palette.hair);
  } else {
    // Angry — red face, wide mouth
    // Angry tint on skin
    rect(ctx, 5, 2, 6, 5, blendColor(skin, '#ff4444', 0.15));
    // Re-draw eyes (angrier)
    px(ctx, 6, 4, '#111');
    px(ctx, 9, 4, '#111');
    // Angry eyebrows
    px(ctx, 5, 3, '#222');
    px(ctx, 6, 3, '#222');
    px(ctx, 9, 3, '#222');
    px(ctx, 10, 3, '#222');
    // Open mouth
    rect(ctx, 7, 5, 2, 1, '#993333');
    // Red tint on whole sprite
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fillRect(0, 0, 16, 16);
  }

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

  // Bubble background
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 3);
  ctx.fill();
  ctx.stroke();

  // Tail
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 3, h);
  ctx.lineTo(w / 2, h + 5);
  ctx.lineTo(w / 2 + 3, h);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 3, h);
  ctx.lineTo(w / 2, h + 5);
  ctx.lineTo(w / 2 + 3, h);
  ctx.stroke();
  // Cover the gap
  ctx.fillStyle = '#fff';
  ctx.fillRect(w / 2 - 3, h - 1, 6, 2);

  // Text
  ctx.fillStyle = '#222';
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

  // Base floor — slight color variation per tile
  const bases = ['#d4d0c4', '#d6d2c6', '#d2cec2', '#d5d1c5', '#d3cfc3', '#d7d3c7', '#d1cdc1'];
  rect(ctx, 0, 0, 16, 16, bases[variant % bases.length]);

  // VCT tile grid lines (vinyl composite tile — standard pharmacy floor)
  ctx.fillStyle = '#cbc7bb';
  ctx.fillRect(0, 0, 16, 1);
  ctx.fillRect(0, 0, 1, 16);
  // Inner highlight edge
  ctx.fillStyle = '#ddd9cd';
  ctx.fillRect(1, 1, 15, 1);
  ctx.fillRect(1, 1, 1, 15);

  // Scuff marks and wear patterns
  const seed = variant * 13;
  if (seed % 7 === 0) {
    // Dark scuff
    ctx.fillStyle = '#c4c0b4';
    ctx.fillRect(3, 8, 4, 1);
    px(ctx, 4, 9, '#c4c0b4');
  }
  if (seed % 11 === 0) {
    // Light scratch
    ctx.fillStyle = '#d9d5c9';
    ctx.fillRect(6, 4, 1, 5);
  }
  if (seed % 5 === 0) {
    // Speckle cluster
    px(ctx, 4, 7, '#c8c4b8');
    px(ctx, 11, 3, '#ccc8bc');
    px(ctx, 8, 12, '#c8c4b8');
  }
  if (seed % 9 === 0) {
    // Heel mark
    ctx.fillStyle = '#c0bcb0';
    ctx.fillRect(9, 10, 3, 1);
    px(ctx, 10, 11, '#c0bcb0');
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

  // Laminate counter top
  rect(ctx, 0, 0, 16, 16, '#e8e4dc');
  // Subtle grain
  ctx.fillStyle = '#e0dcd4';
  for (let i = 0; i < 16; i += 3) {
    ctx.fillRect(0, i, 16, 1);
  }
  // Edge highlight
  rect(ctx, 0, 0, 16, 1, '#f0ece4');

  spriteCache.set(key, c);
  return c;
}

function drawCounterFrontTile() {
  const key = 'counter_front';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Dark front panel
  rect(ctx, 0, 0, 16, 16, '#5a4a3a');
  // Panel lines
  rect(ctx, 0, 0, 16, 1, '#6a5a4a');
  rect(ctx, 0, 15, 16, 1, '#4a3a2a');
  // Vertical panel details
  rect(ctx, 7, 0, 1, 16, '#504030');
  rect(ctx, 8, 0, 1, 16, '#645444');

  spriteCache.set(key, c);
  return c;
}

function drawShelfTile(row) {
  const key = getCacheKey('shelf', row);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Shelf back panel
  rect(ctx, 0, 0, 16, 16, '#6a5535');
  // Vertical support brackets
  rect(ctx, 0, 0, 1, 16, '#5a4525');
  rect(ctx, 15, 0, 1, 16, '#5a4525');

  // Shelf surfaces (3 shelves)
  rect(ctx, 0, 0, 16, 2, '#8b7355');
  rect(ctx, 0, 1, 16, 1, '#9b8365'); // highlight
  rect(ctx, 0, 7, 16, 2, '#8b7355');
  rect(ctx, 0, 8, 16, 1, '#9b8365');
  rect(ctx, 0, 14, 16, 2, '#8b7355');
  rect(ctx, 0, 15, 16, 1, '#9b8365');

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

  rect(ctx, 0, 0, 16, 16, '#e0dcd4');
  // Drop ceiling grid
  rect(ctx, 0, 15, 16, 1, '#d0ccc4');
  rect(ctx, 15, 0, 1, 16, '#d0ccc4');

  spriteCache.set(key, c);
  return c;
}

function drawBackWallTile(variant) {
  const key = getCacheKey('backwall', variant);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Wall base
  rect(ctx, 0, 0, 16, 16, '#d4d0c8');
  // Baseboard molding
  rect(ctx, 0, 13, 16, 1, '#c0bcb4');
  rect(ctx, 0, 14, 16, 2, '#b0aca4');

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

  // Phone base
  rect(ctx, 3, 8, 10, 6, '#333');
  rect(ctx, 4, 9, 8, 4, '#444');

  // Handset
  if (!ringing) {
    rect(ctx, 3, 6, 10, 3, '#222');
    rect(ctx, 3, 6, 3, 2, '#222');
    rect(ctx, 10, 6, 3, 2, '#222');
  } else {
    // Handset lifted/vibrating
    rect(ctx, 2, 3, 3, 5, '#222');
    rect(ctx, 11, 3, 3, 5, '#222');
    rect(ctx, 4, 3, 8, 2, '#222');
    // Ring indicators
    px(ctx, 1, 2, '#ff8800');
    px(ctx, 14, 2, '#ff8800');
    px(ctx, 0, 1, '#ff8800');
    px(ctx, 15, 1, '#ff8800');
  }

  // Buttons
  for (let r = 0; r < 2; r++) {
    for (let c2 = 0; c2 < 3; c2++) {
      px(ctx, 6 + c2 * 2, 10 + r * 2, '#888');
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

  // Register base
  rect(ctx, 2, 6, 12, 8, '#555');
  // Screen
  rect(ctx, 3, 2, 10, 5, '#333');
  rect(ctx, 4, 3, 8, 3, '#338855');
  // Text on screen
  rect(ctx, 5, 4, 4, 1, '#66cc88');
  // Keypad
  rect(ctx, 3, 8, 4, 4, '#666');
  // Receipt slot
  rect(ctx, 9, 7, 4, 1, '#777');
  // Receipt paper
  rect(ctx, 10, 4, 2, 4, '#fff');

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
  // Windshield
  rect(ctx, 4, 4, 4, 8, '#88aacc');
  // Rear window
  rect(ctx, 18, 5, 3, 6, '#88aacc');
  // Wheels
  rect(ctx, 1, 2, 3, 3, '#222');
  rect(ctx, 1, 11, 3, 3, '#222');
  rect(ctx, 19, 2, 3, 3, '#222');
  rect(ctx, 19, 11, 3, 3, '#222');

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

  // Seat
  rect(ctx, 3, 8, 10, 4, '#666688');
  // Back
  rect(ctx, 3, 4, 10, 5, '#777799');
  rect(ctx, 4, 5, 8, 3, '#555577');
  // Legs
  rect(ctx, 3, 12, 2, 3, '#555');
  rect(ctx, 11, 12, 2, 3, '#555');

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

  // Monitor bezel
  rect(ctx, 2, 2, 12, 9, '#2a2a2a');
  // Screen
  rect(ctx, 3, 3, 10, 7, '#1a3a5a');
  // Screen content — Rx software
  rect(ctx, 4, 4, 8, 1, '#2a5a8a');
  rect(ctx, 4, 6, 5, 0.5, '#3a7aaa');
  rect(ctx, 4, 7, 6, 0.5, '#3a7aaa');
  rect(ctx, 4, 8, 4, 0.5, '#3a7aaa');
  // Screen glow
  px(ctx, 10, 4, '#44ff88');
  // Stand
  rect(ctx, 6, 11, 4, 2, '#3a3a3a');
  // Base
  rect(ctx, 4, 13, 8, 1, '#4a4a4a');
  // Power LED
  px(ctx, 8, 10, '#44cc66');

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

  // Bin body — tapers slightly
  rect(ctx, 4, 5, 9, 10, '#5a5a6a');
  rect(ctx, 5, 5, 7, 10, '#6a6a7a');
  // Lid
  rect(ctx, 3, 3, 11, 3, '#7a7a8a');
  rect(ctx, 4, 2, 9, 1, '#8a8a9a');
  // Swing flap
  rect(ctx, 5, 3, 7, 1, '#6a6a7a');
  // Foot pedal
  rect(ctx, 5, 15, 4, 1, '#4a4a5a');
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
