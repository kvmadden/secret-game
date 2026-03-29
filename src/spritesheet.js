/**
 * Spritesheet loader — drop-in replacement for programmatic sprites.
 *
 * HOW TO USE:
 * 1. Place sprite sheet PNGs in public/sprites/
 * 2. Define them in SPRITE_MANIFEST below
 * 3. Call SpriteSheets.load() at game start (before first frame)
 * 4. Sprite functions auto-check for sheet overrides before drawing programmatically
 *
 * Each manifest entry maps a sprite name to a sheet file, frame grid, and
 * optional parameter-to-frame mapping. The loader slices the sheet into
 * individual frame canvases that match the existing interface (returns canvas).
 *
 * SPRITESHEET FORMAT:
 * - Each sheet is a grid of frames, left-to-right, top-to-bottom
 * - Frame size is defined per sheet (e.g. 16x16, 32x16)
 * - Transparency: use PNG with alpha channel
 * - No padding between frames (pack tightly)
 *
 * EXAMPLE: pharmacist.png
 *   A 96x64 PNG = 6 columns × 4 rows of 16x16 frames
 *   Row 0: walk right (frames 0-5)
 *   Row 1: walk left (frames 0-5)
 *   Row 2: walk up (frames 0-5)
 *   Row 3: walk down (frames 0-5)
 */

// ============================================================
// MANIFEST — define your sprite sheets here
// ============================================================
// Each entry:
//   file:      path relative to public/sprites/
//   frameW:    pixel width of one frame
//   frameH:    pixel height of one frame
//   sprites:   map of sprite key → { row, col?, cols? }
//              row = which row in the sheet
//              col = starting column (default 0)
//              cols = how many frames in this row (default: all)
//
// The "key" format matches how the cache keys are built:
//   For pharmacist: "pharmacist_right_0" = facing + frame
//   For patient: "patient_3_1" = paletteIndex + emotionLevel
//   For simple sprites: just the name, e.g. "phone_0", "phone_1"

export const SPRITE_MANIFEST = {
  // ---- EXAMPLE (uncomment when you have the PNG) ----
  //
  // pharmacist: {
  //   file: 'pharmacist.png',
  //   frameW: 16,
  //   frameH: 16,
  //   rows: {
  //     // facing → row index
  //     right: 0,   // 6 walk frames: cols 0-5
  //     left: 1,
  //     up: 2,
  //     down: 3,
  //   },
  //   // Optional: stress variants on additional rows
  //   // right_stress1: 4, right_stress2: 5, etc.
  // },
  //
  // patient: {
  //   file: 'patients.png',
  //   frameW: 16,
  //   frameH: 16,
  //   // Grid: rows = palette index (0-7), cols = emotion level (0-2)
  //   // Looked up as: row = paletteIndex, col = emotionLevel
  // },
  //
  // vehicles: {
  //   file: 'vehicles.png',
  //   frameW: 32,
  //   frameH: 16,
  //   rows: {
  //     sedan: 0,
  //     suv: 1,
  //     pickup: 2,
  //     minivan: 3,
  //     sportsCar: 4,
  //     deliveryVan: 5,
  //     ambulance: 6,
  //     bicycle: 7,
  //   },
  // },
};

// ============================================================
// LOADER
// ============================================================

const sheetImages = new Map();   // file → HTMLImageElement
const frameCache = new Map();    // "sheetName_row_col" → canvas

let loaded = false;
let loading = false;

/**
 * Load all sprite sheets defined in the manifest.
 * Returns a promise that resolves when all images are loaded.
 * Safe to call multiple times (idempotent).
 */
export async function loadSpriteSheets() {
  if (loaded || loading) return;
  loading = true;

  const files = new Set();
  for (const entry of Object.values(SPRITE_MANIFEST)) {
    files.add(entry.file);
  }

  const promises = [];
  for (const file of files) {
    promises.push(loadImage(`sprites/${file}`).then(img => {
      sheetImages.set(file, img);
    }).catch(err => {
      console.warn(`[SpriteSheet] Failed to load ${file}:`, err.message);
    }));
  }

  await Promise.all(promises);
  loaded = true;
  loading = false;
  console.log(`[SpriteSheet] Loaded ${sheetImages.size}/${files.size} sprite sheets`);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

// ============================================================
// FRAME EXTRACTION
// ============================================================

/**
 * Get a single frame canvas from a sprite sheet.
 * @param {string} sheetName - key in SPRITE_MANIFEST
 * @param {number} row - row index in the sheet
 * @param {number} col - column index in the sheet
 * @returns {HTMLCanvasElement|null} - canvas with the frame, or null if not loaded
 */
export function getSheetFrame(sheetName, row, col) {
  const cacheKey = `${sheetName}_${row}_${col}`;
  if (frameCache.has(cacheKey)) return frameCache.get(cacheKey);

  const manifest = SPRITE_MANIFEST[sheetName];
  if (!manifest) return null;

  const img = sheetImages.get(manifest.file);
  if (!img) return null;

  const { frameW, frameH } = manifest;
  const sx = col * frameW;
  const sy = row * frameH;

  // Bounds check
  if (sx + frameW > img.width || sy + frameH > img.height) return null;

  const c = document.createElement('canvas');
  c.width = frameW;
  c.height = frameH;
  const ctx = c.getContext('2d');
  // Disable image smoothing for crisp pixel art
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sx, sy, frameW, frameH, 0, 0, frameW, frameH);

  frameCache.set(cacheKey, c);
  return c;
}

/**
 * Check if a sprite sheet is available for a given name.
 */
export function hasSheet(sheetName) {
  const manifest = SPRITE_MANIFEST[sheetName];
  if (!manifest) return false;
  return sheetImages.has(manifest.file);
}

/**
 * Get row index for a named row variant.
 * e.g. getRowIndex('pharmacist', 'right') → 0
 */
export function getRowIndex(sheetName, rowName) {
  const manifest = SPRITE_MANIFEST[sheetName];
  if (!manifest || !manifest.rows) return -1;
  const idx = manifest.rows[rowName];
  return idx !== undefined ? idx : -1;
}

// ============================================================
// HIGH-LEVEL HELPERS
// ============================================================

/**
 * Try to get a pharmacist frame from spritesheet.
 * Returns canvas or null (caller falls back to programmatic).
 *
 * Expected sheet layout:
 *   Rows: one per facing direction (see manifest.rows)
 *   Cols: walk frame index (0-5)
 *   Additional rows for stress variants (optional)
 */
export function getPharmacistFrame(facing, frame, stressLevel) {
  if (!hasSheet('pharmacist')) return null;
  const manifest = SPRITE_MANIFEST.pharmacist;
  let row = manifest.rows?.[facing];
  if (row === undefined) return null;

  // Optional: stress variants on subsequent row groups
  // e.g. rows 0-3 = stress0, rows 4-7 = stress1, etc.
  if (manifest.stressRowOffset && stressLevel > 0) {
    row += stressLevel * manifest.stressRowOffset;
  }

  return getSheetFrame('pharmacist', row, frame);
}

/**
 * Try to get a patient frame from spritesheet.
 * Expected layout: row = paletteIndex, col = emotionLevel
 */
export function getPatientFrame(paletteIndex, emotionLevel) {
  if (!hasSheet('patient')) return null;
  return getSheetFrame('patient', paletteIndex, emotionLevel);
}

/**
 * Try to get a vehicle frame from spritesheet.
 * Expected layout: each vehicle type on its own row, col 0 = default
 */
export function getVehicleFrame(vehicleType, col) {
  if (!hasSheet('vehicles')) return null;
  const row = getRowIndex('vehicles', vehicleType);
  if (row < 0) return null;
  return getSheetFrame('vehicles', row, col || 0);
}

// ============================================================
// CONVENIENCE: wrap a programmatic sprite fn with sheet override
// ============================================================

/**
 * Creates a wrapper function that checks for a spritesheet frame first,
 * then falls back to the original programmatic function.
 *
 * @param {string} sheetName - manifest key
 * @param {Function} programmaticFn - original drawing function
 * @param {Function} keyFn - maps the sprite function's args to {row, col}
 * @returns {Function} - drop-in replacement function
 */
export function withSheetOverride(sheetName, programmaticFn, keyFn) {
  return function (...args) {
    if (hasSheet(sheetName)) {
      const { row, col } = keyFn(...args);
      const frame = getSheetFrame(sheetName, row, col);
      if (frame) return frame;
    }
    return programmaticFn(...args);
  };
}

// ============================================================
// PUBLIC API
// ============================================================

export const SpriteSheets = {
  load: loadSpriteSheets,
  getFrame: getSheetFrame,
  hasSheet,
  getRowIndex,
  getPharmacistFrame,
  getPatientFrame,
  getVehicleFrame,
  withSheetOverride,
  manifest: SPRITE_MANIFEST,
};
