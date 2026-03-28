// Campaign Tutorial - Chapter 1: Shadow Day
// The mentor pharmacist guides you through your first shift.

export const MENTOR_BARKS = [
  "You're doing fine.",
  "Watch the safety meter.",
  "That one can wait.",
  "Good catch on the dose.",
  "Phone first — they've been holding.",
  "Don't rush the verify. Ever.",
  "Deep breath. You've got this.",
  "Check the name twice. Always twice.",
  "Nice. You're getting the rhythm.",
  "Prioritize the angry ones before they escalate.",
  "The drive-thru can wait ten seconds. The phone can't.",
  "You'll get faster. Everyone does.",
  "That consult was textbook. Well done.",
  "Keep an eye on wait times.",
  "Nobody died. That's a good day.",
  "Lunch is coming. Clear what you can.",
  "Afternoon rush hits different. Stay sharp.",
  "If you're not sure, ask. That's not weakness.",
  "One thing at a time. That's the secret.",
  "End of shift. You earned this one."
];

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'The Bench',
    mentorDialogue: "First things first — this is the bench. Everything flows through here. Scripts in, pills out, patients happy. Hopefully.",
    instruction: "Look around the pharmacy. Click the bench to continue.",
    trigger: 'click_bench',
    highlightElement: 'bench'
  },
  {
    id: 'verify_station',
    title: 'Verification',
    mentorDialogue: "Scripts come in here. Check the name, the drug, the dose. Every time. I don't care if it's the hundredth script today — you check.",
    instruction: "Verify the incoming prescription. Match the patient name, drug, and dosage.",
    trigger: 'complete_verify',
    highlightElement: 'station-verify'
  },
  {
    id: 'pickup_station',
    title: 'Pickup Window',
    mentorDialogue: "Patient's waiting. Match the name, hand it over. Smile if you can manage it.",
    instruction: "Complete the pickup by matching the prescription to the waiting patient.",
    trigger: 'complete_pickup',
    highlightElement: 'station-pickup'
  },
  {
    id: 'phone_station',
    title: 'Phone Calls',
    mentorDialogue: "Phone's ringing. Answer it or it'll ring forever. Trust me, I've tested that theory.",
    instruction: "Answer the phone and handle the caller's request.",
    trigger: 'complete_phone',
    highlightElement: 'station-phone'
  },
  {
    id: 'consult_station',
    title: 'Consultations',
    mentorDialogue: "Someone needs advice. That's what the degree is for. Listen first, then answer.",
    instruction: "Speak with the patient and provide a consultation.",
    trigger: 'complete_consult',
    highlightElement: 'station-consult'
  },
  {
    id: 'drive_thru',
    title: 'Drive-Thru',
    mentorDialogue: "Drive-thru. Same work, different window. They're in a car, not in a hurry — even if they think they are.",
    instruction: "Handle the drive-thru customer just like a regular pickup.",
    trigger: 'complete_drive_thru',
    highlightElement: 'station-drive-thru'
  },
  {
    id: 'meters_intro',
    title: 'The Meters',
    mentorDialogue: "See these meters? They're everything. Safety, wait time, phone queue, customer mood, drive-thru backup. Let any one hit the top and it's over. Not figuratively.",
    instruction: "Review the five meters on the HUD. Keep them all under control.",
    trigger: 'acknowledge_meters',
    highlightElement: 'meters-panel'
  },
  {
    id: 'defer_cards',
    title: 'Deferring Tasks',
    mentorDialogue: "You can't do everything at once. Sometimes you have to make them wait. Drag a card to the defer slot — it buys you time, but the meter still ticks.",
    instruction: "Defer a task card by dragging it to the defer area.",
    trigger: 'defer_card',
    highlightElement: 'defer-slot'
  },
  {
    id: 'priority',
    title: 'Prioritization',
    mentorDialogue: "When everything's on fire, pick the most dangerous thing first. Red border means critical. Yellow means soon. You'll learn the difference fast.",
    instruction: "Handle the highest-priority task before the others.",
    trigger: 'complete_priority_task',
    highlightElement: 'card-priority'
  },
  {
    id: 'lunch_break',
    title: 'Lunch Gate',
    mentorDialogue: "Lunch gate closes at noon. Finish what you're working on — you can't leave a script half-done. After lunch, the queue resets. Small mercy.",
    instruction: "Complete your current tasks before the lunch gate closes.",
    trigger: 'reach_lunch',
    highlightElement: 'clock'
  },
  {
    id: 'phase_change',
    title: 'Afternoon Rush',
    mentorDialogue: "It gets busier after lunch. That's normal. Breathe. The cards come faster but you know the stations now. Use what you've learned.",
    instruction: "Survive the afternoon rush. Events will come faster now.",
    trigger: 'survive_afternoon',
    highlightElement: 'event-queue'
  },
  {
    id: 'shift_end',
    title: 'Shift Complete',
    mentorDialogue: "You made it. Not every day will be this easy. But you showed up, you paid attention, and nobody got hurt. That's the job.",
    instruction: "Review your shift summary.",
    trigger: 'view_summary',
    highlightElement: 'summary-panel'
  }
];

const STEP_HINTS = {
  welcome: "Click on the pharmacy bench in the center of the screen.",
  verify_station: "Read the prescription carefully. Does the name match? Is the dose right?",
  pickup_station: "Find the bag that matches the patient's name at the counter.",
  phone_station: "The phone icon is flashing. Click it before the queue meter rises.",
  consult_station: "The patient has a question mark overhead. Walk over and interact.",
  drive_thru: "The drive-thru window is on the right side. Same process as pickup.",
  meters_intro: "Hover over each meter to see what it tracks. Click to acknowledge.",
  defer_cards: "Grab a low-priority card and drag it down to the defer tray.",
  priority: "Look for the card with a red border. Handle that one first.",
  lunch_break: "The clock is ticking toward noon. Wrap up your current task.",
  phase_change: "Cards are coming faster now. Stay calm, prioritize, defer if needed.",
  shift_end: "The shift is over. Click the summary panel to review your performance."
};

export class CampaignTutorial {
  constructor() {
    this.steps = TUTORIAL_STEPS.map(s => ({ ...s }));
    this.currentStep = 0;
    this.active = false;
    this.mentorName = 'Dr. Chen';
  }

  start() {
    this.active = true;
    this.currentStep = 0;
    return this.getCurrentStep();
  }

  getCurrentStep() {
    if (!this.active || this.currentStep >= this.steps.length) return null;
    return this.steps[this.currentStep];
  }

  advance() {
    if (!this.active) return null;
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.active = false;
      return null;
    }
    return this.getCurrentStep();
  }

  isComplete() {
    return this.currentStep >= this.steps.length;
  }

  getHint() {
    const step = this.getCurrentStep();
    if (!step) return null;
    return {
      stepId: step.id,
      hint: STEP_HINTS[step.id] || step.instruction,
      mentor: this.mentorName
    };
  }

  getMentorBark() {
    const step = this.getCurrentStep();
    if (!step) {
      // Tutorial over — pull from general barks
      return `${this.mentorName}: "${MENTOR_BARKS[Math.floor(Math.random() * MENTOR_BARKS.length)]}"`;
    }
    return `${this.mentorName}: "${step.mentorDialogue}"`;
  }
}
