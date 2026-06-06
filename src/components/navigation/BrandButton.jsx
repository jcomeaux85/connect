import React, { useRef, useState, useCallback } from 'react';
/**
 * Brand button. Container-less: the styled word IS the button.
 * Keeps the original default export + props so existing imports don't break.
 *
 * Use:  <BrandButton variant="doc" onClick={...} />
 *       <BrandButton variant="corps" onClick={...} />
 *
 * Fonts (load once in app head):
 * <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;900&family=Zilla+Slab:wght@700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet" />
 */
export default function BrandButton({ variant = 'doc', onClick }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(false);
  const handleEnter = useCallback(() => setHover(true), []);
  const handleLeave = useCallback(() => setHover(false), []);

  const wrap = {
    cursor: 'pointer',
    userSelect: 'none',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'baseline',
    gap: '11px',
    padding: '6px 2px',
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    borderRadius: 0,
    transform: hover ? 'translateX(1px)' : 'none',
    transition: 'transform 0.12s ease',
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="w-full relative flex items-baseline"
      style={wrap}
    >
      {variant === 'corps' ? (
        <>
          <span
            style={{
              fontFamily: "'Zilla Slab', serif",
              fontWeight: 700,
              fontSize: '38px',
              letterSpacing: '1px',
              color: '#9ef060',
              display: 'inline-block',
              textShadow: hover
                ? '0 0 9px rgba(158,240,96,0.75), 0 0 20px rgba(158,240,96,0.4)'
                : '0 0 7px rgba(158,240,96,0.6), 0 0 16px rgba(158,240,96,0.35)',
              transition: 'text-shadow 0.15s ease',
            }}
          >
            CORPS
          </span>
          <span
            style={{
              fontFamily: "'Zilla Slab', serif",
              fontWeight: 700,
              fontSize: '38px',
              color: '#9ef060',
              textShadow: hover
                ? '0 0 9px rgba(158,240,96,0.75)'
                : '0 0 7px rgba(158,240,96,0.6)',
            }}
          >
            /<span style={{ color: '#f2f2f2', textShadow: 'none' }}>/</span>
          </span>
          <span
            style={{
              fontFamily: "'Zilla Slab', serif",
              fontWeight: 700,
              fontSize: '30px',
              color: '#f2f2f2',
              letterSpacing: '0.5px',
            }}
          >
            RME&nbsp;of&nbsp;ONE
          </span>
        </>
      ) : (
        <>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: '36px',
              letterSpacing: '-2px',
              color: '#dc2626',
              display: 'inline-block',
              textShadow: hover
                ? '2px 4px 4px rgba(0,0,0,0.4)'
                : '2px 3px 3px rgba(0,0,0,0.3)',
              transition: 'text-shadow 0.15s ease',
            }}
          >
            DOC
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 400,
                fontSize: '12px',
                verticalAlign: 'super',
                letterSpacing: 0,
                marginLeft: '2px',
              }}
            >
              &#8482;
            </span>
          </span>
          <span style={{ color: '#f2f2f2', fontSize: '26px', fontWeight: 300, transform: 'translateY(-2px)' }}>|</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '24px',
              letterSpacing: '2px',
              fontWeight: 700,
              color: '#f2f2f2',
              textTransform: 'uppercase',
            }}
          >
            Quick&nbsp;Research
          </span>
        </>
      )}
    </div>
  );
}