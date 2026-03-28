/**
 * Game state machine and main tick loop.
 * Manages: phases, meters, events, pharmacist, patients, pipeline.
 */

import {
  GAME_DURATION, PHASES, METER_MAX, STATIONS,
  PHASE_EVENT_INTERVAL, PHASE_AMBIENT, PHASE_SCRIPT_INTERVAL,
  PHARMACIST_START, PHARMACIST_SPEED, VERIFY_TIME, SERVE_TIME,
  PATIENT_PALETTES, PATIENT_BARKS, LUNCH_MESSAGES,
  MAX_PATIENTS_PER_STATION, PIPELINE_QUEUE_PRESSURE_MULT,
  PIPELINE_RAGE_PRESSURE_MULT, MAX_ESCALATION_CHAIN,
  DIFFICULTY, COMBO_WINDOW, COMBO_BONUS_PER_STACK,
} from './constants.js';
import { Pipeline } from './pipeline.js';
import { StationManager } from './stations.js';
import { getRandomEventAny, getEscalatedEvent, getDeferTime } from './events.js';
import { findPath } from './pathfinding.js';
import { createTileMap } from './map.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import * as Audio from './audio.js';

let uidCounter = 0;
function nextUid() { return ++uidCounter; }

export class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.ui = new UI();
    this.tileMap = createTileMap();
    this.renderer.init(this.tileMap);
    this.difficulty = 'NORMAL';
    this.reset();
    this.setupListeners();
    this.loadHighScores();
  }

  reset() {
    this.state = 'TITLE';
    this.diff = DIFFICULTY[this.difficulty] || DIFFICULTY.NORMAL;
    this.time = 0;
    this.elapsed = 0;
    this.lastTimestamp = null;

    // Meters — start low, pressure builds
    this.meters = { queue: 5, rage: 3, burnout: 0 };

    // Phase
    this.phase = 'OPENING';
    this.prevPhase = null;

    // Meter warning cooldowns
    this.meterWarningCooldown = { queue: 0, rage: 0, burnout: 0 };

    // Pharmacist
    this.pharmacist = {
      col: PHARMACIST_START.col,
      row: PHARMACIST_START.row,
      state: 'IDLE',
      facing: 'right',
      path: [],
      pathIndex: 0,
      workTimer: 0,
      workDuration: 0,
      workEvent: null,
      workLabel: '',
      idleTimer: 0,
      stress: 0, // visual stress indicator (0-1)
    };

    // Pipeline
    this.pipeline = new Pipeline();
    this.pipeline.addScript(2);

    // Station manager
    this.stationManager = new StationManager();

    // Active events
    this.activeEvents = [];
    this.deferredEvents = [];

    // Patients
    this.patients = [];
    this.nextPatientId = 0;

    // Drive-thru cars
    this.driveThruCars = 0;

    // Timers
    this.nextEventTimer = 3;
    this.nextScriptTimer = 6;
    this.lunchMessageTimer = 0;
    this.lunchMessageIndex = 0;

    // Phone ringing state
    this.phoneRinging = false;
    this.phoneRingTimer = 0;

    // Lunch grace period
    this.lunchGraceTimer = 0;

    // Combo state
    this.comboCount = 0;
    this.comboTimer = 0;

    // Tutorial state
    this.tutorialShown = new Set();
    this.tutorialTimer = 0;

    // Stats
    this.stats = {
      eventsHandled: 0,
      scriptsVerified: 0,
      patientsServed: 0,
      eventsDeferred: 0,
      eventsEscalated: 0,
      patientsLost: 0,
    };

    // UI reset
    this.ui.clearCards();
    this.ui.hideWorkProgress();
    this.ui.hideLunch();
    this.ui.hideResults();
    this.ui.hidePhaseAnnounce();
    this.ui.hideTutorial();
    this.ui.hidePause();
    this.ui.hideCombo();

    this.updatePipelineCards();
  }

  setupListeners() {
    document.getElementById('start-btn').addEventListener('click', () => {
      Audio.playClick();
      this.startGame();
    });

    document.getElementById('retry-btn').addEventListener('click', () => {
      Audio.playClick();
      this.reset();
      this.startGame();
    });

    document.getElementById('title-btn').addEventListener('click', () => {
      Audio.playClick();
      this.reset();
      this.ui.showTitle();
      this.loadHighScores();
    });

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Audio.playClick();
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.difficulty = btn.dataset.diff;
        this.loadHighScores();
      });
    });

    // Mute
    const muteBtn = document.getElementById('mute-btn');
    muteBtn.addEventListener('click', () => {
      const nowMuted = Audio.toggleMute();
      muteBtn.textContent = nowMuted ? '🔇' : '🔊';
    });

    // Pause
    document.getElementById('pause-btn').addEventListener('click', () => {
      if (this.state === 'PLAYING') {
        Audio.playClick();
        this.pauseGame();
      }
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
      Audio.playClick();
      this.resumeGame();
    });

    window.addEventListener('resize', () => this.renderer.resize());
  }

  pauseGame() {
    this.state = 'PAUSED';
    this.ui.showPause();
  }

  resumeGame() {
    this.state = 'PLAYING';
    this.lastTimestamp = performance.now();
    this.ui.hidePause();
    this.tick();
  }

  startGame() {
    this.diff = DIFFICULTY[this.difficulty] || DIFFICULTY.NORMAL;
    this.ui.hideTitle();
    this.state = 'PLAYING';
    this.lastTimestamp = performance.now();
    Audio.startAmbient();
    this.spawnInitialPatients();
    this.showTutorial('welcome');
    this.tick();
  }

  spawnInitialPatients() {
    this.spawnPatient('pickup');
    setTimeout(() => this.spawnPatient('consult'), 500);
  }

  // ========== TUTORIAL ==========

  showTutorial(step) {
    if (this.tutorialShown.has(step)) return;
    this.tutorialShown.add(step);

    const tips = {
      welcome: 'Tap HANDLE on cards below to dispatch the pharmacist. DEFER buys time — but problems come back worse.',
      pipeline: 'Scripts pile up! VERIFY them before patients can pick up. Keep the pipeline flowing or the queue explodes.',
      busy: "Pharmacist is busy — wait for them to finish, then tap your next action.",
      pressure: 'Meters climbing fast. Prioritize the highest-impact cards.',
      leaving: 'A patient left angry. That hurts. Handle events before patience runs out.',
    };

    if (tips[step]) {
      this.ui.showTutorial(tips[step]);
      this.tutorialTimer = 6;
    }
  }

  // ========== MAIN GAME LOOP ==========

  tick() {
    if (this.state !== 'PLAYING' && this.state !== 'LUNCH') return;
    if (this.state === 'PAUSED') return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = now;
    this.time += dt;
    this.elapsed += dt;

    // Tutorial timer
    if (this.tutorialTimer > 0) {
      this.tutorialTimer -= dt;
      if (this.tutorialTimer <= 0) this.ui.hideTutorial();
    }

    this.updatePhase();

    if (this.state === 'PLAYING') {
      this.updateMeters(dt);
      this.updateEvents(dt);
      this.updatePharmacist(dt);
      this.updatePatients(dt);
      this.updatePipeline(dt);
      this.updateDeferred(dt);
      this.updatePhoneRing(dt);
      this.checkMeterWarnings(dt);
      this.checkGameOver();
    } else if (this.state === 'LUNCH') {
      this.updateLunch(dt);
    }

    // Update pharmacist stress visual
    const avgMeter = (this.meters.queue + this.meters.rage + this.meters.burnout) / 3;
    this.pharmacist.stress = Math.min(1, avgMeter / 70);

    this.renderer.updateCamera(this.pharmacist.col, dt);
    this.renderer.render(this.getState());

    this.ui.updateTimer(this.elapsed);
    this.ui.updatePhase(this.phase);
    this.ui.updateMeters(this.meters.queue, this.meters.rage, this.meters.burnout);
    this.ui.updatePipeline(this.pipeline.unverified, this.pipeline.ready, this.pipeline.served);

    requestAnimationFrame(() => this.tick());
  }

  getState() {
    return {
      time: this.time,
      phase: this.phase,
      pharmacist: this.pharmacist,
      patients: this.patients,
      stationManager: this.stationManager,
      driveThruCars: this.driveThruCars,
      phoneRinging: this.phoneRinging,
      meters: this.meters,
    };
  }

  // ========== PHASE MANAGEMENT ==========

  updatePhase() {
    const progress = this.elapsed / GAME_DURATION;

    if (progress >= 1) {
      this.endGame(true);
      return;
    }

    let newPhase = 'OPENING';
    for (const phase of PHASES) {
      if (progress >= phase.start && progress < phase.end) {
        newPhase = phase.name;
        break;
      }
    }

    if (newPhase !== this.phase) {
      const oldPhase = this.phase;
      this.phase = newPhase;
      this.onPhaseChange(oldPhase, newPhase);
    }
  }

  onPhaseChange(from, to) {
    Audio.playPhaseChange();

    const phase = PHASES.find(p => p.name === to);
    if (phase && to !== 'LUNCH_CLOSE') {
      this.ui.showPhaseAnnounce(phase.label);
    }

    if (to === 'LUNCH_CLOSE') {
      Audio.playLunchStart();

      // Grace period: if pharmacist is working, let them finish
      if (this.pharmacist.state === 'WORKING') {
        this.lunchGraceTimer = this.pharmacist.workDuration - this.pharmacist.workTimer + 0.5;
      } else {
        this.enterLunch();
      }
    } else if (to === 'REOPEN_RUSH' && from === 'LUNCH_CLOSE') {
      Audio.playReopenRush();
      this.state = 'PLAYING';
      this.ui.hideLunch();
      this.ui.showPhaseAnnounce('REOPEN RUSH');
      this.meters.queue = Math.min(METER_MAX, this.meters.queue + 15);
      this.meters.rage = Math.min(METER_MAX, this.meters.rage + 8);
      this.pipeline.addScript(4);
      this.spawnPatient('pickup');
      this.spawnPatient('pickup');
      this.spawnPatient('drive');
      this.driveThruCars = 2;
      this.nextEventTimer = 0.5;
      this.updatePipelineCards();
    } else if (to === 'BUILDING') {
      this.showTutorial('pipeline');
    }
  }

  enterLunch() {
    this.state = 'LUNCH';
    this.lunchMessageIndex = 0;
    this.lunchMessageTimer = 0;
    this.ui.showLunch(LUNCH_MESSAGES[0], '');
    this.ui.clearCards();
    this.pharmacist.state = 'IDLE';
    this.pharmacist.path = [];
    this.phoneRinging = false;
  }

  // ========== LUNCH ==========

  updateLunch(dt) {
    // Handle grace period for in-progress work
    if (this.lunchGraceTimer > 0) {
      this.lunchGraceTimer -= dt;
      this.updatePharmacist(dt);
      if (this.lunchGraceTimer <= 0 && this.pharmacist.state !== 'IDLE') {
        // Force complete if still working
        if (this.pharmacist.state === 'WORKING') {
          this.completeWork();
        }
        this.enterLunch();
      } else if (this.pharmacist.state === 'IDLE' && this.lunchGraceTimer > 0) {
        this.lunchGraceTimer = 0;
        this.enterLunch();
      }
      return;
    }

    this.lunchMessageTimer += dt;
    const ambient = PHASE_AMBIENT.LUNCH_CLOSE;
    this.meters.queue = Math.min(METER_MAX, Math.max(0, this.meters.queue + ambient.queue * dt));
    this.meters.rage = Math.min(METER_MAX, Math.max(0, this.meters.rage + ambient.rage * dt));
    this.meters.burnout = Math.max(0, this.meters.burnout + ambient.burnout * dt);

    if (this.lunchMessageTimer > 3) {
      this.lunchMessageTimer = 0;
      this.lunchMessageIndex = (this.lunchMessageIndex + 1) % LUNCH_MESSAGES.length;
      this.ui.showLunch(
        LUNCH_MESSAGES[this.lunchMessageIndex],
        `Queue: ${Math.round(this.meters.queue)} | Rage: ${Math.round(this.meters.rage)}`
      );
    }

    if (Math.random() < 0.008) {
      this.pipeline.addScript(1);
    }
  }

  // ========== METERS ==========

  updateMeters(dt) {
    const ambient = PHASE_AMBIENT[this.phase] || PHASE_AMBIENT.OPENING;
    const aMult = this.diff.ambientMult;

    this.meters.queue += ambient.queue * aMult * dt;
    this.meters.rage += ambient.rage * aMult * dt;
    this.meters.burnout += ambient.burnout * aMult * dt;

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.ui.hideCombo();
      }
    }

    // Pipeline pressure — unverified scripts pressure queue harder
    const queuePressure = this.pipeline.unverified * PIPELINE_QUEUE_PRESSURE_MULT * dt;
    this.meters.queue += queuePressure;

    // Ready-but-unserved scripts pressure rage (patients waiting for their meds)
    const ragePressure = this.pipeline.ready * PIPELINE_RAGE_PRESSURE_MULT * dt;
    this.meters.rage += ragePressure;

    // Patient wait time contribution to rage
    let angryPatients = 0;
    for (const patient of this.patients) {
      if (!patient.visible || patient.fadeOut || patient.walking) continue;
      if (patient.patience < 0.3) {
        this.meters.rage += 0.4 * dt;
        angryPatients++;
      } else if (patient.patience < 0.6) {
        this.meters.rage += 0.15 * dt;
      }
    }

    // Many angry patients compound burnout
    if (angryPatients >= 3) {
      this.meters.burnout += 0.2 * dt;
    }

    // Clamp
    this.meters.queue = Math.max(0, Math.min(METER_MAX, this.meters.queue));
    this.meters.rage = Math.max(0, Math.min(METER_MAX, this.meters.rage));
    this.meters.burnout = Math.max(0, Math.min(METER_MAX, this.meters.burnout));
  }

  checkMeterWarnings(dt) {
    for (const key of ['queue', 'rage', 'burnout']) {
      this.meterWarningCooldown[key] -= dt;
      if (this.meters[key] > 70 && this.meterWarningCooldown[key] <= 0) {
        Audio.playMeterWarning();
        this.meterWarningCooldown[key] = 8;
        if (!this.tutorialShown.has('pressure')) {
          this.showTutorial('pressure');
        }
      }
    }
  }

  applyEffects(effects) {
    if (!effects) return;
    const mMult = this.diff.meterMult;
    for (const key of ['queue', 'rage', 'burnout']) {
      if (effects[key]) {
        // Positive (penalty) scales with difficulty; negative (relief) does not
        const val = effects[key] > 0 ? effects[key] * mMult : effects[key];
        this.meters[key] = Math.max(0, Math.min(METER_MAX, this.meters[key] + val));
      }
    }
  }

  // ========== PHONE RINGING ==========

  updatePhoneRing(dt) {
    const hasPhoneEvent = this.activeEvents.some(e => e.station === 'phone' && !e.isPipeline);
    if (hasPhoneEvent && !this.phoneRinging) {
      this.phoneRinging = true;
      this.phoneRingTimer = 0;
      Audio.playPhoneRing();
    } else if (hasPhoneEvent) {
      this.phoneRingTimer += dt;
      if (this.phoneRingTimer > 4) {
        this.phoneRingTimer = 0;
        Audio.playPhoneRing();
      }
    } else {
      this.phoneRinging = false;
    }
  }

  // ========== EVENTS ==========

  updateEvents(dt) {
    this.nextEventTimer -= dt;

    const nonPipelineEvents = this.activeEvents.filter(e => !e.isPipeline);
    if (this.nextEventTimer <= 0 && nonPipelineEvents.length < 5) {
      this.spawnEvent();
      const interval = PHASE_EVENT_INTERVAL[this.phase] || PHASE_EVENT_INTERVAL.OPENING;
      const eMult = this.diff.eventMult;
      this.nextEventTimer = (interval.min + Math.random() * (interval.max - interval.min)) * eMult;
    } else if (this.nextEventTimer <= 0) {
      const interval = PHASE_EVENT_INTERVAL[this.phase] || PHASE_EVENT_INTERVAL.OPENING;
      const eMult = this.diff.eventMult;
      this.nextEventTimer = (interval.min + Math.random() * (interval.max - interval.min)) * eMult;
    }

    // Unhandled events apply gradual ignore penalties
    for (const event of this.activeEvents) {
      if (event.isPipeline) continue;
      event.ageTimer = (event.ageTimer || 0) + dt;

      // After 8 seconds unhandled, start applying ignore effects
      if (event.ageTimer > 8 && event.ignoreEffects) {
        const factor = dt * 0.15; // 15% of ignore effects per second
        if (event.ignoreEffects.rage) this.meters.rage += event.ignoreEffects.rage * factor;
        if (event.ignoreEffects.queue) this.meters.queue += event.ignoreEffects.queue * factor;
        if (event.ignoreEffects.burnout) this.meters.burnout += event.ignoreEffects.burnout * factor;
      }

      // Update card aging visual
      if (event.ageTimer > 6) {
        this.ui.ageCard(event.uid, event.ageTimer);
      }
    }
  }

  spawnEvent() {
    const event = getRandomEventAny(this.phase);
    if (!event) return;

    event.uid = nextUid();
    event.ageTimer = 0;
    event.escalationCount = 0;
    this.activeEvents.push(event);
    this.stationManager.setEvent(event.station, true);

    if (event.isEscalated) {
      Audio.playEscalation();
    } else {
      Audio.playEventSpawn();
    }

    // Spawn patient (respect station capacity)
    if (!event.isInterrupt && event.station !== 'phone') {
      const stationPatients = this.patients.filter(
        p => p.station === event.station && p.visible && !p.fadeOut
      );
      if (stationPatients.length < MAX_PATIENTS_PER_STATION) {
        this.spawnPatient(event.station);
      }
    }

    if (event.station === 'drive') {
      this.driveThruCars = Math.min(3, this.driveThruCars + 1);
    }

    this.ui.addCard(event,
      (ev) => this.handleEvent(ev),
      (ev) => this.deferEvent(ev),
      (ev) => this.rushEvent(ev)
    );
  }

  handleEvent(event) {
    if (this.pharmacist.state !== 'IDLE') {
      this.showTutorial('busy');
      return;
    }

    Audio.playDispatch();

    this.ui.removeCard(event.uid);
    this.activeEvents = this.activeEvents.filter(e => e.uid !== event.uid);

    const station = STATIONS[event.station];
    const path = findPath(this.tileMap, Math.round(this.pharmacist.col), Math.round(this.pharmacist.row), station.col, station.row);

    // Fix: if path is empty, start working immediately (already at station or can't reach)
    if (path.length === 0) {
      this.pharmacist.state = 'WORKING';
      this.pharmacist.workTimer = 0;
      this.pharmacist.workEvent = event;
      this.pharmacist.workDuration = event.duration;
      this.pharmacist.workLabel = event.title;
    } else {
      this.pharmacist.state = 'WALKING';
      this.pharmacist.path = path;
      this.pharmacist.pathIndex = 0;
      this.pharmacist.workEvent = event;
      this.pharmacist.workDuration = event.duration;
      this.pharmacist.workLabel = event.title;
    }
  }

  rushEvent(event) {
    // RUSH: handle at half duration, but costs burnout
    if (this.pharmacist.state !== 'IDLE') {
      this.showTutorial('busy');
      return;
    }

    Audio.playDispatch();

    this.ui.removeCard(event.uid);
    this.activeEvents = this.activeEvents.filter(e => e.uid !== event.uid);

    Audio.playRush();

    // Rush cost: immediate burnout
    this.meters.burnout = Math.min(METER_MAX, this.meters.burnout + 6 * this.diff.meterMult);

    const station = STATIONS[event.station];
    const path = findPath(this.tileMap, Math.round(this.pharmacist.col), Math.round(this.pharmacist.row), station.col, station.row);
    const rushedDuration = event.duration * 0.5;

    if (path.length === 0) {
      this.pharmacist.state = 'WORKING';
      this.pharmacist.workTimer = 0;
      this.pharmacist.workEvent = event;
      this.pharmacist.workDuration = rushedDuration;
      this.pharmacist.workLabel = '⚡ ' + event.title;
    } else {
      this.pharmacist.state = 'WALKING';
      this.pharmacist.path = path;
      this.pharmacist.pathIndex = 0;
      this.pharmacist.workEvent = event;
      this.pharmacist.workDuration = rushedDuration;
      this.pharmacist.workLabel = '⚡ ' + event.title;
    }
  }

  deferEvent(event) {
    if (!event.canDefer) return;

    Audio.playDefer();

    this.ui.removeCard(event.uid);
    this.activeEvents = this.activeEvents.filter(e => e.uid !== event.uid);
    this.stationManager.setEvent(event.station, false);

    const returnTime = getDeferTime();
    this.deferredEvents.push({
      originalEvent: event,
      returnTimer: returnTime,
      escalationCount: (event.escalationCount || 0) + 1,
    });

    this.stats.eventsDeferred++;

    // Defer has immediate small meter cost
    this.meters.rage = Math.min(METER_MAX, this.meters.rage + 2);
    this.meters.burnout = Math.min(METER_MAX, this.meters.burnout + 1);

    this.removePatientAtStation(event.station);
  }

  updateDeferred(dt) {
    for (let i = this.deferredEvents.length - 1; i >= 0; i--) {
      this.deferredEvents[i].returnTimer -= dt;
      if (this.deferredEvents[i].returnTimer <= 0) {
        const { originalEvent, escalationCount } = this.deferredEvents[i];
        this.deferredEvents.splice(i, 1);

        // Check escalation cap
        if (escalationCount >= MAX_ESCALATION_CHAIN) {
          // Event expires with full ignore penalty
          if (originalEvent.ignoreEffects) {
            this.applyEffects({
              rage: originalEvent.ignoreEffects.rage || 0,
              queue: originalEvent.ignoreEffects.queue || 0,
              burnout: (originalEvent.ignoreEffects.burnout || 0) + 3,
            });
          }
          this.meters.rage = Math.min(METER_MAX, this.meters.rage + 5);
          this.stats.eventsEscalated++;
          Audio.playEscalation();
          continue;
        }

        const escalated = getEscalatedEvent(originalEvent);
        escalated.uid = nextUid();
        escalated.ageTimer = 0;
        escalated.escalationCount = escalationCount;
        this.activeEvents.push(escalated);
        this.stationManager.setEvent(escalated.station, true);
        this.stationManager.setUrgency(escalated.station, 2);
        this.stats.eventsEscalated++;

        Audio.playEscalation();
        this.renderer.shake(3);
        this.renderer.spawnParticles(
          STATIONS[escalated.station].col,
          STATIONS[escalated.station].row,
          '#ff4444', 6
        );

        // Spawn angry patient if room
        const stationPatients = this.patients.filter(
          p => p.station === escalated.station && p.visible && !p.fadeOut
        );
        if (stationPatients.length < MAX_PATIENTS_PER_STATION) {
          this.spawnPatient(escalated.station, 0.25);
        }

        this.ui.addCard(escalated,
          (ev) => this.handleEvent(ev),
          (ev) => this.deferEvent(ev),
          (ev) => this.rushEvent(ev)
        );
      }
    }
  }

  // ========== PHARMACIST ==========

  updatePharmacist(dt) {
    const pharm = this.pharmacist;

    if (pharm.state === 'IDLE') {
      pharm.idleTimer += dt;
    } else {
      pharm.idleTimer = 0;
    }

    if (pharm.state === 'WALKING') {
      if (pharm.pathIndex < pharm.path.length) {
        const target = pharm.path[pharm.pathIndex];
        const dx = target.col - pharm.col;
        const dy = target.row - pharm.row;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.15) {
          pharm.col = target.col;
          pharm.row = target.row;
          pharm.pathIndex++;
        } else {
          const speed = PHARMACIST_SPEED * dt;
          pharm.col += (dx / dist) * speed;
          pharm.row += (dy / dist) * speed;
          pharm.facing = dx > 0 ? 'right' : dx < 0 ? 'left' : pharm.facing;
        }
      } else {
        // Arrived
        if (pharm.workEvent) {
          pharm.state = 'WORKING';
          pharm.workTimer = 0;
        } else {
          pharm.state = 'IDLE';
        }
      }
    } else if (pharm.state === 'WORKING') {
      pharm.workTimer += dt;
      const progress = pharm.workTimer / pharm.workDuration;
      this.ui.showWorkProgress(pharm.workLabel, progress);

      if (pharm.workTimer >= pharm.workDuration) {
        this.completeWork();
      }
    }
  }

  completeWork() {
    const pharm = this.pharmacist;
    const event = pharm.workEvent;

    Audio.playComplete();

    if (event) {
      // Combo system — rapid handling chains give bonus relief
      if (this.comboTimer > 0) {
        this.comboCount++;
      } else {
        this.comboCount = 1;
      }
      this.comboTimer = COMBO_WINDOW;

      if (this.comboCount >= 2) {
        this.ui.showCombo(this.comboCount);
        Audio.playCombo(this.comboCount);
        // Bonus meter relief for combos
        const bonus = (this.comboCount - 1) * COMBO_BONUS_PER_STACK;
        this.meters.queue = Math.max(0, this.meters.queue - bonus);
        this.meters.rage = Math.max(0, this.meters.rage - bonus * 0.5);
        // Extra particles for combos
        this.renderer.spawnParticles(pharm.col, pharm.row, '#ffdd00', this.comboCount * 3);
      }

      this.applyEffects(event.effects);

      if (event.addsScript) {
        this.pipeline.addScript(1);
      }

      if (event.isPipeline && event.pipelineAction === 'verify') {
        this.pipeline.verify();
        this.stats.scriptsVerified++;
      } else if (event.isPipeline && event.pipelineAction === 'serve') {
        this.pipeline.serve();
        this.stats.patientsServed++;
      }

      if (!event.isPipeline) {
        this.stats.eventsHandled++;
      }

      this.stationManager.setEvent(event.station, false);
      this.stationManager.setUrgency(event.station, 0);

      if (event.station === 'drive') {
        this.driveThruCars = Math.max(0, this.driveThruCars - 1);
      }
      this.removePatientAtStation(event.station);
    }

    pharm.state = 'IDLE';
    pharm.workEvent = null;
    pharm.workTimer = 0;
    this.ui.hideWorkProgress();

    this.renderer.flashComplete(pharm.col, pharm.row);
    this.updatePipelineCards();
  }

  // ========== PIPELINE CARDS ==========

  updatePipelineCards() {
    for (const ev of this.activeEvents) {
      if (ev.isPipeline) this.ui.removeCard(ev.uid);
    }
    this.activeEvents = this.activeEvents.filter(e => !e.isPipeline);

    if (this.pipeline.canVerify()) {
      const n = this.pipeline.unverified;
      const verifyEvent = {
        uid: nextUid(),
        title: 'VERIFY SCRIPT',
        desc: `${n} script${n > 1 ? 's' : ''} waiting.${n > 4 ? ' Queue backing up!' : ''}`,
        station: 'verify',
        duration: VERIFY_TIME,
        effects: { queue: -5, burnout: 1 },
        canDefer: false,
        isPipeline: true,
        pipelineAction: 'verify',
      };
      this.activeEvents.push(verifyEvent);
      this.ui.addCard(verifyEvent, (ev) => this.handleEvent(ev), () => {});
    }

    if (this.pipeline.canServe()) {
      const n = this.pipeline.ready;
      const serveEvent = {
        uid: nextUid(),
        title: 'SERVE PATIENT',
        desc: `${n} ready for pickup.${n > 3 ? ' People are waiting!' : ''}`,
        station: 'pickup',
        duration: SERVE_TIME,
        effects: { queue: -5, rage: -4, burnout: 1 },
        canDefer: false,
        isPipeline: true,
        pipelineAction: 'serve',
      };
      this.activeEvents.push(serveEvent);
      this.ui.addCard(serveEvent, (ev) => this.handleEvent(ev), () => {});
    }
  }

  // ========== PIPELINE FLOW ==========

  updatePipeline(dt) {
    this.nextScriptTimer -= dt;
    if (this.nextScriptTimer <= 0) {
      const interval = PHASE_SCRIPT_INTERVAL[this.phase] || PHASE_SCRIPT_INTERVAL.OPENING;
      this.nextScriptTimer = interval.min + Math.random() * (interval.max - interval.min);
      this.pipeline.addScript(1);
      this.updatePipelineCards();
    }
  }

  // ========== PATIENTS ==========

  spawnPatient(stationKey, startPatience) {
    const station = STATIONS[stationKey];
    if (!station) return;

    // Offset patients so they don't overlap at same station
    const existing = this.patients.filter(p => p.station === stationKey && p.visible && !p.fadeOut);
    const offset = existing.length * 1.5;

    const targetCol = station.col + offset + (Math.random() * 0.5 - 0.25);
    // Patients stand in the customer approach area (rows 4-6)
    const targetRow = stationKey === 'drive' ? 5 : 5 + (existing.length * 0.5);

    // Walk in from the top (portrait mode) or right for drive-thru
    const startCol = stationKey === 'drive' ? 15 : targetCol;
    const startRow = stationKey === 'drive' ? -1 : -1;

    const patient = {
      id: this.nextPatientId++,
      col: startCol,
      row: startRow,
      targetCol,
      targetRow,
      walking: true,
      station: stationKey,
      paletteIndex: Math.floor(Math.random() * PATIENT_PALETTES.length),
      patience: startPatience !== undefined ? startPatience : 1.0,
      visible: true,
      opacity: 1,
      fadeOut: false,
      showBubble: false,
      bubbleText: '',
      bubbleTimer: 0,
      waitTime: 0,
      nextBarkTime: 4 + Math.random() * 6,
    };

    this.patients.push(patient);
    this.stationManager.setPatient(stationKey, patient);
  }

  removePatientAtStation(stationKey) {
    const idx = this.patients.findIndex(p => p.station === stationKey && p.visible && !p.fadeOut);
    if (idx >= 0) {
      this.patients[idx].fadeOut = true;
      this.patients[idx].opacity = 1;
    }
    this.stationManager.clearPatient(stationKey);
  }

  updatePatients(dt) {
    for (let i = this.patients.length - 1; i >= 0; i--) {
      const patient = this.patients[i];
      if (!patient.visible) {
        this.patients.splice(i, 1);
        continue;
      }

      // Fade out animation
      if (patient.fadeOut) {
        patient.opacity -= dt * 2.5;
        if (patient.opacity <= 0) {
          patient.visible = false;
        }
        continue;
      }

      // Walk to station (vertical + horizontal)
      if (patient.walking) {
        const dx = patient.targetCol - patient.col;
        const dy = patient.targetRow - patient.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.2) {
          patient.col = patient.targetCol;
          patient.row = patient.targetRow;
          patient.walking = false;
        } else {
          const speed = 4 * dt;
          patient.col += (dx / dist) * speed;
          patient.row += (dy / dist) * speed;
        }
        continue;
      }

      patient.waitTime += dt;
      patient.patience = Math.max(0, patient.patience - dt * 0.025 * this.diff.patienceMult);

      // Patient leaves when patience hits 0
      if (patient.patience <= 0 && !patient.fadeOut) {
        patient.fadeOut = true;
        this.stats.patientsLost++;
        this.renderer.shake(2);
        // Rage spike when patient leaves angry
        this.meters.rage = Math.min(METER_MAX, this.meters.rage + 4);
        this.meters.queue = Math.min(METER_MAX, this.meters.queue + 2);
        if (!this.tutorialShown.has('leaving')) {
          this.showTutorial('leaving');
        }
        continue;
      }

      // Bubble management
      if (patient.showBubble) {
        patient.bubbleTimer -= dt;
        if (patient.bubbleTimer <= 0) {
          patient.showBubble = false;
        }
      }

      // Random barks — more frequent when impatient
      patient.nextBarkTime -= dt;
      if (patient.nextBarkTime <= 0) {
        patient.showBubble = true;
        patient.bubbleText = PATIENT_BARKS[Math.floor(Math.random() * PATIENT_BARKS.length)];
        patient.bubbleTimer = 3;
        const barkInterval = patient.patience < 0.3 ? 3 + Math.random() * 4 :
                             patient.patience < 0.6 ? 5 + Math.random() * 7 :
                             7 + Math.random() * 10;
        patient.nextBarkTime = barkInterval;
        Audio.playBark();
      }

      // Update station urgency
      if (patient.patience < 0.3) {
        this.stationManager.setUrgency(patient.station, 2);
      } else if (patient.patience < 0.6) {
        this.stationManager.setUrgency(patient.station, 1);
      }
    }
  }

  // ========== GAME OVER ==========

  checkGameOver() {
    if (this.meters.queue >= METER_MAX) {
      this.endGame(false, 'queue');
    } else if (this.meters.rage >= METER_MAX) {
      this.endGame(false, 'rage');
    } else if (this.meters.burnout >= METER_MAX) {
      this.endGame(false, 'burnout');
    }
  }

  endGame(won, lostMeter) {
    this.state = 'GAMEOVER';
    Audio.stopAmbient();

    if (won) {
      Audio.playWin();
    } else {
      Audio.playGameOver();
      this.renderer.shake(6);
    }

    this.ui.clearCards();
    this.ui.hideWorkProgress();
    this.ui.hideLunch();
    this.ui.hideTutorial();

    this.ui.showResults(won, lostMeter, {
      queue: this.meters.queue,
      rage: this.meters.rage,
      burnout: this.meters.burnout,
    }, this.stats);

    // Save high score
    const grade = this.ui.calculateGrade(won, this.meters, this.stats);
    this.saveHighScore(grade, won);
  }

  // ========== HIGH SCORES ==========

  loadHighScores() {
    try {
      const data = localStorage.getItem('otb_highscores');
      const scores = data ? JSON.parse(data) : [];
      const filtered = scores.filter(s => s.difficulty === this.difficulty);
      this.ui.showHighScores(filtered);
    } catch (e) {
      // localStorage unavailable
    }
  }

  saveHighScore(grade, won) {
    try {
      const data = localStorage.getItem('otb_highscores');
      const scores = data ? JSON.parse(data) : [];
      scores.push({
        grade,
        won,
        difficulty: this.difficulty,
        handled: this.stats.eventsHandled + this.stats.scriptsVerified + this.stats.patientsServed,
        date: Date.now(),
      });
      // Sort: S > A > B > C > D > F, then by handled count
      const gradeOrder = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
      scores.sort((a, b) => (gradeOrder[b.grade] || 0) - (gradeOrder[a.grade] || 0) || b.handled - a.handled);
      // Keep top 10
      localStorage.setItem('otb_highscores', JSON.stringify(scores.slice(0, 10)));
    } catch (e) {
      // localStorage unavailable
    }
  }
}
