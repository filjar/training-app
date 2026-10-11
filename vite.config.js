import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import os from 'node:os';

const PORT = 5173;

// GitHub Pages serves a project site under /<repo-name>/, so the app needs that
// as its base path. The deploy workflow sets BASE_PATH automatically from the
// repo name; locally it stays "/" so dev and localhost builds work unchanged.
const base = process.env.BASE_PATH || '/';

// Find this machine's LAN IPv4 so we can bake the phone-reachable URL into the
// app. The browser can't discover this on its own (window.location may say
// "localhost"), so we inject it at dev-server start.
function lanIP() {
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const net of iface || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}

export default defineConfig(({ command }) => ({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon-32x32.png'],
      manifest: {
        name: 'Training',
        short_name: 'Training',
        description: 'Plan and track your workouts.',
        theme_color: '#e0452f',
        background_color: '#f4f5f7',
        display: 'standalone',
        orientation: 'portrait',
        // start_url/scope must include the base so the installed app opens the
        // right path on GitHub Pages project sites.
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // Precache the 3D body models too, so the muscle selector works offline.
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,glb}'] },
      // Let us test the installable app on localhost during dev too.
      devOptions: { enabled: true },
    }),
  ],
  // host: true exposes the dev server on your LAN so a phone on the same
  // Wi-Fi can open it via http://<your-mac-ip>:5173
  server: { port: PORT, host: true },
  define: {
    // Only inject the LAN address for the dev server. In a production build the
    // app falls back to its real deployed origin+base (see logic/sync.js), so we
    // must NOT bake a build machine's IP (e.g. GitHub CI) into it.
    __LAN_URL__: JSON.stringify(command === 'serve' && lanIP() ? `http://${lanIP()}:${PORT}` : ''),
  },
}));
