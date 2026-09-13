import React from 'react';

// Deep forest green pill — matches the reference screenshot
const container = {
  background: '#2a6946',
  border: '1px solid rgba(181,247,195,0.25)',
  boxShadow: '0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
};

// CORPS // RME OF ONE branding rendered as live CRT green-phosphor text
// (main line + subtitle), left-justified, full width, with scanline overlay.
export default function CorpsPillHeader({ activeSection, onNavigate }) {
  return (
    <div className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0">
      <style>{`
        .corps-crt-brand { position: relative; font-family: 'VT323', ui-monospace, monospace; }
        .corps-crt-brand::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 1px, transparent 1px 3px);
          mix-blend-mode: multiply; border-radius: inherit;
        }
        .corps-crt-main {
          font-size: 30px; font-weight: 700; line-height: 1; letter-spacing: 0.03em;
          color: #b5f7c3;
          text-shadow: 0 0 10px rgba(134,239,172,0.6), 0 0 18px rgba(0,255,65,0.25), 0 1px 2px rgba(0,0,0,0.4);
        }
        .corps-crt-sub {
          font-size: 15px; font-weight: 400; line-height: 1.15; letter-spacing: 0.08em;
          color: #86efac; opacity: 0.85; margin-top: 3px;
          text-shadow: 0 0 8px rgba(134,239,172,0.4), 0 1px 2px rgba(0,0,0,0.4);
        }
      `}</style>
      <div
        className="flex items-center gap-3 rounded-full px-4 sm:px-5 py-2.5"
        style={container}
      >
        <button
          onClick={() => onNavigate('dashboard')}
          className="corps-crt-brand bg-transparent border-0 p-0 flex-1 min-w-0 text-left cursor-pointer transition-transform duration-150 hover:scale-[1.01]"
          title="CORPS // RME OF ONE"
        >
          <div className="corps-crt-main">CORPS // RME OF ONE</div>
          <div className="corps-crt-sub">UNIFYING RISK MANAGEMENT ENTERPRISE_</div>
        </button>
      </div>
    </div>
  );
}