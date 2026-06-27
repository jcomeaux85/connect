import React, { useState } from 'react';

/**
 * Renders a single call as an audio-style waveform of thin vertical bars.
 * `bars` is an array of 0..1 amplitudes (built seeded so it never reflows).
 * `direction` controls anchor: inbound grows up from bottom, outbound grows down from top.
 * Hovering THIS waveform triggers a 1s wobble where its bars randomly
 * lengthen/shorten then settle — independent of neighbors or the lane.
 */
export default function CallWaveform({ bars, color, secondary, direction }) {
  const isInbound = direction === 'inbound';
  const [active, setActive] = useState(false);

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
      {bars.map((amp, i) => {
        const base = Math.min(amp * 100, 100);
        return (
          <div
            key={i}
            className={active ? 'wf-bar-active' : undefined}
            style={{
              flex: 1,
              minWidth: 1,
              height: `${base}%`,
              borderRadius: 1,
              background: isInbound
                ? `linear-gradient(180deg, ${secondary} 0%, ${color} 100%)`
                : `linear-gradient(180deg, ${color} 0%, ${secondary} 100%)`,
              boxShadow: `0 0 3px ${color}55`,
              transformOrigin: isInbound ? 'bottom' : 'top',
              transition: 'height 0.12s ease',
              // per-bar random offsets + stagger drive the wobble keyframes
              '--wf-h': `${base}%`,
              '--wf-h1': `${Math.min(base * (0.4 + (i % 5) * 0.18) + 12, 100)}%`,
              '--wf-h2': `${Math.max(base * 0.35, 8)}%`,
              '--wf-h3': `${Math.min(base * (0.7 + (i % 3) * 0.22) + 8, 100)}%`,
              animationDelay: `${(i % 6) * 0.04}s`,
            }}
          />
        );
      })}
    </div>
  );
}