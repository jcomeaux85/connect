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
  Building2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SlideOutMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const { colors } = useTheme();

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
      }, 1500); // Increased to 1.5 seconds
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
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[59]"
          style={{ pointerEvents: 'none' }} />

        }
      </AnimatePresence>

      <div
        id="slide-out-menu"
        className="fixed left-0 top-0 h-full z-[60] pointer-events-auto"
        style={{
          width: isExpanded ? '280px' : isOpen ? '80px' : '20px',
          transition: 'width 0.3s ease'
        }}>

        <AnimatePresence>
          {isOpen &&
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full py-6 px-3 flex flex-col"
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
            <nav className="flex-1 space-y-1.5">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.url;

                return (
                  <Link key={item.title} to={item.url}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-3 rounded-2xl h-11 flex items-center justify-center gap-3 cursor-pointer"
                      style={isActive ? {
                        background: colors.bg,
                        boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
                      } : {
                        background: colors.bg,
                        boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                      }}
                      onMouseEnter={() => setIsExpanded(true)}>

                      <Icon
                        className="w-5 h-5"
                        style={{ color: isActive ? colors.iconColor : colors.textSecondary }} />

                      {isExpanded &&
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium flex-1 text-left"
                        style={{ color: isActive ? colors.text : colors.textSecondary }}>

                          {item.title}
                        </motion.span>
                      }
                    </motion.div>
                  </Link>);

              })}
            </nav>

            {/* Quick Actions */}
            <div className="space-y-1.5 pt-6 border-t" style={{ borderColor: colors.border }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.dispatchEvent(new Event('toggle-messages'))}
                className="w-full px-3 rounded-2xl h-11 flex items-center justify-center gap-3"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                }}
                onMouseEnter={() => setIsExpanded(true)}>

                <MessageSquare className="w-5 h-5" style={{ color: colors.textSecondary }} />
                {isExpanded &&
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className="text-sm font-medium flex-1 text-left"
                  style={{ color: colors.textSecondary }}>

                    Messages
                  </motion.span>
                }
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.dispatchEvent(new Event('toggle-phone'))}
                className="w-full px-3 rounded-2xl h-11 flex items-center justify-center gap-3"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                }}
                onMouseEnter={() => setIsExpanded(true)}>

                <Phone className="w-5 h-5" style={{ color: colors.textSecondary }} />
                {isExpanded &&
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className="text-sm font-medium flex-1 text-left"
                  style={{ color: colors.textSecondary }}>

                    Phone
                  </motion.span>
                }
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.dispatchEvent(new Event('toggle-background-customizer'))}
                className="w-full px-3 rounded-2xl h-11 flex items-center justify-center gap-3"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                }}
                onMouseEnter={() => setIsExpanded(true)}>

                <Palette className="w-5 h-5" style={{ color: colors.textSecondary }} />
                {isExpanded &&
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className="text-sm font-medium flex-1 text-left"
                  style={{ color: colors.textSecondary }}>

                    Customize
                  </motion.span>
                }
              </motion.button>

              <Link to={createPageUrl('Settings')}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 rounded-2xl h-11 flex items-center justify-center gap-3 cursor-pointer"
                  style={{
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                  onMouseEnter={() => setIsExpanded(true)}>

                  <Settings className="w-5 h-5" style={{ color: colors.textSecondary }} />
                  {isExpanded &&
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    className="text-sm font-medium flex-1 text-left"
                    style={{ color: colors.textSecondary }}>

                      Settings
                    </motion.span>
                  }
                </motion.div>
              </Link>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full px-3 rounded-2xl h-11 flex items-center justify-center gap-3"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                }}
                onMouseEnter={() => setIsExpanded(true)}>

                <LogOut className="w-5 h-5" style={{ color: colors.textSecondary }} />
                {isExpanded &&
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className="text-sm font-medium flex-1 text-left"
                  style={{ color: colors.textSecondary }}>

                    Logout
                  </motion.span>
                }
              </motion.button>
            </div>
          </motion.div>
          }
      </AnimatePresence>
      </div>
    </>);

}