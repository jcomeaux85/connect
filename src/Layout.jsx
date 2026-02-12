import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutGrid,
  Search,
  Bell,
  Settings,
  HelpCircle,
  Folder,
  TrendingUp,
  Menu as MenuIcon,
  X,
  Users,
  MessageSquare,
  Moon,
  Sun,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from '@tanstack/react-query';
import { useUser } from "@/components/hooks/useUser";

import NotificationCenter from "@/components/notifications/NotificationCenter";
import MessagingPanel from "@/components/messaging/MessagingPanel";
import CallsPanel from "@/components/calls/CallsPanel";
import AIAssistantOrb from "@/components/assistant/AIAssistantOrb";
import SlideOutMenu from "@/components/navigation/SlideOutMenu";
import BackgroundCustomizer from "@/components/settings/BackgroundCustomizer";

import { ThemeProvider, useTheme } from "@/components/ThemeProvider";

import IncomingCallPopup from "@/components/notifications/IncomingCallPopup";
import IncomingSMSPopup from "@/components/messaging/IncomingSMSPopup";
import { AnimatePresence } from "framer-motion";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutGrid,
  },
  {
    title: "Cases",
    url: createPageUrl("Cases"),
    icon: Folder,
  },
  {
    title: "Customers",
    url: createPageUrl("Customers"),
    icon: Users,
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: TrendingUp,
  },
];

const userNavigation = [
    { name: 'Your Profile', href: '#' },
    { name: 'Settings', href: '#' },
    { name: 'Sign out', href: '#' },
];

function LayoutContent({ children, currentPageName }) {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const [showCalls, setShowCalls] = useState(false);
    const [showPhoneDialer, setShowPhoneDialer] = useState(false);
    const [showBackgroundCustomizer, setShowBackgroundCustomizer] = useState(false);

    const { theme, toggleTheme, colors, getButtonStyle, getInsetStyle, isDark, backgroundSettings, getTransitionDuration } = useTheme();
  
  // Build background style based on settings
  const getBackgroundStyle = () => {
    if (!backgroundSettings?.value) return { background: colors.bg };
    
    if (backgroundSettings.type === 'image') {
      return {
        background: `linear-gradient(${colors.bg}ee, ${colors.bg}ee), url(${backgroundSettings.value}) center/cover fixed`
      };
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

  // Fetch incoming calls
  const { data: incomingCalls = [] } = useQuery({
    queryKey: ['incoming-calls'],
    queryFn: () => base44.entities.IncomingCall.filter({ status: 'ringing' }, '-created_date'),
    enabled: !!user?.email,
    refetchInterval: 3000, // Check every 3 seconds
  });

  // Fetch customers for incoming calls
  const { data: incomingCallCustomers = {} } = useQuery({
    queryKey: ['incoming-call-customers', incomingCalls.map(c => c.customer_id).join(',')],
    queryFn: async () => {
      const customerIds = incomingCalls.map(c => c.customer_id).filter(Boolean);
      if (customerIds.length === 0) return {};
      
      const customers = await base44.entities.Customer.list();
      const customerMap = {};
      customers.forEach(customer => {
        if (customerIds.includes(customer.id)) {
          customerMap[customer.id] = customer;
        }
      });
      return customerMap;
    },
    enabled: incomingCalls.length > 0,
  });

  // Fetch recent unread SMS
  const { data: incomingSMS = [] } = useQuery({
    queryKey: ['incoming-sms'],
    queryFn: async () => {
      if (!user?.email) return [];
      const recentSMS = await base44.entities.SMS.filter({ direction: 'received' }, '-created_date', 10);
      // Only show SMS from last 30 seconds
      const thirtySecondsAgo = new Date(Date.now() - 30000);
      return recentSMS.filter(sms => new Date(sms.created_date) > thirtySecondsAgo);
    },
    enabled: !!user?.email,
    refetchInterval: 5000, // Check every 5 seconds
  });

  useEffect(() => {
    // Listen for toggle events from SlideOutMenu
    const handleToggleMessages = () => {
      setShowMessages(prev => !prev);
      setShowNotifications(false);
      setShowPhoneDialer(false);
    };
    const handleTogglePhone = () => {
      setShowPhoneDialer(prev => !prev);
      setShowMessages(false);
      setShowNotifications(false);
    };
    const handleToggleBackgroundCustomizer = () => {
      setShowBackgroundCustomizer(prev => !prev);
    };

    window.addEventListener('toggle-messages', handleToggleMessages);
    window.addEventListener('toggle-phone', handleTogglePhone);
    window.addEventListener('toggle-background-customizer', handleToggleBackgroundCustomizer);

    return () => {
      window.removeEventListener('toggle-messages', handleToggleMessages);
      window.removeEventListener('toggle-phone', handleTogglePhone);
      window.removeEventListener('toggle-background-customizer', handleToggleBackgroundCustomizer);
    };
  }, []);

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

  const unreadNotifications = notifications.length;
  const unreadMessages = messages.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ ...getBackgroundStyle(), transition: `background ${getTransitionDuration(300)}` }}>
      {/* Blur Backdrop */}
      <AnimatePresence>
        {(showNotifications || showMessages || showCalls) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: `${colors.bg}20` }}
            onClick={() => {
              setShowNotifications(false);
              setShowMessages(false);
              setShowCalls(false);
            }}
          />
        )}
      </AnimatePresence>

      <SlideOutMenu />

      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: `${colors.bg}99` }}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-2">
            <div className="flex items-center flex-shrink-0">
              <Link to={createPageUrl("Dashboard")} className="flex-shrink-0 flex items-center gap-2 lg:gap-3">
                <div
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: colors.bg,
                    boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`
                  }}
                >
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 lg:w-6 lg:h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ color: colors.iconColor }}
                    >
                      <path
                        d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="hidden lg:flex flex-col">
                  <span className="font-bold text-2xl tracking-tight" style={{ color: colors.text }}>
                    BEN<span style={{ color: colors.textSecondary }}>|</span>CONNECT<sup className="text-[10px] ml-0.5" style={{ color: colors.textTertiary }}>™</sup>
                  </span>
                </div>
              </Link>

              <div className="hidden md:ml-3 lg:ml-10 md:flex md:items-baseline md:space-x-1.5 lg:space-x-3 md:flex-shrink">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      className="px-2.5 lg:px-5 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-medium transition-all hover:-translate-y-0.5 relative whitespace-nowrap"
                      style={{
                        ...getButtonStyle(isActive),
                        ...(isActive && {
                          boxShadow: `0 0 8px ${isDark ? '#ffffff50' : '#00000030'}, 0 0 16px ${isDark ? '#ffffff20' : '#00000015'}, ${getButtonStyle(isActive).boxShadow}`
                        })
                      }}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:ml-6 lg:flex lg:justify-end flex-1">
              <div className="max-w-xs w-full">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative">
                  <div
                    className="rounded-2xl"
                    style={getInsetStyle()}
                  >
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5" style={{ color: colors.textTertiary }} />
                    </div>
                    <Input
                      id="search"
                      name="search"
                      className="block w-full pl-12 pr-3 py-3 border-0 rounded-2xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-0 text-sm"
                      placeholder="Search everything..."
                      type="search"
                      style={{
                        background: 'transparent',
                        color: colors.text
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:ml-2 lg:ml-4 md:flex md:items-center md:space-x-1 lg:space-x-2 md:flex-shrink-0">
              <button
                onClick={toggleTheme}
                className="hidden xl:flex rounded-2xl h-10 w-10 lg:h-12 lg:w-12 border-0 items-center justify-center flex-shrink-0"
                style={getButtonStyle()}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: colors.iconColor }} />
                ) : (
                  <Moon className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: colors.iconColor }} />
                )}
              </button>

              <button
                className="hidden lg:flex rounded-2xl h-10 w-10 lg:h-12 lg:w-12 border-0 items-center justify-center flex-shrink-0"
                onClick={() => {
                  setShowCalls(!showCalls);
                  setShowMessages(false);
                  setShowNotifications(false);
                  setShowPhoneDialer(false);
                }}
                style={getButtonStyle()}
              >
                <Phone className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: colors.iconColor }} />
              </button>

              <button
                className="rounded-2xl h-10 w-10 lg:h-12 lg:w-12 border-0 relative flex items-center justify-center flex-shrink-0"
                onClick={() => {
                  setShowMessages(!showMessages);
                  setShowCalls(false);
                  setShowNotifications(false);
                  setShowPhoneDialer(false);
                }}
                style={getButtonStyle()}
              >
                <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: colors.iconColor }} />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-green-500 text-white text-[10px] lg:text-xs rounded-full flex items-center justify-center font-bold"
                        style={{ boxShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>

              <button
                className="rounded-2xl h-10 w-10 lg:h-12 lg:w-12 border-0 relative flex items-center justify-center flex-shrink-0"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowMessages(false);
                  setShowCalls(false);
                  setShowPhoneDialer(false);
                }}
                style={getButtonStyle()}
              >
                <Bell className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: colors.iconColor }} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white text-[10px] lg:text-xs rounded-full flex items-center justify-center font-bold"
                        style={{ boxShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              <button
                className="hidden xl:flex rounded-2xl h-10 w-10 lg:h-12 lg:w-12 border-0 items-center justify-center flex-shrink-0"
                style={getButtonStyle()}
              >
                <HelpCircle className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: colors.iconColor }} />
              </button>

              <button
                className="hidden xl:flex rounded-2xl h-10 w-10 lg:h-12 lg:w-12 border-0 items-center justify-center flex-shrink-0"
                style={getButtonStyle()}
              >
                <Settings className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: colors.iconColor }} />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full h-10 w-10 lg:h-12 lg:w-12 p-0 border-0 flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={getButtonStyle()}
                  >
                     {user?.profile_photo_url ? (
                       <img 
                         src={user.profile_photo_url} 
                         alt={user.full_name || 'User'}
                         className="w-full h-full object-cover"
                       />
                     ) : (
                       <div className="w-10 h-10 rounded-full flex items-center justify-center" style={getInsetStyle()}>
                         <span style={{ color: colors.textSecondary }} className="font-bold text-sm">
                           {user?.full_name?.charAt(0) || 'U'}
                         </span>
                       </div>
                     )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end" style={{
                  background: colors.bg,
                  border: 'none',
                  boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`,
                  color: colors.text
                }}>
                  <DropdownMenuLabel style={{ color: colors.text }}>
                    <div>{user?.full_name || 'My Account'}</div>
                    {user?.role === 'admin' && (
                      <div className="text-xs" style={{ color: colors.textSecondary }}>Administrator</div>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator style={{ background: colors.border }} />
                  {userNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link to={item.href} style={{ color: colors.text }}>{item.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-2xl h-12 w-12 border-0 flex items-center justify-center"
                style={getButtonStyle()}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" style={{ color: colors.iconColor }} />
                ) : (
                  <MenuIcon className="block h-6 w-6" style={{ color: colors.iconColor }} />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden" style={{ background: colors.bg, borderTop: `1px solid ${colors.border}` }}>
            <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className="block px-4 py-3 rounded-2xl text-base font-medium transition-all"
                    style={getButtonStyle(isActive)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>

        <CallsPanel
          user={user}
          isOpen={showCalls}
          onClose={() => setShowCalls(false)}
        />
      </div>

      {/* Footer */}
      <footer className="py-6 px-8 border-t" style={{ 
        borderColor: colors.border,
        background: colors.bg 
      }}>
        <div className="max-w-7xl mx-auto text-center">
          <p 
            className="text-sm font-bold mb-1" 
            style={{ 
              color: colors.text,
              textShadow: `1px 1px 2px ${colors.shadowLight}, -1px -1px 2px ${colors.shadowDark}`
            }}
          >
            BEN<span style={{ color: colors.textSecondary }}>|</span>CONNECT<sup className="text-[8px] ml-0.5" style={{ color: colors.textTertiary }}>™</sup> 2026
          </p>
          <p 
            className="text-xs mb-1" 
            style={{ 
              color: colors.textSecondary,
              textShadow: `1px 1px 2px ${colors.shadowLight}, -1px -1px 2px ${colors.shadowDark}`
            }}
          >
            an <span className="font-semibold">indie<span style={{ color: colors.textTertiary }}>|</span>render<sup className="text-[6px]" style={{ color: colors.textTertiary }}>™</sup></span> company
          </p>
          <p 
            className="text-xs font-medium" 
            style={{ 
              color: colors.textTertiary,
              textShadow: `1px 1px 2px ${colors.shadowLight}, -1px -1px 2px ${colors.shadowDark}`
            }}
          >
            ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

      <NotificationCenter
        user={user}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <MessagingPanel
        user={user}
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
      />

      <BackgroundCustomizer 
        isOpen={showBackgroundCustomizer} 
        onClose={() => setShowBackgroundCustomizer(false)} 
      />

      {showPhoneDialer && (
        <div className="fixed bottom-6 right-6 z-[100] w-96">
          <Card 
            className="border-0"
            style={{
              background: colors.bg,
              boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle style={{ color: colors.text }}>Phone Dialer</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPhoneDialer(false)}
                  className="rounded-xl h-8 w-8"
                  style={getButtonStyle()}
                >
                  <X className="w-4 h-4" style={{ color: colors.iconColor }} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>
                Phone dialer coming soon. Use the Call Interface on case pages to make calls.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <AIAssistantOrb />

      {/* Incoming Call Popups */}
      {incomingCalls.map((call, index) => (
        <div key={call.id} className="fixed right-6 z-[100]" style={{ top: `${24 + (index * 320)}px` }}>
          <IncomingCallPopup
            call={call}
            customer={call.customer_id ? incomingCallCustomers[call.customer_id] : null}
            onAnswer={async () => {
              await base44.entities.IncomingCall.update(call.id, { status: 'answered', answered_at: new Date().toISOString() });
              // TODO: Create case and navigate to it
            }}
            onDecline={async () => {
              await base44.entities.IncomingCall.update(call.id, { status: 'declined' });
            }}
            onVoicemail={async () => {
              await base44.entities.IncomingCall.update(call.id, { status: 'voicemail' });
            }}
          />
        </div>
      ))}

      {/* Incoming SMS Popups */}
      {incomingSMS.map((sms, index) => (
        <div key={sms.id} className="fixed right-6 z-[100]" style={{ top: `${24 + (incomingCalls.length * 320) + (index * 280)}px` }}>
          <IncomingSMSPopup
            sms={sms}
            customer={null} // TODO: Fetch customer if needed
            onReply={async (replyText) => {
              await base44.entities.SMS.create({
                case_id: sms.case_id,
                customer_phone: sms.customer_phone,
                message: replyText,
                direction: 'sent',
                status: 'sent',
                sent_at: new Date().toISOString()
              });
            }}
            onDismiss={() => {
              // SMS will automatically disappear after 30 seconds
            }}
            onViewCase={() => {
              if (sms.case_id) {
                window.location.href = createPageUrl(`Case?id=${sms.case_id}`);
              }
            }}
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