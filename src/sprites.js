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
function drawPharmacistFrame(facing, frame) {
  const key = getCacheKey('pharmacist', facing, frame);
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  const flip = facing === 'left';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(8, 15, 4, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (dark pants)
  const legOffset = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  rect(ctx, 5, 12, 2, 3, '#2a2a3a'); // left leg
  rect(ctx, 9, 12, 2, 3, '#2a2a3a'); // right leg
  if (frame === 1) {
    rect(ctx, flip ? 9 : 5, 12, 2, 3, '#2a2a3a');
    rect(ctx, flip ? 5 : 9, 13, 2, 2, '#2a2a3a');
  } else if (frame === 2) {
    rect(ctx, flip ? 5 : 9, 12, 2, 3, '#2a2a3a');
    rect(ctx, flip ? 9 : 5, 13, 2, 2, '#2a2a3a');
  }

  // Shoes
  rect(ctx, 5, 14, 2, 1, '#1a1a1a');
  rect(ctx, 9, 14, 2, 1, '#1a1a1a');

  // Lab coat body (white!)
  rect(ctx, 4, 6, 8, 7, '#f0f0f0'); // main coat
  rect(ctx, 3, 7, 1, 4, '#f0f0f0'); // left sleeve
  rect(ctx, 12, 7, 1, 4, '#f0f0f0'); // right sleeve
  // Coat details
  rect(ctx, 8, 7, 1, 5, '#e0e0e0'); // center line (buttons)
  rect(ctx, 4, 6, 8, 1, '#e8e8e8'); // collar line
  // Coat shadow
  rect(ctx, 4, 12, 8, 1, '#ddd');

  // Hands (skin)
  rect(ctx, 3, 11, 1, 1, '#e8b88a');
  rect(ctx, 12, 11, 1, 1, '#e8b88a');

  // Name badge (green lanyard)
  if (!flip) {
    rect(ctx, 5, 8, 2, 2, '#22aa44');
    rect(ctx, 5, 7, 1, 1, '#22aa44'); // lanyard
  } else {
    rect(ctx, 9, 8, 2, 2, '#22aa44');
    rect(ctx, 10, 7, 1, 1, '#22aa44');
  }

  // Head
  rect(ctx, 5, 2, 6, 5, '#e8b88a'); // face
  // Hair
  rect(ctx, 5, 1, 6, 2, '#4a3020'); // top hair
  rect(ctx, 4, 2, 1, 2, '#4a3020'); // side hair left
  rect(ctx, 11, 2, 1, 2, '#4a3020'); // side hair right

  // Eyes
  if (facing === 'left') {
    px(ctx, 6, 4, '#222');
    px(ctx, 8, 4, '#222');
  } else if (facing === 'right') {
    px(ctx, 7, 4, '#222');
    px(ctx, 9, 4, '#222');
  } else {
    px(ctx, 6, 4, '#222');
    px(ctx, 9, 4, '#222');
  }

  spriteCache.set(key, c);
  return c;
}

// ========== PATIENT SPRITE (16x16) ==========
function drawPatientSprite(paletteIndex, emotionLevel) {
  // emotionLevel: 0=calm, 1=impatient, 2=angry
  const key = getCacheKey('patient', paletteIndex, emotionLevel);
  if (spriteCache.has(key)) return spriteCache.get(key);

  const palette = PATIENT_PALETTES[paletteIndex % PATIENT_PALETTES.length];
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Tint for emotion
  const tints = ['', '#ffff0033', '#ff000044'];

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(8, 15, 3.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  rect(ctx, 5, 12, 2, 3, '#444466');
  rect(ctx, 9, 12, 2, 3, '#444466');
  rect(ctx, 5, 14, 2, 1, '#333');
  rect(ctx, 9, 14, 2, 1, '#333');

  // Body (shirt)
  rect(ctx, 4, 6, 8, 7, palette.shirt);
  rect(ctx, 3, 7, 1, 3, palette.shirt);
  rect(ctx, 12, 7, 1, 3, palette.shirt);

  // Head
  const skinTones = ['#e8b88a', '#d4a574', '#c49060', '#8b6240', '#e8c8a0'];
  const skin = skinTones[paletteIndex % skinTones.length];
  rect(ctx, 5, 2, 6, 5, skin);

  // Hair
  rect(ctx, 5, 1, 6, 2, palette.hair);
  rect(ctx, 4, 2, 1, 1, palette.hair);
  rect(ctx, 11, 2, 1, 1, palette.hair);

  // Eyes
  px(ctx, 6, 4, '#222');
  px(ctx, 9, 4, '#222');

  // Emotion overlay
  if (emotionLevel >= 1) {
    ctx.fillStyle = 'rgba(255, 200, 0, 0.15)';
    ctx.fillRect(0, 0, 16, 16);
  }
  if (emotionLevel >= 2) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.fillRect(0, 0, 16, 16);
    // Angry eyebrows
    rect(ctx, 5, 3, 2, 1, '#222');
    rect(ctx, 9, 3, 2, 1, '#222');
  }

  spriteCache.set(key, c);
  return c;
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

  // Base floor color
  const base = variant % 2 === 0 ? '#d8d4c8' : '#d4d0c4';
  rect(ctx, 0, 0, 16, 16, base);

  // Subtle tile grid lines
  ctx.fillStyle = '#ccc8bc';
  ctx.fillRect(0, 0, 16, 1);
  ctx.fillRect(0, 0, 1, 16);

  // Random speckle
  if (variant % 3 === 0) {
    px(ctx, 4, 7, '#ccc');
    px(ctx, 11, 3, '#ccc');
  }
  if (variant % 5 === 0) {
    px(ctx, 8, 12, '#c8c4b8');
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

  // Shelf back
  rect(ctx, 0, 0, 16, 16, '#7a6545');

  // Shelf brackets
  rect(ctx, 0, 0, 16, 2, '#8b7355');
  rect(ctx, 0, 7, 16, 2, '#8b7355');
  rect(ctx, 0, 14, 16, 2, '#8b7355');

  // Medicine bottles on shelves
  const colors = ['#c8884a', '#d4a060', '#ffffff', '#e8e0d0', '#c8884a', '#aaa'];
  for (let shelf = 0; shelf < 2; shelf++) {
    const sy = shelf === 0 ? 2 : 9;
    for (let i = 0; i < 5; i++) {
      const bx = 1 + i * 3;
      const bh = 3 + (((row * 7 + i + shelf * 3) % 3));
      const col = colors[((row + i + shelf) * 3) % colors.length];
      rect(ctx, bx, sy + (5 - bh), 2, bh, col);
      // Cap
      rect(ctx, bx, sy + (5 - bh), 2, 1, '#ddd');
    }
  }

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

  rect(ctx, 0, 0, 16, 16, '#d8d4cc');
  // Baseboard
  rect(ctx, 0, 14, 16, 2, '#b8b4ac');

  if (variant % 4 === 0) {
    // Clipboard
    rect(ctx, 5, 3, 6, 8, '#c8a060');
    rect(ctx, 6, 4, 4, 6, '#fff');
    rect(ctx, 7, 5, 2, 1, '#aaa');
    rect(ctx, 7, 7, 2, 1, '#aaa');
  }
  if (variant % 4 === 1) {
    // Fridge
    rect(ctx, 2, 1, 12, 14, '#ccc');
    rect(ctx, 3, 2, 10, 6, '#ddf');
    rect(ctx, 3, 9, 10, 5, '#ddf');
    rect(ctx, 13, 5, 1, 3, '#999');
    rect(ctx, 13, 11, 1, 2, '#999');
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
};
