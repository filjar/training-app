import React, { useRef, useState } from 'react';
import { useStore, exportData, makeDemoHistory } from '../store.jsx';
import PhoneSync from './PhoneSync.jsx';

export default function SettingsTab() {
  const { state, dispatch } = useStore();
  const fileRef = useRef(null);
  const [showSync, setShowSync] = useState(false);

  const onImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.workouts)) throw new Error('bad format');
        dispatch({ type: 'import', data });
        alert('Data imported!');
      } catch {
        alert('Could not read that file — is it a Training app export?');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="tab-page">
      <h1>Settings</h1>

      <section className="card settings-section">
        <h2>Body model</h2>
        <div className="muted small">Used for the 3D muscle selector.</div>
        <div className="seg-row" style={{ maxWidth: 320 }}>
          {['woman', 'man'].map((t) => (
            <button
              key={t}
              className={`seg ${state.settings.bodyType === t ? 'seg-active' : ''}`}
              onClick={() => dispatch({ type: 'settings', patch: { bodyType: t } })}
            >
              {t === 'woman' ? 'Woman (athletic)' : 'Man (athletic)'}
            </button>
          ))}
        </div>
      </section>

      <section className="card settings-section">
        <h2>Open on your phone</h2>
        <div className="muted small">
          Scan a QR code to open the app on your phone (same Wi-Fi, nothing to install) and
          carry your workouts over with it — no server involved.
        </div>
        <div className="row gap wrap" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => setShowSync(true)}>📱 Open on phone (QR)</button>
        </div>
      </section>

      <section className="card settings-section">
        <h2>Move data by file</h2>
        <div className="muted small">
          Export your data as a file, move it to another device (AirDrop, mail, USB…) and import
          it there. Best for large histories that don't fit in a QR code.
        </div>
        <div className="row gap wrap" style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => exportData(state)}>Export data (JSON)</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Import data…</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
        </div>
      </section>

      {showSync && <PhoneSync onClose={() => setShowSync(false)} />}

      <section className="card settings-section">
        <h2>Developer</h2>
        <div className="row gap wrap">
          <button
            className="btn"
            onClick={() => dispatch({ type: 'demoHistory', sessions: makeDemoHistory(state.workouts) })}
          >
            Load demo history
          </button>
          <button
            className="btn danger-ghost"
            onClick={() => confirm('Reset ALL app data? This cannot be undone.') && dispatch({ type: 'reset' })}
          >
            Reset all data
          </button>
        </div>
        <div className="muted tiny" style={{ marginTop: 6 }}>
          Demo history fills ~6 weeks of fake sessions so PRs, totals and popularity have data.
          {' '}Sessions logged: {state.history.length}
        </div>
      </section>
    </div>
  );
}
