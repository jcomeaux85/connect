
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import { base44 } from "@/api/base44Client";
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { useUser } from "@/components/hooks/useUser"; // Added this import
import {
  LayoutGrid,
  Folder,
  Users,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  LogOut,
  CheckSquare,
  Search,
  Phone,
  MessageSquare,
  Settings, // Added for Call Log (though changing to Phone)
  Activity, // Added for Timeline
} from 'lucide-react';

export default function SlideOutMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  
  const location = useLocation();
  const navigate = useNavigate();
  const { colors, isDark, getButtonStyle, getInsetStyle } = useTheme();
  const timeoutRef = useRef(null); // Added this ref as per outline
  const menuRef = useRef(null); 

  const { data: user } = useUser(); // Replaced local user state and loadUser with useUser hook

  const { data: searchResults = [] } = useQuery({
    queryKey: ['customer-search', customerSearch],
    queryFn: async () => {
      if (!customerSearch.trim()) return [];
      const customers = await base44.entities.Customer.list('-updated_date', 50);
      return customers.filter(c => 
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.primary_phone?.includes(customerSearch) ||
        c.primary_email?.toLowerCase().includes(customerSearch.toLowerCase())
      ).slice(0, 5);
    },
    enabled: customerSearch.length > 0,
  });

  // Menu visibility and hover effects
  useEffect(() => {
    let closeTimeout;
    let openTimeout;

    const handleMouseMove = (e) => {
      if (e.clientX <= 10 && !isOpen) {
        clearTimeout(closeTimeout);
        openTimeout = setTimeout(() => {
          setIsOpen(true);
        }, 100);
      }
    };

    const handleMouseLeave = () => {
      if (isOpen && !isExpanded) {
        clearTimeout(openTimeout);
        closeTimeout = setTimeout(() => {
          setIsOpen(false);
        }, 200); // Reduced from 1000ms to 200ms for faster close
      }
    };

    if (!isExpanded) {
      window.addEventListener('mousemove', handleMouseMove);
      const menuElement = document.getElementById('slide-out-menu');
      if (menuElement) {
        menuElement.addEventListener('mouseleave', handleMouseLeave);
      }
    }

    return () => {
      clearTimeout(closeTimeout);
      clearTimeout(openTimeout);
      window.removeEventListener('mousemove', handleMouseMove);
      const menuElement = document.getElementById('slide-out-menu');
      if (menuElement) {
        menuElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isOpen, isExpanded]);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const handleCustomerClick = (customerId) => {
    navigate(createPageUrl(`Customer?id=${customerId}`));
    setCustomerSearch("");
    setIsExpanded(false);
    setIsOpen(false);
  };

  const handlePhoneClick = () => {
    window.dispatchEvent(new CustomEvent('toggle-phone'));
    if (!isExpanded) {
      setIsOpen(false);
    }
  };

  const handleMessageClick = () => {
    window.dispatchEvent(new CustomEvent('toggle-messages'));
    if (!isExpanded) {
      setIsOpen(false);
    }
  };

  const handleProfileClick = () => {
    navigate(createPageUrl('Profile'));
    setIsExpanded(false);
    setIsOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[80]"
            onClick={() => {
              setIsExpanded(false);
              setIsOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        id="slide-out-menu"
        ref={menuRef}
        initial={false}
        animate={{ 
          x: isOpen ? 0 : (isExpanded ? 0 : -320),
          width: isExpanded ? 320 : 72
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full z-[90] overflow-y-auto overflow-x-hidden scrollbar-hide"
        style={{
          background: isDark
            ? 'rgba(26, 29, 41, 0.98)'
            : 'rgba(224, 229, 236, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${colors.border}`,
          boxShadow: isDark
            ? '25px 0 70px rgba(0, 0, 0, 0.7), 15px 0 40px rgba(0, 0, 0, 0.5)'
            : '25px 0 70px rgba(100, 100, 100, 0.25), 15px 0 40px rgba(140, 140, 140, 0.2)',
        }}
      >
        {/* Logo + Profile Section */}
        <div className="p-4 border-b flex flex-col gap-3 sticky top-0 z-10" style={{ 
          borderColor: colors.border,
          background: isDark ? 'rgba(26, 29, 41, 0.98)' : 'rgba(224, 229, 236, 0.98)'
        }}>
          {isExpanded ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: colors.gradient,
                      boxShadow: isDark
                        ? '3px 3px 6px rgba(0, 0, 0, 0.3)'
                        : '3px 3px 6px rgba(163, 177, 198, 0.3)',
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ color: colors.iconColor }}
                    >
                      <path
                        d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm whitespace-nowrap truncate" style={{ color: colors.text }}>
                      BEN<span style={{ color: colors.textSecondary }}>|</span>CONNECT<sup className="text-[8px]" style={{ color: colors.textTertiary }}>™</sup>
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={getButtonStyle()}
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                </button>
              </div>

              {/* Profile */}
              {user && (
                <button
                  onClick={handleProfileClick}
                  className="px-3 py-2 rounded-xl text-left w-full"
                  style={getInsetStyle()}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(145deg, #8B5CF6, #7C3AED)' }}
                    >
                      <span style={{ color: '#ffffff' }} className="font-bold text-sm">
                        {user.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: colors.text }}>
                        {user.full_name}
                      </p>
                      <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={getInsetStyle()}
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ color: colors.iconColor }}
                >
                  <path
                    d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {user && (
                <button
                  onClick={handleProfileClick}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={getInsetStyle()}
                >
                  <span style={{ color: colors.text }} className="font-bold text-sm">
                    {user.full_name?.charAt(0) || 'U'}
                  </span>
                </button>
              )}
              
              <button
                onClick={() => setIsExpanded(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={getButtonStyle()}
              >
                <ChevronRight className="w-4 h-4" style={{ color: '#8B5CF6' }} />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2">
          
          {/* Separator Line 1 */}
          <div className="my-4 px-4">
            <div style={{ 
              height: '2px', 
              background: '#8B5CF6',
              opacity: 0.6,
              borderRadius: '2px'
            }} />
          </div>

          {/* Dashboard */}
          <Link to={createPageUrl('Dashboard')}>
            <motion.div
              whileHover={{ x: isExpanded ? 4 : 0 }}
              className={`flex items-center ${isExpanded ? 'gap-3 px-3 py-2' : 'justify-center py-2'} rounded-xl transition-all cursor-pointer mb-2`}
              style={getButtonStyle(location.pathname === createPageUrl('Dashboard'))}
              title={!isExpanded ? 'Dashboard' : undefined}
            >
              <LayoutGrid className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
              {isExpanded && <span className="font-medium text-sm">Dashboard</span>}
            </motion.div>
          </Link>

          {/* Cases */}
          <Link to={createPageUrl('Cases')}>
            <motion.div
              whileHover={{ x: isExpanded ? 4 : 0 }}
              className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'} rounded-xl transition-all cursor-pointer mb-2`}
              style={getButtonStyle(location.pathname === createPageUrl('Cases'))}
              title={!isExpanded ? 'Cases' : undefined}
            >
              <Folder className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
              {isExpanded && <span className="font-medium text-sm">Cases</span>}
            </motion.div>
          </Link>

          {/* Customers */}
          <Link to={createPageUrl('Customers')}>
            <motion.div
              whileHover={{ x: isExpanded ? 4 : 0 }}
              className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'} rounded-xl transition-all cursor-pointer mb-2`}
              style={getButtonStyle(location.pathname === createPageUrl('Customers'))}
              title={!isExpanded ? 'Customers' : undefined}
            >
              <Users className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
              {isExpanded && <span className="font-medium text-sm">Customers</span>}
            </motion.div>
          </Link>

          {/* Analytics */}
          <Link to={createPageUrl('Analytics')}>
            <motion.div
              whileHover={{ x: isExpanded ? 4 : 0 }}
              className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'} rounded-xl transition-all cursor-pointer mb-2`}
              style={getButtonStyle(location.pathname === createPageUrl('Analytics'))}
              title={!isExpanded ? 'Analytics' : undefined}
            >
              <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
              {isExpanded && <span className="font-medium text-sm">Analytics</span>}
            </motion.div>
          </Link>

          {/* Tasks */}
          <Link to={createPageUrl('Tasks')}>
            <motion.div
              whileHover={{ x: isExpanded ? 4 : 0 }}
              className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'} rounded-xl transition-all cursor-pointer mb-2`}
              style={getButtonStyle(location.pathname === createPageUrl('Tasks'))}
              title={!isExpanded ? 'Tasks' : undefined}
            >
              <CheckSquare className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
              {isExpanded && <span className="font-medium text-sm">Tasks</span>}
            </motion.div>
          </Link>

          {/* Separator Line 2 */}
          <div className="my-4 px-4">
            <div style={{ 
              height: '2px', 
              background: '#8B5CF6',
              opacity: 0.6,
              borderRadius: '2px'
            }} />
          </div>

          {/* Search */}
          {isExpanded ? (
            <div className="px-3 py-2 mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.iconColor }} />
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="pl-10 rounded-xl border-0 h-9 text-sm"
                  style={{
                    ...getInsetStyle(),
                    color: colors.text
                  }}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerClick(customer.id)}
                      className="w-full p-2 rounded-lg text-left transition-all"
                      style={{
                        ...getButtonStyle(),
                        fontSize: '13px'
                      }}
                    >
                      <p className="font-medium truncate" style={{ color: colors.text }}>
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                        {customer.primary_phone}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full flex items-center justify-center py-2 rounded-xl transition-all cursor-pointer mb-2"
              style={getButtonStyle()}
              title="Search Customers"
            >
              <Search className="w-5 h-5" style={{ color: colors.iconColor }} />
            </button>
          )}

          {/* Call Log */}
          <Link to={createPageUrl('CallLog')}>
            <motion.div
              whileHover={{ x: isExpanded ? 4 : 0 }}
              className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'} rounded-xl transition-all cursor-pointer mb-2`}
              style={getButtonStyle(location.pathname === createPageUrl('CallLog'))}
              title={!isExpanded ? 'Call Log' : undefined}
            >
              <Phone className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
              {isExpanded && <span className="font-medium text-sm">Call Log</span>}
            </motion.div>
          </Link>

          {/* Timeline */}
          <Link to={createPageUrl('Timeline')}>
            <motion.div
              whileHover={{ x: isExpanded ? 4 : 0 }}
              className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'} rounded-xl transition-all cursor-pointer mb-2`}
              style={getButtonStyle(location.pathname === createPageUrl('Timeline'))}
              title={!isExpanded ? 'Timeline' : undefined}
            >
              <Activity className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
              {isExpanded && <span className="font-medium text-sm">Timeline</span>}
            </motion.div>
          </Link>

          {/* Messages (Page) */}
          <Link to={createPageUrl('Messages')}>
            <motion.div
              whileHover={{ x: isExpanded ? 4 : 0 }}
              className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'} rounded-xl transition-all cursor-pointer mb-2`}
              style={getButtonStyle(location.pathname === createPageUrl('Messages'))}
              title={!isExpanded ? 'Messages' : undefined}
            >
              <MessageSquare className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
              {isExpanded && <span className="font-medium text-sm">Messages</span>}
            </motion.div>
          </Link>

          {/* Separator Line 3 */}
          <div className="my-4 px-4">
            <div style={{ 
              height: '2px', 
              background: '#8B5CF6',
              opacity: 0.6,
              borderRadius: '2px'
            }} />
          </div>

          {/* Phone (button remains) */}
          <button
            onClick={handlePhoneClick}
            className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'} rounded-xl transition-all cursor-pointer mb-2`}
            style={getButtonStyle()}
            title={!isExpanded ? 'Phone' : undefined}
          >
            <Phone className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
            {isExpanded && <span className="font-medium text-sm">Phone</span>}
          </button>

          {/* Message (button remains) */}
          <button
            onClick={handleMessageClick}
            className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5'} rounded-xl transition-all cursor-pointer mb-2`}
            style={getButtonStyle()}
            title={!isExpanded ? 'Message' : undefined}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
            {isExpanded && <span className="font-medium text-sm">Message</span>}
          </button>

          {/* Separator Line 4 */}
          <div className="my-4 px-4">
            <div style={{ 
              height: '2px', 
              background: '#8B5CF6',
              opacity: 0.6,
              borderRadius: '2px'
            }} />
          </div>

          {/* Settings */}
          <Link to={createPageUrl('Settings')}>
            <motion.div
              whileHover={{ x: isExpanded ? 4 : 0 }}
              className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3 py-2' : 'justify-center py-2'} rounded-xl transition-all cursor-pointer mb-2`}
              style={getButtonStyle(location.pathname === createPageUrl('Settings'))}
              title={!isExpanded ? 'Settings' : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
              {isExpanded && <span className="font-medium text-sm">Settings</span>}
            </motion.div>
          </Link>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3 py-2' : 'justify-center py-2'} rounded-xl transition-all cursor-pointer mb-2`}
            style={getButtonStyle()}
            title={!isExpanded ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" style={{ color: colors.iconColor }} />
            {isExpanded && <span className="font-medium text-sm">Sign Out</span>}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-[85] flex items-center justify-center w-8 h-24 rounded-r-xl cursor-pointer"
            style={{
              background: isDark
                ? 'rgba(255, 255, 255, 0.95)'
                : 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: isDark
                ? '4px 0 12px rgba(255, 255, 255, 0.3)'
                : '4px 0 12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={() => setIsOpen(true)}
          >
            <ChevronRight className="w-4 h-4" style={{ color: isDark ? '#1a1d29' : '#E0E5EC' }} />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
