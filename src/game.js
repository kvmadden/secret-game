/**
 * Game state machine and main tick loop.
 * Manages: phases, meters, events, pharmacist, patients, pipeline.
 */

import {
  GAME_DURATION, PHASES, METER_MAX, STATIONS,
  PHASE_EVENT_INTERVAL, PHASE_AMBIENT, PHASE_SCRIPT_INTERVAL,
  PHARMACIST_START, PHARMACIST_SPEED, VERIFY_TIME, SERVE_TIME,
  PATIENT_PALETTES, PATIENT_BARKS, LUNCH_MESSAGES,
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
    this.reset();
    this.setupListeners();
  }

  reset() {
    this.state = 'TITLE'; // TITLE, PLAYING, LUNCH, GAMEOVER
    this.time = 0;
    this.elapsed = 0;
    this.lastTimestamp = null;

    // Meters
    this.meters = { queue: 10, rage: 5, burnout: 0 };

    // Phase
    this.phase = 'OPENING';
    this.prevPhase = null;

    // Meter warning cooldowns
    this.meterWarningCooldown = { queue: 0, rage: 0, burnout: 0 };

    // Pharmacist
    this.pharmacist = {
      col: PHARMACIST_START.col,
      row: PHARMACIST_START.row,
      state: 'IDLE', // IDLE, WALKING, WORKING
      facing: 'right',
      path: [],
      pathIndex: 0,
      workTimer: 0,
      workDuration: 0,
      workEvent: null,
      workLabel: '',
      idleTimer: 0,
    };

    // Pipeline
    this.pipeline = new Pipeline();
    this.pipeline.addScript(2); // Start with 2 scripts

    // Station manager
    this.stationManager = new StationManager();

    // Active events (visible as cards)
    this.activeEvents = [];

    // Deferred events (waiting to return)
    this.deferredEvents = [];

    // Patients (visual entities)
    this.patients = [];
    this.nextPatientId = 0;

    // Drive-thru cars
    this.driveThruCars = 0;

    // Timers
    this.nextEventTimer = 3; // first event after 3s
    this.nextScriptTimer = 6;
    this.lunchMessageTimer = 0;
    this.lunchMessageIndex = 0;

    // Phone ringing state
    this.phoneRinging = false;
    this.phoneRingTimer = 0;

    // Tutorial state
    this.tutorialStep = 0;
    this.tutorialTimer = 0;
    this.tutorialShown = new Set();

    // Stats
    this.stats = {
      eventsHandled: 0,
      scriptsVerified: 0,
      patientsServed: 0,
      eventsDeferred: 0,
      eventsEscalated: 0,
    };

    // UI reset
    this.ui.clearCards();
    this.ui.hideWorkProgress();
    this.ui.hideLunch();
    this.ui.hideResults();
    this.ui.hidePhaseAnnounce();
    this.ui.hideTutorial();

    // Add pipeline cards
    this.updatePipelineCards();
  }

  setupListeners() {
    // Start button
    document.getElementById('start-btn').addEventListener('click', () => {
      Audio.playClick();
      this.startGame();
    });

    // Retry button
    document.getElementById('retry-btn').addEventListener('click', () => {
      Audio.playClick();
      this.reset();
      this.startGame();
    });

    // Title button
    document.getElementById('title-btn').addEventListener('click', () => {
      Audio.playClick();
      this.reset();
      this.ui.showTitle();
    });

    // Resize
    window.addEventListener('resize', () => this.renderer.resize());
  }

  startGame() {
    this.ui.hideTitle();
    this.state = 'PLAYING';
    this.lastTimestamp = performance.now();
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
      welcome: 'Tap HANDLE on cards below to send the pharmacist to work. DEFER buys time but problems come back worse.',
      pipeline: 'Scripts need VERIFYING before patients can pick them up. Keep the pipeline moving.',
      busy: "The pharmacist is busy! Queue up your next action when they're free.",
      pressure: 'Meters climbing — prioritize the most urgent cards first.',
    };

    if (tips[step]) {
      this.ui.showTutorial(tips[step]);
      this.tutorialTimer = 6;
    }
  }

  // ========== MAIN GAME LOOP ==========

  tick() {
    if (this.state !== 'PLAYING' && this.state !== 'LUNCH') return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = now;
    this.time += dt;
    this.elapsed += dt;

    // Update tutorial timer
    if (this.tutorialTimer > 0) {
      this.tutorialTimer -= dt;
      if (this.tutorialTimer <= 0) {
        this.ui.hideTutorial();
      }
    }

    // Update phase
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

    // Render
    this.renderer.updateCamera(this.pharmacist.col, dt);
    this.renderer.render(this.getState());

    // Update UI
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

    // Show phase announcement
    const phase = PHASES.find(p => p.name === to);
    if (phase && to !== 'LUNCH_CLOSE') {
      this.ui.showPhaseAnnounce(phase.label);
    }

    if (to === 'LUNCH_CLOSE') {
      Audio.playLunchStart();
      this.state = 'LUNCH';
      this.lunchMessageIndex = 0;
      this.lunchMessageTimer = 0;
      this.ui.showLunch(LUNCH_MESSAGES[0], '');
      this.ui.clearCards();
      this.pharmacist.state = 'IDLE';
      this.pharmacist.path = [];
      this.phoneRinging = false;
    } else if (to === 'REOPEN_RUSH' && from === 'LUNCH_CLOSE') {
      Audio.playReopenRush();
      this.state = 'PLAYING';
      this.ui.hideLunch();
      this.ui.showPhaseAnnounce('REOPEN RUSH');
      // Reopen surge
      this.meters.queue = Math.min(METER_MAX, this.meters.queue + 15);
      this.meters.rage = Math.min(METER_MAX, this.meters.rage + 8);
      this.pipeline.addScript(4);
      this.spawnPatient('pickup');
      this.spawnPatient('pickup');
      this.spawnPatient('drive');
      this.driveThruCars = 2;
      this.nextEventTimer = 1;
      this.updatePipelineCards();
    } else if (to === 'BUILDING') {
      this.showTutorial('pipeline');
    }
  }

  // ========== LUNCH ==========

  updateLunch(dt) {
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

    if (Math.random() < 0.005) {
      this.pipeline.addScript(1);
    }
  }

  // ========== METERS ==========

  updateMeters(dt) {
    const ambient = PHASE_AMBIENT[this.phase] || PHASE_AMBIENT.OPENING;

    this.meters.queue += ambient.queue * dt;
    this.meters.rage += ambient.rage * dt;
    this.meters.burnout += ambient.burnout * dt;

    // Pipeline contribution to queue
    const pipePressure = this.pipeline.getPressure() * 0.02 * dt;
    this.meters.queue += pipePressure;

    // Patient wait time contribution to rage
    for (const patient of this.patients) {
      if (patient.visible && patient.patience < 0.5) {
        this.meters.rage += 0.3 * dt;
      }
    }

    // Clamp
    this.meters.queue = Math.max(0, Math.min(METER_MAX, this.meters.queue));
    this.meters.rage = Math.max(0, Math.min(METER_MAX, this.meters.rage));
    this.meters.burnout = Math.max(0, Math.min(METER_MAX, this.meters.burnout));
  }

  checkMeterWarnings(dt) {
    for (const key of ['queue', 'rage', 'burnout']) {
      this.meterWarningCooldown[key] -= dt;
      if (this.meters[key] > 75 && this.meterWarningCooldown[key] <= 0) {
        Audio.playMeterWarning();
        this.meterWarningCooldown[key] = 8; // Don't spam warnings
        if (!this.tutorialShown.has('pressure')) {
          this.showTutorial('pressure');
        }
      }
    }
  }

  applyEffects(effects) {
    if (!effects) return;
    if (effects.queue) this.meters.queue = Math.max(0, Math.min(METER_MAX, this.meters.queue + effects.queue));
    if (effects.rage) this.meters.rage = Math.max(0, Math.min(METER_MAX, this.meters.rage + effects.rage));
    if (effects.burnout) this.meters.burnout = Math.max(0, Math.min(METER_MAX, this.meters.burnout + effects.burnout));
  }

  // ========== PHONE RINGING ==========

  updatePhoneRing(dt) {
    // Phone rings when there's a phone event active
    const hasPhoneEvent = this.activeEvents.some(e => e.station === 'phone' && !e.isPipeline);
    if (hasPhoneEvent && !this.phoneRinging) {
      this.phoneRinging = true;
      this.phoneRingTimer = 0;
      Audio.playPhoneRing();
    } else if (hasPhoneEvent) {
      this.phoneRingTimer += dt;
      // Ring again every 4 seconds
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
      this.nextEventTimer = interval.min + Math.random() * (interval.max - interval.min);
    } else if (this.nextEventTimer <= 0) {
      const interval = PHASE_EVENT_INTERVAL[this.phase] || PHASE_EVENT_INTERVAL.OPENING;
      this.nextEventTimer = interval.min + Math.random() * (interval.max - interval.min);
    }

    // Unhandled events apply gradual ignore penalties
    for (const event of this.activeEvents) {
      if (event.isPipeline) continue;
      event.ageTimer = (event.ageTimer || 0) + dt;
      // After 10 seconds unhandled, start applying ignore effects slowly
      if (event.ageTimer > 10 && event.ignoreEffects) {
        const factor = dt * 0.1;
        if (event.ignoreEffects.rage) this.meters.rage += event.ignoreEffects.rage * factor;
        if (event.ignoreEffects.queue) this.meters.queue += event.ignoreEffects.queue * factor;
        if (event.ignoreEffects.burnout) this.meters.burnout += event.ignoreEffects.burnout * factor;
      }
      // Update card aging visual
      if (event.ageTimer > 8) {
        this.ui.ageCard(event.uid, event.ageTimer);
      }
    }
  }

  spawnEvent() {
    const event = getRandomEventAny(this.phase);
    if (!event) return;

    event.uid = nextUid();
    event.ageTimer = 0;
    this.activeEvents.push(event);
    this.stationManager.setEvent(event.station, true);

    // Audio feedback
    if (event.isEscalated) {
      Audio.playEscalation();
    } else {
      Audio.playEventSpawn();
    }

    // Spawn patient
    if (!event.isInterrupt && event.station !== 'phone') {
      this.spawnPatient(event.station);
    }

    if (event.station === 'drive') {
      this.driveThruCars = Math.min(3, this.driveThruCars + 1);
    }

    this.ui.addCard(event,
      (ev) => this.handleEvent(ev),
      (ev) => this.deferEvent(ev)
    );
  }

  handleEvent(event) {
    if (this.pharmacist.state !== 'IDLE') {
      // Show tutorial about being busy
      this.showTutorial('busy');
      return;
    }

    Audio.playDispatch();

    // Remove card
    this.ui.removeCard(event.uid);
    this.activeEvents = this.activeEvents.filter(e => e.uid !== event.uid);

    // Walk to station then work
    const station = STATIONS[event.station];
    const path = findPath(this.tileMap, Math.round(this.pharmacist.col), Math.round(this.pharmacist.row), station.col, station.row);

    this.pharmacist.state = 'WALKING';
    this.pharmacist.path = path;
    this.pharmacist.pathIndex = 0;
    this.pharmacist.workEvent = event;
    this.pharmacist.workDuration = event.duration;
    this.pharmacist.workLabel = event.title;
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
    });

    this.stats.eventsDeferred++;
    this.removePatientAtStation(event.station);
  }

  updateDeferred(dt) {
    for (let i = this.deferredEvents.length - 1; i >= 0; i--) {
      this.deferredEvents[i].returnTimer -= dt;
      if (this.deferredEvents[i].returnTimer <= 0) {
        const { originalEvent } = this.deferredEvents[i];
        this.deferredEvents.splice(i, 1);

        const escalated = getEscalatedEvent(originalEvent);
        escalated.uid = nextUid();
        escalated.ageTimer = 0;
        this.activeEvents.push(escalated);
        this.stationManager.setEvent(escalated.station, true);
        this.stationManager.setUrgency(escalated.station, 2);
        this.stats.eventsEscalated++;

        Audio.playEscalation();

        this.spawnPatient(escalated.station, 0.3);

        this.ui.addCard(escalated,
          (ev) => this.handleEvent(ev),
          (ev) => this.deferEvent(ev)
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

        if (dist < 0.1) {
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
        // Arrived at destination
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

    // Flash completion effect on canvas
    this.renderer.flashComplete(pharm.col, pharm.row);

    this.updatePipelineCards();
  }

  // ========== PIPELINE CARDS ==========

  updatePipelineCards() {
    for (const ev of this.activeEvents) {
      if (ev.isPipeline) {
        this.ui.removeCard(ev.uid);
      }
    }
    this.activeEvents = this.activeEvents.filter(e => !e.isPipeline);

    if (this.pipeline.canVerify()) {
      const verifyEvent = {
        uid: nextUid(),
        title: 'VERIFY SCRIPT',
        desc: `${this.pipeline.unverified} script${this.pipeline.unverified > 1 ? 's' : ''} waiting.`,
        station: 'verify',
        duration: VERIFY_TIME,
        effects: { queue: -4, burnout: 1 },
        canDefer: false,
        isPipeline: true,
        pipelineAction: 'verify',
      };
      this.activeEvents.push(verifyEvent);
      this.ui.addCard(verifyEvent,
        (ev) => this.handleEvent(ev),
        () => {}
      );
    }

    if (this.pipeline.canServe()) {
      const serveEvent = {
        uid: nextUid(),
        title: 'SERVE PATIENT',
        desc: `${this.pipeline.ready} ready for pickup.`,
        station: 'pickup',
        duration: SERVE_TIME,
        effects: { queue: -5, rage: -3, burnout: 1 },
        canDefer: false,
        isPipeline: true,
        pipelineAction: 'serve',
      };
      this.activeEvents.push(serveEvent);
      this.ui.addCard(serveEvent,
        (ev) => this.handleEvent(ev),
        () => {}
      );
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

    // Spawn at entrance then walk to station
    const targetCol = station.col + (Math.random() * 2 - 1);
    const targetRow = stationKey === 'drive' ? 2 : 3;

    // Start position: walk in from edge
    const startCol = stationKey === 'drive' ? 39 : (Math.random() > 0.5 ? -1 : 20);
    const startRow = targetRow;

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
      showBubble: false,
      bubbleText: '',
      bubbleTimer: 0,
      waitTime: 0,
      nextBarkTime: 5 + Math.random() * 8,
    };

    this.patients.push(patient);
    this.stationManager.setPatient(stationKey, patient);
  }

  removePatientAtStation(stationKey) {
    const idx = this.patients.findIndex(p => p.station === stationKey && p.visible);
    if (idx >= 0) {
      // Fade out instead of instant removal
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
        patient.opacity -= dt * 2;
        if (patient.opacity <= 0) {
          patient.visible = false;
        }
        continue;
      }

      // Walk to station
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
      patient.patience = Math.max(0, patient.patience - dt * 0.02);

      // Bubble management
      if (patient.showBubble) {
        patient.bubbleTimer -= dt;
        if (patient.bubbleTimer <= 0) {
          patient.showBubble = false;
        }
      }

      // Random barks
      patient.nextBarkTime -= dt;
      if (patient.nextBarkTime <= 0) {
        patient.showBubble = true;
        patient.bubbleText = PATIENT_BARKS[Math.floor(Math.random() * PATIENT_BARKS.length)];
        patient.bubbleTimer = 3;
        patient.nextBarkTime = 6 + Math.random() * 10;
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

    if (won) {
      Audio.playWin();
    } else {
      Audio.playGameOver();
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
  }
}
