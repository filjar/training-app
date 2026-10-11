import { EXERCISES, exerciseById } from '../data/exercises.js';

// Collect all completed sets per exercise from workout history.
export function completedSetsByExercise(history) {
  const map = {};
  for (const session of history) {
    for (const entry of session.entries) {
      for (const set of entry.sets) {
        if (!set.done || !set.reps) continue;
        (map[entry.exerciseId] ??= []).push({ reps: set.reps, weight: set.weight || 0, date: session.date });
      }
    }
  }
  return map;
}

// PR for "at least n reps in one set": the heaviest weight ever lifted for n+ reps.
export function repPRs(sets, targets = [1, 2, 6, 10]) {
  const prs = {};
  for (const n of targets) {
    let best = null;
    for (const s of sets) {
      if (s.reps >= n && s.weight > 0 && (!best || s.weight > best)) best = s.weight;
    }
    prs[n] = best;
  }
  return prs;
}

export function totalWeightLifted(sets) {
  return sets.reduce((sum, s) => sum + s.reps * (s.weight || 0), 0);
}

// Estimated 1-rep max using the Epley formula over all recorded sets.
export function estimate1RM(sets) {
  let best = 0;
  for (const s of sets) {
    if (!s.weight) continue;
    const e = s.reps === 1 ? s.weight : s.weight * (1 + s.reps / 30);
    if (e > best) best = e;
  }
  return best || null;
}

// Popularity of an exercise for this user: share of all their completed sets, 0..1 relative to their most-used exercise.
export function popularityMap(history) {
  const counts = completedSetsByExercise(history);
  let max = 0;
  const map = {};
  for (const [id, sets] of Object.entries(counts)) {
    map[id] = sets.length;
    if (sets.length > max) max = sets.length;
  }
  if (max === 0) return {};
  for (const id of Object.keys(map)) map[id] /= max;
  return map;
}

function roundWeight(w) {
  if (w >= 20) return Math.round(w / 2.5) * 2.5;
  return Math.round(w * 2) / 2;
}

// Pick a weight for targetReps: prefer the user's own PR history (via e1RM), else scale the exercise default.
export function suggestWeight(exercise, targetReps, historySets) {
  if (exercise.defaultWeight === 0) return 0; // bodyweight
  const e1rm = historySets?.length ? estimate1RM(historySets) : null;
  if (e1rm) return roundWeight((e1rm / (1 + targetReps / 30)) * 0.95);
  // defaultWeight is calibrated for ~10 reps
  const defaultE1rm = exercise.defaultWeight * (1 + 10 / 30);
  return roundWeight(defaultE1rm / (1 + targetReps / 30));
}

const lerp = (a, b, t) => a + (b - a) * t;

// One workout entry for an exercise at strength(0)..endurance(1) position t:
// reps/sets interpolate between the exercise's two ends, weight comes from history.
export function prescribe(ex, t, setsBy) {
  const reps = Math.round(lerp(ex.strength.reps, ex.endurance.reps, t));
  const nSets = Math.round(lerp(ex.strength.sets, ex.endurance.sets, t));
  const weight = suggestWeight(ex, reps, setsBy[ex.id]);
  return {
    exerciseId: ex.id,
    rest: Math.round(lerp(150, 60, t) / 15) * 15,
    sets: Array.from({ length: nSets }, () => ({ reps, weight })),
  };
}

// Generate a workout from selected muscles and a strength(0)..endurance(1) slider value.
export function generateWorkout(muscles, t, history) {
  const setsBy = completedSetsByExercise(history);
  const pop = popularityMap(history);
  const chosen = [];
  const used = new Set();

  for (const muscle of muscles) {
    const candidates = EXERCISES
      .filter((e) => e.primary.includes(muscle) && !used.has(e.id))
      .sort((a, b) => (pop[b.id] || 0) - (pop[a.id] || 0) || b.defaultWeight - a.defaultWeight);
    for (const ex of candidates.slice(0, 2)) {
      used.add(ex.id);
      chosen.push(ex);
    }
  }

  // Big compound lifts first.
  chosen.sort((a, b) => b.defaultWeight - a.defaultWeight);

  return chosen.slice(0, 8).map((ex) => prescribe(ex, t, setsBy));
}

// How hard each muscle is worked in a workout, normalized so the most-worked muscle = 1.
// Secondary muscles count at 40% of primary. Volume proxy: sets × reps × (weight or bodyweight stand-in).
export function muscleLoad(workout) {
  const load = {};
  for (const wx of workout.exercises) {
    const ex = exerciseById[wx.exerciseId];
    if (!ex) continue;
    let vol = 0;
    for (const s of wx.sets) vol += s.reps * (s.weight > 0 ? s.weight : 30);
    for (const m of ex.primary) load[m] = (load[m] || 0) + vol;
    for (const m of ex.secondary) load[m] = (load[m] || 0) + vol * 0.4;
  }
  const max = Math.max(0, ...Object.values(load));
  if (max === 0) return {};
  for (const m of Object.keys(load)) load[m] /= max;
  return load;
}

// All muscles touched by a workout (primary + secondary).
export function workoutMuscles(workout) {
  const set = new Set();
  for (const wx of workout.exercises) {
    const ex = exerciseById[wx.exerciseId];
    if (!ex) continue;
    for (const m of [...ex.primary, ...ex.secondary]) set.add(m);
  }
  return set;
}

export function fmtWeight(w) {
  if (w === 0) return 'BW';
  return `${w % 1 === 0 ? w : w.toFixed(1)} kg`;
}

export function fmtTotal(kg) {
  if (kg >= 1000000) return `${(kg / 1000000).toFixed(1)}M kg`;
  if (kg >= 10000) return `${Math.round(kg / 1000)}t`;
  return `${Math.round(kg).toLocaleString()} kg`;
}
