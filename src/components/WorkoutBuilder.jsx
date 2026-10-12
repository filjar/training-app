import React, { useMemo, useState } from 'react';
import { EXERCISES, MUSCLE_GROUPS } from '../data/exercises.js';
import { useStore, uid } from '../store.jsx';
import { generateWorkout, prescribe, completedSetsByExercise } from '../logic/stats.js';
import BodyModel from './BodyModel.jsx';
import FlowHeader from './FlowHeader.jsx';
import GoalSlider from './GoalSlider.jsx';

const workoutName = (muscles) =>
  muscles.length <= 3 ? muscles.join(' + ') : `${muscles.slice(0, 2).join(' + ')} + ${muscles.length - 2} more`;

// Make a new workout: pick muscles on the body, then either generate it or
// choose the exercises by hand. Always ends at the preview (onReview).
export default function WorkoutBuilder({ onBack, onReview }) {
  const { state } = useStore();
  const [muscles, setMuscles] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [slider, setSlider] = useState(0.5);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState([]);
  const setsBy = useMemo(() => completedSetsByExercise(state.history), [state.history]);

  const toggle = (m) => setMuscles((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  const none = muscles.length === 0;

  const generate = () =>
    onReview({ id: uid(), name: workoutName(muscles), exercises: generateWorkout(muscles, slider, state.history) });

  if (picking) {
    const list = EXERCISES
      .filter((e) => [...e.primary, ...e.secondary].some((m) => muscles.includes(m)))
      .sort((a, b) => +b.primary.some((m) => muscles.includes(m)) - +a.primary.some((m) => muscles.includes(m)));
    const togglePick = (id) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    const review = () =>
      onReview({
        id: uid(),
        name: workoutName(muscles),
        exercises: picked.map((id) => prescribe(EXERCISES.find((e) => e.id === id), slider, setsBy)),
      });
    return (
      <div className="tab-page flow-page">
        <FlowHeader title="Choose exercises" onBack={() => setPicking(false)} />
        <div className="muted small">For {muscles.join(', ')}. Tap to add; you set the order and details afterwards.</div>
        <div className="pick-rows">
          {list.map((ex) => {
            const on = picked.includes(ex.id);
            return (
              <button key={ex.id} className={`pick-row ${on ? 'on' : ''}`} onClick={() => togglePick(ex.id)}>
                <span>
                  <strong>{ex.name}</strong>
                  <span className="muted small">
                    {ex.primary.join(', ')}{ex.secondary.length > 0 && ` · also ${ex.secondary.join(', ')}`}
                  </span>
                </span>
                <span className="pick-mark">{on ? '✓ Added' : '+ Add'}</span>
              </button>
            );
          })}
        </div>
        <div className="tray">
          <span>{picked.length} added</span>
          <button className="btn primary" disabled={picked.length === 0} onClick={review}>Review</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-page flow-page">
      <FlowHeader title="Build a workout" onBack={onBack} />
      <div className="builder-layout">
        <section className="card">
          <h2><span className="step">1</span>What do you want to train?</h2>
          <BodyModel
            bodyType={state.settings.bodyType}
            selected={muscles}
            onToggle={toggle}
            height={340}
            summary={none ? 'No muscles selected' : muscles.join(', ')}
          />
          <div className="chip-wrap">
            {(showAll ? MUSCLE_GROUPS : muscles).map((m) => (
              <button key={m} className={`chip ${muscles.includes(m) ? 'chip-muscle' : ''}`} onClick={() => toggle(m)}>
                {m}{muscles.includes(m) && ' ✕'}
              </button>
            ))}
            {!showAll && none && <span className="muted small">Tap muscles on the body, or</span>}
            <button className="link-btn small" onClick={() => setShowAll(!showAll)}>{showAll ? 'Hide list' : 'All muscles'}</button>
            {!none && <button className="link-btn small" onClick={() => setMuscles([])}>Clear</button>}
          </div>
        </section>

        <section className="card">
          <h2><span className="step">2</span>How do you want to build it?</h2>
          {none && <div className="muted small">Pick at least one muscle first.</div>}
          <h3>Generate it for me</h3>
          <GoalSlider value={slider} onChange={setSlider} />
          <button className="btn primary full" disabled={none} onClick={generate}>Generate workout</button>
          <button className="row-link builder-pick" disabled={none} onClick={() => setPicking(true)}>
            <span>
              <strong>Choose exercises myself</strong>
              <span className="muted small">Pick from the exercises for these muscles</span>
            </span>
            <span className="chevron">›</span>
          </button>
        </section>
      </div>
    </div>
  );
}
