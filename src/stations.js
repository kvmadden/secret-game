/**
 * Station definitions and state management.
 * Each station tracks active patients, visual state, etc.
 */

import { STATIONS } from './constants.js';

export class StationManager {
  constructor() {
    this.stations = {};
    for (const [key, def] of Object.entries(STATIONS)) {
      this.stations[key] = {
        ...def,
        key,
        activePatient: null,   // Patient entity currently at this station
        hasEvent: false,       // Whether an event is active here
        urgency: 0,            // Visual urgency level (0-2)
      };
    }
  }

  getStation(key) {
    return this.stations[key];
  }

  setPatient(stationKey, patient) {
    this.stations[stationKey].activePatient = patient;
  }

  clearPatient(stationKey) {
    this.stations[stationKey].activePatient = null;
    this.stations[stationKey].urgency = 0;
  }

  setEvent(stationKey, hasEvent) {
    this.stations[stationKey].hasEvent = hasEvent;
  }

  setUrgency(stationKey, level) {
    this.stations[stationKey].urgency = Math.min(2, Math.max(0, level));
  }

  getAll() {
    return Object.values(this.stations);
  }
}
