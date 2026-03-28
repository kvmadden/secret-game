// Chapter 7 ending route selection algorithm for the pharmacy campaign game.

export const LANE_DESCRIPTIONS = {
  builder:   'You invested in your team and store, building something that outlasts you.',
  climber:   'You climbed the ladder, trading comfort for visibility and influence.',
  escape:    'You chose yourself and walked away before the job could take more.',
  quiet_pro: 'You kept your head down, did excellent work, and stayed whole.',
  burnout:   'The weight finally broke you — not from weakness, but from caring too long.',
  martyr:    'You burned bright holding the line, earning respect at great personal cost.',
};

function variance(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

export class RouteAnalysis {
  constructor(state, flags) {
    this.state = state;
    this.flags = flags;
    this._scores = null;
    this._reasons = null;
  }

  calculateScores() {
    if (this._scores) return { ...this._scores };

    const s = this.state;
    const f = this.flags;
    const reasons = {};

    // --- Builder ---
    const builderRaw =
      (s.teamStrength * 0.35) +
      (s.storeReadiness * 0.25) +
      (s.clinicalIntegrity * 0.2) +
      ((100 - s.burnout) * 0.1) +
      (f.protected_team_often ? 10 : 0) +
      (f.trained_new_hire ? 8 : 0);
    reasons.builder = [
      `teamStrength(${s.teamStrength})*0.35`,
      `storeReadiness(${s.storeReadiness})*0.25`,
      `clinicalIntegrity(${s.clinicalIntegrity})*0.2`,
      `lowBurnout(${100 - s.burnout})*0.1`,
      f.protected_team_often ? '+10 protected_team_often' : null,
      f.trained_new_hire ? '+8 trained_new_hire' : null,
    ].filter(Boolean);

    // --- Climber ---
    const climberRaw =
      (s.reputation * 0.3) +
      (s.leadershipAlignment * 0.3) +
      (f.accepted_stretch_role ? 15 : 0) +
      (f.took_manager_role ? 10 : 0) +
      ((100 - s.burnout) * 0.1) +
      (f.backed_down_for_optics ? 5 : 0);
    reasons.climber = [
      `reputation(${s.reputation})*0.3`,
      `leadershipAlignment(${s.leadershipAlignment})*0.3`,
      f.accepted_stretch_role ? '+15 accepted_stretch_role' : null,
      f.took_manager_role ? '+10 took_manager_role' : null,
      `lowBurnout(${100 - s.burnout})*0.1`,
      f.backed_down_for_optics ? '+5 backed_down_for_optics' : null,
    ].filter(Boolean);

    // --- Escape ---
    let escapeRaw =
      (s.burnout * 0.25) +
      ((100 - s.leadershipAlignment) * 0.2) +
      (f.actively_looking_for_exit ? 25 : 0) +
      ((100 - s.reputation) * 0.1) +
      (f.said_yes_often ? -5 : 0);
    // Override: actively_looking_for_exit grants +20 bonus
    if (f.actively_looking_for_exit) escapeRaw += 20;
    reasons.escape = [
      `burnout(${s.burnout})*0.25`,
      `lowAlignment(${100 - s.leadershipAlignment})*0.2`,
      f.actively_looking_for_exit ? '+25 actively_looking_for_exit' : null,
      `lowReputation(${100 - s.reputation})*0.1`,
      f.said_yes_often ? '-5 said_yes_often' : null,
      f.actively_looking_for_exit ? '+20 override bonus (actively_looking_for_exit)' : null,
    ].filter(Boolean);

    // --- Quiet Pro ---
    const stateVals = [
      s.burnout, s.reputation, s.teamStrength,
      s.storeReadiness, s.leadershipAlignment, s.clinicalIntegrity,
    ];
    const balanceBonus = Math.max(0, 20 - (variance(stateVals) / 5));
    const quietProRaw =
      (s.clinicalIntegrity * 0.3) +
      balanceBonus +
      (f.preserved_standards ? 10 : 0);
    reasons.quiet_pro = [
      `clinicalIntegrity(${s.clinicalIntegrity})*0.3`,
      `balanceBonus(${balanceBonus.toFixed(1)})`,
      f.preserved_standards ? '+10 preserved_standards' : null,
    ].filter(Boolean);

    // --- Burnout ---
    let burnoutRaw =
      (s.burnout * 0.5) +
      (f.said_yes_often ? 10 : 0) +
      (f.stayed_late_often ? 10 : 0) +
      ((100 - s.clinicalIntegrity) * 0.1);
    const burnoutEligible = s.burnout > 65;
    if (!burnoutEligible) burnoutRaw = 0;
    reasons.burnout = burnoutEligible
      ? [
          `burnout(${s.burnout})*0.5`,
          f.said_yes_often ? '+10 said_yes_often' : null,
          f.stayed_late_often ? '+10 stayed_late_often' : null,
          `lowIntegrity(${100 - s.clinicalIntegrity})*0.1`,
        ].filter(Boolean)
      : ['ineligible: burnout <= 65'];

    // --- Martyr ---
    let martyrRaw =
      (s.burnout * 0.3) +
      (s.clinicalIntegrity * 0.3) +
      (s.reputation * 0.2) +
      (f.preserved_standards ? 10 : 0);
    const martyrEligible = s.burnout > 60 && s.clinicalIntegrity > 55;
    if (!martyrEligible) martyrRaw = 0;
    reasons.martyr = martyrEligible
      ? [
          `burnout(${s.burnout})*0.3`,
          `clinicalIntegrity(${s.clinicalIntegrity})*0.3`,
          `reputation(${s.reputation})*0.2`,
          f.preserved_standards ? '+10 preserved_standards' : null,
        ].filter(Boolean)
      : [`ineligible: burnout(${s.burnout})>60=${s.burnout > 60}, integrity(${s.clinicalIntegrity})>55=${s.clinicalIntegrity > 55}`];

    this._scores = {
      builder:   clamp(Math.round(builderRaw)),
      climber:   clamp(Math.round(climberRaw)),
      escape:    clamp(Math.round(escapeRaw)),
      quiet_pro: clamp(Math.round(quietProRaw)),
      burnout:   clamp(Math.round(burnoutRaw)),
      martyr:    clamp(Math.round(martyrRaw)),
    };

    // Override: burnout > 80 forces burnout lane unless martyr scores higher
    if (s.burnout > 80) {
      if (!(martyrEligible && this._scores.martyr > this._scores.burnout)) {
        // Force burnout to be the highest by setting it above current max
        const currentMax = Math.max(...Object.values(this._scores));
        if (this._scores.burnout < currentMax) {
          this._scores.burnout = Math.min(100, currentMax + 1);
          reasons.burnout.push('+override: burnout>80 forced to top');
        }
      }
    }

    this._reasons = reasons;
    return { ...this._scores };
  }

  _sorted() {
    const scores = this.calculateScores();
    return Object.entries(scores).sort((a, b) => b[1] - a[1]);
  }

  getPrimaryLane() {
    return this._sorted()[0][0];
  }

  getRunnerUp() {
    return this._sorted()[1][0];
  }

  getAnalysis() {
    this.calculateScores();
    const sorted = this._sorted();
    const lines = sorted.map(([lane, score], i) => {
      const prefix = i === 0 ? '>> ' : '   ';
      const detail = this._reasons[lane].join(', ');
      return `${prefix}${lane}: ${score} [${detail}]`;
    });
    return lines.join('\n');
  }
}

export function selectEndingRoute(state, flags) {
  const analysis = new RouteAnalysis(state, flags);
  const scores = analysis.calculateScores();
  const primary = analysis.getPrimaryLane();
  const runnerUp = analysis.getRunnerUp();

  return {
    laneId:   primary,
    score:    scores[primary],
    runnerUp,
    analysis: analysis.getAnalysis(),
  };
}
