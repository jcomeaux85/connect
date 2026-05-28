import React, { useState, useRef, useEffect, useCallback } from 'react';
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

// --- Pointer-driven lit button ---
function LitButton({ children, isActive, style, className, onClick, as: Tag = 'div' }) {
  const btnRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ mx: 50, my: 50, opacity: 0 });
  const [extraShadow, setExtraShadow] = useState('');

  const handleMouseMove = useCallback((e) => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width - 0.5;   // -0.5 to 0.5
    const fy = (e.clientY - r.top) / r.height - 0.5;
    const mx = ((fx + 0.5) * 100);
    const my = ((fy + 0.5) * 100);

    const tiltY = fx * (isActive ? 0 : 4);   // active: flat
    const tiltX = -fy * (isActive ? 0 : 4);

    const shadowDist = isActive ? 2 : Math.sqrt(fx * fx + fy * fy) * 10 + 2;
    const shadowBlur = shadowDist * 2;
    const shadowX = -fx * shadowDist;
    const shadowY = -fy * shadowDist;
    const addedShadow = `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px ${shadowBlur.toFixed(1)}px rgba(0,0,0,0.28)`;

    setTilt({ x: tiltX, y: tiltY });
    setGlare({ mx, my, opacity: isActive ? 0.09 : 0.13 });
    setExtraShadow(addedShadow);
  }, [isActive]);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setGlare(g => ({ ...g, opacity: 0 }));
    setExtraShadow('');
  }, []);

  const baseBoxShadow = style?.boxShadow || '';
  const combinedShadow = extraShadow
    ? baseBoxShadow ? `${baseBoxShadow}, ${extraShadow}` : extraShadow
    : baseBoxShadow;

  return (
    <div
      ref={btnRef}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        boxShadow: combinedShadow,
        transform: `perspective(400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.2s ease-out',
        willChange: 'transform',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Glare overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${glare.mx}% ${glare.my}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 58%)`,
          transition: 'opacity 0.15s ease',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {/* Content above glare */}
      <div style={{ position: 'relative', zIndex: 2, display: 'contents' }}>
        {children}
      </div>
    </div>
  );
}

// Tooltip that slides out to the right of a collapsed icon
function HoverTooltip({ label, visible }) {
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
            zIndex: 55,
            background: 'rgba(40,30,60,0.92)',
            boxShadow: '3px 3px 10px rgba(0,0,0,0.4)',
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
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
  const [isHovered, setIsHovered] = useState(false);
  const [panelGlare, setPanelGlare] = useState({ mx: 50, my: 50 });
  const hideTimer = useRef(null);
  const panelRef = useRef(null);

  const handleMouseEnter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    hideTimer.current = setTimeout(() => setIsHovered(false), 800);
  };

  // Panel-level glare (independent listener)
  const handlePanelMouseMove = useCallback((e) => {
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPanelGlare({
      mx: ((e.clientX - r.left) / r.width) * 100,
      my: ((e.clientY - r.top) / r.height) * 100,
    });
  }, []);

  const level = sidebarLevel ?? 1;
  const width = isHovered ? SIDEBAR_WIDTHS[level - 1] : 0;
  const isMin = level === 1;
  const isMid = level === 2;
  const isFull = level === 3;

  const handleLogout = () => base44.auth.logout();
  const actions = quickActions({ onToggleMessages, onTogglePhone, onToggleBackgroundCustomizer, onToggleTheme, onLogout: handleLogout }, isDark);

  // Deep purple glass panel
  const PANEL_BG = 'linear-gradient(160deg, rgba(55,30,90,0.97) 0%, rgba(38,20,72,0.99) 60%, rgba(28,14,58,1) 100%)';
  const PANEL_BORDER = 'rgba(255,255,255,0.13)';

  const btnStyle = (active) => ({
    background: active
      ? 'linear-gradient(135deg, rgba(124,58,237,0.55) 0%, rgba(109,40,217,0.45) 100%)'
      : 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    boxShadow: active
      ? 'inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(167,139,250,0.35), 0 2px 8px rgba(0,0,0,0.3)'
      : 'inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 4px rgba(0,0,0,0.25)',
    border: active
      ? '1px solid rgba(167,139,250,0.4)'
      : '1px solid rgba(255,255,255,0.10)',
    borderRadius: '10px',
  });

  return (
    <>
      {/* Hover trigger strip */}
      <div
        className="fixed left-0 top-0 h-full z-[59]"
        style={{ width: '12px' }}
        onMouseEnter={handleMouseEnter}
      />

      <motion.div
        ref={panelRef}
        animate={{ width }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed left-0 top-0 h-full z-[60] flex flex-col select-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handlePanelMouseMove}
        style={{
          background: PANEL_BG,
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          borderRight: `1px solid ${PANEL_BG}`,
          boxShadow: '4px 0 40px rgba(0,0,0,0.45), inset -1px 0 0 rgba(255,255,255,0.08)',
          overflow: 'hidden',
          pointerEvents: isHovered ? 'auto' : 'none',
        }}
      >
        {/* Panel background glare — independent of buttons */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${panelGlare.mx}% ${panelGlare.my}%, rgba(255,255,255,0.055) 0%, transparent 62%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Top sheen line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
          zIndex: 1,
        }} />

        <div className="flex flex-col h-full overflow-hidden" style={{ position: 'relative', zIndex: 2 }}>

          {/* Header: BEN|connect logo — tastefully larger, recessed */}
          <div
            className="px-2 flex items-center flex-shrink-0"
            style={{
              height: '64px',
              borderBottom: `1px solid ${PANEL_BORDER}`,
            }}
          >
            <AnimatePresence>
              {!isMin && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col leading-none"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.25)',
                    boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.5px', color: '#a78bfa' }}>
                    BEN<span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>|</span>
                    <span style={{ color: '#fff' }}>connect</span>
                  </span>
                  <span style={{ fontSize: '8px', fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', marginTop: '1px' }}>
                    BENEFITS PLATFORM
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav items — flex column, fill all space */}
          <div
            className="px-1.5 py-2 flex flex-col flex-1 overflow-y-auto overflow-x-visible"
            style={{ scrollbarWidth: 'none', gap: '6px' }}
          >
            {/* Nav buttons — fill height evenly */}
            <div
              className={`flex-1 ${isFull ? 'grid grid-cols-2' : 'flex flex-col'}`}
              style={{ gap: '5px', minHeight: 0 }}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.url;
                const hovered = hoveredItem === item.title;
                return (
                  <div
                    key={item.title}
                    className="relative flex-1"
                    onMouseEnter={() => setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{ minHeight: 0 }}
                  >
                    <Link to={item.url} style={{ display: 'block', height: '100%' }}>
                      <LitButton
                        isActive={isActive}
                        className="w-full h-full flex items-center"
                        style={{
                          ...btnStyle(isActive),
                          padding: isMin ? '0' : '0 10px',
                          justifyContent: isMin ? 'center' : 'flex-start',
                          gap: '8px',
                          minHeight: '32px',
                        }}
                      >
                        <Icon
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.7)' }}
                        />
                        <AnimatePresence>
                          {!isMin && (
                            <motion.span
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                color: isActive ? '#e9d5ff' : 'rgba(255,255,255,0.85)',
                              }}
                            >
                              {item.title}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </LitButton>
                    </Link>
                    {isMin && <HoverTooltip label={item.title} visible={hovered} />}
                  </div>
                );
              })}
            </div>

            {/* Divider + Quick actions */}
            <div
              className={`pt-2 border-t ${isFull ? 'grid grid-cols-2' : 'flex flex-col'}`}
              style={{ borderColor: PANEL_BORDER, gap: '5px' }}
            >
              {actions.map(({ label, icon: Icon, onClick, to }) => {
                const hovered = hoveredItem === `action-${label}`;
                const btn = (
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredItem(`action-${label}`)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <LitButton
                      isActive={false}
                      className="w-full flex items-center"
                      onClick={onClick}
                      style={{
                        ...btnStyle(false),
                        height: '34px',
                        padding: isMin ? '0' : '0 10px',
                        justifyContent: isMin ? 'center' : 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.65)' }} />
                      <AnimatePresence>
                        {!isMin && (
                          <motion.span
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.75)' }}
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </LitButton>
                    {isMin && <HoverTooltip label={label} visible={hovered} />}
                  </div>
                );
                return to
                  ? <Link key={label} to={to} className="block">{btn}</Link>
                  : <React.Fragment key={label}>{btn}</React.Fragment>;
              })}
            </div>
          </div>

          {/* Size switcher */}
          <div className="flex-shrink-0 p-1.5 border-t" style={{ borderColor: PANEL_BORDER }}>
            <div
              className="flex rounded-xl overflow-hidden"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${PANEL_BORDER}`,
              }}
            >
              {[1, 2, 3].map((l) => (
                <button
                  key={l}
                  onClick={() => onSidebarLevelChange(l)}
                  className="flex-1 flex items-center justify-center transition-all"
                  style={{
                    height: '28px',
                    background: level === l ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
                    color: level === l ? '#fff' : 'rgba(255,255,255,0.4)',
                    fontSize: '10px',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: level === l ? '8px' : '0',
                    boxShadow: level === l ? '2px 2px 6px rgba(0,0,0,0.4)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {l === 1 ? <Minus className="w-3 h-3" /> : l === 2 ? <Square className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* User footer — larger photo */}
          <div className="flex-shrink-0 p-2 border-t" style={{ borderColor: PANEL_BORDER }}>
            <div
              className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div
                className="rounded-xl overflow-hidden flex-shrink-0"
                style={{
                  width: isMin ? '28px' : '36px',
                  height: isMin ? '28px' : '36px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  transition: 'width 0.2s, height 0.2s',
                }}
              >
                <img
                  src={user?.profile_photo_url || "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/77ac5f78c_kling_20260419__Could_you__3685_5.png"}
                  alt={user?.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
              <AnimatePresence>
                {!isMin && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden min-w-0">
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.full_name || 'User'}
                    </p>
                    <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>
                      {user?.role === 'admin' ? 'Admin' : 'Agent'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}