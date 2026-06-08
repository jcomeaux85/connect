import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import {
  LayoutGrid, Folder, Users, TrendingUp, CheckSquare, Phone, Clock,
  MessageSquare, LogOut, Palette, Building2,
  Sun, Moon, ChevronsRight, ChevronsLeft, Pin, PinOff, Play, Lightbulb
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ChipHeader from '@/components/navigation/ChipHeader';
import BrandButton from '@/components/navigation/BrandButton';
import { useSpotlight } from '@/components/spotlight/SpotlightContext';

export const SIDEBAR_WIDTHS = [52, 160, 220];

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

    const tiltY = fx * (isActive ? 0 : 10);   // active: flat, inactive: more tilt
    const tiltX = -fy * (isActive ? 0 : 10);

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
  const navigate = useNavigate();
  const { toggleTheme, isDark: themeDark } = useTheme();
  const { enabled: spotlightOn, toggle: toggleSpotlight } = useSpotlight();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem('sidebarLocked') === '1');
  const [panelGlare, setPanelGlare] = useState({ mx: 50, my: 50 });
  const hasInteracted = useRef(false);
  const hideTimer = useRef(null);
  const panelRef = useRef(null);

  const handleMouseEnter = () => {
    hasInteracted.current = true;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    if (isLocked) return;
    hideTimer.current = setTimeout(() => setIsHovered(false), 720);
  };

  // Clear any pending hide timer on unmount
  useEffect(() => {
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const toggleLock = () => {
    setIsLocked((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarLocked', next ? '1' : '0');
      if (next) {
        hasInteracted.current = true;
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setIsHovered(true);
      }
      return next;
    });
  };

  // Tell the layout how wide to inset the page content when locked
  useEffect(() => {
    const lockedWidth = isLocked ? SIDEBAR_WIDTHS[(sidebarLevel ?? 1) - 1] : 0;
    window.dispatchEvent(new CustomEvent('sidebar-lock-change', { detail: { width: lockedWidth } }));
  }, [isLocked, sidebarLevel]);

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
  const isOpen = isHovered || isLocked;
  const width = isOpen ? SIDEBAR_WIDTHS[level - 1] : 0;
  const isMin = level === 1;
  const isMid = level === 2;
  const isFull = level === 3;

  const handleLogout = () => base44.auth.logout();
  const actions = [
    { label: 'Messages', icon: MessageSquare, onClick: onToggleMessages },
    { label: 'Phone', icon: Phone, onClick: onTogglePhone },
    { label: spotlightOn ? 'Spotlight On' : 'Spotlight', icon: Lightbulb, onClick: toggleSpotlight, active: spotlightOn },
    { label: 'Customize', icon: Palette, onClick: onToggleBackgroundCustomizer },
    { label: themeDark ? 'Light' : 'Dark', icon: themeDark ? Sun : Moon, onClick: toggleTheme },
    { label: 'Logout', icon: LogOut, onClick: handleLogout },
  ];

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
      {/* Approach zone — wider strip that pre-warms the cursor light before the panel opens */}
      <div
        className="fixed left-0 top-0 h-full z-[59]"
        style={{ width: '34px' }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={(e) => {
          // Feed vertical position so the panel hue follows the cursor on approach
          setPanelGlare((g) => ({ ...g, my: (e.clientY / window.innerHeight) * 100, mx: 30 }));
        }}
      />

      {/* Off-click catcher — closes sidebar and swallows the click so it doesn't hit the page */}
      {isHovered && !isLocked && (
        <div
          className="fixed inset-0 z-[58]"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (hideTimer.current) clearTimeout(hideTimer.current);
            setIsHovered(false);
          }}
        />
      )}

      <motion.div
        ref={panelRef}
        initial={{ width: 0 }}
        animate={{ width }}
        transition={hasInteracted.current ? { type: 'spring', damping: 28, stiffness: 260 } : { duration: 0 }}
        className="fixed left-0 top-0 h-full z-[60] flex flex-col select-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handlePanelMouseMove}
        style={{
          background: PANEL_BG,
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          borderRight: `1px solid ${PANEL_BORDER}`,
          boxShadow: '4px 0 40px rgba(0,0,0,0.45), inset -1px 0 0 rgba(255,255,255,0.08)',
          overflow: 'hidden',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* Panel background glare — independent of buttons, slightly stronger + warm hue */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${panelGlare.mx}% ${panelGlare.my}%, rgba(214,190,255,0.13) 0%, rgba(255,255,255,0.07) 30%, transparent 66%)`,
            pointerEvents: 'none',
            transition: 'background 0.5s ease',
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

          {/* Header: embedded BEN|CONNECT chip with status lights */}
          <div
            className="flex-shrink-0"
            style={{ borderBottom: `1px solid ${PANEL_BORDER}` }}
          >
            <ChipHeader />
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

            {/* DOC + CORPS brand buttons — shiny pillowed, cursor-reactive — always stacked, long */}
            <div className="pt-2 border-t flex flex-col" style={{ borderColor: PANEL_BORDER, gap: '6px' }}>
              <BrandButton
                title="DOC"
                subtitle="Directory of Coverage v2.7"
                titleColor="rgba(255,0,0,1)"
                onClick={onToggleDoc}
              />
              <BrandButton
                title="CORPS"
                subtitle="Can't Outsource Real Problem Solving"
                titleColor="#16a34a"
                titleFont="'JetBrains Mono', 'Fira Code', ui-monospace, monospace"
                onClick={() => navigate('/Core')}
              />
            </div>

            {/* Divider + Quick actions */}
            <div
              className={`pt-2 border-t ${isFull ? 'grid grid-cols-2' : 'flex flex-col'}`}
              style={{ borderColor: PANEL_BORDER, gap: '5px' }}
            >
              {actions.map(({ label, icon: Icon, onClick, to, active }) => {
                const hovered = hoveredItem === `action-${label}`;
                const btn = (
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredItem(`action-${label}`)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <LitButton
                      isActive={!!active}
                      className="w-full flex items-center"
                      onClick={onClick}
                      style={{
                        ...btnStyle(!!active),
                        height: '34px',
                        padding: isMin ? '0' : '0 10px',
                        justifyContent: isMin ? 'center' : 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? '#fde68a' : 'rgba(255,255,255,0.65)' }} />
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

          {/* Size cycle + pin/lock buttons */}
          <div className="flex-shrink-0 p-1.5 border-t flex justify-center gap-1.5" style={{ borderColor: PANEL_BORDER }}>
            <button
              onClick={() => onSidebarLevelChange(level === 3 ? 1 : level + 1)}
              title={level === 3 ? 'Collapse' : 'Expand'}
              style={{
                width: '36px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.35)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              {level === 3
                ? <ChevronsLeft className="w-3.5 h-3.5" />
                : <ChevronsRight className="w-3.5 h-3.5" />
              }
            </button>
            <button
              onClick={toggleLock}
              title={isLocked ? 'Unlock sidebar' : 'Lock sidebar open'}
              style={{
                width: '36px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isLocked ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)',
                border: isLocked ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: isLocked ? '#fff' : 'rgba(255,255,255,0.5)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (!isLocked) { e.currentTarget.style.background = 'rgba(124,58,237,0.35)'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { if (!isLocked) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
            >
              {isLocked
                ? <Pin className="w-3.5 h-3.5" />
                : <PinOff className="w-3.5 h-3.5" />
              }
            </button>
            <button
              onClick={() => navigate('/CallQueueDemo')}
              title="View demo"
              style={{
                width: '36px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.35)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              <Play className="w-3.5 h-3.5" />
            </button>
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