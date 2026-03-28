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

    // Phase announce
    this.phaseAnnounce = document.getElementById('phase-announce');

    // Tutorial
    this.tutorialEl = document.getElementById('tutorial-hint');

    // Pause
    this.pauseOverlay = document.getElementById('pause-overlay');

    // Combo
    this.comboIndicator = document.getElementById('combo-indicator');
    this.comboCount = document.getElementById('combo-count');

    // High score
    this.highScoreDisplay = document.getElementById('high-score-display');

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
    const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    this.timerEl.textContent = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    // Time running low warning
    if (progress > 0.85) {
      this.timerEl.style.color = '#ff8800';
    } else {
      this.timerEl.style.color = '#ffffff';
    }
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
    const now = Date.now();
    this.queueFill.style.opacity = queue > 75 ? (0.7 + Math.sin(now / 200) * 0.3) : 1;
    this.rageFill.style.opacity = rage > 75 ? (0.7 + Math.sin(now / 200) * 0.3) : 1;
    this.burnoutFill.style.opacity = burnout > 75 ? (0.7 + Math.sin(now / 200) * 0.3) : 1;

    // Change value text color when critical
    this.queueValue.style.color = queue > 75 ? '#ff4444' : queue > 50 ? '#ffaa00' : '#aaa';
    this.rageValue.style.color = rage > 75 ? '#ff4444' : rage > 50 ? '#ffaa00' : '#aaa';
    this.burnoutValue.style.color = burnout > 75 ? '#ff4444' : burnout > 50 ? '#ffaa00' : '#aaa';
  }

  updatePipeline(unverified, ready, served) {
    this.pipeUnverified.textContent = unverified;
    this.pipeReady.textContent = ready;
    this.pipeServed.textContent = served;

    // Highlight when backed up
    this.pipeUnverified.parentElement.style.borderColor =
      unverified > 5 ? '#ff4444' : unverified > 3 ? '#ffaa00' : '#333';
  }

  // ========== WORK PROGRESS ==========

  showWorkProgress(label, progress) {
    this.workProgress.style.display = 'block';
    this.workLabel.textContent = label;
    this.workBarFill.style.width = `${Math.min(100, progress * 100)}%`;

    // Color changes with progress
    if (progress > 0.8) {
      this.workBarFill.style.background = '#44ff88';
    } else if (progress > 0.5) {
      this.workBarFill.style.background = '#88ddff';
    } else {
      this.workBarFill.style.background = '#00d4ff';
    }
  }

  hideWorkProgress() {
    this.workProgress.style.display = 'none';
  }

  // ========== EVENT CARDS ==========

  addCard(event, onHandle, onDefer, onRush) {
    if (this.activeCards.has(event.uid)) return;

    const card = document.createElement('div');
    card.className = 'event-card' +
      (event.isEscalated ? ' escalated' : '') +
      (event.isPipeline ? ' pipeline-card' : '') +
      (event.isInterrupt ? ' interrupt-card' : '');
    card.dataset.uid = event.uid;

    const stationClass = event.isInterrupt ? 'interrupt' :
                         event.isPipeline ? 'station-verify' :
                         `station-${event.station}`;

    const stationLabel = event.isInterrupt ? '⚠ NOT MY PROBLEM' :
      event.isPipeline ? '📋 PIPELINE' :
      event.station.toUpperCase();

    card.innerHTML = `
      <div class="card-header">
        <span class="card-station ${stationClass}">${stationLabel}</span>
        <span class="card-time">${event.duration}s</span>
      </div>
      <div class="card-title">${event.title}</div>
      <div class="card-desc">${event.desc}</div>
      <div class="card-effects">
        ${this.renderEffects(event.effects)}
      </div>
      <div class="card-buttons">
        <button class="card-btn btn-handle">HANDLE</button>
        ${event.duration >= 4 && !event.isPipeline ? '<button class="card-btn btn-rush">RUSH</button>' : ''}
        ${event.canDefer ? '<button class="card-btn btn-defer">DEFER</button>' : ''}
      </div>
      ${!event.isPipeline ? '<div class="card-age-bar"><div class="card-age-fill"></div></div>' : ''}
    `;

    // Button handlers — use click only, prevent double-fire
    const handleBtn = card.querySelector('.btn-handle');
    handleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onHandle(event);
    });

    const rushBtn = card.querySelector('.btn-rush');
    if (rushBtn && onRush) {
      rushBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onRush(event);
      });
    }

    if (event.canDefer) {
      const deferBtn = card.querySelector('.btn-defer');
      deferBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDefer(event);
      });
    }

    this.cardContainer.appendChild(card);
    this.activeCards.set(event.uid, card);

    // Scroll to show new card
    this.cardContainer.parentElement.scrollTop = this.cardContainer.parentElement.scrollHeight;
  }

  removeCard(uid) {
    const card = this.activeCards.get(uid);
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateX(100px)';
      card.style.transition = 'opacity 0.2s, transform 0.2s';
      card.style.maxHeight = card.offsetHeight + 'px';
      setTimeout(() => {
        card.style.maxHeight = '0';
        card.style.padding = '0';
        card.style.margin = '0';
        card.style.overflow = 'hidden';
      }, 150);
      setTimeout(() => {
        card.remove();
      }, 350);
      this.activeCards.delete(uid);
    }
  }

  ageCard(uid, age) {
    const card = this.activeCards.get(uid);
    if (!card) return;

    // Fill the age bar
    const ageFill = card.querySelector('.card-age-fill');
    if (ageFill) {
      const progress = Math.min(1, (age - 8) / 20); // 8s to 28s
      ageFill.style.width = `${progress * 100}%`;

      if (progress > 0.6) {
        ageFill.style.background = '#ff4444';
        card.classList.add('card-urgent');
      } else if (progress > 0.3) {
        ageFill.style.background = '#ffaa00';
      }
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

  // ========== PHASE ANNOUNCEMENT ==========

  showPhaseAnnounce(label) {
    if (!this.phaseAnnounce) return;
    this.phaseAnnounce.textContent = label;
    this.phaseAnnounce.style.display = 'block';
    this.phaseAnnounce.style.opacity = '1';
    this.phaseAnnounce.style.transform = 'translate(-50%, -50%) scale(1)';

    setTimeout(() => {
      this.phaseAnnounce.style.opacity = '0';
      this.phaseAnnounce.style.transform = 'translate(-50%, -50%) scale(1.2)';
    }, 1500);
    setTimeout(() => {
      this.phaseAnnounce.style.display = 'none';
    }, 2000);
  }

  hidePhaseAnnounce() {
    if (this.phaseAnnounce) this.phaseAnnounce.style.display = 'none';
  }

  // ========== TUTORIAL ==========

  showTutorial(text) {
    if (!this.tutorialEl) return;
    this.tutorialEl.textContent = text;
    this.tutorialEl.style.display = 'block';
    this.tutorialEl.style.opacity = '1';
  }

  hideTutorial() {
    if (!this.tutorialEl) return;
    this.tutorialEl.style.opacity = '0';
    setTimeout(() => {
      if (this.tutorialEl) this.tutorialEl.style.display = 'none';
    }, 300);
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
    const gradeEl = document.getElementById('results-grade');

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

    // Calculate grade
    const grade = this.calculateGrade(won, meters, stats);
    if (gradeEl) {
      gradeEl.textContent = grade;
      gradeEl.className = 'results-grade grade-' + grade.toLowerCase();
    }

    // Animated meter fill
    metersEl.innerHTML = `
      <div class="result-meter">
        <span class="result-meter-label" style="color:#00d4ff">QUEUE</span>
        <div class="result-meter-bar">
          <div class="result-meter-fill" id="rq-fill" style="width:0%;background:#00d4ff"></div>
        </div>
        <span class="result-meter-val">${Math.round(meters.queue)}</span>
      </div>
      <div class="result-meter">
        <span class="result-meter-label" style="color:#ff4444">RAGE</span>
        <div class="result-meter-bar">
          <div class="result-meter-fill" id="rr-fill" style="width:0%;background:#ff4444"></div>
        </div>
        <span class="result-meter-val">${Math.round(meters.rage)}</span>
      </div>
      <div class="result-meter">
        <span class="result-meter-label" style="color:#ff8800">BURNOUT</span>
        <div class="result-meter-bar">
          <div class="result-meter-fill" id="rb-fill" style="width:0%;background:#ff8800"></div>
        </div>
        <span class="result-meter-val">${Math.round(meters.burnout)}</span>
      </div>
    `;

    // Animate meter fills
    requestAnimationFrame(() => {
      setTimeout(() => {
        const qf = document.getElementById('rq-fill');
        const rf = document.getElementById('rr-fill');
        const bf = document.getElementById('rb-fill');
        if (qf) qf.style.width = `${Math.min(100, meters.queue)}%`;
        if (rf) rf.style.width = `${Math.min(100, meters.rage)}%`;
        if (bf) bf.style.width = `${Math.min(100, meters.burnout)}%`;
      }, 100);
    });

    statsEl.innerHTML = `
      <div class="stat-line"><span>Events Handled</span><span>${stats.eventsHandled}</span></div>
      <div class="stat-line"><span>Scripts Verified</span><span>${stats.scriptsVerified}</span></div>
      <div class="stat-line"><span>Patients Served</span><span>${stats.patientsServed}</span></div>
      <div class="stat-line"><span>Events Deferred</span><span>${stats.eventsDeferred}</span></div>
      <div class="stat-line"><span>Events Escalated</span><span>${stats.eventsEscalated}</span></div>
      <div class="stat-line"><span>Patients Lost</span><span>${stats.patientsLost || 0}</span></div>
    `;
  }

  calculateGrade(won, meters, stats) {
    if (!won) return 'F';
    const avgMeter = (meters.queue + meters.rage + meters.burnout) / 3;
    const handled = stats.eventsHandled + stats.scriptsVerified + stats.patientsServed;
    const penalties = stats.eventsEscalated * 4 + (stats.patientsLost || 0) * 5;
    const meterPenalty = avgMeter * 0.6;

    const score = Math.max(0, handled - penalties - meterPenalty);

    if (score > 28) return 'S';
    if (score > 20) return 'A';
    if (score > 13) return 'B';
    if (score > 6) return 'C';
    return 'D';
  }

  hideResults() {
    this.resultsScreen.style.display = 'none';
  }

  // ========== COMBO ==========

  showCombo(count) {
    if (!this.comboIndicator) return;
    this.comboCount.textContent = `x${count}`;
    this.comboIndicator.style.display = 'inline-block';
    this.comboIndicator.style.animation = 'none';
    void this.comboIndicator.offsetHeight; // reflow
    this.comboIndicator.style.animation = 'comboPop 0.3s ease-out';
  }

  hideCombo() {
    if (this.comboIndicator) this.comboIndicator.style.display = 'none';
  }

  // ========== PAUSE ==========

  showPause() {
    if (this.pauseOverlay) this.pauseOverlay.style.display = 'flex';
  }

  hidePause() {
    if (this.pauseOverlay) this.pauseOverlay.style.display = 'none';
  }

  // ========== HIGH SCORES ==========

  showHighScores(scores) {
    if (!this.highScoreDisplay) return;
    if (!scores || scores.length === 0) {
      this.highScoreDisplay.innerHTML = '';
      return;
    }
    const top3 = scores.slice(0, 3);
    this.highScoreDisplay.innerHTML = `
      <div class="high-scores-title">BEST SHIFTS</div>
      ${top3.map((s, i) => `
        <div class="high-score-entry">
          <span class="hs-rank">#${i + 1}</span>
          <span class="hs-grade grade-${s.grade.toLowerCase()}">${s.grade}</span>
          <span class="hs-diff">${s.difficulty}</span>
          <span class="hs-handled">${s.handled} handled</span>
        </div>
      `).join('')}
    `;
  }
}
