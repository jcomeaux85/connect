import React, { useRef, useState, useCallback } from 'react';
/**
 * Neumorphic brand button where the WORD is the button.
 * Letters are stretched tall and extruded from a base that
 * shares the sidebar surface, so the dual-shadow molding reads
 * as "pushed up through the panel" rather than a card on top of it.
 *
 * Props:
 *  - title: main word ("DOC")
 *  - subtitle: thin tagline
 *  - titleColor: color of the raised word
 *  - titleFont: font for the word
 *  - surface: sidebar bg color so the extrusion blends (default matches purple panel)
 *  - onClick
 */
export default function BrandButton({
  title,
  subtitle,
  titleColor = '#ff2d2d',
  titleFont,
  surface = '#4a3d75',
  onClick,
}) {
  const ref = useRef(null);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setGlare({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
      opacity: 1,
    });
  }, []);
  const handleEnter = useCallback(() => setGlare((g) => ({ ...g, opacity: 1 })), []);
  const handleLeave = useCallback(() => setGlare((g) => ({ ...g, opacity: 0 })), []);

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="w-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        height: '54px',
        background: surface,
        borderRadius: '12px',
        cursor: 'pointer',
        // Neumorphic base: light source top-left. Soft raised panel.
        boxShadow:
          '4px 4px 8px rgba(0,0,0,0.35), -4px -4px 8px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: 'box-shadow 0.18s ease, transform 0.12s ease',
      }}
    >
      {/* cursor-reactive specular sweep across the molded surface */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 30%, transparent 60%)`,
          opacity: glare.opacity,
          transition: 'opacity 0.45s ease, background 0.12s linear',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* TITLE: stretched-tall extruded letters.
          scaleY pushes the letterforms up; dual text-shadow molds them. */}
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          fontFamily: titleFont || "'Outfit', sans-serif",
          fontSize: '20px',
          fontWeight: 800,
          color: titleColor,
          letterSpacing: '1px',
          lineHeight: 1,
          transform: 'scaleY(1.55)',          // <-- the vertical stretch
          transformOrigin: 'center 46%',       // TM excluded: pivot on the main glyphs
          display: 'inline-block',
          // raised molding on the type itself
          textShadow:
            '1px 1px 1px rgba(0,0,0,0.45), -1px -1px 1px rgba(255,255,255,0.12)',
        }}
      >
        {title}
        <sup
          style={{
            fontSize: '7px',
            opacity: 0.55,
            verticalAlign: 'super',
            transform: 'scaleY(0.64)',          // counter-stretch so TM stays normal proportion
            display: 'inline-block',
            textShadow: 'none',
          }}
        >
          ™
        </sup>
      </span>

      {/* thin tagline, kept legible (raised the old 4px to 7px) */}
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: '7px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '7px',
          fontWeight: 700,
          letterSpacing: '1.2px',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}
      >
        {subtitle}
      </span>
    </div>
  );
}