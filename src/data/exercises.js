// Seed exercise database.
// defaultWeight is an assumed load (kg) for an average user at ~10 reps; 0 = bodyweight.
// strength/endurance define the reps+sets ends of the generator slider.

export const MUSCLE_GROUPS = [
  'Chest', 'Shoulders', 'Traps', 'Biceps', 'Triceps', 'Forearms',
  'Abs', 'Obliques', 'Lats', 'Lower Back',
  'Glutes', 'Quads', 'Hamstrings', 'Calves',
];

export const EXERCISES = [
  // Chest
  {
    id: 'bench-press', name: 'Bench Press', group: 'Chest',
    primary: ['Chest'], secondary: ['Triceps', 'Shoulders'],
    instruction: 'Lie on a flat bench, grip the bar slightly wider than shoulder width, lower it to mid-chest and press back up without locking out hard.',
    defaultWeight: 40, strength: { reps: 5, sets: 5 }, endurance: { reps: 12, sets: 6 },
  },
  {
    id: 'incline-db-press', name: 'Incline Dumbbell Press', group: 'Chest',
    primary: ['Chest'], secondary: ['Shoulders', 'Triceps'],
    instruction: 'On a 30–45° incline bench, press two dumbbells from shoulder level to above your chest, keeping elbows at ~45° from your torso.',
    defaultWeight: 14, strength: { reps: 6, sets: 4 }, endurance: { reps: 12, sets: 5 },
  },
  {
    id: 'chest-fly', name: 'Chest Fly', group: 'Chest',
    primary: ['Chest'], secondary: ['Shoulders'],
    instruction: 'With dumbbells or cables, open your arms wide with a slight elbow bend and bring them together in front of your chest in an arc.',
    defaultWeight: 10, strength: { reps: 8, sets: 3 }, endurance: { reps: 15, sets: 4 },
  },
  {
    id: 'push-up', name: 'Push-up', group: 'Chest',
    primary: ['Chest'], secondary: ['Triceps', 'Shoulders', 'Abs'],
    instruction: 'In a straight plank, hands under shoulders, lower your chest to just above the floor and push back up. Keep hips in line with shoulders.',
    defaultWeight: 0, strength: { reps: 8, sets: 4 }, endurance: { reps: 20, sets: 5 },
  },

  // Shoulders
  {
    id: 'overhead-press', name: 'Overhead Press', group: 'Shoulders',
    primary: ['Shoulders'], secondary: ['Triceps', 'Traps'],
    instruction: 'Standing, press a barbell from the front of your shoulders to overhead. Squeeze glutes and keep ribs down to avoid arching.',
    defaultWeight: 25, strength: { reps: 5, sets: 5 }, endurance: { reps: 12, sets: 5 },
  },
  {
    id: 'lateral-raise', name: 'Lateral Raise', group: 'Shoulders',
    primary: ['Shoulders'], secondary: ['Traps'],
    instruction: 'With light dumbbells, raise your arms out to the sides to shoulder height with a slight elbow bend, then lower slowly.',
    defaultWeight: 6, strength: { reps: 8, sets: 3 }, endurance: { reps: 20, sets: 5 },
  },
  {
    id: 'shoulder-fly', name: 'Rear Delt Fly', group: 'Shoulders',
    primary: ['Shoulders'], secondary: ['Traps', 'Lats'],
    instruction: 'Hinge forward with dumbbells hanging down, raise your arms out to the sides squeezing the rear shoulders and upper back.',
    defaultWeight: 6, strength: { reps: 8, sets: 3 }, endurance: { reps: 20, sets: 5 },
  },
  {
    id: 'arnold-press', name: 'Arnold Press', group: 'Shoulders',
    primary: ['Shoulders'], secondary: ['Triceps'],
    instruction: 'Start with dumbbells in front of your shoulders, palms facing you. Rotate palms outward as you press overhead.',
    defaultWeight: 10, strength: { reps: 6, sets: 4 }, endurance: { reps: 12, sets: 5 },
  },

  // Traps
  {
    id: 'shrug', name: 'Dumbbell Shrug', group: 'Traps',
    primary: ['Traps'], secondary: ['Forearms'],
    instruction: 'Hold heavy dumbbells at your sides and shrug your shoulders straight up toward your ears, pause, and lower slowly.',
    defaultWeight: 20, strength: { reps: 8, sets: 4 }, endurance: { reps: 15, sets: 4 },
  },
  {
    id: 'face-pull', name: 'Face Pull', group: 'Traps',
    primary: ['Traps'], secondary: ['Shoulders', 'Lats'],
    instruction: 'With a rope at face height, pull it toward your face while spreading the rope ends apart and squeezing your shoulder blades.',
    defaultWeight: 15, strength: { reps: 10, sets: 3 }, endurance: { reps: 18, sets: 4 },
  },

  // Biceps
  {
    id: 'biceps-curl', name: 'Biceps Curl', group: 'Biceps',
    primary: ['Biceps'], secondary: ['Forearms'],
    instruction: 'With dumbbells or a barbell, curl the weight up while keeping elbows pinned to your sides. Lower under control.',
    defaultWeight: 10, strength: { reps: 6, sets: 4 }, endurance: { reps: 15, sets: 4 },
  },
  {
    id: 'hammer-curl', name: 'Hammer Curl', group: 'Biceps',
    primary: ['Biceps'], secondary: ['Forearms'],
    instruction: 'Curl dumbbells with a neutral (thumbs-up) grip, keeping wrists straight and elbows close to the body.',
    defaultWeight: 10, strength: { reps: 6, sets: 4 }, endurance: { reps: 15, sets: 4 },
  },
  {
    id: 'chin-up', name: 'Chin-up', group: 'Biceps',
    primary: ['Biceps', 'Lats'], secondary: ['Forearms', 'Abs'],
    instruction: 'Hang from a bar with an underhand grip and pull your chin over the bar. Lower all the way down between reps.',
    defaultWeight: 0, strength: { reps: 5, sets: 4 }, endurance: { reps: 10, sets: 5 },
  },

  // Triceps
  {
    id: 'triceps-pushdown', name: 'Triceps Pushdown', group: 'Triceps',
    primary: ['Triceps'], secondary: [],
    instruction: 'At a cable stack, push the handle down until your arms are straight, keeping elbows locked at your sides.',
    defaultWeight: 20, strength: { reps: 8, sets: 4 }, endurance: { reps: 15, sets: 4 },
  },
  {
    id: 'skull-crusher', name: 'Skull Crusher', group: 'Triceps',
    primary: ['Triceps'], secondary: [],
    instruction: 'Lying on a bench, lower an EZ-bar or dumbbells toward your forehead by bending the elbows, then extend back up.',
    defaultWeight: 15, strength: { reps: 8, sets: 4 }, endurance: { reps: 14, sets: 4 },
  },
  {
    id: 'dip', name: 'Dip', group: 'Triceps',
    primary: ['Triceps', 'Chest'], secondary: ['Shoulders'],
    instruction: 'On parallel bars, lower your body until upper arms are parallel to the floor, then press back up. Lean forward to hit more chest.',
    defaultWeight: 0, strength: { reps: 6, sets: 4 }, endurance: { reps: 12, sets: 5 },
  },

  // Forearms
  {
    id: 'wrist-curl', name: 'Wrist Curl', group: 'Forearms',
    primary: ['Forearms'], secondary: [],
    instruction: 'Rest forearms on a bench with wrists hanging off the edge, curl a light bar up and down using only your wrists.',
    defaultWeight: 10, strength: { reps: 10, sets: 3 }, endurance: { reps: 20, sets: 4 },
  },
  {
    id: 'farmers-carry', name: "Farmer's Carry", group: 'Forearms',
    primary: ['Forearms', 'Traps'], secondary: ['Abs', 'Obliques'],
    instruction: 'Pick up two heavy dumbbells and walk tall for 20–40 meters. One "rep" here means ~10 meters of walking.',
    defaultWeight: 24, strength: { reps: 4, sets: 4 }, endurance: { reps: 8, sets: 5 },
  },

  // Abs
  {
    id: 'crunch', name: 'Crunch', group: 'Abs',
    primary: ['Abs'], secondary: [],
    instruction: 'Lying with knees bent, curl your shoulders off the floor toward your knees and lower slowly. Keep lower back on the floor.',
    defaultWeight: 0, strength: { reps: 12, sets: 3 }, endurance: { reps: 25, sets: 4 },
  },
  {
    id: 'plank', name: 'Plank', group: 'Abs',
    primary: ['Abs'], secondary: ['Obliques', 'Lower Back'],
    instruction: 'Hold a straight line from head to heels on forearms and toes. One rep = 10 seconds of holding.',
    defaultWeight: 0, strength: { reps: 4, sets: 3 }, endurance: { reps: 9, sets: 4 },
  },
  {
    id: 'hanging-leg-raise', name: 'Hanging Leg Raise', group: 'Abs',
    primary: ['Abs'], secondary: ['Obliques', 'Forearms'],
    instruction: 'Hanging from a bar, raise your legs (bent or straight) until thighs pass horizontal, then lower without swinging.',
    defaultWeight: 0, strength: { reps: 8, sets: 3 }, endurance: { reps: 15, sets: 4 },
  },

  // Obliques
  {
    id: 'russian-twist', name: 'Russian Twist', group: 'Obliques',
    primary: ['Obliques'], secondary: ['Abs'],
    instruction: 'Seated, leaning back slightly with feet off the floor, rotate a weight from side to side. Left+right = one rep.',
    defaultWeight: 8, strength: { reps: 10, sets: 3 }, endurance: { reps: 20, sets: 4 },
  },
  {
    id: 'side-plank', name: 'Side Plank', group: 'Obliques',
    primary: ['Obliques'], secondary: ['Abs', 'Shoulders'],
    instruction: 'Lie on your side supported on one forearm, lift your hips into a straight line. One rep = 10 seconds per side.',
    defaultWeight: 0, strength: { reps: 3, sets: 3 }, endurance: { reps: 6, sets: 4 },
  },

  // Lats / back
  {
    id: 'pull-up', name: 'Pull-up', group: 'Lats',
    primary: ['Lats'], secondary: ['Biceps', 'Forearms', 'Traps'],
    instruction: 'Hang from a bar with an overhand grip slightly wider than shoulders and pull your chin over the bar.',
    defaultWeight: 0, strength: { reps: 5, sets: 4 }, endurance: { reps: 10, sets: 5 },
  },
  {
    id: 'lat-pulldown', name: 'Lat Pulldown', group: 'Lats',
    primary: ['Lats'], secondary: ['Biceps', 'Traps'],
    instruction: 'Seated at the machine, pull the wide bar down to your upper chest while keeping your torso tall.',
    defaultWeight: 35, strength: { reps: 6, sets: 4 }, endurance: { reps: 14, sets: 5 },
  },
  {
    id: 'barbell-row', name: 'Barbell Row', group: 'Lats',
    primary: ['Lats'], secondary: ['Biceps', 'Traps', 'Lower Back'],
    instruction: 'Hinge to ~45°, pull the bar to your lower ribs and lower under control. Keep your back flat throughout.',
    defaultWeight: 40, strength: { reps: 5, sets: 5 }, endurance: { reps: 12, sets: 5 },
  },
  {
    id: 'seated-cable-row', name: 'Seated Cable Row', group: 'Lats',
    primary: ['Lats'], secondary: ['Biceps', 'Traps'],
    instruction: 'Seated, pull the handle to your stomach, squeezing your shoulder blades together, then let your arms stretch forward.',
    defaultWeight: 35, strength: { reps: 6, sets: 4 }, endurance: { reps: 14, sets: 4 },
  },

  // Lower back
  {
    id: 'deadlift', name: 'Deadlift', group: 'Lower Back',
    primary: ['Lower Back', 'Glutes', 'Hamstrings'], secondary: ['Quads', 'Traps', 'Forearms'],
    instruction: 'With the bar over mid-foot, hinge down with a flat back, grip the bar and stand up by driving through your legs and hips.',
    defaultWeight: 60, strength: { reps: 3, sets: 5 }, endurance: { reps: 10, sets: 4 },
  },
  {
    id: 'back-extension', name: 'Back Extension', group: 'Lower Back',
    primary: ['Lower Back'], secondary: ['Glutes', 'Hamstrings'],
    instruction: 'On a hyperextension bench, hinge down and raise your torso until it is in line with your legs. Avoid over-arching at the top.',
    defaultWeight: 0, strength: { reps: 10, sets: 3 }, endurance: { reps: 18, sets: 4 },
  },

  // Glutes
  {
    id: 'hip-thrust', name: 'Hip Thrust', group: 'Glutes',
    primary: ['Glutes'], secondary: ['Hamstrings', 'Quads'],
    instruction: 'Upper back on a bench, barbell over your hips, drive your hips up until your torso is level. Squeeze hard at the top.',
    defaultWeight: 50, strength: { reps: 6, sets: 4 }, endurance: { reps: 15, sets: 4 },
  },
  {
    id: 'glute-bridge', name: 'Glute Bridge', group: 'Glutes',
    primary: ['Glutes'], secondary: ['Hamstrings', 'Abs'],
    instruction: 'Lying on your back with knees bent, drive hips up to a straight line from knees to shoulders and squeeze the glutes.',
    defaultWeight: 0, strength: { reps: 12, sets: 3 }, endurance: { reps: 20, sets: 4 },
  },
  {
    id: 'walking-lunge', name: 'Walking Lunge', group: 'Glutes',
    primary: ['Glutes', 'Quads'], secondary: ['Hamstrings', 'Calves'],
    instruction: 'Step forward into a lunge until both knees are ~90°, push off and step through to the next lunge. Left+right = one rep.',
    defaultWeight: 10, strength: { reps: 6, sets: 4 }, endurance: { reps: 14, sets: 4 },
  },

  // Quads
  {
    id: 'back-squat', name: 'Back Squat', group: 'Quads',
    primary: ['Quads', 'Glutes'], secondary: ['Hamstrings', 'Lower Back', 'Abs'],
    instruction: 'Bar on your upper back, squat down until thighs are at least parallel while keeping heels down and chest up, then stand.',
    defaultWeight: 50, strength: { reps: 5, sets: 5 }, endurance: { reps: 12, sets: 5 },
  },
  {
    id: 'leg-press', name: 'Leg Press', group: 'Quads',
    primary: ['Quads', 'Glutes'], secondary: ['Hamstrings'],
    instruction: 'In the leg press machine, lower the platform until knees are ~90° and press back up without locking the knees.',
    defaultWeight: 100, strength: { reps: 6, sets: 4 }, endurance: { reps: 15, sets: 4 },
  },
  {
    id: 'leg-extension', name: 'Leg Extension', group: 'Quads',
    primary: ['Quads'], secondary: [],
    instruction: 'Seated in the machine, extend your knees until legs are straight, pause, and lower slowly.',
    defaultWeight: 30, strength: { reps: 8, sets: 3 }, endurance: { reps: 18, sets: 4 },
  },
  {
    id: 'goblet-squat', name: 'Goblet Squat', group: 'Quads',
    primary: ['Quads', 'Glutes'], secondary: ['Abs'],
    instruction: 'Hold a dumbbell vertically against your chest and squat deep, keeping elbows inside your knees at the bottom.',
    defaultWeight: 16, strength: { reps: 8, sets: 4 }, endurance: { reps: 15, sets: 4 },
  },

  // Hamstrings
  {
    id: 'romanian-deadlift', name: 'Romanian Deadlift', group: 'Hamstrings',
    primary: ['Hamstrings', 'Glutes'], secondary: ['Lower Back', 'Forearms'],
    instruction: 'Holding the bar, push your hips back with soft knees until you feel a deep hamstring stretch, then drive hips forward to stand.',
    defaultWeight: 40, strength: { reps: 6, sets: 4 }, endurance: { reps: 12, sets: 4 },
  },
  {
    id: 'leg-curl', name: 'Leg Curl', group: 'Hamstrings',
    primary: ['Hamstrings'], secondary: ['Calves'],
    instruction: 'In the machine, curl your heels toward your glutes, pause, and return slowly.',
    defaultWeight: 25, strength: { reps: 8, sets: 3 }, endurance: { reps: 15, sets: 4 },
  },

  // Calves
  {
    id: 'standing-calf-raise', name: 'Standing Calf Raise', group: 'Calves',
    primary: ['Calves'], secondary: [],
    instruction: 'Standing on a step with heels hanging off, rise as high as possible onto your toes, pause, and lower into a stretch.',
    defaultWeight: 20, strength: { reps: 8, sets: 4 }, endurance: { reps: 20, sets: 4 },
  },
  {
    id: 'seated-calf-raise', name: 'Seated Calf Raise', group: 'Calves',
    primary: ['Calves'], secondary: [],
    instruction: 'Seated with weight on your knees, raise your heels as high as possible and lower slowly through a full range.',
    defaultWeight: 25, strength: { reps: 10, sets: 3 }, endurance: { reps: 20, sets: 4 },
  },
];

export const exerciseById = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
