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

export default function DOCDockRail({ isDark, onTrigger }) {
  return (
    <div
      className="flex flex-col items-center gap-3 py-4 px-2.5 overflow-y-auto scrollbar-hide"
      style={{
        background: PANEL_BG,
        borderRight: `1px solid ${PANEL_BORDER}`,
        boxShadow: 'inset -6px 0 14px rgba(0,0,0,0.35)',
        width: 88,
        flexShrink: 0,
      }}
    >
      {DOCK_ITEMS.map(({ label, match, icon: Icon, color }) => (
        <button
          key={label}
          onClick={() => onTrigger(match)}
          title={label}
          className="group flex flex-col items-center gap-1 flex-shrink-0 transition-transform duration-150 hover:scale-110 active:scale-95"
          style={{ width: '100%' }}
        >
          <div
            className="flex items-center justify-center rounded-2xl"
            style={{
              width: 54,
              height: 54,
              background: 'rgba(255,255,255,0.07)',
              border: `1px solid ${color}55`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 8px rgba(0,0,0,0.3), 0 0 10px ${color}33`,
            }}
          >
            <Icon size={26} style={{ color: '#ffffff' }} strokeWidth={2} />
          </div>
          <span
            className="text-[10px] font-semibold text-center leading-tight"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}