import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import {
  LayoutGrid, Folder, Users, TrendingUp, CheckSquare, Phone, Clock,
  MessageSquare, Settings, LogOut, Palette, Building2,
  Sun, Moon, HelpCircle, FileText, Minus, Square, Maximize2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Level 1: tiny icon rail (32px)
// Level 2: icon + label inline, medium width (160px)
// Level 3: icon + label + grid layout, full width (220px)
export const SIDEBAR_WIDTHS = [32, 160, 220];

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
  { label: isDark ? 'Light' : 'Dark', icon: isDark ? Sun : Moon, onClick: handlers.onToggleTheme },
  { label: 'Logout', icon: LogOut, onClick: handlers.onLogout },
];

// Tooltip that slides out to the right of a collapsed icon
function HoverTooltip({ label, visible }) {
  const { colors } = useTheme();
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -6, scaleX: 0.85 }}
          animate={{ opacity: 1, x: 0, scaleX: 1 }}
          exit={{ opacity: 0, x: -6, scaleX: 0.85 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: '6px',
            zIndex: 55, // below sidebar z-index of 60
            background: colors.bg,
            boxShadow: `3px 3px 8px ${colors.shadowDark}, -2px -2px 6px ${colors.shadowLight}`,
            color: colors.text,
            padding: '3px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function PersistentSidebar({
  sidebarLevel, onSidebarLevelChange,
  onToggleDoc, onToggleMessages, onTogglePhone,
  onToggleBackgroundCustomizer, onToggleTheme,
  isDark, user
}) {
  const location = useLocation();
  const { colors } = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);

  const level = sidebarLevel ?? 1; // 1, 2, or 3
  const width = SIDEBAR_WIDTHS[level - 1];
  const isMin = level === 1;
  const isMid = level === 2;
  const isFull = level === 3;

  const handleLogout = () => base44.auth.logout();
  const actions = quickActions({ onToggleMessages, onTogglePhone, onToggleBackgroundCustomizer, onToggleTheme, onLogout: handleLogout }, isDark);

  // Neumorphic button style with glare highlight on top edge
  const btnStyle = (active) => ({
    background: colors.bg,
    boxShadow: active
      ? `inset 3px 3px 7px ${colors.shadowDark}, inset -3px -3px 7px ${colors.shadowLight}`
      : `3px 3px 7px ${colors.shadowDark}, -3px -3px 7px ${colors.shadowLight}, inset 0 1px 0 ${colors.shadowLight}`,
    border: 'none',
  });

  return (
    <motion.div
      animate={{ width }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="fixed left-0 top-0 h-full z-[60] flex flex-col select-none"
      style={{
        background: colors.bg,
        boxShadow: `4px 0 24px ${colors.shadowDark}`,
        overflow: 'visible', // allow tooltips to escape
      }}
    >
      {/* Clip the interior but let tooltips escape via a wrapper */}
      <div className="flex flex-col h-full overflow-hidden">

        {/* Header: logo */}
        <div
          className="flex items-center flex-shrink-0 px-1.5 gap-2"
          style={{ height: '56px', borderBottom: `1px solid ${colors.border}` }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto"
            style={btnStyle(false)}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" style={{ color: colors.iconColor }}>
              <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <AnimatePresence>
            {!isMin && (
              <motion.span
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="font-bold text-xs tracking-tight whitespace-nowrap"
                style={{ color: '#7c3aed' }}
              >
                BEN<span style={{ color: '#9ca3af' }}>|</span>CONNECT<sup className="text-[7px]" style={{ color: '#9ca3af' }}>™</sup>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <div
          className="flex-1 overflow-y-auto overflow-x-visible py-2 px-1.5 space-y-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Nav grid */}
          <div className={`grid gap-1.5 ${isFull ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.url;
              const hovered = hoveredItem === item.title;
              return (
                <div
                  key={item.title}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link to={item.url}>
                    <motion.div
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      className="rounded-xl flex items-center cursor-pointer overflow-visible"
                      style={{
                        height: isFull ? '44px' : '36px',
                        padding: isMin ? '0' : '0 8px',
                        justifyContent: isMin ? 'center' : 'flex-start',
                        gap: '8px',
                        ...btnStyle(isActive),
                      }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? '#7c3aed' : colors.textSecondary }} />
                      <AnimatePresence>
                        {!isMin && (
                          <motion.span
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-[10px] font-semibold whitespace-nowrap"
                            style={{ color: isActive ? colors.text : colors.textSecondary }}
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                  {/* Slide-out tooltip only on level 1 */}
                  {isMin && <HoverTooltip label={item.title} visible={hovered} />}
                </div>
              );
            })}
          </div>

          {/* Divider + Quick actions */}
          <div className={`pt-2 border-t grid gap-1.5 ${isFull ? 'grid-cols-2' : 'grid-cols-1'}`} style={{ borderColor: colors.border }}>
            {actions.map(({ label, icon: Icon, onClick, to }) => {
              const hovered = hoveredItem === `action-${label}`;
              const btn = (
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredItem(`action-${label}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={onClick}
                    className="rounded-xl flex items-center w-full"
                    style={{
                      height: '36px',
                      padding: isMin ? '0' : '0 8px',
                      justifyContent: isMin ? 'center' : 'flex-start',
                      gap: '8px',
                      ...btnStyle(false),
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: colors.textSecondary }} />
                    <AnimatePresence>
                      {!isMin && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-semibold whitespace-nowrap" style={{ color: colors.textSecondary }}>
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  {isMin && <HoverTooltip label={label} visible={hovered} />}
                </div>
              );
              return to
                ? <Link key={label} to={to} className="w-full block">{btn}</Link>
                : <React.Fragment key={label}>{btn}</React.Fragment>;
            })}
          </div>
        </div>

        {/* Size switcher — 1 / 2 / 3 */}
        <div className="flex-shrink-0 p-1.5 border-t" style={{ borderColor: colors.border }}>
          <div
            className="flex rounded-xl overflow-hidden"
            style={{
              background: colors.bg,
              boxShadow: `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`,
            }}
          >
            {[1, 2, 3].map(l => (
              <button
                key={l}
                onClick={() => onSidebarLevelChange(l)}
                className="flex-1 flex items-center justify-center transition-all"
                style={{
                  height: '28px',
                  background: level === l
                    ? `linear-gradient(135deg, #7c3aed, #6d28d9)`
                    : 'transparent',
                  color: level === l ? '#fff' : colors.textTertiary,
                  fontSize: '10px',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: level === l ? '8px' : '0',
                  boxShadow: level === l ? `2px 2px 5px ${colors.shadowDark}` : 'none',
                  cursor: 'pointer',
                }}
              >
                {l === 1 ? <Minus className="w-3 h-3" /> : l === 2 ? <Square className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>

        {/* User footer */}
        <div className="flex-shrink-0 p-1.5 border-t" style={{ borderColor: colors.border }}>
          <div
            className="flex items-center gap-2 px-1.5 py-1 rounded-xl"
            style={btnStyle(true)}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
              style={btnStyle(false)}
            >
              {user?.profile_photo_url
                ? <img src={user.profile_photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                : <span style={{ color: colors.text }} className="font-bold text-[10px]">{user?.full_name?.charAt(0) || 'U'}</span>
              }
            </div>
            <AnimatePresence>
              {!isMin && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden min-w-0">
                  <p className="text-[10px] font-semibold truncate" style={{ color: colors.text }}>{user?.full_name || 'User'}</p>
                  <p className="text-[9px] truncate" style={{ color: colors.textSecondary }}>{user?.role === 'admin' ? 'Admin' : 'Agent'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}