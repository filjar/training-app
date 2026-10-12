import React from 'react';
import { useStore } from '../store.jsx';
import { exerciseById } from '../data/exercises.js';
import { muscleLoad, estimateMinutes, fmtWeight } from '../logic/stats.js';
import { BodyPicture } from './BodyModel.jsx';
import FlowHeader from './FlowHeader.jsx';

// Look at a workout before doing something with it: what it trains, what is
// in it, then Start or Edit. Read-only.
export default function WorkoutPreview({ workout, saved, onBack, onStart, onEdit }) {
  const { state } = useStore();
  const nSets = workout.exercises.reduce((n, wx) => n + wx.sets.length, 0);

  return (
    <div className="tab-page flow-page preview">
      <FlowHeader title={workout.name} onBack={onBack} />
      <div className="preview-layout">
        <div className="card preview-body">
          <BodyPicture bodyType={state.settings.bodyType} highlights={muscleLoad(workout)} height={230} />
          <div className="muted small center">Darker red = more of this workout's load</div>
        </div>

        <div className="preview-main">
          <div className="muted small">
            {workout.exercises.length} exercises · {nSets} sets · about {estimateMinutes(workout)} min
            {!saved && ' · not saved to your library'}
          </div>
          <div className="card">
            <ul className="plain-list preview-list">
              {workout.exercises.map((wx, i) => {
                const first = wx.sets[0] || {};
                return (
                  <li key={i}>
                    <span>{exerciseById[wx.exerciseId]?.name}</span>
                    <span className="muted">{wx.sets.length} × {first.reps} @ {fmtWeight(first.weight || 0)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <button className="btn primary full" onClick={() => onStart(workout)}>Start workout</button>
          <button className="btn full" onClick={() => onEdit(workout)}>Edit</button>
        </div>
      </div>
    </div>
  );
}
