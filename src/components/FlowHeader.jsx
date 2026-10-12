import React from 'react';

// Header of a full-screen flow: back arrow, title, and optionally one thing on the right.
export default function FlowHeader({ title, onBack, right }) {
  return (
    <div className="flow-header">
      <button className="flow-back" onClick={onBack} aria-label="Back">‹</button>
      <h1>{title}</h1>
      <div className="flow-header-right">{right}</div>
    </div>
  );
}
