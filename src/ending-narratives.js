// ending-narratives.js - Campaign ending prose for each of 6 ending lanes

export const ENDING_NARRATIVES = {
  builder: {
    id: 'builder',
    title: 'THE BUILDER',
    subtitle: 'You built something real.',
    tone: 'bittersweet_hopeful',
    gradeModifier: 0.5,
    paragraphs: [
      'It didn\'t happen all at once. One tech learned to triage the phone calls without asking. Another started catching interaction flags before they printed. Somewhere along the way, the team stopped being a group of people who happened to share a schedule and became something that actually worked.',
      'You built that. Not with speeches or mission statements, but by showing up and giving a damn when it would have been easier not to. By staying late to walk a new hire through the count-back process instead of just fixing it yourself. By trusting people with responsibility before they thought they were ready.',
      'The morning you watched your lead tech handle a confused elderly patient, an angry insurance call, and a vaccine walk-in simultaneously without breaking stride, you felt something you hadn\'t expected. Not pride exactly. Relief. The store could run without you white-knuckling every shift.',
      'Corporate could restructure tomorrow. They probably will. The district manager who approved your staffing request already transferred. The workflow you designed will be replaced by someone else\'s initiative with a different acronym. But the people you trained carry what you gave them into every pharmacy they\'ll ever work in. That part doesn\'t restructure.',
    ],
    epilogueLines: [
      'Store metrics improved 18% year over year. The regional report misspelled your name.',
      'Tech turnover dropped to the lowest in the district. Nobody sent a memo about it.',
      'Three regular patients now ask for you by name at the consultation window.',
      'You got a form-letter thank you from corporate. Your team got you a card they all signed.',
    ],
  },

  climber: {
    id: 'climber',
    title: 'THE CLIMBER',
    subtitle: 'The ladder keeps going.',
    tone: 'ambitious_uncertain',
    gradeModifier: 0.3,
    paragraphs: [
      'The district role came with a company car and a laptop bag you\'d never have bought yourself. The first week, you drove to six stores in four days and sat through two conference calls where people used the word "bandwidth" without irony. You took notes. You learned the acronyms. You wore the lanyard.',
      'The further you got from the bench, the harder it was to remember the weight of it. Standing for ten hours. The printer jamming during a rush. The specific panic of a DEA audit with three prescriptions you couldn\'t reconcile. From the district office, those problems became line items. Metrics. Trending arrows on a dashboard.',
      'You solved problems now, or at least you managed them. Staffing gaps became spreadsheet formulas. Patient complaints became incident reports. You weren\'t sure when you stopped thinking about the people behind the numbers, or if you had. Maybe you were just more efficient about it. Maybe that was the same thing.',
      'At the regional meeting, someone asked what you missed about working in the store. You said the patients. It was mostly true. What you actually missed was the clarity. On the bench, you always knew if you\'d done a good job. Up here, you weren\'t sure anyone did.',
    ],
    epilogueLines: [
      'Promoted to district manager within fourteen months. The title looked good on paper.',
      'Travel increased to four days a week. Your pharmacy license renewal felt like a formality.',
      'You mentored two pharmacists into management. Both thanked you. One meant it.',
      'Some nights, driving between stores, you missed the simple math of pills and labels.',
    ],
  },

  escape: {
    id: 'escape',
    title: 'THE ESCAPE',
    subtitle: 'You got out. Not everyone does.',
    tone: 'relieved_melancholy',
    gradeModifier: 0.4,
    paragraphs: [
      'The last day felt different because you let it. Every other closing shift was just the thing before the next opening shift. This one had an edge to it. You counted the drawer slowly. Wiped down the counter one extra time. Locked the gate and stood there for a second longer than you needed to.',
      'Walking out, you passed the drive-through window and the dumpster where you\'d eaten lunch more times than you wanted to count. The parking lot was mostly empty. Your car was where it always was. Everything looked the same, but you were carrying something lighter and heavier at once. Relief and guilt make a strange cocktail.',
      'You thought about the people still inside. The tech who\'d been there nine years and couldn\'t afford to leave. The new grad who still thought it would get better. The patients who\'d come to the window next week and hear someone else say your name wrong. You didn\'t owe them your whole life. You knew that. Knowing it and feeling it were different projects.',
      'The drive home was fifteen minutes. You\'d made it a thousand times. This time you didn\'t think about tomorrow\'s queue or the prior auth you\'d left pending. The silence in the car was enormous. Not peaceful yet. Just empty. The kind of empty that might become something else if you gave it enough time.',
    ],
    epilogueLines: [
      'Found work in a smaller setting. The pace felt wrong for months, then it felt right.',
      'Sometimes dreamed about the pharmacy. Always the same dream: the queue is full and you can\'t find the labels.',
      'Never regretted leaving. Occasionally regretted that leaving was necessary.',
      'Still flinched at phantom phone rings for almost a year.',
    ],
  },

  quiet_pro: {
    id: 'quiet_pro',
    title: 'THE QUIET PROFESSIONAL',
    subtitle: 'You never made a scene. You just did the work.',
    tone: 'steady_dignified',
    gradeModifier: 0.6,
    paragraphs: [
      'You didn\'t climb. You didn\'t burn out. You didn\'t escape. You stayed at the bench and did the work, and there\'s a version of that story that sounds like settling. This isn\'t that version.',
      'Consistency is invisible until it\'s gone. You were the reason the insulin patient always got her copay card applied without asking. The reason the controlled substance counts reconciled every single night. The reason new techs learned to do things right instead of just fast. None of that showed up on a performance review. All of it showed up in the pharmacy.',
      'Patients trusted you the way people trust gravity. Not with gratitude, not with fanfare, but with the quiet assumption that you would be there and you would not be wrong. Mrs. Kessler drove past two closer pharmacies to get to yours. The group home called ahead to make sure you were working. That kind of trust isn\'t given. It\'s accrued.',
      'There was dignity in it. Real dignity, not the kind people talk about in graduation speeches. The dignity of showing up every day and choosing to care about the details when nobody was watching. Of being excellent at something the world had decided wasn\'t worth being excellent at.',
      'You knew what you were. Not a hero. Not a martyr. A pharmacist. The word used to mean something specific, and in your hands, it still did.',
    ],
    epilogueLines: [
      'Still at the same bench. The tile by the register is worn in the shape of your shoes.',
      'Respected by everyone who worked with you. Promoted by no one.',
      'Patients brought cookies at Christmas. A few brought cards. One brought a framed photo of her grandkid you\'d asked about.',
      'New pharmacists asked for your advice. You gave it. Most of them listened.',
    ],
  },

  burnout_end: {
    id: 'burnout_end',
    title: 'BURNED OUT',
    subtitle: 'You stared at the ceiling one morning and didn\'t get up.',
    tone: 'heavy_honest',
    gradeModifier: 0.0,
    paragraphs: [
      'It wasn\'t one thing. That\'s what people don\'t understand. They want the story where one terrible shift breaks you, where there\'s a clear before and after. But it was Tuesday. Nothing special about it. The alarm went off and you looked at the ceiling and the thought of standing behind that counter made your chest feel like concrete.',
      'You\'d been absorbing damage for months. Maybe longer. The skipped lunches compounded. The extra shifts covered. The insurance calls where you advocated for patients who\'d never know. The error you almost made at hour eleven that nobody caught because you caught it yourself, shaking, in the parking lot afterward. Each one small. Each one taking something that didn\'t grow back.',
      'The hardest part wasn\'t admitting you couldn\'t do it anymore. The hardest part was admitting that being strong wasn\'t a strategy. You\'d built your identity around being the one who could handle it, and the job had taken that from you the way it takes everything: gradually, without acknowledgment, while asking for more.',
      'You called in. Then you called in again. Then you sat in a doctor\'s office and said words out loud that you\'d been thinking for months, and the doctor nodded like you were the fourth pharmacist that week. You probably were.',
      'It wasn\'t dramatic. Burnout never is. It\'s just the moment when the math stops working and you realize you\'ve been running a deficit for longer than you knew.',
    ],
    epilogueLines: [
      'Took medical leave. The store filled your position in two weeks. The schedule didn\'t blink.',
      'Recovery was slow and nonlinear. Some weeks felt like progress. Some didn\'t.',
      'Eventually found something smaller. Lower volume. Fewer hours. It wasn\'t exciting. It was enough.',
      'The ceiling doesn\'t scare you anymore. Most mornings.',
    ],
  },

  martyr: {
    id: 'martyr',
    title: 'THE MARTYR',
    subtitle: 'You gave everything. They took it.',
    tone: 'tragic_proud',
    gradeModifier: 0.1,
    paragraphs: [
      'Your standards never slipped. That was the thing about you. Every prescription verified twice. Every counseling session given the full minute. Every interaction flag chased to resolution. The metrics people wanted you to cut corners, and you smiled and didn\'t, and they put you on a performance improvement plan for throughput while your error rate was the lowest in the region.',
      'You gave the job your back, your evenings, your patience, and most of your thirties. In return, it gave you a laminated badge and the quiet understanding that you were replaceable. Not because you weren\'t good. Because the system wasn\'t built to value what you were good at. It was built to fill prescriptions, and you insisted on caring for patients. That was your sin.',
      'The body kept a more honest ledger than the mind. Your knees remembered every twelve-hour shift. Your shoulders remembered every flu season. Your sleep remembered every call from the overnight tech who couldn\'t reach the on-call doctor. You\'d given the job your health as a down payment on something that was never for sale.',
      'This is the saddest ending because you did everything right. You were competent and compassionate and consistent. In a different system, that would have been enough. In this one, it was exactly what they used up.',
      'Your reputation walked out the door with you, intact and gleaming. Your body and your spirit followed at a slower pace.',
    ],
    epilogueLines: [
      'Colleagues remembered you as the best pharmacist they\'d ever worked with. They meant it.',
      'Patients still asked about you months later. The new pharmacist didn\'t know what to tell them.',
      'The system didn\'t change. It never does. It just finds new people.',
      'You changed. You had to. There wasn\'t enough left of the old version to keep.',
    ],
  },
};
