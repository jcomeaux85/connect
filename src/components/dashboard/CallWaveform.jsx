import React from 'react';

/**
 * Renders a single call as an audio-style waveform of thin vertical bars.
 * `bars` is an array of 0..1 amplitudes (built seeded so it never reflows).
 * `direction` controls anchor: inbound grows up from bottom, outbound grows down from top.
 */
export default function CallWaveform({ bars, color, secondary, direction }) {
  const isInbound = direction === 'inbound';
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: isInbound ? 'flex-end' : 'flex-start',
        gap: 1,
        padding: '0 1px',
      }}
    >
      {bars.map((amp, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            minWidth: 1,
            height: `${Math.min(amp * 100, 100)}%`,
            borderRadius: 1,
            background: isInbound
              ? `linear-gradient(180deg, ${secondary} 0%, ${color} 100%)`
              : `linear-gradient(180deg, ${color} 0%, ${secondary} 100%)`,
            boxShadow: `0 0 3px ${color}55`,
          }}
        />
      ))}
    </div>
  );
}