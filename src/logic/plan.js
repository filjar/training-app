import { exerciseById } from '../data/exercises.js';
import { GOALS, planTemplateById } from '../data/plans.js';
import { completedSetsByExercise, prescribe } from './stats.js';

const uid = () => Math.random().toString(36).slice(2, 10);
const DAY = 86400000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
// Monday of the week containing d.
export function startOfWeek(d) {
  const day = startOfDay(d);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - ((day.getDay() + 6) % 7));
}
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Build a plan and its workouts from a curated template.
export function createPlan(templateId, daysPerWeek, goalId, weekdays, history) {
  const template = planTemplateById[templateId];
  const goal = GOALS.find((g) => g.id === goalId) || GOALS[1];
  const setsBy = completedSetsByExercise(history);
  const planId = uid();

  const workouts = template.slots.map((slot) => ({
    id: uid(),
    name: slot.label,
    fromPlan: planId,
    exercises: slot.exercises.map((id) => prescribe(exerciseById[id], goal.t, setsBy)),
  }));

  const plan = {
    id: planId,
    templateId,
    name: template.name,
    goal: goal.id,
    daysPerWeek,
    weekdays: [...weekdays].sort((a, b) => a - b),
    slots: template.slots.map((slot, i) => ({ key: slot.key, label: slot.label, workoutId: workouts[i].id })),
    startedAt: new Date().toISOString(),
  };
  return { plan, workouts };
}

function sessionsByDay(history) {
  const map = {};
  for (const s of history) (map[dayKey(new Date(s.date))] ??= []).push(s);
  return map;
}

// Lays the plan over this week and next. The rotation is driven by how many
// plan sessions have actually been done, so a skipped day never knocks the
// order out — the next session is always the one you haven't done yet.
// Each day: { date, isToday, sessions, slot, status } where status is
// 'done' | 'missed' | 'today' | 'upcoming' | 'rest'.
export function planSchedule(plan, history, now = new Date()) {
  const today = startOfDay(now);
  const monday = startOfWeek(now);
  const planStart = startOfDay(new Date(plan.startedAt));
  const byDay = sessionsByDay(history);
  const slotWorkouts = new Set(plan.slots.map((s) => s.workoutId));
  let cursor = history.filter(
    (s) => slotWorkouts.has(s.workoutId) && new Date(s.date) >= new Date(plan.startedAt),
  ).length;

  const days = [];
  for (let i = 0; i < 14; i++) {
    const date = addDays(monday, i);
    const sessions = byDay[dayKey(date)] || [];
    const planned = plan.weekdays.includes(i % 7);
    const isToday = date.getTime() === today.getTime();
    let status = 'rest';
    let slot = null;
    if (sessions.length) status = 'done';
    else if (date < today) status = planned && date >= planStart ? 'missed' : 'rest';
    else if (planned) {
      slot = plan.slots[cursor++ % plan.slots.length];
      status = isToday ? 'today' : 'upcoming';
    }
    days.push({ date, isToday, sessions, slot, status });
  }
  return {
    thisWeek: days.slice(0, 7),
    nextWeek: days.slice(7),
    nextUp: days.find((d) => d.slot) || null,
  };
}

const sessionStats = (session) => {
  let sets = 0;
  let volume = 0;
  for (const e of session.entries) {
    for (const s of e.sets) {
      if (!s.done) continue;
      sets += 1;
      volume += s.reps * (s.weight || 0);
    }
  }
  return { sets, volume };
};

// Most recent sessions first, each with its completed sets and volume.
export function recentSessions(history, n = 8) {
  return [...history]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, n)
    .map((s) => ({ ...s, ...sessionStats(s) }));
}

// Totals for the last n calendar weeks (oldest first, current week last).
export function weekSummaries(history, n = 4, now = new Date()) {
  const thisMonday = startOfWeek(now);
  const weeks = Array.from({ length: n }, (_, i) => ({
    start: addDays(thisMonday, -7 * (n - 1 - i)),
    sessions: 0,
    sets: 0,
    volume: 0,
  }));
  for (const s of history) {
    const idx = n - 1 - Math.round((thisMonday - startOfWeek(new Date(s.date))) / (7 * DAY));
    if (idx < 0 || idx >= n) continue;
    const st = sessionStats(s);
    weeks[idx].sessions += 1;
    weeks[idx].sets += st.sets;
    weeks[idx].volume += st.volume;
  }
  return weeks;
}

// Completed sets per muscle over the last `days` days (secondary muscles count half).
export function muscleSets(history, days = 14, now = new Date()) {
  const since = now.getTime() - days * DAY;
  const map = {};
  for (const s of history) {
    if (new Date(s.date).getTime() < since) continue;
    for (const e of s.entries) {
      const ex = exerciseById[e.exerciseId];
      if (!ex) continue;
      const done = e.sets.filter((x) => x.done).length;
      for (const m of ex.primary) map[m] = (map[m] || 0) + done;
      for (const m of ex.secondary) map[m] = (map[m] || 0) + done * 0.5;
    }
  }
  return map;
}
