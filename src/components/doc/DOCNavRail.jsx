import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOCChipHeader from './DOCChipHeader';
import {
  Stethoscope, Smile, Eye, HeartPulse, Accessibility,
  PiggyBank, Pill, ShieldCheck, Wallet,
} from 'lucide-react';

// Deep purple glass — mirrors the BC PersistentSidebar exactly.
const PANEL_BG = 'linear-gradient(160deg, rgba(55,30,90,0.97) 0%, rgba(38,20,72,0.99) 60%, rgba(28,14,58,1) 100%)';
const PANEL_BORDER = 'rgba(255,255,255,0.13)';

// Category shortcuts — each triggers the matching DOC search inside the iframe.
const NAV_ITEMS = [
  { label: 'Medical', match: 'medical', icon: Stethoscope },
  { label: 'Dental', match: 'dental', icon: Smile },
  { label: 'Vision', match: 'vision', icon: Eye },
  { label: 'Life', match: 'life', icon: HeartPulse },
  { label: 'Disability', match: 'disability', icon: Accessibility },
  { label: 'Retirement', match: 'retirement', icon: PiggyBank },
  { label: 'Pharmacy', match: 'pharmacy', icon: Pill },
  { label: 'HSA / FSA', match: 'hsa', icon: Wallet },
  { label: 'Supplemental', match: 'supplemental', icon: ShieldCheck },
];

const btnStyle = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 4px rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '10px',
};

// --- Pointer-driven lit button — copied from the BC PersistentSidebar ---
function LitButton({ children, onClick, className }) {
  const btnRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ mx: 50, my: 50, opacity: 0 });
  const [extraShadow, setExtraShadow] = useState('');

  const handleMouseMove = useCallback((e) => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width - 0.5;
    const fy = (e.clientY - r.top) / r.height - 0.5;
    const mx = (fx + 0.5) * 100;
    const my = (fy + 0.5) * 100;
    const tiltY = fx * 10;
    const tiltX = -fy * 10;
    const shadowDist = Math.sqrt(fx * fx + fy * fy) * 10 + 2;
    const addedShadow = `${(-fx * shadowDist).toFixed(1)}px ${(-fy * shadowDist).toFixed(1)}px ${(shadowDist * 2).toFixed(1)}px rgba(0,0,0,0.28)`;
    setTilt({ x: tiltX, y: tiltY });
    setGlare({ mx, my, opacity: 0.13 });
    setExtraShadow(addedShadow);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setGlare((g) => ({ ...g, opacity: 0 }));
    setExtraShadow('');
  }, []);

  const combinedShadow = extraShadow ? `${btnStyle.boxShadow}, ${extraShadow}` : btnStyle.boxShadow;

  return (
    <div
      ref={btnRef}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...btnStyle,
        boxShadow: combinedShadow,
        transform: `perspective(400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.2s ease-out',
        willChange: 'transform',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${glare.mx}% ${glare.my}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 58%)`,
          transition: 'opacity 0.15s ease',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, display: 'contents' }}>{children}</div>
    </div>
  );
}

// Tooltip that slides out to the LEFT of an icon (rail sits on the right edge)
function HoverTooltip({ label, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 6, scaleX: 0.85 }}
          animate={{ opacity: 1, x: 0, scaleX: 1 }}
          exit={{ opacity: 0, x: 6, scaleX: 0.85 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            right: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginRight: '6px',
            zIndex: 55,
            background: 'rgba(40,30,60,0.92)',
            boxShadow: '-3px 3px 10px rgba(0,0,0,0.4)',
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
          }}
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DOCNavRail({ onTrigger }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div
      className="flex flex-col h-full flex-shrink-0 select-none relative"
      style={{
        width: 64,
        background: PANEL_BG,
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderLeft: `1px solid ${PANEL_BORDER}`,
        boxShadow: '-4px 0 40px rgba(0,0,0,0.45), inset 1px 0 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* Top sheen line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
        zIndex: 1,
      }} />

      {/* DOC chip header with status lights */}
      <div className="flex-shrink-0" style={{ borderBottom: `1px solid ${PANEL_BORDER}` }}>
        <DOCChipHeader />
      </div>

      {/* Nav buttons — fill height evenly */}
      <div
        className="px-1.5 py-2 flex flex-col flex-1 overflow-y-auto overflow-x-visible scrollbar-hide"
        style={{ scrollbarWidth: 'none', gap: '5px' }}
      >
        {NAV_ITEMS.map(({ label, match, icon: Icon }) => (
          <div
            key={label}
            className="relative flex-1"
            onMouseEnter={() => setHovered(label)}
            onMouseLeave={() => setHovered(null)}
            style={{ minHeight: 0 }}
          >
            <LitButton
              onClick={() => onTrigger(match)}
              className="w-full h-full flex items-center justify-center"
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.7)' }} />
            </LitButton>
            <HoverTooltip label={label} visible={hovered === label} />
          </div>
        ))}
      </div>
    </div>
  );
}