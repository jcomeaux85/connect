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

// Neumorphic raised surface (light)
const BG = '#e8e8ee';
const SHADOW_DARK = '#c5c5d0';
const SHADOW_LIGHT = '#ffffff';

const raised = {
  background: BG,
  boxShadow: `6px 6px 14px ${SHADOW_DARK}, -6px -6px 14px ${SHADOW_LIGHT}`,
};
const pressed = {
  background: BG,
  boxShadow: `inset 4px 4px 8px ${SHADOW_DARK}, inset -4px -4px 8px ${SHADOW_LIGHT}`,
};
const pill = {
  background: BG,
  boxShadow: `inset 3px 3px 7px ${SHADOW_DARK}, inset -3px -3px 7px ${SHADOW_LIGHT}`,
};

export default function CorpsPillHeader({ activeSection, onNavigate }) {
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  return (
    <div className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0" style={{ background: BG }}>
      <div
        className="flex items-center gap-3 rounded-full px-3 sm:px-5 py-2.5"
        style={raised}
      >
        {/* Brand */}
        <span className="text-[11px] font-bold text-purple-500 tracking-widest uppercase pl-1 flex-shrink-0 hidden lg:block">
          CORPS
        </span>

        {/* Search pill — small by default, expands on focus (shrinking the buttons) */}
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-300 flex-shrink-0"
          style={{
            ...pill,
            width: focused ? 300 : 150,
            maxWidth: '100%',
          }}
        >
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full"
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
                  style={{ color: isActive ? '#7c3aed' : '#6b7280' }}
                />
                <span className="truncate" style={{ color: isActive ? '#7c3aed' : '#4b5563' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}