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

This repo already contains everything needed: a GitHub Actions workflow
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) that builds the app and publishes
it to Pages on every push, and a base-path setup that auto-matches your repo name (so the app
correctly lives at `https://<user>.github.io/<repo>/`). One-time steps:

```bash
# from this folder
git init && git add -A && git commit -m "Training app"
git branch -M main
# create the repo on your account (needs the GitHub CLI `gh`, logged in) …
gh repo create training-app --public --source=. --push
# … or make an empty repo on github.com and:
#   git remote add origin https://github.com/<user>/training-app.git && git push -u origin main
```

Then in the repo on github.com: **Settings → Pages → Build and deployment → Source: GitHub
Actions**. Push (or re-run the workflow) and in ~1 minute your app is live at
`https://<user>.github.io/training-app/`. Every later `git push` redeploys automatically.

> If you name the repo exactly `<user>.github.io`, the workflow serves it at the root instead —
> that's handled automatically.

### Or: temporary https tunnel (test from your phone right now, no deploy)

With the dev server running: `npx cloudflared tunnel --url http://localhost:5173`
(or `ngrok http 5173`) prints an `https://…` URL you can open/scan and install from your phone.

### Installing, once you're on https

**Settings → Open on phone → "Install / share app"** shows a QR of the public URL. Anyone —
iPhone or Android, anywhere — can scan it to open the app, then:
- **iPhone (Safari):** Share → **Add to Home Screen**
- **Android (Chrome):** ⋮ menu → **Install app**

## Dev-only phone/laptop toggle

The pill button in the **bottom-left corner** switches between:
- **💻 laptop mode** — sidebar navigation, side-by-side layouts, multi-column library
- **📱 phone mode** — a 390px phone frame with bottom tab bar, stacked layout, bottom-sheet rest timer

This toggle is for development only and is not a feature of the app itself.

## What's in v0.1

- **Home tab** — spinnable 3D body (drag to rotate, tap muscles). Tapping muscles filters your
  workout list; tapping a workout highlights the muscles it works, darker red = more of the
  workout's load on that muscle.
- **Library tab** — all exercises grouped by muscle, with instructions, muscles used,
  1/2/6/10-rep PRs, total weight lifted and a personal popularity bar.
- **Workouts tab** — view/edit/delete workouts. Create new ones by tapping muscles on the 3D
  model to browse exercises, or select muscles + a Strength↔Endurance slider and hit Generate
  (reps/sets interpolate per exercise; weights come from your PR history via estimated 1RM, or
  exercise defaults).
- **During a workout** — tap a set to mark it done (green), edit reps/weight on the fly,
  +/− sets, drag exercises to reorder, and a pull-out rest panel that counts down the active
  exercise's rest (or counts up as a plain stopwatch).
- **Settings** — body type for the 3D model (woman default / man), JSON export/import for
  moving data between devices without a server, demo-history loader, reset.

Data is stored in the browser's localStorage. "Load demo history" (Settings → Developer)
fills ~6 weeks of fake sessions so PRs and popularity have something to show.

## Anatomical 3D model — options for a real body

The current body is a stylized mannequin built from primitives (cheap, no downloads, easy to
recolor per muscle). To swap in a proper anatomical model, the model needs **each muscle as a
separately named mesh** so we can highlight them individually, exported to **glTF/GLB** and
loaded with three.js's `GLTFLoader`. Best sources found:

- **Z-Anatomy** — a full open-source 3D atlas (skeleton, muscles, vessels, nerves) derived from
  BodyParts3D. Licensed **CC BY-SA 4.0** (attribution + share-alike). Distributed as a Blender
  file, so you'd open it in Blender, keep the muscle layer, and export to GLB.
  <https://github.com/Z-Anatomy/Models-of-human-anatomy>
- **BodyParts3D** (the underlying dataset, University of Tokyo) — individually named anatomical
  parts, **CC BY-SA 2.1 JP**. Most granular, but the rawest to work with.
- **Meshy** — muscle/anatomy assets under **CC0** (no attribution, commercial-OK), good if you
  want to avoid share-alike licensing. <https://www.meshy.ai/tags/anatomy>
- **Sketchfab / TurboSquid / CGTrader** — many free and paid models; check each model's license
  and confirm muscles are split into named meshes before buying.

Practical notes: these are heavy, medically-detailed meshes, so for a phone-friendly app they'd
need decimating in Blender and the muscle meshes renaming to match our muscle keys
(e.g. `Chest`, `Quads`). CC BY-SA obliges us to credit the source and share modifications alike;
CC0 (Meshy) has no such strings. I'd suggest starting from **Z-Anatomy** for quality, or **Meshy
CC0** if you want the simplest licensing — say the word and I'll wire `GLTFLoader` into
`BodyModel.jsx` behind the same muscle-highlight API it already exposes.

## Known limitations (v0.1)

- The 3D body is a stylized low-poly mannequin, not an anatomical model (see options above).
- Editing reps/weight in the workout *editor* applies to all sets of that exercise
  (per-set editing is available during an active workout).
- "Scan & bring my data" replaces the receiving device's data with the sender's (it's a
  transfer, not a merge). Large histories fall back to file transfer.
- Only one browser profile = one user; no accounts.
