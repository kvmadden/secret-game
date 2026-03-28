/**
 * Vehicle pixel art sprites for drive-thru pharmacy.
 * All sprites drawn programmatically on canvas, 32x16 base (bicycle 16x16).
 */
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

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function darkenColor(hex) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 30);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 30);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 30);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const OL = '#3a2820';
const WS = '#334455';
const TR = '#2a2a2a';

function shadow(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(x + 1, y + 1, w, h);
}

function tires4(ctx, fx, fy, rx, ry, tw, th) {
  tw = tw || 4; th = th || 2;
  rect(ctx, fx, fy, tw, th, TR);
  rect(ctx, fx, fy + 14 - (th > 2 ? 0 : 0), tw, th, TR);
  rect(ctx, rx, fy, tw, th, TR);
  rect(ctx, rx, fy + 14 - (th > 2 ? 0 : 0), tw, th, TR);
}

function lights(ctx, fx, rx, y1, y2, lh) {
  lh = lh || 1;
  rect(ctx, fx, y1, 1, lh, '#ffffaa');
  rect(ctx, fx, y2, 1, lh, '#ffffaa');
  rect(ctx, rx, y1, 1, lh, '#cc2222');
  rect(ctx, rx, y2, 1, lh, '#cc2222');
}

// ========== SEDAN (32x16) ==========
function drawSedan(color) {
  color = color || '#4466aa';
  const key = getCacheKey('sedan', color);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(32, 16);
  const ctx = c.getContext('2d');
  shadow(ctx, 3, 3, 26, 11);
  rect(ctx, 3, 2, 26, 12, color);
  rect(ctx, 3, 2, 26, 1, OL);
  rect(ctx, 3, 13, 26, 1, OL);
  rect(ctx, 8, 4, 16, 8, darkenColor(color));
  rect(ctx, 5, 4, 4, 8, WS);
  rect(ctx, 23, 5, 3, 6, WS);
  rect(ctx, 10, 4, 6, 1, WS);
  rect(ctx, 10, 11, 6, 1, WS);
  px(ctx, 3, 4, '#ffffaa'); px(ctx, 3, 11, '#ffffaa');
  px(ctx, 28, 4, '#cc2222'); px(ctx, 28, 11, '#cc2222');
  rect(ctx, 4, 1, 3, 2, TR); rect(ctx, 4, 13, 3, 2, TR);
  rect(ctx, 25, 1, 3, 2, TR); rect(ctx, 25, 13, 3, 2, TR);
  spriteCache.set(key, c);
  return c;
}

// ========== SUV (32x16) ==========
function drawSuv(color) {
  color = color || '#556b2f';
  const key = getCacheKey('suv', color);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(32, 16);
  const ctx = c.getContext('2d');
  shadow(ctx, 2, 2, 28, 13);
  rect(ctx, 2, 1, 28, 14, color);
  rect(ctx, 2, 1, 28, 1, OL);
  rect(ctx, 2, 14, 28, 1, OL);
  rect(ctx, 6, 3, 20, 10, darkenColor(color));
  rect(ctx, 4, 3, 3, 10, WS);
  rect(ctx, 25, 4, 3, 8, WS);
  rect(ctx, 8, 3, 5, 1, WS); rect(ctx, 14, 3, 5, 1, WS);
  rect(ctx, 8, 12, 5, 1, WS); rect(ctx, 14, 12, 5, 1, WS);
  rect(ctx, 10, 5, 10, 1, '#888888');
  rect(ctx, 10, 10, 10, 1, '#888888');
  lights(ctx, 2, 29, 3, 11, 2);
  rect(ctx, 3, 0, 4, 2, TR); rect(ctx, 3, 14, 4, 2, TR);
  rect(ctx, 25, 0, 4, 2, TR); rect(ctx, 25, 14, 4, 2, TR);
  spriteCache.set(key, c);
  return c;
}

// ========== PICKUP TRUCK (32x16) ==========
function drawPickup(color) {
  color = color || '#8b4513';
  const key = getCacheKey('pickup', color);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(32, 16);
  const ctx = c.getContext('2d');
  shadow(ctx, 2, 2, 28, 12);
  rect(ctx, 16, 2, 14, 12, color);
  rect(ctx, 17, 3, 12, 10, darkenColor(color));
  rect(ctx, 18, 4, 10, 8, '#8a7a6a');
  rect(ctx, 2, 2, 15, 12, color);
  rect(ctx, 2, 2, 28, 1, OL);
  rect(ctx, 2, 13, 28, 1, OL);
  rect(ctx, 5, 4, 10, 8, darkenColor(color));
  rect(ctx, 3, 4, 3, 8, WS);
  rect(ctx, 14, 5, 2, 6, WS);
  px(ctx, 2, 4, '#ffffaa'); px(ctx, 2, 11, '#ffffaa');
  px(ctx, 29, 4, '#cc2222'); px(ctx, 29, 11, '#cc2222');
  rect(ctx, 4, 1, 4, 2, TR); rect(ctx, 4, 13, 4, 2, TR);
  rect(ctx, 24, 1, 4, 2, TR); rect(ctx, 24, 13, 4, 2, TR);
  spriteCache.set(key, c);
  return c;
}

// ========== MINIVAN (32x16) ==========
function drawMinivan(color) {
  color = color || '#7788aa';
  const key = getCacheKey('minivan', color);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(32, 16);
  const ctx = c.getContext('2d');
  shadow(ctx, 2, 2, 28, 13);
  rect(ctx, 2, 1, 28, 14, color);
  rect(ctx, 2, 1, 28, 1, OL);
  rect(ctx, 2, 14, 28, 1, OL);
  rect(ctx, 5, 3, 22, 10, darkenColor(color));
  rect(ctx, 3, 3, 3, 10, WS);
  rect(ctx, 26, 4, 2, 8, WS);
  // Three side window panes per side
  for (let sx = 7; sx <= 17; sx += 5) {
    rect(ctx, sx, 3, 4, 1, WS);
    rect(ctx, sx, 12, 4, 1, WS);
  }
  px(ctx, 13, 2, OL); px(ctx, 13, 13, OL);
  lights(ctx, 2, 29, 3, 11, 2);
  rect(ctx, 4, 0, 4, 2, TR); rect(ctx, 4, 14, 4, 2, TR);
  rect(ctx, 24, 0, 4, 2, TR); rect(ctx, 24, 14, 4, 2, TR);
  spriteCache.set(key, c);
  return c;
}

// ========== SPORTS CAR (32x16) ==========
function drawSportsCar(color) {
  color = color || '#cc2233';
  const key = getCacheKey('sportsCar', color);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(32, 16);
  const ctx = c.getContext('2d');
  shadow(ctx, 3, 3, 26, 10);
  rect(ctx, 3, 3, 26, 10, color);
  rect(ctx, 3, 3, 26, 1, OL);
  rect(ctx, 3, 12, 26, 1, OL);
  rect(ctx, 10, 5, 12, 6, darkenColor(color));
  rect(ctx, 6, 5, 4, 6, WS);
  rect(ctx, 22, 6, 2, 4, WS);
  rect(ctx, 3, 7, 26, 2, darkenColor(darkenColor(color)));
  rect(ctx, 3, 4, 2, 2, '#ffffcc'); rect(ctx, 3, 10, 2, 2, '#ffffcc');
  rect(ctx, 28, 4, 1, 2, '#cc2222'); rect(ctx, 28, 10, 1, 2, '#cc2222');
  px(ctx, 29, 7, '#555555'); px(ctx, 29, 8, '#555555');
  rect(ctx, 5, 2, 4, 2, TR); rect(ctx, 5, 12, 4, 2, TR);
  rect(ctx, 23, 2, 4, 2, TR); rect(ctx, 23, 12, 4, 2, TR);
  spriteCache.set(key, c);
  return c;
}

// ========== DELIVERY VAN (32x16) ==========
function drawDeliveryVan() {
  const key = 'deliveryVan';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(32, 16);
  const ctx = c.getContext('2d');
  shadow(ctx, 1, 1, 30, 14);
  rect(ctx, 1, 1, 30, 14, '#e8e8e8');
  rect(ctx, 1, 1, 30, 1, OL); rect(ctx, 1, 14, 30, 1, OL);
  rect(ctx, 1, 1, 1, 14, OL); rect(ctx, 30, 1, 1, 14, OL);
  rect(ctx, 2, 2, 8, 12, '#dcdcdc');
  rect(ctx, 2, 3, 3, 10, WS);
  rect(ctx, 10, 2, 1, 12, '#bbbbbb');
  // "Rx" lettering
  const rx = '#2255aa';
  px(ctx, 17, 5, rx); px(ctx, 17, 6, rx); px(ctx, 17, 7, rx); px(ctx, 17, 8, rx);
  px(ctx, 18, 5, rx); px(ctx, 19, 6, rx); px(ctx, 18, 7, rx); px(ctx, 19, 8, rx);
  px(ctx, 21, 6, rx); px(ctx, 23, 6, rx); px(ctx, 22, 7, rx);
  px(ctx, 21, 8, rx); px(ctx, 23, 8, rx);
  lights(ctx, 1, 30, 3, 11, 2);
  rect(ctx, 3, 0, 4, 2, TR); rect(ctx, 3, 14, 4, 2, TR);
  rect(ctx, 25, 0, 4, 2, TR); rect(ctx, 25, 14, 4, 2, TR);
  spriteCache.set(key, c);
  return c;
}

// ========== AMBULANCE (32x16) ==========
function drawAmbulance() {
  const key = 'ambulance';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(32, 16);
  const ctx = c.getContext('2d');
  shadow(ctx, 1, 1, 30, 14);
  rect(ctx, 1, 1, 30, 14, '#f0f0f0');
  rect(ctx, 1, 1, 30, 1, OL); rect(ctx, 1, 14, 30, 1, OL);
  rect(ctx, 10, 2, 18, 2, '#dd3333');
  rect(ctx, 10, 12, 18, 2, '#dd3333');
  rect(ctx, 2, 2, 8, 12, '#e4e4e4');
  rect(ctx, 2, 3, 3, 10, WS);
  // Cross symbols on each side
  const cr = '#dd3333';
  px(ctx, 20, 6, cr); rect(ctx, 19, 7, 3, 1, cr); px(ctx, 20, 8, cr);
  px(ctx, 20, 9, cr); rect(ctx, 19, 9, 3, 1, cr);
  // Emergency lights
  rect(ctx, 4, 4, 2, 2, '#ff3333');
  rect(ctx, 4, 10, 2, 2, '#3333ff');
  lights(ctx, 1, 30, 3, 11, 2);
  rect(ctx, 3, 0, 4, 2, TR); rect(ctx, 3, 14, 4, 2, TR);
  rect(ctx, 25, 0, 4, 2, TR); rect(ctx, 25, 14, 4, 2, TR);
  spriteCache.set(key, c);
  return c;
}

// ========== BICYCLE (16x16) ==========
function drawBicycle() {
  const key = 'bicycle';
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  // Front wheel
  px(ctx, 3, 5, TR); rect(ctx, 2, 6, 3, 1, TR);
  px(ctx, 1, 7, TR); px(ctx, 5, 7, TR);
  rect(ctx, 2, 8, 3, 1, TR); px(ctx, 3, 9, TR);
  // Rear wheel
  px(ctx, 12, 5, TR); rect(ctx, 11, 6, 3, 1, TR);
  px(ctx, 10, 7, TR); px(ctx, 14, 7, TR);
  rect(ctx, 11, 8, 3, 1, TR); px(ctx, 12, 9, TR);
  // Frame
  const fm = '#3388cc';
  rect(ctx, 4, 7, 7, 1, fm);
  px(ctx, 5, 6, fm); px(ctx, 6, 5, fm); px(ctx, 7, 6, fm);
  px(ctx, 10, 5, fm); px(ctx, 10, 4, fm);
  // Seat
  rect(ctx, 9, 3, 3, 1, '#5a3820');
  // Handlebars
  rect(ctx, 2, 4, 3, 1, '#888888'); px(ctx, 3, 3, '#888888');
  // Pedals
  px(ctx, 7, 8, '#888888'); px(ctx, 8, 8, '#888888');
  spriteCache.set(key, c);
  return c;
}

export const SpriteVehicles = {
  sedan: drawSedan,
  suv: drawSuv,
  pickup: drawPickup,
  minivan: drawMinivan,
  sportsCar: drawSportsCar,
  deliveryVan: drawDeliveryVan,
  ambulance: drawAmbulance,
  bicycle: drawBicycle,
};
