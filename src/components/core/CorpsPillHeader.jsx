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

// Match the sidebar / top-nav purple glass language exactly
const PANEL_BG = 'linear-gradient(135deg, rgba(55,30,90,0.97) 0%, rgba(38,20,72,0.99) 60%, rgba(28,14,58,1) 100%)';

// Pill container — deep purple glass like the sidebar panel
const container = {
  background: PANEL_BG,
  border: '1px solid rgba(255,255,255,0.13)',
  boxShadow: '0 4px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
};

// Inactive button — glassy white-on-purple (same as sidebar nav buttons)
const raised = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 4px rgba(0,0,0,0.25)',
};
// Active button — violet gradient with glow (same as sidebar active state)
const pressed = {
  background: 'linear-gradient(135deg, rgba(124,58,237,0.55) 0%, rgba(109,40,217,0.45) 100%)',
  border: '1px solid rgba(167,139,250,0.4)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(167,139,250,0.35), 0 2px 8px rgba(0,0,0,0.3)',
};
// Search well — inset glass
const pill = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.3)',
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
            fontSize: '30px',
            lineHeight: 1,
            color: '#ffffff',
            letterSpacing: '0.02em',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
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
            style={{ color: 'rgba(255,255,255,0.9)', caretColor: '#a78bfa' }}
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
                  style={{ color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.7)' }}
                />
                <span className="truncate" style={{ color: isActive ? '#e9d5ff' : 'rgba(255,255,255,0.85)' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}