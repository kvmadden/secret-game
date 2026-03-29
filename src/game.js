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
  PIPELINE_RAGE_PRESSURE_MULT, PIPELINE_SAFETY_PRESSURE_MULT,
  MAX_ESCALATION_CHAIN,
  DIFFICULTY, COMBO_WINDOW, COMBO_BONUS_PER_STACK,
  SHIFT_DAYS, WEATHER_TYPES,
} from './constants.js';
import { Pipeline } from './pipeline.js';
import { StationManager } from './stations.js';
import { getRandomEventAny, getEscalatedEvent, getDeferTime } from './events.js';
import { findPath } from './pathfinding.js';
import { createTileMap } from './map.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { Campaign } from './campaign.js';
import { EndlessMode } from './endless.js';
import * as Audio from './audio.js';
import { ParticleSystem } from './particles.js';
import { MusicSystem } from './music.js';
import { ScreenFX } from './screen-fx.js';
import { EmotionSystem } from './emotions.js';
import { DayNightCycle } from './day-night.js';
import { MiniMap } from './mini-map.js';
import { ToastSystem } from './toast.js';
import { AchievementSystem } from './achievements.js';
import { MeterVisuals } from './meter-visuals.js';
import { CameraJuice } from './camera-juice.js';
import { SeasonalDecorations } from './seasonal.js';
import { FIELD_LEADERS } from './field-leaders.js';
import { SUPERVISOR_EVENTS } from './supervisor-events.js';
import { SHIFT_WEATHER, getWeatherForShift, getWeatherEffects } from './shift-weather.js';
import { WeatherRenderer } from './weather-renderer.js';
import { NightRenderer } from './night-renderer.js';
import { SignatureEventVisuals } from './signature-event-visuals.js';

let uidCounter = 0;
function nextUid() { return ++uidCounter; }

export class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.ui = new UI();
    this.tileMap = createTileMap();
    this.renderer.init(this.tileMap);
    this.difficulty = 'NORMAL';
    this.campaign = new Campaign();
    this.endless = new EndlessMode();

    // New visual systems
    this.particles = new ParticleSystem();
    this.music = new MusicSystem();
    this.screenFX = new ScreenFX();
    this.emotions = new EmotionSystem();
    this.dayNight = new DayNightCycle();
    this.miniMap = new MiniMap(16, 20, 16);
    this.toasts = new ToastSystem();
    this.achievements = new AchievementSystem();
    this.meterVisuals = new MeterVisuals();
    this.cameraJuice = new CameraJuice();
    this.seasonal = new SeasonalDecorations();
    this.weatherRenderer = new WeatherRenderer();
    this.nightRenderer = new NightRenderer();
    this.signatureVisuals = new SignatureEventVisuals();

    this.reset();
    this.setupListeners();
    this.loadHighScores();
    this.startTitleAnimation();
  }

  reset() {
    this.state = 'TITLE';
    this.diff = DIFFICULTY[this.difficulty] || DIFFICULTY.NORMAL;
    this.renderer.setOverview(false);
    const zoomBtn = document.getElementById('zoom-btn');
    if (zoomBtn) zoomBtn.textContent = '🔍';
    this.time = 0;
    this.elapsed = 0;
    this.lastTimestamp = null;

    // Meters — start low, pressure builds
    this.meters = { queue: 0, safety: 0, rage: 0, burnout: 0, scrutiny: 0 };

    // Phase
    this.phase = 'OPENING';
    this.prevPhase = null;

    // Meter warning cooldowns
    this.meterWarningCooldown = { queue: 0, safety: 0, rage: 0, burnout: 0, scrutiny: 0 };

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
      idleAnim: 'none', // 'none' | 'tapping' | 'watch' | 'sigh'
      stress: 0, // visual stress indicator (0-1)
    };

    // Pipeline
    this.pipeline = new Pipeline();
    this.pipeline.addScript(1);

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
    this.driveThruCarQueue = [];

    // Ambient shoppers (background life in store area)
    this.ambientShoppers = [];
    this.ambientShopperTimer = 2;

    // Weather (weighted random pick)
    this.weather = this._pickWeather();

    // Timers
    this.nextEventTimer = 10;
    this.nextScriptTimer = 15;
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
    this.ui.hideCampaignHud();
    this.ui.hideDayIntro();
    this.ui.hideShiftEnd();
    this.ui.hideCampaignEnd();
    this.ui.hideEndlessIntro();
    this.ui.hideEndlessExtend();
    this.ui.hideEndlessEnd();

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
      this.campaign.reset();
      this.reset();
      this.ui.showTitle();
      this.loadHighScores();
      this.startTitleAnimation();
    });

    // Campaign mode button
    document.getElementById('campaign-btn').addEventListener('click', () => {
      Audio.playClick();
      this.startCampaign();
    });

    // Day intro start/continue button
    document.getElementById('day-start-btn').addEventListener('click', () => {
      Audio.playClick();
      this.ui.hideDayIntro();
      if (this.campaign.isActive()) {
        const node = this.campaign.getCurrentNode();
        if (node && node.type === 'shift') {
          this.startShiftFromCampaign();
        } else {
          this.advanceCampaignNode();
        }
      } else if (this.endless.isActive()) {
        this.startEndlessSegment();
      }
    });

    // Endless mode button
    document.getElementById('endless-btn').addEventListener('click', () => {
      Audio.playClick();
      this.startEndless();
    });

    // Endless intro start
    document.getElementById('endless-go-btn').addEventListener('click', () => {
      Audio.playClick();
      this.ui.hideEndlessIntro();
      this.startEndlessSegment();
    });

    // Endless end → title
    document.getElementById('endless-title-btn').addEventListener('click', () => {
      Audio.playClick();
      this.endless.reset();
      this.reset();
      this.ui.hideEndlessEnd();
      this.ui.showTitle();
      this.loadHighScores();
      this.startTitleAnimation();
    });

    // Campaign end → title
    document.getElementById('campaign-title-btn').addEventListener('click', () => {
      Audio.playClick();
      this.campaign.reset();
      this.reset();
      this.ui.hideCampaignEnd();
      this.ui.showTitle();
      this.loadHighScores();
      this.startTitleAnimation();
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

    // Zoom toggle
    const zoomBtn = document.getElementById('zoom-btn');
    zoomBtn.addEventListener('click', () => {
      Audio.playClick();
      this.renderer.toggleOverview();
      zoomBtn.textContent = this.renderer.manualOverview ? '🔎' : '🔍';
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

    // Keyboard controls for desktop play
    window.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  handleKeyboard(e) {
    // Title screen: Enter/Space to start
    if (this.state === 'TITLE') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        Audio.playClick();
        this.startGame();
      }
      return;
    }

    // Pause screen: Escape or P to resume
    if (this.state === 'PAUSED') {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        Audio.playClick();
        this.resumeGame();
      }
      return;
    }

    // Game over: Enter/Space to retry (only in quick shift mode)
    if (this.state === 'GAMEOVER' && !this.campaign.isActive() && !this.endless.isActive()) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        Audio.playClick();
        this.reset();
        this.startGame();
      }
      return;
    }

    // Day intro: Enter/Space to continue
    if (this.state === 'DAY_INTRO') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        Audio.playClick();
        this.ui.hideDayIntro();
        // Check if current node is a shift (start playing) or story/chapter_result (advance)
        if (this.campaign.isActive()) {
          const node = this.campaign.getCurrentNode();
          if (node && node.type === 'shift') {
            this.startShiftFromCampaign();
          } else {
            this.advanceCampaignNode();
          }
        } else if (this.endless.isActive()) {
          this.startShiftFromCampaign();
        }
      }
      return;
    }

    // Shift end decisions: 1-3 to choose
    if (this.state === 'SHIFT_END') {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 3) {
        e.preventDefault();
        Audio.playClick();
        this.handleCampaignDecision(num - 1);
      }
      return;
    }

    // Endless intro: Enter/Space to start
    if (this.state === 'ENDLESS_INTRO') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        Audio.playClick();
        this.ui.hideEndlessIntro();
        this.startEndlessSegment();
      }
      return;
    }

    // In-game controls
    if (this.state === 'PLAYING') {
      // Number keys 1-5: handle cards by index
      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        const cards = [...this.ui.activeCards.entries()];
        if (idx < cards.length) {
          const [uid] = cards[idx];
          const event = this.activeEvents.find(ev => ev.uid === uid);
          if (event) {
            this.handleEvent(event);
          }
        }
        return;
      }

      // D key: defer the first card that can be deferred
      if (e.key === 'd' || e.key === 'D') {
        const deferable = this.activeEvents.find(ev => ev.canDefer && !ev.isPipeline);
        if (deferable) this.deferEvent(deferable);
        return;
      }

      // R key: rush the first card that supports rush
      if (e.key === 'r' || e.key === 'R') {
        const rushable = this.activeEvents.find(ev => !ev.isPipeline && ev.duration >= 4);
        if (rushable) this.rushEvent(rushable);
        return;
      }

      // Z key: toggle zoom
      if (e.key === 'z' || e.key === 'Z') {
        this.renderer.toggleOverview();
        const zoomBtn = document.getElementById('zoom-btn');
        if (zoomBtn) zoomBtn.textContent = this.renderer.manualOverview ? '🔎' : '🔍';
        return;
      }

      // M key: toggle mute
      if (e.key === 'm' || e.key === 'M') {
        const nowMuted = Audio.toggleMute();
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) muteBtn.textContent = nowMuted ? '🔇' : '🔊';
        return;
      }

      // P or Escape: pause
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        Audio.playClick();
        this.pauseGame();
        return;
      }
    }
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
    this.stopTitleAnimation();
    this.diff = DIFFICULTY[this.difficulty] || DIFFICULTY.NORMAL;

    // Pick a random day of the week
    this.shiftDay = SHIFT_DAYS[Math.floor(Math.random() * SHIFT_DAYS.length)];

    // Pick weather (weighted random)
    const totalWeight = WEATHER_TYPES.reduce((sum, w) => sum + w.weight, 0);
    let roll = Math.random() * totalWeight;
    this.weather = WEATHER_TYPES[0];
    for (const w of WEATHER_TYPES) {
      roll -= w.weight;
      if (roll <= 0) { this.weather = w; break; }
    }

    this.ui.hideTitle();
    this.state = 'PLAYING';
    this.renderer.setOverview(false);
    this.lastTimestamp = performance.now();
    Audio.startAmbient();
    this.music.start('OPENING');
    this.spawnInitialPatients();
    this.showTutorial('welcome');

    // Show the day announcement + modifier
    this.ui.showPhaseAnnounce(this.shiftDay.name);
    setTimeout(() => {
      const weatherInfo = this.weather ? ` | ${this.weather.name}` : '';
      this.ui.showTutorial(`${this.shiftDay.modifier}: ${this.shiftDay.desc}${weatherInfo}`);
      this.tutorialTimer = 5;
    }, 2600);

    this.tick();
  }

  spawnInitialPatients() {
    this.spawnPatient('pickup');
  }

  // ========== TITLE SCREEN ANIMATION ==========

  startTitleAnimation() {
    this.titleTime = 0;
    this.titleShoppers = [];
    // Spawn some initial ambient shoppers for the title
    for (let i = 0; i < 3; i++) {
      this.titleShoppers.push({
        id: nextUid(),
        col: 2 + Math.random() * 10,
        row: 1 + Math.random() * 4,
        targetCol: 2 + Math.random() * 10,
        targetRow: 1 + Math.random() * 4,
        state: 'BROWSING',
        facing: Math.random() < 0.5 ? 'left' : 'right',
        browseTimer: Math.random() * 4,
        paletteIndex: Math.floor(Math.random() * PATIENT_PALETTES.length),
        hasCart: Math.random() < 0.3,
      });
    }
    this.renderer.setOverview(true);
    this.titleAnimFrame = null;
    this.tickTitle();
  }

  tickTitle() {
    if (this.state !== 'TITLE') return;
    const now = performance.now();
    const dt = this.lastTitleTimestamp ? Math.min((now - this.lastTitleTimestamp) / 1000, 0.1) : 1 / 60;
    this.lastTitleTimestamp = now;
    this.titleTime += dt;

    // Update title shoppers
    for (let i = this.titleShoppers.length - 1; i >= 0; i--) {
      const s = this.titleShoppers[i];
      if (s.state === 'WALKING') {
        const dx = s.targetCol - s.col;
        const dy = s.targetRow - s.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.2) {
          s.state = 'BROWSING';
          s.browseTimer = 2 + Math.random() * 4;
        } else {
          s.col += (dx / dist) * 1.2 * dt;
          s.row += (dy / dist) * 1.2 * dt;
          s.facing = dx > 0 ? 'right' : 'left';
        }
      } else {
        s.browseTimer -= dt;
        if (s.browseTimer <= 0) {
          s.targetCol = 2 + Math.random() * 10;
          s.targetRow = 1 + Math.random() * 4;
          s.state = 'WALKING';
        }
      }
    }

    // Render the pharmacy scene in overview
    this.renderer.updateCamera(
      { col: 7, row: 10 }, dt,
      {
        time: this.titleTime,
        phase: 'OPENING',
        pharmacist: { col: 7, row: 11, state: 'IDLE', facing: 'right', idleTimer: 0, stress: 0 },
        patients: [],
        stationManager: this.stationManager,
        driveThruCars: 0,
        phoneRinging: false,
        meters: { queue: 0, safety: 0, rage: 0, burnout: 0, scrutiny: 0 },
        ambientShoppers: this.titleShoppers,
      }
    );
    this.renderer.render({
      time: this.titleTime,
      phase: 'OPENING',
      pharmacist: { col: 7, row: 11, state: 'IDLE', facing: 'right', idleTimer: this.titleTime, stress: 0, workTimer: 0, workDuration: 1 },
      patients: [],
      stationManager: this.stationManager,
      driveThruCars: 0,
      phoneRinging: false,
      meters: { queue: 0, safety: 0, rage: 0, burnout: 0, scrutiny: 0 },
      ambientShoppers: this.titleShoppers,
    });

    this.titleAnimFrame = requestAnimationFrame(() => this.tickTitle());
  }

  stopTitleAnimation() {
    if (this.titleAnimFrame) {
      cancelAnimationFrame(this.titleAnimFrame);
      this.titleAnimFrame = null;
    }
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
      this.updateAmbientShoppers(dt);
      this.updateDriveThruCars(dt);
      this.updateIdleBehavior(dt);
      this.checkMeterWarnings(dt);
      this.checkGameOver();

      // Supervisor event check (campaign only)
      if (this.campaign.isActive() && this._supervisorEvents && this._supervisorEventTimer !== undefined) {
        this._supervisorEventTimer -= dt;
        if (this._supervisorEventTimer <= 0) {
          const sevt = this._supervisorEvents[Math.floor(Math.random() * this._supervisorEvents.length)];
          if (sevt && this.activeCards.length < 4) {
            this.spawnEvent(sevt);
          }
          this._supervisorEventTimer = 90 + Math.random() * 90; // Next event in 90-180s
        }
      }
    } else if (this.state === 'LUNCH') {
      this.updateLunch(dt);
    }

    // Update pharmacist stress visual
    const avgMeter = (this.meters.queue + this.meters.safety + this.meters.rage + this.meters.burnout + this.meters.scrutiny) / 5;
    this.pharmacist.stress = Math.min(1, avgMeter / 70);

    // Update new visual systems
    this.particles.update(dt);
    this.emotions.update(dt);
    this.toasts.update(dt);
    this.meterVisuals.update(this.meters, dt);
    this.cameraJuice.update(dt);
    this.dayNight.update(this.elapsed, GAME_DURATION, this.weather);
    this.miniMap.update(this.getState());
    this.weatherRenderer.update(dt, this.weather || 'clear', 0.7);
    this.nightRenderer.update(dt, this.nightRenderer.isNightShift(this.campaign?.currentNodeId));
    this.signatureVisuals.update(dt);

    this.renderer.updateCamera(this.pharmacist, dt, this.getState());
    this.renderer.render(this.getState());

    // Render new visual systems on top of game canvas
    const ctx = this.renderer.ctx;
    const w = this.renderer.canvas.width;
    const h = this.renderer.canvas.height;
    this.particles.render(ctx);
    this.emotions.render(ctx);
    this.toasts.render(ctx, w / (this.renderer.dpr || 1));
    this.meterVisuals.render(ctx, w, h);
    this.screenFX.applyEffects(ctx, w, h, this.getState());
    this.miniMap.render(ctx, w / (this.renderer.dpr || 1), h / (this.renderer.dpr || 1), this.renderer.camZoom);
    this.weatherRenderer.render(ctx, w, h, this.weather || 'clear', 0.7);
    this.nightRenderer.render(ctx, w, h, this.nightRenderer.isNightShift(this.campaign?.currentNodeId));
    this.signatureVisuals.render(ctx, w, h);

    // Disable action buttons when pharmacist is busy
    this.ui.setCardsBusy(this.pharmacist.state !== 'IDLE');

    this.ui.updateTimer(this.elapsed);
    this.ui.updatePhase(this.phase);
    this.ui.updateMeters(this.meters);
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
      driveThruCarQueue: this.driveThruCarQueue,
      phoneRinging: this.phoneRinging,
      meters: this.meters,
      ambientShoppers: this.ambientShoppers,
      shiftDay: this.shiftDay,
      weather: this.weather,
      elapsed: this.elapsed,
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
    this.music.setPhase(to);

    const phase = PHASES.find(p => p.name === to);
    if (phase && to !== 'LUNCH_CLOSE') {
      this.ui.showPhaseAnnounce(phase.label);
    }

    if (to === 'LUNCH_CLOSE') {
      // Dramatic 0.5s delay before the gate slams shut
      setTimeout(() => {
        Audio.playLunchStart();
        this.renderer.shake(2); // Gate slam shake

        // Grace period: if pharmacist is working, let them finish
        if (this.pharmacist.state === 'WORKING') {
          this.lunchGraceTimer = this.pharmacist.workDuration - this.pharmacist.workTimer + 0.5;
        } else {
          this.enterLunch();
        }
      }, 500);
      return; // Skip the phase announce below — lunch handles its own UI
    } else if (to === 'REOPEN_RUSH' && from === 'LUNCH_CLOSE') {
      Audio.playReopenRush();
      this.state = 'PLAYING';
      this.ui.hideLunch();
      this.renderer.setGate(false); // Open the gate
      Audio.playGateOpen();
      this.renderer.shake(3); // Gate opens with force
      // Flash effect on reopen
      this.renderer.flashComplete(8, 7, '#ffffaa');
      this.ui.showPhaseAnnounce('REOPEN RUSH');
      this.meters.queue = Math.min(METER_MAX, this.meters.queue + 15);
      this.meters.rage = Math.min(METER_MAX, this.meters.rage + 8);
      this.meters.scrutiny = Math.min(METER_MAX, this.meters.scrutiny + 5);
      this.pipeline.addScript(4);
      this.spawnPatient('pickup');
      this.spawnPatient('pickup');
      this.spawnPatient('drive');
      this.driveThruCars = 2;
      // Populate car queue for reopen rush
      const CAR_COLORS_RUSH = ['#c0392b', '#2980b9', '#27ae60', '#f39c12'];
      this.driveThruCarQueue = [];
      for (let ci = 0; ci < 2; ci++) {
        this.driveThruCarQueue.push({
          row: 8 + ci * 3, col: 14.5,
          color: CAR_COLORS_RUSH[Math.floor(Math.random() * CAR_COLORS_RUSH.length)],
          waiting: false, leaving: false, timer: 0,
        });
      }
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
    this.renderer.setGate(true); // Close the gate
    Audio.playGateClose();
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
    for (const key of ['queue', 'safety', 'rage', 'burnout', 'scrutiny']) {
      this.meters[key] = Math.max(0, Math.min(METER_MAX, this.meters[key] + (ambient[key] || 0) * dt));
    }

    if (this.lunchMessageTimer > 3) {
      this.lunchMessageTimer = 0;
      this.lunchMessageIndex = (this.lunchMessageIndex + 1) % LUNCH_MESSAGES.length;
      this.ui.showLunch(
        LUNCH_MESSAGES[this.lunchMessageIndex],
        `Queue: ${Math.round(this.meters.queue)} | Rage: ${Math.round(this.meters.rage)}`
      );
    }

    if (Math.random() < 0.003) {
      this.pipeline.addScript(1);
    }
  }

  // ========== METERS ==========

  updateMeters(dt) {
    const ambient = PHASE_AMBIENT[this.phase] || PHASE_AMBIENT.OPENING;
    const aMult = this.diff.ambientMult;

    const campaignRageMult = this.campaign.isActive() ? this.campaign.getRageMult() : 1;
    const dayRage = (this.shiftDay?.rageMult || 1) * campaignRageMult;
    const dayBurnout = this.shiftDay?.burnoutMult || 1;

    this.meters.queue += ambient.queue * aMult * dt;
    this.meters.safety += ambient.safety * aMult * dt;
    this.meters.rage += ambient.rage * aMult * dayRage * dt;
    this.meters.burnout += ambient.burnout * aMult * dayBurnout * dt;
    this.meters.scrutiny += ambient.scrutiny * aMult * dt;

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

    // High pipeline backlog increases safety risk (rushing = mistakes)
    if (this.pipeline.unverified > 3) {
      this.meters.safety += (this.pipeline.unverified - 3) * PIPELINE_SAFETY_PRESSURE_MULT * dt;
    }

    // High burnout increases safety risk (tired = errors)
    if (this.meters.burnout > 70) {
      this.meters.safety += 0.04 * dt;
    }

    // High rage and queue compound scrutiny (corporate notices chaos)
    if (this.meters.rage > 75 && this.meters.queue > 75) {
      this.meters.scrutiny += 0.03 * dt;
    }

    // Patient wait time contribution to rage (gentle)
    let angryPatients = 0;
    for (const patient of this.patients) {
      if (!patient.visible || patient.fadeOut || patient.walking) continue;
      if (patient.patience < 0.3) {
        this.meters.rage += 0.15 * dt;
        angryPatients++;
      } else if (patient.patience < 0.5) {
        this.meters.rage += 0.05 * dt;
      }
    }

    // Many angry patients compound burnout (only when overwhelmed)
    if (angryPatients >= 4) {
      this.meters.burnout += 0.08 * dt;
    }

    // Clamp all meters
    for (const key of ['queue', 'safety', 'rage', 'burnout', 'scrutiny']) {
      this.meters[key] = Math.max(0, Math.min(METER_MAX, this.meters[key]));
    }
  }

  checkMeterWarnings(dt) {
    for (const key of ['queue', 'safety', 'rage', 'burnout', 'scrutiny']) {
      this.meterWarningCooldown[key] -= dt;
      if (this.meters[key] > 70 && this.meterWarningCooldown[key] <= 0) {
        Audio.playMeterWarning();
        this.meterWarningCooldown[key] = 8;
        if (!this.tutorialShown.has('pressure')) {
          this.showTutorial('pressure');
        }
      }
      // Screen shake when a meter hits critical (>85)
      if (this.meters[key] > 85 && this.meterWarningCooldown[key] > 6.5) {
        // Only shake once per warning cycle (just crossed 85)
        this.renderer.shake(2);
      }
    }
  }

  applyEffects(effects) {
    if (!effects) return;
    const mMult = this.diff.meterMult;
    for (const key of ['queue', 'safety', 'rage', 'burnout', 'scrutiny']) {
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
    // Progressive event cap: start with 1, ramp to 3 at the rush
    const maxEvents = this.phase === 'OPENING' ? 1
      : this.phase === 'BUILDING' ? 2
      : this.phase === 'LATE_DRAG' ? 2
      : 3; // REOPEN_RUSH
    if (this.nextEventTimer <= 0 && nonPipelineEvents.length < maxEvents) {
      this.spawnEvent();
      const interval = PHASE_EVENT_INTERVAL[this.phase] || PHASE_EVENT_INTERVAL.OPENING;
      const eMult = this.diff.eventMult;
      const dayEvent = this.shiftDay?.eventMult || 1;
      this.nextEventTimer = (interval.min + Math.random() * (interval.max - interval.min)) * eMult / dayEvent;
    } else if (this.nextEventTimer <= 0) {
      const interval = PHASE_EVENT_INTERVAL[this.phase] || PHASE_EVENT_INTERVAL.OPENING;
      const eMult = this.diff.eventMult;
      const dayEvent = this.shiftDay?.eventMult || 1;
      this.nextEventTimer = (interval.min + Math.random() * (interval.max - interval.min)) * eMult / dayEvent;
    }

    // Unhandled events apply gradual ignore penalties
    for (const event of this.activeEvents) {
      if (event.isPipeline) continue;
      event.ageTimer = (event.ageTimer || 0) + dt;

      // After 15 seconds unhandled, start applying ignore effects
      if (event.ageTimer > 15 && event.ignoreEffects) {
        const factor = dt * 0.08; // 8% of ignore effects per second
        for (const key of ['queue', 'safety', 'rage', 'burnout', 'scrutiny']) {
          if (event.ignoreEffects[key]) this.meters[key] += event.ignoreEffects[key] * factor;
        }
      }

      // Update card aging visual
      if (event.ageTimer > 6) {
        this.ui.ageCard(event.uid, event.ageTimer);
      }
    }
  }

  spawnEvent(providedEvent) {
    const event = providedEvent || getRandomEventAny(this.phase);
    if (!event) return;

    event.uid = nextUid();
    event.duration = (event.duration || 10) * 1.8; // Give more time to react
    event.ageTimer = 0;
    event.escalationCount = 0;
    this.activeEvents.push(event);
    this.stationManager.setEvent(event.station, true);

    if (event.tier === 'signature') {
      this.signatureVisuals.startEvent(event.id);
    }

    if (event.isEscalated) {
      Audio.playEscalation();
    } else {
      Audio.playEventSpawn();
    }

    // Positive event sound
    if (event.isPositive) {
      Audio.playPositiveEvent();
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
      // Queue a car object if not already at max
      if (this.driveThruCarQueue.length < 3) {
        const CAR_COLORS = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#2c3e50'];
        this.driveThruCarQueue.push({
          row: 0, col: 14.5,
          color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
          waiting: false, leaving: false, timer: 0,
        });
      }
    }

    this.ui.addCard(event,
      (ev) => this.handleEvent(ev),
      (ev) => this.deferEvent(ev),
      (ev) => this.rushEvent(ev)
    );

    // Auto-peek if event spawns far from pharmacist (off-screen drama)
    const station = STATIONS[event.station];
    if (station) {
      const dx = station.col - this.pharmacist.col;
      const dy = station.row - this.pharmacist.row;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 6) {
        this.renderer.peek(1.5);
      }
    }
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

    // Rush cost: immediate burnout + safety risk (rushing = mistakes)
    this.meters.burnout = Math.min(METER_MAX, this.meters.burnout + 6 * this.diff.meterMult);
    this.meters.safety = Math.min(METER_MAX, this.meters.safety + 4 * this.diff.meterMult);

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
            const penalty = { ...originalEvent.ignoreEffects };
            penalty.burnout = (penalty.burnout || 0) + 3;
            penalty.scrutiny = (penalty.scrutiny || 0) + 3;
            this.applyEffects(penalty);
          }
          this.meters.rage = Math.min(METER_MAX, this.meters.rage + 5);
          this.meters.scrutiny = Math.min(METER_MAX, this.meters.scrutiny + 3);
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
        this.renderer.peek(2.0); // Longer peek for escalations
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
          Audio.playFootstep();
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

  updateIdleBehavior(dt) {
    const pharm = this.pharmacist;
    if (pharm.state !== 'IDLE') {
      pharm.idleAnim = 'none';
      return;
    }
    // Progressive idle animations for game juice
    if (pharm.idleTimer >= 8) {
      pharm.idleAnim = 'sigh';       // thought bubble sigh
    } else if (pharm.idleTimer >= 5) {
      pharm.idleAnim = 'watch';      // checks watch
    } else if (pharm.idleTimer >= 3) {
      pharm.idleAnim = 'tapping';    // taps foot
    } else {
      pharm.idleAnim = 'none';
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
        this.meters.scrutiny = Math.max(0, this.meters.scrutiny - bonus * 0.3);
        // Extra particles for combos
        this.renderer.spawnParticles(pharm.col, pharm.row, '#ffdd00', this.comboCount * 3);
        // Combo screen shake that scales with combo count
        this.renderer.shake(0.5 * this.comboCount);
        // Flash the combo indicator with a scale animation
        const comboEl = document.getElementById('combo-indicator');
        if (comboEl) {
          comboEl.style.transform = 'scale(1.4)';
          comboEl.style.transition = 'transform 0.2s ease-out';
          setTimeout(() => {
            comboEl.style.transform = 'scale(1)';
          }, 200);
        }
      }

      this.applyEffects(event.effects);

      if (event.addsScript) {
        this.pipeline.addScript(1);
      }

      if (event.isPipeline && event.pipelineAction === 'verify') {
        this.pipeline.verify();
        this.stats.scriptsVerified++;
        Audio.playPaperShuffle();
        this.renderer.triggerReceipt();
      } else if (event.isPipeline && event.pipelineAction === 'serve') {
        this.pipeline.serve();
        this.stats.patientsServed++;
        Audio.playRegisterDing();
      }

      if (!event.isPipeline) {
        this.stats.eventsHandled++;
      }

      this.stationManager.setEvent(event.station, false);
      this.stationManager.setUrgency(event.station, 0);

      if (event.station === 'drive') {
        this.driveThruCars = Math.max(0, this.driveThruCars - 1);
        // Release the first waiting car in the queue
        const waitingCar = this.driveThruCarQueue.find(c => c.waiting);
        if (waitingCar) waitingCar.leaving = true;
      }
      this.removePatientAtStation(event.station);

      if (this.signatureVisuals.isActive()) {
        this.signatureVisuals.endEvent();
      }
    }

    // Detect if this was a rushed completion (label starts with ⚡)
    const wasRush = pharm.workLabel && pharm.workLabel.startsWith('⚡');

    pharm.state = 'IDLE';
    pharm.workEvent = null;
    pharm.workTimer = 0;
    this.ui.hideWorkProgress();

    // Station-specific completion particles
    const stationColor = event ? (STATIONS[event.station]?.color || '#f0d880') : '#f0d880';
    this.renderer.flashComplete(pharm.col, pharm.row, stationColor);

    // Rush completion: extra particles + stronger flash for dramatic feedback
    if (wasRush && event) {
      this.renderer.spawnParticles(pharm.col, pharm.row, '#ff8800', 10);
      this.renderer.spawnParticles(pharm.col, pharm.row, stationColor, 6);
      this.renderer.shake(1);
    }

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
      const dayScript = this.shiftDay?.scriptMult || 1;
      const campaignScript = this.campaign.isActive() ? this.campaign.getScriptSpeedMult() : 1;
      // Higher scriptMult = faster scripts, so divide interval
      this.nextScriptTimer = (interval.min + Math.random() * (interval.max - interval.min)) / dayScript * campaignScript;
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

    // Doorbell chime for walk-in patients
    if (stationKey !== 'drive') {
      Audio.playDoorbell();
    }
  }

  removePatientAtStation(stationKey) {
    const idx = this.patients.findIndex(p => p.station === stationKey && p.visible && !p.fadeOut && !p.stormingOut);
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
      patient.patience = Math.max(0, patient.patience - dt * 0.015 * this.diff.patienceMult);

      // Patient leaves when patience hits 0 — storm out
      if (patient.patience <= 0 && !patient.fadeOut && !patient.stormingOut) {
        patient.stormingOut = true;
        patient.stormTarget = { col: patient.col < 8 ? -2 : 17, row: -2 };
        this.stats.patientsLost++;
        this.renderer.shake(1.5);
        Audio.playStormOut();
        // Red flash at patient position for dramatic storm-out
        this.renderer.flashComplete(patient.col, patient.row, '#ff4444');
        // Angry speech bubble
        patient.showBubble = true;
        patient.bubbleText = Math.random() < 0.5 ? "I'M LEAVING!" : "UNBELIEVABLE!";
        patient.bubbleTimer = 2;
        Audio.playBark();
        // Rage spike when patient leaves angry + scrutiny
        this.meters.rage = Math.min(METER_MAX, this.meters.rage + 4);
        this.meters.queue = Math.min(METER_MAX, this.meters.queue + 2);
        this.meters.scrutiny = Math.min(METER_MAX, this.meters.scrutiny + 2);
        // Angry particles
        this.renderer.spawnParticles(patient.col, patient.row, '#ff6644', 4);
        if (!this.tutorialShown.has('leaving')) {
          this.showTutorial('leaving');
        }
      }

      // Storm-out walk animation
      if (patient.stormingOut) {
        const dx = patient.stormTarget.col - patient.col;
        const dy = patient.stormTarget.row - patient.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.3 || patient.col < -2 || patient.col > 17 || patient.row < -2) {
          patient.visible = false;
        } else {
          const speed = 5 * dt; // Fast angry walk
          patient.col += (dx / dist) * speed;
          patient.row += (dy / dist) * speed;
          patient.walking = true; // For bob animation
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

  // ========== AMBIENT SHOPPERS ==========

  updateAmbientShoppers(dt) {
    this.ambientShopperTimer -= dt;

    // Spawn new shoppers periodically (max 4 at once)
    if (this.ambientShopperTimer <= 0 && this.ambientShoppers.length < 4) {
      this.ambientShopperTimer = 3 + Math.random() * 5;
      this.spawnAmbientShopper();
    }

    // Update existing shoppers
    for (let i = this.ambientShoppers.length - 1; i >= 0; i--) {
      const s = this.ambientShoppers[i];

      if (s.state === 'WALKING') {
        const dx = s.targetCol - s.col;
        const dy = s.targetRow - s.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.2) {
          s.col = s.targetCol;
          s.row = s.targetRow;
          s.state = 'BROWSING';
          s.browseTimer = 2 + Math.random() * 4;
        } else {
          const speed = 1.5 * dt; // Slow stroll
          s.col += (dx / dist) * speed;
          s.row += (dy / dist) * speed;
          s.facing = dx > 0 ? 'right' : 'left';
        }
      } else if (s.state === 'BROWSING') {
        s.browseTimer -= dt;
        if (s.browseTimer <= 0) {
          // Pick a new destination or leave
          if (Math.random() < 0.4) {
            // Leave the store
            s.targetCol = s.col < 8 ? -2 : 17;
            s.targetRow = s.row;
            s.state = 'LEAVING';
          } else {
            // Browse another spot
            s.targetCol = 2 + Math.random() * 10;
            s.targetRow = 1 + Math.random() * 4;
            s.state = 'WALKING';
          }
        }
      } else if (s.state === 'LEAVING') {
        const dx = s.targetCol - s.col;
        const speed = 2 * dt;
        s.col += Math.sign(dx) * speed;
        s.facing = dx > 0 ? 'right' : 'left';
        if (s.col < -2 || s.col > 17) {
          this.ambientShoppers.splice(i, 1);
        }
      }
    }
  }

  spawnAmbientShopper() {
    const fromLeft = Math.random() < 0.5;
    const shopper = {
      id: nextUid(),
      col: fromLeft ? -1 : 16,
      row: 1 + Math.random() * 2,
      targetCol: 2 + Math.random() * 10,
      targetRow: 1 + Math.random() * 4,
      state: 'WALKING',
      facing: fromLeft ? 'right' : 'left',
      browseTimer: 0,
      paletteIndex: Math.floor(Math.random() * PATIENT_PALETTES.length),
      hasCart: Math.random() < 0.3, // Some push shopping carts
    };
    this.ambientShoppers.push(shopper);
  }

  // ========== WEATHER ==========

  _pickWeather() {
    const totalWeight = WEATHER_TYPES.reduce((sum, w) => sum + w.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const w of WEATHER_TYPES) {
      roll -= w.weight;
      if (roll <= 0) return w;
    }
    return WEATHER_TYPES[0];
  }

  // ========== DRIVE-THRU CAR QUEUE ==========

  updateDriveThruCars(dt) {
    const DRIVE_COL = 14.5;
    const WINDOW_ROW = 12;
    const EXIT_ROW = 19;
    const CAR_COLORS = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#2c3e50'];

    // Spawn cars when drive-thru events are active and queue not full
    const driveEvents = this.activeEvents.filter(e => e.station === 'drive' && !e.isPipeline);
    if (driveEvents.length > 0 && this.driveThruCarQueue.length < 2) {
      // Check if we should spawn (no car already approaching)
      const approaching = this.driveThruCarQueue.some(c => c.row < WINDOW_ROW && !c.waiting && !c.leaving);
      if (!approaching) {
        this.driveThruCarQueue.push({
          row: 0,
          col: DRIVE_COL,
          color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
          waiting: false,
          leaving: false,
          timer: 0,
        });
      }
    }

    // Update car positions
    for (let i = this.driveThruCarQueue.length - 1; i >= 0; i--) {
      const car = this.driveThruCarQueue[i];

      if (car.leaving) {
        // Drive away
        car.row += 4 * dt;
        if (car.row > EXIT_ROW) {
          this.driveThruCarQueue.splice(i, 1);
        }
      } else if (car.waiting) {
        car.timer += dt;
      } else {
        // Approach the window
        if (car.row < WINDOW_ROW) {
          car.row += 3 * dt;
          if (car.row >= WINDOW_ROW) {
            car.row = WINDOW_ROW;
            car.waiting = true;
            car.timer = 0;
          }
        }
      }
    }

    // Sync numeric count for renderer backward compat
    this.driveThruCars = this.driveThruCarQueue.length;
  }

  // ========== GAME OVER ==========

  checkGameOver() {
    for (const key of ['queue', 'safety', 'rage', 'burnout', 'scrutiny']) {
      if (this.meters[key] >= METER_MAX) {
        this.endGame(false, key);
        return;
      }
    }
  }

  endGame(won, lostMeter) {
    this.state = 'GAMEOVER';
    Audio.stopAmbient();
    this.music.stop();

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
    this.ui.hideCampaignHud();

    const meterSnapshot = { ...this.meters };

    const hideButtons = this.campaign.isActive() || this.endless.isActive();
    this.ui.showResults(won, lostMeter, meterSnapshot, this.stats, hideButtons);

    // Achievements
    const newAchievements = this.ui.checkAchievements(won, meterSnapshot, this.stats);
    if (newAchievements.length > 0) {
      setTimeout(() => this.ui.showAchievements(newAchievements), 800);
    }

    // Save high score (quick shift only)
    if (!this.campaign.isActive() && !this.endless.isActive()) {
      const grade = this.ui.calculateGrade(won, this.meters, this.stats);
      this.saveHighScore(grade, won);
    }

    // Campaign: route to between-shift flow
    if (this.campaign.isActive()) {
      this.handleCampaignShiftEnd(won, lostMeter);
    }

    // Endless: route to extension prompt or end
    if (this.endless.isActive()) {
      this.handleEndlessShiftEnd(won);
    }
  }

  // ========== CAMPAIGN MODE ==========

  startCampaign() {
    this.stopTitleAnimation();
    this.campaign.start();
    this.ui.hideTitle();
    this.processCampaignNode();
  }

  // Central router — reads current node type, shows appropriate UI
  processCampaignNode() {
    const node = this.campaign.getCurrentNode();
    if (!node) {
      this.showCampaignEnding();
      return;
    }

    const chapter = this.campaign.getCurrentChapter();
    const chapterLabel = chapter ? `CH${chapter.id}: ${chapter.title}` : '';

    switch (node.type) {
      case 'story':
      case 'chapter_result':
        this.showCampaignStory(node, chapterLabel);
        break;
      case 'shift':
        this.showCampaignShiftIntro(node, chapterLabel);
        break;
      case 'decision':
        this.showCampaignDecisionNode(node, chapterLabel);
        break;
      case 'ending':
        this.showCampaignEnding();
        break;
      default:
        // Unknown node type — try to advance past it
        if (this.campaign.advanceToNextNode()) {
          this.processCampaignNode();
        } else {
          this.showCampaignEnding();
        }
    }
  }

  // Story / chapter_result nodes — narrative text, Enter to continue
  showCampaignStory(node, chapterLabel) {
    this.state = 'DAY_INTRO';
    const isChapterResult = node.type === 'chapter_result';
    const dayName = node.title;
    const narrative = { intro: node.content, flavor: isChapterResult ? 'Chapter complete.' : (this.campaign.getCurrentChapter()?.subtitle || '') };
    this.ui.showDayIntro(
      isChapterResult ? '✓' : chapterLabel,
      dayName,
      narrative,
      null,
      null,
      isChapterResult ? [{ text: 'Story continues...', type: 'buff' }] : [],
      true // isStory — show CONTINUE button
    );
  }

  // Shift nodes — show shift intro with difficulty info
  showCampaignShiftIntro(node, chapterLabel) {
    this.state = 'DAY_INTRO';
    const shiftDay = this.campaign.getShiftDay();
    const weather = this.campaign.getWeather();
    this.campaignWeather = weather;
    const day = this.campaign.getCurrentDay();

    const narrative = { intro: node.content, flavor: this.campaign.getCurrentChapter()?.subtitle || '' };

    // Build modifier tags from carry-over effects
    const mods = this.campaign.shiftModifiers;
    const modTags = [];
    if (mods.burnoutStart > 5) modTags.push({ text: 'Starting tired', type: 'debuff' });
    if (mods.burnoutStart < -3) modTags.push({ text: 'Well rested', type: 'buff' });
    if (mods.safetyStart > 5) modTags.push({ text: 'Safety concerns', type: 'debuff' });
    if (mods.safetyStart < -3) modTags.push({ text: 'Safety improved', type: 'buff' });
    if (mods.scrutinyStart > 5) modTags.push({ text: 'Under watch', type: 'debuff' });
    if (mods.scrutinyStart < -3) modTags.push({ text: 'Flying low', type: 'buff' });
    if (mods.scriptSpeedMult < 1) modTags.push({ text: 'Extra help', type: 'buff' });
    if (mods.scriptSpeedMult > 1) modTags.push({ text: 'Undertrained staff', type: 'debuff' });

    // Add node-specific difficulty hint
    if (node.difficulty?.desc) modTags.push({ text: node.difficulty.desc, type: 'neutral' });

    this.ui.showDayIntro(day, node.title || shiftDay.name, narrative, shiftDay, weather, modTags);
    this.ui.showCampaignHud(chapterLabel, `Shift ${day}`);
  }

  // Decision nodes — show choices from the node itself
  showCampaignDecisionNode(node, chapterLabel) {
    this.state = 'SHIFT_END';
    const recap = node.content || node.title;
    const decision = {
      prompt: node.content || node.title,
      choices: node.choices || [],
    };
    this.ui.showShiftEnd(recap, decision, (choiceIdx) => {
      Audio.playClick();
      this.handleCampaignNodeDecision(node, choiceIdx);
    });
  }

  // Handle decision choice from a decision node
  handleCampaignNodeDecision(node, choiceIndex) {
    const choice = node.choices[choiceIndex];
    if (choice && choice.effects) {
      // Apply effects to persistent variables
      const vars = ['burnout', 'reputation', 'teamStrength', 'storeReadiness', 'leadershipAlignment', 'clinicalIntegrity'];
      for (const v of vars) {
        if (choice.effects[v] !== undefined) {
          this.campaign[v] = Math.max(0, Math.min(100, this.campaign[v] + choice.effects[v]));
        }
      }
    }
    this.ui.hideShiftEnd();
    this.advanceCampaignNode();
  }

  startShiftFromCampaign() {
    this.diff = { ...(DIFFICULTY[this.difficulty] || DIFFICULTY.NORMAL) };
    this.shiftDay = this.campaign.getShiftDay();
    this.weather = this.campaignWeather;

    // Apply node-specific difficulty overrides
    const node = this.campaign.getCurrentNode();
    if (node && node.difficulty) {
      const nd = node.difficulty;
      if (nd.ambientMult) this.diff.ambientMult *= nd.ambientMult;
      if (nd.eventMult) this.diff.eventMult *= nd.eventMult;
      if (nd.meterMult) this.diff.meterMult *= nd.meterMult;
      if (nd.interruptWeight !== undefined) this.campaignInterruptWeight = nd.interruptWeight;
    } else {
      this.campaignInterruptWeight = null;
    }

    // Apply campaign starting meters
    this.time = 0;
    this.elapsed = 0;
    this.lastTimestamp = null;
    this.meters = this.campaign.getStartingMeters();
    this.meterWarningCooldown = { queue: 0, safety: 0, rage: 0, burnout: 0, scrutiny: 0 };
    this.phase = 'OPENING';
    this.prevPhase = null;

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
      idleAnim: 'none',
      stress: 0,
    };

    this.pipeline = new Pipeline();
    this.pipeline.addScript(2);
    this.stationManager = new StationManager();
    this.activeEvents = [];
    this.deferredEvents = [];
    this.patients = [];
    this.nextPatientId = 0;
    this.driveThruCars = 0;
    this.driveThruCarQueue = [];
    this.ambientShoppers = [];
    this.ambientShopperTimer = 2;
    this.nextEventTimer = 10;
    this.nextScriptTimer = 15;
    this.lunchMessageTimer = 0;
    this.lunchMessageIndex = 0;
    this.phoneRinging = false;
    this.phoneRingTimer = 0;
    this.lunchGraceTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.tutorialShown = new Set();
    this.tutorialTimer = 0;
    this.stats = {
      eventsHandled: 0,
      scriptsVerified: 0,
      patientsServed: 0,
      eventsDeferred: 0,
      eventsEscalated: 0,
      patientsLost: 0,
    };

    this.ui.clearCards();
    this.ui.hideWorkProgress();
    this.ui.hideLunch();
    this.ui.hideResults();
    this.ui.hidePhaseAnnounce();
    this.ui.hideTutorial();
    this.ui.hidePause();
    this.ui.hideCombo();

    // Apply weather effects from campaign shift config
    if (this.campaign.currentNodeId) {
      const weatherConfig = getWeatherForShift(this.campaign.currentNodeId);
      if (weatherConfig) {
        this.weather = weatherConfig.type;
        const weatherEffects = getWeatherEffects(weatherConfig.type);
        if (weatherEffects) {
          for (const [meter, mod] of Object.entries(weatherEffects)) {
            if (this.meters[meter] !== undefined) {
              this.meters[meter] = Math.min(100, this.meters[meter] + mod);
            }
          }
        }
      }
    }

    // Set up field leader events for this chapter
    if (this.campaign.currentChapter) {
      const chapterId = this.campaign.currentChapter;
      const leaderType = this._getChapterLeader(chapterId);
      if (leaderType && SUPERVISOR_EVENTS[leaderType]) {
        this._supervisorEvents = SUPERVISOR_EVENTS[leaderType];
        this._supervisorEventTimer = 60 + Math.random() * 60; // First event after 60-120s
      }
    }

    const chapter = this.campaign.getCurrentChapter();
    const chapterLabel = chapter ? `CH${chapter.id}: ${chapter.title}` : '';
    this.ui.showCampaignHud(chapterLabel, `Shift ${this.campaign.getCurrentDay()}`);

    this.state = 'PLAYING';
    this.renderer.setOverview(false);
    this.lastTimestamp = performance.now();
    Audio.startAmbient();
    this.spawnInitialPatients();

    const currentNode = this.campaign.getCurrentNode();
    const shiftTitle = (currentNode && currentNode.title) || this.shiftDay.name;
    this.ui.showPhaseAnnounce(shiftTitle);
    setTimeout(() => {
      const weatherInfo = this.weather ? ` | ${this.weather.name}` : '';
      this.ui.showTutorial(`${this.shiftDay.modifier}: ${this.shiftDay.desc}${weatherInfo}`);
      this.tutorialTimer = 5;
    }, 2600);

    this.updatePipelineCards();
    this.tick();
  }

  _getChapterLeader(chapterId) {
    const leaderMap = {
      ch1: 'cheerleader',
      ch2: 'ghost',
      ch3: 'fake_helper',
      ch4: 'rescuer_user',
      ch5: 'metrics_hawk',
      ch6: 'polished_visitor',
      ch7: null,
    };
    return leaderMap[chapterId] || null;
  }

  handleCampaignShiftEnd(won, lostMeter) {
    const grade = this.ui.calculateGrade(won, this.meters, this.stats);
    this.campaign.recordShiftResult(won, this.meters, this.stats, grade);

    // After showing results briefly, advance to next node
    setTimeout(() => {
      this.ui.hideResults();
      this.advanceCampaignNode();
    }, 2000);
  }

  // Advance to next campaign node and process it
  advanceCampaignNode() {
    if (this.campaign.advanceToNextNode()) {
      this.processCampaignNode();
    } else {
      this.showCampaignEnding();
    }
  }

  showCampaignEnding() {
    const endMsg = this.campaign.getCampaignEndMessage();
    const summary = this.campaign.getCampaignSummary();
    this.ui.showCampaignEnd(endMsg, summary);
    this.state = 'CAMPAIGN_END';
  }

  // Legacy compat — kept for keyboard handler routing
  handleCampaignDecision(choiceIndex) {
    // Delegate to node decision handler if current node is a decision
    const node = this.campaign.getCurrentNode();
    if (node && node.type === 'decision') {
      this.handleCampaignNodeDecision(node, choiceIndex);
      return;
    }
    // Fallback: apply from decision pool (legacy between-shift decisions)
    this.campaign.applyDecision(choiceIndex);
    this.ui.hideShiftEnd();
    this.advanceCampaignNode();
  }

  // ========== ENDLESS MODE ==========

  startEndless() {
    this.stopTitleAnimation();
    this.endless.start();
    this.ui.hideTitle();
    this.showEndlessIntro();
  }

  showEndlessIntro() {
    this.state = 'ENDLESS_INTRO';
    const segInfo = this.endless.getSegmentInfo();
    this.ui.showEndlessIntro(segInfo);
  }

  startEndlessSegment() {
    const seg = this.endless.currentSegmentType;
    this.diff = DIFFICULTY[this.difficulty] || DIFFICULTY.NORMAL;
    this.shiftDay = this.endless.getShiftDay();
    this.weather = this.endless.getWeather();

    // Reset shift state
    this.time = 0;
    this.elapsed = 0;
    this.lastTimestamp = null;
    this.meters = this.endless.getStartingMeters();
    this.meterWarningCooldown = { queue: 0, safety: 0, rage: 0, burnout: 0, scrutiny: 0 };
    this.phase = 'OPENING';
    this.prevPhase = null;

    this.pharmacist = {
      col: PHARMACIST_START.col, row: PHARMACIST_START.row,
      state: 'IDLE', facing: 'right', path: [], pathIndex: 0,
      workTimer: 0, workDuration: 0, workEvent: null, workLabel: '',
      idleTimer: 0, idleAnim: 'none', stress: 0,
    };

    this.pipeline = new Pipeline();
    this.pipeline.addScript(2);
    this.stationManager = new StationManager();
    this.activeEvents = [];
    this.deferredEvents = [];
    this.patients = [];
    this.nextPatientId = 0;
    this.driveThruCars = 0;
    this.driveThruCarQueue = [];
    this.ambientShoppers = [];
    this.ambientShopperTimer = 2;
    this.nextEventTimer = 10;
    this.nextScriptTimer = 15;
    this.lunchMessageTimer = 0;
    this.lunchMessageIndex = 0;
    this.phoneRinging = false;
    this.phoneRingTimer = 0;
    this.lunchGraceTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.tutorialShown = new Set();
    this.tutorialTimer = 0;
    this.stats = {
      eventsHandled: 0, scriptsVerified: 0, patientsServed: 0,
      eventsDeferred: 0, eventsEscalated: 0, patientsLost: 0,
    };

    this.ui.clearCards();
    this.ui.hideWorkProgress();
    this.ui.hideLunch();
    this.ui.hideResults();
    this.ui.hidePhaseAnnounce();
    this.ui.hideTutorial();
    this.ui.hidePause();
    this.ui.hideCombo();
    this.ui.showCampaignHud(`Segment ${this.endless.segment}`, '∞');

    this.state = 'PLAYING';
    this.renderer.setOverview(false);
    this.lastTimestamp = performance.now();
    Audio.startAmbient();
    this.spawnInitialPatients();

    this.ui.showPhaseAnnounce(seg.name);
    this.updatePipelineCards();
    this.tick();
  }

  handleEndlessShiftEnd(won) {
    this.endless.recordSegmentResult(won, this.meters, this.stats);

    if (!won) {
      // Collapsed — show endless end
      this.endless.collapse();
      setTimeout(() => {
        this.ui.hideResults();
        const endMsg = this.endless.getEndMessage();
        const summary = this.endless.getEndlessSummary();
        this.ui.showEndlessEnd(endMsg, summary);
        this.state = 'ENDLESS_END';
      }, 2000);
      return;
    }

    // Survived — ask to continue
    setTimeout(() => {
      this.ui.hideResults();
      const prompt = this.endless.getExtensionPrompt();
      this.state = 'ENDLESS_EXTEND';
      this.ui.showEndlessExtend(
        prompt,
        this.endless.fatigue,
        this.endless.hoursAwake,
        () => {
          // STAY
          Audio.playClick();
          this.ui.hideEndlessExtend();
          this.endless.advanceSegment();
          this.showEndlessIntro();
        },
        () => {
          // CLOCK OUT
          Audio.playClick();
          this.ui.hideEndlessExtend();
          this.endless.cashOut();
          const endMsg = this.endless.getEndMessage();
          const summary = this.endless.getEndlessSummary();
          this.ui.showEndlessEnd(endMsg, summary);
          this.state = 'ENDLESS_END';
        }
      );
    }, 2000);
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
