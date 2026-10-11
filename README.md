# Training App — v0.1

First working prototype of the workout app described in [description.md](Description.md).

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

## What's in v0.1

- **Home tab** — spinnable 3D body (drag sideways to rotate, tap muscles). Tapping muscles filters
  your workout list; tapping a workout highlights the muscles it works, darker red = more of the
  workout's load on that muscle. If a plan is set up, its next session is shown at the top.
- **3D body controls** — pinch (or the +/− buttons, or a trackpad pinch) to zoom in on small
  muscles; while zoomed, drag up/down to move along the body and tap *reset* to zoom back out. At
  normal zoom a vertical swipe on the model scrolls the page. *Hide body* collapses the model to a
  one-line bar showing the current selection.
- **Plan tab** — pick a curated training plan (Full Body, Upper / Lower, Push / Pull / Legs), the
  days per week, a goal (Strength / Balanced / Endurance) and your training days; the workouts are
  built for you. Shows this week and next week (done / missed / planned / rest), the next session
  with a Start button, and a history summary: sessions per week against your target, sets per
  muscle over the last 14 days, and recent sessions. Sessions rotate by what you have actually
  done, so a skipped day never skips a session. Each plan session is a normal workout — edit it,
  or swap any saved workout into the slot.
- **Library tab** — all exercises grouped by muscle, with instructions, muscles used,
  1/2/6/10-rep PRs, total weight lifted and a personal popularity bar.
- **Workouts tab** — view/edit/delete workouts. Create new ones by tapping muscles on the 3D
  model to browse exercises, or select muscles + a Strength↔Endurance slider and hit Generate
  (reps/sets interpolate per exercise; weights come from your PR history via estimated 1RM, or
  exercise defaults).
- **During a workout** — tap a set to mark it done (green), edit reps/weight on the fly,
  +/− sets, drag exercises to reorder, and a pull-out rest panel that counts down the active
  exercise's rest (or counts up as a plain stopwatch).
- **Settings** — body type for the 3D model (woman default / man), open-on-phone QR + install,
  JSON export/import for moving data between devices without a server, reset. A dev-only
  "Developer (preview build)" section (layout preview + demo-history loader) shows only under
  `npm run dev`.

Data is stored in the browser's localStorage. "Load demo history" (Settings → Developer)
fills ~6 weeks of fake sessions so PRs and popularity have something to show.

## Plans: where the curation lives

The plans are defined in [`src/data/plans.js`](src/data/plans.js): each template lists its sessions
with a hand-picked exercise list, the allowed days-per-week options with default weekdays, and the
three goal levels (a position on the same Strength↔Endurance scale the generator uses). Edit that
file to change what a plan contains. Scheduling and the history summary are in
[`src/logic/plan.js`](src/logic/plan.js).

## 3D body: base mesh + muscle-area overlays

The 3D body ([`src/components/BodyModel.jsx`](src/components/BodyModel.jsx)) is built in two layers,
which keeps the *visual* body independent from the *interactive* muscles:

1. **Base body** — a plain neutral mannequin (a lathed torso + capsule limbs). It's just a
   backdrop; it isn't itself colored or clickable.
2. **Muscle areas** — one thin, curved "sticker" patch laid on the surface per muscle. When idle a
   patch is invisible except for its **outline** (so you can see where to tap); when selected or
   shaded by workout load it **fills red** (light → dark by intensity). Patches are front-face
   only, so a tap can't pass through the torso and grab a muscle on the far side.

Because the interactivity lives entirely in the overlay, **the base body can be swapped for a
realistic model without touching the muscle logic** — e.g. a **Meshy** CC0 body
(<https://www.meshy.ai/tags/anatomy>). Meshy models are single meshes (not split into named
muscles), which is exactly why the overlay approach fits: the Meshy body becomes the visual base
and the same patches sit on top. To do that you'd drop the GLB into `public/models/`, load it as
the base, and re-tune each patch's position/size against it (placement is model-specific — anatomy
reference images make this straightforward). Ping me with the file and I'll wire it in.

For a model that is *itself* per-muscle selectable (no overlay needed), **Z-Anatomy** (segmented,
CC BY-SA 4.0, <https://github.com/Z-Anatomy/Models-of-human-anatomy>) is the alternative, but it
needs Blender work to export/rename meshes.

## Known limitations (v0.1)

- The 3D base body is a stylized mannequin; muscle areas are placed by hand (swap in a realistic
  base model as above to improve the look).
- Editing reps/weight in the workout *editor* applies to all sets of that exercise
  (per-set editing is available during an active workout).
- Switching or removing a plan deletes the workouts that plan generated, including edits made to
  them (history is kept).
- Plan setup is deliberately limited to the curated choices; there is no build-your-own-split
  screen yet, and the schedule only looks one week ahead.
- "Scan & bring my data" replaces the receiving device's data with the sender's (it's a
  transfer, not a merge). Large histories fall back to file transfer.
- Only one browser profile = one user; no accounts.
