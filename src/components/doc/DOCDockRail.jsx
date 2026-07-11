import React from 'react';
import {
  Stethoscope,
  Smile,
  Eye,
  HeartPulse,
  Accessibility,
  PiggyBank,
  Pill,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

// Mac-dock style search shortcuts — each triggers the matching DOC category search.
// `match` is the case-insensitive text used to find the category button inside the iframe.
const DOCK_ITEMS = [
  { label: 'Medical', match: 'medical', icon: Stethoscope, color: '#ef4444' },
  { label: 'Dental', match: 'dental', icon: Smile, color: '#f59e0b' },
  { label: 'Vision', match: 'vision', icon: Eye, color: '#3b82f6' },
  { label: 'CLIENT 1', href: 'https://ndrndr.com/alera/doc/client1.pdf', imgSrc: 'https://ndrndr.com/alera/doc/assets/client1.png', color: '#dc2626' },
  { label: 'Life', match: 'life', icon: HeartPulse, color: '#ec4899' },
  { label: 'Disability', match: 'disability', icon: Accessibility, color: '#8b5cf6' },
  { label: 'Retirement', match: 'retirement', icon: PiggyBank, color: '#10b981' },
  { label: 'Pharmacy', match: 'pharmacy', icon: Pill, color: '#06b6d4' },
  { label: 'HSA / FSA', match: 'hsa', icon: Wallet, color: '#84cc16' },
  { label: 'Supplemental', match: 'supplemental', icon: ShieldCheck, color: '#f97316' },
];

// Deep purple glass — matches the Benconnect PersistentSidebar
const PANEL_BG = 'linear-gradient(160deg, rgba(55,30,90,0.97) 0%, rgba(38,20,72,0.99) 60%, rgba(28,14,58,1) 100%)';
const PANEL_BORDER = 'rgba(255,255,255,0.13)';

export default function DOCDockRail({ isDark, onTrigger, accent = '#dc2626' }) {
  return (
    <div
      className="flex flex-col items-center gap-4 py-4 px-2 overflow-y-auto overflow-x-visible scrollbar-hide"
      style={{
        background: PANEL_BG,
        borderRight: `1px solid ${PANEL_BORDER}`,
        boxShadow: 'inset -6px 0 14px rgba(0,0,0,0.35)',
        width: 60,
        flexShrink: 0,
      }}
    >
      {DOCK_ITEMS.map(({ label, match, icon: Icon, href, imgSrc, color }) => (
        <button
          key={label}
          onClick={() => (href ? window.open(href, '_blank', 'noopener') : onTrigger(match))}
          className="group relative flex items-center justify-center flex-shrink-0 transition-transform duration-150 hover:scale-125 active:scale-95"
          style={{ width: 40, height: 40 }}
        >
          {/* Backgroundless icon (or client logo image) — glows the SELECTED CLIENT's accent color on hover */}
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={label}
              className="transition-all duration-150"
              style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 6 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = `drop-shadow(0 0 6px ${accent}) drop-shadow(0 0 10px ${accent})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
            />
          ) : (
            <Icon
              size={26}
              strokeWidth={2}
              className="transition-all duration-150"
              style={{ color: 'rgba(255,255,255,0.82)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = accent;
                e.currentTarget.style.filter = `drop-shadow(0 0 6px ${accent})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.82)';
                e.currentTarget.style.filter = 'none';
              }}
            />
          )}

          {/* Pop-out label — slides out to the right on hover, in the client accent color */}
          <span
            className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold opacity-0 translate-x-[-6px] transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0"
            style={{
              background: 'rgba(20,10,40,0.95)',
              color: '#fff',
              border: `1px solid ${accent}88`,
              boxShadow: `0 4px 14px rgba(0,0,0,0.45), 0 0 8px ${accent}55`,
              zIndex: 50,
            }}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}