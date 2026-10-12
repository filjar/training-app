import React, { useMemo, useState } from 'react';
import { EXERCISES, MUSCLE_GROUPS, LIBRARY_GROUPS, exerciseById } from '../data/exercises.js';
import { useStore } from '../store.jsx';
import { completedSetsByExercise, repPRs, totalWeightLifted, popularityMap, fmtTotal, fmtWeight, workoutMuscles } from '../logic/stats.js';
import BodyModel from './BodyModel.jsx';

function ExerciseCard({ ex, sets, popularity }) {
  const [open, setOpen] = useState(false);
  const prs = repPRs(sets || []);
  const total = totalWeightLifted(sets || []);
  const hasHistory = (sets || []).length > 0;

  return (
    <div className={`card exercise-card ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="exercise-card-head">
        <div>
          <div className="card-title">{ex.name}</div>
          <div className="muted small">
            {ex.primary.join(', ') || 'Grip and forearms'}
            {ex.secondary.length > 0 && <span> · also {ex.secondary.join(', ')}</span>}
          </div>
        </div>
        <div className="popularity" title="How often you do this exercise">
          <div className="popularity-bar">
            <div className="popularity-fill" style={{ width: `${Math.round((popularity || 0) * 100)}%` }} />
          </div>
          <span className="muted tiny">popularity</span>
        </div>
      </div>
      {open && (
        <div className="exercise-card-body" onClick={(e) => e.stopPropagation()}>
          <p className="instruction">{ex.instruction}</p>
          <div className="pr-grid">
            {[1, 2, 6, 10].map((n) => (
              <div key={n} className="pr-cell">
                <div className="pr-label">{n} rep PR</div>
                <div className="pr-value">{prs[n] ? fmtWeight(prs[n]) : '—'}</div>
              </div>
            ))}
            <div className="pr-cell">
              <div className="pr-label">Total lifted</div>
              <div className="pr-value">{hasHistory ? fmtTotal(total) : '—'}</div>
            </div>
          </div>
          {!hasHistory && <div className="muted small">No history yet — do a workout with this exercise to start tracking PRs.</div>}
        </div>
      )}
    </div>
  );
}

function ExerciseLibrary() {
  const { state } = useStore();
  const [filter, setFilter] = useState('All');
  const setsBy = useMemo(() => completedSetsByExercise(state.history), [state.history]);
  const pop = useMemo(() => popularityMap(state.history), [state.history]);

  const groups = filter === 'All' ? LIBRARY_GROUPS : [filter];

  return (
    <>
      <div className="chip-row">
        {['All', ...LIBRARY_GROUPS].map((g) => (
          <button key={g} className={`chip ${filter === g ? 'chip-active' : ''}`} onClick={() => setFilter(g)}>
            {g}
          </button>
        ))}
      </div>
      {groups.map((g) => {
        const list = EXERCISES.filter((e) => e.group === g);
        if (list.length === 0) return null;
        return (
          <section key={g} className="library-group">
            <h2>{g}</h2>
            <div className="card-grid">
              {list.map((ex) => (
                <ExerciseCard key={ex.id} ex={ex} sets={setsBy[ex.id]} popularity={pop[ex.id]} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

// Saved workouts: tap one to preview it (and start or edit from there).
// Muscles picked on the body or the chips narrow the list.
function WorkoutLibrary({ onOpen, onEdit, onNew }) {
  const { state, dispatch } = useStore();
  const [muscles, setMuscles] = useState([]);
  const [menu, setMenu] = useState(null);
  const toggle = (m) => setMuscles((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));

  const list = state.workouts.filter((w) => {
    const trained = workoutMuscles(w);
    return muscles.every((m) => trained.has(m));
  });

  return (
    <div className="library-workouts">
      <div className="card library-filter">
        <BodyModel
          bodyType={state.settings.bodyType}
          selected={muscles}
          onToggle={toggle}
          height={300}
          defaultCollapsed
          summary={muscles.length ? `Filter: ${muscles.join(', ')}` : 'Filter by muscle'}
        />
        <div className="chip-row">
          {MUSCLE_GROUPS.map((m) => (
            <button key={m} className={`chip ${muscles.includes(m) ? 'chip-muscle' : ''}`} onClick={() => toggle(m)}>{m}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="section-head">
          <h2>
            {muscles.length ? `Workouts for ${muscles.join(' + ')}` : 'Saved workouts'}
            <span className="muted small"> ({list.length})</span>
          </h2>
          <button className="btn small" onClick={onNew}>New workout</button>
        </div>
        {list.length === 0 && (
          <div className="card empty">
            <div className="muted">
              {state.workouts.length === 0 ? 'No saved workouts yet.' : 'No saved workout trains all of those muscles.'}
            </div>
            <button className="btn" onClick={onNew}>Build a workout</button>
          </div>
        )}
        <div className="card-grid">
          {list.map((w) => (
            <div key={w.id} className="card workout-row" onClick={() => onOpen(w)}>
              <div className="workout-row-main">
                <div className="card-title">{w.name}</div>
                <div className="muted small">
                  {w.exercises.map((wx) => exerciseById[wx.exerciseId]?.name).filter(Boolean).join(' · ')}
                </div>
                <div className="muted tiny">{[...workoutMuscles(w)].join(', ')}</div>
              </div>
              <button
                className="icon-btn more-btn"
                aria-label="More"
                onClick={(e) => { e.stopPropagation(); setMenu(menu === w.id ? null : w.id); }}
              >
                ⋯
              </button>
              <span className="chevron">›</span>
              {menu === w.id && (
                <div className="row-menu" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setMenu(null); onEdit(w); }}>Edit</button>
                  <button
                    onClick={() => {
                      setMenu(null);
                      if (confirm(`Delete workout "${w.name}"?`)) dispatch({ type: 'deleteWorkout', id: w.id });
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LibraryTab({ segment, onSegment, onOpen, onEdit, onNew }) {
  return (
    <div className="tab-page">
      <h1>Library</h1>
      <div className="seg-row library-seg">
        <button className={`seg ${segment === 'workouts' ? 'seg-active' : ''}`} onClick={() => onSegment('workouts')}>Workouts</button>
        <button className={`seg ${segment === 'exercises' ? 'seg-active' : ''}`} onClick={() => onSegment('exercises')}>Exercises</button>
      </div>
      {segment === 'workouts' ? <WorkoutLibrary onOpen={onOpen} onEdit={onEdit} onNew={onNew} /> : <ExerciseLibrary />}
    </div>
  );
}
