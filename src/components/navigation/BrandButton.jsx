import React, { useRef, useState, useCallback } from 'react';

/**
 * Shiny, slightly-pillowed brand button with a cursor-reactive specular highlight.
 * The light fades in gradually (not a hard blink) and follows the pointer.
 *
 * Props:
 *  - title: main word (e.g. "DOC")
 *  - subtitle: thin tagline under the title
 *  - titleColor: color of the main word
 *  - onClick
 */
export default function BrandButton({ title, subtitle, titleColor = '#ff0000', titleFont, onClick }) {
  const ref = useRef(null);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 100;
    const y = (e.clientY - r.top) / r.height * 100;
    setGlare({ x, y, opacity: 1 });
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
        // ~10% taller than the old 34px button → ~50px to fit the tagline
        height: '50px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f4f4f6 52%, #e4e4e8 100%)',
        border: '1px solid rgba(0,0,0,0.16)',
        borderRadius: '12px',
        cursor: 'pointer',
        // Pillowed: soft outer drop + inner top sheen + inner bottom shade
        boxShadow:
        '0 3px 6px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -3px 6px rgba(0,0,0,0.10)',
        transition: 'box-shadow 0.2s ease'
      }}>
      
      {/* Cursor-reactive specular glare — gradual fade */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 22%, transparent 55%)`,
          opacity: glare.opacity,
          transition: 'opacity 0.45s ease, background 0.12s linear',
          pointerEvents: 'none',
          mixBlendMode: 'soft-light',
          zIndex: 2
        }} />
      
      {/* Top glossy sheen band */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '48%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0))',
          borderRadius: '12px 12px 40% 40%',
          pointerEvents: 'none',
          zIndex: 1
        }} />
      

      {/* Title — centered vertically (TM not counted toward centering) */}
      <span
        style={{
          position: 'relative',
          zIndex: 3,
          fontFamily: titleFont || "'Outfit', sans-serif",
          fontSize: '17px',
          fontWeight: 800,
          color: titleColor,
          letterSpacing: '-0.7px',
          lineHeight: 1,
          display: 'inline-block'
        }}>
        
        {title}
        <sup style={{ fontSize: '6px', opacity: 0.6, verticalAlign: 'super' }}>™</sup>
      </span>

      {/* Thin tagline */}
      <span
        style={{
          position: 'relative',
          zIndex: 3,
          marginTop: '3px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '6.5px',
          fontWeight: 700,
          letterSpacing: '0.6px',
          color: 'rgba(0,0,0,0.45)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          lineHeight: 1
        }} className="font-extralight text-xs text-center lowercase">
        
        {subtitle}
      </span>
    </div>);

}