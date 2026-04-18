import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import {
  LayoutGrid,
  Folder,
  Users,
  TrendingUp,
  CheckSquare,
  Phone,
  Clock,
  MessageSquare,
  Settings,
  LogOut,
  User,
  Search,
  Palette,
  Building2,
  Sun,
  Moon,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SlideOutMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const { colors, toggleTheme, isDark } = useTheme();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-search'],
    queryFn: () => base44.entities.Customer.list('-updated_date', 50),
    enabled: isOpen && searchQuery.length > 0
  });

  const filteredCustomers = customers.filter((c) =>
  `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
  c.primary_phone?.includes(searchQuery)
  );

  useEffect(() => {
    let openTimer;
    let closeTimer;

    const handleMouseEnter = () => {
      clearTimeout(closeTimer);
      openTimer = setTimeout(() => setIsOpen(true), 100);
    };

    const handleMouseLeave = () => {
      clearTimeout(openTimer);
      closeTimer = setTimeout(() => {
        setIsOpen(false);
        setIsExpanded(false);
      }, 500);
    };

    const menuElement = document.getElementById('slide-out-menu');
    if (menuElement) {
      menuElement.addEventListener('mouseenter', handleMouseEnter);
      menuElement.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      if (menuElement) {
        menuElement.removeEventListener('mouseenter', handleMouseEnter);
        menuElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const navigationItems = [
    { title: 'Dashboard', url: createPageUrl('Dashboard'), icon: LayoutGrid },
    { title: 'Cases', url: createPageUrl('Cases'), icon: Folder },
    { title: 'Customers', url: createPageUrl('Customers'), icon: Users },
    { title: 'Employers', url: createPageUrl('Employers'), icon: Building2 },
    { title: 'Analytics', url: createPageUrl('Analytics'), icon: TrendingUp },
    { title: 'Tasks', url: createPageUrl('Boards'), icon: CheckSquare },
    { title: 'Call Log', url: createPageUrl('CallLog'), icon: Phone },
    { title: 'Timeline', url: createPageUrl('Timeline'), icon: Clock }
  ];


  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[59] cursor-pointer"
          onClick={() => {
            setIsOpen(false);
            setIsExpanded(false);
          }} />
        }
      </AnimatePresence>

      {/* Slingshot pills — DOC and CORE fly out along the top when sidebar opens */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* DOC pill */}
            <motion.button
              initial={{ x: -120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -120, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220, delay: 0.08 }}
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-doc'))}
              className="fixed z-[61] flex items-center gap-1.5 px-4 h-9 rounded-b-2xl text-xs font-bold cursor-pointer"
              style={{
                top: 0,
                left: '232px',
                background: colors.bg,
                color: '#dc2626',
                boxShadow: `4px 4px 12px ${colors.shadowDark}, -2px -2px 6px ${colors.shadowLight}`
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              DOC™
            </motion.button>

            {/* CORE pill */}
            <motion.div
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220, delay: 0.15 }}
              className="fixed z-[61]"
              style={{ top: 0, left: '300px' }}
            >
              <Link
                to="/Core"
                className="flex items-center gap-1.5 px-4 h-9 rounded-b-2xl text-xs font-bold"
                style={{
                  background: colors.bg,
                  color: '#7c3aed',
                  boxShadow: `4px 4px 12px ${colors.shadowDark}, -2px -2px 6px ${colors.shadowLight}`
                }}
              >
                CORE
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div
        id="slide-out-menu"
        className="fixed left-0 top-0 h-full z-[60] pointer-events-auto"
        style={{
          width: isOpen ? '220px' : '48px',
          transition: 'width 0.3s ease'
        }}>

        <AnimatePresence>
          {isOpen &&
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full py-6 px-3 flex flex-col overflow-y-auto scrollbar-hide"
            style={{
              background: colors.bg,
              boxShadow: `12px 0 24px ${colors.shadowDark}`
            }}>

            {/* User Profile */}
            <div className="mb-8 px-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto overflow-hidden"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                }}>

                {user?.profile_photo_url ?
                <img
                  src={user.profile_photo_url}
                  alt={user.full_name}
                  className="w-full h-full object-cover" /> :


                <User className="w-6 h-6" style={{ color: colors.iconColor }} />
                }
              </div>
              {isExpanded &&
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-center">

                  <p className="font-semibold text-sm" style={{ color: colors.text }}>
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {user?.role === 'admin' ? 'Administrator' : 'Agent'}
                  </p>
                </motion.div>
              }
            </div>

            {/* Search (only when expanded) */}
            {isExpanded &&
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 px-2">

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: colors.textTertiary }} />
                  <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl border-0 h-10 text-sm"
                  style={{
                    background: colors.bg,
                    boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                    color: colors.text
                  }} />

                </div>

                {/* Search Results */}
                {searchQuery && filteredCustomers.length > 0 &&
              <div
                className="mt-2 rounded-xl overflow-hidden max-h-48 overflow-y-auto"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                }}>

                    {filteredCustomers.map((customer) =>
                <Link
                  key={customer.id}
                  to={createPageUrl(`Customer?id=${customer.id}`)}
                  className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">

                        <p className="text-sm font-medium" style={{ color: colors.text }}>
                          {customer.first_name} {customer.last_name}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {customer.primary_phone}
                        </p>
                      </Link>
                )}
                  </div>
              }
              </motion.div>
            }

            {/* Navigation Items */}
            <nav className="mb-4">
              <div className="grid grid-cols-2 gap-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.url;

                  return (
                    <Link key={item.title} to={item.url}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="rounded-2xl h-16 flex flex-col items-center justify-center gap-1 cursor-pointer p-2"
                        style={isActive ? {
                          background: colors.bg,
                          boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
                        } : {
                          background: colors.bg,
                          boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                        }}
                        onMouseEnter={() => setIsExpanded(true)}>

                        <Icon
                          className="w-7 h-7"
                          style={{ color: isActive ? colors.iconColor : colors.textSecondary }} />

                        <span
                          className="text-[9px] font-medium text-center leading-tight"
                          style={{ color: isActive ? colors.text : colors.textSecondary }}>
                          {item.title}
                        </span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Quick Actions */}
            <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.dispatchEvent(new Event('toggle-messages'))}
                  className="rounded-2xl h-16 flex flex-col items-center justify-center gap-1 p-2"
                  style={{
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                  onMouseEnter={() => setIsExpanded(true)}>

                  <MessageSquare className="w-7 h-7" style={{ color: colors.textSecondary }} />
                  <span className="text-[9px] font-medium text-center leading-tight" style={{ color: colors.textSecondary }}>
                    Messages
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.dispatchEvent(new Event('toggle-phone'))}
                  className="rounded-2xl h-16 flex flex-col items-center justify-center gap-1 p-2"
                  style={{
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                  onMouseEnter={() => setIsExpanded(true)}>

                  <Phone className="w-7 h-7" style={{ color: colors.textSecondary }} />
                  <span className="text-[9px] font-medium text-center leading-tight" style={{ color: colors.textSecondary }}>
                    Phone
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.dispatchEvent(new Event('toggle-background-customizer'))}
                  className="rounded-2xl h-16 flex flex-col items-center justify-center gap-1 p-2"
                  style={{
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                  onMouseEnter={() => setIsExpanded(true)}>

                  <Palette className="w-7 h-7" style={{ color: colors.textSecondary }} />
                  <span className="text-[9px] font-medium text-center leading-tight" style={{ color: colors.textSecondary }}>
                    Customize
                  </span>
                </motion.button>

                <Link to={createPageUrl('Settings')}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-2xl h-16 flex flex-col items-center justify-center gap-1 cursor-pointer p-2"
                    style={{
                      background: colors.bg,
                      boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                    }}
                    onMouseEnter={() => setIsExpanded(true)}>

                    <Settings className="w-7 h-7" style={{ color: colors.textSecondary }} />
                    <span className="text-[9px] font-medium text-center leading-tight" style={{ color: colors.textSecondary }}>
                      Settings
                    </span>
                  </motion.div>
                </Link>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleTheme}
                  className="rounded-2xl h-16 flex flex-col items-center justify-center gap-1 p-2"
                  style={{
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                  onMouseEnter={() => setIsExpanded(true)}>
                  {isDark ? <Sun className="w-7 h-7" style={{ color: colors.textSecondary }} /> : <Moon className="w-7 h-7" style={{ color: colors.textSecondary }} />}
                  <span className="text-[9px] font-medium text-center leading-tight" style={{ color: colors.textSecondary }}>
                    {isDark ? 'Light' : 'Dark'}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl h-16 flex flex-col items-center justify-center gap-1 p-2"
                  style={{
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                  onMouseEnter={() => setIsExpanded(true)}>
                  <HelpCircle className="w-7 h-7" style={{ color: colors.textSecondary }} />
                  <span className="text-[9px] font-medium text-center leading-tight" style={{ color: colors.textSecondary }}>
                    Help
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="rounded-2xl h-16 flex flex-col items-center justify-center gap-1 p-2"
                  style={{
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                  onMouseEnter={() => setIsExpanded(true)}>
                  <LogOut className="w-7 h-7" style={{ color: colors.textSecondary }} />
                  <span className="text-[9px] font-medium text-center leading-tight" style={{ color: colors.textSecondary }}>
                    Logout
                  </span>
                </motion.button>
              </div>
            </div>

            {/* User Profile Footer */}
            <div className="mt-auto pt-4 border-t" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-3 px-2 py-2 rounded-2xl" style={{
                background: colors.bg,
                boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
              }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ background: colors.bg, boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}` }}>
                  {user?.profile_photo_url ?
                    <img src={user.profile_photo_url} alt={user.full_name} className="w-full h-full object-cover" /> :
                    <span style={{ color: colors.text }} className="font-bold text-sm">{user?.full_name?.charAt(0) || 'U'}</span>
                  }
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold truncate" style={{ color: colors.text }}>{user?.full_name || 'User'}</p>
                  <p className="text-[10px] truncate" style={{ color: colors.textSecondary }}>{user?.role === 'admin' ? 'Administrator' : 'Agent'}</p>
                </div>
              </div>
            </div>
          </motion.div>
          }
      </AnimatePresence>
      </div>
    </>);

}