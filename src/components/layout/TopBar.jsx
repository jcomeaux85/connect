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
    <div className="flex items-center gap-3 px-4 h-[52px] flex-shrink-0 relative z-50"
      style={{
        background: 'linear-gradient(135deg, rgba(55,30,90,0.97) 0%, rgba(38,20,72,0.99) 60%, rgba(28,14,58,1) 100%)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.07), 0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      {/* Logo — app image */}
      <Link to="/" className="flex items-center flex-shrink-0 mr-1 select-none">
        <img
          src="https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/77ac5f78c_kling_20260419__Could_you__3685_5.png"
          alt="BEN|connect"
          className="h-8 w-8 rounded-lg object-cover"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
        />
      </Link>

      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center justify-center flex-shrink-0 transition-colors"
        title="Go back"
        style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.65)',
          cursor: 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
        <input
          className="w-full pl-9 pr-3 h-8 rounded-lg text-sm outline-none"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.9)',
            caretColor: '#a78bfa',
          }}
          placeholder="Search cases, contacts, calls..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setShowSearch(false), 200)}
          onFocus={() => searchQuery && setShowSearch(true)}
        />
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-full rounded-xl shadow-xl z-50 overflow-hidden"
            style={{ background: 'rgba(38,20,72,0.97)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}>
            {searchResults.map((r, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/10"
                onClick={() => { navigate(r.url); setSearchQuery(''); setShowSearch(false); }}
              >
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                  style={{ background: r.type === 'case' ? 'rgba(124,58,237,0.3)' : 'rgba(16,185,129,0.2)', color: r.type === 'case' ? '#c4b5fd' : '#6ee7b7' }}>
                  {r.type}
                </span>
                <span className="text-sm font-medium flex-1 truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{r.label}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{r.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Clock */}
        <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg cursor-default select-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <div className="text-right">
            <p className="text-xs font-bold leading-none" style={{ color: 'rgba(255,255,255,0.85)' }}>{format(now, 'hh:mm:ss aa')}</p>
            <p className="text-[9px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{format(now, 'EEE, MMM d')}</p>
          </div>
        </div>

        {/* Active Call button */}
        <button
          onClick={onToggleCalls}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg transition-colors"
          style={showCalls
            ? { background: 'rgba(124,58,237,0.35)', border: '1px solid rgba(167,139,250,0.5)' }
            : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <PhoneCall className="w-3.5 h-3.5" style={{ color: showCalls ? '#c4b5fd' : 'rgba(255,255,255,0.5)' }} />
          <span className="text-xs font-medium" style={{ color: showCalls ? '#c4b5fd' : 'rgba(255,255,255,0.5)' }}>No Active Call</span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.6)' }} />}
        </button>

        {/* Notifications */}
        <button
          onClick={onToggleNotifications}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <Bell className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.6)' }} />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>

        {/* Status */}
        <div className="relative">
          <button
            onClick={() => setShowStatus(s => !s)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: currentStatus.color }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{status}</span>
            <ChevronDown className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
          {showStatus && (
            <div className="absolute right-0 top-full mt-1 rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px]"
              style={{ background: 'rgba(38,20,72,0.97)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 text-left transition-colors"
                  onClick={() => { setStatus(opt.label); setShowStatus(false); }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: opt.color }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User avatar */}
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#5b21b6)', boxShadow: '0 0 0 2px rgba(167,139,250,0.3)' }}
        >
          {initials}
        </button>
      </div>
    </div>
  );
}