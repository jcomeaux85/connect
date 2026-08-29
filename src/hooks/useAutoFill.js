import { useLayoutEffect, useRef } from 'react';

// useAutoFill — when a page's content doesn't reach the viewport bottom,
// gently zoom the whole container (small rate, capped) so fonts breathe,
// then flex-grow the top-level sections to absorb any remaining space.
// Result: content fills the screen comfortably instead of leaving a gap.
//
// Props:
//   enabled     — turn the behavior on/off (default true)
//   maxZoom     — cap on the font/spacing scale (default 1.06 = 6% growth)
//   zoomRate    — how aggressively zoom fills the deficit (default 0.5)
//   zoomOnly    — skip flex-grow; just zoom (for pages whose internal
//                 structure we don't control, e.g. Corps//)
//
// Returns a ref to attach to the container whose direct children should grow.

function isFillable(el) {
  if (el.nodeType !== 1) return false;
  return ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'FORM', 'FIELDSET'].includes(el.tagName);
}

export function useAutoFill({ enabled = true, maxZoom = 1.06, zoomRate = 0.5, zoomOnly = false } = {}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    // Ensure the container is a flex column so flex-grow works on children
    if (!zoomOnly) {
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
    }

    const apply = () => {
      // Reset to measure natural size
      el.style.zoom = '1';
      const fillable = Array.from(el.children).filter(isFillable);
      fillable.forEach(c => { c.style.flexGrow = ''; c.style.flexShrink = '0'; });
      void el.offsetHeight; // force reflow

      const rect = el.getBoundingClientRect();
      const available = window.innerHeight - rect.top;
      if (available <= 0) return;

      const natural = el.scrollHeight;
      const deficit = available - natural;
      if (deficit <= 0) return; // content fills or overflows — leave as-is

      // Step 1: gentle zoom — fonts & spacing scale up at a small rate
      const deficitFraction = deficit / available;
      const zoom = Math.min(1 + deficitFraction * zoomRate, maxZoom);
      if (zoom > 1.001) {
        el.style.zoom = String(zoom);
        void el.offsetHeight;
      }

      // Step 2: flex-grow sections to absorb any remaining space after zoom
      if (!zoomOnly) {
        const zoomedH = el.getBoundingClientRect().height;
        const remaining = available - zoomedH;
        if (remaining > 8 && fillable.length > 0) {
          fillable.forEach(c => { c.style.flexGrow = '1'; });
        }
      }
    };

    const raf = requestAnimationFrame(apply);

    const ro = new ResizeObserver(apply);
    ro.observe(el);
    ro.observe(document.body);
    window.addEventListener('resize', apply);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', apply);
      el.style.zoom = '1';
      if (!zoomOnly) {
        Array.from(el.children).filter(isFillable).forEach(c => {
          c.style.flexGrow = '';
          c.style.flexShrink = '';
        });
      }
    };
  }, [enabled, maxZoom, zoomRate, zoomOnly]);

  return ref;
}