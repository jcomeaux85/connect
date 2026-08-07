import React, { useState, useEffect, useRef } from 'react';

/**
 * Renders a single call as an audio-style waveform of thin vertical bars.
 * `bars` is an array of 0..1 amplitudes (built seeded so it never reflows).
 * `direction` controls anchor: inbound grows up from bottom, outbound grows down from top.
 *
 * Hovering THIS waveform starts a live "audio" animation. Bars are animated
 * with `transform: scaleY()` (compositor-only) instead of `height` so the
 * animation never triggers layout/paint — this prevents the sidebar's
 * backdrop-filter blur from recomputing every frame (which made the sidebar
 * buttons shimmer while a waveform moved). On mouse-out the bars ease back
 * to their resting scale.
 */
export default function CallWaveform({ bars, color, secondary, direction }) {
  const isInbound = direction === 'inbound';
  const [active, setActive] = useState(false);
  // scales[i] = scaleY factor for bar i (resting = amplitude)
  const [scales, setScales] = useState(() => bars.map(a => Math.min(a, 1)));
  const rafRef = useRef(null);

  const rest = bars.map(a => Math.min(a, 1));

  useEffect(() => {
    if (!active) {
      setScales(rest);
      return;
    }
    let start = performance.now();
    const tick = (now) => {
      const t = (now - start) / 1000;
      setScales(
        bars.map((a, i) => {
          const base = Math.min(a, 1);
          const wave = Math.sin(t * 9 + i * 0.9) * 0.5 + Math.sin(t * 5 + i * 1.7) * 0.5;
          const s = base * (1 + wave * 0.85);
          return Math.max(0.08, Math.min(s, 1));
        })
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: isInbound ? 'flex-end' : 'flex-start',
        gap: 1,
        padding: '0 1px',
        // isolate this layer so its compositor animations don't force the
        // sidebar's backdrop-filter to re-sample on every frame
        isolation: 'isolate',
        contain: 'paint',
      }}
    >
      {scales.map((s, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            minWidth: 1,
            height: '100%',
            borderRadius: 1,
            background: isInbound
              ? `linear-gradient(180deg, ${secondary} 0%, ${color} 100%)`
              : `linear-gradient(180deg, ${color} 0%, ${secondary} 100%)`,
            boxShadow: `0 0 3px ${color}55`,
            transform: `scaleY(${s})`,
            transformOrigin: isInbound ? 'bottom' : 'top',
            transition: active ? 'none' : 'transform 0.25s ease',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}