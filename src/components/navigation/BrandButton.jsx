import React, { useRef, useState, useCallback } from 'react';
/**
 * Container-less brand button. NO panel, NO pill, NO box.
 * The stretched word IS the button. Hit area is the wrapper,
 * but it's fully transparent. All molding lives on the glyphs.
 */
export default function BrandButton({
  title,
  subtitle,
  titleColor = '#ff2d2d',
  titleFont,
  onClick,
}) {
  const ref = useRef(null);
  const [hover, setHover] = useState(false);

  const handleEnter = useCallback(() => setHover(true), []);
  const handleLeave = useCallback(() => setHover(false), []);

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="w-full relative flex flex-col items-center justify-center"
      style={{
        height: '54px',
        background: 'transparent',   // no panel
        border: 'none',              // no outline
        boxShadow: 'none',           // no pill molding
        borderRadius: 0,
        cursor: 'pointer',
      }}
    >
      {/* TITLE: stretched-tall letters, molding on the type itself */}
      <span
        style={{
          fontFamily: titleFont || "'Outfit', sans-serif",
          fontSize: '20px',
          fontWeight: 800,
          color: titleColor,
          letterSpacing: '1px',
          lineHeight: 1,
          transform: `scaleY(1.55) ${hover ? 'translateY(-0.5px)' : ''}`,
          transformOrigin: 'center 46%',
          display: 'inline-block',
          transition: 'text-shadow 0.18s ease, transform 0.12s ease',
          // raised molding lives ENTIRELY on the glyphs now
          textShadow: hover
            ? '2px 2px 2px rgba(0,0,0,0.5), -1px -1px 1px rgba(255,255,255,0.18)'
            : '1px 1px 1px rgba(0,0,0,0.4), -1px -1px 1px rgba(255,255,255,0.1)',
        }}
      >
        {title}
        <sup
          style={{
            fontSize: '7px',
            opacity: 0.55,
            verticalAlign: 'super',
            transform: 'scaleY(0.64)',
            display: 'inline-block',
            textShadow: 'none',
          }}
        >
          ™
        </sup>
      </span>

      <span
        style={{
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