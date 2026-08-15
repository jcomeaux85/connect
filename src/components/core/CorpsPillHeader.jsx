import React, { useState } from 'react';
import {
  LayoutDashboard, Clock, Calendar, FileText,
  DollarSign, User, Users, Search
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'timecard', label: 'My Timecard', icon: Clock },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'requests', label: 'Requests', icon: FileText },
  { id: 'pay', label: 'Pay', icon: DollarSign },
  { id: 'my-info', label: 'My Info', icon: User },
  { id: 'team', label: 'Team', icon: Users },
];

// Bold green glass — CORPS accent, strong and confident
const PANEL_BG = 'linear-gradient(160deg, rgba(22,120,70,0.92) 0%, rgba(16,90,55,0.95) 60%, rgba(8,60,38,0.97) 100%)';

const container = {
  background: PANEL_BG,
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(134,239,172,0.45)',
  boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 24px rgba(34,197,94,0.25), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.25)',
};
// Inactive button — subtle raised glass
const raised = {
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 4px rgba(0,0,0,0.3)',
};
// Active button — bold CORPS green accent
const pressed = {
  background: 'linear-gradient(135deg, rgba(34,197,94,0.85) 0%, rgba(22,163,74,0.75) 100%)',
  border: '1px solid rgba(187,247,208,0.6)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 0 0 1px rgba(134,239,172,0.5), 0 2px 12px rgba(34,197,94,0.4)',
};
// Search well — inset glass
const pill = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
};

export default function CorpsPillHeader({ activeSection, onNavigate }) {
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  return (
    <div className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0">
      <div
        className="flex items-center gap-3 rounded-full px-3 sm:px-5 py-2.5"
        style={container}
      >
        {/* Brand — glowing green VT323 logo, clickable */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="bg-transparent border-0 p-0 pl-1 flex-shrink-0 cursor-pointer transition-transform duration-150 hover:scale-105"
          title="CORPS"
          style={{
          fontFamily: "'VT323', ui-monospace, monospace",
          fontSize: '34px',
          fontWeight: 700,
          lineHeight: 1,
          color: '#dcfce7',
          letterSpacing: '0.04em',
          textShadow: '0 0 12px rgba(34,197,94,0.7), 0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          CORPS//
        </button>

        {/* Search pill — small by default, expands on focus (shrinking the buttons) */}
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-300 flex-shrink-0"
          style={{
            ...pill,
            width: focused ? 300 : 150,
            maxWidth: '100%',
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm w-full"
            style={{ color: 'rgba(255,255,255,0.9)', caretColor: '#22C55E' }}
          />
        </div>

        {/* Section nav buttons — stretch to fill remaining space, shrink as search expands */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-1 min-w-0 overflow-hidden"
                style={isActive ? pressed : raised}
                title={label}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? '#86efac' : 'rgba(255,255,255,0.7)' }}
                />
                <span className="truncate font-semibold" style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.92)' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}