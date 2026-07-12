import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useStore } from '../store.jsx';
import { LAN_URL, transferSize } from '../logic/sync.js';

function QR({ text, size = 240 }) {
  const canvasRef = useRef(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, text, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then(() => setErr(null))
      .catch((e) => setErr(e.message));
  }, [text, size]);
  return (
    <div className="qr-box">
      <canvas ref={canvasRef} width={size} height={size} />
      {err && <div className="muted tiny">Couldn't render QR: {err}</div>}
    </div>
  );
}

function workoutsOnly(state) {
  return { ...state, history: [] };
}

// The URL another phone should open to get (and install) the app. Once the app
// is deployed this is the public https URL (origin + base path); during local
// dev it's the LAN address. LAN_URL already accounts for both.
const APP_URL = LAN_URL;
const IS_SECURE =
  typeof window !== 'undefined' &&
  (window.isSecureContext || /^https:/.test(APP_URL) || /localhost|127\.0\.0\.1/.test(APP_URL));

export default function PhoneSync({ onClose }) {
  const { state } = useStore();
  const [mode, setMode] = useState('data'); // 'data' | 'share'

  const full = useMemo(() => transferSize(state), [state]);
  const lite = useMemo(() => transferSize(workoutsOnly(state)), [state]);

  const isLocalhost = /localhost|127\.0\.0\.1/.test(LAN_URL);
  const historyCount = state.history.length;

  let dataUrl = full.url;
  let note = null;
  if (!full.fitsInQR && lite.fitsInQR) {
    dataUrl = lite.url;
    note = `Your ${historyCount} logged sessions are too big for one QR code, so this code transfers your workouts & settings only. To bring history too, use Move data by file (AirDrop the JSON).`;
  } else if (!full.fitsInQR && !lite.fitsInQR) {
    dataUrl = null;
    note = 'You have too much data for a QR code. Use Move data by file (AirDrop the JSON) instead — that carries everything.';
  }

  return (
    <div className="sync-overlay" onClick={onClose}>
      <div className="sync-card" onClick={(e) => e.stopPropagation()}>
        <div className="row space-between">
          <h2 style={{ margin: 0 }}>Phone</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="seg-row" style={{ marginTop: 6 }}>
          <button className={`seg ${mode === 'data' ? 'seg-active' : ''}`} onClick={() => setMode('data')}>
            Open with my data
          </button>
          <button className={`seg ${mode === 'share' ? 'seg-active' : ''}`} onClick={() => setMode('share')}>
            Install / share app
          </button>
        </div>

        {mode === 'data' && (
          <>
            {isLocalhost && (
              <div className="sync-warn">
                The app is running on <code>localhost</code>, which a phone can't reach. Start it
                with <code>npm run dev</code> and open the <strong>Network</strong> URL it prints
                (like <code>http://192.168.x.x:5173</code>), then reopen this dialog.
              </div>
            )}
            <div className="muted small">
              Phone on the <strong>same Wi-Fi</strong> as this Mac → scan with the camera. Opens the
              app with your current workouts already loaded in.
            </div>
            {dataUrl ? <QR text={dataUrl} /> : <div className="sync-warn">{note}</div>}
            {dataUrl && note && <div className="sync-warn">{note}</div>}
            <div className="sync-url muted tiny">{LAN_URL}</div>
          </>
        )}

        {mode === 'share' && (
          <>
            <div className="muted small">
              Anyone (iPhone or Android) can scan this to open the app, then add it to their home
              screen so it launches like a normal app — its own icon, fullscreen, works offline.
            </div>
            <QR text={APP_URL} />
            <div className="sync-url muted tiny">{APP_URL}</div>

            {!IS_SECURE && (
              <div className="sync-warn">
                This address is plain <code>http</code>, so the phone can open the app but{' '}
                <strong>can't fully install it offline</strong> yet. Installing as a real app needs
                an <code>https</code> address — deploy the app to a free host (see the README) and
                share that link instead.
              </div>
            )}

            <div className="install-steps">
              <div>
                <strong>iPhone (Safari):</strong> tap the <strong>Share</strong> icon →{' '}
                <strong>Add to Home Screen</strong>.
              </div>
              <div>
                <strong>Android (Chrome):</strong> tap the <strong>⋮</strong> menu →{' '}
                <strong>Install app</strong> (or <em>Add to Home screen</em>).
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
