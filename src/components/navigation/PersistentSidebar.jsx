import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import {
  LayoutGrid, Folder, Users, TrendingUp, CheckSquare, Phone, Clock,
  MessageSquare, Settings, LogOut, User, Search, Palette, Building2,
  Sun, Moon, HelpCircle, FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const COLLAPSED_W = 56;
const EXPANDED_W = 220;

const navItems = [
  { title: 'Dashboard', url: createPageUrl('Dashboard'), icon: LayoutGrid },
  { title: 'Cases', url: createPageUrl('Cases'), icon: Folder },
  { title: 'Customers', url: createPageUrl('Customers'), icon: Users },
  { title: 'Employers', url: createPageUrl('Employers'), icon: Building2 },
  { title: 'Analytics', url: createPageUrl('Analytics'), icon: TrendingUp },
  { title: 'Tasks', url: createPageUrl('Boards'), icon: CheckSquare },
  { title: 'Call Log', url: createPageUrl('CallLog'), icon: Phone },
  { title: 'Timeline', url: createPageUrl('Timeline'), icon: Clock },
];

export default function PersistentSidebar({
  expanded, onExpandedChange,
  onToggleDoc, onToggleMessages, onTogglePhone,
  onToggleBackgroundCustomizer, onToggleTheme,
  isDark, user
}) {
  const location = useLocation();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const closeTimer = useRef(null);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-search-sidebar'],
    queryFn: () => base44.entities.Customer.list('-updated_date', 50),
    enabled: expanded && searchQuery.length > 0,
  });

  const filteredCustomers = customers.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.primary_phone?.includes(searchQuery)
  );

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onExpandedChange(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      onExpandedChange(false);
      setSearchQuery('');
    }, 400);
  };

  const handleLogout = () => base44.auth.logout();

  const iconBtn = (onClick, Icon, label) => (
    <motion.button
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="rounded-2xl h-14 flex flex-col items-center justify-center gap-1 p-2 w-full"
      style={{ background: colors.bg, boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}` }}
    >
      <Icon className="w-6 h-6" style={{ color: colors.textSecondary }} />
      {expanded && <span className="text-[9px] font-medium text-center leading-tight" style={{ color: colors.textSecondary }}>{label}</span>}
    </motion.button>
  );

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed left-0 top-0 h-full z-[60] flex flex-col"
      style={{
        width: expanded ? `${EXPANDED_W}px` : `${COLLAPSED_W}px`,
        transition: 'width 0.3s ease',
        background: colors.bg,
        boxShadow: `4px 0 16px ${colors.shadowDark}`,
        overflow: 'hidden',
      }}
    >
      {/* Top: logo area */}
      <div className="flex items-center justify-center py-4 flex-shrink-0" style={{ height: '56px', borderBottom: `1px solid ${colors.border}` }}>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: colors.bg, boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}` }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: colors.iconColor }}>
            <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              className="ml-2 font-bold text-sm tracking-tight whitespace-nowrap"
              style={{ color: '#7c3aed' }}
            >
              BEN<span style={{ color: '#9ca3af' }}>|</span>CONNECT<sup className="text-[8px]" style={{ color: '#9ca3af' }}>™</sup>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-3 px-2 space-y-2">

        {/* Search (expanded only) */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: colors.textTertiary }}>
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 rounded-xl border-0 h-9 text-sm"
                  style={{ background: colors.bg, boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`, color: colors.text }}
                />
              </div>
              {searchQuery && filteredCustomers.length > 0 && (
                <div className="mt-1 rounded-xl overflow-hidden max-h-40 overflow-y-auto"
                  style={{ background: colors.bg, boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}` }}>
                  {filteredCustomers.map(c => (
                    <Link key={c.id} to={createPageUrl(`Customer?id=${c.id}`)} className="block px-3 py-2 hover:opacity-80 transition-opacity">
                      <p className="text-xs font-medium" style={{ color: colors.text }}>{c.first_name} {c.last_name}</p>
                      <p className="text-[10px]" style={{ color: colors.textSecondary }}>{c.primary_phone}</p>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav items */}
        <div className={`grid gap-2 ${expanded ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.url;
            return (
              <Link key={item.title} to={item.url}>
                <motion.div
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="rounded-2xl flex flex-col items-center justify-center gap-1 p-2 cursor-pointer"
                  style={{
                    height: expanded ? '56px' : '44px',
                    ...(isActive
                      ? { background: colors.bg, boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}` }
                      : { background: colors.bg, boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}` })
                  }}
                >
                  <Icon className={expanded ? "w-6 h-6" : "w-5 h-5"} style={{ color: isActive ? colors.iconColor : colors.textSecondary }} />
                  {expanded && <span className="text-[9px] font-medium text-center leading-tight" style={{ color: isActive ? colors.text : colors.textSecondary }}>{item.title}</span>}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className={`pt-2 border-t grid gap-2 ${expanded ? 'grid-cols-2' : 'grid-cols-1'}`} style={{ borderColor: colors.border }}>
          {iconBtn(onToggleMessages, MessageSquare, 'Messages')}
          {iconBtn(onTogglePhone, Phone, 'Phone')}
          {iconBtn(onToggleBackgroundCustomizer, Palette, 'Customize')}
          <Link to={createPageUrl('Settings')} className="w-full">{iconBtn(() => {}, Settings, 'Settings')}</Link>
          {iconBtn(onToggleTheme, isDark ? Sun : Moon, isDark ? 'Light' : 'Dark')}
          {iconBtn(onToggleDoc, FileText, 'DOC™')}
          {iconBtn(() => {}, HelpCircle, 'Help')}
          {iconBtn(handleLogout, LogOut, 'Logout')}
        </div>
      </div>

      {/* Footer: user avatar */}
      <div className="flex-shrink-0 p-2 border-t" style={{ borderColor: colors.border }}>
        <div
          className="flex items-center gap-2 px-2 py-2 rounded-2xl"
          style={{ background: colors.bg, boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}` }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ background: colors.bg, boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}` }}
          >
            {user?.profile_photo_url
              ? <img src={user.profile_photo_url} alt={user.full_name} className="w-full h-full object-cover" />
              : <span style={{ color: colors.text }} className="font-bold text-sm">{user?.full_name?.charAt(0) || 'U'}</span>
            }
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden">
                <p className="text-xs font-semibold truncate" style={{ color: colors.text }}>{user?.full_name || 'User'}</p>
                <p className="text-[10px] truncate" style={{ color: colors.textSecondary }}>{user?.role === 'admin' ? 'Administrator' : 'Agent'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}