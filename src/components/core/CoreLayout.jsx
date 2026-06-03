import React from 'react';
import {
  LayoutDashboard, Clock, Calendar, FileText,
  DollarSign, User, Users
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

export default function CoreLayout({ activeSection, onNavigate, children }) {
  return (
    <div className="flex flex-col h-full bg-[#e8e8ee]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Section tab bar (replaces the CORPS sidebar — B|c chrome stays around this) */}
      <div className="flex items-center gap-1 px-4 py-2 bg-[#e8e8ee] border-b border-gray-200/60 flex-shrink-0 overflow-x-auto">
        <span className="text-[11px] font-bold text-purple-500 tracking-widest uppercase mr-3 flex-shrink-0">CORPS</span>
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-500 hover:bg-white/60 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-600' : ''}`} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}