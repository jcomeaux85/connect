import React, { useState } from 'react';
import { useUser } from '@/components/hooks/useUser';
import {
  LayoutDashboard, Clock, Calendar, FileText,
  DollarSign, User, Users, LogOut, Search, Bell, Settings, HelpCircle
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
  const { data: user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex h-screen bg-[#f0f0f5] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div className="w-56 bg-white flex flex-col shadow-sm flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5">
          <div className="text-xl font-bold text-gray-900">
            <span className="text-purple-700">BEN</span>
            <span className="text-gray-400">|</span>
            <span>connect</span>
          </div>
          <div className="text-[10px] font-semibold text-purple-500 tracking-widest uppercase mt-0.5">Pro Workforce</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-600' : ''}`} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-5">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Back to BEN|connect
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 flex-shrink-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees, timecards, requests..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300 font-mono">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <HelpCircle className="w-4 h-4 text-gray-500" />
            </button>
            <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors relative">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
            </button>
            <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Settings className="w-4 h-4 text-gray-500" />
            </button>

            <div className="flex items-center gap-3 ml-2 pl-2 border-l border-gray-100">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-400">{user?.email || ''}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {initials}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}