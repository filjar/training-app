import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './styles.css';

// Service worker: caches the app so it launches offline and behaves like an
// installed app. Only registers on a secure origin (https or localhost); on a
// plain-http LAN address it's a no-op, which is expected.
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
