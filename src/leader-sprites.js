/**
 * Leader portrait sprites (32x32) for campaign UI.
 */
const leaderCache = new Map();

function createCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}
function px(ctx, x, y, color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
function rect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }

const L = {
  o: '#3a2820', skin: '#e0b888', skinSh: '#c8a070',
  white: '#f4f0e8', wSh: '#dcd8d0', eb: '#1a1018', hl: '#f8f8ff',
};

/**
 * Generate a 32x32 leader portrait canvas based on leader type.
 * Supported types: 'supportive', 'demanding', 'absent', or any string.
 */
function drawLeaderPortrait(leaderType) {
  const key = `leader_${leaderType || 'default'}`;
  if (leaderCache.has(key)) return leaderCache.get(key);

  const c = createCanvas(32, 32), ctx = c.getContext('2d'), o = L.o;
  const skin = L.skin, skinSh = L.skinSh;

  // Shoulders — suit jacket
  const jacketColor = leaderType === 'demanding' ? '#3a2848' :
                      leaderType === 'supportive' ? '#2a4838' : '#384058';
  rect(ctx, 5, 25, 22, 7, jacketColor);
  rect(ctx, 4, 25, 1, 7, o); rect(ctx, 27, 25, 1, 7, o); rect(ctx, 5, 31, 22, 1, o);
  rect(ctx, 13, 24, 6, 2, '#c0b8a8'); // shirt collar

  // Neck + head
  rect(ctx, 13, 22, 6, 3, skin);
  rect(ctx, 10, 7, 12, 15, skin); rect(ctx, 9, 9, 1, 11, skin); rect(ctx, 22, 9, 1, 11, skin);
  rect(ctx, 10, 19, 12, 2, skinSh);

  // Head outline
  rect(ctx, 10, 6, 12, 1, o);
  rect(ctx, 8, 8, 1, 12, o); rect(ctx, 23, 8, 1, 12, o);
  ctx.fillStyle = o;
  for (const [x, y] of [[9,7],[22,7],[9,20],[9,21],[22,20],[22,21]]) ctx.fillRect(x, y, 1, 1);
  rect(ctx, 10, 22, 12, 1, o);

  // Hair (short, dark, professional)
  const hairColor = leaderType === 'supportive' ? '#504030' : '#2a2028';
  rect(ctx, 9, 3, 14, 5, hairColor);
  rect(ctx, 8, 5, 1, 4, hairColor); rect(ctx, 23, 5, 1, 4, hairColor);
  rect(ctx, 9, 2, 14, 1, o);
  ctx.fillStyle = o;
  for (const [x, y] of [[8,3],[8,4],[24,3],[24,4]]) ctx.fillRect(x, y, 1, 1);

  // Eyes
  rect(ctx, 11, 11, 4, 4, '#f8f8f0');
  rect(ctx, 17, 11, 4, 4, '#f8f8f0');
  ctx.fillStyle = L.eb;
  for (const [x, y] of [[12,12],[13,12],[12,13],[13,13],[18,12],[19,12],[18,13],[19,13]]) ctx.fillRect(x, y, 1, 1);
  px(ctx, 12, 11, L.hl); px(ctx, 19, 11, L.hl);

  // Expression by type
  if (leaderType === 'supportive') {
    // Warm smile
    rect(ctx, 13, 17, 6, 1, '#8a3030');
    px(ctx, 12, 16, '#8a3030'); px(ctx, 19, 16, '#8a3030');
  } else if (leaderType === 'demanding') {
    // Stern line + furrowed brows
    rect(ctx, 13, 18, 6, 1, '#8a3030');
    rect(ctx, 10, 9, 4, 1, o); rect(ctx, 18, 9, 4, 1, o);
    px(ctx, 14, 10, o); px(ctx, 17, 10, o);
  } else {
    // Neutral/absent — flat expression
    rect(ctx, 13, 18, 6, 1, '#8a3030');
  }

  // Nose + ears
  ctx.fillStyle = skinSh;
  for (const [x, y] of [[15,15],[16,15],[15,16],[9,13],[22,13]]) ctx.fillRect(x, y, 1, 1);

  // Tie accent
  const tieColor = leaderType === 'demanding' ? '#a03030' :
                   leaderType === 'supportive' ? '#306030' : '#404880';
  rect(ctx, 15, 24, 2, 4, tieColor);

  leaderCache.set(key, c);
  return c;
}

export const LeaderSprites = {
  leaderPortrait: drawLeaderPortrait,
};
