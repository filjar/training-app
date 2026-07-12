import React, { useMemo, useState } from 'react';
import { EXERCISES, MUSCLE_GROUPS } from '../data/exercises.js';
import { useStore } from '../store.jsx';
import { completedSetsByExercise, repPRs, totalWeightLifted, popularityMap, fmtTotal, fmtWeight } from '../logic/stats.js';

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
            {ex.primary.join(', ')}
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

export default function LibraryTab() {
  const { state } = useStore();
  const [filter, setFilter] = useState('All');
  const setsBy = useMemo(() => completedSetsByExercise(state.history), [state.history]);
  const pop = useMemo(() => popularityMap(state.history), [state.history]);

  const groups = filter === 'All' ? MUSCLE_GROUPS : [filter];

  return (
    <div className="tab-page">
      <h1>Exercise Library</h1>
      <div className="chip-row">
        {['All', ...MUSCLE_GROUPS].map((g) => (
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
    </div>
  );
}
