import React, { useEffect, useRef, useState } from 'react';
import { useStore, uid } from '../store.jsx';
import { exerciseById } from '../data/exercises.js';
import { fmtWeight } from '../logic/stats.js';

function fmtClock(sec) {
  const s = Math.abs(Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

// Rest timer: counts down the active exercise's rest period if it has one, otherwise counts up.
function RestPanel({ restSec, open, onClose }) {
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [startedAt]);

  const elapsed = startedAt ? (now - startedAt) / 1000 : 0;
  const counting = restSec > 0 ? restSec - elapsed : elapsed;
  const overtime = restSec > 0 && counting < 0;

  return (
    <div className={`rest-panel ${open ? 'open' : ''}`}>
      <div className="rest-panel-inner">
        <button className="icon-btn rest-close" onClick={onClose}>✕</button>
        <div className="muted small">{restSec > 0 ? `Rest ${restSec}s` : 'Stopwatch'}</div>
        <div className={`rest-clock ${overtime ? 'overtime' : ''}`}>
          {startedAt ? fmtClock(counting) : restSec > 0 ? fmtClock(restSec) : '0:00'}
        </div>
        {overtime && <div className="overtime-label">rest over — go!</div>}
        <div className="row gap center">
          {!startedAt ? (
            <button className="btn primary" onClick={() => { setStartedAt(Date.now()); setNow(Date.now()); }}>
              Start rest
            </button>
          ) : (
            <button className="btn" onClick={() => setStartedAt(null)}>Reset</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActiveWorkout({ onFinish }) {
  const { state, dispatch } = useStore();
  const active = state.active;
  const [restOpen, setRestOpen] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState(active?.entries[0]?.id || null);
  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((Date.now() - active.startedAt) / 1000), 1000);
    return () => clearInterval(t);
  }, [active.startedAt]);

  if (!active) return null;

  const setActive = (next) => dispatch({ type: 'updateActive', active: next });

  const updateEntry = (id, fn) =>
    setActive({ ...active, entries: active.entries.map((e) => (e.id === id ? fn(e) : e)) });

  const toggleSet = (entryId, si) => {
    setActiveEntryId(entryId);
    updateEntry(entryId, (e) => ({
      ...e,
      sets: e.sets.map((s, j) => (j === si ? { ...s, done: !s.done } : s)),
    }));
  };

  const editSet = (entryId, si, field, value) =>
    updateEntry(entryId, (e) => ({
      ...e,
      sets: e.sets.map((s, j) => (j === si ? { ...s, [field]: value } : s)),
    }));

  const addSet = (entryId) =>
    updateEntry(entryId, (e) => ({
      ...e,
      sets: [...e.sets, { ...e.sets[e.sets.length - 1], done: false }],
    }));

  const removeSet = (entryId) =>
    updateEntry(entryId, (e) => (e.sets.length > 1 ? { ...e, sets: e.sets.slice(0, -1) } : e));

  const reorder = (from, to) => {
    if (from === to || from == null || to == null) return;
    const entries = [...active.entries];
    const [moved] = entries.splice(from, 1);
    entries.splice(to, 0, moved);
    setActive({ ...active, entries });
  };

  const doneSets = active.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const totalSets = active.entries.reduce((n, e) => n + e.sets.length, 0);
  const activeEntry = active.entries.find((e) => e.id === activeEntryId);
  const restSec = activeEntry?.rest || 0;

  return (
    <div className="active-workout">
      <div className="active-header">
        <div>
          <h1>{active.name}</h1>
          <div className="muted small">
            {fmtClock(elapsed)} · {doneSets}/{totalSets} sets done
          </div>
        </div>
        <div className="row gap">
          <button className="btn" onClick={() => setRestOpen(!restOpen)}>⏱ Rest</button>
          <button
            className="btn ghost"
            onClick={() => confirm('Cancel this workout? Nothing will be saved.') && dispatch({ type: 'cancelWorkout' })}
          >
            Cancel
          </button>
          <button className="btn primary" onClick={onFinish}>Finish</button>
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
      </div>

      <div className="active-list">
        {active.entries.map((entry, i) => {
          const ex = exerciseById[entry.exerciseId];
          const allDone = entry.sets.every((s) => s.done);
          return (
            <div
              key={entry.id}
              className={`card active-exercise ${allDone ? 'all-done' : ''} ${dragOver === i ? 'drag-over' : ''} ${activeEntryId === entry.id ? 'current' : ''}`}
              draggable
              onDragStart={() => { dragIndex.current = i; }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => { reorder(dragIndex.current, i); setDragOver(null); dragIndex.current = null; }}
              onDragEnd={() => setDragOver(null)}
              onClick={() => setActiveEntryId(entry.id)}
            >
              <div className="active-exercise-head">
                <span className="drag-handle" title="Drag to reorder">⠿</span>
                <strong>{ex?.name}</strong>
                <span className="muted small">rest {entry.rest || 0}s</span>
                <span className="spacer" />
                <button className="icon-btn" title="Add set" onClick={(e) => { e.stopPropagation(); addSet(entry.id); }}>+ set</button>
                <button className="icon-btn" title="Remove last set" onClick={(e) => { e.stopPropagation(); removeSet(entry.id); }}>− set</button>
              </div>
              <div className="set-rows">
                {entry.sets.map((s, si) => (
                  <div
                    key={si}
                    className={`set-row ${s.done ? 'done' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleSet(entry.id, si); }}
                  >
                    <span className="set-num">{si + 1}</span>
                    <label onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number" min="0" value={s.reps}
                        onChange={(e) => editSet(entry.id, si, 'reps', +e.target.value || 0)}
                      /> reps
                    </label>
                    <label onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number" min="0" step="0.5" value={s.weight}
                        onChange={(e) => editSet(entry.id, si, 'weight', +e.target.value || 0)}
                      /> kg
                    </label>
                    <span className={`set-check ${s.done ? 'on' : ''}`}>{s.done ? '✓' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <RestPanel restSec={restSec} open={restOpen} onClose={() => setRestOpen(false)} />
    </div>
  );
}
