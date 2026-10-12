import React from 'react';

// Strength ↔ Endurance slider with its three named stops. Any position in
// between works; the labels are also buttons that jump to their stop.
const STOPS = [
  { label: 'Strength', value: 0.15 },
  { label: 'Balanced', value: 0.5 },
  { label: 'Endurance', value: 0.9 },
];

export default function GoalSlider({ value, onChange }) {
  const nearest = STOPS.reduce((a, b) => (Math.abs(b.value - value) < Math.abs(a.value - value) ? b : a));
  return (
    <div className="goal-slider">
      <input type="range" min="0" max="1" step="0.05" value={value} onChange={(e) => onChange(+e.target.value)} />
      <div className="goal-slider-stops">
        {STOPS.map((s) => (
          <button key={s.label} className={s === nearest ? 'on' : ''} onClick={() => onChange(s.value)}>{s.label}</button>
        ))}
      </div>
    </div>
  );
}
