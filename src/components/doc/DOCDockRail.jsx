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

export default function DOCDockRail({ isDark, onTrigger }) {
  const railBg = isDark ? '#232327' : '#dde3ea';
  const railBdr = isDark ? '#1a1a1e' : '#c8d0da';
  const tileBg = isDark ? '#2c2c31' : '#eef1f6';
  const tileShadow = isDark
    ? '4px 4px 9px #18181b, -3px -3px 7px #303035'
    : '4px 4px 9px #c2cad6, -4px -4px 9px #ffffff';
  return (
    <div
      className="flex flex-col items-center gap-3 py-4 px-2.5 overflow-y-auto scrollbar-hide"
      style={{
        background: railBg,
        borderRight: `1px solid ${railBdr}`,
        boxShadow: isDark ? 'inset -6px 0 14px rgba(0,0,0,0.35)' : 'inset -6px 0 14px rgba(0,0,0,0.06)',
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
              background: tileBg,
              boxShadow: tileShadow,
            }}
          >
            <Icon size={26} style={{ color }} strokeWidth={2} />
          </div>
          <span
            className="text-[10px] font-semibold text-center leading-tight"
            style={{ color: isDark ? '#9aa0ab' : '#5a6672' }}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}