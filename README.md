# Training App

A workout planning and tracking app, described in [Description.md](Description.md).

## Run it

```bash
npm install   # first time only
npm run dev
```

Then open http://localhost:5173 in your browser. When it starts, Vite also prints a
**Network** URL like `http://192.168.x.x:5173` — that's the one your phone uses (see below).

## Open it on your phone (quick, same Wi-Fi)

For quick testing there's nothing to install — the phone just opens it in Safari/Chrome.

1. Keep `npm run dev` running on your Mac, and make sure your **phone is on the same Wi-Fi**.
2. In the app go to **Settings → Open on phone (QR) → "Open with my data"**.
3. Scan the QR code with your phone camera and tap the link.

That QR encodes your workouts (and settings) *inside the link*, so the phone opens the app with
your data already loaded. Nothing is uploaded — the data rides along in the URL fragment, which
never leaves your network. If your workout **history** is long it won't fit in a QR, so the code
falls back to *workouts + settings only*; to move a large history too, use **Settings → Move data
by file** (Export, AirDrop the JSON to your phone, Import).

## Install it as a real app (PWA)

The app is a **Progressive Web App**: added to a phone's home screen it launches with its own
icon, fullscreen (no browser bars), and works offline. Manifest, icons and a service worker are
all wired up (`vite.config.js` → `VitePWA`, icons in `public/`, regenerate with
`node scripts/gen-icons.mjs`).

**The one requirement is an `https` address** — browsers only enable offline install on a secure
origin (`localhost` is the only http exception). A plain `http://192.168.x.x` LAN address lets the
phone *open* the app but not fully *install* it.

### Deploy to GitHub Pages (free https, set up for you)

The app is deployed at **<https://filjar.github.io/training-app/>**. A GitHub Actions workflow
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) builds it and publishes it to
Pages on every push to `main`, so `git push` is the whole deploy — the new version is live about a
minute later. The base path auto-matches the repo name (and a repo named `<user>.github.io` is
served at the root instead).

Setting this up for a new repo: push it to GitHub, then **Settings → Pages → Build and
deployment → Source: GitHub Actions**.

### Or: temporary https tunnel (test from your phone right now, no deploy)

With the dev server running: `npx cloudflared tunnel --url http://localhost:5173`
(or `ngrok http 5173`) prints an `https://…` URL you can open/scan and install from your phone.

### Installing, once you're on https

**Settings → Open on phone → "Install / share app"** shows a QR of the public URL. Anyone —
iPhone or Android, anywhere — can scan it to open the app, then:
- **iPhone (Safari):** Share → **Add to Home Screen**
- **Android (Chrome):** ⋮ menu → **Install app**

## Layout: responsive, with a dev-only preview toggle

The app is **responsive**: it renders the phone layout (bottom tab bar, stacked, bottom-sheet rest
timer) on narrow screens and the laptop layout (sidebar, side-by-side, multi-column library) on
wide ones — driven by the real viewport width. The shipped app has no toggle and no fake phone
frame.

During development only (`npm run dev`), **Settings → Developer (preview build)** has a
**Layout preview** control — *Auto (screen) / Phone / Laptop* — so you can preview either layout on
your laptop. Forcing **Phone** on a wide screen draws a simulated phone bezel to show the mobile
size. This whole section is gated behind `import.meta.env.DEV`, so it never appears in the deployed
build.

## What's in the app

The design behind the screens is in [Design-navigation.md](Design-navigation.md); open work is
listed in [TODO.md](TODO.md).

- **Today** — the landing page. Shows today's planned session with a front-and-back picture of
  the muscles it trains and one Start button, this week at a glance, and "Start a custom workout",
  which offers two ways: from your library, or build a new one.
- **Plan** — pick a curated training plan (Full Body, Upper / Lower, Push / Pull / Legs), the
  days per week, a goal (Strength / Balanced / Endurance) and your training days; the workouts are
  built for you. Shows this week and next week (done / missed / planned / rest), the next session,
  and a history summary: sessions per week against your target, sets per muscle over the last 14
  days, and recent sessions. Sessions rotate by what you have actually done, so a skipped day
  never skips a session. Each plan session is a normal workout — edit it, or swap any saved
  workout into the slot.
- **Library** — two halves. *Workouts*: your saved workouts, filtered by tapping muscles on the 3D
  body or the muscle chips; tap one to preview it. *Exercises*: every exercise grouped by muscle,
  with instructions, muscles used, 1/2/6/10-rep PRs, total weight lifted and a personal
  popularity bar.
- **Workout builder** — pick muscles on the 3D body, then either generate a workout with the
  Strength ↔ Endurance slider (reps and sets interpolate per exercise; weights come from your PR
  history via estimated 1RM, or exercise defaults) or choose the exercises yourself.
- **Workout preview** — where every workout goes before you start it: the muscles it loads (darker
  red = more), its exercises, then Start or Edit. A workout you just built is not saved yet.
- **During a workout** — tap a set to mark it done (green), edit reps/weight on the fly,
  +/− sets, drag exercises to reorder, and a pull-out rest panel that counts down the active
  exercise's rest (or counts up as a plain stopwatch).
- **Finish summary** — time, sets, weight lifted and new rep PRs, and for a workout that isn't in
  your library, "Save this workout?".
- **3D body controls** — drag sideways to spin (a flick keeps it turning, and the muscles lag and
  settle as it does); pinch, the +/− buttons or a trackpad pinch to zoom; while zoomed, drag
  up/down to move along the body; *Hide body* collapses it to a one-line bar. At normal zoom a
  vertical swipe on the body scrolls the page.
- **Settings** — body type for the 3D model (woman default / man), open-on-phone QR + install,
  JSON export/import for moving data between devices without a server, reset. A dev-only
  "Developer (preview build)" section (layout preview + demo-history loader) shows only under
  `npm run dev`.
- **Colour** — teal is for controls; red is only ever a muscle.

Data is stored in the browser's localStorage. "Load demo history" (Settings → Developer)
fills ~6 weeks of fake sessions so PRs and popularity have something to show.

## Plans: where the curation lives

The plans are defined in [`src/data/plans.js`](src/data/plans.js): each template lists its sessions
with a hand-picked exercise list, the allowed days-per-week options with default weekdays, and the
three goal levels (a position on the same Strength↔Endurance scale the generator uses). Edit that
file to change what a plan contains. Scheduling and the history summary are in
[`src/logic/plan.js`](src/logic/plan.js).

## 3D body: MakeHuman model with generated muscle regions

The 3D body ([`src/components/BodyModel.jsx`](src/components/BodyModel.jsx)) is a realistic human
mesh with the 13 muscle groups marked directly on its surface.

- **The models** are `public/models/woman.glb` and `public/models/man.glb` (about 1.7 MB each),
  generated with [MakeHuman](http://www.makehumancommunity.org/) through its Blender add-on MPFB.
  MakeHuman's exported bodies are CC0. Both are lean, muscular builds; nipple and genital detail
  is smoothed away so the figure reads as a neutral sculpture.
- **Muscle definition is part of the mesh**, not a texture. On top of MakeHuman's own muscle
  shapes the build script subdivides the mesh and sculpts it: each muscle's belly is pushed out a
  few millimetres and the defining lines are cut in (six-pack, spine groove, the heads of the
  quads, the split of the calves and hamstrings, the columns of the lower back).
- **Muscle regions** are not painted by hand. The build script gives every vertex a muscle id and
  a border weight by rule — which part of the skeleton it follows, where it sits between body
  landmarks (shoulder, elbow, hip, knee…), and how far round the torso or limb it is. The two
  strongest muscles at each vertex are stored in the model's `_MUSCLE` / `_MUSCLE2` attributes.
- **Inertia:** spinning has momentum, and a spring kicked by changes in spin speed makes soft
  tissue trail and settle (`WOBBLE` and `SOFTNESS` in the component). It is tuned firm, as on
  flexed muscle: under a centimetre for an ordinary flick. It is switched off when the
  device asks for reduced motion.
- **In the app** a small shader fills a selected muscle and draws every muscle's outline where the
  interpolated weight crosses 0.5, which gives smooth borders that don't follow the mesh's
  triangles. A tap is resolved against the same weights, and a tap just outside a muscle still
  selects the nearest one.

### Regenerating or changing the bodies

Needs [Blender](https://www.blender.org/) with the **MPFB** extension installed
(`blender --online-mode --command extension install mpfb -e`). Then, from this folder:

```bash
blender -b --python scripts/body/build_body.py -- --type woman --out public/models/woman.glb --preview /tmp/woman.png
```

```bash
blender -b --python scripts/body/build_body.py -- --type man --out public/models/man.glb --preview /tmp/man.png
```

`--preview` writes a four-view picture with each region in its own colour, which is the quickest
way to check a change. In [`scripts/body/build_body.py`](scripts/body/build_body.py):

- `ARM_ANGLE` sets how far the arms hang out from the body.
- `BODY_TYPES` holds the MakeHuman sliders and detail shapes for each body (gender, muscle,
  weight, proportions, per-limb muscle…). All MakeHuman bodies share one mesh layout, so a new
  body type is one more entry there.
- `classify()` holds the muscle region rules, one short expression per muscle, and below them the
  sculpting. `BELLY` sets how far each muscle is pushed out; add `--plain` to the command to
  preview the bare shape without region colours.

## Known limitations

The fuller list of open work is in [TODO.md](TODO.md).

- Muscle regions on the 3D body are generated by rule, so their borders are approximate rather
  than anatomically exact, and forearms, front shins, inner thighs, neck, hands and feet are not
  selectable. Forearms was removed as a muscle group because nearly every exercise uses them.
- Editing reps/weight in the workout *editor* applies to all sets of that exercise
  (per-set editing is available during an active workout).
- Switching or removing a plan deletes the workouts that plan generated, including edits made to
  them (history is kept).
- Plan setup is deliberately limited to the curated choices; there is no build-your-own-split
  screen yet, and the schedule only looks one week ahead.
- "Scan & bring my data" replaces the receiving device's data with the sender's (it's a
  transfer, not a merge). Large histories fall back to file transfer.
- Only one browser profile = one user; no accounts.
