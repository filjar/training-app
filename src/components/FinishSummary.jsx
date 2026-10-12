import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { exerciseById } from '../data/exercises.js';
import { newPRs, fmtTotal, fmtWeight } from '../logic/stats.js';

// Shown after a workout is finished. `finished` is the workout as it was when
// Finish was tapped plus the history from before it.
export default function FinishSummary({ finished, onDone }) {
  const { state, dispatch } = useStore();
  const { active, earlierHistory, durationSec } = finished;
  const [name, setName] = useState(active.name);
  const [saved, setSaved] = useState(false);
  const inLibrary = state.workouts.some((w) => w.id === active.workoutId);

  const done = active.entries.flatMap((e) => e.sets.filter((s) => s.done));
  const volume = done.reduce((sum, s) => sum + s.reps * (s.weight || 0), 0);
  const prs = newPRs({ date: new Date().toISOString(), entries: active.entries }, earlierHistory);

  const save = () => {
    dispatch({
      type: 'saveWorkout',
      workout: {
        id: active.workoutId,
        name: name.trim() || active.name,
        exercises: active.entries.map((e) => ({
          exerciseId: e.exerciseId,
          rest: e.rest,
          sets: e.sets.map(({ reps, weight }) => ({ reps, weight })),
        })),
      },
    });
    setSaved(true);
  };

  return (
    <div className="tab-page flow-page summary">
      <h1>Workout finished</h1>
      <div className="muted">{active.name}</div>

      <div className="pr-grid summary-stats">
        <div className="pr-cell"><div className="pr-label">Time</div><div className="pr-value">{Math.round(durationSec / 60)} min</div></div>
        <div className="pr-cell"><div className="pr-label">Sets</div><div className="pr-value">{done.length}</div></div>
        <div className="pr-cell"><div className="pr-label">Lifted</div><div className="pr-value">{fmtTotal(volume)}</div></div>
      </div>

      {prs.length > 0 && (
        <div className="card">
          <h3>New personal records</h3>
          <ul className="plain-list">
            {prs.map((pr, i) => (
              <li key={i}>{exerciseById[pr.exerciseId]?.name} — {pr.reps} rep PR: <strong>{fmtWeight(pr.weight)}</strong></li>
            ))}
          </ul>
        </div>
      )}

      {!inLibrary && !saved && (
        <div className="card">
          <h3>Save this workout?</h3>
          <div className="muted small">It isn't in your library yet. Saving keeps it with the reps and weights you just used.</div>
          <input className="input name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Workout name" />
          <button className="btn full" onClick={save}>Save to library</button>
        </div>
      )}
      {saved && <div className="muted small">Saved to your library.</div>}

      <button className="btn primary full" onClick={onDone}>Done</button>
    </div>
  );
}
