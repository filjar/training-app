import { createContext, useContext } from 'react';

// Carries the layout-preview controls to the Settings screen. `isDev` is false
// in production builds, so the preview UI never ships.
export const DevModeContext = createContext({
  isDev: false,
  mode: 'laptop',
  override: null, // null = follow the real viewport
  setOverride: () => {},
});

export const useDevMode = () => useContext(DevModeContext);
