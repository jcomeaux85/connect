import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
// Icons and dropdowns now handled by TopBar component
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
import DOCModal from "@/components/doc/DOCModal.jsx";
import TopBar from "@/components/layout/TopBar";
import HangingNav from "@/components/layout/HangingNav";
import ActiveCallBar from "@/components/calls/ActiveCallBar";
import PersistentCallPanel from "@/components/calls/PersistentCallPanel";

import { ThemeProvider, useTheme } from "@/components/ThemeProvider";

import IncomingCallPopup from "@/components/notifications/IncomingCallPopup";
import IncomingSMSPopup from "@/components/messaging/IncomingSMSPopup";
import { AnimatePresence, motion } from "framer-motion";

// Dock navigation removed — now using TopBar component

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showCalls, setShowCalls] = useState(false);
  const [showBackgroundCustomizer, setShowBackgroundCustomizer] = useState(false);
  const [dispositionData, setDispositionData] = useState(null);
  const [showDOC, setShowDOC] = useState(false); // DOC slide-out panel
  const [sidebarLevel, setSidebarLevel] = useState(() => {
    const saved = localStorage.getItem('sidebarLevel');
    return saved ? parseInt(saved) : 1;
  });
  const [lockedSidebarWidth, setLockedSidebarWidth] = useState(0);

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
        backgroundSize: backgroundSettings.size || '20px 20px'
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
    const handleSidebarLock = (e) => setLockedSidebarWidth(e.detail?.width || 0);

    // Ctrl+Alt+Enter (or Ctrl+Alt+D) to toggle DOC
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && (e.key === 'Enter' || e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setShowDOC((p) => !p);
      }
      // Ctrl+K → open DOC and focus search
      if (e.ctrlKey && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowDOC(true);
        // Signal DOC to focus search (DOCModal listens on isOpen change)
        window.dispatchEvent(new CustomEvent('doc-focus-search'));
      }
    };

    window.addEventListener('toggle-messages', handleToggleMessages);
    window.addEventListener('toggle-phone', handleTogglePhone);
    window.addEventListener('toggle-doc', handleToggleDoc);
    window.addEventListener('show-disposition-form', handleShowDisposition);
    window.addEventListener('sidebar-lock-change', handleSidebarLock);
    window.addEventListener('toggle-background-customizer', handleToggleBackgroundCustomizer);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('toggle-messages', handleToggleMessages);
      window.removeEventListener('toggle-phone', handleTogglePhone);
      window.removeEventListener('toggle-doc', handleToggleDoc);
      window.removeEventListener('show-disposition-form', handleShowDisposition);
      window.removeEventListener('sidebar-lock-change', handleSidebarLock);
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
      

      {/* Main area: nav + content — shifts right when sidebar is locked open */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ marginLeft: lockedSidebarWidth, transition: 'margin-left 0.25s ease-out' }}
      >

        {/* Top Bar — 8x8 style */}
        <TopBar
          user={user}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
          onToggleNotifications={() => {setShowNotifications((p) => !p);setShowMessages(false);setShowCalls(false);}}
          onToggleMessages={() => {setShowMessages((p) => !p);setShowCalls(false);setShowNotifications(false);}}
          onToggleCalls={() => {setShowCalls((p) => !p);setShowMessages(false);setShowNotifications(false);}}
          showCalls={showCalls}
          onToggleDOC={() => setShowDOC((p) => !p)}
          showDOC={showDOC}
        />

        {/* Hanging Nav — hidden on CORPS (it has its own pill header) */}
        {location.pathname !== '/Core' && <HangingNav />}

        {/* Active Call Bar — minimal top strip */}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ scrollbarWidth: 'thin' }}>
          {children}
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 py-1.5 px-6 border-t text-center" style={{ borderColor: colors.border, background: colors.cardBg }}>
          <p className="text-[10px] font-semibold" style={{ color: colors.textTertiary }}>
            BEN<span className="text-gray-300">|</span>connect™ 2026
            <span className="mx-2 text-gray-200">·</span>
            indie<span className="text-gray-300">|</span>render™
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
      <PersistentCallPanel />

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