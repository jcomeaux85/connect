import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutGrid,
  Bell,
  Folder,
  Users,
  MessageSquare,
  Phone,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  { title: "Customers", url: createPageUrl("Customers"), icon: Users },
];

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
    boxShadow: active
      ? `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
      : `3px 3px 7px ${colors.shadowDark}, -3px -3px 7px ${colors.shadowLight}, inset 0 1px 0 ${colors.shadowLight}`,
    border: 'none',
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
    refetchInterval: 3000,
  });

  const { data: incomingCallCustomers = {} } = useQuery({
    queryKey: ['incoming-call-customers', incomingCalls.map(c => c.customer_id).join(',')],
    queryFn: async () => {
      const customerIds = incomingCalls.map(c => c.customer_id).filter(Boolean);
      if (customerIds.length === 0) return {};
      const customers = await base44.entities.Customer.list();
      const customerMap = {};
      customers.forEach(customer => {
        if (customerIds.includes(customer.id)) customerMap[customer.id] = customer;
      });
      return customerMap;
    },
    enabled: incomingCalls.length > 0,
  });

  const { data: incomingSMS = [] } = useQuery({
    queryKey: ['incoming-sms'],
    queryFn: async () => {
      if (!user?.email) return [];
      const recentSMS = await base44.entities.SMS.filter({ direction: 'received' }, '-created_date', 10);
      const thirtySecondsAgo = new Date(Date.now() - 30000);
      return recentSMS.filter(sms => new Date(sms.created_date) > thirtySecondsAgo);
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 20);
    },
    enabled: !!user?.email,
    refetchInterval: 15000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['unread-messages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Message.filter({ recipient_email: user.email, is_read: false }, '-created_date', 20);
    },
    enabled: !!user?.email,
    refetchInterval: 10000,
  });

  useEffect(() => {
    const handleToggleMessages = () => { setShowMessages(p => !p); setShowNotifications(false); };
    const handleTogglePhone = () => { setShowCalls(p => !p); setShowMessages(false); setShowNotifications(false); };
    const handleToggleBackgroundCustomizer = () => setShowBackgroundCustomizer(p => !p);
    const handleToggleDoc = () => setShowDOC(p => !p);
    const handleShowDisposition = (e) => setDispositionData(e.detail || {});

    // Ctrl+Alt+Enter (or Ctrl+Alt+D) to toggle DOC
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && (e.key === 'Enter' || e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setShowDOC(p => !p);
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
        onToggleDoc={() => setShowDOC(p => !p)}
        onToggleMessages={() => { setShowMessages(p => !p); setShowNotifications(false); }}
        onTogglePhone={() => { setShowCalls(p => !p); setShowMessages(false); setShowNotifications(false); }}
        onToggleBackgroundCustomizer={() => setShowBackgroundCustomizer(p => !p)}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        user={user}
      />

      {/* Main area: nav + content — never pushed by sidebar */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Top Nav — always visible */}
        <nav
          className="flex-shrink-0 z-50 backdrop-blur-xl"
          style={{ background: `${colors.bg}f0`, borderBottom: `1px solid ${colors.border}`, overflow: 'visible' }}
        >
          <div className="px-3 flex items-stretch justify-between relative" style={{ height: '52px', gap: '8px', overflow: 'visible' }}>

            {/* LEFT: page tabs only */}
            <div className="flex items-end gap-1 flex-shrink-0">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className="flex items-end justify-center pb-2 px-4 no-underline transition-all"
                    style={{
                      boxShadow: isActive
                        ? `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`
                        : `3px 3px 7px ${colors.shadowDark}, -3px -3px 7px ${colors.shadowLight}`,
                      background: isActive ? (isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)') : colors.bg,
                      borderRadius: '0 0 10px 10px',
                      height: '52px',
                    }}
                  >
                    <span className="font-semibold text-[12px] whitespace-nowrap" style={{ color: isActive ? '#7c3aed' : colors.textSecondary }}>{item.title}</span>
                  </Link>
                );
              })}
            </div>

            {/* CENTER: BEN|connect, DOC, Core, HelpHub — no containers, raw tech feel */}
            <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2" style={{ top: 0, bottom: 0, paddingTop: '6px', overflow: 'visible' }}>
              {/* connect */}
              <Link
                to={createPageUrl("Dashboard")}
                className="flex items-center justify-center no-underline"
                style={{ transformOrigin: 'center top' }}
              >
                <img
                  src="https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/1fd155177_hBkNL1.jpg"
                  alt="Connect"
                  className="chip-nav-img"
                  style={{ height: '54px', width: 'auto', objectFit: 'contain', display: 'block', transition: 'transform 0.2s ease', transformOrigin: 'center top' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.5)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </Link>

              <span style={{ color: colors.border, fontSize: '18px', fontWeight: 100 }}>|</span>

              {/* DOC */}
              <button
                onClick={() => setShowDOC(p => !p)}
                className="flex items-center justify-center border-0 bg-transparent"
              >
                <img
                  src="https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/1fd155177_hBkNL1.jpg"
                  alt="DOC"
                  style={{ height: '54px', width: 'auto', objectFit: 'contain', display: 'block', transition: 'transform 0.2s ease', transformOrigin: 'center top' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.5)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </button>

              <span style={{ color: colors.border, fontSize: '18px', fontWeight: 100 }}>|</span>

              {/* Core */}
              <Link
                to="/Core"
                className="flex items-center justify-center no-underline"
              >
                <img
                  src="https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/1fd155177_hBkNL1.jpg"
                  alt="Core"
                  style={{ height: '54px', width: 'auto', objectFit: 'contain', display: 'block', transition: 'transform 0.2s ease', transformOrigin: 'center top' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.5)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </Link>

              <span style={{ color: colors.border, fontSize: '18px', fontWeight: 100 }}>|</span>

              {/* HelpHub */}
              <button
                className="flex items-center justify-center border-0 bg-transparent"
              >
                <img
                  src="https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/1fd155177_hBkNL1.jpg"
                  alt="HelpHub"
                  style={{ height: '54px', width: 'auto', objectFit: 'contain', display: 'block', transition: 'transform 0.2s ease', transformOrigin: 'center top' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.5)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </button>
            </div>

            {/* RIGHT: Phone, Messages, Notifications, Avatar */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Phone */}
              <button
                className="flex items-center justify-center rounded-xl border-0 w-9 h-9"
                onClick={() => { setShowCalls(p => !p); setShowMessages(false); setShowNotifications(false); }}
                style={{
                  boxShadow: showCalls
                    ? `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`
                    : `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}`,
                  background: colors.bg,
                }}
              >
                <Phone className="w-4 h-4" style={{ color: showCalls ? '#7c3aed' : colors.iconColor }} />
              </button>

              {/* Messages */}
              <button
                className="flex items-center justify-center rounded-xl border-0 w-9 h-9 relative"
                onClick={() => { setShowMessages(p => !p); setShowCalls(false); setShowNotifications(false); }}
                style={{
                  boxShadow: showMessages
                    ? `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`
                    : `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}`,
                  background: colors.bg,
                }}
              >
                <MessageSquare className="w-4 h-4" style={{ color: showMessages ? '#7c3aed' : colors.iconColor }} />
                {unreadMessages > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>

              {/* Notifications */}
              <button
                className="flex items-center justify-center rounded-xl border-0 w-9 h-9 relative"
                onClick={() => { setShowNotifications(p => !p); setShowMessages(false); setShowCalls(false); }}
                style={{
                  boxShadow: showNotifications
                    ? `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`
                    : `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}`,
                  background: colors.bg,
                }}
              >
                <Bell className="w-4 h-4" style={{ color: showNotifications ? '#7c3aed' : colors.iconColor }} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* User avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-0 border-0 overflow-hidden flex-shrink-0 rounded-full w-9 h-9"
                    style={{
                      boxShadow: `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}`,
                    }}
                  >
                    <img src={user?.profile_photo_url || "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/77ac5f78c_kling_20260419__Could_you__3685_5.png"} alt={user?.full_name || 'User'} className="w-full h-full object-cover" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end" style={{
                  background: colors.bg, border: 'none',
                  boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`,
                  color: colors.text
                }}>
                  <DropdownMenuLabel style={{ color: colors.text }}>
                    <div>{user?.full_name || 'My Account'}</div>
                    {user?.role === 'admin' && <div className="text-xs" style={{ color: colors.textSecondary }}>Administrator</div>}
                  </DropdownMenuLabel>
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
        {(showNotifications || showMessages) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: `${colors.bg}20` }}
            onClick={() => { setShowNotifications(false); setShowMessages(false); }}
          />
        )}
      </AnimatePresence>

      <NotificationCenter user={user} isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      <MessagingPanel user={user} isOpen={showMessages} onClose={() => setShowMessages(false)} />
      {showCalls && <CallsPanel user={user} isOpen={showCalls} onClose={() => setShowCalls(false)} />}
      <BackgroundCustomizer isOpen={showBackgroundCustomizer} onClose={() => setShowBackgroundCustomizer(false)} />
      <AIAssistantOrb />
      <DispositionForm isOpen={!!dispositionData} onClose={() => setDispositionData(null)} callData={dispositionData} user={user} />
      <DOCModal isOpen={showDOC} onClose={() => setShowDOC(false)} />

      {/* Incoming Call Popups */}
      {incomingCalls.map((call, index) => (
        <div key={call.id} className="fixed right-6 z-[100]" style={{ top: `${24 + (index * 320)}px` }}>
          <IncomingCallPopup
            call={call}
            customer={call.customer_id ? incomingCallCustomers[call.customer_id] : null}
            onAnswer={async () => { await base44.entities.IncomingCall.update(call.id, { status: 'answered', answered_at: new Date().toISOString() }); }}
            onDecline={async () => { await base44.entities.IncomingCall.update(call.id, { status: 'declined' }); }}
            onVoicemail={async () => { await base44.entities.IncomingCall.update(call.id, { status: 'voicemail' }); }}
          />
        </div>
      ))}

      {/* Incoming SMS Popups */}
      {incomingSMS.map((sms, index) => (
        <div key={sms.id} className="fixed right-6 z-[100]" style={{ top: `${24 + (incomingCalls.length * 320) + (index * 280)}px` }}>
          <IncomingSMSPopup
            sms={sms}
            customer={null}
            onReply={async (replyText) => {
              await base44.entities.SMS.create({ case_id: sms.case_id, customer_phone: sms.customer_phone, message: replyText, direction: 'sent', status: 'sent', sent_at: new Date().toISOString() });
            }}
            onDismiss={() => {}}
            onViewCase={() => { if (sms.case_id) window.location.href = createPageUrl(`Case?id=${sms.case_id}`); }}
          />
        </div>
      ))}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </ThemeProvider>
  );
}