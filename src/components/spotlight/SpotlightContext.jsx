import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * SPOTLIGHT — a concentration aid that reuses the existing hover-hue brightness idea,
 * but as a persistent, toggleable selection state instead of a momentary hover.
 *
 * When OFF: zero visual change anywhere.
 * When ON: the selected panel rises slightly in brightness, every other panel
 *          drops slightly — subtle, fully legible. Selection persists until a
 *          different panel is selected (distinct from hover).
 *
 * Implementation reuses the global-CSS approach already used for neumorphism:
 * a `data-spotlight` attribute on <body> activates `.spot-panel` brightness rules,
 * and the selected panel gets a `data-spot-selected` attribute. Brightness eases
 * with the SAME timing as the existing hover transition. Layout never changes.
 */
const SpotlightContext = createContext(null);

export function SpotlightProvider({ children }) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem('spotlightEnabled') === '1');

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('spotlightEnabled', next ? '1' : '0');
      return next;
    });
  }, []);

  // Reflect enabled state on <body> so global CSS can react. Reuses the
  // "data attribute drives scoped CSS" pattern already in the app.
  useEffect(() => {
    if (enabled) {
      document.body.setAttribute('data-spotlight', 'on');
    } else {
      document.body.removeAttribute('data-spotlight');
      document.body.removeAttribute('data-spotlight-active');
      // Clear any persisted selection when turning off
      document.querySelectorAll('[data-spot-selected]').forEach((el) =>
        el.removeAttribute('data-spot-selected')
      );
    }
  }, [enabled]);

  // Click delegation: when spotlight is on, clicking inside any panel marked
  // with `.spot-panel` selects that panel (persistent) and deselects others.
  useEffect(() => {
    if (!enabled) return;
    const onClick = (e) => {
      const panel = e.target.closest('.spot-panel');
      if (!panel) return;
      document.querySelectorAll('[data-spot-selected]').forEach((el) => {
        if (el !== panel) el.removeAttribute('data-spot-selected');
      });
      panel.setAttribute('data-spot-selected', 'true');
      // Mark that a selection now exists so non-selected panels begin to dim
      document.body.setAttribute('data-spotlight-active', 'true');
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [enabled]);

  // Allow toggling from anywhere via a window event (reuses existing event pattern)
  useEffect(() => {
    const handler = () => toggle();
    window.addEventListener('toggle-spotlight', handler);
    return () => window.removeEventListener('toggle-spotlight', handler);
  }, [toggle]);

  return (
    <SpotlightContext.Provider value={{ enabled, toggle }}>
      {children}
    </SpotlightContext.Provider>
  );
}

export function useSpotlight() {
  return useContext(SpotlightContext) || { enabled: false, toggle: () => {} };
}