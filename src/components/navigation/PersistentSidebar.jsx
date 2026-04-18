import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import {
  LayoutGrid, Folder, Users, TrendingUp, CheckSquare, Phone, Clock,
  MessageSquare, Settings, LogOut, Palette, Building2,
  Sun, Moon, HelpCircle, FileText, ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const SIDEBAR_COLLAPSED_W = 48;
export const SIDEBAR_EXPANDED_W = 220;

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

const quickActions = (handlers, isDark) => [
  { label: 'Messages', icon: MessageSquare, onClick: handlers.onToggleMessages },
  { label: 'Phone', icon: Phone, onClick: handlers.onTogglePhone },
  { label: 'Customize', icon: Palette, onClick: handlers.onToggleBackgroundCustomizer },
  { label: 'Settings', icon: Settings, onClick: null, to: createPageUrl('Settings') },
  { label: isDark ? 'Light' : 'Dark', icon: isDark ? Sun : Moon, onClick: handlers.onToggleTheme },
  { label: 'Help', icon: HelpCircle, onClick: () => {} },
  { label: 'Logout', icon: LogOut, onClick: handlers.onLogout },
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
  const [docCoreHovered, setDocCoreHovered] = useState(false);
  const docCoreTimer = useRef(null);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-search-sidebar'],
    queryFn: () => base44.entities.Customer.list('-updated_date', 50),
    enabled: expanded && searchQuery.length > 0,
  });

  const filteredCustomers = customers.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.primary_phone?.includes(searchQuery)
  );

  const handleLogout = () => base44.auth.logout();

  const actions = quickActions({ onToggleMessages, onTogglePhone, onToggleBackgroundCustomizer, onToggleTheme, onLogout: handleLogout }, isDark);

  const handleDocCoreEnter = () => {
    if (docCoreTimer.current) clearTimeout(docCoreTimer.current);
    setDocCoreHovered(true);
  };
  const handleDocCoreLeave = () => {
    docCoreTimer.current = setTimeout(() => setDocCoreHovered(false), 600);
  };

  // Show DOC/CORE pills when expanded OR when they themselves are hovered
  const showDocCore = expanded || docCoreHovered;

  return (
    <>
      {/* The sidebar panel */}
      <motion.div
        animate={{ width: expanded ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed left-0 top-0 h-full z-[60] flex flex-col"
        style={{
          background: colors.bg,
          boxShadow: `4px 0 20px ${colors.shadowDark}`,
          overflow: 'hidden',
        }}
      >
        {/* Header row: logo + brand */}
        <div
          className="flex items-center flex-shrink-0 px-2"
          style={{ height: '56px', borderBottom: `1px solid ${colors.border}` }}
        >
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
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="ml-2 font-bold text-sm tracking-tight whitespace-nowrap"
                style={{ color: '#7c3aed' }}
              >
                BEN<span style={{ color: '#9ca3af' }}>|</span>CONNECT<sup className="text-[8px]" style={{ color: '#9ca3af' }}>™</sup>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Scrollable content — no scrollbar */}
        <div
          className="flex-1 overflow-y-scroll overflow-x-hidden py-2 px-2 space-y-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.sidebar-scroll::-webkit-scrollbar { display: none; }`}</style>

          {/* Search (expanded only) */}
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: colors.textTertiary }}>
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  </div>
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-7 rounded-xl border-0 h-8 text-xs"
                    style={{ background: colors.bg, boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`, color: colors.text }}
                  />
                </div>
                {searchQuery && filteredCustomers.length > 0 && (
                  <div className="mt-1 rounded-xl overflow-hidden max-h-36 overflow-y-auto"
                    style={{ background: colors.bg, boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}` }}>
                    {filteredCustomers.map(c => (
                      <Link key={c.id} to={createPageUrl(`Customer?id=${c.id}`)} className="block px-3 py-1.5 hover:opacity-80 transition-opacity">
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
          <div className={`grid gap-1.5 ${expanded ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.url;
              return (
                <Link key={item.title} to={item.url}>
                  <motion.div
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="rounded-2xl flex flex-col items-center justify-center gap-1 p-1.5 cursor-pointer"
                    style={{
                      height: expanded ? '52px' : '40px',
                      ...(isActive
                        ? { background: colors.bg, boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}` }
                        : { background: colors.bg, boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}` })
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: isActive ? colors.iconColor : colors.textSecondary }} />
                    {expanded && <span className="text-[9px] font-medium text-center leading-tight" style={{ color: isActive ? colors.text : colors.textSecondary }}>{item.title}</span>}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className={`pt-2 border-t grid gap-1.5 ${expanded ? 'grid-cols-2' : 'grid-cols-1'}`} style={{ borderColor: colors.border }}>
            {actions.map(({ label, icon: Icon, onClick, to }) => {
              const btn = (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={onClick}
                  className="rounded-2xl flex flex-col items-center justify-center gap-1 p-1.5 w-full"
                  style={{ height: expanded ? '52px' : '40px', background: colors.bg, boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}` }}
                >
                  <Icon className="w-5 h-5" style={{ color: colors.textSecondary }} />
                  {expanded && <span className="text-[9px] font-medium text-center leading-tight" style={{ color: colors.textSecondary }}>{label}</span>}
                </motion.button>
              );
              return to ? <Link key={label} to={to} className="w-full">{btn}</Link> : btn;
            })}
          </div>
        </div>

        {/* User footer */}
        <div className="flex-shrink-0 p-2 border-t" style={{ borderColor: colors.border }}>
          <div
            className="flex items-center gap-2 px-2 py-1.5 rounded-2xl"
            style={{ background: colors.bg, boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}` }}
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ background: colors.bg, boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}` }}
            >
              {user?.profile_photo_url
                ? <img src={user.profile_photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                : <span style={{ color: colors.text }} className="font-bold text-xs">{user?.full_name?.charAt(0) || 'U'}</span>
              }
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: colors.text }}>{user?.full_name || 'User'}</p>
                  <p className="text-[10px] truncate" style={{ color: colors.textSecondary }}>{user?.role === 'admin' ? 'Administrator' : 'Agent'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Arrow toggle tab — sits on the right edge of the sidebar */}
      <motion.button
        onClick={() => onExpandedChange(!expanded)}
        animate={{ left: expanded ? SIDEBAR_EXPANDED_W - 12 : SIDEBAR_COLLAPSED_W - 12 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed top-1/2 z-[61] w-6 h-12 rounded-r-xl flex items-center justify-center"
        style={{
          transform: 'translateY(-50%)',
          background: colors.bg,
          boxShadow: `4px 0 12px ${colors.shadowDark}`,
        }}
      >
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRight className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
        </motion.div>
      </motion.button>

      {/* DOC + CORE pills — fixed above the sidebar, always accessible */}
      <div
        onMouseEnter={handleDocCoreEnter}
        onMouseLeave={handleDocCoreLeave}
        className="fixed z-[62]"
        style={{ top: 0, left: 0 }}
      >
        <AnimatePresence>
          {showDocCore && (
            <motion.div
              initial={{ x: -180, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -180, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 240 }}
              className="flex gap-2 px-3 pt-2 pb-1"
              style={{ paddingLeft: `${SIDEBAR_COLLAPSED_W + 8}px` }}
            >
              {/* DOC pill */}
              <button
                onClick={onToggleDoc}
                className="flex items-center gap-2 px-5 py-2 rounded-b-2xl text-sm font-bold cursor-pointer whitespace-nowrap"
                style={{
                  background: colors.bg,
                  color: '#dc2626',
                  boxShadow: `4px 6px 14px ${colors.shadowDark}, -2px -2px 6px ${colors.shadowLight}`,
                }}
              >
                <FileText className="w-4 h-4" />
                DOC™
              </button>

              {/* CORE pill */}
              <Link
                to="/Core"
                className="flex items-center gap-2 px-5 py-2 rounded-b-2xl text-sm font-bold whitespace-nowrap"
                style={{
                  background: colors.bg,
                  color: '#7c3aed',
                  boxShadow: `4px 6px 14px ${colors.shadowDark}, -2px -2px 6px ${colors.shadowLight}`,
                }}
              >
                CORE
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invisible hover zone when pills are hidden — keeps them discoverable */}
        {!showDocCore && (
          <div
            className="absolute"
            style={{ top: 0, left: SIDEBAR_COLLAPSED_W, width: 120, height: 32 }}
          />
        )}
      </div>
    </>
  );
}