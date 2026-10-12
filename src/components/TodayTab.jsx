import React, { useMemo, useState } from 'react';
import { useStore } from '../store.jsx';
import { exerciseById } from '../data/exercises.js';
import { planSchedule, recentSessions } from '../logic/plan.js';
import { muscleLoad, estimateMinutes, fmtTotal } from '../logic/stats.js';
import { BodyPicture } from './BodyModel.jsx';
import { WeekStrip } from './PlanTab.jsx';

const exerciseLine = (workout, max = 3) => {
  const names = workout.exercises.map((wx) => exerciseById[wx.exerciseId]?.name).filter(Boolean);
  return names.length > max ? `${names.slice(0, max).join(' · ')} · +${names.length - max}` : names.join(' · ');
};

// The two ways to start something that isn't the planned session.
function CustomSheet({ onClose, onLibrary, onBuild }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Start a custom workout</h2>
        <button className="row-link" onClick={onLibrary}>
          <span>
            <strong>From my library</strong>
            <span className="muted small">Pick one of your saved workouts</span>
          </span>
          <span className="chevron">›</span>
        </button>
        <button className="row-link" onClick={onBuild}>
          <span>
            <strong>Build a new one</strong>
            <span className="muted small">Choose muscles and generate, or pick exercises</span>
          </span>
          <span className="chevron">›</span>
        </button>
      </div>
    </div>
  );
}

export default function TodayTab({ onStart, onOpen, onOpenPlan, onLibrary, onBuild }) {
  const { state } = useStore();
  const { plan, history, workouts, settings } = state;
  const [sheet, setSheet] = useState(false);

  const schedule = useMemo(() => (plan ? planSchedule(plan, history) : null), [plan, history]);
  const last = useMemo(() => recentSessions(history, 1)[0] || null, [history]);
  const today = new Date();
  const doneToday = last && new Date(last.date).toDateString() === today.toDateString() ? last : null;

  const next = schedule?.nextUp || null;
  const nextWorkout = next && workouts.find((w) => w.id === next.slot.workoutId);
  const plannedToday = !doneToday && next?.isToday && nextWorkout ? nextWorkout : null;
  const doneThisWeek = schedule ? schedule.thisWeek.reduce((n, d) => n + d.sessions.length, 0) : 0;

  const customButton = (primary) => (
    <button className={`btn full ${primary ? 'primary' : 'row-btn'}`} onClick={() => setSheet(true)}>
      Start a custom workout{!primary && <span className="chevron">›</span>}
    </button>
  );

  return (
    <div className="tab-page today">
      <div className="today-head">
        <h1>{today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</h1>
        {plan && (
          <button className="today-plan" onClick={onOpenPlan}>
            {plan.name} · {doneThisWeek} of {plan.weekdays.length} this week
            <span className="history-dots">
              {Array.from({ length: Math.max(plan.weekdays.length, doneThisWeek) }, (_, i) => (
                <span key={i} className={`history-dot ${i < doneThisWeek ? 'on' : ''}`} />
              ))}
            </span>
          </button>
        )}
      </div>

      {doneToday ? (
        <div className="card today-card">
          <div className="eyebrow">Done today</div>
          <div className="today-title">{doneToday.name}</div>
          <div className="muted small">
            {Math.round(doneToday.durationSec / 60)} min · {doneToday.sets} sets · {fmtTotal(doneToday.volume)}
          </div>
        </div>
      ) : plannedToday ? (
        <div className="card today-card">
          <div className="today-card-main" onClick={() => onOpen(plannedToday)}>
            <div>
              <div className="eyebrow">Today</div>
              <div className="today-title">{plannedToday.name}</div>
              <div className="small">{exerciseLine(plannedToday)}</div>
              <div className="muted small">
                {plannedToday.exercises.length} exercises · about {estimateMinutes(plannedToday)} min
              </div>
            </div>
            <BodyPicture bodyType={settings.bodyType} highlights={muscleLoad(plannedToday)} height={112} />
          </div>
          <button className="btn primary full" onClick={() => onStart(plannedToday)}>Start workout</button>
        </div>
      ) : plan ? (
        <div className="card today-card">
          <div className="eyebrow">Rest day</div>
          {next && nextWorkout ? (
            <div className="small">
              Next: <strong>{nextWorkout.name}</strong> on {next.date.toLocaleDateString(undefined, { weekday: 'long' })}.{' '}
              <button className="link-btn" onClick={() => onOpen(nextWorkout)}>Do it today</button>
            </div>
          ) : (
            <div className="small muted">Nothing planned.</div>
          )}
          {customButton(true)}
        </div>
      ) : (
        <div className="card today-card">
          <div className="eyebrow">No plan yet</div>
          <div className="small">A plan decides which workout you do on which day.</div>
          <button className="btn row-btn full" onClick={onOpenPlan}>Set up a plan<span className="chevron">›</span></button>
          {customButton(true)}
        </div>
      )}

      {schedule && (
        <div className="today-week" onClick={onOpenPlan}>
          <WeekStrip days={schedule.thisWeek} />
        </div>
      )}

      {(doneToday || plannedToday) && customButton(false)}

      {last && !doneToday && (
        <button className="today-last" onClick={onOpenPlan}>
          <span>Last session: <strong>{last.name}</strong>, {new Date(last.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <span className="muted small">{Math.round(last.durationSec / 60)} min · {last.sets} sets · {fmtTotal(last.volume)}</span>
        </button>
      )}

      {sheet && (
        <CustomSheet
          onClose={() => setSheet(false)}
          onLibrary={() => { setSheet(false); onLibrary(); }}
          onBuild={() => { setSheet(false); onBuild(); }}
        />
      )}
    </div>
  );
}
