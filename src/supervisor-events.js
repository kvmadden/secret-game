/**
 * Supervisor interruption events — fired mid-shift based on the
 * field leader archetype assigned to the current store/chapter.
 * Each leader type maps to 6-8 event objects that act as cognitive-load
 * interruptions layered on top of normal pharmacy events.
 */

function evt(id, title, desc, station, duration, effects, ignoreEffects, canDefer, leaderType) {
  return { id, title, desc, station, duration, effects, ignoreEffects, canDefer, leaderType };
}

// ── Cheerleader ────────────────────────────────────────────────────
const cheerleader = [
  evt('cheerleader_checkin', 'FRIENDLY CHECK-IN',
    'Your leader stops by to say hi! You lose focus mid-count.',
    'consult', 5, { burnout: 3, queue: -2 }, { burnout: 2 }, false, 'cheerleader'),
  evt('cheerleader_pep_talk', 'IMPROMPTU PEP TALK',
    'Impromptu pep talk in the middle of a rush. Smile and nod.',
    'consult', 8, { burnout: 5, queue: -4, rage: -3 }, { burnout: 2, rage: 3 }, false, 'cheerleader'),
  evt('cheerleader_photo_op', 'TEAM PHOTO',
    'Can we get a quick team photo for the newsletter?',
    'consult', 6, { burnout: 4, queue: -3, reputation: 2 }, { reputation: -2, burnout: 1 }, true, 'cheerleader'),
  evt('cheerleader_feedback', 'POSITIVE REVIEW',
    'I wrote you a really positive review! Let me read it to you.',
    'consult', 7, { reputation: 4, burnout: 3, queue: -3 }, { reputation: -1 }, true, 'cheerleader'),
  evt('cheerleader_snack_run', 'SNACK DELIVERY',
    'Brought donuts! Everyone stops to grab one.',
    'consult', 5, { burnout: -2, queue: -3, rage: -2 }, { burnout: 1 }, false, 'cheerleader'),
  evt('cheerleader_huddle', 'QUICK HUDDLE',
    'Five-minute huddle! Right now. In the middle of everything.',
    'consult', 9, { burnout: 6, queue: -5, teamStrength: 2 }, { teamStrength: -2, burnout: 3 }, true, 'cheerleader'),
];

// ── Ghost ──────────────────────────────────────────────────────────
const ghost = [
  evt('ghost_voicemail', 'MISSED CALL',
    'Missed call from your leader. No message left.',
    'phone', 4, { scrutiny: 3, burnout: 2 }, { scrutiny: 2 }, false, 'ghost'),
  evt('ghost_late_text', 'DELAYED TEXT',
    "Text from leader 3 hours after your question: 'Let me look into that.'",
    'phone', 4, { burnout: 3, scrutiny: 2 }, { burnout: 1 }, false, 'ghost'),
  evt('ghost_surprise_appearance', 'SURPRISE VISIT',
    'Leader randomly shows up, looks around, leaves without a word.',
    'consult', 6, { scrutiny: 5, burnout: 4 }, { scrutiny: 4 }, false, 'ghost'),
  evt('ghost_email_silence', 'READ RECEIPT',
    'Your urgent email was opened 2 hours ago. No reply.',
    'phone', 4, { burnout: 3, scrutiny: 2 }, { scrutiny: 1 }, false, 'ghost'),
  evt('ghost_policy_vacuum', 'NO GUIDANCE',
    'New corporate memo. Your leader has not acknowledged it exists.',
    'consult', 5, { scrutiny: 4, burnout: 3, storeReadiness: -2 }, { scrutiny: 3 }, true, 'ghost'),
  evt('ghost_schedule_gap', 'SCHEDULE MYSTERY',
    "Next week's schedule still blank. You text. No answer.",
    'phone', 5, { burnout: 4, teamStrength: -2 }, { burnout: 2 }, true, 'ghost'),
];

// ── Fake Helper ────────────────────────────────────────────────────
const fake_helper = [
  evt('fake_helper_offer', 'HELPFUL OFFER',
    'Need anything? Also, can you pull these reports while I watch?',
    'consult', 7, { burnout: 5, queue: -3 }, { burnout: 3, scrutiny: 2 }, false, 'fake_helper'),
  evt('fake_helper_observe', 'WORKFLOW AUDIT',
    "I'm just going to watch your workflow for a bit. Carry on.",
    'consult', 8, { burnout: 6, scrutiny: 4 }, { scrutiny: 3 }, false, 'fake_helper'),
  evt('fake_helper_suggest', 'BENCH REORGANIZE',
    'Have you tried reorganizing your bench? Let me show you my way.',
    'consult', 9, { burnout: 7, queue: -4, storeReadiness: -2 }, { burnout: 4, storeReadiness: -3 }, true, 'fake_helper'),
  evt('fake_helper_delegate', 'DELEGATION REVERSAL',
    "Since I'm here, I'll take care of... actually, you handle it.",
    'consult', 6, { burnout: 5, queue: -3, rage: -2 }, { burnout: 3 }, false, 'fake_helper'),
  evt('fake_helper_credit', 'IDEA APPROPRIATION',
    'I told regional about that process improvement. They loved my idea.',
    'phone', 5, { burnout: 4, reputation: -3 }, { burnout: 2 }, false, 'fake_helper'),
  evt('fake_helper_cc', 'CC AVALANCHE',
    "Leader CC'd you on 14 emails. None require your input.",
    'phone', 6, { burnout: 4, queue: -2 }, { burnout: 2 }, true, 'fake_helper'),
];

// ── Rescuer / User ─────────────────────────────────────────────────
const rescuer_user = [
  evt('rescuer_extra_ask', 'ONE MORE THING',
    'One more thing — can you call this patient back real quick?',
    'phone', 7, { burnout: 5, queue: -3 }, { burnout: 3, rage: 3 }, true, 'rescuer_user'),
  evt('rescuer_praise_burden', 'PRAISE BURDEN',
    "You're so good at this — I'm sending the new hires to shadow you.",
    'consult', 8, { burnout: 6, queue: -4, reputation: 3 }, { reputation: -2, burnout: 3 }, false, 'rescuer_user'),
  evt('rescuer_trust_dump', 'SENSITIVE TASK',
    'I need you to handle something sensitive. No one else can.',
    'consult', 10, { burnout: 7, scrutiny: 4, queue: -5 }, { scrutiny: 5, burnout: 4 }, false, 'rescuer_user'),
  evt('rescuer_after_hours', 'AFTER-HOURS TEXT',
    'Text at 9 PM: "Quick question about tomorrow\'s schedule..."',
    'phone', 5, { burnout: 5, rage: -2 }, { burnout: 2 }, true, 'rescuer_user'),
  evt('rescuer_guilt_trip', 'GUILT LEVERAGE',
    'I covered for you last month. Could you stay an extra hour?',
    'consult', 6, { burnout: 6, queue: -2 }, { burnout: 4, teamStrength: -2 }, true, 'rescuer_user'),
  evt('rescuer_savior_swoop', 'SAVIOR SWOOP',
    'Leader "fixes" a situation you had under control. Takes credit.',
    'consult', 7, { burnout: 4, reputation: -3, rage: -2 }, { burnout: 2 }, false, 'rescuer_user'),
];

// ── Metrics Hawk ───────────────────────────────────────────────────
const metrics_hawk = [
  evt('metrics_update', 'WAIT TIME ALERT',
    "Your wait time just hit 18 minutes. What's the plan?",
    'phone', 5, { burnout: 4, scrutiny: 4 }, { scrutiny: 5 }, false, 'metrics_hawk'),
  evt('metrics_dashboard', 'LIVE DASHBOARD',
    "I'm sharing the real-time dashboard with you. Check it often.",
    'phone', 6, { burnout: 5, scrutiny: 3, queue: -2 }, { scrutiny: 4 }, true, 'metrics_hawk'),
  evt('metrics_comparison', 'STORE COMPARISON',
    "Store 42 is averaging 12 minutes. You're at 16.",
    'phone', 5, { burnout: 5, scrutiny: 5 }, { scrutiny: 4, burnout: 2 }, false, 'metrics_hawk'),
  evt('metrics_vaccine_push', 'VACCINE TARGET',
    'We need 8 more vaccines today to hit target. Make it happen.',
    'consult', 7, { burnout: 6, queue: -4, scrutiny: 3 }, { scrutiny: 5, burnout: 3 }, true, 'metrics_hawk'),
  evt('metrics_call_volume', 'CALL VOLUME CHECK',
    'Your outbound calls are down 30% this week. Explain.',
    'phone', 6, { burnout: 5, scrutiny: 5 }, { scrutiny: 6 }, false, 'metrics_hawk'),
  evt('metrics_nps_score', 'NPS REMINDER',
    'NPS dropped 4 points. Remind every patient about the survey.',
    'consult', 5, { burnout: 4, scrutiny: 3, queue: -2 }, { scrutiny: 3, reputation: -2 }, true, 'metrics_hawk'),
  evt('metrics_script_count', 'SCRIPT COUNT',
    "We're 40 scripts behind yesterday's pace. Pick it up.",
    'phone', 4, { burnout: 5, scrutiny: 4 }, { scrutiny: 5, burnout: 3 }, false, 'metrics_hawk'),
];

// ── Polished Visitor ───────────────────────────────────────────────
const polished_visitor = [
  evt('visitor_walkthrough', 'REGIONAL WALKTHROUGH',
    'Regional is doing a walkthrough in 20 minutes. Look alive.',
    'consult', 8, { burnout: 6, scrutiny: 5, queue: -4 }, { scrutiny: 6, reputation: -3 }, false, 'polished_visitor'),
  evt('visitor_presentation', 'PROCESS SUMMARY',
    'Can you prep a quick summary of your process? For the visit.',
    'consult', 9, { burnout: 7, queue: -5 }, { scrutiny: 4, reputation: -2 }, true, 'polished_visitor'),
  evt('visitor_image', 'APPEARANCE CHECK',
    'Make sure the waiting area looks presentable. Now.',
    'consult', 7, { burnout: 5, queue: -3, storeReadiness: 3 }, { storeReadiness: -3, scrutiny: 3 }, true, 'polished_visitor'),
  evt('visitor_talking_points', 'TALKING POINTS',
    'Here are the approved talking points. Memorize before they arrive.',
    'consult', 7, { burnout: 6, queue: -3, scrutiny: 3 }, { scrutiny: 5 }, true, 'polished_visitor'),
  evt('visitor_hide_issues', 'SWEEP IT UNDER',
    "Don't mention the staffing shortage. Focus on wins.",
    'consult', 5, { burnout: 4, scrutiny: 3, clinicalIntegrity: -2 }, { scrutiny: 4 }, false, 'polished_visitor'),
  evt('visitor_debrief', 'POST-VISIT DEBRIEF',
    'They noticed the expired signage. We need to talk.',
    'consult', 8, { burnout: 5, scrutiny: 5, reputation: -2 }, { scrutiny: 3, burnout: 2 }, false, 'polished_visitor'),
];

// ── Export ──────────────────────────────────────────────────────────
export const SUPERVISOR_EVENTS = Object.freeze({
  cheerleader,
  ghost,
  fake_helper,
  rescuer_user,
  metrics_hawk,
  polished_visitor,
});
