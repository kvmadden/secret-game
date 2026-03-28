/**
 * HTML overlay UI for HUD, action cards, and overlays.
 */

import {
  SHIFT_START_HOUR, SHIFT_END_HOUR, GAME_DURATION,
  METER_MAX, PHASES, WIN_TITLES, LOSS_TITLES, LOSS_FLAVORS,
} from './constants.js';

export class UI {
  constructor() {
    // HUD elements
    this.phaseEl = document.getElementById('phase-name');
    this.timerEl = document.getElementById('timer');
    this.queueFill = document.getElementById('queue-fill');
    this.safetyFill = document.getElementById('safety-fill');
    this.rageFill = document.getElementById('rage-fill');
    this.burnoutFill = document.getElementById('burnout-fill');
    this.scrutinyFill = document.getElementById('scrutiny-fill');
    this.queueValue = document.getElementById('queue-value');
    this.safetyValue = document.getElementById('safety-value');
    this.rageValue = document.getElementById('rage-value');
    this.burnoutValue = document.getElementById('burnout-value');
    this.scrutinyValue = document.getElementById('scrutiny-value');
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

  showDayModifier(day) {
    if (!day) return;
    this.phaseEl.textContent = day.name.toUpperCase();
    // Show modifier as tutorial hint
    this.showTutorial(`${day.modifier}: ${day.desc}`);
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

  updateMeters(meters) {
    const fills = {
      queue: this.queueFill, safety: this.safetyFill,
      rage: this.rageFill, burnout: this.burnoutFill, scrutiny: this.scrutinyFill,
    };
    const vals = {
      queue: this.queueValue, safety: this.safetyValue,
      rage: this.rageValue, burnout: this.burnoutValue, scrutiny: this.scrutinyValue,
    };
    const now = Date.now();
    for (const key of ['queue', 'safety', 'rage', 'burnout', 'scrutiny']) {
      const v = meters[key];
      fills[key].style.width = `${Math.min(100, v)}%`;
      vals[key].textContent = Math.round(v);
      fills[key].style.opacity = v > 75 ? (0.7 + Math.sin(now / 200) * 0.3) : 1;
      vals[key].style.color = v > 75 ? '#ff4444' : v > 50 ? '#ffaa00' : '#aaa';
    }
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
    const stationStripe = event.station && !event.isInterrupt ? ` station-${event.station}` : '';
    card.className = 'event-card' +
      (event.isEscalated ? ' escalated' : '') +
      (event.isPipeline ? ' pipeline-card' : '') +
      (event.isInterrupt ? ' interrupt-card' : '') +
      (event.isPositive ? ' positive-card' : '') +
      stationStripe;
    card.dataset.uid = event.uid;

    const stationClass = event.isInterrupt ? 'interrupt' :
                         event.isPipeline ? 'station-verify' :
                         `station-${event.station}`;

    const stationLabel = event.isInterrupt ? '⚠ NOT MY PROBLEM' :
      event.isPipeline ? '📋 PIPELINE' :
      event.station.toUpperCase();

    // Calculate card index for keyboard hint
    const cardIndex = this.activeCards.size + 1;

    card.innerHTML = `
      <div class="card-header">
        <span class="card-key-hint">${cardIndex}</span>
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

    // Staggered entry delay based on current card count
    card.style.animationDelay = `${cardIndex * 0.05}s`;

    this.cardContainer.appendChild(card);
    this.activeCards.set(event.uid, card);

    // Scroll to show new card
    this.cardContainer.parentElement.scrollTop = this.cardContainer.parentElement.scrollHeight;
  }

  removeCard(uid) {
    const card = this.activeCards.get(uid);
    if (card) {
      card.classList.add('card-removing');
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

  setCardsBusy(isBusy) {
    const btns = this.cardContainer.querySelectorAll('.btn-handle, .btn-rush');
    for (const btn of btns) {
      btn.disabled = isBusy;
      btn.style.opacity = isBusy ? '0.4' : '1';
    }
  }

  renderEffects(effects) {
    if (!effects) return '';
    const labels = { queue: 'QUEUE', safety: 'SAFE', rage: 'RAGE', burnout: 'BURN', scrutiny: 'SCRUT' };
    let html = '';
    for (const key of ['queue', 'safety', 'rage', 'burnout', 'scrutiny']) {
      if (effects[key]) {
        const val = effects[key];
        html += `<span class="effect-tag effect-${key}">${labels[key]} ${val > 0 ? '+' : ''}${Math.round(val)}</span>`;
      }
    }
    return html;
  }

  // ========== PHASE ANNOUNCEMENT ==========

  showPhaseAnnounce(label) {
    if (!this.phaseAnnounce) return;

    // Clear any pending timers
    if (this._phaseTimers) {
      this._phaseTimers.forEach(t => clearTimeout(t));
    }
    this._phaseTimers = [];

    const flavorText = {
      'Opening': 'First customers arriving...',
      'Building': 'Scripts piling up. Stay sharp.',
      'Reopen Rush': 'They\'ve been waiting.',
      'REOPEN RUSH': 'They\'ve been waiting.',
      'Late Drag': 'Almost there. Hold it together.',
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const flavor = days.includes(label) ? '' : (flavorText[label] || '');
    this.phaseAnnounce.innerHTML = `<div class="phase-label">${label.toUpperCase()}</div>${flavor ? `<div class="phase-flavor">${flavor}</div>` : ''}`;

    // Phase 1: Enter (scale 0.8->1.0 + fade in, 0.4s)
    this.phaseAnnounce.className = 'phase-enter';

    // Phase 2: Hold (2s with glow pulse)
    this._phaseTimers.push(setTimeout(() => {
      this.phaseAnnounce.className = 'phase-hold';
    }, 400));

    // Phase 3: Exit (scale 1.0->1.1 + fade out, 0.5s)
    this._phaseTimers.push(setTimeout(() => {
      this.phaseAnnounce.className = 'phase-exit';
    }, 2400));

    // Phase 4: Hide
    this._phaseTimers.push(setTimeout(() => {
      this.phaseAnnounce.className = '';
      this.phaseAnnounce.style.display = 'none';
    }, 2900));
  }

  hidePhaseAnnounce() {
    if (!this.phaseAnnounce) return;
    if (this._phaseTimers) {
      this._phaseTimers.forEach(t => clearTimeout(t));
      this._phaseTimers = [];
    }
    this.phaseAnnounce.className = '';
    this.phaseAnnounce.style.display = 'none';
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

  _showOverlay(el) {
    if (!el) return;
    el.classList.add('overlay-visible');
  }

  _hideOverlay(el) {
    if (!el) return;
    el.classList.remove('overlay-visible');
  }

  showTitle() {
    this._showOverlay(this.titleScreen);
    this._hideOverlay(this.lunchOverlay);
    this._hideOverlay(this.resultsScreen);
  }

  hideTitle() {
    this._hideOverlay(this.titleScreen);
  }

  showLunch(message, sub) {
    this._showOverlay(this.lunchOverlay);
    if (message) this.lunchMessage.textContent = message;
    if (sub) this.lunchSub.textContent = sub;
  }

  hideLunch() {
    this._hideOverlay(this.lunchOverlay);
  }

  showResults(won, lostMeter, meters, stats, isCampaign = false) {
    this._showOverlay(this.resultsScreen);

    // Hide retry/title buttons during campaign (auto-advances)
    const retryBtn = document.getElementById('retry-btn');
    const titleBtn = document.getElementById('title-btn');
    if (retryBtn) retryBtn.style.display = isCampaign ? 'none' : 'block';
    if (titleBtn) titleBtn.style.display = isCampaign ? 'none' : 'block';

    const titleEl = document.getElementById('results-title');
    const flavorEl = document.getElementById('results-flavor');
    const metersEl = document.getElementById('results-meters');
    const statsEl = document.getElementById('results-stats');
    const gradeEl = document.getElementById('results-grade');

    if (won) {
      const pick = WIN_TITLES[Math.floor(Math.random() * WIN_TITLES.length)];
      titleEl.textContent = pick.title;
      titleEl.style.color = '#f0d880';
      flavorEl.textContent = pick.flavor;
    } else {
      const info = LOSS_TITLES[lostMeter] || LOSS_TITLES.queue;
      titleEl.textContent = info.title;
      titleEl.style.color = '#ff4444';
      // Pick random loss flavor
      const flavors = LOSS_FLAVORS[lostMeter] || LOSS_FLAVORS.queue;
      flavorEl.textContent = flavors[Math.floor(Math.random() * flavors.length)];
    }

    // Calculate grade
    const grade = this.calculateGrade(won, meters, stats);
    if (gradeEl) {
      gradeEl.textContent = grade;
      gradeEl.className = 'results-grade grade-' + grade.toLowerCase();
    }

    // Animated meter fill
    const meterDefs = [
      { key: 'queue', label: 'QUEUE', color: '#00d4ff', id: 'rq-fill' },
      { key: 'safety', label: 'SAFETY', color: '#ffcc00', id: 'rs-fill' },
      { key: 'rage', label: 'RAGE', color: '#ff4444', id: 'rr-fill' },
      { key: 'burnout', label: 'BURNOUT', color: '#ff8800', id: 'rb-fill' },
      { key: 'scrutiny', label: 'SCRUTINY', color: '#cc66ff', id: 'rsc-fill' },
    ];
    metersEl.innerHTML = meterDefs.map(m => `
      <div class="result-meter">
        <span class="result-meter-label" style="color:${m.color}">${m.label}</span>
        <div class="result-meter-bar">
          <div class="result-meter-fill" id="${m.id}" style="width:0%;background:${m.color}"></div>
        </div>
        <span class="result-meter-val">${Math.round(meters[m.key])}</span>
      </div>
    `).join('');

    // Animate meter fills
    requestAnimationFrame(() => {
      setTimeout(() => {
        for (const m of meterDefs) {
          const el = document.getElementById(m.id);
          if (el) el.style.width = `${Math.min(100, meters[m.key])}%`;
        }
      }, 100);
    });

    // Efficiency rating
    const totalActions = stats.eventsHandled + stats.scriptsVerified + stats.patientsServed;
    const totalAttempted = totalActions + stats.eventsDeferred + stats.eventsEscalated;
    const efficiency = totalAttempted > 0 ? Math.round((totalActions / totalAttempted) * 100) : 0;

    // Shift recap flavor
    const recapLines = [];
    if (stats.patientsLost === 0) recapLines.push('No patients walked out.');
    else if (stats.patientsLost >= 3) recapLines.push(`${stats.patientsLost} patients stormed out. Ouch.`);
    else recapLines.push(`${stats.patientsLost} patient${stats.patientsLost > 1 ? 's' : ''} lost patience.`);

    if (stats.eventsEscalated === 0) recapLines.push('No escalations. Clean.');
    else recapLines.push(`${stats.eventsEscalated} event${stats.eventsEscalated > 1 ? 's' : ''} escalated.`);

    if (efficiency >= 90) recapLines.push('Highly efficient shift.');
    else if (efficiency >= 70) recapLines.push('Solid work under pressure.');
    else if (efficiency >= 50) recapLines.push('Survived, but barely.');

    statsEl.innerHTML = `
      <div class="stat-section-label">SHIFT RECAP</div>
      <div class="shift-recap">${recapLines.join(' ')}</div>
      <div class="stat-section-label">STATS</div>
      <div class="stat-line"><span>Events Handled</span><span>${stats.eventsHandled}</span></div>
      <div class="stat-line"><span>Scripts Verified</span><span>${stats.scriptsVerified}</span></div>
      <div class="stat-line"><span>Patients Served</span><span>${stats.patientsServed}</span></div>
      <div class="stat-line"><span>Deferred / Escalated</span><span>${stats.eventsDeferred} / ${stats.eventsEscalated}</span></div>
      <div class="stat-line"><span>Patients Lost</span><span class="${stats.patientsLost > 0 ? 'stat-bad' : 'stat-good'}">${stats.patientsLost || 0}</span></div>
      <div class="stat-line stat-highlight"><span>Efficiency</span><span>${efficiency}%</span></div>
    `;
  }

  calculateGrade(won, meters, stats) {
    if (!won) return 'F';
    const avgMeter = (meters.queue + meters.safety + meters.rage + meters.burnout + meters.scrutiny) / 5;
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

  checkAchievements(won, meters, stats) {
    const achievements = [];

    // Completion-based
    if (won) achievements.push({ icon: '🏆', name: 'Shift Survivor', desc: 'Completed a full shift' });
    if (won && meters.burnout < 20) achievements.push({ icon: '🧘', name: 'Cool Head', desc: 'Won with burnout under 20' });
    if (won && meters.rage < 20) achievements.push({ icon: '😊', name: 'People Person', desc: 'Won with rage under 20' });
    if (won && meters.safety < 20) achievements.push({ icon: '🛡', name: 'Safe Hands', desc: 'Won with safety risk under 20' });
    if (won && meters.scrutiny < 20) achievements.push({ icon: '👤', name: 'Under the Radar', desc: 'Won with scrutiny under 20' });
    if (won && meters.queue < 20 && meters.rage < 20 && meters.burnout < 20 && meters.safety < 20 && meters.scrutiny < 20)
      achievements.push({ icon: '⭐', name: 'Flawless Shift', desc: 'All meters under 20' });

    // Stat-based
    if (stats.eventsHandled >= 15) achievements.push({ icon: '⚡', name: 'Workhorse', desc: 'Handled 15+ events' });
    if (stats.scriptsVerified >= 10) achievements.push({ icon: '📋', name: 'Verification Pro', desc: 'Verified 10+ scripts' });
    if (stats.patientsLost === 0 && won) achievements.push({ icon: '💎', name: 'Zero Walkouts', desc: 'No patients lost' });
    if (stats.eventsDeferred === 0 && won) achievements.push({ icon: '🔥', name: 'No Deferrals', desc: 'Never deferred an event' });
    if (stats.eventsEscalated === 0 && won) achievements.push({ icon: '✨', name: 'De-escalator', desc: 'No escalations' });

    // Save new achievements
    try {
      const saved = JSON.parse(localStorage.getItem('otb_achievements') || '[]');
      const savedNames = new Set(saved);
      const newOnes = achievements.filter(a => !savedNames.has(a.name));
      for (const a of achievements) savedNames.add(a.name);
      localStorage.setItem('otb_achievements', JSON.stringify([...savedNames]));
      return newOnes; // Only return newly unlocked ones
    } catch (e) {
      return achievements;
    }
  }

  showAchievements(achievements) {
    if (!achievements || achievements.length === 0) return;

    const container = document.getElementById('results-stats');
    if (!container) return;

    const html = achievements.map(a =>
      `<div class="achievement-unlock"><span class="achievement-icon">${a.icon}</span><div><strong>${a.name}</strong><br><span class="achievement-desc">${a.desc}</span></div></div>`
    ).join('');

    container.insertAdjacentHTML('beforeend',
      `<div class="stat-section-label" style="margin-top:10px">NEW ACHIEVEMENTS</div>${html}`
    );
  }

  hideResults() {
    this._hideOverlay(this.resultsScreen);
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
    this._showOverlay(this.pauseOverlay);
  }

  hidePause() {
    this._hideOverlay(this.pauseOverlay);
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

  // ========== CAMPAIGN UI ==========

  showCampaignHud(label1, label2) {
    const el = document.getElementById('campaign-hud');
    if (el) {
      el.style.display = 'block';
      el.textContent = label2 ? `${label1} — ${label2}` : `${label1}`;
    }
  }

  hideCampaignHud() {
    const el = document.getElementById('campaign-hud');
    if (el) el.style.display = 'none';
  }

  showDayIntro(day, dayName, narrative, shiftDay, weather, modifierTags, isStory) {
    const overlay = document.getElementById('day-intro');
    if (!overlay) return;

    document.getElementById('day-intro-number').textContent = typeof day === 'number' ? `DAY ${day}` : (day || '');
    document.getElementById('day-intro-name').textContent = dayName;
    document.getElementById('day-intro-text').textContent = narrative.intro;
    document.getElementById('day-intro-flavor').textContent = narrative.flavor;

    const modsEl = document.getElementById('day-intro-modifiers');
    let modsHtml = '';
    if (shiftDay && shiftDay.modifier && shiftDay.desc) {
      modsHtml += `<span class="day-modifier-tag">${shiftDay.modifier}: ${shiftDay.desc}</span>`;
    }
    if (weather) {
      modsHtml += `<span class="day-modifier-tag">${weather.name} — ${weather.desc}</span>`;
    }
    if (modifierTags) {
      for (const tag of modifierTags) {
        modsHtml += `<span class="day-modifier-tag ${tag.type}">${tag.text}</span>`;
      }
    }
    modsEl.innerHTML = modsHtml;

    // Update button text based on context
    const btn = document.getElementById('day-start-btn');
    if (btn) btn.textContent = isStory ? 'CONTINUE' : 'START SHIFT';

    this._showOverlay(overlay);
  }

  hideDayIntro() {
    const overlay = document.getElementById('day-intro');
    this._hideOverlay(overlay);
  }

  showShiftEnd(recap, decision, onChoose) {
    const overlay = document.getElementById('shift-end');
    if (!overlay) return;

    document.getElementById('shift-end-recap').textContent = recap;
    document.getElementById('decision-prompt').textContent = decision.prompt;

    const choicesEl = document.getElementById('decision-choices');
    choicesEl.innerHTML = '';

    decision.choices.forEach((choice, i) => {
      const card = document.createElement('div');
      card.className = 'decision-card';
      card.innerHTML = `
        <div class="decision-card-label">${choice.label}</div>
        <div class="decision-card-desc">${choice.desc}</div>
      `;
      card.addEventListener('click', () => {
        onChoose(i);
      });
      choicesEl.appendChild(card);
    });

    this._showOverlay(overlay);
  }

  hideShiftEnd() {
    const overlay = document.getElementById('shift-end');
    this._hideOverlay(overlay);
  }

  showCampaignEnd(endMessage, summary) {
    const overlay = document.getElementById('campaign-end');
    if (!overlay) return;

    document.getElementById('campaign-end-title').textContent = endMessage.title;
    document.getElementById('campaign-end-title').style.color =
      summary.grade === 'perfect' ? '#ffdd00' :
      summary.grade === 'great' ? '#44ff88' :
      summary.grade === 'decent' ? '#00d4ff' :
      summary.grade === 'rough' ? '#ff8800' : '#ff4444';
    document.getElementById('campaign-end-flavor').textContent = endMessage.flavor;

    // Summary stats
    document.getElementById('campaign-summary').innerHTML = `
      <div class="campaign-stat">
        <div class="campaign-stat-value">${summary.wins}/${summary.days}</div>
        <div class="campaign-stat-label">SHIFTS WON</div>
      </div>
      <div class="campaign-stat">
        <div class="campaign-stat-value">${summary.reputation}</div>
        <div class="campaign-stat-label">REPUTATION</div>
      </div>
      <div class="campaign-stat">
        <div class="campaign-stat-value">${summary.burnout}</div>
        <div class="campaign-stat-label">BURNOUT</div>
      </div>
      <div class="campaign-stat">
        <div class="campaign-stat-value">${summary.clinicalIntegrity}</div>
        <div class="campaign-stat-label">INTEGRITY</div>
      </div>
      <div class="campaign-stat">
        <div class="campaign-stat-value">${summary.teamStrength}</div>
        <div class="campaign-stat-label">TEAM</div>
      </div>
      <div class="campaign-stat">
        <div class="campaign-stat-value">${summary.storeReadiness}</div>
        <div class="campaign-stat-label">STORE</div>
      </div>
    `;

    // Compact shift grid — each shift is a grade pip
    const daysEl = document.getElementById('campaign-day-results');
    daysEl.innerHTML = '<div class="campaign-shift-label">SHIFTS</div><div class="campaign-shift-grid">' +
      summary.results.map((r, i) => `
        <div class="shift-pip grade-${r.grade.toLowerCase()} ${r.won ? 'won' : 'lost'}" title="Shift ${i + 1}: ${r.grade} ${r.won ? 'Won' : 'Lost'}">
          <span class="pip-num">${i + 1}</span>
          <span class="pip-grade">${r.grade}</span>
        </div>
      `).join('') + '</div>';

    this._showOverlay(overlay);
  }

  hideCampaignEnd() {
    const overlay = document.getElementById('campaign-end');
    this._hideOverlay(overlay);
  }

  // ========== ENDLESS MODE UI ==========

  showEndlessIntro(segInfo) {
    const overlay = document.getElementById('endless-intro');
    if (!overlay) return;
    document.getElementById('endless-segment-num').textContent = `SEGMENT ${segInfo.segment}`;
    document.getElementById('endless-store-name').textContent = segInfo.type.name;
    document.getElementById('endless-store-desc').textContent = segInfo.type.desc;
    document.getElementById('endless-store-flavor').textContent = segInfo.type.flavor;
    document.getElementById('endless-fatigue-display').innerHTML = this._fatigueBar(segInfo.fatigue, segInfo.hoursAwake);
    this._showOverlay(overlay);
  }

  hideEndlessIntro() {
    const el = document.getElementById('endless-intro');
    this._hideOverlay(el);
  }

  showEndlessExtend(prompt, fatigue, hoursAwake, onStay, onLeave) {
    const overlay = document.getElementById('endless-extend');
    if (!overlay) return;
    document.getElementById('endless-extend-prompt').textContent = prompt.prompt;
    document.getElementById('endless-extend-sub').textContent = prompt.sub;
    document.getElementById('endless-extend-fatigue').innerHTML = this._fatigueBar(fatigue, hoursAwake);

    // Wire buttons (clone to remove old listeners)
    const stayBtn = document.getElementById('endless-stay-btn');
    const leaveBtn = document.getElementById('endless-leave-btn');
    const newStay = stayBtn.cloneNode(true);
    const newLeave = leaveBtn.cloneNode(true);
    stayBtn.replaceWith(newStay);
    leaveBtn.replaceWith(newLeave);
    newStay.addEventListener('click', onStay);
    newLeave.addEventListener('click', onLeave);

    this._showOverlay(overlay);
  }

  hideEndlessExtend() {
    const el = document.getElementById('endless-extend');
    this._hideOverlay(el);
  }

  showEndlessEnd(endMsg, summary) {
    const overlay = document.getElementById('endless-end');
    if (!overlay) return;

    const titleEl = document.getElementById('endless-end-title');
    titleEl.textContent = endMsg.title;
    titleEl.style.color = summary.cashedOut ? '#f0d880' : '#ff4444';
    document.getElementById('endless-end-flavor').textContent = endMsg.flavor;

    document.getElementById('endless-end-summary').innerHTML = `
      <div class="campaign-stat">
        <div class="campaign-stat-value">${summary.segments}</div>
        <div class="campaign-stat-label">SEGMENTS</div>
      </div>
      <div class="campaign-stat">
        <div class="campaign-stat-value">${summary.survived}</div>
        <div class="campaign-stat-label">SURVIVED</div>
      </div>
      <div class="campaign-stat">
        <div class="campaign-stat-value">${summary.hoursAwake}h</div>
        <div class="campaign-stat-label">AWAKE</div>
      </div>
      <div class="campaign-stat">
        <div class="campaign-stat-value">${Math.round(summary.fatigue)}</div>
        <div class="campaign-stat-label">FATIGUE</div>
      </div>
    `;

    document.getElementById('endless-end-segments').innerHTML = summary.results.map((r, i) => `
      <div class="campaign-day-row">
        <span class="campaign-day-name">${r.segmentName}</span>
        <span class="campaign-day-result ${r.won ? 'won' : 'lost'}">${r.won ? 'SURVIVED' : 'COLLAPSED'}</span>
      </div>
    `).join('');

    this._showOverlay(overlay);
  }

  hideEndlessEnd() {
    const el = document.getElementById('endless-end');
    this._hideOverlay(el);
  }

  _fatigueBar(fatigue, hours) {
    return `
      <div class="fatigue-label">FATIGUE — ${Math.round(fatigue)}% | ${hours}h AWAKE</div>
      <div class="fatigue-bar-bg">
        <div class="fatigue-bar-fill" style="width:${Math.min(100, fatigue)}%"></div>
      </div>
    `;
  }
}
