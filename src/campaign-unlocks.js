// campaign-unlocks.js - Unlockable content from campaign progression

export const CAMPAIGN_UNLOCKS = [
  // === Cosmetic Unlocks (8) ===
  { id: 'unlock_scrubs_blue', title: 'Blue Scrubs', description: 'Alternate pharmacist outfit in calming blue.',
    type: 'cosmetic', unlockCondition: { type: 'chapter_complete', value: 1 }, reward: 'Blue scrubs outfit for your pharmacist' },
  { id: 'unlock_scrubs_green', title: 'Green Scrubs', description: 'Surgical green scrubs for a clinical look.',
    type: 'cosmetic', unlockCondition: { type: 'chapter_complete', value: 2 }, reward: 'Green scrubs outfit for your pharmacist' },
  { id: 'unlock_lab_coat_fancy', title: 'Embroidered Lab Coat', description: 'A lab coat with your name stitched in gold thread.',
    type: 'cosmetic', unlockCondition: { type: 's_rank', value: 1 }, reward: 'Embroidered lab coat with gold lettering' },
  { id: 'unlock_name_badge_gold', title: 'Gold Name Badge', description: 'The badge of a Pharmacist-in-Charge.',
    type: 'cosmetic', unlockCondition: { type: 'chapter_complete', value: 5 }, reward: 'Gold PIC name badge accessory' },
  { id: 'unlock_hairstyle_bun', title: 'Hair Bun Style', description: 'A practical updo for long shifts.',
    type: 'cosmetic', unlockCondition: { type: 'played_as_female', value: true }, reward: 'Hair bun hairstyle option' },
  { id: 'unlock_glasses', title: 'Reading Glasses', description: 'For checking those tiny prescription labels.',
    type: 'cosmetic', unlockCondition: { type: 'prescriptions_filled', value: 500 }, reward: 'Reading glasses accessory' },
  { id: 'unlock_stethoscope', title: 'Stethoscope', description: 'A clinical touch for your consultations.',
    type: 'cosmetic', unlockCondition: { type: 'consults_in_shift', value: 10 }, reward: 'Stethoscope accessory' },
  { id: 'unlock_coffee_mug', title: "World's Best Pharmacist Mug", description: 'The ultimate accolade, gifted by your techs.',
    type: 'cosmetic', unlockCondition: { type: 'campaign_complete', value: 1 }, reward: "World's Best Pharmacist coffee mug prop" },

  // === Gameplay Unlocks (6) ===
  { id: 'unlock_speed_fill', title: 'Speed Filling', description: 'Experience pays off. Verification feels automatic now.',
    type: 'gameplay', unlockCondition: { type: 'chapter_complete', value: 3 }, reward: '5% faster prescription verification' },
  { id: 'unlock_phone_headset', title: 'Bluetooth Headset', description: 'Handle calls without leaving your station.',
    type: 'gameplay', unlockCondition: { type: 'chapter_complete', value: 4 }, reward: 'Can handle phone calls while at another station' },
  { id: 'unlock_tech_upgrade', title: 'Trained Technician', description: 'Your tech has leveled up. They can handle more on their own.',
    type: 'gameplay', unlockCondition: { type: 'flag', value: 'trained_new_hire' }, reward: 'Technician handles tasks more independently' },
  { id: 'unlock_drive_speaker', title: 'Better Intercom', description: 'Crystal-clear audio. No more repeating yourself.',
    type: 'gameplay', unlockCondition: { type: 'chapter_complete', value: 2 }, reward: 'Drive-thru events are 1 second shorter' },
  { id: 'unlock_auto_count', title: 'Automatic Counter', description: 'A modern counting tray that does the math for you.',
    type: 'gameplay', unlockCondition: { type: 'shifts_played', value: 50 }, reward: 'Counting tray accuracy bonus' },
  { id: 'unlock_mentor_mode', title: "Dr. Chen's Wisdom", description: 'Your mentor is always just a thought away.',
    type: 'gameplay', unlockCondition: { type: 'chapter_s_rank', value: 1 }, reward: 'Tutorial hints available anytime during gameplay' },

  // === Mode Unlocks (5) ===
  { id: 'unlock_endless_mode', title: 'Endless Mode', description: 'The shifts never stop. How long can you last?',
    type: 'mode', unlockCondition: { type: 'chapter_complete', value: 1 }, reward: 'Endless Mode available from main menu' },
  { id: 'unlock_nightmare_mode', title: 'Nightmare Mode', description: 'Understaffed. Overworked. Corporate is watching.',
    type: 'mode', unlockCondition: { type: 'campaign_complete', value: 1 }, reward: 'Nightmare difficulty mode' },
  { id: 'unlock_speedrun_mode', title: 'Speedrun Mode', description: 'Race through the campaign with a visible timer.',
    type: 'mode', unlockCondition: { type: 'campaign_time_under', value: true }, reward: 'Speedrun Mode with built-in timer and splits' },
  { id: 'unlock_sandbox_mode', title: 'Sandbox Mode', description: 'Your pharmacy, your rules. No pressure.',
    type: 'mode', unlockCondition: { type: 'campaign_complete', value: 2 }, reward: 'Sandbox Mode with full customization' },
  { id: 'unlock_chapter_select', title: 'Chapter Select', description: 'Revisit any chapter at will.',
    type: 'mode', unlockCondition: { type: 'campaign_complete', value: 1 }, reward: 'Chapter Select from campaign menu' },

  // === Info / Lore Unlocks (6) ===
  { id: 'unlock_lore_bench', title: 'The Bench', description: 'A history of the pharmacy workbench, from mortar and pestle to modern counting trays.',
    type: 'info', unlockCondition: { type: 'chapter_complete', value: 1 }, reward: 'Lore entry: The Bench' },
  { id: 'unlock_lore_float', title: 'Float Life', description: 'What it really means to be a floater pharmacist, and why nobody wants to do it.',
    type: 'info', unlockCondition: { type: 'chapter_complete', value: 2 }, reward: 'Lore entry: Float Life' },
  { id: 'unlock_lore_pic', title: 'PIC Explained', description: 'The weight of being Pharmacist-in-Charge. Responsibility, liability, and late nights.',
    type: 'info', unlockCondition: { type: 'chapter_complete', value: 5 }, reward: 'Lore entry: PIC Explained' },
  { id: 'unlock_lore_metrics', title: 'The Scorecard', description: 'How corporate measures pharmacy performance, and why the numbers never tell the whole story.',
    type: 'info', unlockCondition: { type: 'chapter_complete', value: 5 }, reward: 'Lore entry: The Scorecard' },
  { id: 'unlock_lore_endings', title: 'Career Paths', description: 'Every path your career could take, from retail lifer to clinical escape.',
    type: 'info', unlockCondition: { type: 'campaign_complete', value: 1 }, reward: 'Lore entry: Career Paths' },
  { id: 'unlock_lore_overnight', title: 'The Graveyard', description: 'Tales from the overnight shift. The regulars, the emergencies, the silence.',
    type: 'info', unlockCondition: { type: 'flag', value: 'survived_overnight_path' }, reward: 'Lore entry: The Graveyard' },
];

const STORAGE_KEY = 'pharmacy_campaign_unlocks';

export class UnlockManager {
  constructor() {
    this.unlocked = new Set();
    this.sessionUnlocks = [];
    this.deserialize();
  }

  check(conditionType, value) {
    const newlyUnlocked = [];
    for (const unlock of CAMPAIGN_UNLOCKS) {
      if (this.unlocked.has(unlock.id)) continue;
      const cond = unlock.unlockCondition;
      let met = false;
      switch (cond.type) {
        case 'chapter_complete':
        case 'campaign_complete':
        case 'shifts_played':
        case 'prescriptions_filled':
        case 'consults_in_shift':
        case 's_rank':
        case 'chapter_s_rank':
          met = conditionType === cond.type && value >= cond.value;
          break;
        case 'flag':
          met = conditionType === 'flag' && value === cond.value;
          break;
        case 'campaign_time_under':
        case 'played_as_female':
          met = conditionType === cond.type && value === true;
          break;
      }
      if (met) {
        this.unlocked.add(unlock.id);
        this.sessionUnlocks.push(unlock.id);
        newlyUnlocked.push(unlock);
      }
    }
    if (newlyUnlocked.length > 0) this.serialize();
    return newlyUnlocked;
  }

  isUnlocked(unlockId) {
    return this.unlocked.has(unlockId);
  }

  getUnlockedList() {
    return [...this.unlocked];
  }

  getNewUnlocks() {
    return this.sessionUnlocks.map(id => CAMPAIGN_UNLOCKS.find(u => u.id === id)).filter(Boolean);
  }

  serialize() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.unlocked]));
    } catch (e) { /* storage unavailable */ }
  }

  deserialize() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const ids = JSON.parse(data);
        if (Array.isArray(ids)) ids.forEach(id => this.unlocked.add(id));
      }
    } catch (e) { /* storage unavailable or corrupt */ }
  }
}
