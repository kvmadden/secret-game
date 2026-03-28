/**
 * Canvas rendering — dynamic camera with zoom in/out.
 *
 * Camera modes:
 *  - FOLLOW: zoomed in on pharmacist (~2.5x), smooth tracking
 *  - OVERVIEW: zoomed out to show full map, triggered by button or auto
 *  - PEEK: brief auto-zoom-out when events spawn off-screen
 */

import { TILE_SIZE, MAP_COLS, MAP_ROWS, STATIONS } from './constants.js';
import { renderMap } from './map.js';
import { Sprites } from './sprites.js';
import { SpriteVehicles } from './sprite-vehicles.js';
import { SpriteItems } from './sprite-items.js';

const FOLLOW_ZOOM = 2.8;   // Zoomed-in scale (pharmacist detail view)
const OVERVIEW_ZOOM = 0;    // 0 means "fit to screen" — calculated at resize
const PEEK_DURATION = 1.8;  // How long auto-peek lasts
const CAMERA_EASE = 3.5;    // Higher = snappier camera

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mapCanvas = null;
    this.dpr = window.devicePixelRatio || 1;

    // Camera state
    this.camX = 0;           // Current camera center (tile-space)
    this.camY = 0;
    this.camZoom = FOLLOW_ZOOM;
    this.targetX = 0;
    this.targetY = 0;
    this.targetZoom = FOLLOW_ZOOM;
    this.fitZoom = 1;        // Calculated: scale that fits full map on screen

    // Camera mode
    this.mode = 'FOLLOW';    // FOLLOW | OVERVIEW | PEEK
    this.peekTimer = 0;
    this.manualOverview = false;

    // Off-screen event indicators
    this.offScreenEvents = [];

    // Completion flash effects
    this.flashes = [];

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeDecay = 0;

    // Particles
    this.particles = [];

    // Lunch gate animation (0 = open, 1 = fully closed)
    this.gateProgress = 0;
    this.gateTarget = 0;

    // Receipt printer animation
    this.receiptProgress = 0; // 0 = idle, >0 = printing

    // Ambient dust motes (floating particles in light zones)
    this.dustMotes = [];
    for (let i = 0; i < 14; i++) {
      this.dustMotes.push({
        x: (3 + Math.random() * 8) * TILE_SIZE,   // Within fluorescent zone
        y: (9 + Math.random() * 5) * TILE_SIZE,
        baseX: 0, // set below
        baseY: 0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,          // vertical drift px/sec
        ampX: 4 + Math.random() * 8,               // horizontal sinusoidal amplitude
        freqX: 0.4 + Math.random() * 0.6,          // horizontal frequency
        alpha: 0.2 + Math.random() * 0.2,
      });
      this.dustMotes[i].baseX = this.dustMotes[i].x;
      this.dustMotes[i].baseY = this.dustMotes[i].y;
    }

    // Rain splashes (persistent array, recycled)
    this.rainSplashes = [];

    // Rain drops (persistent, recycled each frame from seed)
    this.rainDrops = [];
    for (let i = 0; i < 70; i++) {
      this.rainDrops.push({
        seed: i,
        xBase: Math.random(),         // 0-1 fraction of screen width
        speed: 180 + Math.random() * 120,
        length: 3 + Math.random() * 5,
        alpha: 0.15 + Math.random() * 0.2,
        windOffset: 0.6 + Math.random() * 0.4, // wind slant per drop
      });
    }

    // Thunder flash state
    this.thunderFrames = 0;
    this.thunderDecay = 0;

    // Fluorescent full-flicker state
    this.flickerCooldown = 15 + Math.random() * 15; // seconds until next flicker
    this.flickerFrames = 0; // remaining frames of active flicker

    // Global time accumulator for ambient effects (not tied to game time)
    this.ambientTime = 0;

    // Stress exclamation particles (float-up effect)
    this.stressExclamations = [];

    // Patient sigh puffs
    this.sighPuffs = [];

    // Window condensation drops (persistent, regenerated during rain)
    this.condensationDrops = [];
    for (let i = 0; i < 25; i++) {
      this.condensationDrops.push({
        x: (Math.random() * 13) * TILE_SIZE + Math.random() * TILE_SIZE,
        y: 7 * TILE_SIZE + Math.random() * TILE_SIZE,
        r: 0.5 + Math.random() * 1.0,
        alpha: 0.08 + Math.random() * 0.12,
        drift: Math.random() * 0.1,
      });
    }

    // Light ray dust motes (inside the ray region)
    this.rayDustMotes = [];
    for (let i = 0; i < 10; i++) {
      this.rayDustMotes.push({
        xFrac: Math.random(),
        yFrac: Math.random(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.4,
        alpha: 0.15 + Math.random() * 0.15,
      });
    }

    // Completion text popups
    this.completionTexts = [];

    // Frame counter for dust puff timing
    this._frameCounter = 0;
  }

  init(tileMap) {
    this.mapCanvas = renderMap(tileMap);
    this.resize();
  }

  resize() {
    const wrapper = this.canvas.parentElement;
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;

    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    // Calculate the zoom level that fits the full map
    const mapPixelW = MAP_COLS * TILE_SIZE;
    const mapPixelH = MAP_ROWS * TILE_SIZE;
    const scaleX = this.canvas.width / mapPixelW;
    const scaleY = this.canvas.height / mapPixelH;
    this.fitZoom = Math.min(scaleX, scaleY) / this.dpr;

    // Initialize camera to center of map
    this.camX = MAP_COLS * TILE_SIZE / 2;
    this.camY = MAP_ROWS * TILE_SIZE / 2;
  }

  // ========== CAMERA CONTROL ==========

  triggerReceipt() {
    this.receiptProgress = 1.5; // 1.5 seconds of printing
  }

  setGate(closed) {
    this.gateTarget = closed ? 1 : 0;
  }

  setOverview(enabled) {
    this.manualOverview = enabled;
    if (enabled) {
      this.mode = 'OVERVIEW';
    } else if (this.peekTimer > 0) {
      this.mode = 'PEEK';
    } else {
      this.mode = 'FOLLOW';
    }
  }

  toggleOverview() {
    this.setOverview(!this.manualOverview);
  }

  // Auto-peek: briefly zoom out to show something happening off-screen
  peek(duration) {
    if (this.manualOverview) return; // Already showing everything
    this.peekTimer = duration || PEEK_DURATION;
    this.mode = 'PEEK';
  }

  flashComplete(col, row, color) {
    const c = color || '#f0d880';
    this.flashes.push({ col, row, timer: 0.6, maxTimer: 0.6, color: c });
    this.spawnParticles(col, row, c, 8);
    // "DONE!" text popup
    this.completionTexts.push({
      col, row, timer: 0, maxTimer: 0.8, color: c,
    });
  }

  shake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDecay = 0.4;
  }

  spawnParticles(col, row, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const speed = 20 + Math.random() * 30;
      this.particles.push({
        x: col * TILE_SIZE + 8,
        y: row * TILE_SIZE + 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        color,
        size: 1 + Math.random(),
      });
    }
  }

  updateCamera(pharmacist, dt, gameState) {
    // Peek timer countdown
    if (this.peekTimer > 0) {
      this.peekTimer -= dt;
      if (this.peekTimer <= 0 && !this.manualOverview) {
        this.mode = 'FOLLOW';
      }
    }

    // Determine target based on mode
    const mapCenterX = MAP_COLS * TILE_SIZE / 2;
    const mapCenterY = MAP_ROWS * TILE_SIZE / 2;
    const pharmX = pharmacist.col * TILE_SIZE + 8;
    const pharmY = pharmacist.row * TILE_SIZE + 8;

    switch (this.mode) {
      case 'FOLLOW':
        this.targetX = pharmX;
        this.targetY = pharmY;
        this.targetZoom = FOLLOW_ZOOM;
        break;

      case 'OVERVIEW':
        this.targetX = mapCenterX;
        this.targetY = mapCenterY;
        this.targetZoom = this.fitZoom;
        break;

      case 'PEEK': {
        // Zoom out enough to show the pharmacy, but not as far as full overview
        const peekZoom = (FOLLOW_ZOOM + this.fitZoom) / 2;
        this.targetX = mapCenterX;
        this.targetY = mapCenterY;
        this.targetZoom = peekZoom;
        break;
      }
    }

    // Smooth easing
    const ease = 1 - Math.exp(-CAMERA_EASE * dt);
    this.camX += (this.targetX - this.camX) * ease;
    this.camY += (this.targetY - this.camY) * ease;
    this.camZoom += (this.targetZoom - this.camZoom) * ease;

    // Gate animation
    const gateEase = 1 - Math.exp(-2 * dt);
    this.gateProgress += (this.gateTarget - this.gateProgress) * gateEase;

    // Build off-screen events list for indicators
    this.updateOffScreenEvents(gameState);
  }

  updateOffScreenEvents(gameState) {
    this.offScreenEvents = [];
    if (!gameState || !gameState.stationManager) return;

    const screenW = this.canvas.width / this.dpr;
    const screenH = this.canvas.height / this.dpr;
    const halfW = screenW / (2 * this.camZoom);
    const halfH = screenH / (2 * this.camZoom);

    for (const station of gameState.stationManager.getAll()) {
      if (!station.hasEvent) continue;

      const sx = station.col * TILE_SIZE + 8;
      const sy = station.row * TILE_SIZE + 8;

      // Check if station is off-screen
      const relX = sx - this.camX;
      const relY = sy - this.camY;

      if (Math.abs(relX) > halfW + 8 || Math.abs(relY) > halfH + 8) {
        // Calculate edge position for indicator
        const angle = Math.atan2(relY, relX);
        const edgeX = Math.cos(angle) * Math.min(Math.abs(relX), halfW - 10);
        const edgeY = Math.sin(angle) * Math.min(Math.abs(relY), halfH - 10);

        this.offScreenEvents.push({
          screenX: screenW / 2 + edgeX * this.camZoom,
          screenY: screenH / 2 + edgeY * this.camZoom,
          color: station.color,
          urgency: station.urgency,
          angle,
        });
      }
    }
  }

  render(gameState) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const dt = 1 / 60;

    ctx.fillStyle = '#2a1e14';
    ctx.fillRect(0, 0, w, h);

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (this.shakeDecay > 0) {
      this.shakeDecay -= dt;
      const intensity = this.shakeIntensity * Math.max(0, this.shakeDecay / 0.4);
      shakeX = (Math.random() - 0.5) * intensity * this.camZoom * this.dpr;
      shakeY = (Math.random() - 0.5) * intensity * this.camZoom * this.dpr;
      if (this.shakeDecay <= 0) this.shakeIntensity = 0;
    }

    // Camera transform: center on camX/camY at camZoom
    const scale = this.camZoom * this.dpr;
    const tx = w / 2 - this.camX * scale + shakeX;
    const ty = h / 2 - this.camY * scale + shakeY;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(scale, scale);

    // Draw map
    if (this.mapCanvas) {
      ctx.drawImage(this.mapCanvas, 0, 0);
    }

    // Lighting zones
    this.renderLighting(ctx, gameState);

    // Ceiling details (fluorescent fixtures, vent, sprinkler)
    this.renderCeilingDetails(ctx, gameState);

    // Floor reflection layer (very faint mirror of entities above)
    this.renderFloorReflections(ctx, gameState);

    // Draw animated world elements
    this.renderWorldAnimations(ctx, gameState);

    // Draw phone (animated if ringing)
    this.renderPhone(ctx, gameState);

    // Draw drive-thru cars
    this.renderDriveThruCars(ctx, gameState);

    // Draw ambient shoppers (behind patients, in store area)
    this.renderAmbientShoppers(ctx, gameState);

    // Draw patients (sorted by row for depth)
    const sortedPatients = [...gameState.patients].sort((a, b) => a.row - b.row);
    this.renderPatients(ctx, gameState, sortedPatients);

    // Draw pharmacist
    this.renderPharmacist(ctx, gameState);

    // Draw speech bubbles (on top of everything)
    this.renderBubbles(ctx, gameState, sortedPatients);

    // Draw lunch gate (on top of counter, below UI)
    this.renderLunchGate(ctx, gameState);

    // Draw station urgency indicators
    this.renderStationIndicators(ctx, gameState);

    // Draw completion flashes
    this.renderFlashes(ctx, dt);

    // Draw particles
    this.renderParticles(ctx, dt);

    // Draw ambient dust motes (world-space, in light zones)
    this.renderDustMotes(ctx, gameState);

    ctx.restore();

    // Update ambient timers
    this.ambientTime += dt;
    this._frameCounter++;
    this.updateFlickerTimer(dt);

    // Lunch overlay darkening (screen-space)
    if (gameState.phase === 'LUNCH_CLOSE') {
      ctx.fillStyle = 'rgba(20, 12, 5, 0.4)';
      ctx.fillRect(0, 0, w, h);
    }

    // Weather effects (screen-space, over the scene)
    this.renderWeather(ctx, gameState);

    // Screen edge vignette (screen-space)
    this.renderVignette(ctx, w, h);

    // Off-screen event indicators (screen-space)
    this.renderOffScreenIndicators(ctx);

    // Zoom mode indicator
    this.renderZoomHint(ctx, gameState);
  }

  // ========== LIGHTING ==========

  renderLighting(ctx, gameState) {
    const t = gameState.time || 0;

    // Time-of-day tint: morning gold → midday bright → afternoon amber
    const progress = gameState.time ? gameState.time / 360 : 0; // 0-1 over shift
    let todR, todG, todB, todA;
    if (progress < 0.3) {
      // Morning — warm golden sunlight streaming in
      todR = 255; todG = 220; todB = 140; todA = 0.06 * (1 - progress / 0.3);
    } else if (progress < 0.6) {
      // Midday — neutral bright
      todR = 255; todG = 250; todB = 240; todA = 0.02;
    } else {
      // Afternoon — amber/orange as sun lowers
      const p = (progress - 0.6) / 0.4;
      todR = 255; todG = 200 - p * 40; todB = 120 - p * 40; todA = 0.04 + p * 0.06;
    }

    // Apply time-of-day tint to customer-visible area (rows 0-7)
    ctx.fillStyle = `rgba(${todR}, ${todG}, ${todB}, ${todA.toFixed(3)})`;
    ctx.fillRect(0, 0, 14 * TILE_SIZE, 8 * TILE_SIZE);

    // Store area — warm golden retail lighting
    ctx.fillStyle = 'rgba(255, 230, 180, 0.12)';
    ctx.fillRect(0, 0, 14 * TILE_SIZE, 2 * TILE_SIZE);

    // Customer area — warm shadow
    ctx.fillStyle = 'rgba(40, 20, 0, 0.06)';
    ctx.fillRect(0, 2 * TILE_SIZE, 14 * TILE_SIZE, 5 * TILE_SIZE);

    // Counter surface highlight — warm glow
    ctx.fillStyle = 'rgba(255, 240, 200, 0.10)';
    ctx.fillRect(0, 7 * TILE_SIZE, 13 * TILE_SIZE, TILE_SIZE);

    // Fluorescent lighting — workspace band, warm white
    // Check for full-flicker dimming
    const flickerDim = this.flickerFrames > 0 ? 0.05 : 0;
    ctx.fillStyle = `rgba(255, 245, 220, ${(0.12 - flickerDim).toFixed(3)})`;
    ctx.fillRect(0, 9 * TILE_SIZE, 13 * TILE_SIZE, 5 * TILE_SIZE);

    // Fluorescent flicker (subtle, random) — enhanced visibility
    if (Math.sin(t * 47) > 0.93) {
      const flickAlpha = 0.06 + Math.sin(t * 120) * 0.04;
      ctx.fillStyle = `rgba(255, 250, 230, ${flickAlpha.toFixed(3)})`;
      ctx.fillRect(4 * TILE_SIZE, 10 * TILE_SIZE, 5 * TILE_SIZE, 2 * TILE_SIZE);
    }

    // Subtle light hum visual: faint horizontal lines in ceiling area (fluorescent tube look)
    ctx.fillStyle = 'rgba(255, 250, 240, 0.02)';
    for (let row = 9; row < 14; row++) {
      for (let ly = 0; ly < TILE_SIZE; ly += 3) {
        ctx.fillRect(0, row * TILE_SIZE + ly, 13 * TILE_SIZE, 1);
      }
    }

    // Back shelf area darker — warm shadow
    ctx.fillStyle = 'rgba(30, 15, 0, 0.12)';
    ctx.fillRect(0, 14 * TILE_SIZE, 13 * TILE_SIZE, 6 * TILE_SIZE);

    // Counter shadow on workspace
    ctx.fillStyle = 'rgba(40, 20, 0, 0.06)';
    ctx.fillRect(0, 9 * TILE_SIZE, 13 * TILE_SIZE, TILE_SIZE);

    // ---- TIME-OF-DAY LIGHT RAYS ----
    if (progress < 0.75) {
      this.renderLightRays(ctx, progress, gameState.weather);
    }

    // ---- CEILING TEXTURE (acoustic tile look) ----
    ctx.fillStyle = 'rgba(180, 170, 155, 0.04)';
    for (let cx = 0; cx < 13; cx++) {
      for (let cy = 8; cy < 14; cy++) {
        // Grid of dots simulating acoustic tile holes
        for (let dx = 2; dx < TILE_SIZE; dx += 4) {
          for (let dy = 2; dy < TILE_SIZE; dy += 4) {
            ctx.fillRect(cx * TILE_SIZE + dx, cy * TILE_SIZE + dy, 1, 1);
          }
        }
      }
    }

    // ---- FLOOR REFLECTIONS of overhead lights ----
    // Oval bright spots on floor (rows 12-13, under fluorescent fixtures)
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#fff8e8';
    const floorLights = [
      { cx: 4.5, cy: 12.5 },
      { cx: 7.5, cy: 12.5 },
      { cx: 10.5, cy: 12.5 },
    ];
    for (const fl of floorLights) {
      ctx.beginPath();
      ctx.ellipse(
        fl.cx * TILE_SIZE, fl.cy * TILE_SIZE,
        TILE_SIZE * 1.2, TILE_SIZE * 0.5,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();

    // Meter-based ambient tint
    if (gameState.meters) {
      const urgency = Math.max(gameState.meters.rage, gameState.meters.burnout) / 100;
      if (urgency > 0.5) {
        const alpha = (urgency - 0.5) * 0.08;
        ctx.fillStyle = `rgba(255, 50, 0, ${alpha})`;
        ctx.fillRect(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
      }
    }
  }

  // ---- LIGHT RAY HELPER ----
  renderLightRays(ctx, progress, weather) {
    ctx.save();
    // Morning: ray from right, golden. Afternoon: warmer/amber, steeper angle.
    let rayAlpha, rayR, rayG, rayB, angleShift;
    if (progress < 0.3) {
      // Morning — bright golden diagonal from right
      const m = progress / 0.3;
      rayAlpha = 0.05 * (1 - m * 0.5);
      rayR = 255; rayG = 230; rayB = 160;
      angleShift = 0.15 + m * 0.1;
    } else if (progress < 0.6) {
      // Midday — faint warm ray
      rayAlpha = 0.03;
      rayR = 255; rayG = 245; rayB = 200;
      angleShift = 0.25;
    } else {
      // Afternoon — amber, steeper, fading
      const a = (progress - 0.6) / 0.15;
      rayAlpha = 0.04 * Math.max(0, 1 - a);
      rayR = 255; rayG = 200; rayB = 120;
      angleShift = 0.3 + a * 0.15;
    }

    // Dim rays based on cloud cover / rain
    if (weather && (weather.isCloudy || weather.hasRain)) {
      const cloudDim = weather.hasRain ? 0.3 : 0.6;
      rayAlpha *= cloudDim;
    }

    if (rayAlpha < 0.005) { ctx.restore(); return; }

    // Draw gradient triangle from right edge
    const rightX = 14 * TILE_SIZE;
    const topY = 0;
    const bottomY = 8 * TILE_SIZE;
    const spreadX = rightX - 6 * TILE_SIZE * angleShift;

    const grad = ctx.createLinearGradient(rightX, topY, spreadX, bottomY);
    grad.addColorStop(0, `rgba(${rayR}, ${rayG}, ${rayB}, ${rayAlpha.toFixed(3)})`);
    grad.addColorStop(1, `rgba(${rayR}, ${rayG}, ${rayB}, 0)`);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(rightX, topY);
    ctx.lineTo(rightX, bottomY);
    ctx.lineTo(spreadX, bottomY);
    ctx.closePath();
    ctx.fill();

    // Second, thinner ray for variation
    const grad2 = ctx.createLinearGradient(rightX, topY + 2 * TILE_SIZE, spreadX + TILE_SIZE * 2, bottomY);
    grad2.addColorStop(0, `rgba(${rayR}, ${rayG}, ${rayB}, ${(rayAlpha * 0.5).toFixed(3)})`);
    grad2.addColorStop(1, `rgba(${rayR}, ${rayG}, ${rayB}, 0)`);
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.moveTo(rightX, topY + TILE_SIZE);
    ctx.lineTo(rightX, bottomY - TILE_SIZE);
    ctx.lineTo(spreadX + TILE_SIZE * 3, bottomY - TILE_SIZE);
    ctx.closePath();
    ctx.fill();

    // Dust motes floating IN the light rays
    const t = this.ambientTime;
    for (const mote of this.rayDustMotes) {
      const mx = spreadX + (rightX - spreadX) * mote.xFrac;
      const my = topY + (bottomY - topY) * mote.yFrac;
      // Drift with time
      const driftX = Math.sin(t * mote.speed + mote.phase) * 3;
      const driftY = (t * mote.speed * 4) % (bottomY - topY);
      const finalX = mx + driftX;
      const finalY = topY + ((my - topY + driftY) % (bottomY - topY));
      // Only draw if within ray triangle (rough check: x > spreadX)
      if (finalX > spreadX && finalX < rightX) {
        ctx.globalAlpha = mote.alpha * (rayAlpha / 0.05);
        ctx.fillStyle = `rgb(${Math.min(255, rayR + 30)}, ${Math.min(255, rayG + 20)}, ${Math.min(255, rayB + 20)})`;
        ctx.fillRect(finalX, finalY, 1.2, 1.2);
      }
    }
    ctx.globalAlpha = 1;

    // Warm bloom/glow where rays hit the floor (bottom of ray region)
    if (rayAlpha > 0.01) {
      const bloomGrad = ctx.createRadialGradient(
        (rightX + spreadX) / 2, bottomY, 0,
        (rightX + spreadX) / 2, bottomY, TILE_SIZE * 3
      );
      bloomGrad.addColorStop(0, `rgba(${rayR}, ${rayG}, ${Math.min(255, rayB + 40)}, ${(rayAlpha * 0.6).toFixed(3)})`);
      bloomGrad.addColorStop(1, `rgba(${rayR}, ${rayG}, ${rayB}, 0)`);
      ctx.fillStyle = bloomGrad;
      ctx.fillRect(spreadX - TILE_SIZE, bottomY - TILE_SIZE, rightX - spreadX + TILE_SIZE * 2, TILE_SIZE * 2);
    }

    ctx.restore();
  }

  // ========== WEATHER ==========

  renderWeather(ctx, state) {
    const weather = state.weather;
    if (!weather) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const t = state.time || 0;

    // Ambient tint from weather
    if (weather.lightTint) {
      const [r, g, b] = weather.lightTint;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${weather.lightAlpha || 0.03})`;
      ctx.fillRect(0, 0, w, h);
    }

    // ---- FULL-SCREEN RAIN ----
    if (weather.hasRain) {
      ctx.save();

      // Wind effect: time-varying wind angle using sin wave
      const windBase = 1.5;
      const windWave = Math.sin(t * 0.7) * 0.8 + Math.sin(t * 1.3) * 0.4;
      const windSlant = windBase + windWave; // drifts left/right

      // Main rain drops — 70 drops across the entire canvas
      for (let i = 0; i < this.rainDrops.length; i++) {
        const drop = this.rainDrops[i];
        // Deterministic but animated position using seed + time
        const windDrift = windWave * t * 2 * drop.windOffset;
        const rx = ((drop.xBase * w + t * 30 * drop.windOffset + i * 73.7 + windDrift) % (w + 40)) - 20;
        const ry = ((t * drop.speed + drop.seed * 47.3) % (h + 20)) - 10;
        const len = drop.length;

        ctx.globalAlpha = drop.alpha;
        ctx.strokeStyle = '#8898bc';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - windSlant * len * 0.3, ry + len);
        ctx.stroke();
      }

      // ---- RAIN SPLASHES at ground level ----
      // Spawn new splashes (probabilistic each frame)
      if (Math.random() < 0.35) {
        this.rainSplashes.push({
          x: Math.random() * w,
          y: h * (0.85 + Math.random() * 0.12), // near bottom
          frame: 0,
          maxFrames: 4,
        });
      }

      // Draw and age splashes
      for (let i = this.rainSplashes.length - 1; i >= 0; i--) {
        const sp = this.rainSplashes[i];
        sp.frame += 1;
        if (sp.frame > sp.maxFrames) {
          this.rainSplashes.splice(i, 1);
          continue;
        }
        const r = 1 + sp.frame * 1.2;
        const splashAlpha = 0.25 * (1 - sp.frame / sp.maxFrames);
        ctx.globalAlpha = splashAlpha;
        ctx.strokeStyle = '#8898bc';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ---- WINDOW CONDENSATION / FOG OVERLAY ----
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = '#a0b0c8';
      ctx.fillRect(0, 0, w, h);

      // ---- WINDOW CONDENSATION DROPLETS (on counter row 7 area) ----
      // These are rendered in screen-space, so we approximate the counter region
      const scale = this.camZoom * this.dpr;
      const txOff = w / 2 - this.camX * scale;
      const tyOff = h / 2 - this.camY * scale;
      for (const drop of this.condensationDrops) {
        // Slow downward drift simulating gravity on condensation
        drop.y += drop.drift / 60;
        if (drop.y > 8 * TILE_SIZE) {
          drop.y = 7 * TILE_SIZE + Math.random() * TILE_SIZE * 0.3;
          drop.x = (Math.random() * 13) * TILE_SIZE + Math.random() * TILE_SIZE;
        }
        const sx = drop.x * scale + txOff;
        const sy = drop.y * scale + tyOff;
        // Tiny translucent water drop with white highlight
        ctx.globalAlpha = drop.alpha;
        ctx.fillStyle = '#8898bc';
        ctx.beginPath();
        ctx.arc(sx, sy, drop.r * scale * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // White highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(sx - drop.r * scale * 0.1, sy - drop.r * scale * 0.1, drop.r * scale * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- PUDDLE REFLECTIONS near entrance (rows 2-3) ----
      // Subtle lighter rectangles on floor tiles to simulate wet floor
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#a0b8d0';
      for (let col = 2; col < 12; col += 2) {
        for (let row = 2; row <= 3; row++) {
          const prx = col * TILE_SIZE * scale + txOff;
          const pry = row * TILE_SIZE * scale + tyOff;
          const pw = TILE_SIZE * scale * 0.8;
          const ph = TILE_SIZE * scale * 0.3;
          ctx.fillRect(prx + TILE_SIZE * scale * 0.1, pry + TILE_SIZE * scale * 0.6, pw, ph);
        }
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // ---- THUNDER FLASH (multi-frame with decay) ----
    if (weather.hasThunder) {
      // Trigger: rare event
      if (Math.sin(t * 0.7) > 0.995 && this.thunderFrames <= 0) {
        this.thunderFrames = 3;
        this.thunderDecay = 0.12;
      }
      if (this.thunderFrames > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.thunderDecay.toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
        this.thunderDecay *= 0.55; // rapid decay across frames
        this.thunderFrames--;
      }
    }
  }

  // ========== OFF-SCREEN INDICATORS ==========

  renderOffScreenIndicators(ctx) {
    if (this.offScreenEvents.length === 0) return;

    for (const evt of this.offScreenEvents) {
      const sx = evt.screenX * this.dpr;
      const sy = evt.screenY * this.dpr;

      // Pulsing arrow pointing toward the off-screen event
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(evt.angle);

      // Arrow
      const size = evt.urgency >= 2 ? 12 : 8;
      ctx.fillStyle = evt.color;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size / 2, -size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();
      ctx.fill();

      // Urgency ring
      if (evt.urgency >= 1) {
        ctx.strokeStyle = evt.urgency >= 2 ? '#ff4444' : evt.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, size + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  // ========== ZOOM HINT ==========

  renderZoomHint(ctx, gameState) {
    // Small indicator showing current zoom mode
    if (this.mode === 'OVERVIEW') {
      ctx.fillStyle = 'rgba(240, 200, 140, 0.6)';
      ctx.font = `${10 * this.dpr}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('OVERVIEW', this.canvas.width / 2, this.canvas.height - 8 * this.dpr);
    }
  }

  // ========== ENTITIES ==========

  renderWorldAnimations(ctx, state) {
    const t = state.time || 0;

    // Wall clock (on back wall, row 16, col 7)
    const clockX = 7 * TILE_SIZE;
    const clockY = 16 * TILE_SIZE + 2;
    // Clock face
    ctx.fillStyle = '#f0ece0';
    ctx.beginPath();
    ctx.arc(clockX + 8, clockY + 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a4030';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // Clock hands — rotate based on game time
    const progress = t / 360; // 0-1 over shift
    const hourAngle = -Math.PI / 2 + progress * Math.PI * 2;
    const minAngle = -Math.PI / 2 + progress * Math.PI * 24; // Faster rotation
    // Hour hand
    ctx.strokeStyle = '#3a2820';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(clockX + 8, clockY + 6);
    ctx.lineTo(clockX + 8 + Math.cos(hourAngle) * 3.5, clockY + 6 + Math.sin(hourAngle) * 3.5);
    ctx.stroke();
    // Minute hand
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(clockX + 8, clockY + 6);
    ctx.lineTo(clockX + 8 + Math.cos(minAngle) * 4.5, clockY + 6 + Math.sin(minAngle) * 4.5);
    ctx.stroke();
    // Center dot
    ctx.fillStyle = '#3a2820';
    ctx.beginPath();
    ctx.arc(clockX + 8, clockY + 6, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Hanging signs sway gently
    const swayAngle = Math.sin(t * 1.2) * 0.03; // Very subtle sway
    const signs = [
      { text: '💊', x: 6 * TILE_SIZE + 8, y: 6 * TILE_SIZE },
    ];
    for (const sign of signs) {
      ctx.save();
      ctx.translate(sign.x, sign.y);
      ctx.rotate(swayAngle);
      // Hanging chain
      ctx.strokeStyle = '#8a8070';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Monitors screen glow flicker (subtle)
    const monitorFlicker = Math.sin(t * 3.7) * 0.03 + 0.05;
    ctx.fillStyle = `rgba(100, 180, 220, ${monitorFlicker})`;
    ctx.fillRect(4 * TILE_SIZE + 3, 10 * TILE_SIZE + 3, 10, 7);
    ctx.fillRect(9 * TILE_SIZE + 3, 10 * TILE_SIZE + 3, 10, 7);

    // Receipt printer animation
    if (this.receiptProgress > 0) {
      this.receiptProgress -= 1 / 60;
      const printerX = (STATIONS.verify.col + 2) * TILE_SIZE;
      const printerY = STATIONS.verify.row * TILE_SIZE;
      const paperLen = Math.min(10, (1.5 - this.receiptProgress) * 12);

      // Paper scrolling out
      ctx.fillStyle = '#f0ede5';
      ctx.fillRect(printerX + 5, printerY - paperLen, 6, paperLen);
      // Paper curl at top
      if (paperLen > 4) {
        ctx.fillStyle = '#e8e5dd';
        ctx.fillRect(printerX + 6, printerY - paperLen - 1, 4, 1);
      }
      // Text lines on paper
      ctx.fillStyle = '#aaa';
      for (let li = 0; li < Math.min(4, paperLen / 2.5); li++) {
        ctx.fillRect(printerX + 6, printerY - paperLen + 1 + li * 2.5, 4, 0.5);
      }
    }
  }

  renderPhone(ctx, state) {
    const phoneStation = STATIONS.phone;
    const px = phoneStation.col * TILE_SIZE;
    const py = phoneStation.row * TILE_SIZE;

    const ringing = state.phoneRinging;
    const phoneSprite = Sprites.phone(ringing);

    if (ringing) {
      const vx = Math.sin(state.time * 30) * 1;
      const vy = Math.cos(state.time * 25) * 0.5;
      ctx.drawImage(phoneSprite, px + vx, py + vy);

      ctx.strokeStyle = `rgba(255, 136, 0, ${0.3 + Math.sin(state.time * 8) * 0.2})`;
      ctx.lineWidth = 0.5;
      const ringRadius = 8 + Math.sin(state.time * 6) * 4;
      ctx.beginPath();
      ctx.arc(px + 8, py + 8, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px + 8, py + 8, ringRadius + 4, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.drawImage(phoneSprite, px, py);
    }
  }

  renderDriveThruCars(ctx, state) {
    // Support both numeric driveThruCars and array-of-objects driveThruCars
    const carCount = Array.isArray(state.driveThruCars)
      ? state.driveThruCars.length
      : (state.driveThruCars || 0);

    if (carCount > 0) {
      const defaultCarColors = ['#6a7a98', '#a85848', '#5a8a5a'];

      for (let i = 0; i < Math.min(carCount, 3); i++) {
        const carData = Array.isArray(state.driveThruCars) ? state.driveThruCars[i] : null;
        const carColor = carData?.color || defaultCarColors[i % defaultCarColors.length];
        const isWaiting = carData ? carData.waiting : true;

        // Use variety vehicle sprites based on index for visual diversity
        const vehicleTypes = [SpriteVehicles.sedan, SpriteVehicles.suv, SpriteVehicles.minivan, SpriteVehicles.pickup, SpriteVehicles.sportsCar];
        let carSprite;
        const vType = vehicleTypes[i % vehicleTypes.length];
        if (vType) {
          carSprite = vType(carColor);
        } else if (typeof Sprites.car === 'function') {
          carSprite = Sprites.car(carColor);
        } else {
          carSprite = null;
        }

        const bob = Math.sin(state.time * 2 + i * 1.5) * 0.3;
        const cx = 14 * TILE_SIZE;
        const cy = (8 + i * 2) * TILE_SIZE + bob;

        if (carSprite) {
          ctx.drawImage(carSprite, cx, cy);
        } else {
          // Draw car manually: colored rectangle (28x10) with window and wheels
          ctx.fillStyle = carColor;
          ctx.fillRect(cx, cy + 2, 28, 10);
          // Window (dark rect)
          ctx.fillStyle = 'rgba(40, 50, 70, 0.7)';
          ctx.fillRect(cx + 4, cy + 3, 8, 5);
          // Wheels (2 circles)
          ctx.fillStyle = '#333';
          ctx.beginPath();
          ctx.arc(cx + 6, cy + 13, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx + 22, cy + 13, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Honk lines from first car if drive-thru event active
        if (i === 0 && state.stationManager.getStation('drive')?.hasEvent) {
          const honkPhase = Math.sin(state.time * 5);
          if (honkPhase > 0.3) {
            ctx.strokeStyle = `rgba(255, 200, 100, ${(honkPhase - 0.3) * 0.4})`;
            ctx.lineWidth = 0.5;
            // Sound waves
            for (let r = 0; r < 3; r++) {
              const radius = 6 + r * 4 + honkPhase * 3;
              ctx.beginPath();
              ctx.arc(cx + 4, cy + 8, radius, -Math.PI * 0.4, Math.PI * 0.4);
              ctx.stroke();
            }
          }
        }

        // Exhaust puff from rear of waiting cars (gray particles)
        if (isWaiting && Math.sin(state.time * 1.5 + i * 3) > 0.6) {
          const puffCount = 2;
          for (let p = 0; p < puffCount; p++) {
            const puffAge = (state.time * 1.2 + i * 2 + p * 0.5) % 1.5;
            const puffAlpha = Math.max(0, 0.15 * (1 - puffAge / 1.5));
            ctx.fillStyle = `rgba(160, 155, 145, ${puffAlpha})`;
            const puffX = cx + 26 + puffAge * 6 + Math.sin(state.time * 2 + i + p) * 2;
            const puffY = cy + 6 + Math.cos(state.time * 1.5 + i + p) * 1 - puffAge * 2;
            const puffR = 1.5 + puffAge * 2;
            ctx.beginPath();
            ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  renderPharmacist(ctx, state) {
    const pharm = state.pharmacist;
    const frame = pharm.state === 'WALKING'
      ? (Math.floor(state.time * 8) % 6)
      : 0;
    const facing = pharm.facing || 'right';
    const sprite = Sprites.pharmacist(facing, frame, pharm.stress || 0, state.time || 0);

    const px = pharm.col * TILE_SIZE;
    const py = pharm.row * TILE_SIZE;

    // Squash-and-stretch for walking
    if (pharm.state === 'WALKING') {
      const walkCos = Math.cos(state.time * 18);
      const sX = 1 + walkCos * 0.03;
      const sY = 1 - walkCos * 0.03;
      ctx.save();
      ctx.translate(px + 8, py + 12);
      ctx.scale(sX, sY);
      ctx.translate(-(px + 8), -(py + 12));
      ctx.drawImage(sprite, px, py - 4);
      ctx.restore();
    } else {
      ctx.drawImage(sprite, px, py - 4);
    }

    // Walking dust particles — tiny warm-colored puffs (every 8th frame)
    if (pharm.state === 'WALKING' && this._frameCounter % 8 === 0) {
      this.spawnParticles(pharm.col, pharm.row + 0.5, 'rgba(180,160,130,0.5)', 1);
    }

    // Working indicator — animated glow + progress arc
    if (pharm.state === 'WORKING') {
      const pulse = 0.08 + Math.sin(state.time * 4) * 0.04;
      ctx.fillStyle = `rgba(240, 200, 100, ${pulse})`;
      ctx.beginPath();
      ctx.arc(px + 8, py + 6, 14, 0, Math.PI * 2);
      ctx.fill();

      const progress = pharm.workTimer / pharm.workDuration;
      ctx.strokeStyle = 'rgba(240, 200, 100, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px + 8, py + 6, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = progress > 0.8 ? '#f0d880' : '#e8c060';
      ctx.beginPath();
      ctx.arc(px + 8, py + 6, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();

      // Spinning loading circle above pharmacist
      const spinAngle = state.time * 6;
      const spinX = px + 8;
      const spinY = py - 10;
      ctx.strokeStyle = 'rgba(240, 200, 100, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(spinX, spinY, 3, spinAngle, spinAngle + Math.PI * 1.5);
      ctx.stroke();
      // Dot at the leading edge
      ctx.fillStyle = 'rgba(240, 200, 100, 0.7)';
      ctx.beginPath();
      ctx.arc(
        spinX + Math.cos(spinAngle + Math.PI * 1.5) * 3,
        spinY + Math.sin(spinAngle + Math.PI * 1.5) * 3,
        0.8, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // Stress exclamation marks floating up when stress > 0.5
    if (pharm.stress > 0.5) {
      // Spawn occasionally
      if (Math.sin(state.time * 3.5) > 0.9 && this.stressExclamations.length < 5) {
        this.stressExclamations.push({
          x: px + 6 + Math.random() * 6,
          y: py - 2,
          life: 0.8,
          maxLife: 0.8,
          vx: (Math.random() - 0.5) * 6,
        });
      }
      // Draw and age
      for (let i = this.stressExclamations.length - 1; i >= 0; i--) {
        const ex = this.stressExclamations[i];
        ex.life -= 1 / 60;
        ex.y -= 0.5;
        ex.x += ex.vx / 60;
        if (ex.life <= 0) {
          this.stressExclamations.splice(i, 1);
          continue;
        }
        const ea = (ex.life / ex.maxLife) * 0.7;
        ctx.fillStyle = `rgba(255, 60, 40, ${ea})`;
        ctx.font = 'bold 5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', ex.x, ex.y);
      }
    }

    // Idle thought bubble
    if (pharm.state === 'IDLE' && pharm.idleTimer > 2) {
      const dotPhase = Math.floor(state.time * 2) % 4;
      ctx.fillStyle = '#888';
      for (let d = 0; d < Math.min(dotPhase, 3); d++) {
        ctx.beginPath();
        ctx.arc(px + 14 + d * 3, py - 6, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Stress sweat particles when meters are high
    if (pharm.stress > 0.7 && pharm.state !== 'WORKING') {
      const sweatAlpha = 0.3 + Math.sin(state.time * 5) * 0.2;
      ctx.fillStyle = `rgba(136, 204, 255, ${sweatAlpha})`;
      ctx.beginPath();
      ctx.arc(px + 13, py - 2 + Math.sin(state.time * 3) * 2, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderAmbientShoppers(ctx, state) {
    if (!state.ambientShoppers) return;
    for (const shopper of state.ambientShoppers) {
      const sprite = Sprites.patient(shopper.paletteIndex, 0); // Always calm
      const px = shopper.col * TILE_SIZE;
      const py = shopper.row * TILE_SIZE;
      const walkBob = shopper.state === 'WALKING' || shopper.state === 'LEAVING'
        ? Math.sin(state.time * 8 + shopper.id) * 0.5 : 0;

      // Slightly transparent — background characters
      ctx.globalAlpha = 0.7;
      ctx.drawImage(sprite, px, py - 4 + walkBob);

      // Shopping cart/basket
      if (shopper.hasCart) {
        ctx.fillStyle = '#8a8070';
        ctx.fillRect(px + (shopper.facing === 'right' ? 12 : -6), py + 8, 5, 4);
        ctx.fillStyle = '#9a9080';
        ctx.fillRect(px + (shopper.facing === 'right' ? 12 : -6), py + 7, 5, 1);
      }

      ctx.globalAlpha = 1;
    }
  }

  renderPatients(ctx, state, sortedPatients) {
    for (const patient of sortedPatients) {
      if (!patient.visible) continue;

      const emotionLevel = patient.stormingOut ? 2 : patient.patience < 0.3 ? 2 : patient.patience < 0.6 ? 1 : 0;
      const sprite = Sprites.patient(patient.paletteIndex, emotionLevel);

      const px = patient.col * TILE_SIZE;
      const py = patient.row * TILE_SIZE;

      if (patient.opacity !== undefined && patient.opacity < 1) {
        ctx.globalAlpha = Math.max(0, patient.opacity);
      }

      const bob = emotionLevel >= 2 ? Math.sin(state.time * 8 + patient.id) * 1 : 0;
      const walkBob = patient.walking ? Math.sin(state.time * 10) * 0.5 : 0;
      const drawY = py - 4 + bob + walkBob;

      // Squash-and-stretch for patients
      if (patient.walking) {
        const pCos = Math.cos(state.time * 16 + patient.id * 2);
        const psX = 1 + pCos * 0.025;
        const psY = 1 - pCos * 0.025;
        ctx.save();
        ctx.translate(px + 8, drawY + 12);
        ctx.scale(psX, psY);
        ctx.translate(-(px + 8), -(drawY + 12));
        ctx.drawImage(sprite, px, drawY);
        ctx.restore();
      } else {
        // Subtle idle bob
        const idleCos = Math.cos(state.time * 3 + patient.id);
        const isX = 1 + idleCos * 0.008;
        const isY = 1 - idleCos * 0.008;
        ctx.save();
        ctx.translate(px + 8, drawY + 12);
        ctx.scale(isX, isY);
        ctx.translate(-(px + 8), -(drawY + 12));
        ctx.drawImage(sprite, px, drawY);
        ctx.restore();
      }

      // Idle behaviors (only when not walking)
      if (!patient.walking && !patient.fadeOut) {
        const idleSeed = patient.id % 4;

        // Subtle head-turn: eyes shift left/right randomly
        const headTurnPhase = Math.sin(state.time * 0.6 + patient.id * 2.3);
        if (Math.abs(headTurnPhase) > 0.7) {
          const eyeShift = headTurnPhase > 0 ? 1 : -1;
          ctx.fillStyle = 'rgba(30, 20, 10, 0.2)';
          ctx.fillRect(px + 5 + eyeShift, py + 1, 1, 1);
          ctx.fillRect(px + 9 + eyeShift, py + 1, 1, 1);
        }

        // Weight-shifting: alternate foot darkening every 2 seconds
        const weightPhase = Math.floor(state.time * 0.5 + patient.id) % 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        if (weightPhase === 0) {
          ctx.fillRect(px + 4, py + 12, 3, 2); // left foot darker
        } else {
          ctx.fillRect(px + 9, py + 12, 3, 2); // right foot darker
        }

        if (emotionLevel === 0 && idleSeed === 0) {
          // Looking at phone — small rectangle in hand
          const phoneY = py + 8 + Math.sin(state.time * 1.5 + patient.id) * 0.3;
          ctx.fillStyle = '#2a2420';
          ctx.fillRect(px + 11, phoneY, 3, 4);
          // Screen glow
          ctx.fillStyle = 'rgba(150, 200, 255, 0.4)';
          ctx.fillRect(px + 11.5, phoneY + 0.5, 2, 3);
        } else if (emotionLevel === 0 && idleSeed === 1) {
          // Arms crossed — subtle overlay
          const crossPhase = Math.floor(state.time * 0.5 + patient.id) % 8;
          if (crossPhase === 0) {
            // Occasional slight head turn
            ctx.fillStyle = 'rgba(0,0,0,0.03)';
            ctx.fillRect(px + 3, py, 2, 6);
          }
        } else if (emotionLevel >= 1 && !patient.walking) {
          // Impatient foot-tap indicator
          const tapFrame = Math.floor(state.time * 4 + patient.id) % 2;
          if (tapFrame === 0) {
            ctx.fillStyle = emotionLevel >= 2 ? '#ff4444' : '#e8a040';
            ctx.fillRect(px + 6, py + 12, 2, 1);
          }

          // Impatient arm gesture (waving/pointing at watch)
          if (emotionLevel >= 2 && Math.sin(state.time * 3 + patient.id * 2) > 0.7) {
            ctx.fillStyle = 'rgba(255, 80, 40, 0.2)';
            ctx.fillRect(px + 12, py + 4, 3, 2); // raised arm
          }

          // Sigh puff effect for impatient patients (emotionLevel >= 1)
          if (Math.sin(state.time * 1.2 + patient.id * 3.7) > 0.95) {
            this.sighPuffs.push({
              x: px + 8,
              y: py - 6,
              life: 0.6,
              maxLife: 0.6,
            });
          }
        }

        // Occasional look-around (all patience levels)
        const lookPhase = Math.sin(state.time * 0.8 + patient.id * 1.7);
        if (lookPhase > 0.95) {
          // Head-turn dots (eyes shift)
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(px + 3, py + 1, 1, 1);
        }
      }

      ctx.globalAlpha = 1;
    }

    // Draw sigh puffs above impatient patients (rendered once, outside patient loop)
    for (let si = this.sighPuffs.length - 1; si >= 0; si--) {
      const sp = this.sighPuffs[si];
      sp.life -= 1 / 60;
      sp.y -= 0.3;
      if (sp.life <= 0) {
        this.sighPuffs.splice(si, 1);
        continue;
      }
      const sa = (sp.life / sp.maxLife) * 0.25;
      const sr = 1.5 + (1 - sp.life / sp.maxLife) * 2;
      ctx.fillStyle = `rgba(200, 200, 200, ${sa})`;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderBubbles(ctx, state, sortedPatients) {
    for (const patient of sortedPatients) {
      if (!patient.visible || !patient.showBubble) continue;

      const bubble = Sprites.speechBubble(patient.bubbleText, 90);
      const px = patient.col * TILE_SIZE;
      const py = patient.row * TILE_SIZE;

      const fadeIn = Math.min(1, (3 - patient.bubbleTimer + 0.01) * 4);
      const fadeOut = Math.min(1, patient.bubbleTimer * 3);
      ctx.globalAlpha = Math.min(fadeIn, fadeOut);

      ctx.drawImage(bubble, px - bubble.width / 2 + 8, py - bubble.height - 6);
      ctx.globalAlpha = 1;
    }
  }

  renderLunchGate(ctx, state) {
    if (this.gateProgress < 0.01) return;

    const gateWidth = 13 * TILE_SIZE; // Counter width
    const gateHeight = 2 * TILE_SIZE; // Two tiles tall
    const gateX = 0;
    const gateY = 7 * TILE_SIZE - gateHeight * this.gateProgress + gateHeight;

    // Only draw the visible portion
    const visibleH = gateHeight * this.gateProgress;
    if (visibleH < 0.5) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(gateX, 7 * TILE_SIZE, gateWidth, gateHeight);
    ctx.clip();

    // Metal gate slats
    const slotColor = '#7a7268';
    const slotHighlight = '#8a8278';
    const slotShadow = '#5a5248';

    for (let sy = 0; sy < visibleH; sy += 3) {
      const slotY = gateY + sy;
      ctx.fillStyle = slotColor;
      ctx.fillRect(gateX, slotY, gateWidth, 2.5);
      ctx.fillStyle = slotHighlight;
      ctx.fillRect(gateX, slotY, gateWidth, 0.5);
      ctx.fillStyle = slotShadow;
      ctx.fillRect(gateX, slotY + 2, gateWidth, 0.5);
    }

    // Vertical supports
    ctx.fillStyle = '#6a6258';
    ctx.fillRect(gateX, gateY, 2, visibleH);
    ctx.fillRect(gateX + gateWidth - 2, gateY, 2, visibleH);
    ctx.fillRect(gateX + gateWidth / 2 - 1, gateY, 2, visibleH);

    // Handle at bottom
    if (this.gateProgress > 0.5) {
      ctx.fillStyle = '#4a4238';
      ctx.fillRect(gateX + gateWidth / 2 - 4, gateY + visibleH - 3, 8, 2);
      ctx.fillStyle = '#8a7a68';
      ctx.fillRect(gateX + gateWidth / 2 - 3, gateY + visibleH - 2.5, 6, 1);
    }

    // "CLOSED" text when mostly shut
    if (this.gateProgress > 0.8) {
      ctx.fillStyle = '#cc2233';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, (this.gateProgress - 0.8) * 5);
      ctx.fillText('CLOSED FOR LUNCH', gateX + gateWidth / 2, gateY + visibleH / 2 + 2);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // Draw a 3x3 pixel-art mini-icon for station types
  _drawStationMiniIcon(ctx, stationType, x, y) {
    // 3x3 colored pixel grids representing each station type
    const icons = {
      verify: [
        // Pill shape: green cross-like
        [null, '#44cc66', null],
        ['#44cc66', '#66ee88', '#44cc66'],
        [null, '#44cc66', null],
      ],
      pickup: [
        // Bag shape: brown
        ['#aa7744', '#cc9955', '#aa7744'],
        ['#cc9955', '#eebb77', '#cc9955'],
        ['#aa7744', '#aa7744', '#aa7744'],
      ],
      consult: [
        // Speech bubble: blue
        ['#4488cc', '#4488cc', '#4488cc'],
        ['#4488cc', '#66aaee', '#4488cc'],
        [null, '#4488cc', null],
      ],
      phone: [
        // Phone: dark gray
        [null, '#555555', null],
        ['#555555', '#888888', '#555555'],
        [null, '#555555', null],
      ],
      drive: [
        // Car: red
        [null, '#cc4444', '#cc4444'],
        ['#cc4444', '#ee6666', '#cc4444'],
        ['#666666', null, '#666666'],
      ],
    };
    const icon = icons[stationType];
    if (!icon) return;
    for (let iy = 0; iy < 3; iy++) {
      for (let ix = 0; ix < 3; ix++) {
        const c = icon[iy][ix];
        if (c) {
          ctx.fillStyle = c;
          ctx.fillRect(x + ix, y + iy, 1, 1);
        }
      }
    }
  }

  renderStationIndicators(ctx, state) {
    for (const station of state.stationManager.getAll()) {
      if (!station.hasEvent) continue;

      const px = station.col * TILE_SIZE;
      const py = station.row * TILE_SIZE;

      const pulse = 0.5 + Math.sin(state.time * 6) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = station.color;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', px + 8, py - 2);

      // Mini pixel-art icon above the "!" indicator
      ctx.globalAlpha = pulse * 0.9;
      this._drawStationMiniIcon(ctx, station.type, px + 6, py - 10);
      ctx.globalAlpha = 1;

      if (station.urgency > 0) {
        const ringColor = station.urgency >= 2 ? '#ff4444' : '#ffaa00';
        const ringAlpha = 0.3 + Math.sin(state.time * 4) * 0.2;
        ctx.strokeStyle = ringColor;
        ctx.globalAlpha = ringAlpha;
        ctx.lineWidth = station.urgency >= 2 ? 1.5 : 1;
        ctx.beginPath();
        ctx.arc(px + 8, py + 8, 10 + Math.sin(state.time * 4) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (station.urgency >= 2) {
          ctx.strokeStyle = '#ff0000';
          ctx.globalAlpha = 0.2;
          ctx.beginPath();
          ctx.arc(px + 8, py + 8, 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  renderParticles(ctx, dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;

      const alpha = Math.min(1, p.life / (p.maxLife * 0.5));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  renderFlashes(ctx, dt) {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const flash = this.flashes[i];
      flash.timer -= dt;

      if (flash.timer <= 0) {
        this.flashes.splice(i, 1);
        continue;
      }

      const progress = 1 - (flash.timer / flash.maxTimer);
      const px = flash.col * TILE_SIZE + 8;
      const py = flash.row * TILE_SIZE + 4;

      const radius = 4 + progress * 16;
      const alpha = (1 - progress) * 0.4;

      // Parse flash color for rgba
      const fc = flash.color || '#f0d880';
      const fr = parseInt(fc.slice(1, 3), 16);
      const fg = parseInt(fc.slice(3, 5), 16);
      const fb = parseInt(fc.slice(5, 7), 16);

      // Expanding ring with glow (draw 3 times at different alphas/sizes)
      for (let g = 2; g >= 0; g--) {
        const glowR = radius + g * 3;
        const glowA = alpha * (0.3 - g * 0.08);
        ctx.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${Math.max(0, glowA)})`;
        ctx.beginPath();
        ctx.arc(px, py, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main ring
      ctx.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      // Bright center flash
      if (progress < 0.3) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.3 - progress) * 2})`;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Checkmark with spring bounce
      if (progress > 0.1 && progress < 0.7) {
        const checkProgress = (progress - 0.1) / 0.6;
        const spring = 1 + Math.sin(checkProgress * Math.PI * 2) * 0.2 * (1 - checkProgress);
        const checkAlpha = (0.7 - progress) * 1.5;
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(spring, spring);
        ctx.strokeStyle = `rgba(${fr}, ${fg}, ${fb}, ${checkAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(-1, 3);
        ctx.lineTo(4, -3);
        ctx.stroke();
        ctx.restore();
      }

      // Spiral particles outward
      if (progress > 0.05 && progress < 0.6) {
        const spiralAlpha = (0.6 - progress) * 1.2;
        for (let sp = 0; sp < 5; sp++) {
          const baseAngle = (Math.PI * 2 / 5) * sp;
          const spiralAngle = baseAngle + progress * 4;
          const dist = radius * 0.6 + progress * 12;
          const sx = px + Math.cos(spiralAngle) * dist;
          const sy = py + Math.sin(spiralAngle) * dist;
          ctx.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${spiralAlpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // "DONE!" text popups with spring scale animation
    for (let i = this.completionTexts.length - 1; i >= 0; i--) {
      const ct = this.completionTexts[i];
      ct.timer += dt;
      if (ct.timer >= ct.maxTimer) {
        this.completionTexts.splice(i, 1);
        continue;
      }
      const ctProgress = ct.timer / ct.maxTimer;
      const ctPx = ct.col * TILE_SIZE + 8;
      const ctPy = ct.row * TILE_SIZE - 4 - ctProgress * 12; // float upward

      // Spring scale: 0 -> 1.2 -> 1.0
      let ctScale;
      if (ctProgress < 0.3) {
        ctScale = (ctProgress / 0.3) * 1.2;
      } else if (ctProgress < 0.5) {
        ctScale = 1.2 - ((ctProgress - 0.3) / 0.2) * 0.2;
      } else {
        ctScale = 1.0;
      }

      const ctAlpha = ctProgress < 0.6 ? 1 : (1 - (ctProgress - 0.6) / 0.4);

      // Parse color
      const ctc = ct.color || '#f0d880';
      ctx.save();
      ctx.translate(ctPx, ctPy);
      ctx.scale(ctScale, ctScale);
      ctx.globalAlpha = ctAlpha * 0.9;
      ctx.fillStyle = ctc;
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DONE!', 0, 0);
      ctx.restore();
    }
  }

  // ========== AMBIENT DUST MOTES ==========

  renderDustMotes(ctx, gameState) {
    const t = gameState.time || 0;
    ctx.save();
    for (const mote of this.dustMotes) {
      // Sinusoidal horizontal drift + slow vertical drift
      mote.x = mote.baseX + Math.sin(t * mote.freqX + mote.phase) * mote.ampX;
      mote.baseY += mote.speed / 60; // slow downward drift

      // Wrap vertically within the fluorescent zone (rows 9-14)
      if (mote.baseY > 14 * TILE_SIZE) {
        mote.baseY = 9 * TILE_SIZE;
      }
      mote.y = mote.baseY;

      ctx.globalAlpha = mote.alpha;
      ctx.fillStyle = '#e8d8c0';
      ctx.fillRect(mote.x, mote.y, 1, 1);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ========== FLUORESCENT FULL-FLICKER TIMER ==========

  updateFlickerTimer(dt) {
    // Count down to next full flicker event
    if (this.flickerFrames > 0) {
      this.flickerFrames--;
      if (this.flickerFrames <= 0) {
        this.flickerCooldown = 15 + Math.random() * 15;
      }
    } else {
      this.flickerCooldown -= dt;
      if (this.flickerCooldown <= 0) {
        this.flickerFrames = 3; // dim for 3 frames then snap back
      }
    }
  }

  // ========== CEILING DETAILS ==========

  renderCeilingDetails(ctx, gameState) {
    // Fluorescent light fixtures at rows 16-19 (back of pharmacy)
    // Gray rectangles with white center line, at regular intervals
    const fixtures = [
      { col: 3, row: 17 },
      { col: 6, row: 17 },
      { col: 9, row: 17 },
      { col: 6, row: 19 },
    ];
    for (const fix of fixtures) {
      const fx = fix.col * TILE_SIZE;
      const fy = fix.row * TILE_SIZE;
      // Gray fixture body
      ctx.fillStyle = 'rgba(160, 155, 145, 0.15)';
      ctx.fillRect(fx, fy + 2, TILE_SIZE, 3);
      // White center line (the fluorescent tube glow)
      const flickDim = this.flickerFrames > 0 ? 0.03 : 0.1;
      ctx.fillStyle = `rgba(255, 250, 235, ${flickDim})`;
      ctx.fillRect(fx + 2, fy + 3, TILE_SIZE - 4, 1);
    }

    // Air vent: small grid pattern at row 16, col 10
    const ventX = 10 * TILE_SIZE;
    const ventY = 16 * TILE_SIZE;
    ctx.fillStyle = 'rgba(120, 115, 105, 0.12)';
    ctx.fillRect(ventX + 2, ventY + 2, 12, 8);
    // Grid lines
    ctx.fillStyle = 'rgba(80, 75, 65, 0.1)';
    for (let vx = 0; vx < 4; vx++) {
      ctx.fillRect(ventX + 3 + vx * 3, ventY + 2, 0.5, 8);
    }
    for (let vy = 0; vy < 3; vy++) {
      ctx.fillRect(ventX + 2, ventY + 3 + vy * 3, 12, 0.5);
    }

    // Sprinkler head: tiny red dot at row 18, col 4
    ctx.fillStyle = 'rgba(200, 50, 40, 0.25)';
    ctx.beginPath();
    ctx.arc(4 * TILE_SIZE + 8, 18 * TILE_SIZE + 4, 1.2, 0, Math.PI * 2);
    ctx.fill();
    // Sprinkler base
    ctx.fillStyle = 'rgba(150, 145, 135, 0.12)';
    ctx.fillRect(4 * TILE_SIZE + 6, 18 * TILE_SIZE + 2, 4, 1);
  }

  // ========== FLOOR REFLECTION LAYER ==========

  renderFloorReflections(ctx, gameState) {
    // Very faint reflections of entities in workspace floor (rows 9-13)
    // Mirror pharmacist and patients vertically with very low alpha
    ctx.save();
    ctx.globalAlpha = 0.04;

    const pharm = gameState.pharmacist;
    if (pharm && pharm.row >= 5 && pharm.row <= 13) {
      // Reflect pharmacist: mirror y-position into rows 9-13
      const reflectRow = pharm.row + (13 - pharm.row) * 2;
      if (reflectRow >= 9 && reflectRow <= 14) {
        const rpx = pharm.col * TILE_SIZE;
        const rpy = reflectRow * TILE_SIZE;
        ctx.fillStyle = 'rgba(200, 180, 150, 1)';
        ctx.fillRect(rpx + 3, rpy, 10, 6);
      }
    }

    // Reflect patients
    if (gameState.patients) {
      for (const patient of gameState.patients) {
        if (!patient.visible) continue;
        if (patient.row >= 5 && patient.row <= 13) {
          const reflectRow = patient.row + (13 - patient.row) * 2;
          if (reflectRow >= 9 && reflectRow <= 14) {
            const rpx = patient.col * TILE_SIZE;
            const rpy = reflectRow * TILE_SIZE;
            ctx.fillStyle = 'rgba(180, 160, 140, 1)';
            ctx.fillRect(rpx + 3, rpy, 10, 6);
          }
        }
      }
    }

    ctx.restore();
  }

  // ========== SCREEN EDGE VIGNETTE ==========

  renderVignette(ctx, w, h) {
    // Radial gradient darkening toward edges
    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.sqrt(cx * cx + cy * cy);
    const innerR = outerR * 0.55;

    const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}
