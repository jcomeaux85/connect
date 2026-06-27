import React, { useState, useEffect, useRef } from 'react';

/**
 * Renders a single call as an audio-style waveform of thin vertical bars.
 * `bars` is an array of 0..1 amplitudes (built seeded so it never reflows).
 * `direction` controls anchor: inbound grows up from bottom, outbound grows down from top.
 *
 * Hovering THIS waveform starts a live "audio" animation: each bar's height
 * is driven directly from a requestAnimationFrame loop (no CSS keyframes, so
 * it can't be swallowed by flexbox/transform interplay). On mouse-out the
 * bars ease back to their resting heights.
 */
export default function CallWaveform({ bars, color, secondary, direction }) {
  const isInbound = direction === 'inbound';
  const [active, setActive] = useState(false);
  const [heights, setHeights] = useState(() => bars.map(a => Math.min(a * 100, 100)));
  const rafRef = useRef(null);

  const rest = bars.map(a => Math.min(a * 100, 100));

  useEffect(() => {
    if (!active) {
      // ease back to resting heights
      setHeights(rest);
      return;
    }
    let start = performance.now();
    const tick = (now) => {
      const t = (now - start) / 1000;
      setHeights(
        bars.map((a, i) => {
          const baseH = Math.min(a * 100, 100);
          // each bar bounces on its own phase/speed → lively, audio-like
          const wave = Math.sin(t * 9 + i * 0.9) * 0.5 + Math.sin(t * 5 + i * 1.7) * 0.5;
          const h = baseH * (1 + wave * 0.85);
          return Math.max(8, Math.min(h, 100));
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
      }}
    >
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            minWidth: 1,
            height: `${h}%`,
            borderRadius: 1,
            background: isInbound
              ? `linear-gradient(180deg, ${secondary} 0%, ${color} 100%)`
              : `linear-gradient(180deg, ${color} 0%, ${secondary} 100%)`,
            boxShadow: `0 0 3px ${color}55`,
            transition: active ? 'none' : 'height 0.25s ease',
          }}
        />
      ))}
    </div>
  );
}