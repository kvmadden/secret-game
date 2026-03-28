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

    // Calculate scale to fit map height
    const mapPixelH = MAP_ROWS * TILE_SIZE;
    this.scale = (this.canvas.height / mapPixelH);

    // Ensure minimum scale
    if (this.scale < 1.5) this.scale = 1.5;
  }

  // Camera follows pharmacist with easing
  updateCamera(pharmacistCol, dt) {
    const mapPixelW = MAP_COLS * TILE_SIZE * this.scale;
    const screenW = this.canvas.width;

    // Target: center pharmacist horizontally
    this.targetCameraX = pharmacistCol * TILE_SIZE * this.scale - screenW / 2;

    // Clamp
    this.targetCameraX = Math.max(0, Math.min(this.targetCameraX, mapPixelW - screenW));

    // Ease toward target
    const ease = 1 - Math.pow(0.05, dt);
    this.cameraX += (this.targetCameraX - this.cameraX) * ease;
  }

  render(gameState) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, w, h);

    ctx.save();

    // Apply camera transform
    ctx.translate(-Math.round(this.cameraX), 0);
    ctx.scale(this.scale, this.scale);

    // Draw map
    if (this.mapCanvas) {
      ctx.drawImage(this.mapCanvas, 0, 0);
    }

    // Draw patients
    this.renderPatients(ctx, gameState);

    // Draw pharmacist
    this.renderPharmacist(ctx, gameState);

    // Draw speech bubbles
    this.renderBubbles(ctx, gameState);

    // Draw station urgency indicators
    this.renderStationIndicators(ctx, gameState);

    ctx.restore();

    // Lunch overlay darkening on the canvas
    if (gameState.phase === 'LUNCH_CLOSE') {
      ctx.fillStyle = 'rgba(10, 10, 20, 0.4)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  renderPharmacist(ctx, state) {
    const pharm = state.pharmacist;
    const frame = pharm.state === 'WALKING' ? (Math.floor(state.time * 6) % 3) : 0;
    const facing = pharm.facing || 'right';
    const sprite = Sprites.pharmacist(facing, frame);

    const px = pharm.col * TILE_SIZE;
    const py = pharm.row * TILE_SIZE;

    ctx.drawImage(sprite, px, py - 4); // Slight up offset so feet align with tile

    // Working indicator - glow around pharmacist
    if (pharm.state === 'WORKING') {
      ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(px + 8, py + 6, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderPatients(ctx, state) {
    for (const patient of state.patients) {
      if (!patient.visible) continue;

      const emotionLevel = patient.patience < 0.3 ? 2 : patient.patience < 0.6 ? 1 : 0;
      const sprite = Sprites.patient(patient.paletteIndex, emotionLevel);

      const px = patient.col * TILE_SIZE;
      const py = patient.row * TILE_SIZE;

      // Slight bobbing when angry
      const bob = emotionLevel >= 2 ? Math.sin(state.time * 8) * 1 : 0;

      ctx.drawImage(sprite, px, py - 4 + bob);
    }
  }

  renderBubbles(ctx, state) {
    for (const patient of state.patients) {
      if (!patient.visible || !patient.showBubble) continue;

      const bubble = Sprites.speechBubble(patient.bubbleText, 90);
      const px = patient.col * TILE_SIZE;
      const py = patient.row * TILE_SIZE;

      // Draw bubble above patient
      ctx.globalAlpha = Math.min(1, patient.bubbleTimer * 2);
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
        ctx.strokeStyle = station.urgency >= 2 ? '#ff4444' : '#ffaa00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px + 8, py + 8, 10 + Math.sin(state.time * 4) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Draw cars at drive-thru
    if (state.driveThruCars > 0) {
      const driveStation = STATIONS.drive;
      const carColors = ['#4466aa', '#aa4444', '#44aa66'];
      for (let i = 0; i < Math.min(state.driveThruCars, 3); i++) {
        const car = Sprites.car(carColors[i % carColors.length]);
        ctx.drawImage(car,
          (driveStation.col - 1) * TILE_SIZE,
          (1 + i * 1.5) * TILE_SIZE
        );
      }
    }
  }
}
