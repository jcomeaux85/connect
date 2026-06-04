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
  const [hovered, setHovered] = useState(null);

  return (
    <div className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0" style={{ background: BG }}>
      <div
        className="flex flex-wrap items-center gap-3 rounded-full px-3 sm:px-5 py-2.5"
        style={raised}
      >
        {/* Brand */}
        <span className="text-[11px] font-bold text-purple-500 tracking-widest uppercase pl-1 pr-1 flex-shrink-0 hidden sm:block">
          CORPS
        </span>

        {/* Search pill */}
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2 flex-1 min-w-[140px]"
          style={pill}
        >
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees, timecards, requests..."
            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full"
          />
        </div>

        {/* Section nav icons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            const isHover = hovered === id;
            return (
              <div key={id} className="relative">
                <button
                  onClick={() => onNavigate(id)}
                  onMouseEnter={() => setHovered(id)}
                  onMouseLeave={() => setHovered(null)}
                  className="flex items-center justify-center rounded-full transition-all"
                  style={{
                    width: 38,
                    height: 38,
                    ...(isActive ? pressed : raised),
                  }}
                  aria-label={label}
                >
                  <Icon
                    className="w-[18px] h-[18px]"
                    style={{ color: isActive ? '#7c3aed' : '#6b7280' }}
                  />
                </button>
                {/* Tooltip */}
                {isHover && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white whitespace-nowrap z-20 pointer-events-none"
                    style={{ background: 'rgba(40,30,60,0.92)' }}
                  >
                    {label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}