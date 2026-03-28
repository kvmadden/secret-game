/**
 * Pharmacy furniture & fixture sprites - 16x16 pixel art drawn programmatically.
 * Complements sprites.js with additional interior decoration pieces.
 */
const spriteCache = new Map();
function getCacheKey(name, ...args) { return `${name}_${args.join('_')}`; }
function createSpriteCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}
function px(ctx, x, y, color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
function rect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }

// ========== FILING CABINET (16x16) ==========
function drawFilingCabinet() {
  const key = getCacheKey('filingCabinet');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  rect(ctx, 2, 1, 12, 14, '#3a2820');   // outline
  rect(ctx, 3, 2, 10, 12, '#aaa');      // body
  rect(ctx, 3, 2, 10, 4, '#ccc');       // drawer 1
  rect(ctx, 3, 6, 10, 1, '#888');       // divider
  rect(ctx, 3, 7, 10, 4, '#bbb');       // drawer 2
  rect(ctx, 3, 11, 10, 1, '#888');      // divider
  rect(ctx, 3, 12, 10, 2, '#ccc');      // drawer 3
  rect(ctx, 7, 3, 2, 1, '#666');        // handle 1
  rect(ctx, 7, 8, 2, 1, '#666');        // handle 2
  rect(ctx, 7, 13, 2, 1, '#666');       // handle 3
  rect(ctx, 3, 2, 10, 1, '#ddd');       // top highlight
  rect(ctx, 2, 15, 12, 1, 'rgba(0,0,0,0.15)');

  spriteCache.set(key, c);
  return c;
}

// ========== FRIDGE UNIT (16x16) ==========
function drawFridgeUnit() {
  const key = getCacheKey('fridgeUnit');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  rect(ctx, 1, 0, 14, 16, '#3a2820');   // outline
  rect(ctx, 2, 1, 12, 14, '#f0f0f0');   // body
  rect(ctx, 3, 2, 10, 11, '#c8dce8');   // glass door
  rect(ctx, 4, 3, 2, 8, 'rgba(255,255,255,0.5)'); // glare
  rect(ctx, 6, 4, 2, 3, '#4488cc');     // vial blue
  rect(ctx, 9, 4, 2, 3, '#cc4466');     // vial red
  rect(ctx, 6, 8, 2, 3, '#44aa66');     // vial green
  rect(ctx, 9, 8, 2, 3, '#ddaa22');     // vial yellow
  rect(ctx, 3, 7, 10, 1, '#aabbc8');    // shelf
  rect(ctx, 12, 5, 1, 5, '#888');       // handle
  px(ctx, 7, 14, '#44ff88'); px(ctx, 8, 14, '#44ff88'); // temp display
  rect(ctx, 1, 15, 14, 1, 'rgba(0,0,0,0.12)');

  spriteCache.set(key, c);
  return c;
}

// ========== SAFE BOX (16x16) ==========
function drawSafeBox() {
  const key = getCacheKey('safeBox');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  rect(ctx, 2, 3, 12, 12, '#3a2820');   // outline
  rect(ctx, 3, 4, 10, 10, '#444');      // body
  rect(ctx, 3, 4, 10, 1, '#555');       // highlight
  rect(ctx, 5, 6, 6, 4, '#222');        // lock panel
  rect(ctx, 6, 7, 4, 2, '#1a3a1a');     // screen
  px(ctx, 7, 7, '#44ff88'); px(ctx, 8, 7, '#44ff88'); px(ctx, 9, 7, '#44ff88');
  for (let ky = 0; ky < 2; ky++) {
    for (let kx = 0; kx < 3; kx++) {
      px(ctx, 6 + kx * 2, 9 + ky, '#666');
    }
  }
  rect(ctx, 11, 7, 1, 4, '#888');       // handle
  px(ctx, 4, 5, '#666'); px(ctx, 12, 5, '#666'); // bolts top
  px(ctx, 4, 13, '#666'); px(ctx, 12, 13, '#666'); // bolts bottom
  rect(ctx, 2, 15, 12, 1, 'rgba(0,0,0,0.2)');

  spriteCache.set(key, c);
  return c;
}

// ========== PRINTER STATION (16x16) ==========
function drawPrinterStation() {
  const key = getCacheKey('printerStation');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Table legs
  rect(ctx, 2, 12, 2, 3, '#8B6914');
  rect(ctx, 12, 12, 2, 3, '#8B6914');
  // Table top
  rect(ctx, 1, 10, 14, 3, '#A0782C');
  rect(ctx, 1, 10, 14, 1, '#b88a3c');
  // Printer body
  rect(ctx, 3, 5, 10, 6, '#ccc');
  rect(ctx, 4, 6, 8, 4, '#bbb');
  // Paper slot
  rect(ctx, 4, 5, 8, 1, '#555');
  // Label coming out
  rect(ctx, 5, 2, 6, 4, '#f0f0f0');
  rect(ctx, 6, 3, 4, 1, '#aaa');
  rect(ctx, 6, 4, 3, 1, '#aaa');
  // Status LED
  px(ctx, 11, 8, '#44ff88');
  // Shadow
  rect(ctx, 1, 15, 14, 1, 'rgba(0,0,0,0.12)');

  spriteCache.set(key, c);
  return c;
}

// ========== HAND SANITIZER (16x16) ==========
function drawHandSanitizer() {
  const key = getCacheKey('handSanitizer');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Wall mount plate
  rect(ctx, 5, 1, 6, 3, '#888');
  // Dispenser body
  rect(ctx, 5, 3, 6, 9, '#f0f0f0');
  rect(ctx, 6, 4, 4, 7, '#e4e4e4');
  // Label
  rect(ctx, 6, 5, 4, 3, '#44aa66');
  px(ctx, 7, 6, '#fff');
  px(ctx, 8, 6, '#fff');
  // Push lever
  rect(ctx, 6, 11, 4, 1, '#ccc');
  rect(ctx, 5, 12, 2, 1, '#aaa');
  // Drip nozzle
  px(ctx, 7, 13, '#aaa');
  // Sanitizer drop
  px(ctx, 7, 14, 'rgba(120,200,255,0.6)');

  spriteCache.set(key, c);
  return c;
}

// ========== WALL CLOCK (16x16) ==========
function drawClockWall() {
  const key = getCacheKey('clockWall');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Clock outline circle (approximated with rects)
  rect(ctx, 3, 1, 10, 1, '#3a2820');
  rect(ctx, 2, 2, 12, 1, '#3a2820');
  rect(ctx, 1, 3, 14, 10, '#3a2820');
  rect(ctx, 2, 13, 12, 1, '#3a2820');
  rect(ctx, 3, 14, 10, 1, '#3a2820');
  // Clock face — white
  rect(ctx, 4, 2, 8, 1, '#f0f0f0');
  rect(ctx, 3, 3, 10, 1, '#f0f0f0');
  rect(ctx, 2, 4, 12, 8, '#f0f0f0');
  rect(ctx, 3, 12, 10, 1, '#f0f0f0');
  rect(ctx, 4, 13, 8, 1, '#f0f0f0');
  // Hour marks (12, 3, 6, 9 positions)
  px(ctx, 8, 3, '#3a2820');  // 12
  px(ctx, 12, 8, '#3a2820');  // 3
  px(ctx, 8, 12, '#3a2820');  // 6
  px(ctx, 3, 8, '#3a2820');   // 9
  // Minute hand (pointing to 12)
  rect(ctx, 8, 4, 1, 4, '#222');
  // Hour hand (pointing to ~3)
  rect(ctx, 8, 8, 3, 1, '#222');
  // Center dot
  px(ctx, 8, 8, '#cc2233');

  spriteCache.set(key, c);
  return c;
}

// ========== BULLETIN BOARD (16x16) ==========
function drawBulletinBoard() {
  const key = getCacheKey('bulletinBoard');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Frame
  rect(ctx, 1, 1, 14, 14, '#8B6914');
  // Cork surface
  rect(ctx, 2, 2, 12, 12, '#c8a060');
  rect(ctx, 2, 2, 12, 12, '#d0a868');
  // Cork texture speckles
  px(ctx, 4, 4, '#b89850');
  px(ctx, 9, 3, '#b89850');
  px(ctx, 6, 10, '#b89850');
  px(ctx, 11, 7, '#b89850');
  // Pinned paper 1 — white note
  rect(ctx, 3, 3, 4, 5, '#f0f0f0');
  px(ctx, 5, 3, '#cc2233');  // red pin
  // Text lines on paper
  rect(ctx, 4, 5, 2, 1, '#aaa');
  rect(ctx, 4, 7, 2, 1, '#aaa');
  // Pinned paper 2 — yellow note
  rect(ctx, 8, 4, 4, 4, '#eeee88');
  px(ctx, 10, 4, '#4466cc');  // blue pin
  rect(ctx, 9, 6, 2, 1, '#bbb');
  // Pinned paper 3 — small card
  rect(ctx, 4, 9, 3, 3, '#aaddff');
  px(ctx, 5, 9, '#44aa44');  // green pin
  // Notice — orange flyer
  rect(ctx, 9, 9, 3, 3, '#ee8844');
  px(ctx, 10, 9, '#cc2233');  // red pin

  spriteCache.set(key, c);
  return c;
}

// ========== FLUORESCENT LIGHT (16x16) ==========
function drawFluorescent() {
  const key = getCacheKey('fluorescent');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Fixture housing — top-down view
  rect(ctx, 1, 5, 14, 6, '#ccc');
  // Housing edge
  rect(ctx, 1, 5, 14, 1, '#aaa');
  rect(ctx, 1, 10, 14, 1, '#aaa');
  // Fluorescent tube 1
  rect(ctx, 2, 6, 12, 2, '#f8fffa');
  // Glow effect
  rect(ctx, 2, 6, 12, 2, 'rgba(220,255,230,0.5)');
  // Fluorescent tube 2
  rect(ctx, 2, 9, 12, 1, '#f8fffa');
  rect(ctx, 2, 9, 12, 1, 'rgba(220,255,230,0.5)');
  // End caps
  rect(ctx, 1, 6, 1, 4, '#888');
  rect(ctx, 14, 6, 1, 4, '#888');
  // Center mount
  rect(ctx, 7, 4, 2, 1, '#888');
  rect(ctx, 7, 11, 2, 1, '#888');
  // Light halo (subtle glow around fixture)
  rect(ctx, 0, 4, 16, 1, 'rgba(255,255,240,0.15)');
  rect(ctx, 0, 11, 16, 1, 'rgba(255,255,240,0.15)');

  spriteCache.set(key, c);
  return c;
}

// ========== PLANT POT (16x16) ==========
function drawPlantPot() {
  const key = getCacheKey('plantPot');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Leaves — top foliage cluster
  rect(ctx, 4, 1, 3, 3, '#3a8a4a');
  rect(ctx, 8, 0, 3, 3, '#4a9a5a');
  rect(ctx, 5, 3, 6, 3, '#3a8a4a');
  rect(ctx, 6, 2, 4, 2, '#5aaa6a');
  // Stem
  rect(ctx, 7, 5, 2, 4, '#5a8a3a');
  // Pot rim
  rect(ctx, 3, 9, 10, 2, '#b86830');
  // Pot body (tapered)
  rect(ctx, 4, 11, 8, 4, '#a05828');
  rect(ctx, 5, 14, 6, 1, '#a05828');
  // Pot highlight
  rect(ctx, 4, 11, 8, 1, '#c07838');
  // Soil visible
  rect(ctx, 4, 9, 8, 1, '#5a3a20');
  // Shadow
  rect(ctx, 3, 15, 10, 1, 'rgba(0,0,0,0.12)');

  spriteCache.set(key, c);
  return c;
}

// ========== MAGAZINE RACK (16x16) ==========
function drawMagazineRack() {
  const key = getCacheKey('magazineRack');
  if (spriteCache.has(key)) return spriteCache.get(key);

  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');

  // Rack frame — wood
  rect(ctx, 2, 2, 12, 13, '#8B6914');
  rect(ctx, 3, 3, 10, 11, '#A0782C');
  // Shelf divider
  rect(ctx, 3, 8, 10, 1, '#8B6914');
  // Magazine spines — top row
  rect(ctx, 3, 3, 2, 5, '#cc3344');
  rect(ctx, 5, 3, 2, 5, '#3388cc');
  rect(ctx, 7, 3, 2, 5, '#ddaa22');
  rect(ctx, 9, 3, 2, 5, '#44aa66');
  rect(ctx, 11, 3, 2, 5, '#aa44aa');
  // Magazine spines — bottom row
  rect(ctx, 3, 9, 2, 5, '#ee7733');
  rect(ctx, 5, 9, 2, 5, '#5566cc');
  rect(ctx, 7, 9, 2, 5, '#cc6688');
  rect(ctx, 9, 9, 2, 5, '#66bbaa');
  rect(ctx, 11, 9, 2, 5, '#aabb44');
  // Spine text lines (tiny detail)
  rect(ctx, 3, 5, 1, 1, '#fff');
  rect(ctx, 5, 5, 1, 1, '#fff');
  rect(ctx, 7, 5, 1, 1, '#fff');
  rect(ctx, 9, 11, 1, 1, '#fff');
  rect(ctx, 11, 11, 1, 1, '#fff');
  // Shadow
  rect(ctx, 2, 15, 12, 1, 'rgba(0,0,0,0.12)');

  spriteCache.set(key, c);
  return c;
}

// ========== EXPORTS ==========
export const SpriteFurniture = {
  filingCabinet: drawFilingCabinet,
  fridgeUnit: drawFridgeUnit,
  safeBox: drawSafeBox,
  printerStation: drawPrinterStation,
  handSanitizer: drawHandSanitizer,
  clockWall: drawClockWall,
  bulletinBoard: drawBulletinBoard,
  fluorescent: drawFluorescent,
  plantPot: drawPlantPot,
  magazineRack: drawMagazineRack,
};
