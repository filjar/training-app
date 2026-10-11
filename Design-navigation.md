# Navigation and visual design spec (draft 1)

Companion to [Description.md](Description.md). This covers how the app is organised and how screens
signal what the user can do. Nothing here is implemented yet. Items marked **Decision** are
choices that need a yes/no before building; each has a recommendation.

## The problem

- The Home tab (tap muscles to filter workouts) and the workout editor (tap muscles to pick or
  generate exercises) both show the 3D body above a list. They look alike but do different jobs, so
  it is unclear which one you are in.
- Workouts can be started from three places (Home, Plan, Workouts) and created in one, with no
  clear main path.
- Home opens on a tool (the body model) instead of an answer to "what do I do today?".
- Editable and read-only content look the same, and most screens have several equally loud
  buttons.

## Principles

1. **One job per screen.** Each screen is for deciding, choosing, doing, or managing — never two.
2. **The body model appears in one flow only** (choosing a workout), plus as a non-interactive
   picture where it shows load.
3. **One primary button per screen.** It is the only filled accent-coloured control.
4. **Editable things look editable; information looks flat.** See "Visual rules".
5. **Flows are separate from tabs.** A flow is full-screen, has a back arrow and a title, and hides
   the tab bar.

## Structure

Four tabs, down from five:

| Tab | Job | Contains |
|---|---|---|
| **Today** | Decide and start | Today's suggested session, this week, "start a different workout" |
| **Plan** | See the schedule and the past | Schedule (this week, next week, sessions in the plan) and History |
| **Library** | Manage | Two segments: **Workouts** (saved workouts: edit, delete) and **Exercises** (the current exercise library) |
| **Settings** | Configure | As today |

Flows, opened from tabs and closed with back:

| Flow | Opened from | Ends in |
|---|---|---|
| **Choose a workout** | Today → "Start a different workout" | Workout preview |
| **Workout preview** | Any workout anywhere (Today, Plan, Library, Choose a workout) | Start, Edit or back |
| **Workout editor** | Preview → Edit, Library → New workout | Save or cancel |
| **Active workout** | Preview → Start | Finish summary |
| **Plan setup** | Plan → Change plan, Today (when no plan) | Plan tab |

**Decision 1 — merge the Workouts tab into Library.** Recommended: yes. Managing saved workouts is
occasional; starting one happens through Today. Alternative: keep five tabs with Workouts separate.

## Today (the landing page)

Read-only. Nothing on this screen is edited in place.

```
┌──────────────────────────────────┐
│ Sunday 11 Oct                    │
│ Full Body · 2 of 3 this week ●●○ │   plan name + week progress → opens Plan
├──────────────────────────────────┤
│ TODAY                            │
│ Full Body A              [body]  │   small static body picture shaded by load
│ Squat · Bench · Row · +3         │
│ 6 exercises · about 55 min       │
│ [        Start workout        ]  │   the one primary button
├──────────────────────────────────┤
│ M  T  W  T  F  S  S              │   compact week strip → opens Plan
│ ✓  ·  ✓  ·  A  ·  ·              │
├──────────────────────────────────┤
│ [ Start a different workout  › ] │   secondary button → Choose a workout
├──────────────────────────────────┤
│ Last session: Full Body B, Fri   │   one line → opens History
│ 52 min · 24 sets · 8.9 t         │
└──────────────────────────────────┘
```

States of the top card:

- **Planned session today:** as drawn.
- **Rest day:** "Rest day. Next: Full Body B on Wednesday", with a quiet "Do it today" link. The
  primary button becomes "Start a different workout".
- **Today already done:** summary of the finished session; no primary button.
- **No plan:** a "Set up a plan" card (opens Plan setup); the primary button is "Start a workout",
  which opens Choose a workout.
- **Workout in progress:** a "Resume workout" banner replaces the top card.

Tapping the today card (not the button) opens Workout preview.

## Choose a workout (the "not listed workout" flow)

The only interactive use of the body model. The user selects muscles once; the same selection then
offers three ways forward, so there are no look-alike modes to switch between.

```
┌──────────────────────────────────┐
│ ‹ Choose a workout               │
├──────────────────────────────────┤
│ 1  What do you want to train?    │
│          [ 3D body ]             │
│ Chest ✕  Triceps ✕   clear       │   chips mirror the model; body can be minimised
├──────────────────────────────────┤
│ 2  Pick how                      │
│                                  │
│ Your saved workouts (2 match)    │
│  Upper Body Pump             ›   │
│  Push                        ›   │
│                                  │
│ Build one for these muscles      │
│  Strength ─────●───── Endurance  │
│  [ Generate workout ]            │
│                                  │
│ Choose exercises yourself    ›   │   opens an exercise list filtered to the muscles
└──────────────────────────────────┘
```

- With no muscles selected: saved workouts lists everything, and the two build options are disabled
  with the hint "Pick at least one muscle".
- "Choose exercises yourself" opens a list of exercises for the selected muscles with an add
  button per row and a tray showing how many are added; "Review" goes to Workout preview.
- All three paths end at **Workout preview**. Nothing starts or saves from this screen directly.
- On laptop: body on the left, step 2 on the right.

## Workout preview

One screen for looking at any workout before doing something with it.

- Body picture shaded by load (darker red = more of the workout). This is where load shading
  lives; it moves here from Home.
- Exercise list with sets × reps @ weight. Read-only.
- Primary button: **Start**. Secondary: **Edit**. For a workout that is not saved yet: a
  **Save to library** switch.

**Decision 2 — unsaved (generated or hand-picked) workouts.** Recommended: they can be started
without saving, and the finish summary asks "Save this workout to your library?". Alternative:
always save on creation, which is simpler but fills the library with one-offs.

**Decision 3 — Strength↔Endurance control.** Plan setup uses three choices (Strength / Balanced /
Endurance) while the generator uses a slider. Recommended: the slider with those three labelled
stops, so both places use the same words. Alternative: three buttons everywhere.

## Visual rules

- **Primary action:** filled accent button, one per screen, full width on phone and at a
  consistent position (bottom of the top card or pinned to the bottom of a flow).
- **Secondary action:** outlined button. **Tertiary:** text link. **Destructive** (delete, remove
  plan, cancel workout): never a visible button next to the primary; in a "⋯" menu or at the bottom
  of the screen, with a confirm.
- **Tappable row:** ends in a chevron `›`. **Editable value:** shown in an input-style box.
  **Information:** plain text on the card, no border, no chevron.
- **Section header:** label on the left; if the section is editable, its action ("Edit", "Change")
  on the right of the header rather than scattered inside.
- **Numbered steps** ("1", "2") in flows where order matters (Choose a workout, Plan setup).
- **Empty states** always say what to do next and carry the button that does it.
- **Flow header:** back arrow, title, and nothing else except Save/Cancel in the editor.

**Decision 4 — colour.** Today the accent red is used for primary buttons, for selected muscles
and for workout load, so red means three things. Recommended: keep red for muscles and load only,
and move buttons and selection states to a second accent (for example a dark blue-grey or a
green-teal). Alternative: keep red everywhere and accept the overlap.

## 3D model direction

Goal: a body that looks like a person rather than a mannequin, with muscle regions shaped like
muscles rather than rounded rectangles, without making tapping harder.

Recommended approach, in two parts:

1. **Base body from MakeHuman (via the MPFB add-on for Blender).** It produces realistic,
   adjustable bodies (sex, muscle, weight, proportions) and its exports are CC0. All body shapes
   share one mesh layout, so woman, man and later body types can be variants of the same file.
2. **A painted muscle map instead of sticker patches.** One texture where each muscle is painted
   in its own flat colour. A tap is resolved by reading the map colour under the finger, and
   highlighting tints exactly that region. Because every body variant shares the layout, the map is
   painted once.

Rendering: a matte, single-tone "sculpture" material with soft lighting and visible muscle
definition, not photographic skin. It reads as athletic, avoids nudity concerns and keeps the red
highlights clear.

Alternatives considered:

| Option | Look | Muscle regions | Cost |
|---|---|---|---|
| MakeHuman + painted muscle map (recommended) | Realistic, adjustable body types | Anatomical, painted once | Blender work to export and paint the map |
| AI-generated body (Meshy) under the current patches | Realistic | Still rectangles, re-placed by hand per model | Lowest effort; least improvement to tapping |
| Segmented anatomy model (Z-Anatomy, or a bought écorché) | Skinless anatomy chart | Each muscle is its own mesh | Heavy files, clinical look, Z-Anatomy is share-alike licensed |

The muscle map needs Blender work (export, paint 14 regions, reduce the mesh to a phone-friendly
size). That is the main effort and the part to plan for.

## Out of scope for this spec

Sync, per-set editing in the editor, the active-workout screen, and custom plan building.
