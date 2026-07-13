import React, { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store.jsx';
import { DevModeContext } from './devmode.jsx';
import MainTab from './components/MainTab.jsx';
import LibraryTab from './components/LibraryTab.jsx';
import WorkoutsTab from './components/WorkoutsTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';
import ActiveWorkout from './components/ActiveWorkout.jsx';

const PHONE_QUERY = '(max-width: 768px)';

// Picks the layout from the actual screen size, updating on resize/rotate.
function useViewportMode() {
  const [mode, setMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches ? 'phone' : 'laptop',
  );
  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY);
    const onChange = (e) => setMode(e.matches ? 'phone' : 'laptop');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mode;
}

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
  const isDev = import.meta.env.DEV;
  const viewportMode = useViewportMode();

  // Dev-only override so the layouts can be previewed on a laptop without
  // resizing the window. Ignored entirely in production, where the layout just
  // follows the real screen size.
  const [override, setOverride] = useState(() =>
    isDev ? localStorage.getItem('dev-mode') || null : null,
  );
  useEffect(() => {
    if (!isDev) return;
    if (override) localStorage.setItem('dev-mode', override);
    else localStorage.removeItem('dev-mode');
  }, [isDev, override]);

  const mode = (isDev && override) || viewportMode;

  // Draw the simulated phone bezel only when forcing phone mode on a wide
  // screen during development — never in the shipped app.
  const simulate = isDev && mode === 'phone' && viewportMode === 'laptop';

  return (
    <StoreProvider>
      <DevModeContext.Provider value={{ isDev, mode, override, setOverride }}>
        {simulate ? (
          <div className="phone-stage">
            <div className="phone-frame">
              <div className="phone-notch" />
              <AppInner mode="phone" />
            </div>
          </div>
        ) : (
          <AppInner mode={mode} />
        )}
      </DevModeContext.Provider>
    </StoreProvider>
  );
}
