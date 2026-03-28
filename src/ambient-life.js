/**
 * Ambient Life System - Background NPC and ambient activity
 * Makes the pharmacy feel alive with wandering shoppers, waiting patients,
 * drive-thru cars, and street pedestrians. Like Stardew Valley town vibes.
 *
 * No external dependencies. No imports.
 */

// ========== PALETTE DATA (mirrors constants.js PATIENT_PALETTES) ==========
const PALETTES = [
  { hair: '#3a2a1a', shirt: '#4466aa', skin: '#e8b88a', pants: '#3a3848', shoes: '#2a2018' },
  { hair: '#8b6914', shirt: '#aa4444', skin: '#d4a574', pants: '#4a4438', shoes: '#4a3020' },
  { hair: '#1a1a1a', shirt: '#44aa66', skin: '#c49060', pants: '#3e3e50', shoes: '#2a2018' },
  { hair: '#cc8833', shirt: '#6644aa', skin: '#e8c8a0', pants: '#484040', shoes: '#3a2820' },
  { hair: '#555555', shirt: '#aa6644', skin: '#8b6240', pants: '#3a4040', shoes: '#1a1810' },
  { hair: '#2a1a0a', shirt: '#44aaaa', skin: '#d4a574', pants: '#3a3848', shoes: '#4a3020' },
  { hair: '#994422', shirt: '#888844', skin: '#e8b88a', pants: '#4a4438', shoes: '#2a2018' },
  { hair: '#1a2a1a', shirt: '#aa4488', skin: '#c49060', pants: '#3e3e50', shoes: '#3a2820' },
  { hair: '#443322', shirt: '#5588aa', skin: '#e0c090', pants: '#484040', shoes: '#2a2018' },
  { hair: '#111111', shirt: '#cc6644', skin: '#8b6240', pants: '#3a4040', shoes: '#1a1810' },
  { hair: '#664422', shirt: '#5577bb', skin: '#f0c8a0', pants: '#3a3a4a', shoes: '#2a2018' },
  { hair: '#2a2a2a', shirt: '#bb5566', skin: '#b07848', pants: '#484040', shoes: '#4a3020' },
  { hair: '#aa7733', shirt: '#448877', skin: '#e8d0a8', pants: '#3e3e50', shoes: '#2a2018' },
  { hair: '#774422', shirt: '#7766aa', skin: '#d0a070', pants: '#3a3848', shoes: '#3a2820' },
  { hair: '#333333', shirt: '#cc8855', skin: '#a06838', pants: '#4a4438', shoes: '#1a1810' },
  { hair: '#bb9944', shirt: '#557799', skin: '#e8c090', pants: '#3a4040', shoes: '#2a2018' },
];

// ========== CAR COLORS ==========
const CAR_COLORS = [
  '#4466aa', '#aa4444', '#44aa66', '#888888', '#cc8833',
  '#335588', '#884422', '#226644', '#555555', '#aa6644',
];

// ========== SHELF WAYPOINTS (browsing targets in customer area) ==========
const SHELF_WAYPOINTS = [
  { col: 2, row: 1 }, { col: 4, row: 1 }, { col: 6, row: 1 }, { col: 8, row: 1 }, { col: 10, row: 1 },
  { col: 2, row: 3 }, { col: 4, row: 3 }, { col: 6, row: 3 }, { col: 8, row: 3 }, { col: 10, row: 3 },
  { col: 3, row: 5 }, { col: 5, row: 5 }, { col: 7, row: 5 }, { col: 9, row: 5 },
  { col: 3, row: 2 }, { col: 7, row: 2 }, { col: 5, row: 4 }, { col: 9, row: 4 },
];

// Waiting chair positions
const CHAIR_POSITIONS = [
  { col: 2, row: 5 },
  { col: 4, row: 5 },
  { col: 6, row: 6 },
];

// ========== PHASE ACTIVITY CONFIG ==========
const PHASE_CONFIG = {
  OPENING:      { shoppers: { min: 1, max: 2 }, waiters: 0, cars: 0, streetRate: 0.04 },
  BUILDING:     { shoppers: { min: 2, max: 3 }, waiters: 1, cars: 1, streetRate: 0.06 },
  LUNCH_CLOSE:  { shoppers: { min: 1, max: 2 }, waiters: 0, cars: 0, streetRate: 0.03 },
  REOPEN_RUSH:  { shoppers: { min: 3, max: 4 }, waiters: 2, cars: 2, streetRate: 0.08 },
  LATE_DRAG:    { shoppers: { min: 0, max: 1 }, waiters: 0, cars: 0, streetRate: 0.02 },
};

// ========== SOUND EVENTS ==========
const SOUND_EVENTS = ['door_chime', 'phone_ring_bg', 'pa_announcement'];

// ========== HELPERS ==========
let _nextId = 1;
function uid() { return _nextId++; }

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function moveToward(current, target, speed) {
  const diff = target - current;
  if (Math.abs(diff) <= speed) return target;
  return current + Math.sign(diff) * speed;
}

// ========== ENTITY FACTORIES ==========

function createShopper(mapCols) {
  const enterFromTop = true; // shoppers enter from top of store
  const enterCol = randFloat(2, 12);
  return {
    id: uid(),
    type: 'shopper',
    col: enterCol,
    row: -1,
    targetCol: enterCol,
    targetRow: randFloat(1, 5),
    state: 'ENTERING',
    facing: Math.random() < 0.5 ? 'left' : 'right',
    paletteIndex: randInt(0, PALETTES.length - 1),
    timer: 0,
    browseCount: 0,
    maxBrowse: randInt(2, 5),
    hasCart: Math.random() < 0.3,
    visible: true,
    opacity: 1,
    speed: randFloat(1.5, 2.5),
  };
}

function createWaiter(seatIndex) {
  const pos = CHAIR_POSITIONS[seatIndex % CHAIR_POSITIONS.length];
  return {
    id: uid(),
    type: 'waiter',
    col: pos.col,
    row: pos.row,
    targetCol: pos.col,
    targetRow: pos.row,
    seatCol: pos.col,
    seatRow: pos.row,
    state: 'SITTING',
    facing: 'right',
    paletteIndex: randInt(0, PALETTES.length - 1),
    timer: randFloat(1, 3),
    idleBehavior: pick(['reading', 'phone', 'fidgeting']),
    lookTimer: randFloat(4, 8),
    visible: true,
    opacity: 1,
  };
}

function createCar() {
  return {
    id: uid(),
    type: 'car',
    col: 14.5,
    row: -2,
    targetCol: 14.5,
    targetRow: 12, // drive-thru window row
    state: 'ARRIVING',
    facing: 'down',
    paletteIndex: 0,
    carColor: pick(CAR_COLORS),
    timer: 0,
    waitTime: randFloat(4, 8),
    exhaustTimer: 0,
    visible: true,
    opacity: 1,
  };
}

function createPedestrian(mapCols) {
  const fromLeft = Math.random() < 0.5;
  return {
    id: uid(),
    type: 'pedestrian',
    col: fromLeft ? -1 : mapCols + 1,
    row: 0,
    targetCol: fromLeft ? mapCols + 2 : -2,
    targetRow: 0,
    state: 'WALKING',
    facing: fromLeft ? 'right' : 'left',
    paletteIndex: randInt(0, PALETTES.length - 1),
    timer: 0,
    hasCart: false,
    visible: true,
    opacity: 0.6, // background distance feel
    speed: randFloat(2, 4),
    scale: randFloat(0.5, 0.7), // smaller = further away
  };
}

// ==========================================================================
//  AmbientLifeSystem
// ==========================================================================

export class AmbientLifeSystem {
  constructor(mapCols = 16, mapRows = 20, tileSize = 16) {
    this.mapCols = mapCols;
    this.mapRows = mapRows;
    this.tileSize = tileSize;

    this.entities = [];
    this.soundQueue = [];

    this.activityLevel = 0.5; // 0-1
    this.currentPhase = 'OPENING';
    this.phaseConfig = PHASE_CONFIG.OPENING;

    // Spawn timers
    this.shopperTimer = randFloat(1, 3);
    this.carTimer = randFloat(4, 8);
    this.pedestrianTimer = randFloat(3, 6);
    this.soundTimer = randFloat(8, 15);

    // Initial light population
    this._spawnInitial();
  }

  // ------ Public API ------

  update(dt, gameState) {
    if (!dt || dt <= 0) return;
    // Cap dt to prevent huge jumps
    const capped = Math.min(dt, 0.1);

    this._updateSpawnTimers(capped);
    this._updateShoppers(capped);
    this._updateWaiters(capped);
    this._updateCars(capped);
    this._updatePedestrians(capped);
    this._updateSounds(capped);

    // Prune dead entities
    this.entities = this.entities.filter(e => e.visible);
  }

  getEntities() {
    return this.entities;
  }

  /** Drain pending sound event names (caller pops these to play audio). */
  drainSoundEvents() {
    const events = this.soundQueue.slice();
    this.soundQueue.length = 0;
    return events;
  }

  onPhaseChange(phase) {
    this.currentPhase = phase;
    this.phaseConfig = PHASE_CONFIG[phase] || PHASE_CONFIG.OPENING;
    this._reconcilePopulation();
  }

  onLunchClose() {
    // Waiters leave, shoppers stay but no new ones
    for (const e of this.entities) {
      if (e.type === 'waiter') {
        e.state = 'LEAVING';
        e.targetRow = -2;
        e.timer = 0;
      }
    }
  }

  onReopen() {
    // Flood back in - spawn a burst
    const cfg = PHASE_CONFIG.REOPEN_RUSH;
    const count = randInt(cfg.shoppers.min, cfg.shoppers.max);
    const current = this._countType('shopper');
    for (let i = current; i < count; i++) {
      this.entities.push(createShopper(this.mapCols));
    }
    if (this._countType('car') < cfg.cars) {
      this.entities.push(createCar());
    }
    this._queueSound('door_chime');
  }

  setActivityLevel(level) {
    this.activityLevel = clamp(level, 0, 1);
  }

  // ------ Internal: Spawn management ------

  _spawnInitial() {
    // Start with a couple of shoppers already browsing
    const s = createShopper(this.mapCols);
    s.state = 'BROWSING';
    s.row = randFloat(1, 4);
    s.col = randFloat(3, 10);
    s.timer = randFloat(2, 5);
    this.entities.push(s);
  }

  _updateSpawnTimers(dt) {
    const cfg = this.phaseConfig;
    const act = this.activityLevel;

    // -- Shoppers --
    this.shopperTimer -= dt;
    if (this.shopperTimer <= 0) {
      const desired = Math.round(randInt(cfg.shoppers.min, cfg.shoppers.max) * act);
      if (this._countType('shopper') < desired) {
        this.entities.push(createShopper(this.mapCols));
        this._queueSound('door_chime');
      }
      this.shopperTimer = randFloat(3, 7) / Math.max(act, 0.2);
    }

    // -- Cars --
    this.carTimer -= dt;
    if (this.carTimer <= 0) {
      const desired = Math.round(cfg.cars * act);
      if (this._countType('car') < desired) {
        this.entities.push(createCar());
      }
      this.carTimer = randFloat(6, 12) / Math.max(act, 0.2);
    }

    // -- Waiters --
    const desiredWaiters = Math.round(cfg.waiters * act);
    const currentWaiters = this._countType('waiter');
    if (currentWaiters < desiredWaiters) {
      this.entities.push(createWaiter(currentWaiters));
    }

    // -- Pedestrians --
    this.pedestrianTimer -= dt;
    if (this.pedestrianTimer <= 0) {
      if (Math.random() < cfg.streetRate * act * 10) {
        this.entities.push(createPedestrian(this.mapCols));
      }
      this.pedestrianTimer = randFloat(4, 10);
    }
  }

  _reconcilePopulation() {
    const cfg = this.phaseConfig;
    const act = this.activityLevel;

    // If we have too many shoppers, start sending excess ones home
    const maxShoppers = Math.round(cfg.shoppers.max * Math.max(act, 0.3));
    let shopperCount = 0;
    for (const e of this.entities) {
      if (e.type === 'shopper') {
        shopperCount++;
        if (shopperCount > maxShoppers && e.state === 'BROWSING') {
          e.state = 'LEAVING';
          e.targetRow = -2;
          e.targetCol = e.col;
          e.timer = 0;
        }
      }
    }

    // Remove excess waiters
    const maxWaiters = Math.round(cfg.waiters * Math.max(act, 0.3));
    let waiterCount = 0;
    for (const e of this.entities) {
      if (e.type === 'waiter') {
        waiterCount++;
        if (waiterCount > maxWaiters) {
          e.state = 'LEAVING';
          e.targetRow = -2;
          e.timer = 0;
        }
      }
    }
  }

  // ------ Internal: Shopper behavior ------

  _updateShoppers(dt) {
    for (const e of this.entities) {
      if (e.type !== 'shopper') continue;

      switch (e.state) {
        case 'ENTERING': {
          // Walk from top edge to target row
          e.row = moveToward(e.row, e.targetRow, e.speed * dt);
          e.col = moveToward(e.col, e.targetCol, e.speed * dt);
          if (Math.abs(e.row - e.targetRow) < 0.05 && Math.abs(e.col - e.targetCol) < 0.05) {
            e.row = e.targetRow;
            e.col = e.targetCol;
            e.state = 'BROWSING';
            e.timer = randFloat(2, 5);
          }
          break;
        }

        case 'BROWSING': {
          // Stand still, "looking at items"
          e.timer -= dt;
          // Occasionally change facing to look around
          if (Math.random() < 0.01) {
            e.facing = e.facing === 'left' ? 'right' : 'left';
          }
          if (e.timer <= 0) {
            e.browseCount++;
            if (e.browseCount >= e.maxBrowse) {
              // Done shopping, leave
              e.state = 'LEAVING';
              e.targetRow = -2;
              e.targetCol = e.col + randFloat(-2, 2);
              e.timer = 0;
            } else {
              // Move to another shelf
              const wp = pick(SHELF_WAYPOINTS);
              e.targetCol = wp.col + randFloat(-0.5, 0.5);
              e.targetRow = wp.row + randFloat(-0.3, 0.3);
              e.state = 'MOVING';
            }
          }
          break;
        }

        case 'MOVING': {
          const dx = e.targetCol - e.col;
          const dy = e.targetRow - e.row;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.1) {
            e.col = e.targetCol;
            e.row = e.targetRow;
            e.state = 'BROWSING';
            e.timer = randFloat(2, 5);
          } else {
            const spd = e.speed * dt;
            e.col += (dx / dist) * spd;
            e.row += (dy / dist) * spd;
            e.facing = dx > 0 ? 'right' : 'left';
          }
          break;
        }

        case 'LEAVING': {
          // Walk toward top edge and disappear
          e.row = moveToward(e.row, e.targetRow, e.speed * dt);
          e.col = moveToward(e.col, e.targetCol, e.speed * 0.3 * dt);
          if (e.row <= -1.5) {
            e.visible = false;
          }
          // Fade out near edge
          if (e.row < 0) {
            e.opacity = clamp(1 + e.row, 0, 1);
          }
          break;
        }
      }
    }
  }

  // ------ Internal: Waiter behavior ------

  _updateWaiters(dt) {
    for (const e of this.entities) {
      if (e.type !== 'waiter') continue;

      switch (e.state) {
        case 'SITTING': {
          e.timer -= dt;
          e.lookTimer -= dt;

          // Occasionally look toward the counter (face right)
          if (e.lookTimer <= 0) {
            e.facing = 'right';
            e.lookTimer = randFloat(4, 10);
          }

          // Cycle idle behavior
          if (e.timer <= 0) {
            e.idleBehavior = pick(['reading', 'phone', 'fidgeting']);
            e.timer = randFloat(3, 7);
            // Sometimes look around
            if (Math.random() < 0.3) {
              e.facing = e.facing === 'left' ? 'right' : 'left';
            }
          }
          break;
        }

        case 'LEAVING': {
          e.row = moveToward(e.row, e.targetRow, 2 * dt);
          if (e.row <= -1.5) {
            e.visible = false;
          }
          if (e.row < 0) {
            e.opacity = clamp(1 + e.row, 0, 1);
          }
          break;
        }
      }
    }
  }

  // ------ Internal: Drive-thru cars ------

  _updateCars(dt) {
    for (const e of this.entities) {
      if (e.type !== 'car') continue;

      // Exhaust puffs
      e.exhaustTimer += dt;

      switch (e.state) {
        case 'ARRIVING': {
          // Drive down to the window
          e.row = moveToward(e.row, e.targetRow, 3 * dt);
          if (Math.abs(e.row - e.targetRow) < 0.1) {
            e.row = e.targetRow;
            e.state = 'WAITING';
            e.timer = e.waitTime;
          }
          break;
        }

        case 'WAITING': {
          // Idle at window
          e.timer -= dt;
          if (e.timer <= 0) {
            e.state = 'DEPARTING';
            e.targetRow = this.mapRows + 3;
          }
          break;
        }

        case 'DEPARTING': {
          // Drive off-screen downward
          e.row = moveToward(e.row, e.targetRow, 4 * dt);
          if (e.row >= this.mapRows + 2) {
            e.visible = false;
          }
          break;
        }
      }
    }
  }

  // ------ Internal: Pedestrians ------

  _updatePedestrians(dt) {
    for (const e of this.entities) {
      if (e.type !== 'pedestrian') continue;

      e.col = moveToward(e.col, e.targetCol, e.speed * dt);
      if (Math.abs(e.col - e.targetCol) < 0.5) {
        e.visible = false;
      }
    }
  }

  // ------ Internal: Ambient sounds ------

  _updateSounds(dt) {
    this.soundTimer -= dt;
    if (this.soundTimer <= 0) {
      const roll = Math.random();
      if (roll < 0.4) {
        this._queueSound('phone_ring_bg');
      } else if (roll < 0.65) {
        this._queueSound('pa_announcement');
      }
      // door_chime handled by shopper spawns
      this.soundTimer = randFloat(10, 25) / Math.max(this.activityLevel, 0.2);
    }
  }

  _queueSound(name) {
    this.soundQueue.push(name);
  }

  // ------ Internal: Helpers ------

  _countType(type) {
    let n = 0;
    for (const e of this.entities) {
      if (e.type === type && e.visible) n++;
    }
    return n;
  }
}
