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

  flashComplete(col, row) {
    this.flashes.push({ col, row, timer: 0.6, maxTimer: 0.6 });
    this.spawnParticles(col, row, '#f0d880', 8);
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

    // Draw station urgency indicators
    this.renderStationIndicators(ctx, gameState);

    // Draw completion flashes
    this.renderFlashes(ctx, dt);

    // Draw particles
    this.renderParticles(ctx, dt);

    ctx.restore();

    // Lunch overlay darkening (screen-space)
    if (gameState.phase === 'LUNCH_CLOSE') {
      ctx.fillStyle = 'rgba(20, 12, 5, 0.4)';
      ctx.fillRect(0, 0, w, h);
    }

    // Off-screen event indicators (screen-space)
    this.renderOffScreenIndicators(ctx);

    // Zoom mode indicator
    this.renderZoomHint(ctx, gameState);
  }

  // ========== LIGHTING ==========

  renderLighting(ctx, gameState) {
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
      const t = (progress - 0.6) / 0.4;
      todR = 255; todG = 200 - t * 40; todB = 120 - t * 40; todA = 0.04 + t * 0.06;
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
    ctx.fillStyle = 'rgba(255, 245, 220, 0.12)';
    ctx.fillRect(0, 9 * TILE_SIZE, 13 * TILE_SIZE, 5 * TILE_SIZE);

    // Fluorescent flicker (subtle, random)
    if (Math.sin(gameState.time * 47) > 0.97) {
      ctx.fillStyle = 'rgba(255, 250, 230, 0.08)';
      ctx.fillRect(4 * TILE_SIZE, 10 * TILE_SIZE, 5 * TILE_SIZE, 2 * TILE_SIZE);
    }

    // Back shelf area darker — warm shadow
    ctx.fillStyle = 'rgba(30, 15, 0, 0.12)';
    ctx.fillRect(0, 14 * TILE_SIZE, 13 * TILE_SIZE, 6 * TILE_SIZE);

    // Counter shadow on workspace
    ctx.fillStyle = 'rgba(40, 20, 0, 0.06)';
    ctx.fillRect(0, 9 * TILE_SIZE, 13 * TILE_SIZE, TILE_SIZE);

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
    if (state.driveThruCars > 0) {
      const carColors = ['#6a7a98', '#a85848', '#5a8a5a'];
      for (let i = 0; i < Math.min(state.driveThruCars, 3); i++) {
        const car = Sprites.car(carColors[i % carColors.length]);
        const bob = Math.sin(state.time * 2 + i * 1.5) * 0.3;
        ctx.drawImage(car,
          14 * TILE_SIZE,
          (8 + i * 2) * TILE_SIZE + bob
        );
      }
    }
  }

  renderPharmacist(ctx, state) {
    const pharm = state.pharmacist;
    const frame = pharm.state === 'WALKING'
      ? (Math.floor(state.time * 6) % 3)
      : 0;
    const facing = pharm.facing || 'right';
    const sprite = Sprites.pharmacist(facing, frame, pharm.stress || 0);

    const px = pharm.col * TILE_SIZE;
    const py = pharm.row * TILE_SIZE;

    ctx.drawImage(sprite, px, py - 4);

    // Walking dust particles — tiny warm-colored puffs
    if (pharm.state === 'WALKING' && Math.floor(state.time * 6) % 3 === 0) {
      const dustPhase = state.time * 12;
      if (Math.sin(dustPhase) > 0.8) {
        this.spawnParticles(pharm.col, pharm.row + 0.5, 'rgba(180,160,130,0.6)', 1);
      }
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

      const emotionLevel = patient.patience < 0.3 ? 2 : patient.patience < 0.6 ? 1 : 0;
      const sprite = Sprites.patient(patient.paletteIndex, emotionLevel);

      const px = patient.col * TILE_SIZE;
      const py = patient.row * TILE_SIZE;

      if (patient.opacity !== undefined && patient.opacity < 1) {
        ctx.globalAlpha = Math.max(0, patient.opacity);
      }

      const bob = emotionLevel >= 2 ? Math.sin(state.time * 8 + patient.id) * 1 : 0;
      const walkBob = patient.walking ? Math.sin(state.time * 10) * 0.5 : 0;

      ctx.drawImage(sprite, px, py - 4 + bob + walkBob);

      // Idle behaviors (only when not walking)
      if (!patient.walking && !patient.fadeOut) {
        const idleSeed = patient.id % 4;

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

      ctx.fillStyle = `rgba(240, 216, 128, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      if (progress < 0.3) {
        ctx.fillStyle = `rgba(255, 250, 230, ${(0.3 - progress) * 2})`;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (progress > 0.1 && progress < 0.7) {
        ctx.strokeStyle = `rgba(240, 216, 128, ${(0.7 - progress) * 1.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px - 3, py);
        ctx.lineTo(px - 1, py + 3);
        ctx.lineTo(px + 4, py - 3);
        ctx.stroke();
      }
    }
  }
}
