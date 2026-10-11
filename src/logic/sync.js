import LZString from 'lz-string';

// The current origin plus Vite's base path (e.g. https://user.github.io/repo),
// with no trailing slash. This is the real, openable URL of the app — important
// on GitHub Pages project sites where the app lives under a sub-path, not root.
const originWithBase = () =>
  window.location.origin + (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

// The URL to open this app on another device. In dev the server injects the LAN
// address; otherwise it's the deployed origin+base.
export const LAN_URL =
  (typeof __LAN_URL__ !== 'undefined' && __LAN_URL__) || originWithBase();

// A QR code that still scans reliably from a phone camera holds roughly this
// many characters. Above it we keep the QR to just the URL and move the data
// another way.
export const QR_SAFE_CHARS = 2200;

function payload(state) {
  return { v: 1, settings: state.settings, workouts: state.workouts, history: state.history, plan: state.plan };
}

// lz-string's "EncodedURIComponent" alphabet still contains '+', which a real
// browser navigation can mangle inside a URL fragment. '_' is not in that
// alphabet, so swapping it in/out makes the payload genuinely URL-safe.
export function encodeState(state) {
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload(state))).replace(/\+/g, '_');
}

export function decodeState(encoded) {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded.replace(/_/g, '+'));
    if (!json) return null;
    const data = JSON.parse(json);
    if (!Array.isArray(data.workouts)) return null;
    return data;
  } catch {
    return null;
  }
}

// Full URL that opens the app AND carries the data in the fragment (after #,
// so it never hits any server or logs).
export function transferURL(state, base = LAN_URL) {
  return `${base}/#d=${encodeState(state)}`;
}

// If there's a #d=... payload in the address bar, pull it out and clear it.
export function readIncomingState() {
  const hash = window.location.hash || '';
  const m = hash.match(/[#&]d=([^&]+)/);
  if (!m) return null;
  const data = decodeState(m[1]);
  // Remove the payload from the URL so a refresh doesn't re-import it.
  history.replaceState(null, '', window.location.pathname + window.location.search);
  return data;
}

// Rough size report so the UI can decide between an all-in-one QR and a
// URL-only QR.
export function transferSize(state) {
  const url = transferURL(state);
  return { url, chars: url.length, fitsInQR: url.length <= QR_SAFE_CHARS };
}
