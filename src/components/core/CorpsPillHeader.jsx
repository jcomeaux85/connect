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

// Deep forest green pill — matches the reference screenshot
const container = {
  background: '#2a6946',
  border: '1px solid rgba(181,247,195,0.25)',
  boxShadow: '0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
};
// Inactive nav pill
const raised = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid transparent',
};
// Active nav pill — glowing green border
const pressed = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid #86efac',
  boxShadow: '0 0 12px rgba(134,239,172,0.6), inset 0 0 8px rgba(134,239,172,0.15)',
};
// Search well
const pill = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.12)',
};

export default function CorpsPillHeader({ activeSection, onNavigate }) {
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  return (
    <div className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0">
      <div
        className="flex items-center gap-3 rounded-full px-4 sm:px-5 py-2.5"
        style={container}
      >
        {/* Brand — bright green pixelated monospace */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="bg-transparent border-0 p-0 flex-shrink-0 cursor-pointer transition-transform duration-150 hover:scale-105"
          title="CORPS"
          style={{
            fontFamily: "'VT323', ui-monospace, monospace",
            fontSize: '32px',
            fontWeight: 700,
            lineHeight: 1,
            color: '#b5f7c3',
            letterSpacing: '0.03em',
            textShadow: '0 0 10px rgba(134,239,172,0.6), 0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          CORPS//
        </button>

        {/* Search pill */}
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-300 flex-shrink-0"
          style={{
            ...pill,
            width: focused ? 280 : 140,
            maxWidth: '100%',
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(181,247,195,0.5)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm w-full"
            style={{ color: '#ffffff', caretColor: '#86efac' }}
          />
        </div>

        {/* Section nav buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-1 min-w-0 overflow-hidden"
                style={isActive ? pressed : raised}
                title={label}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? '#86efac' : 'rgba(255,255,255,0.7)' }}
                />
                <span className="truncate" style={{ color: isActive ? '#dcfce7' : 'rgba(255,255,255,0.85)' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}