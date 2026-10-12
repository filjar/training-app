import React, { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store.jsx';
import { DevModeContext } from './devmode.jsx';
import TodayTab from './components/TodayTab.jsx';
import PlanTab from './components/PlanTab.jsx';
import LibraryTab from './components/LibraryTab.jsx';
import WorkoutBuilder from './components/WorkoutBuilder.jsx';
import WorkoutPreview from './components/WorkoutPreview.jsx';
import WorkoutEditor from './components/WorkoutEditor.jsx';
import FinishSummary from './components/FinishSummary.jsx';
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
  { id: 'today', label: 'Today', icon: '🏠' },
  { id: 'plan', label: 'Plan', icon: '🗓️' },
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function AppInner({ mode }) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState('today');
  const [librarySegment, setLibrarySegment] = useState('workouts');
  // Flows are full-screen screens stacked on top of the tabs: the workout
  // builder, a workout preview, the editor. The last one is the one showing.
  const [flows, setFlows] = useState([]);
  const [finished, setFinished] = useState(null); // the workout just finished, for the summary

  const push = (flow) => setFlows((s) => [...s, flow]);
  const pop = () => setFlows((s) => s.slice(0, -1));
  const flow = flows[flows.length - 1] || null;

  const isSaved = (w) => state.workouts.some((x) => x.id === w.id);
  const openWorkout = (workout) => push({ type: 'preview', workout });
  const editWorkout = (workout) => push({ type: 'editor', workout });
  const startWorkout = (workout) => {
    dispatch({ type: 'startWorkout', workout });
    setFlows([]);
  };
  const finishWorkout = () => {
    setFinished({
      active: state.active,
      earlierHistory: state.history,
      durationSec: Math.round((Date.now() - state.active.startedAt) / 1000),
    });
    dispatch({ type: 'finishWorkout' });
  };
  // Saving an edit: a library workout is stored; an unsaved one only changes
  // the preview underneath the editor.
  const saveEdit = (workout) => {
    if (isSaved(workout)) dispatch({ type: 'saveWorkout', workout });
    setFlows((s) => s.slice(0, -1).map((f) => (f.type === 'preview' && f.workout.id === workout.id ? { ...f, workout } : f)));
  };
  const goTab = (id) => {
    setFlows([]);
    setTab(id);
  };

  let content;
  if (state.active) {
    content = <ActiveWorkout onFinish={finishWorkout} />;
  } else if (finished) {
    content = <FinishSummary finished={finished} onDone={() => { setFinished(null); goTab('today'); }} />;
  } else if (flow?.type === 'builder') {
    content = <WorkoutBuilder onBack={pop} onReview={openWorkout} />;
  } else if (flow?.type === 'preview') {
    // A library workout is shown as it is now, so edits made elsewhere show up.
    const workout = state.workouts.find((w) => w.id === flow.workout.id) || flow.workout;
    content = (
      <WorkoutPreview workout={workout} saved={isSaved(workout)} onBack={pop} onStart={startWorkout} onEdit={editWorkout} />
    );
  } else if (flow?.type === 'editor') {
    content = <WorkoutEditor initial={flow.workout} onCancel={pop} onSave={saveEdit} />;
  } else {
    content = (
      <>
        {tab === 'today' && (
          <TodayTab
            onStart={startWorkout}
            onOpen={openWorkout}
            onOpenPlan={() => setTab('plan')}
            onLibrary={() => { setLibrarySegment('workouts'); setTab('library'); }}
            onBuild={() => push({ type: 'builder' })}
          />
        )}
        {tab === 'plan' && <PlanTab onStart={startWorkout} onOpen={openWorkout} />}
        {tab === 'library' && (
          <LibraryTab
            segment={librarySegment}
            onSegment={setLibrarySegment}
            onOpen={openWorkout}
            onEdit={editWorkout}
            onNew={() => push({ type: 'builder' })}
          />
        )}
        {tab === 'settings' && <SettingsTab />}
      </>
    );
  }

  // Tabs step aside for anything full-screen. On the laptop the sidebar stays
  // (there is room) and doubles as a way out of a flow.
  const busy = !!state.active || !!finished;
  const fullScreen = busy || !!flow;
  const nav = (
    <nav className={mode === 'phone' ? 'tabbar' : 'sidebar'}>
      {mode === 'laptop' && <div className="brand">💪 Training</div>}
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`nav-btn ${tab === t.id && !fullScreen ? 'nav-active' : ''}`}
          disabled={busy}
          onClick={() => goTab(t.id)}
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
      {mode === 'phone' && !fullScreen && nav}
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
