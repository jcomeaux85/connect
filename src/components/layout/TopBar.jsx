import React, { useState, useEffect } from 'react';
import { Search, Clock, Phone, Moon, Sun, Bell, ChevronDown, PhoneCall } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/ThemeProvider';

const STATUS_OPTIONS = [
  { label: 'Available', color: '#10B981' },
  { label: 'Busy', color: '#F59E0B' },
  { label: 'On Break', color: '#6366F1' },
  { label: 'Offline', color: '#9CA3AF' },
];

export default function TopBar({ user, unreadNotifications, unreadMessages, onToggleNotifications, onToggleMessages, onToggleCalls, showCalls }) {
  const { toggleTheme, isDark } = useTheme();
  const [now, setNow] = useState(new Date());
  const [status, setStatus] = useState('Available');
  const [showStatus, setShowStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const navigate = useNavigate();

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: cases = [] } = useQuery({
    queryKey: ['cases-search'],
    queryFn: () => base44.entities.Case.list('-updated_date', 50),
    enabled: !!user,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-search'],
    queryFn: () => base44.entities.Customer.list('-updated_date', 50),
    enabled: !!user,
  });

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); setShowSearch(false); return; }
    const ql = q.toLowerCase();
    const caseMatches = cases.filter(c =>
      c.customer_name?.toLowerCase().includes(ql) ||
      c.case_number?.toLowerCase().includes(ql)
    ).slice(0, 4).map(c => ({ type: 'case', label: c.customer_name || c.case_number, sub: c.case_number, url: `/Case?id=${c.id}` }));

    const custMatches = customers.filter(c =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(ql) ||
      c.primary_phone?.includes(q)
    ).slice(0, 3).map(c => ({ type: 'contact', label: `${c.first_name} ${c.last_name}`, sub: c.primary_phone, url: `/Customers` }));

    setSearchResults([...caseMatches, ...custMatches]);
    setShowSearch(true);
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.label === status) || STATUS_OPTIONS[0];
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'JD';

  return (
    <div className="flex items-center gap-3 px-4 h-[52px] bg-white border-b border-gray-100 flex-shrink-0 relative z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-0.5 flex-shrink-0 mr-1 select-none">
        <span className="text-sm font-black tracking-tight text-gray-800">B</span>
        <span className="text-sm font-thin text-gray-400">|</span>
        <span className="text-sm font-black tracking-tight text-violet-600">C</span>
      </Link>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          className="w-full pl-9 pr-3 h-8 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
          placeholder="Search cases, contacts, calls..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setShowSearch(false), 200)}
          onFocus={() => searchQuery && setShowSearch(true)}
        />
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
                onClick={() => { navigate(r.url); setSearchQuery(''); setShowSearch(false); }}
              >
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: r.type === 'case' ? '#EDE9FE' : '#DCFCE7', color: r.type === 'case' ? '#6D28D9' : '#065F46' }}>{r.type}</span>
                <span className="text-sm font-medium text-gray-700 flex-1 truncate">{r.label}</span>
                <span className="text-xs text-gray-400">{r.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Clock */}
        <div className="flex items-center gap-1.5 px-3 h-8 bg-gray-50 rounded-lg border border-gray-200 cursor-default select-none">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <div className="text-right">
            <p className="text-xs font-bold text-gray-700 leading-none">{format(now, 'hh:mm:ss aa')}</p>
            <p className="text-[9px] text-gray-400 leading-none mt-0.5">{format(now, 'EEE, MMM d')}</p>
          </div>
        </div>

        {/* Active Call indicator / phone button */}
        <button
          onClick={onToggleCalls}
          className="flex items-center gap-1.5 px-3 h-8 bg-gray-50 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
          style={showCalls ? { borderColor: '#7C3AED', background: '#EDE9FE' } : {}}
        >
          <PhoneCall className="w-3.5 h-3.5" style={{ color: showCalls ? '#7C3AED' : '#9CA3AF' }} />
          <span className="text-xs font-medium" style={{ color: showCalls ? '#7C3AED' : '#9CA3AF' }}>No Active Call</span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-gray-500" />}
        </button>

        {/* Notifications */}
        <button
          onClick={onToggleNotifications}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-3.5 h-3.5 text-gray-500" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>

        {/* Status */}
        <div className="relative">
          <button
            onClick={() => setShowStatus(s => !s)}
            className="flex items-center gap-1.5 px-3 h-8 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="w-2 h-2 rounded-full" style={{ background: currentStatus.color }} />
            <span className="text-xs font-medium text-gray-700">{status}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          {showStatus && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px]">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                  onClick={() => { setStatus(opt.label); setShowStatus(false); }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: opt.color }} />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User avatar */}
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}
        >
          {initials}
        </button>
      </div>
    </div>
  );
}