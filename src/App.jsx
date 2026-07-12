import React, { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store.jsx';
import MainTab from './components/MainTab.jsx';
import LibraryTab from './components/LibraryTab.jsx';
import WorkoutsTab from './components/WorkoutsTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';
import ActiveWorkout from './components/ActiveWorkout.jsx';

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'workouts', label: 'Workouts', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function AppInner({ mode }) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState('home');

  const startWorkout = (w) => dispatch({ type: 'startWorkout', workout: w });

  let content;
  if (state.active) {
    content = <ActiveWorkout />;
  } else {
    content = (
      <>
        {tab === 'home' && <MainTab onStart={startWorkout} />}
        {tab === 'library' && <LibraryTab />}
        {tab === 'workouts' && <WorkoutsTab onStart={startWorkout} />}
        {tab === 'settings' && <SettingsTab />}
      </>
    );
  }

  const nav = (
    <nav className={mode === 'phone' ? 'tabbar' : 'sidebar'}>
      {mode === 'laptop' && <div className="brand">💪 Training</div>}
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`nav-btn ${tab === t.id && !state.active ? 'nav-active' : ''}`}
          disabled={!!state.active}
          onClick={() => setTab(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
      {state.active && <div className="nav-note muted tiny">workout in progress</div>}
    </nav>
  );

  return (
    <div className={`app mode-${mode}`}>
      {mode === 'laptop' && nav}
      <main className="content">{content}</main>
      {mode === 'phone' && nav}
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('dev-mode') || 'laptop');
  useEffect(() => localStorage.setItem('dev-mode', mode), [mode]);

  return (
    <StoreProvider>
      {/* dev-only toggle, not part of the app itself */}
      <button
        className="dev-toggle"
        title="Dev only: toggle phone/laptop layout"
        onClick={() => setMode(mode === 'phone' ? 'laptop' : 'phone')}
      >
        {mode === 'phone' ? '📱 phone — switch to 💻' : '💻 laptop — switch to 📱'}
      </button>
      {mode === 'phone' ? (
        <div className="phone-stage">
          <div className="phone-frame">
            <div className="phone-notch" />
            <AppInner mode="phone" />
          </div>
        </div>
      ) : (
        <AppInner mode="laptop" />
      )}
    </StoreProvider>
  );
}
