import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import {
  LayoutGrid, Folder, Users, TrendingUp, CheckSquare, Phone, Clock,
  MessageSquare, LogOut, Palette, Building2,
  Sun, Moon, ChevronsRight, ChevronsLeft, Pin, PinOff, Play, Lightbulb, Settings,
  MessageSquareHeart, Volume2, Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ChipHeader from '@/components/navigation/ChipHeader';
import AleraLauncher from '@/components/navigation/AleraLauncher';
import { useSpotlight } from '@/components/spotlight/SpotlightContext';

export const SIDEBAR_WIDTHS = [52, 160, 220];

// Vertical distance (px) over which proximity labels fade from full to invisible
const PROXIMITY_FADE = 70;

const navItems = [
  { title: 'Dashboard', url: createPageUrl('Dashboard'), icon: LayoutGrid },
  { title: 'Cases', url: createPageUrl('Cases'), icon: Folder },
  { title: 'Customers', url: createPageUrl('Customers'), icon: Users },
  { title: 'Employers', url: createPageUrl('Employers'), icon: Building2 },
  { title: 'Analytics', url: createPageUrl('Analytics'), icon: TrendingUp },
  { title: 'Tasks', url: createPageUrl('Boards'), icon: CheckSquare },
  { title: 'Call Log', url: createPageUrl('CallLog'), icon: Phone },
  { title: 'Timeline', url: createPageUrl('Timeline'), icon: Clock },
  { title: 'eQuo', url: createPageUrl('Equo'), icon: MessageSquareHeart },
  { title: 'ALERA | loud', url: createPageUrl('Loud'), icon: Volume2 },
  { title: 'OMMNI', url: createPageUrl('OmmniEngine'), icon: Brain },
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
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem('sidebarLocked') === '1');
  const [panelGlare, setPanelGlare] = useState({ mx: 50, my: 50, intensity: 0 });
  const [aleraActive, setAleraActive] = useState(false);
  const hasInteracted = useRef(false);
  const hideTimer = useRef(null);
  const panelRef = useRef(null);
  const mouseOnPanel = useRef(true);

  const handleMouseEnter = () => {
    mouseOnPanel.current = true;
    hasInteracted.current = true;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    mouseOnPanel.current = false;
    // Fade out all proximity labels
    const el = panelRef.current;
    if (el) el.querySelectorAll('[data-proximity-label]').forEach((l) => l.style.opacity = '0');
    if (isLocked || aleraActive) return; // keep sidebar open while Alera column is out
    setPanelGlare((g) => ({ ...g, intensity: 0 })); // light fades back to dark purple
    hideTimer.current = setTimeout(() => setIsHovered(false), 720);
  };

  // Alera launcher broadcasts when its glass column is open; keep the sidebar
  // pinned open for the duration so the column never floats parentless, and
  // follow the normal retract once it closes.
  useEffect(() => {
    const onAlera = (e) => setAleraActive(!!e.detail?.active);
    window.addEventListener('alera-launcher-active', onAlera);
    return () => window.removeEventListener('alera-launcher-active', onAlera);
  }, []);
  useEffect(() => {
    if (aleraActive) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hasInteracted.current = true;
      setIsHovered(true);
    } else if (!mouseOnPanel.current && !isLocked) {
      setPanelGlare((g) => ({ ...g, intensity: 0 }));
      hideTimer.current = setTimeout(() => setIsHovered(false), 320);
    }
  }, [aleraActive, isLocked]);

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

  // Proximity labels: opacity driven by vertical distance from mouse to button center.
  // Direct DOM manipulation (no re-renders) — labels fade in near the cursor and
  // decay with distance, just like the panel glare.
  const updateProximityLabels = useCallback((clientX, clientY) => {
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.querySelectorAll('[data-proximity-label]').forEach((label) => {
      const btn = label.parentElement;
      if (!btn) return;
      const br = btn.getBoundingClientRect();
      const btnCenterY = br.top + br.height / 2;
      const distY = Math.abs(clientY - btnCenterY);
      const yFade = Math.max(0, 1 - distY / PROXIMITY_FADE);
      // Horizontal gate: labels start appearing within 140px to the right of
      // the sidebar (approaching from content area), full at the sidebar edge.
      const xDist = Math.max(0, clientX - r.right);
      const xFade = Math.max(0, 1 - xDist / 140);
      label.style.opacity = (yFade * xFade).toFixed(3);
    });
  }, []);

  // Panel-level glare (independent listener) -- full intensity when cursor is on the panel
  const handlePanelMouseMove = useCallback((e) => {
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPanelGlare({
      mx: ((e.clientX - r.left) / r.width) * 100,
      my: ((e.clientY - r.top) / r.height) * 100,
      intensity: 1,
    });
    updateProximityLabels(e.clientX, e.clientY);
  }, [updateProximityLabels]);

  const level = sidebarLevel ?? 1;
  const isOpen = isHovered || isLocked || aleraActive;
  const width = isOpen ? SIDEBAR_WIDTHS[level - 1] : 0;
  const isMin = level === 1;
  const isMid = level === 2;
  const isFull = level === 3;

  // Window-level proximity tracking: in narrow mode, labels fade in as the
  // mouse approaches from the content area — before it reaches the sidebar.
  useEffect(() => {
    if (!isMin || !isOpen) return;
    const onMove = (e) => updateProximityLabels(e.clientX, e.clientY);
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [isMin, isOpen, updateProximityLabels]);

  const handleLogout = () => base44.auth.logout();
  const actions = [
    { label: 'Messages', icon: MessageSquare, onClick: onToggleMessages },
    { label: 'Phone', icon: Phone, onClick: onTogglePhone },
    { label: themeDark ? 'Light' : 'Dark', icon: themeDark ? Sun : Moon, onClick: toggleTheme, gear: onToggleBackgroundCustomizer },
    { label: 'Logout', icon: LogOut, onClick: handleLogout },
  ];

  // Narrow-mode hover tooltip: rendered as a fixed overlay (sibling of the
  // panel) so it escapes the sidebar's overflow clipping without creating a
  // horizontal scrollbar inside the nav scroll container.
  const [hoverTip, setHoverTip] = useState(null);
  const showNavTip = (e, text) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHoverTip({ text, x: r.right + 8, y: r.top + r.height / 2 });
  };
  const hideNavTip = () => setHoverTip(null);

  // Deep purple glass panel
  const PANEL_BG = 'linear-gradient(160deg, rgba(55,30,90,0.38) 0%, rgba(38,20,72,0.42) 60%, rgba(28,14,58,0.48) 100%)';
  const PANEL_BORDER = 'rgba(255,255,255,0.13)';

  const btnStyle = (active) => ({
    background: active
      ? 'linear-gradient(135deg, rgba(124,58,237,0.55) 0%, rgba(109,40,217,0.45) 100%)'
      : 'rgba(255,255,255,0.07)',
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
      {/* Approach zone -- pre-warms the cursor light; brightness ramps as you near the panel */}
      <div
        className="fixed left-0 top-0 h-full z-[59]"
        style={{ width: '34px' }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={(e) => {
          // Closer to the panel (right edge of the 34px strip) = brighter pre-glow
          const approachPct = e.clientX / 34;            // ~0 at far edge, ~1 near panel
          setPanelGlare((g) => ({
            ...g,
            my: (e.clientY / window.innerHeight) * 100,
            mx: 18,
            intensity: Math.min(approachPct * 0.6, 0.6), // faint at distance, grows on approach
          }));
          updateProximityLabels(e.clientX, e.clientY);
        }}
      />

      {/* Off-click catcher -- closes sidebar and swallows the click so it doesn't hit the page */}
      {isHovered && !isLocked && !aleraActive && (
        <div
          className="fixed inset-0 z-[58]"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (hideTimer.current) clearTimeout(hideTimer.current);
            setPanelGlare((g) => ({ ...g, intensity: 0 }));
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
        {/* Panel background glare -- intensity-driven so it fades out on leave and ramps on approach */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${panelGlare.mx}% ${panelGlare.my}%, rgba(220,198,255,${(0.18 * panelGlare.intensity).toFixed(3)}) 0%, rgba(255,255,255,${(0.09 * panelGlare.intensity).toFixed(3)}) 30%, transparent 70%)`,
            pointerEvents: 'none',
            transition: 'background 0.4s ease',
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

          {/* Nav items -- natural height, scroll if overflow */}
          <div
            className="px-1.5 py-2 flex flex-col flex-1 overflow-y-auto overflow-x-hidden"
            style={{ scrollbarWidth: 'none', gap: '6px' }}
          >
            {/* Nav buttons -- natural height, no stretch */}
            <div
              className={`${isFull ? 'grid grid-cols-2' : 'flex flex-col'}`}
              style={{
                gap: '5px',
                flex: '1 1 auto',
                ...(isFull ? { gridAutoRows: 'minmax(38px, 1fr)' } : {}),
              }}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.url;
                return (
                  <div
                    key={item.title}
                    className="relative nav-slide-wrap"
                    style={isFull ? { minHeight: '38px' } : { flex: '1 1 auto', minHeight: '38px' }}
                    onMouseEnter={(e) => isMin && showNavTip(e, item.title)}
                    onMouseLeave={hideNavTip}
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
                          height: '100%',
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
                                textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                              }}
                            >
                              {item.title}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </LitButton>
                    </Link>

                  </div>
                );
              })}
            </div>

            {/* ALERA | one launcher — replaces the old DOC + CORPS brand row.
                 Hover reveals a full-screen brightwash + sliding icon row. */}
            {!isMin && (
              <div
                className="pt-2 border-t flex flex-col items-center"
                style={{ borderColor: PANEL_BORDER, gap: '10px' }}
              >
                <AleraLauncher onToggleDoc={onToggleDoc} />
              </div>
            )}

            {/* Divider + Quick actions */}
            <div
              className={`pt-2 border-t ${isFull ? 'grid grid-cols-2' : 'flex flex-col'}`}
              style={{ borderColor: PANEL_BORDER, gap: '5px' }}
            >
              {actions.map(({ label, icon: Icon, onClick, to, active, gear }) => {
                const btn = (
                  <div
                    className="relative flex items-center gap-1.5 nav-slide-wrap"
                    onMouseEnter={(e) => isMin && showNavTip(e, label)}
                    onMouseLeave={hideNavTip}
                  >
                    <LitButton
                      isActive={!!active}
                      className="flex-1 flex items-center"
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
                            style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </LitButton>
                    {gear && !isMin && (
                      <button
                        onClick={gear}
                        title="Customize background"
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ ...btnStyle(false), width: '34px', height: '34px' }}
                      >
                        <Settings className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.65)' }} />
                      </button>
                    )}

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
          </div>

          {/* User footer -- larger photo */}
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
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                      {user?.full_name || 'User'}
                    </p>
                    <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                      {user?.role === 'admin' ? 'Admin' : 'Agent'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Narrow-mode hover tooltip -- fixed overlay, escapes sidebar clipping */}
      {isMin && isOpen && hoverTip && (
        <div
          style={{
            position: 'fixed',
            left: `${hoverTip.x}px`,
            top: `${hoverTip.y}px`,
            transform: 'translateY(-50%)',
            zIndex: 200,
            pointerEvents: 'none',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: 'rgba(255,255,255,0.95)',
            background: 'rgba(30,20,50,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '4px 10px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.55)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}
        >
          {hoverTip.text}
        </div>
      )}
    </>
  );
}