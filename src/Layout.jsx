import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutGrid,
  Bell,
  Folder,
  Users,
  MessageSquare,
  Phone,
  FileText } from
"lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import { useQuery } from '@tanstack/react-query';
import { useUser } from "@/components/hooks/useUser";

import NotificationCenter from "@/components/notifications/NotificationCenter";
import MessagingPanel from "@/components/messaging/MessagingPanel";
import CallsPanel from "@/components/calls/CallsPanel";
import DispositionForm from "@/components/calls/DispositionForm";
import AIAssistantOrb from "@/components/assistant/AIAssistantOrb";
import PersistentSidebar, { SIDEBAR_WIDTHS } from "@/components/navigation/PersistentSidebar";
import BackgroundCustomizer from "@/components/settings/BackgroundCustomizer";
import DOCModal from "@/components/doc/DOCModal";

import { ThemeProvider, useTheme } from "@/components/ThemeProvider";

import IncomingCallPopup from "@/components/notifications/IncomingCallPopup";
import IncomingSMSPopup from "@/components/messaging/IncomingSMSPopup";
import { AnimatePresence, motion } from "framer-motion";

const navigationItems = [
{ title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutGrid },
{ title: "Cases", url: createPageUrl("Cases"), icon: Folder },
{ title: "Customers", url: createPageUrl("Customers"), icon: Users }];


const DOCK_ITEMS = [
  { label: 'connect', color: '#a855f7', href: '/Dashboard' },
  { label: 'doc',     color: '#ef4444', href: '/DOC' },
  { label: 'core',    color: '#22c55e', href: '/Core' },
  { label: 'help',    color: '#3b82f6', href: null },
];

const BASE_FONT = 15;
const MAX_FONT = 24;
const REACH = 130;

function DockNav({ colors }) {
  const dockRef = useRef(null);
  const itemRefs = useRef([]);
  const [scales, setScales] = useState(DOCK_ITEMS.map(() => 0));
  const [pressed, setPressed] = useState(null);
  const [active, setActive] = useState(null);

  const handleMouseMove = (e) => {
    const newScales = DOCK_ITEMS.map((_, i) => {
      const el = itemRefs.current[i];
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(e.clientX - center);
      if (dist >= REACH) return 0;
      const t = 1 - dist / REACH;
      return t * t * (3 - 2 * t);
    });
    setScales(newScales);
  };

  const handleMouseLeave = () => setScales(DOCK_ITEMS.map(() => 0));

  return (
    <div
      ref={dockRef}
      className="flex items-center justify-center"
      style={{ gap: 'clamp(10px, 2vw, 28px)', overflow: 'visible' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {DOCK_ITEMS.map((item, i) => {
        const t = scales[i];
        const fontSize = BASE_FONT + (MAX_FONT - BASE_FONT) * t;
        // Shadow offset grows with scale — feels like coming toward you
        const shadowBlur = 4 + t * 18;
        const shadowOffset = 1 + t * 9;
        const shadowOpacity = 0.25 + t * 0.45;
        const isActive = active === item.label;
        const isPressed = pressed === item.label;

        const textColor = isActive ? item.color : '#ffffff';
        const textShadow = isActive
          ? `0 ${shadowOffset}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}), 0 0 6px ${item.color}66`
          : `0 ${shadowOffset}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity})`;

        const outline = isActive ? `-1px -1px 0 rgba(255,255,255,0.7), 1px -1px 0 rgba(255,255,255,0.7), -1px 1px 0 rgba(255,255,255,0.7), 1px 1px 0 rgba(255,255,255,0.7)` : 'none';

        const transform = isPressed
          ? 'scale(0.82)'
          : `scale(1)`;

        const inner = (
          <span
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 700,
              letterSpacing: '0.01em',
              color: textColor,
              textShadow: isActive ? `${outline}, ${textShadow}` : textShadow,
              transform,
              display: 'inline-block',
              transition: isPressed
                ? 'transform 0.08s ease-in, font-size 0.13s cubic-bezier(0.34,1.4,0.64,1)'
                : 'transform 0.22s cubic-bezier(0.34,1.4,0.64,1), font-size 0.13s cubic-bezier(0.34,1.4,0.64,1), color 0.18s ease, text-shadow 0.18s ease',
              cursor: 'pointer',
              userSelect: 'none',
              lineHeight: 1,
            }}
          >
            {item.label}
          </span>
        );

        return (
          <div
            key={item.label}
            ref={el => itemRefs.current[i] = el}
            style={{ display: 'flex', alignItems: 'center' }}
            onMouseDown={() => setPressed(item.label)}
            onMouseUp={() => {
              setPressed(null);
              setActive(item.label);
            }}
            onMouseLeave={() => setPressed(null)}
          >
            {item.href
              ? <Link to={item.href} className="no-underline">{inner}</Link>
              : <button className="border-0 bg-transparent p-0">{inner}</button>
            }
          </div>
        );
      })}
    </div>
  );
}

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showCalls, setShowCalls] = useState(false);
  const [showBackgroundCustomizer, setShowBackgroundCustomizer] = useState(false);
  const [dispositionData, setDispositionData] = useState(null);
  const [showDOC, setShowDOC] = useState(false);
  const [sidebarLevel, setSidebarLevel] = useState(() => {
    const saved = localStorage.getItem('sidebarLevel');
    return saved ? parseInt(saved) : 1;
  });

  const { theme, toggleTheme, colors, getButtonStyle, getInsetStyle, isDark, backgroundSettings, getTransitionDuration } = useTheme();
  // isDark already destructured above
  // Neumorphic button with glare highlight on top edge
  const navBtnStyle = (active = false) => ({
    background: colors.bg,
    boxShadow: active ?
    `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}` :
    `3px 3px 7px ${colors.shadowDark}, -3px -3px 7px ${colors.shadowLight}, inset 0 1px 0 ${colors.shadowLight}`,
    border: 'none'
  });

  const getBackgroundStyle = () => {
    if (!backgroundSettings?.value) return { background: colors.bg };
    if (backgroundSettings.type === 'image') {
      return { background: `linear-gradient(${colors.bg}ee, ${colors.bg}ee), url(${backgroundSettings.value}) center/cover fixed` };
    }
    if (backgroundSettings.type === 'texture') {
      return {
        background: colors.bg,
        backgroundImage: backgroundSettings.value,
        backgroundSize: backgroundSettings.preset === 'dots' ? '20px 20px' :
        backgroundSettings.preset === 'grid' ? '40px 40px' :
        backgroundSettings.preset === 'diagonal' ? '10px 10px' : 'auto'
      };
    }
    return { background: colors.bg };
  };

  const { data: user } = useUser();

  // Incoming calls polling
  const { data: incomingCalls = [] } = useQuery({
    queryKey: ['incoming-calls'],
    queryFn: () => base44.entities.IncomingCall.filter({ status: 'ringing' }, '-created_date'),
    enabled: !!user?.email,
    refetchInterval: 3000
  });

  const { data: incomingCallCustomers = {} } = useQuery({
    queryKey: ['incoming-call-customers', incomingCalls.map((c) => c.customer_id).join(',')],
    queryFn: async () => {
      const customerIds = incomingCalls.map((c) => c.customer_id).filter(Boolean);
      if (customerIds.length === 0) return {};
      const customers = await base44.entities.Customer.list();
      const customerMap = {};
      customers.forEach((customer) => {
        if (customerIds.includes(customer.id)) customerMap[customer.id] = customer;
      });
      return customerMap;
    },
    enabled: incomingCalls.length > 0
  });

  const { data: incomingSMS = [] } = useQuery({
    queryKey: ['incoming-sms'],
    queryFn: async () => {
      if (!user?.email) return [];
      const recentSMS = await base44.entities.SMS.filter({ direction: 'received' }, '-created_date', 10);
      const thirtySecondsAgo = new Date(Date.now() - 30000);
      return recentSMS.filter((sms) => new Date(sms.created_date) > thirtySecondsAgo);
    },
    enabled: !!user?.email,
    refetchInterval: 5000
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 20);
    },
    enabled: !!user?.email,
    refetchInterval: 15000
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['unread-messages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Message.filter({ recipient_email: user.email, is_read: false }, '-created_date', 20);
    },
    enabled: !!user?.email,
    refetchInterval: 10000
  });

  useEffect(() => {
    const handleToggleMessages = () => {setShowMessages((p) => !p);setShowNotifications(false);};
    const handleTogglePhone = () => {setShowCalls((p) => !p);setShowMessages(false);setShowNotifications(false);};
    const handleToggleBackgroundCustomizer = () => setShowBackgroundCustomizer((p) => !p);
    const handleToggleDoc = () => setShowDOC((p) => !p);
    const handleShowDisposition = (e) => setDispositionData(e.detail || {});

    // Ctrl+Alt+Enter (or Ctrl+Alt+D) to toggle DOC
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && (e.key === 'Enter' || e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setShowDOC((p) => !p);
      }
    };

    window.addEventListener('toggle-messages', handleToggleMessages);
    window.addEventListener('toggle-phone', handleTogglePhone);
    window.addEventListener('toggle-doc', handleToggleDoc);
    window.addEventListener('show-disposition-form', handleShowDisposition);
    window.addEventListener('toggle-background-customizer', handleToggleBackgroundCustomizer);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('toggle-messages', handleToggleMessages);
      window.removeEventListener('toggle-phone', handleTogglePhone);
      window.removeEventListener('toggle-doc', handleToggleDoc);
      window.removeEventListener('show-disposition-form', handleShowDisposition);
      window.removeEventListener('toggle-background-customizer', handleToggleBackgroundCustomizer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadNotifications = notifications.length;
  const unreadMessages = messages.length;

  const handleSidebarLevelChange = (level) => {
    setSidebarLevel(level);
    localStorage.setItem('sidebarLevel', level.toString());
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ ...getBackgroundStyle(), transition: `background ${getTransitionDuration(300)}` }}>

      {/* Persistent Sidebar — always rendered, floats over content */}
      <PersistentSidebar
        sidebarLevel={sidebarLevel}
        onSidebarLevelChange={handleSidebarLevelChange}
        onToggleDoc={() => setShowDOC((p) => !p)}
        onToggleMessages={() => {setShowMessages((p) => !p);setShowNotifications(false);}}
        onTogglePhone={() => {setShowCalls((p) => !p);setShowMessages(false);setShowNotifications(false);}}
        onToggleBackgroundCustomizer={() => setShowBackgroundCustomizer((p) => !p)}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        user={user} />
      

      {/* Main area: nav + content — never pushed by sidebar */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Top Nav — always visible */}
        <nav className="flex-shrink-0 z-50"
        style={{ background: '#ffffff', borderBottom: `1px solid ${colors.border}`, overflow: 'visible', position: 'relative' }}>
          
          <div className="bg-[#14004d] text-[hsl(var(--chart-4))] my-1 px-2 opacity-100 rounded grid items-stretch relative" style={{ height: 'clamp(40px, 5vw, 52px)', gridTemplateColumns: '1fr auto 1fr', overflow: 'visible', clipPath: 'none' }}>

            {/* LEFT: page tabs — raised up, drop down on hover */}
            <div className="flex items-end gap-0.5 flex-shrink-0" style={{ overflow: 'visible' }}>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className="flex items-end justify-center nav-tab-drop"
                    style={{
                      paddingBottom: 'clamp(4px, 0.8vw, 8px)',
                      paddingLeft: 'clamp(8px, 1.4vw, 18px)',
                      paddingRight: 'clamp(8px, 1.4vw, 18px)',
                      background: isActive
                        ? 'rgba(237,233,254,0.95)'
                        : 'rgba(255,255,255,0.92)',
                      borderRadius: '0 0 8px 8px',
                      height: '100%',
                      border: isActive
                        ? '1px solid rgba(124,58,237,0.4)'
                        : '1px solid rgba(255,255,255,0.18)',
                      borderTop: 'none',
                      boxShadow: isActive
                        ? 'inset 0 -1px 0 rgba(124,58,237,0.3)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.3)',
                      // start raised above nav, transition down on hover
                      transform: isActive ? 'translateY(0)' : 'translateY(-60%)',
                      transition: 'transform 0.25s cubic-bezier(0.34,1.4,0.64,1)',
                    }}>
                    <span style={{
                      color: isActive ? '#6d28d9' : '#7c3aed',
                      fontSize: 'clamp(9px, 0.85vw, 12px)',
                      fontWeight: isActive ? 700 : 400,
                      textTransform: 'lowercase',
                      whiteSpace: 'nowrap',
                      textShadow: isActive ? 'inset 0 1px 2px rgba(109,40,217,0.4)' : 'none',
                    }}>{item.title}</span>
                  </Link>);
              })}
            </div>

            {/* CENTER: Mac-style Dock */}
            <DockNav colors={colors} />

            {/* RIGHT: Avatar with Phone/Messages/Notifications collapsed underneath */}
            <div className="flex items-center flex-shrink-0 justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-0 overflow-hidden flex-shrink-0 rounded-full relative"
                    style={{
                      width: 'clamp(28px, 2.5vw, 36px)', height: 'clamp(28px, 2.5vw, 36px)',
                      boxShadow: `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}`,
                      border: '1px solid #ffffff'
                    }}>
                    <img src={user?.profile_photo_url || "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/77ac5f78c_kling_20260419__Could_you__3685_5.png"} alt={user?.full_name || 'User'} className="w-full h-full object-cover" />
                    {(unreadNotifications + unreadMessages) > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[7px] rounded-full flex items-center justify-center font-bold">
                        {unreadNotifications + unreadMessages > 9 ? '9+' : unreadNotifications + unreadMessages}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52" align="end" style={{ background: colors.bg, border: '1px solid #ffffff', boxShadow: `4px 4px 10px ${colors.shadowDark}`, color: colors.text }}>
                  <DropdownMenuLabel style={{ color: colors.text }}>
                    <div>{user?.full_name || 'My Account'}</div>
                    {user?.role === 'admin' && <div className="text-xs" style={{ color: colors.textSecondary }}>Administrator</div>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator style={{ background: colors.border }} />
                  {/* Quick action icons */}
                  <div className="flex items-center gap-2 px-2 py-2">
                    <button
                      onClick={() => {setShowCalls((p) => !p);setShowMessages(false);setShowNotifications(false);}}
                      className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl border-0"
                      style={{ background: showCalls ? `inset 2px 2px 4px ${colors.shadowDark}` : colors.bg, boxShadow: showCalls ? `inset 2px 2px 5px ${colors.shadowDark}` : `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}` }}>
                      <Phone style={{ width: '14px', height: '14px', color: showCalls ? '#7c3aed' : colors.iconColor }} />
                      <span style={{ fontSize: '9px', color: colors.textSecondary }}>Phone</span>
                    </button>
                    <button
                      onClick={() => {setShowMessages((p) => !p);setShowCalls(false);setShowNotifications(false);}}
                      className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl border-0 relative"
                      style={{ background: colors.bg, boxShadow: showMessages ? `inset 2px 2px 5px ${colors.shadowDark}` : `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}` }}>
                      <MessageSquare style={{ width: '14px', height: '14px', color: showMessages ? '#7c3aed' : colors.iconColor }} />
                      {unreadMessages > 0 && <span className="absolute top-0.5 right-1 w-3 h-3 bg-green-500 text-white text-[7px] rounded-full flex items-center justify-center font-bold">{unreadMessages > 9 ? '9+' : unreadMessages}</span>}
                      <span style={{ fontSize: '9px', color: colors.textSecondary }}>Msgs</span>
                    </button>
                    <button
                      onClick={() => {setShowNotifications((p) => !p);setShowMessages(false);setShowCalls(false);}}
                      className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl border-0 relative"
                      style={{ background: colors.bg, boxShadow: showNotifications ? `inset 2px 2px 5px ${colors.shadowDark}` : `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}` }}>
                      <Bell style={{ width: '14px', height: '14px', color: showNotifications ? '#7c3aed' : colors.iconColor }} />
                      {unreadNotifications > 0 && <span className="absolute top-0.5 right-1 w-3 h-3 bg-red-500 text-white text-[7px] rounded-full flex items-center justify-center font-bold">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
                      <span style={{ fontSize: '9px', color: colors.textSecondary }}>Alerts</span>
                    </button>
                  </div>
                  <DropdownMenuSeparator style={{ background: colors.border }} />
                  <DropdownMenuItem asChild><Link to="#" style={{ color: colors.text }}>Your Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="#" style={{ color: colors.text }}>Settings</Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => base44.auth.logout()} style={{ color: colors.text }}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin' }}>
          {children}
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 py-2 px-6 border-t text-center" style={{ borderColor: colors.border, background: colors.bg }}>
          <p className="text-xs font-bold" style={{ color: colors.text }}>
            BEN<span style={{ color: colors.textSecondary }}>|</span>CONNECT<sup className="text-[8px] ml-0.5" style={{ color: colors.textTertiary }}>™</sup> 2026
            <span className="mx-2" style={{ color: colors.textTertiary }}>·</span>
            <span style={{ color: colors.textSecondary }}>indie<span style={{ color: colors.textTertiary }}>|</span>render<sup className="text-[6px]" style={{ color: colors.textTertiary }}>™</sup></span>
          </p>
        </footer>
      </div>

      {/* ─── Global Overlays (always mounted so calls/SMS always ring) ─── */}

      <AnimatePresence>
        {(showNotifications || showMessages) &&
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 backdrop-blur-sm"
          style={{ background: `${colors.bg}20` }}
          onClick={() => {setShowNotifications(false);setShowMessages(false);}} />

        }
      </AnimatePresence>

      <NotificationCenter user={user} isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      <MessagingPanel user={user} isOpen={showMessages} onClose={() => setShowMessages(false)} />
      {showCalls && <CallsPanel user={user} isOpen={showCalls} onClose={() => setShowCalls(false)} />}
      <BackgroundCustomizer isOpen={showBackgroundCustomizer} onClose={() => setShowBackgroundCustomizer(false)} />
      <AIAssistantOrb />
      <DispositionForm isOpen={!!dispositionData} onClose={() => setDispositionData(null)} callData={dispositionData} user={user} />
      <DOCModal isOpen={showDOC} onClose={() => setShowDOC(false)} />

      {/* Incoming Call Popups */}
      {incomingCalls.map((call, index) =>
      <div key={call.id} className="fixed right-6 z-[100]" style={{ top: `${24 + index * 320}px` }}>
          <IncomingCallPopup
          call={call}
          customer={call.customer_id ? incomingCallCustomers[call.customer_id] : null}
          onAnswer={async () => {await base44.entities.IncomingCall.update(call.id, { status: 'answered', answered_at: new Date().toISOString() });}}
          onDecline={async () => {await base44.entities.IncomingCall.update(call.id, { status: 'declined' });}}
          onVoicemail={async () => {await base44.entities.IncomingCall.update(call.id, { status: 'voicemail' });}} />
        
        </div>
      )}

      {/* Incoming SMS Popups */}
      {incomingSMS.map((sms, index) =>
      <div key={sms.id} className="fixed right-6 z-[100]" style={{ top: `${24 + incomingCalls.length * 320 + index * 280}px` }}>
          <IncomingSMSPopup
          sms={sms}
          customer={null}
          onReply={async (replyText) => {
            await base44.entities.SMS.create({ case_id: sms.case_id, customer_phone: sms.customer_phone, message: replyText, direction: 'sent', status: 'sent', sent_at: new Date().toISOString() });
          }}
          onDismiss={() => {}}
          onViewCase={() => {if (sms.case_id) window.location.href = createPageUrl(`Case?id=${sms.case_id}`);}} />
        
        </div>
      )}
    </div>);

}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </ThemeProvider>);

}