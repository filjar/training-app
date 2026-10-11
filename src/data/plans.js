// Curated training plans. Each plan is a short rotation of sessions ("slots")
// with a hand-picked exercise list; the user only chooses the plan, how many
// days a week, a goal and which weekdays. Everything generated from here is a
// normal workout afterwards, so it can still be edited freely.

// weekdays: 0 = Monday … 6 = Sunday
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Goal → position on the Strength(0)..Endurance(1) scale used for reps/sets.
export const GOALS = [
  { id: 'strength', label: 'Strength', t: 0.15, blurb: 'Heavier weights, fewer reps' },
  { id: 'balanced', label: 'Balanced', t: 0.5, blurb: 'A mix of size and strength' },
  { id: 'endurance', label: 'Endurance', t: 0.9, blurb: 'Lighter weights, more reps' },
];

export const PLAN_TEMPLATES = [
  {
    id: 'full-body',
    name: 'Full Body',
    blurb: 'Every session trains the whole body. The simplest way to start and easy to keep up with a busy week.',
    bestFor: 'Beginners, or 2–3 days a week',
    dayOptions: { 2: [0, 3], 3: [0, 2, 4] },
    defaultDays: 3,
    slots: [
      { key: 'a', label: 'Full Body A', exercises: ['back-squat', 'bench-press', 'barbell-row', 'overhead-press', 'romanian-deadlift', 'plank'] },
      { key: 'b', label: 'Full Body B', exercises: ['deadlift', 'incline-db-press', 'lat-pulldown', 'walking-lunge', 'lateral-raise', 'hanging-leg-raise'] },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    blurb: 'Two upper-body and two lower-body sessions a week, so each muscle is trained twice with more work per session.',
    bestFor: '4 days a week',
    dayOptions: { 4: [0, 1, 3, 4] },
    defaultDays: 4,
    slots: [
      { key: 'upper-a', label: 'Upper A', exercises: ['bench-press', 'barbell-row', 'overhead-press', 'lat-pulldown', 'biceps-curl', 'triceps-pushdown'] },
      { key: 'lower-a', label: 'Lower A', exercises: ['back-squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'standing-calf-raise', 'plank'] },
      { key: 'upper-b', label: 'Upper B', exercises: ['incline-db-press', 'seated-cable-row', 'arnold-press', 'chest-fly', 'face-pull', 'hammer-curl', 'skull-crusher'] },
      { key: 'lower-b', label: 'Lower B', exercises: ['deadlift', 'goblet-squat', 'hip-thrust', 'leg-extension', 'seated-calf-raise', 'hanging-leg-raise'] },
    ],
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    blurb: 'Pushing muscles one day, pulling muscles the next, then legs. Run it once a week, or twice for a high-volume week.',
    bestFor: '3 or 6 days a week',
    dayOptions: { 3: [0, 2, 4], 6: [0, 1, 2, 3, 4, 5] },
    defaultDays: 3,
    slots: [
      { key: 'push', label: 'Push', exercises: ['bench-press', 'overhead-press', 'incline-db-press', 'lateral-raise', 'chest-fly', 'triceps-pushdown'] },
      { key: 'pull', label: 'Pull', exercises: ['barbell-row', 'lat-pulldown', 'seated-cable-row', 'face-pull', 'biceps-curl', 'hammer-curl'] },
      { key: 'legs', label: 'Legs', exercises: ['back-squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'hip-thrust', 'standing-calf-raise'] },
    ],
  },
];

export const planTemplateById = Object.fromEntries(PLAN_TEMPLATES.map((p) => [p.id, p]));
