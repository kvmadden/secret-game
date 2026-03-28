/**
 * Canvas rendering - pharmacy view with camera follow.
 */

import { TILE_SIZE, MAP_COLS, MAP_ROWS, STATIONS, PATIENT_BARKS } from './constants.js';
import { renderMap } from './map.js';
import { Sprites } from './sprites.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mapCanvas = null;
    this.cameraX = 0;
    this.targetCameraX = 0;
    this.scale = 2;
    this.dpr = window.devicePixelRatio || 1;

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

    const mapPixelH = MAP_ROWS * TILE_SIZE;
    this.scale = (this.canvas.height / mapPixelH);
    if (this.scale < 1.5) this.scale = 1.5;
  }

  flashComplete(col, row) {
    this.flashes.push({ col, row, timer: 0.6, maxTimer: 0.6 });
    this.spawnParticles(col, row, '#44ff88', 8);
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

  updateCamera(pharmacistCol, dt) {
    const mapPixelW = MAP_COLS * TILE_SIZE * this.scale;
    const screenW = this.canvas.width;

    this.targetCameraX = pharmacistCol * TILE_SIZE * this.scale - screenW / 2;
    this.targetCameraX = Math.max(0, Math.min(this.targetCameraX, mapPixelW - screenW));

    const ease = 1 - Math.pow(0.05, dt);
    this.cameraX += (this.targetCameraX - this.cameraX) * ease;
  }

  render(gameState) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const dt = 1 / 60; // Approximate for flash decay

    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, w, h);

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (this.shakeDecay > 0) {
      this.shakeDecay -= dt;
      const intensity = this.shakeIntensity * Math.max(0, this.shakeDecay / 0.4);
      shakeX = (Math.random() - 0.5) * intensity * this.scale;
      shakeY = (Math.random() - 0.5) * intensity * this.scale;
      if (this.shakeDecay <= 0) this.shakeIntensity = 0;
    }

    ctx.save();
    ctx.translate(-Math.round(this.cameraX) + shakeX, shakeY);
    ctx.scale(this.scale, this.scale);

    // Draw map
    if (this.mapCanvas) {
      ctx.drawImage(this.mapCanvas, 0, 0);
    }

    // Darken customer area slightly (different lighting zone)
    ctx.fillStyle = 'rgba(0, 0, 20, 0.06)';
    ctx.fillRect(0, 0, MAP_COLS * TILE_SIZE, 4 * TILE_SIZE);

    // Fluorescent lighting — bright band on workspace
    ctx.fillStyle = 'rgba(255, 255, 240, 0.06)';
    ctx.fillRect(0, 7 * TILE_SIZE, MAP_COLS * TILE_SIZE, 3 * TILE_SIZE);
    // Strong highlight on counter surface
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 4 * TILE_SIZE, 33 * TILE_SIZE, 2 * TILE_SIZE);
    // Back shelf area is darker
    ctx.fillStyle = 'rgba(0, 0, 20, 0.08)';
    ctx.fillRect(0, 10 * TILE_SIZE, MAP_COLS * TILE_SIZE, 4 * TILE_SIZE);

    // Cast shadow from counter onto workspace floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(0, 7 * TILE_SIZE, 33 * TILE_SIZE, TILE_SIZE);

    // Meter-based ambient tint — pharmacy gets redder as rage/burnout climb
    if (gameState.meters) {
      const urgency = Math.max(gameState.meters.rage, gameState.meters.burnout) / 100;
      if (urgency > 0.5) {
        const alpha = (urgency - 0.5) * 0.08;
        ctx.fillStyle = `rgba(255, 50, 0, ${alpha})`;
        ctx.fillRect(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
      }
    }

    // Draw phone (animated if ringing)
    this.renderPhone(ctx, gameState);

    // Draw drive-thru cars
    this.renderDriveThruCars(ctx, gameState);

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

    // Lunch overlay darkening
    if (gameState.phase === 'LUNCH_CLOSE') {
      ctx.fillStyle = 'rgba(10, 10, 20, 0.4)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  renderPhone(ctx, state) {
    const phoneStation = STATIONS.phone;
    const px = phoneStation.col * TILE_SIZE;
    const py = phoneStation.row * TILE_SIZE;

    const ringing = state.phoneRinging;
    const phoneSprite = Sprites.phone(ringing);

    if (ringing) {
      // Vibration offset
      const vx = Math.sin(state.time * 30) * 1;
      const vy = Math.cos(state.time * 25) * 0.5;
      ctx.drawImage(phoneSprite, px + vx, py + vy);

      // Ring waves
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
      const driveStation = STATIONS.drive;
      const carColors = ['#4466aa', '#aa4444', '#44aa66'];
      for (let i = 0; i < Math.min(state.driveThruCars, 3); i++) {
        const car = Sprites.car(carColors[i % carColors.length]);
        // Cars idle-bob slightly
        const bob = Math.sin(state.time * 2 + i * 1.5) * 0.3;
        ctx.drawImage(car,
          (driveStation.col - 1) * TILE_SIZE,
          (1 + i * 1.5) * TILE_SIZE + bob
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

    // Working indicator — animated glow + progress arc
    if (pharm.state === 'WORKING') {
      const pulse = 0.08 + Math.sin(state.time * 4) * 0.04;
      ctx.fillStyle = `rgba(0, 212, 255, ${pulse})`;
      ctx.beginPath();
      ctx.arc(px + 8, py + 6, 14, 0, Math.PI * 2);
      ctx.fill();

      const progress = pharm.workTimer / pharm.workDuration;
      // Background arc
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px + 8, py + 6, 11, 0, Math.PI * 2);
      ctx.stroke();
      // Progress arc
      ctx.strokeStyle = progress > 0.8 ? '#44ff88' : '#00d4ff';
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

  renderPatients(ctx, state, sortedPatients) {
    for (const patient of sortedPatients) {
      if (!patient.visible) continue;

      const emotionLevel = patient.patience < 0.3 ? 2 : patient.patience < 0.6 ? 1 : 0;
      const sprite = Sprites.patient(patient.paletteIndex, emotionLevel);

      const px = patient.col * TILE_SIZE;
      const py = patient.row * TILE_SIZE;

      // Apply opacity for fade out
      if (patient.opacity !== undefined && patient.opacity < 1) {
        ctx.globalAlpha = Math.max(0, patient.opacity);
      }

      // Angry bobbing
      const bob = emotionLevel >= 2 ? Math.sin(state.time * 8 + patient.id) * 1 : 0;
      // Walking bob
      const walkBob = patient.walking ? Math.sin(state.time * 10) * 0.5 : 0;

      ctx.drawImage(sprite, px, py - 4 + bob + walkBob);

      // Impatient foot-tap indicator
      if (emotionLevel >= 1 && !patient.walking) {
        const tapFrame = Math.floor(state.time * 4 + patient.id) % 2;
        if (tapFrame === 0) {
          ctx.fillStyle = emotionLevel >= 2 ? '#ff4444' : '#ffaa00';
          ctx.fillRect(px + 6, py + 12, 2, 1);
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

      // Fade in/out
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

      // Pulsing exclamation
      const pulse = 0.5 + Math.sin(state.time * 6) * 0.3;

      ctx.globalAlpha = pulse;
      ctx.fillStyle = station.color;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', px + 8, py - 2);
      ctx.globalAlpha = 1;

      // Urgency ring
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

        // Urgency level 2: inner ring too
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
      p.vy += 40 * dt; // gravity

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

      // Expanding green circle that fades
      const radius = 4 + progress * 16;
      const alpha = (1 - progress) * 0.4;

      ctx.fillStyle = `rgba(68, 255, 136, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright spark
      if (progress < 0.3) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.3 - progress) * 2})`;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Checkmark
      if (progress > 0.1 && progress < 0.7) {
        ctx.strokeStyle = `rgba(68, 255, 136, ${(0.7 - progress) * 1.5})`;
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
