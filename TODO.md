# To do

Written 12 Oct 2026, at the end of the session that added plans, the new navigation, the teal
theme and the MakeHuman body. The design these items refer to is in
[Design-navigation.md](Design-navigation.md); the original brief is [Description.md](Description.md).

## Suggested start for next session

1. Do one real workout on the phone with the deployed app and note what gets in the way. Several
   items below ("needs checking on a phone") are guesses until then.
2. Fix what that turns up on the during-workout screen; it is the screen used most and has had
   the least attention.
3. Finish the leftovers from the navigation spec.

## Started, not finished

### Navigation and visual spec

Listed under "Not built yet" in the spec.

- [ ] Workout editor: remove its own body picker (the builder now covers adding by muscle) or
      decide it stays; today it is a second, different-looking way to pick muscles.
- [ ] Workout editor: per-set reps and weight. It still sets all sets of an exercise at once.
- [ ] Plan tab: split into Schedule and History segments.
- [ ] Plan tab: tapping a plan session should open Workout preview, not the editor.
- [ ] Destructive actions ("Remove plan", "Cancel workout", "Reset all data") behind a "⋯" menu
      or at the bottom of the screen instead of next to primary buttons.
- [ ] Rest-day card: "Do it today" opens the preview; the spec wanted a direct start.
- [ ] Decide: the Library filter shows workouts that train *all* selected muscles. The old Home
      filter matched *any*. Pick one.
- [ ] Visual rules pass: one primary button per screen, chevrons on every tappable row, section
      headers with their action on the right. Applied on the new screens only, not Plan,
      Settings or the editor.

### Never exercised in testing

- [ ] Today card on a rest day, and after a workout is done that day.
- [ ] Workout builder → "Choose exercises myself" → Review.
- [ ] Editing an unsaved workout from the preview, then starting it.
- [ ] The man body in the app since the arms were lowered.
- [ ] Laptop layout of Today, the builder, preview and finish summary (only the Library was
      looked at).

### 3D body

- [ ] Woman's chest reads as muscular pecs rather than a natural athletic chest.
- [ ] Man still shows faint nipple marks; the smoothing that worked on the woman did not fully
      take.
- [ ] Thigh and back definition is soft next to the abs and arms.
- [ ] Region shapes: glutes region is wide, obliques are boxy.
- [ ] Needs checking on a phone: are biceps, triceps and lats still easy to tap now that the arms
      hang closer to the body?
- [ ] No feedback at the point of a tap (no muscle name, no hover highlight on laptop).
- [ ] The body spins around one axis only; there is no way to look from above or below.
- [ ] Each body is about 1.7 MB (4.2 MB offline download in total). Shrink if first load on
      mobile data is slow.
- [ ] Only two body types. The brief asks for a body type setting; each new type is a set of
      MakeHuman sliders in `scripts/body/build_body.py`.

### Plans

- [ ] Curate the plan content in `src/data/plans.js`. Exercise lists, the three goal levels and
      the default weekdays are a first guess.
- [ ] Switching or removing a plan deletes the workouts it generated, including your edits.
      Decide whether edited ones should be kept.
- [ ] The schedule looks one week ahead only; the brief mentions weeks and months.
- [ ] No way to build a custom split for someone who knows exactly what they want.
- [ ] No way to change training days or goal without recreating the plan.

## Not handled yet

### During a workout

- [ ] Needs checking on a phone: drag to reorder exercises uses desktop-style drag and drop and
      is likely unreliable on touch.
- [ ] Weights and reps changed during a workout are stored in history but not written back to
      the saved workout, so the next session starts from the old numbers.
- [ ] Only the last set of an exercise can be removed.
- [ ] Rest timer is manual start only, with no sound or vibration when rest is over.
- [ ] The screen can go to sleep mid-workout.
- [ ] "Finish" has no confirmation.
- [ ] Code: `ActiveWorkout` reads the active workout before checking it exists; safe only because
      the app never shows it without one.

### History

- [ ] No way to open a past session and see what was done set by set.
- [ ] No per-exercise progress over time (the PRs exist, a trend does not).

### Sync between devices

- [ ] It is a one-way transfer that replaces the receiving device's data. The brief asks for
      sync: training on the phone and editing on the laptop should merge.
- [ ] A long history does not fit in the QR code and falls back to file transfer.

### Exercises

- [ ] The library has about 40 exercises; several muscle groups have only two.
- [ ] No way to add your own exercise.
- [ ] Forearms was removed as a muscle group. Wrist Curl sits alone under "Grip". Decide whether
      Forearms comes back or Grip grows.

### General

- [ ] Weights are kg only.
- [ ] The laptop layout has no extra capabilities; the brief suggests a more advanced laptop UI.
- [ ] No automated tests.
- [ ] The app's script is about 800 KB, most of it the 3D library; it could be loaded only when
      a body is shown.

## Housekeeping

- [ ] The data on `localhost:5173` on this Mac holds a Full Body plan and demo history loaded
      twice, left over from testing. "Reset all data" in Settings clears it.
- [ ] The home-screen icon on the phone stays red until the app is removed and added again.
