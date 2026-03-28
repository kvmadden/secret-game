/**
 * HTML overlay UI for HUD, action cards, and overlays.
 */

import {
  SHIFT_START_HOUR, SHIFT_END_HOUR, GAME_DURATION,
  METER_MAX, PHASES, WIN_TITLES, LOSS_TITLES,
} from './constants.js';

export class UI {
  constructor() {
    // HUD elements
    this.phaseEl = document.getElementById('phase-name');
    this.timerEl = document.getElementById('timer');
    this.queueFill = document.getElementById('queue-fill');
    this.rageFill = document.getElementById('rage-fill');
    this.burnoutFill = document.getElementById('burnout-fill');
    this.queueValue = document.getElementById('queue-value');
    this.rageValue = document.getElementById('rage-value');
    this.burnoutValue = document.getElementById('burnout-value');
    this.pipeUnverified = document.getElementById('pipe-unverified-count');
    this.pipeReady = document.getElementById('pipe-ready-count');
    this.pipeServed = document.getElementById('pipe-served-count');

    // Card container
    this.cardContainer = document.getElementById('card-container');

    // Work progress
    this.workProgress = document.getElementById('work-progress');
    this.workBarFill = document.getElementById('work-bar-fill');
    this.workLabel = document.getElementById('work-label');

    // Overlays
    this.titleScreen = document.getElementById('title-screen');
    this.lunchOverlay = document.getElementById('lunch-overlay');
    this.lunchMessage = document.getElementById('lunch-message');
    this.lunchSub = document.getElementById('lunch-sub');
    this.resultsScreen = document.getElementById('results-screen');

    // Active card map: eventId -> DOM element
    this.activeCards = new Map();
  }

  // ========== HUD UPDATES ==========

  updateTimer(elapsed) {
    const progress = elapsed / GAME_DURATION;
    const totalHours = SHIFT_END_HOUR - SHIFT_START_HOUR;
    const currentHour = SHIFT_START_HOUR + totalHours * progress;
    const hours = Math.floor(currentHour);
    const minutes = Math.floor((currentHour - hours) * 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours;
    this.timerEl.textContent = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  updatePhase(phaseName) {
    const phase = PHASES.find(p => p.name === phaseName);
    this.phaseEl.textContent = phase ? phase.label : phaseName;
  }

  updateMeters(queue, rage, burnout) {
    this.queueFill.style.width = `${Math.min(100, queue)}%`;
    this.rageFill.style.width = `${Math.min(100, rage)}%`;
    this.burnoutFill.style.width = `${Math.min(100, burnout)}%`;
    this.queueValue.textContent = Math.round(queue);
    this.rageValue.textContent = Math.round(rage);
    this.burnoutValue.textContent = Math.round(burnout);

    // Flash when high
    this.queueFill.style.opacity = queue > 75 ? (0.7 + Math.sin(Date.now() / 200) * 0.3) : 1;
    this.rageFill.style.opacity = rage > 75 ? (0.7 + Math.sin(Date.now() / 200) * 0.3) : 1;
    this.burnoutFill.style.opacity = burnout > 75 ? (0.7 + Math.sin(Date.now() / 200) * 0.3) : 1;
  }

  updatePipeline(unverified, ready, served) {
    this.pipeUnverified.textContent = unverified;
    this.pipeReady.textContent = ready;
    this.pipeServed.textContent = served;
  }

  // ========== WORK PROGRESS ==========

  showWorkProgress(label, progress) {
    this.workProgress.style.display = 'block';
    this.workLabel.textContent = label;
    this.workBarFill.style.width = `${progress * 100}%`;
  }

  hideWorkProgress() {
    this.workProgress.style.display = 'none';
  }

  // ========== EVENT CARDS ==========

  addCard(event, onHandle, onDefer) {
    if (this.activeCards.has(event.uid)) return;

    const card = document.createElement('div');
    card.className = 'event-card' + (event.isEscalated ? ' escalated' : '') +
                     (event.isPipeline ? ' pipeline-card' : '');

    const stationClass = event.isInterrupt ? 'interrupt' :
                         `station-${event.station}`;

    card.innerHTML = `
      <div class="card-header">
        <span class="card-station ${stationClass}">${
          event.isInterrupt ? '⚠ NOT MY PROBLEM' :
          event.isPipeline ? '📋 PIPELINE' :
          event.station.toUpperCase()
        }</span>
        <span class="card-time">${event.duration}s</span>
      </div>
      <div class="card-title">${event.title}</div>
      <div class="card-desc">${event.desc}</div>
      <div class="card-effects">
        ${this.renderEffects(event.effects)}
      </div>
      <div class="card-buttons">
        <button class="card-btn btn-handle">HANDLE</button>
        ${event.canDefer ? '<button class="card-btn btn-defer">DEFER</button>' : ''}
      </div>
    `;

    // Button handlers
    const handleBtn = card.querySelector('.btn-handle');
    handleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      onHandle(event);
    });
    handleBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      onHandle(event);
    });

    if (event.canDefer) {
      const deferBtn = card.querySelector('.btn-defer');
      deferBtn.addEventListener('click', (e) => {
        e.preventDefault();
        onDefer(event);
      });
      deferBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        onDefer(event);
      });
    }

    this.cardContainer.appendChild(card);
    this.activeCards.set(event.uid, card);
  }

  removeCard(uid) {
    const card = this.activeCards.get(uid);
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateX(100px)';
      card.style.transition = 'opacity 0.2s, transform 0.2s';
      setTimeout(() => {
        card.remove();
      }, 200);
      this.activeCards.delete(uid);
    }
  }

  clearCards() {
    this.cardContainer.innerHTML = '';
    this.activeCards.clear();
  }

  renderEffects(effects) {
    if (!effects) return '';
    let html = '';
    if (effects.queue) {
      const val = effects.queue;
      html += `<span class="effect-tag effect-queue">QUEUE ${val > 0 ? '+' : ''}${Math.round(val)}</span>`;
    }
    if (effects.rage) {
      const val = effects.rage;
      html += `<span class="effect-tag effect-rage">RAGE ${val > 0 ? '+' : ''}${Math.round(val)}</span>`;
    }
    if (effects.burnout) {
      const val = effects.burnout;
      html += `<span class="effect-tag effect-burnout">BURN ${val > 0 ? '+' : ''}${Math.round(val)}</span>`;
    }
    return html;
  }

  // ========== OVERLAYS ==========

  showTitle() {
    this.titleScreen.style.display = 'flex';
    this.lunchOverlay.style.display = 'none';
    this.resultsScreen.style.display = 'none';
  }

  hideTitle() {
    this.titleScreen.style.display = 'none';
  }

  showLunch(message, sub) {
    this.lunchOverlay.style.display = 'flex';
    if (message) this.lunchMessage.textContent = message;
    if (sub) this.lunchSub.textContent = sub;
  }

  hideLunch() {
    this.lunchOverlay.style.display = 'none';
  }

  showResults(won, lostMeter, meters, stats) {
    this.resultsScreen.style.display = 'flex';

    const titleEl = document.getElementById('results-title');
    const flavorEl = document.getElementById('results-flavor');
    const metersEl = document.getElementById('results-meters');
    const statsEl = document.getElementById('results-stats');

    if (won) {
      const pick = WIN_TITLES[Math.floor(Math.random() * WIN_TITLES.length)];
      titleEl.textContent = pick.title;
      titleEl.style.color = '#44ff88';
      flavorEl.textContent = pick.flavor;
    } else {
      const info = LOSS_TITLES[lostMeter] || LOSS_TITLES.queue;
      titleEl.textContent = info.title;
      titleEl.style.color = '#ff4444';
      flavorEl.textContent = info.flavor;
    }

    metersEl.innerHTML = `
      <div class="result-meter">
        <span class="result-meter-label" style="color:#00d4ff">QUEUE</span>
        <div class="result-meter-bar">
          <div class="result-meter-fill" style="width:${meters.queue}%;background:#00d4ff"></div>
        </div>
        <span class="result-meter-val">${Math.round(meters.queue)}</span>
      </div>
      <div class="result-meter">
        <span class="result-meter-label" style="color:#ff4444">RAGE</span>
        <div class="result-meter-bar">
          <div class="result-meter-fill" style="width:${meters.rage}%;background:#ff4444"></div>
        </div>
        <span class="result-meter-val">${Math.round(meters.rage)}</span>
      </div>
      <div class="result-meter">
        <span class="result-meter-label" style="color:#ff8800">BURNOUT</span>
        <div class="result-meter-bar">
          <div class="result-meter-fill" style="width:${meters.burnout}%;background:#ff8800"></div>
        </div>
        <span class="result-meter-val">${Math.round(meters.burnout)}</span>
      </div>
    `;

    statsEl.innerHTML = `
      <div class="stat-line"><span>Events Handled</span><span>${stats.eventsHandled}</span></div>
      <div class="stat-line"><span>Scripts Verified</span><span>${stats.scriptsVerified}</span></div>
      <div class="stat-line"><span>Patients Served</span><span>${stats.patientsServed}</span></div>
      <div class="stat-line"><span>Events Deferred</span><span>${stats.eventsDeferred}</span></div>
      <div class="stat-line"><span>Events Escalated</span><span>${stats.eventsEscalated}</span></div>
    `;
  }

  hideResults() {
    this.resultsScreen.style.display = 'none';
  }
}
