/**
 * Dr. Chen mentor character sprite - tutorial guide.
 * Follows patterns from sprites.js: spriteCache, px/rect helpers, createSpriteCanvas.
 */
const spriteCache = new Map();

function getCacheKey(name, ...args) { return `${name}_${args.join('_')}`; }

function createSpriteCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h; return c;
}

function px(ctx, x, y, color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }

function rect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }

// Palette
const skinBase = '#e8b88a', skinShadow = '#d4a070';
const hairBase = '#3a3a4a', hairGray = '#7a7a7a';
const coatBase = '#f4f0e8', coatShadow = '#dcd8d0', coatHighlight = '#faf8f2';
const pantsBase = '#3a3a4a', pantsShadow = '#2c2c3a';
const shoeColor = '#22180e';
const badgeGold = '#c8a832', badgeShine = '#e0c850';
const glassesColor = '#6888a8', glassesFrame = '#4a4a5a';
const outline = '#3a2820';

// ========== MENTOR SPRITE (16x16) ==========
function mentorSprite(facing, frame) {
  const key = getCacheKey('mentor', facing, frame);
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(16, 16);
  const ctx = c.getContext('2d');
  const flip = facing === 'left';
  const headBob = (frame === 2) ? -1 : 0;
  const legFrame = frame % 4; // 0=idle, 1-3=walk
  const mx = (x) => flip ? 15 - x : x;

  // Hair with gray streaks (wider head for heavier build)
  const hy = 1 + headBob;
  rect(ctx, mx(5), hy, 1, 1, hairBase);
  rect(ctx, flip ? 5 : 6, hy, 4, 1, hairBase);
  px(ctx, mx(10), hy, hairBase);
  px(ctx, mx(5), hy, hairGray); // gray temple
  px(ctx, mx(10), hy, hairGray);
  rect(ctx, mx(5), hy + 1, 1, 1, hairGray);
  rect(ctx, flip ? 5 : 6, hy + 1, 4, 1, hairBase);
  px(ctx, mx(10), hy + 1, hairGray);

  // Head
  const fhy = hy + 2;
  px(ctx, mx(5), fhy, outline); px(ctx, mx(10), fhy, outline);
  rect(ctx, flip ? 5 : 6, fhy, 4, 3, skinBase);
  rect(ctx, mx(5), fhy, 1, 3, skinShadow);
  px(ctx, mx(10), fhy + 1, skinShadow);
  // Eyes (calm, confident) and smile lines
  px(ctx, mx(7), fhy + 1, outline); px(ctx, mx(9), fhy + 1, outline);
  px(ctx, mx(6), fhy + 2, skinShadow); px(ctx, mx(10), fhy + 2, skinShadow);
  // Reading glasses on forehead
  px(ctx, mx(6), fhy, glassesFrame); px(ctx, mx(7), fhy, glassesColor);
  px(ctx, mx(8), fhy, glassesFrame); px(ctx, mx(9), fhy, glassesColor);
  px(ctx, mx(10), fhy, glassesFrame);

  // Body / Lab coat (wider build than player pharmacist)
  const by = fhy + 3;
  rect(ctx, mx(4), by, 1, 4, coatShadow);
  rect(ctx, flip ? 4 : 5, by, 6, 4, coatBase);
  px(ctx, mx(11), by, coatShadow);
  rect(ctx, mx(5), by, 1, 4, coatHighlight);
  px(ctx, mx(4), by, outline); px(ctx, mx(11), by, outline);
  px(ctx, mx(4), by + 3, outline); px(ctx, mx(11), by + 3, outline);
  // Gold name badge
  px(ctx, mx(6), by + 1, badgeGold); px(ctx, mx(7), by + 1, badgeGold);
  px(ctx, mx(6), by + 2, badgeShine); px(ctx, mx(7), by + 2, badgeGold);

  // Legs / Pants
  const ly = by + 4;
  if (legFrame === 0) {
    rect(ctx, mx(6), ly, 2, 3, pantsBase); rect(ctx, mx(8), ly, 2, 3, pantsBase);
    px(ctx, mx(6), ly + 2, pantsShadow); px(ctx, mx(9), ly + 2, pantsShadow);
  } else if (legFrame === 1) {
    rect(ctx, mx(5), ly, 2, 3, pantsBase); rect(ctx, mx(8), ly, 2, 3, pantsBase);
    px(ctx, mx(8), ly + 2, pantsShadow);
  } else if (legFrame === 2) {
    rect(ctx, mx(5), ly, 2, 2, pantsBase); rect(ctx, mx(9), ly, 2, 2, pantsBase);
    px(ctx, mx(5), ly + 2, pantsBase); px(ctx, mx(10), ly + 2, pantsBase);
  } else {
    rect(ctx, mx(6), ly, 2, 3, pantsBase); rect(ctx, mx(9), ly, 2, 2, pantsBase);
    px(ctx, mx(7), ly + 2, pantsShadow);
  }

  // Shoes
  const sy = ly + 3;
  if (legFrame === 0) {
    rect(ctx, mx(6), sy, 2, 1, shoeColor); rect(ctx, mx(8), sy, 2, 1, shoeColor);
  } else if (legFrame === 2) {
    px(ctx, mx(5), sy, shoeColor); px(ctx, mx(10), sy, shoeColor);
  } else {
    rect(ctx, mx(5), sy, 2, 1, shoeColor); rect(ctx, mx(8), sy, 2, 1, shoeColor);
  }

  spriteCache.set(key, c);
  return c;
}

// ========== MENTOR PORTRAIT (32x32) ==========
function mentorPortrait() {
  const key = getCacheKey('mentorPortrait');
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(32, 32);
  const ctx = c.getContext('2d');

  // Background
  rect(ctx, 4, 1, 24, 30, '#2a2a3a'); rect(ctx, 2, 3, 28, 26, '#2a2a3a');
  // Hair with gray temples
  rect(ctx, 9, 3, 14, 4, hairBase);
  rect(ctx, 8, 5, 2, 3, hairGray); rect(ctx, 22, 5, 2, 3, hairGray);
  rect(ctx, 10, 3, 2, 2, hairGray); rect(ctx, 19, 3, 2, 2, hairGray);
  // Face
  rect(ctx, 9, 7, 14, 12, skinBase);
  rect(ctx, 8, 8, 1, 10, skinShadow); rect(ctx, 23, 8, 1, 10, skinShadow);
  rect(ctx, 10, 19, 12, 2, skinBase); rect(ctx, 11, 21, 10, 1, skinShadow);
  // Reading glasses on forehead
  rect(ctx, 10, 7, 5, 2, glassesColor); rect(ctx, 17, 7, 5, 2, glassesColor);
  rect(ctx, 15, 7, 2, 1, glassesFrame);
  px(ctx, 10, 7, glassesFrame); px(ctx, 14, 7, glassesFrame);
  px(ctx, 17, 7, glassesFrame); px(ctx, 21, 7, glassesFrame);
  // Eyes
  rect(ctx, 11, 11, 3, 2, '#ffffff'); rect(ctx, 18, 11, 3, 2, '#ffffff');
  rect(ctx, 12, 11, 2, 2, outline); rect(ctx, 19, 11, 2, 2, outline);
  // Crow's feet / smile lines
  px(ctx, 9, 12, skinShadow); px(ctx, 22, 12, skinShadow);
  px(ctx, 9, 13, skinShadow); px(ctx, 22, 13, skinShadow);
  // Nose and warm smile
  rect(ctx, 15, 13, 2, 3, skinShadow);
  rect(ctx, 13, 17, 6, 1, '#c07860');
  px(ctx, 12, 17, skinShadow); px(ctx, 19, 17, skinShadow);
  // Lab coat shoulders
  rect(ctx, 5, 22, 22, 8, coatBase);
  rect(ctx, 3, 24, 2, 6, coatShadow); rect(ctx, 27, 24, 2, 6, coatShadow);
  rect(ctx, 5, 22, 3, 8, coatHighlight);
  // Gold name badge
  rect(ctx, 8, 25, 4, 3, badgeGold); rect(ctx, 8, 25, 4, 1, badgeShine);
  px(ctx, 9, 26, '#a08020'); px(ctx, 10, 27, '#a08020');
  // Outline frame
  ctx.strokeStyle = outline; ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 31, 31);

  spriteCache.set(key, c);
  return c;
}

// ========== MENTOR INDICATOR (12x12) ==========
function mentorIndicator() {
  const key = getCacheKey('mentorIndicator');
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = createSpriteCanvas(12, 12);
  const ctx = c.getContext('2d');
  // Downward-pointing arrow to hover above mentor
  rect(ctx, 5, 0, 2, 7, badgeGold); rect(ctx, 5, 0, 1, 7, badgeShine);
  // Arrow head (triangle)
  rect(ctx, 3, 7, 6, 1, badgeGold);
  rect(ctx, 4, 8, 4, 1, badgeGold);
  rect(ctx, 5, 9, 2, 1, badgeGold);
  px(ctx, 3, 7, badgeShine); px(ctx, 4, 8, badgeShine); px(ctx, 5, 9, badgeShine);

  spriteCache.set(key, c);
  return c;
}

// ========== EXPORTS ==========
export const MentorSprite = {
  mentorSprite,
  mentorPortrait,
  mentorIndicator,
};
