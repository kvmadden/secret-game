/**
 * Pharmacy item sprites - drawn programmatically on canvas (16x16 pixel art).
 * Used for in-game pickup items, inventory icons, and UI elements.
 */

const spriteCache = new Map();

function getCacheKey(name, ...args) {
  return `${name}_${args.join('_')}`;
}

function createSpriteCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
}

// === PALETTE ===
const O = '#3a2820';
const WHITE = '#f4f0e8';
const CREAM = '#e8e4dc';
const MED_BLUE = '#4488cc';
const MED_RED = '#cc4444';
const LABEL_YEL = '#e8d870';
const LABEL_DARK = '#c8b850';
const SILVER = '#c0c0c8';
const SILVER_HI = '#d8d8e0';
const SILVER_LO = '#9898a0';
const GREEN = '#4a9a5a';

// ========== 1. PILL BOTTLE (16x16) ==========
function drawPillBottle(color) {
  color = color || '#e07030';
  const key = getCacheKey('pillBottle', color);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  // Cap
  rect(ctx, 5, 1, 6, 3, color);
  rect(ctx, 5, 1, 6, 1, O);
  px(ctx, 4, 2, O); px(ctx, 11, 2, O);
  px(ctx, 4, 3, O); px(ctx, 11, 3, O);
  rect(ctx, 6, 2, 2, 1, '#ffffff40');
  // Bottle body
  rect(ctx, 4, 4, 8, 10, CREAM);
  for (let y = 4; y < 14; y++) { px(ctx, 3, y, O); px(ctx, 12, y, O); }
  rect(ctx, 4, 14, 8, 1, O);
  rect(ctx, 4, 4, 8, 1, '#d0ccc4');
  // Label with Rx
  rect(ctx, 5, 7, 6, 4, LABEL_YEL);
  rect(ctx, 5, 7, 6, 1, LABEL_DARK);
  px(ctx, 6, 8, MED_BLUE); px(ctx, 7, 8, MED_BLUE); px(ctx, 6, 9, MED_BLUE);
  rect(ctx, 5, 10, 4, 1, '#a0a090');
  rect(ctx, 11, 5, 1, 8, '#d0ccc4');
  spriteCache.set(key, c);
  return c;
}

// ========== 2. BLISTER PACK (16x16) ==========
function drawBlisterPack() {
  const key = getCacheKey('blisterPack');
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  // Foil base
  rect(ctx, 1, 3, 14, 10, SILVER);
  rect(ctx, 1, 3, 14, 1, SILVER_HI);
  rect(ctx, 1, 12, 14, 1, SILVER_LO);
  for (let y = 3; y <= 12; y++) { px(ctx, 0, y, O); px(ctx, 15, y, O); }
  rect(ctx, 1, 2, 14, 1, O);
  rect(ctx, 1, 13, 14, 1, O);
  // Pill bubbles (2 rows of 4)
  const pc = ['#e06060','#e06060','#f0f0e8','#e06060','#f0f0e8','#e06060','#f0f0e8','#e06060'];
  let idx = 0;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const bx = 2 + col * 3, by = 4 + row * 4;
      rect(ctx, bx, by, 2, 2, pc[idx]);
      px(ctx, bx, by, SILVER_HI);
      px(ctx, bx - 1, by + 1, SILVER_LO); px(ctx, bx + 2, by + 1, SILVER_LO);
      px(ctx, bx, by + 2, SILVER_LO); px(ctx, bx + 1, by + 2, SILVER_LO);
      idx++;
    }
  }
  for (let x = 2; x < 14; x += 3) { px(ctx, x, 12, SILVER_HI); }
  spriteCache.set(key, c);
  return c;
}

// ========== 3. RX BAG (16x16) ==========
function drawRxBag(size) {
  size = size || 'small';
  const key = getCacheKey('rxBag', size);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  const isLg = size === 'large';
  const bx = isLg ? 1 : 3, bw = isLg ? 14 : 10;
  const by = isLg ? 1 : 3, bh = isLg ? 14 : 12;
  // Bag body
  rect(ctx, bx, by, bw, bh, WHITE);
  for (let y = by; y < by + bh; y++) { px(ctx, bx - 1, y, O); px(ctx, bx + bw, y, O); }
  rect(ctx, bx, by - 1, bw, 1, O);
  rect(ctx, bx, by + bh, bw, 1, O);
  // Folded top
  rect(ctx, bx, by, bw, 2, CREAM);
  rect(ctx, bx, by + 1, bw, 1, '#d4d0c8');
  // Rx symbol (centered)
  const cx = bx + Math.floor(bw / 2) - 2, cy = by + Math.floor(bh / 2) - 1;
  px(ctx, cx, cy, MED_BLUE); px(ctx, cx, cy+1, MED_BLUE); px(ctx, cx, cy+2, MED_BLUE);
  px(ctx, cx+1, cy, MED_BLUE); px(ctx, cx+1, cy+1, MED_BLUE);
  px(ctx, cx+2, cy+2, MED_BLUE); px(ctx, cx+2, cy+1, MED_BLUE);
  px(ctx, cx+3, cy, MED_BLUE); px(ctx, cx+3, cy+2, MED_BLUE);
  rect(ctx, bx + bw - 1, by + 2, 1, bh - 3, '#dcd8d0');
  spriteCache.set(key, c);
  return c;
}

// ========== 4. SYRINGE (16x16) ==========
function drawSyringe() {
  const key = getCacheKey('syringe');
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  // Barrel
  rect(ctx, 3, 6, 9, 4, WHITE);
  rect(ctx, 3, 6, 9, 1, '#e8e8e8');
  rect(ctx, 2, 5, 11, 1, O);
  rect(ctx, 2, 10, 11, 1, O);
  px(ctx, 2, 6, O); px(ctx, 2, 7, O); px(ctx, 2, 8, O); px(ctx, 2, 9, O);
  for (let x = 4; x < 11; x += 2) { px(ctx, x, 7, '#a0a0b0'); }
  rect(ctx, 4, 8, 6, 1, '#88c8e8');
  // Needle
  rect(ctx, 12, 7, 3, 2, SILVER);
  px(ctx, 15, 7, SILVER_HI);
  px(ctx, 12, 7, O); px(ctx, 12, 8, O);
  // Plunger
  rect(ctx, 1, 7, 2, 2, '#a0a0a8');
  px(ctx, 0, 7, O); px(ctx, 0, 8, O);
  px(ctx, 2, 5, SILVER); px(ctx, 2, 10, SILVER);
  spriteCache.set(key, c);
  return c;
}

// ========== 5. INHALER (16x16) ==========
function drawInhaler(color) {
  color = color || MED_BLUE;
  const key = getCacheKey('inhaler', color);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  // L-shaped body
  rect(ctx, 4, 2, 6, 8, color);
  rect(ctx, 4, 10, 8, 4, color);
  rect(ctx, 5, 3, 1, 6, '#ffffff30');
  // Mouthpiece
  rect(ctx, 10, 10, 3, 4, '#d0d0d0');
  rect(ctx, 13, 11, 1, 2, '#b0b0b0');
  // Outline
  for (let y = 2; y < 10; y++) { px(ctx, 3, y, O); px(ctx, 10, y, O); }
  rect(ctx, 4, 1, 6, 1, O);
  for (let y = 10; y < 14; y++) { px(ctx, 3, y, O); }
  rect(ctx, 4, 14, 10, 1, O);
  px(ctx, 14, 11, O); px(ctx, 14, 12, O); px(ctx, 13, 10, O);
  // Cap
  rect(ctx, 5, 2, 4, 2, '#e0e0e0');
  rect(ctx, 5, 2, 4, 1, SILVER_HI);
  // Label stripe
  rect(ctx, 5, 6, 4, 1, WHITE);
  rect(ctx, 5, 7, 4, 1, LABEL_YEL);
  spriteCache.set(key, c);
  return c;
}

// ========== 6. EYE DROPS (16x16) ==========
function drawEyeDrops() {
  const key = getCacheKey('eyeDrops');
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  // Dropper tip
  rect(ctx, 7, 1, 2, 3, '#d0d0d8');
  px(ctx, 7, 1, SILVER_HI);
  px(ctx, 6, 2, O); px(ctx, 9, 2, O);
  rect(ctx, 7, 0, 2, 1, O);
  // Squeeze cap
  rect(ctx, 6, 3, 4, 2, WHITE);
  px(ctx, 5, 3, O); px(ctx, 10, 3, O);
  px(ctx, 5, 4, O); px(ctx, 10, 4, O);
  // Bottle body
  rect(ctx, 5, 5, 6, 8, WHITE);
  for (let y = 5; y < 13; y++) { px(ctx, 4, y, O); px(ctx, 11, y, O); }
  rect(ctx, 5, 13, 6, 1, O);
  // Label
  rect(ctx, 6, 7, 4, 3, MED_BLUE);
  rect(ctx, 6, 7, 4, 1, '#5598dd');
  px(ctx, 7, 8, WHITE); px(ctx, 8, 8, WHITE); px(ctx, 7, 9, '#2060a0');
  rect(ctx, 5, 6, 1, 6, '#fafaf4');
  // Drop falling
  px(ctx, 7, 14, '#88c8e8'); px(ctx, 8, 15, '#88c8e8');
  spriteCache.set(key, c);
  return c;
}

// ========== 7. BANDAGE BOX (16x16) ==========
function drawBandageBox() {
  const key = getCacheKey('bandageBox');
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  // Box body
  rect(ctx, 1, 3, 14, 10, '#e8ddd0');
  for (let y = 3; y <= 12; y++) { px(ctx, 0, y, O); px(ctx, 15, y, O); }
  rect(ctx, 1, 2, 14, 1, O);
  rect(ctx, 1, 13, 14, 1, O);
  rect(ctx, 1, 5, 14, 1, '#c8b8a8');
  // Red cross
  rect(ctx, 7, 6, 2, 6, MED_RED);
  rect(ctx, 5, 8, 6, 2, MED_RED);
  rect(ctx, 2, 3, 12, 1, '#f0ece4');
  rect(ctx, 2, 12, 5, 1, '#b0a898');
  rect(ctx, 14, 4, 1, 8, '#d0c4b8');
  spriteCache.set(key, c);
  return c;
}

// ========== 8. THERMOMETER (16x16) ==========
function drawThermometer() {
  const key = getCacheKey('thermometer');
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  // Body
  rect(ctx, 6, 1, 4, 11, WHITE);
  for (let y = 1; y < 12; y++) { px(ctx, 5, y, O); px(ctx, 10, y, O); }
  rect(ctx, 6, 0, 4, 1, O);
  // Display
  rect(ctx, 7, 2, 2, 3, '#c8e8c8');
  px(ctx, 7, 3, '#308030'); px(ctx, 8, 3, '#308030');
  px(ctx, 7, 6, '#a0a0a8');
  // Sensor tip
  rect(ctx, 6, 12, 4, 2, SILVER);
  rect(ctx, 7, 14, 2, 1, SILVER_LO);
  rect(ctx, 6, 14, 4, 1, O);
  px(ctx, 7, 15, O); px(ctx, 8, 15, O);
  px(ctx, 6, 2, '#fafaf4'); px(ctx, 6, 3, '#fafaf4');
  spriteCache.set(key, c);
  return c;
}

// ========== 9. INSURANCE CARD (16x16) ==========
function drawInsuranceCard() {
  const key = getCacheKey('insuranceCard');
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  // Card body
  rect(ctx, 1, 4, 14, 9, WHITE);
  for (let y = 4; y <= 12; y++) { px(ctx, 0, y, O); px(ctx, 15, y, O); }
  rect(ctx, 1, 3, 14, 1, O);
  rect(ctx, 1, 13, 14, 1, O);
  // Blue header stripe
  rect(ctx, 1, 4, 14, 2, MED_BLUE);
  rect(ctx, 3, 4, 4, 1, '#6aa8dd');
  // Info lines
  rect(ctx, 2, 7, 8, 1, '#a0a0a0');
  rect(ctx, 2, 9, 10, 1, '#b0b0b0');
  rect(ctx, 2, 11, 6, 1, '#b0b0b0');
  // Logo
  rect(ctx, 12, 7, 2, 2, GREEN);
  px(ctx, 12, 7, '#60b870');
  rect(ctx, 14, 5, 1, 7, '#dcd8d0');
  spriteCache.set(key, c);
  return c;
}

// ========== 10. PRESCRIPTION PAPER (16x16) ==========
function drawPrescriptionPaper() {
  const key = getCacheKey('prescriptionPaper');
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  // Paper body
  rect(ctx, 2, 1, 12, 14, WHITE);
  for (let y = 1; y < 15; y++) { px(ctx, 1, y, O); px(ctx, 14, y, O); }
  rect(ctx, 2, 0, 12, 1, O);
  rect(ctx, 2, 15, 12, 1, O);
  rect(ctx, 3, 2, 10, 1, '#c0c0c0');
  // Rx symbol
  px(ctx, 3, 4, MED_BLUE); px(ctx, 3, 5, MED_BLUE); px(ctx, 3, 6, MED_BLUE);
  px(ctx, 4, 4, MED_BLUE); px(ctx, 4, 5, MED_BLUE);
  px(ctx, 5, 5, MED_BLUE); px(ctx, 5, 6, MED_BLUE);
  // Scribbled text lines
  rect(ctx, 3, 8, 8, 1, '#808080');
  px(ctx, 6, 8, WHITE);
  rect(ctx, 4, 10, 7, 1, '#909090');
  px(ctx, 8, 10, WHITE);
  rect(ctx, 3, 12, 5, 1, '#808080');
  // Signature
  px(ctx, 7, 13, '#505050'); px(ctx, 8, 13, '#505050');
  px(ctx, 9, 13, '#505050'); px(ctx, 10, 14, '#505050'); px(ctx, 11, 13, '#505050');
  rect(ctx, 7, 14, 6, 1, '#c0c0c0');
  rect(ctx, 13, 2, 1, 12, CREAM);
  spriteCache.set(key, c);
  return c;
}

export const SpriteItems = {
  pillBottle: drawPillBottle,
  blisterPack: drawBlisterPack,
  rxBag: drawRxBag,
  syringe: drawSyringe,
  inhaler: drawInhaler,
  eyeDrops: drawEyeDrops,
  bandageBox: drawBandageBox,
  thermometer: drawThermometer,
  insuranceCard: drawInsuranceCard,
  prescriptionPaper: drawPrescriptionPaper,
};
