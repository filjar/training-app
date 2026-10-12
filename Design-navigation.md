# Navigation and visual design spec (draft 4)

Companion to [Description.md](Description.md). This covers how the app is organised and how screens
signal what the user can do.

**Status (12 Oct 2026):** built, in a first version: the four tabs, Today, the custom-workout
sheet, Library with saved workouts, the Workout builder, Workout preview, Finish summary, the teal
theme, and the three 3D changes (Forearms removed, arms lowered, inertia). "Not built yet" at the
end lists what the spec asks for that the app does not do yet.

## Decisions

| # | Topic | Decided |
|---|---|---|
| 1 | Tabs and starting a workout | Workouts merges into Library. From the home screen the user starts the planned workout, or starts a custom one, which leads to either the library or the workout builder. |
| 1b | Body as a filter | The body can always be used to filter by muscle, including in the Library. |
| 2 | Unsaved workouts | Can be started without saving; the finish summary asks "Save this workout?". |
| 3 | Strength↔Endurance control | A slider with three labelled stops: Strength, Balanced, Endurance. |
| 4 | Colour | Teal for buttons and other controls. Red and shades of red only for muscles. |
| 5 | Pose and motion | Arms lowered. The body moves with inertia: spun fast, skin and muscle lag and settle. |
| 6 | Muscle groups | Forearms removed for now, leaving 13. It can come back if exercises need it. |

## The problem

- The Home tab (tap muscles to filter workouts) and the workout editor (tap muscles to pick or
  generate exercises) both show the 3D body above a list. They look alike but do different jobs, so
  it is unclear which one you are in.
- Workouts can be started from three places (Home, Plan, Workouts) and created in one, with no
  clear main path.
- Red is used for buttons, for selected muscles and for workout load, so it means three things.
- Home opens on a tool (the body model) instead of an answer to "what do I do today?".
- Editable and read-only content look the same, and most screens have several equally loud
  buttons.

## Principles

1. **One job per screen.** Each screen is for deciding, choosing, doing, or managing — never two.
2. **The interactive body means "pick muscles", everywhere.** It builds a workout in the Workout
   builder and filters saved workouts in the Library; the two screens are told apart by their
   titles and by what sits under the body. Where a workout's load is shown, the body is a small
   non-interactive picture.
3. **One primary button per screen.** It is the only filled teal control.
4. **Editable things look editable; information looks flat.** See "Visual rules".
5. **Flows are separate from tabs.** A flow is full-screen, has a back arrow and a title, and hides
   the tab bar.

## Structure

Four tabs, down from five:

| Tab | Job | Contains |
|---|---|---|
| **Today** | Decide and start | Today's planned session, this week, "start a custom workout" |
| **Plan** | See the schedule and the past | Schedule (this week, next week, sessions in the plan) and History |
| **Library** | Find and manage | Two segments: **Workouts** (saved workouts: start, edit, delete) and **Exercises** (the current exercise library) |
| **Settings** | Configure | As today |

Flows, opened from tabs and closed with back:

| Flow | Opened from | Ends in |
|---|---|---|
| **Workout builder** | Today → "Start a custom workout" → "Build a new one"; Library → New workout | Workout preview |
| **Workout preview** | Any workout anywhere (Today, Plan, Library, Workout builder) | Start, Edit or back |
| **Workout editor** | Preview → Edit | Save or cancel |
| **Active workout** | Preview → Start | Finish summary |
| **Finish summary** | Active workout → Finish | Today |
| **Plan setup** | Plan → Change plan, Today (when no plan) | Plan tab |

## Today (the landing page)

Read-only. Nothing on this screen is edited in place. It offers exactly two ways to train: the
planned workout, or a custom one.

```
┌──────────────────────────────────┐
│ Monday 12 Oct                    │
│ Full Body · 2 of 3 this week ●●○ │   plan name + week progress → opens Plan
├──────────────────────────────────┤
│ TODAY                            │
│ Full Body A              [body]  │   small static body picture shaded by load
│ Squat · Bench · Row · +3         │
│ 6 exercises · about 55 min       │
│ [        Start workout        ]  │   the one primary (teal) button
├──────────────────────────────────┤
│ M  T  W  T  F  S  S              │   compact week strip → opens Plan
│ ✓  ·  ✓  ·  A  ·  ·              │
├──────────────────────────────────┤
│ [ Start a custom workout     › ] │   secondary button → the choice below
├──────────────────────────────────┤
│ Last session: Full Body B, Fri   │   one line → opens History
│ 52 min · 24 sets · 8.9 t         │
└──────────────────────────────────┘
```

States of the top card:

- **Planned session today:** as drawn.
- **Rest day:** "Rest day. Next: Full Body B on Wednesday", with a quiet "Do it today" link. The
  primary button becomes "Start a custom workout".
- **Today already done:** summary of the finished session; no primary button.
- **No plan:** a "Set up a plan" card (opens Plan setup); the primary button is "Start a custom
  workout".
- **Workout in progress:** a "Resume workout" banner replaces the top card.

Tapping the today card (not the button) opens Workout preview.

### Start a custom workout

The button opens a small sheet with two choices, each a full-width row with one line of
explanation:

```
┌──────────────────────────────────┐
│ Start a custom workout           │
│                                  │
│ From my library              ›   │   Pick one of your saved workouts
│ Build a new one              ›   │   Choose muscles and generate, or pick exercises
└──────────────────────────────────┘
```

- **From my library** opens the Library tab on the Workouts segment.
- **Build a new one** opens the Workout builder.

## Library

- **Workouts segment:** the saved workouts as tappable rows (name, exercises, muscles). Tapping
  a row opens Workout preview, where Start and Edit live. "New workout" in the header opens the
  Workout builder. Delete sits in a "⋯" menu on each row.
- **Filter by muscle:** the 3D body, minimised to a "Filter by muscle" bar until opened, with a
  row of muscle chips under it. Muscles picked on either narrow the list to workouts that train
  all of them.
- **Exercises segment:** the current exercise library, unchanged.

## Workout builder

Makes a new workout, either generated or assembled by hand, and always ends at Workout preview.

The body is the existing component with its existing controls: drag sideways to spin, pinch or
+/− to zoom, drag up/down to move along the body while zoomed, and "Hide body" to collapse it to
a one-line bar. At normal zoom a vertical swipe on the body scrolls the page.

```
┌──────────────────────────────────┐
│ ‹ Build a workout                │
├──────────────────────────────────┤
│ 1  What do you want to train?    │
│          [ 3D body ]             │
│ Chest ✕  Triceps ✕   clear       │   chips mirror the model and can also deselect
├──────────────────────────────────┤
│ 2  How do you want to build it?  │
│                                  │
│ Generate it for me               │
│  Strength ───●─── Endurance      │   three labelled stops (decision 3)
│  [ Generate workout ]            │   the one primary (teal) button
│                                  │
│ Choose exercises myself      ›   │   opens an exercise list filtered to the muscles
└──────────────────────────────────┘
```

- The chips under the body name what is selected (the body alone does not, since half of it faces
  away) and give a second way to deselect. An "All muscles" link opens the 13 muscle names as
  chips, to select without the body.
- With no muscles selected both options are disabled, with the hint "Pick at least one muscle".
- "Choose exercises myself" opens the exercises for the selected muscles with an add button per
  row and a tray showing how many are added; "Review" goes to Workout preview.
- Nothing starts or saves from this screen directly.
- On laptop: body on the left, step 2 on the right.

## Workout preview

One screen for looking at any workout before doing something with it.

- Body picture shaded by load (darker red = more of the workout). This is where load shading
  lives; it moves here from Home. Front and back are shown side by side, not interactive, so the
  whole workout reads at a glance without spinning.
- Exercise list with sets × reps @ weight. Read-only.
- Primary button: **Start**. Secondary: **Edit**.
- A workout from the builder is not saved at this point (decision 2). It can be started as it is.

## Finish summary

Shown when a workout is finished, before returning to Today.

- What was done: duration, sets completed, total weight lifted, and any new rep PRs.
- For a workout that is not in the library: **"Save this workout?"** with a name field and Save /
  Not now. Saving stores it with the reps and weights actually used.
- Primary button: **Done**.

## Visual rules

- **Colour (decision 4):** teal is the app's control colour: primary buttons, selected tabs,
  selected chips and segments, links, progress, and the "next up" card. Red and its shades are
  reserved for muscles: selected muscles, workout load, and the muscle bars in History. Nothing
  that is not a muscle is red. Destructive actions use a plain dark text style with a confirm,
  not red. Green stays for "done" (completed sets, completed days). The app icon and browser
  theme colour change from red to teal with it. Starting point for the teal: `#0E8A84` with a
  pale tint `#E0F3F1` for backgrounds; to be tuned on screen next to the body.
- **Primary action:** filled teal button, one per screen, full width on phone and at a
  consistent position (bottom of the top card or pinned to the bottom of a flow).
- **Secondary action:** outlined button. **Tertiary:** text link. **Destructive** (delete, remove
  plan, cancel workout): never a visible button next to the primary; in a "⋯" menu or at the bottom
  of the screen, with a confirm.
- **Tappable row:** ends in a chevron `›`. **Editable value:** shown in an input-style box.
  **Information:** plain text on the card, no border, no chevron.
- **Section header:** label on the left; if the section is editable, its action ("Edit", "Change")
  on the right of the header rather than scattered inside.
- **Numbered steps** ("1", "2") in flows where order matters (Workout builder, Plan setup).
- **Empty states** always say what to do next and carry the button that does it.
- **Flow header:** back arrow, title, and nothing else except Save/Cancel in the editor.

## 3D model

### What exists

- **Bodies:** an athletic woman and an athletic man generated with MakeHuman, chosen in Settings.
  They render as a matte, single-tone sculpture with nipple and genital detail smoothed away.
- **Muscle definition in the mesh:** muscles are sculpted into the surface (six-pack, spine
  groove, heads of the quads, calves, lower back), so the body reads as muscular with nothing
  selected.
- **13 selectable muscle groups** (see below). Each has a thin outline when idle,
  fills red when selected, and fills light-to-dark red for workout load.
- **Regions are generated by rule**, not painted by hand as the first draft proposed. Painting
  needed an artist in Blender; rules could be scripted and re-run for every body type.
- **Controls:** spin, pinch zoom, pan while zoomed, hide/show, and forgiving taps (a tap just
  outside a muscle selects the nearest one).

### Decided changes (built)

**Remove Forearms (decision 6).** The 13 groups are Chest, Shoulders, Traps, Biceps, Triceps, Abs,
Obliques, Lats, Lower Back, Glutes, Quads, Hamstrings, Calves.

- The forearm is no longer outlined, selectable or shaded on the body.
- Forearms disappears from muscle chips, the workout filter, the generator, workout load and the
  "muscles trained" history, and from the "also works" list of every exercise.
- Existing history keeps its data; forearm sets just stop being counted anywhere.
- The two exercises that had Forearms as a main muscle: Wrist Curl now sits under a "Grip"
  heading in the exercise library, with no place on the body and never suggested by the
  generator. Farmer's Carry moved to Traps, its other main muscle.

**Lower the arms (decision 5).** Arms hang about 20–30° out from the body, palms facing the
thighs.

- The body then fills more of a phone screen at normal zoom.
- Biceps, triceps and lats must stay tappable; the gap between arm and torso must stay visible
  from the front and back.
- Applies to both bodies and to the still pictures.

**Inertia (decision 5).** The body should feel like it has mass.

- **Spin momentum:** letting go mid-swipe keeps the body turning and it eases to a stop; a fast
  flick turns it further than a slow drag. Touching it stops it at once.
- **Soft-tissue lag:** when the spin speeds up, slows down or reverses, muscle and soft tissue
  trail slightly behind the skeleton and then settle with a short, damped wobble. The faster the
  change, the bigger the movement.
- **Where:** strongest on chest, glutes, thighs, calves and upper arms; a little on the abdomen
  and back; none on head, hands, feet, knees and elbows.
- **How much:** barely noticeable, as on a body flexing for the pose: firm, not rubbery. An
  ordinary flick shifts the soft areas a little under a centimetre and a hard one about 1.5 cm,
  with a single small rebound, settled in under half a second. (Two earlier settings missed on
  either side: a tenth of this could not be seen, four times this looked like rubber.)
- **It must not get in the way:** outlines move with the surface; a tap is resolved against the
  body at rest, so wobble never changes which muscle is picked; no movement at all while the body
  is still.
- **Reduced motion:** when the device asks for reduced motion, spin momentum is shortened and the
  soft-tissue movement is off.
- The still pictures do not move.

### What is left

Ordered by how much each affects everyday use.

1. **Shape issues from the first review:** the woman's chest reads as muscular pecs rather than a
   natural athletic chest; the man still shows faint nipple marks; thigh and back definition is
   soft compared with the abs and arms.
2. **Region accuracy.** Borders are plausible but simplified: the glutes region is wide, the
   obliques are boxy. Forearms, front shins, inner thighs, neck, hands and feet are not
   selectable.
3. **Inertia tuning.** Judged by eye on a phone; the amounts are the `WOBBLE` and `SOFTNESS`
   values in the body component.
4. **Feedback when tapping.** There is no hover highlight on laptop and no name shown at the
   point of a tap; the chips cover naming.
5. **Download size.** Each body is about 1.7 MB. Fine on Wi-Fi; worth shrinking if first load on
   mobile data feels slow.
6. **More body types.** The spec in Description.md asks for a body type setting. Only two builds
   exist; each further type is a new set of MakeHuman sliders in the build script.

### Alternatives no longer pursued

An AI-generated body (Meshy) under hand-placed patches, and a segmented anatomy model (Z-Anatomy
or a bought écorché), were both considered before the MakeHuman route was chosen. Hand-painting
the regions remains possible later: the regions are data on the model, so an artist could replace
the generated ones without changes to the app.

## Not built yet

- **Rest-day "Do it today"** opens the workout's preview rather than starting it directly.
- **The workout editor** still has its own body for adding exercises, and still edits reps and
  weight for all sets of an exercise at once.
- **Plan tab:** not yet split into Schedule and History segments; editing a plan session still
  opens the editor directly rather than the preview.
- **Destructive actions:** "Remove plan" and "Cancel workout" are still visible buttons (now in a
  quiet grey), not behind a "⋯" menu.
- **Laptop:** the sidebar stays visible during flows, and doubles as a way out of them.

## Out of scope for this spec

Sync, per-set editing in the editor, the active-workout screen, and custom plan building.
