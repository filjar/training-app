import React, { useMemo, useState } from 'react';
import { useStore } from '../store.jsx';
import { muscleLoad, workoutMuscles, fmtWeight } from '../logic/stats.js';
import { exerciseById } from '../data/exercises.js';
import { planSchedule } from '../logic/plan.js';
import BodyModel from './BodyModel.jsx';

export default function MainTab({ onStart, onOpenPlan }) {
  const { state } = useStore();
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);

  const selectedWorkout = state.workouts.find((w) => w.id === selectedWorkoutId) || null;

  // When a workout is selected it drives the model highlights (load intensity).
  const highlights = useMemo(() => (selectedWorkout ? muscleLoad(selectedWorkout) : {}), [selectedWorkout]);

  // The plan's next session, if a plan is set up and its workout still exists.
  const nextUp = useMemo(() => {
    if (!state.plan) return null;
    const day = planSchedule(state.plan, state.history).nextUp;
    const workout = day && state.workouts.find((w) => w.id === day.slot.workoutId);
    return workout ? { day, workout } : null;
  }, [state.plan, state.history, state.workouts]);

  const toggleMuscle = (m) => {
    setSelectedWorkoutId(null);
    setSelectedMuscles((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  };

  const filtered = useMemo(() => {
    if (selectedMuscles.length === 0) return state.workouts;
    return state.workouts.filter((w) => {
      const muscles = workoutMuscles(w);
      return selectedMuscles.some((m) => muscles.has(m));
    });
  }, [state.workouts, selectedMuscles]);

  return (
    <div className="tab-page main-tab">
      <div className="main-model">
        <BodyModel
          bodyType={state.settings.bodyType}
          selected={selectedWorkout ? [] : selectedMuscles}
          highlights={highlights}
          onToggle={toggleMuscle}
          height={380}
          summary={
            selectedWorkout ? selectedWorkout.name : selectedMuscles.length ? selectedMuscles.join(', ') : 'No muscles selected'
          }
        />
        <div className="main-model-caption">
          {selectedWorkout ? (
            <span>
              Showing load for <strong>{selectedWorkout.name}</strong> — darker red = more strain.{' '}
              <button className="link-btn" onClick={() => setSelectedWorkoutId(null)}>clear</button>
            </span>
          ) : selectedMuscles.length > 0 ? (
            <span>
              Filtering by <strong>{selectedMuscles.join(', ')}</strong>{' '}
              <button className="link-btn" onClick={() => setSelectedMuscles([])}>clear</button>
            </span>
          ) : (
            <span className="muted">Tap muscles to filter your workouts, or tap a workout to see what it hits.</span>
          )}
        </div>
      </div>

      <div className="main-list">
        {nextUp && (
          <div className="card next-up">
            <div className="muted tiny">
              NEXT IN YOUR PLAN ·{' '}
              {nextUp.day.isToday ? 'today' : nextUp.day.date.toLocaleDateString(undefined, { weekday: 'long' })}
            </div>
            <div className="row space-between gap">
              <button className="link-btn next-up-name" onClick={() => setSelectedWorkoutId(nextUp.workout.id)}>
                {nextUp.workout.name}
              </button>
              <div className="row gap">
                <button className="btn small" onClick={onOpenPlan}>Plan</button>
                <button className="btn small primary" onClick={() => onStart(nextUp.workout)}>Start</button>
              </div>
            </div>
          </div>
        )}
        <h2>
          {selectedMuscles.length ? `Workouts for ${selectedMuscles.join(' + ')}` : "Today's workout"}
          <span className="muted small"> ({filtered.length})</span>
        </h2>
        {filtered.length === 0 && (
          <div className="muted">No saved workout hits those muscles yet — create one in the Workouts tab.</div>
        )}
        {filtered.map((w) => {
          const isSel = w.id === selectedWorkoutId;
          const nSets = w.exercises.reduce((n, wx) => n + wx.sets.length, 0);
          return (
            <div
              key={w.id}
              className={`card workout-card selectable ${isSel ? 'selected' : ''}`}
              onClick={() => setSelectedWorkoutId(isSel ? null : w.id)}
            >
              <div className="row space-between">
                <div className="card-title">{w.name}</div>
                <div className="muted small">{w.exercises.length} exercises · {nSets} sets</div>
              </div>
              {isSel && (
                <div className="workout-detail" onClick={(e) => e.stopPropagation()}>
                  <ul className="plain-list">
                    {w.exercises.map((wx, i) => {
                      const ex = exerciseById[wx.exerciseId];
                      const s = wx.sets[0] || {};
                      return (
                        <li key={i}>
                          {ex?.name} — {wx.sets.length} × {s.reps} @ {fmtWeight(s.weight || 0)}
                        </li>
                      );
                    })}
                  </ul>
                  <button className="btn primary full" onClick={() => onStart(w)}>
                    Start this workout
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
