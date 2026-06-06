import React, { useState, useCallback } from 'react';
/**
 * Sidebar brand buttons. Each logo is an SVG lockup that scales to the
 * rail width as a single unit. One line, never truncates, never clips.
 *
 * Fonts (load once in app head):
 * <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;900&family=Zilla+Slab:wght@700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet" />
 */
export default function BrandButton({ variant = 'doc', onClick }) {
  const [hover, setHover] = useState(false);
  const enter = useCallback(() => setHover(true), []);
  const leave = useCallback(() => setHover(false), []);

  const wrap = {
    width: '100%',
    cursor: 'pointer',
    userSelect: 'none',
    padding: '6px 4px',
    background: 'transparent',
    border: 'none',
    transform: hover ? 'translateX(1px)' : 'none',
    transition: 'transform 0.12s ease',
    display: 'block',
  };

  if (variant === 'corps') {
    return (
      <div onClick={onClick} onMouseEnter={enter} onMouseLeave={leave} style={wrap}>
        <svg viewBox="0 0 320 60" width="100%" style={{ display: 'block', overflow: 'visible' }}>
          <text x="0" y="46" fontFamily="'Zilla Slab', serif" fontWeight="700" fontSize="52"
            letterSpacing="1" fill="#9ef060"
            style={{ filter: hover
              ? 'drop-shadow(0 0 5px rgba(158,240,96,0.85)) drop-shadow(0 0 12px rgba(158,240,96,0.45))'
              : 'drop-shadow(0 0 4px rgba(158,240,96,0.7)) drop-shadow(0 0 10px rgba(158,240,96,0.35))',
              transition: 'filter 0.15s ease' }}>
            CORPS<tspan fill="#9ef060">/</tspan><tspan fill="#f2f2f2">/</tspan><tspan fill="#f2f2f2" fontSize="40"> RME of ONE</tspan>
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div onClick={onClick} onMouseEnter={enter} onMouseLeave={leave} style={wrap}>
      <svg viewBox="0 0 340 60" width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <text x="0" y="46" fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="52"
          letterSpacing="-2" fill="#dc2626"
          style={{ filter: hover
            ? 'drop-shadow(2px 4px 4px rgba(0,0,0,0.4))'
            : 'drop-shadow(2px 3px 3px rgba(0,0,0,0.3))',
            transition: 'filter 0.15s ease' }}>
          DOC<tspan fontSize="18" dy="-22" fontWeight="400">™</tspan>
        </text>
        <text x="150" y="44" fontFamily="'Outfit', sans-serif" fontWeight="300" fontSize="44" fill="#f2f2f2">|</text>
        <text x="172" y="42" fontFamily="'JetBrains Mono', monospace" fontWeight="700" fontSize="30"
          letterSpacing="2" fill="#f2f2f2">QUICK RESEARCH</text>
      </svg>
    </div>
  );
}