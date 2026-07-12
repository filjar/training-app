import React, { useMemo, useState } from 'react';
import { EXERCISES, exerciseById } from '../data/exercises.js';
import { useStore, uid } from '../store.jsx';
import { generateWorkout, suggestWeight, completedSetsByExercise, fmtWeight, workoutMuscles } from '../logic/stats.js';
import BodyModel from './BodyModel.jsx';

function summarize(workout) {
  return workout.exercises
    .map((wx) => exerciseById[wx.exerciseId]?.name)
    .filter(Boolean)
    .join(' · ');
}

// ---------- editor ----------

export function WorkoutEditor({ initial, onSave, onCancel }) {
  const { state } = useStore();
  const [workout, setWorkout] = useState(() => JSON.parse(JSON.stringify(initial)));
  const [pickerMuscle, setPickerMuscle] = useState(null);
  const [genMuscles, setGenMuscles] = useState([]);
  const [slider, setSlider] = useState(0.5);
  const [addMode, setAddMode] = useState('pick'); // 'pick' | 'generate'
  const setsBy = useMemo(() => completedSetsByExercise(state.history), [state.history]);

  const update = (patch) => setWorkout((w) => ({ ...w, ...patch }));

  const updateExercise = (i, fn) =>
    setWorkout((w) => {
      const exercises = w.exercises.map((wx, j) => (j === i ? fn(wx) : wx));
      return { ...w, exercises };
    });

  const setUniform = (i, field, value) =>
    updateExercise(i, (wx) => ({ ...wx, sets: wx.sets.map((s) => ({ ...s, [field]: value })) }));

  const setSetCount = (i, n) =>
    updateExercise(i, (wx) => {
      const sets = wx.sets.slice(0, Math.max(1, n));
      while (sets.length < n) sets.push({ ...sets[sets.length - 1] });
      return { ...wx, sets };
    });

  const move = (i, dir) =>
    setWorkout((w) => {
      const exercises = [...w.exercises];
      const j = i + dir;
      if (j < 0 || j >= exercises.length) return w;
      [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
      return { ...w, exercises };
    });

  const addExercise = (ex) => {
    const reps = Math.round((ex.strength.reps + ex.endurance.reps) / 2);
    const nSets = Math.round((ex.strength.sets + ex.endurance.sets) / 2);
    const weight = suggestWeight(ex, reps, setsBy[ex.id]);
    setWorkout((w) => ({
      ...w,
      exercises: [...w.exercises, { exerciseId: ex.id, rest: 90, sets: Array.from({ length: nSets }, () => ({ reps, weight })) }],
    }));
  };

  const runGenerator = () => {
    if (genMuscles.length === 0) return;
    const exercises = generateWorkout(genMuscles, slider, state.history);
    setWorkout((w) => ({ ...w, exercises }));
  };

  const pickList = pickerMuscle
    ? EXERCISES.filter((e) => e.primary.includes(pickerMuscle) || e.secondary.includes(pickerMuscle))
        .sort((a, b) => a.primary.includes(pickerMuscle) === b.primary.includes(pickerMuscle) ? 0 : a.primary.includes(pickerMuscle) ? -1 : 1)
    : [];

  return (
    <div className="tab-page">
      <div className="editor-header">
        <h1>{initial.exercises.length ? 'Edit workout' : 'New workout'}</h1>
        <div className="row gap">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button
            className="btn primary"
            disabled={!workout.name.trim() || workout.exercises.length === 0}
            onClick={() => onSave(workout)}
          >
            Save workout
          </button>
        </div>
      </div>

      <input
        className="input name-input"
        placeholder="Workout name"
        value={workout.name}
        onChange={(e) => update({ name: e.target.value })}
      />

      <div className="editor-layout">
        <div className="editor-exercises">
          <h2>Exercises ({workout.exercises.length})</h2>
          {workout.exercises.length === 0 && <div className="muted">Add exercises below — pick by muscle or generate a whole workout.</div>}
          {workout.exercises.map((wx, i) => {
            const ex = exerciseById[wx.exerciseId];
            const first = wx.sets[0] || { reps: 10, weight: 0 };
            return (
              <div key={i} className="card editor-row">
                <div className="editor-row-head">
                  <strong>{ex?.name}</strong>
                  <div className="row gap">
                    <button className="icon-btn" title="Move up" onClick={() => move(i, -1)}>↑</button>
                    <button className="icon-btn" title="Move down" onClick={() => move(i, 1)}>↓</button>
                    <button className="icon-btn danger" title="Remove" onClick={() => setWorkout((w) => ({ ...w, exercises: w.exercises.filter((_, j) => j !== i) }))}>✕</button>
                  </div>
                </div>
                <div className="editor-fields">
                  <label>Sets
                    <input type="number" min="1" max="12" value={wx.sets.length} onChange={(e) => setSetCount(i, +e.target.value || 1)} />
                  </label>
                  <label>Reps
                    <input type="number" min="1" max="100" value={first.reps} onChange={(e) => setUniform(i, 'reps', +e.target.value || 1)} />
                  </label>
                  <label>Weight (kg)
                    <input type="number" min="0" step="0.5" value={first.weight} onChange={(e) => setUniform(i, 'weight', +e.target.value || 0)} />
                  </label>
                  <label>Rest (s)
                    <input type="number" min="0" step="15" value={wx.rest || 0} onChange={(e) => updateExercise(i, (x) => ({ ...x, rest: +e.target.value || 0 }))} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="editor-add card">
          <div className="seg-row">
            <button className={`seg ${addMode === 'pick' ? 'seg-active' : ''}`} onClick={() => setAddMode('pick')}>Pick by muscle</button>
            <button className={`seg ${addMode === 'generate' ? 'seg-active' : ''}`} onClick={() => setAddMode('generate')}>Generate</button>
          </div>

          {addMode === 'pick' && (
            <>
              <BodyModel
                bodyType={state.settings.bodyType}
                selected={pickerMuscle ? [pickerMuscle] : []}
                onToggle={(m) => setPickerMuscle((cur) => (cur === m ? null : m))}
                height={260}
              />
              {!pickerMuscle && <div className="muted small center">Tap a muscle to browse its exercises.</div>}
              {pickerMuscle && (
                <div className="pick-list">
                  <h3>{pickerMuscle}</h3>
                  {pickList.map((ex) => (
                    <div key={ex.id} className="pick-item">
                      <div>
                        <div>{ex.name}</div>
                        <div className="muted tiny">{ex.primary.includes(pickerMuscle) ? 'primary' : 'secondary'} · default {fmtWeight(suggestWeight(ex, 10, setsBy[ex.id]))}</div>
                      </div>
                      <button className="btn small" onClick={() => addExercise(ex)}>+ Add</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {addMode === 'generate' && (
            <>
              <BodyModel
                bodyType={state.settings.bodyType}
                selected={genMuscles}
                onToggle={(m) => setGenMuscles((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]))}
                height={260}
              />
              <div className="muted small center">
                {genMuscles.length ? genMuscles.join(', ') : 'Tap the muscles you want to train.'}
              </div>
              <div className="slider-row">
                <span>Strength</span>
                <input type="range" min="0" max="1" step="0.05" value={slider} onChange={(e) => setSlider(+e.target.value)} />
                <span>Endurance</span>
              </div>
              <button className="btn primary full" disabled={genMuscles.length === 0} onClick={runGenerator}>
                Generate workout
              </button>
              {workout.exercises.length > 0 && <div className="muted tiny center">Generating replaces the current exercise list.</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- list ----------

export default function WorkoutsTab({ onStart }) {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState(null); // workout object being edited

  if (editing) {
    return (
      <WorkoutEditor
        initial={editing}
        onCancel={() => setEditing(null)}
        onSave={(w) => {
          dispatch({ type: 'saveWorkout', workout: w });
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="tab-page">
      <div className="editor-header">
        <h1>Workouts</h1>
        <button className="btn primary" onClick={() => setEditing({ id: uid(), name: '', exercises: [] })}>
          + New workout
        </button>
      </div>
      {state.workouts.length === 0 && <div className="muted">No workouts yet. Create one!</div>}
      <div className="card-grid">
        {state.workouts.map((w) => (
          <div key={w.id} className="card workout-card">
            <div className="card-title">{w.name}</div>
            <div className="muted small">{summarize(w)}</div>
            <div className="muted tiny">{[...workoutMuscles(w)].join(', ')}</div>
            <div className="row gap wrap" style={{ marginTop: 8 }}>
              <button className="btn small primary" onClick={() => onStart(w)}>Start</button>
              <button className="btn small" onClick={() => setEditing(JSON.parse(JSON.stringify(w)))}>Edit</button>
              <button
                className="btn small danger-ghost"
                onClick={() => {
                  if (confirm(`Delete workout "${w.name}"?`)) dispatch({ type: 'deleteWorkout', id: w.id });
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
