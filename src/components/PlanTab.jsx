import React, { useMemo, useState } from 'react';
import { useStore } from '../store.jsx';
import { MUSCLE_GROUPS, exerciseById } from '../data/exercises.js';
import { PLAN_TEMPLATES, GOALS, WEEKDAYS, planTemplateById } from '../data/plans.js';
import { createPlan, planSchedule, recentSessions, weekSummaries, muscleSets } from '../logic/plan.js';
import { fmtTotal } from '../logic/stats.js';
import WorkoutEditor from './WorkoutEditor.jsx';

const fmtDay = (d) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

// ---------- setup: pick a curated plan ----------

function PlanSetup({ current, onCancel, onCreate }) {
  const [templateId, setTemplateId] = useState(current?.templateId || 'full-body');
  const template = planTemplateById[templateId];
  const [days, setDays] = useState(current?.daysPerWeek || template.defaultDays);
  const [goal, setGoal] = useState(current?.goal || 'balanced');
  const [weekdays, setWeekdays] = useState(current?.weekdays || template.dayOptions[template.defaultDays]);

  const pickTemplate = (t) => {
    setTemplateId(t.id);
    setDays(t.defaultDays);
    setWeekdays(t.dayOptions[t.defaultDays]);
  };
  const pickDays = (n) => {
    setDays(n);
    setWeekdays(template.dayOptions[n]);
  };
  const toggleDay = (i) =>
    setWeekdays((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  const dayChoices = Object.keys(template.dayOptions).map(Number);
  const ready = weekdays.length === days;

  return (
    <div className="tab-page">
      <div className="editor-header">
        <h1>{current ? 'Change plan' : 'Pick a training plan'}</h1>
        {onCancel && <button className="btn ghost" onClick={onCancel}>Cancel</button>}
      </div>
      <div className="muted small">
        A plan decides which workout you do on which day. Pick one and the workouts are built for you.
      </div>

      <div className="card-grid plan-templates">
        {PLAN_TEMPLATES.map((t) => (
          <div
            key={t.id}
            className={`card workout-card selectable ${t.id === templateId ? 'selected' : ''}`}
            onClick={() => pickTemplate(t)}
          >
            <div className="card-title">{t.name}</div>
            <div className="muted tiny plan-best-for">{t.bestFor}</div>
            <div className="small">{t.blurb}</div>
            <div className="muted tiny">{t.slots.map((s) => s.label).join(' · ')}</div>
          </div>
        ))}
      </div>

      <div className="card plan-options">
        {dayChoices.length > 1 && (
          <>
            <h3>Days per week</h3>
            <div className="seg-row">
              {dayChoices.map((n) => (
                <button key={n} className={`seg ${n === days ? 'seg-active' : ''}`} onClick={() => pickDays(n)}>{n} days</button>
              ))}
            </div>
          </>
        )}

        <h3>Goal</h3>
        <div className="seg-row">
          {GOALS.map((g) => (
            <button key={g.id} className={`seg ${g.id === goal ? 'seg-active' : ''}`} onClick={() => setGoal(g.id)}>{g.label}</button>
          ))}
        </div>
        <div className="muted small">{GOALS.find((g) => g.id === goal).blurb}</div>

        <h3>Training days</h3>
        <div className="chip-row">
          {WEEKDAYS.map((d, i) => (
            <button key={d} className={`chip ${weekdays.includes(i) ? 'chip-active' : ''}`} onClick={() => toggleDay(i)}>{d}</button>
          ))}
        </div>
        {!ready && <div className="muted small">Pick exactly {days} days ({weekdays.length} selected).</div>}

        <button
          className="btn primary full plan-create"
          disabled={!ready}
          onClick={() => onCreate(templateId, days, goal, weekdays)}
        >
          {current ? 'Switch to this plan' : 'Create plan'}
        </button>
      </div>
    </div>
  );
}

// ---------- week strip ----------

const STATUS_LABEL = { done: 'Done', missed: 'Missed', today: 'Today', upcoming: 'Planned', rest: 'Rest' };

export function WeekStrip({ days }) {
  return (
    <div className="week-strip">
      {days.map((d) => (
        <div key={d.date.getTime()} className={`week-day status-${d.status} ${d.isToday ? 'is-today' : ''}`}>
          <div className="week-day-name">{WEEKDAYS[(d.date.getDay() + 6) % 7]}</div>
          <div className="week-day-num">{d.date.getDate()}</div>
          <div className="week-day-label">
            {d.status === 'done' ? `✓ ${d.sessions.map((s) => s.name).join(', ')}` : d.slot ? d.slot.label : STATUS_LABEL[d.status]}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- history summary ----------

function HistorySummary({ history, target }) {
  const weeks = useMemo(() => weekSummaries(history), [history]);
  const recent = useMemo(() => recentSessions(history), [history]);
  const muscles = useMemo(() => muscleSets(history), [history]);
  const maxSets = Math.max(1, ...Object.values(muscles));

  if (history.length === 0) {
    return <div className="muted small">No sessions logged yet — finish a workout and it shows up here.</div>;
  }

  return (
    <>
      <div className="card">
        <h3>Last 4 weeks</h3>
        {weeks.map((w, i) => (
          <div key={w.start.getTime()} className="history-week">
            <span className="history-week-name">{i === weeks.length - 1 ? 'This week' : `Week of ${w.start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}</span>
            <span className="history-dots">
              {Array.from({ length: Math.max(target || 0, w.sessions) }, (_, j) => (
                <span key={j} className={`history-dot ${j < w.sessions ? 'on' : ''}`} />
              ))}
            </span>
            <span className="muted small history-week-stats">
              {w.sessions}{target ? `/${target}` : ''} sessions · {w.sets} sets · {fmtTotal(w.volume)}
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Muscles trained, last 14 days</h3>
        <div className="muscle-bars">
          {MUSCLE_GROUPS.map((m) => (
            <div key={m} className="muscle-bar-row">
              <span className="muscle-bar-name">{m}</span>
              <span className="muscle-bar"><span className="muscle-bar-fill" style={{ width: `${((muscles[m] || 0) / maxSets) * 100}%` }} /></span>
              <span className="muted tiny muscle-bar-val">{Math.round(muscles[m] || 0)} sets</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Recent sessions</h3>
        <ul className="plain-list">
          {recent.map((s) => (
            <li key={s.id} className="row space-between gap">
              <span><strong>{s.name}</strong> <span className="muted small">{fmtDay(new Date(s.date))}</span></span>
              <span className="muted small">{Math.round(s.durationSec / 60)} min · {s.sets} sets · {fmtTotal(s.volume)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// ---------- tab ----------

export default function PlanTab({ onStart, onOpen }) {
  const { state, dispatch } = useStore();
  const { plan, history, workouts } = state;
  const [choosing, setChoosing] = useState(false);
  const [editing, setEditing] = useState(null);

  const schedule = useMemo(() => (plan ? planSchedule(plan, history) : null), [plan, history]);

  if (editing) {
    return (
      <WorkoutEditor
        initial={editing}
        onCancel={() => setEditing(null)}
        onSave={(w) => {
          dispatch({ type: 'saveWorkout', workout: w });
          setEditing(null);
        }}
      />
    );
  }

  if (!plan || choosing) {
    return (
      <>
        <PlanSetup
          current={plan}
          onCancel={plan ? () => setChoosing(false) : null}
          onCreate={(templateId, days, goal, weekdays) => {
            if (plan && !confirm('Switch plan? The workouts your current plan created will be replaced.')) return;
            dispatch({ type: 'setPlan', ...createPlan(templateId, days, goal, weekdays, history) });
            setChoosing(false);
          }}
        />
        {!plan && (
          <div className="tab-page plan-history">
            <h2>History</h2>
            <HistorySummary history={history} />
          </div>
        )}
      </>
    );
  }

  const workoutFor = (slot) => workouts.find((w) => w.id === slot.workoutId) || null;
  const nextWorkout = schedule.nextUp && workoutFor(schedule.nextUp.slot);
  const goal = GOALS.find((g) => g.id === plan.goal);
  const setSlotWorkout = (key, workoutId) =>
    dispatch({ type: 'updatePlan', patch: { slots: plan.slots.map((s) => (s.key === key ? { ...s, workoutId } : s)) } });

  return (
    <div className="tab-page plan-tab">
      <div className="editor-header">
        <div>
          <h1>{plan.name}</h1>
          <div className="muted small">
            {plan.weekdays.length} days a week ({plan.weekdays.map((d) => WEEKDAYS[d]).join(', ')}) · {goal?.label}
          </div>
        </div>
        <div className="row gap">
          <button className="btn small" onClick={() => setChoosing(true)}>Change plan</button>
          <button
            className="btn small danger-ghost"
            onClick={() => confirm('Remove this plan? The workouts it created will be removed too. Your history is kept.') && dispatch({ type: 'clearPlan' })}
          >
            Remove
          </button>
        </div>
      </div>

      {schedule.nextUp && (
        <div className="card next-up">
          <div className="muted tiny">NEXT UP · {schedule.nextUp.isToday ? 'today' : fmtDay(schedule.nextUp.date)}</div>
          <div className="row space-between gap">
            <div>
              {nextWorkout ? (
                <button className="link-btn next-up-name" onClick={() => onOpen(nextWorkout)}>{nextWorkout.name} ›</button>
              ) : (
                <div className="next-up-name">{schedule.nextUp.slot.label}</div>
              )}
              <div className="muted small">
                {nextWorkout
                  ? nextWorkout.exercises.map((wx) => exerciseById[wx.exerciseId]?.name).filter(Boolean).join(' · ')
                  : 'This session has no workout — pick one under Sessions below.'}
              </div>
            </div>
            {nextWorkout && <button className="btn primary" onClick={() => onStart(nextWorkout)}>Start</button>}
          </div>
        </div>
      )}

      <h2>This week</h2>
      <WeekStrip days={schedule.thisWeek} />
      <h2>Next week</h2>
      <WeekStrip days={schedule.nextWeek} />

      <h2>Sessions in this plan</h2>
      <div className="muted small">
        Sessions rotate in this order. Edit a workout to fine-tune it, or swap in any workout you have saved.
      </div>
      <div className="card-grid plan-slots">
        {plan.slots.map((slot, i) => {
          const w = workoutFor(slot);
          return (
            <div key={slot.key} className="card">
              <div className="row space-between gap">
                <div className="card-title">{i + 1}. {slot.label}</div>
                {w && <button className="btn small" onClick={() => setEditing(JSON.parse(JSON.stringify(w)))}>Edit</button>}
              </div>
              <div className="muted small plan-slot-exercises">
                {w ? w.exercises.map((wx) => `${exerciseById[wx.exerciseId]?.name} ${wx.sets.length}×${wx.sets[0]?.reps}`).join(' · ') : 'Workout was deleted.'}
              </div>
              <select className="input" value={w ? w.id : ''} onChange={(e) => setSlotWorkout(slot.key, e.target.value)}>
                {!w && <option value="">Pick a workout…</option>}
                {workouts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </div>
          );
        })}
      </div>

      <h2>History</h2>
      <div className="plan-history-cards">
        <HistorySummary history={history} target={plan.weekdays.length} />
      </div>
    </div>
  );
}
