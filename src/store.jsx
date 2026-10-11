import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { EXERCISES, exerciseById } from './data/exercises.js';
import { suggestWeight, completedSetsByExercise } from './logic/stats.js';
import { readIncomingState } from './logic/sync.js';

const KEY = 'training-app-v1';

export const uid = () => Math.random().toString(36).slice(2, 10);

function sampleWorkouts() {
  const mk = (exerciseId, nSets, reps, rest = 90) => ({
    exerciseId,
    rest,
    sets: Array.from({ length: nSets }, () => ({
      reps,
      weight: suggestWeight(exerciseById[exerciseId], reps, null),
    })),
  });
  return [
    {
      id: uid(), name: 'Full Body Strength',
      exercises: [mk('back-squat', 5, 5, 150), mk('bench-press', 5, 5, 150), mk('barbell-row', 5, 5, 120), mk('overhead-press', 4, 6, 120), mk('plank', 3, 4, 60)],
    },
    {
      id: uid(), name: 'Upper Body Pump',
      exercises: [mk('incline-db-press', 4, 10), mk('lat-pulldown', 4, 12), mk('lateral-raise', 4, 15, 60), mk('biceps-curl', 3, 12, 60), mk('triceps-pushdown', 3, 12, 60)],
    },
    {
      id: uid(), name: 'Legs & Glutes',
      exercises: [mk('back-squat', 4, 8, 150), mk('romanian-deadlift', 4, 8, 120), mk('hip-thrust', 4, 10, 90), mk('walking-lunge', 3, 10, 90), mk('standing-calf-raise', 4, 15, 60)],
    },
  ];
}

const initialState = () => ({
  settings: { bodyType: 'woman' },
  workouts: sampleWorkouts(),
  history: [],
  plan: null,
  active: null,
});

// Read any QR-transferred data exactly once, when this module first loads —
// NOT inside load(). load() is a React lazy initializer that StrictMode invokes
// twice; reading (and clearing) the URL hash there would consume it on the
// first call and see nothing on the second.
const INCOMING = readIncomingState();

function load() {
  // Data handed over from another device via a scanned QR wins over whatever is
  // already on this device.
  if (INCOMING) return { ...initialState(), ...INCOMING, active: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.workouts)) return { ...initialState(), ...data };
    }
  } catch { /* corrupted storage — start fresh */ }
  return initialState();
}

function reducer(state, action) {
  switch (action.type) {
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'saveWorkout': {
      const exists = state.workouts.some((w) => w.id === action.workout.id);
      return {
        ...state,
        workouts: exists
          ? state.workouts.map((w) => (w.id === action.workout.id ? action.workout : w))
          : [...state.workouts, action.workout],
      };
    }
    case 'deleteWorkout':
      return { ...state, workouts: state.workouts.filter((w) => w.id !== action.id) };
    // Switching or removing a plan also removes the workouts the old plan generated.
    case 'setPlan':
      return {
        ...state,
        plan: action.plan,
        workouts: [...state.workouts.filter((w) => !w.fromPlan), ...action.workouts],
      };
    case 'updatePlan':
      return { ...state, plan: { ...state.plan, ...action.patch } };
    case 'clearPlan':
      return { ...state, plan: null, workouts: state.workouts.filter((w) => !w.fromPlan) };
    case 'startWorkout': {
      const w = action.workout;
      return {
        ...state,
        active: {
          workoutId: w.id,
          name: w.name,
          startedAt: Date.now(),
          entries: w.exercises.map((wx) => ({
            id: uid(),
            exerciseId: wx.exerciseId,
            rest: wx.rest,
            sets: wx.sets.map((s) => ({ ...s, done: false })),
          })),
        },
      };
    }
    case 'updateActive':
      return { ...state, active: action.active };
    case 'cancelWorkout':
      return { ...state, active: null };
    case 'finishWorkout': {
      if (!state.active) return state;
      const session = {
        id: uid(),
        workoutId: state.active.workoutId,
        name: state.active.name,
        date: new Date().toISOString(),
        durationSec: Math.round((Date.now() - state.active.startedAt) / 1000),
        entries: state.active.entries.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets })),
      };
      return { ...state, active: null, history: [...state.history, session] };
    }
    case 'import':
      return { ...initialState(), ...action.data, active: null };
    case 'reset':
      return initialState();
    case 'demoHistory':
      return { ...state, history: [...state.history, ...action.sessions] };
    default:
      return state;
  }
}

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);
  return <StoreCtx.Provider value={{ state, dispatch }}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);

// Generate a few weeks of plausible history so PRs/popularity have data to show.
export function makeDemoHistory(workouts) {
  const sessions = [];
  const now = Date.now();
  for (let week = 6; week >= 1; week--) {
    for (let i = 0; i < Math.min(2, workouts.length); i++) {
      const w = workouts[(week + i) % workouts.length];
      const progress = (6 - week) * 0.025; // slow linear progress over the weeks
      sessions.push({
        id: uid(),
        workoutId: w.id,
        name: w.name,
        date: new Date(now - (week * 7 - i * 3) * 86400000).toISOString(),
        durationSec: 3000 + Math.round(Math.random() * 900),
        entries: w.exercises.map((wx) => ({
          exerciseId: wx.exerciseId,
          sets: wx.sets.map((s) => ({
            reps: Math.max(1, s.reps + Math.round(Math.random() * 2 - 1)),
            weight: s.weight > 0 ? Math.round((s.weight * (0.9 + progress)) * 2) / 2 : 0,
            done: Math.random() > 0.05,
          })),
        })),
      });
    }
  }
  return sessions;
}

export function exportData(state) {
  const blob = new Blob(
    [JSON.stringify({ settings: state.settings, workouts: state.workouts, history: state.history, plan: state.plan }, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `training-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
