const GRADE_ORDER = ['F', 'D', 'C', 'B', 'A', 'S'];
const GRADE_VALUES = { F: 0, D: 1, C: 2, B: 3, A: 4, S: 5 };
const METER_NAMES = ['queue', 'safety', 'rage', 'burnout', 'scrutiny'];

class CampaignStats {
  constructor() {
    this.shiftsPlayed = 0;
    this.shiftsWon = 0;
    this.shiftsLost = 0;
    this.totalPrescriptionsFilled = 0;
    this.totalPatientsServed = 0;
    this.totalPhoneCallsHandled = 0;
    this.totalDriveThruServed = 0;
    this.totalConsultsGiven = 0;
    this.totalEventsHandled = 0;
    this.totalEventsIgnored = 0;
    this.totalEventsDeferred = 0;
    this.longestStreak = 0;
    this.currentStreak = 0;
    this.bestGrade = 'F';
    this.worstGrade = 'S';
    this.gradeHistory = [];
    this.decisionHistory = [];
    this.flagsEarned = [];
    this.timeSpentPlaying = 0;
    this.chapterCompletionTimes = {};
    this.meterPeaks = { queue: 0, safety: 0, rage: 0, burnout: 0, scrutiny: 0 };
    this.closeCalls = 0;
    this.perfectShifts = 0;
    this._closeCallDetails = [];
  }

  recordShift(shiftId, won, grade, meters, stats, duration) {
    this.shiftsPlayed++;
    if (won) {
      this.shiftsWon++;
      this.currentStreak++;
      if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
      }
    } else {
      this.shiftsLost++;
      this.currentStreak = 0;
    }

    if (GRADE_VALUES[grade] > GRADE_VALUES[this.bestGrade]) this.bestGrade = grade;
    if (GRADE_VALUES[grade] < GRADE_VALUES[this.worstGrade]) this.worstGrade = grade;
    this.gradeHistory.push({ shiftId, grade });

    if (stats) {
      this.totalPrescriptionsFilled += stats.prescriptionsFilled || 0;
      this.totalPatientsServed += stats.patientsServed || 0;
      this.totalPhoneCallsHandled += stats.phoneCallsHandled || 0;
      this.totalDriveThruServed += stats.driveThruServed || 0;
      this.totalConsultsGiven += stats.consultsGiven || 0;
    }

    if (duration) this.timeSpentPlaying += duration;

    if (meters) {
      let maxMeterValue = 0;
      let hasCloseCall = false;
      for (const name of METER_NAMES) {
        const val = meters[name] || 0;
        if (val > this.meterPeaks[name]) this.meterPeaks[name] = val;
        if (val > maxMeterValue) maxMeterValue = val;
        if (val > 85 && won) {
          hasCloseCall = true;
          this._closeCallDetails.push({ meter: name, value: val, shiftId });
        }
      }
      if (hasCloseCall) this.closeCalls++;
      if (won && maxMeterValue <= 50) this.perfectShifts++;
    }

    const chapterId = shiftId ? shiftId.split('-')[0] : null;
    if (chapterId && duration) {
      this.chapterCompletionTimes[chapterId] =
        (this.chapterCompletionTimes[chapterId] || 0) + duration;
    }
  }

  recordDecision(decisionId, choiceIndex, choiceText) {
    this.decisionHistory.push({ decisionId, choiceIndex, choiceText });
  }

  recordEvent(eventId, handled, deferred) {
    if (deferred) {
      this.totalEventsDeferred++;
    } else if (handled) {
      this.totalEventsHandled++;
    } else {
      this.totalEventsIgnored++;
    }
  }

  getOverallGrade() {
    if (this.gradeHistory.length === 0) return 'F';
    const sum = this.gradeHistory.reduce((acc, h) => acc + GRADE_VALUES[h.grade], 0);
    const avg = sum / this.gradeHistory.length;
    const rounded = Math.round(avg);
    return GRADE_ORDER[Math.min(rounded, GRADE_ORDER.length - 1)];
  }

  getChapterSummary(chapterId) {
    const shifts = this.gradeHistory.filter(h => h.shiftId && h.shiftId.startsWith(chapterId + '-'));
    const grades = shifts.map(s => s.grade);
    const wins = shifts.length;
    return {
      chapterId,
      shiftsPlayed: shifts.length,
      grades,
      averageGrade: grades.length
        ? GRADE_ORDER[Math.round(grades.reduce((a, g) => a + GRADE_VALUES[g], 0) / grades.length)]
        : 'F',
      completionTime: this.chapterCompletionTimes[chapterId] || 0,
    };
  }

  getFullSummary() {
    return {
      shiftsPlayed: this.shiftsPlayed,
      shiftsWon: this.shiftsWon,
      shiftsLost: this.shiftsLost,
      winRate: this.shiftsPlayed ? Math.round((this.shiftsWon / this.shiftsPlayed) * 100) : 0,
      overallGrade: this.getOverallGrade(),
      bestGrade: this.bestGrade,
      worstGrade: this.worstGrade,
      longestStreak: this.longestStreak,
      totalPrescriptionsFilled: this.totalPrescriptionsFilled,
      totalPatientsServed: this.totalPatientsServed,
      totalPhoneCallsHandled: this.totalPhoneCallsHandled,
      totalDriveThruServed: this.totalDriveThruServed,
      totalConsultsGiven: this.totalConsultsGiven,
      totalEventsHandled: this.totalEventsHandled,
      totalEventsIgnored: this.totalEventsIgnored,
      totalEventsDeferred: this.totalEventsDeferred,
      closeCalls: this.closeCalls,
      perfectShifts: this.perfectShifts,
      meterPeaks: { ...this.meterPeaks },
      timeSpentPlaying: this.timeSpentPlaying,
      chapterCompletionTimes: { ...this.chapterCompletionTimes },
      flagsEarned: [...this.flagsEarned],
      decisionsCount: this.decisionHistory.length,
      gradeHistory: [...this.gradeHistory],
    };
  }

  getHighlights() {
    const highlights = [];

    if (this.longestStreak >= 2) {
      highlights.push(`Survived ${this.longestStreak} shifts without losing`);
    }
    if (this.totalPrescriptionsFilled > 0) {
      highlights.push(`Filled ${this.totalPrescriptionsFilled} prescriptions`);
    }

    if (this._closeCallDetails.length > 0) {
      const worst = this._closeCallDetails.reduce((a, b) => (b.value > a.value ? b : a));
      highlights.push(`Closest call: ${worst.meter} hit ${worst.value} on ${worst.shiftId}`);
    }

    if (this.gradeHistory.length > 0) {
      const counts = {};
      for (const h of this.gradeHistory) {
        counts[h.grade] = (counts[h.grade] || 0) + 1;
      }
      const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      highlights.push(`Most common grade: ${mostCommon}`);
    }

    if (this.timeSpentPlaying > 0) {
      const hours = (this.timeSpentPlaying / 3600).toFixed(1);
      highlights.push(`Spent ${hours} hours on the bench`);
    }

    if (this.perfectShifts > 0 && highlights.length < 5) {
      highlights.push(`${this.perfectShifts} perfect shift${this.perfectShifts > 1 ? 's' : ''} with all meters under 50`);
    }

    return highlights.slice(0, 5);
  }

  serialize() {
    return JSON.stringify({
      shiftsPlayed: this.shiftsPlayed,
      shiftsWon: this.shiftsWon,
      shiftsLost: this.shiftsLost,
      totalPrescriptionsFilled: this.totalPrescriptionsFilled,
      totalPatientsServed: this.totalPatientsServed,
      totalPhoneCallsHandled: this.totalPhoneCallsHandled,
      totalDriveThruServed: this.totalDriveThruServed,
      totalConsultsGiven: this.totalConsultsGiven,
      totalEventsHandled: this.totalEventsHandled,
      totalEventsIgnored: this.totalEventsIgnored,
      totalEventsDeferred: this.totalEventsDeferred,
      longestStreak: this.longestStreak,
      currentStreak: this.currentStreak,
      bestGrade: this.bestGrade,
      worstGrade: this.worstGrade,
      gradeHistory: this.gradeHistory,
      decisionHistory: this.decisionHistory,
      flagsEarned: this.flagsEarned,
      timeSpentPlaying: this.timeSpentPlaying,
      chapterCompletionTimes: this.chapterCompletionTimes,
      meterPeaks: this.meterPeaks,
      closeCalls: this.closeCalls,
      perfectShifts: this.perfectShifts,
      _closeCallDetails: this._closeCallDetails,
    });
  }

  static deserialize(data) {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const stats = new CampaignStats();
    Object.assign(stats, parsed);
    return stats;
  }
}

module.exports = { CampaignStats };
