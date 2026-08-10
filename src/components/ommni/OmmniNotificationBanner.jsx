import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, GraduationCap, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';

// OmmniNotificationBanner — inline, non-blocking notification stack.
// Polls for non-dismissed OmmniNotifications for the current user and
// renders them as stacked banners. Also accepts real-time pushes via
// the `ommni-notifications` window event (used by the email scanner
// and call/SMS ingestion paths for instant feedback without polling).
//
// Props:
//   channelFilter — optional: only show notifications from this source_channel
//   maxVisible     — how many banners to stack (default 3)
//   position       — 'top' | 'bottom' anchoring within the parent container

export default function OmmniNotificationBanner({ channelFilter = null, maxVisible = 3, position = 'top' }) {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState([]);

  // Poll for non-dismissed notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      if (!me?.email) return;
      const notifs = await base44.entities.OmmniNotification.filter(
        { user_email: me.email, dismissed: false },
        '-triggered_at',
        10
      );
      const filtered = channelFilter
        ? notifs.filter(n => n.source_channel === channelFilter)
        : notifs;
      setNotifications(filtered.slice(0, maxVisible));
    } catch (e) {
      // Silent fail — notifications are non-critical
    }
  }, [channelFilter, maxVisible]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);

    // Listen for real-time pushes from the email scanner / call ingestion
    const onPush = (e) => {
      const pushed = e.detail?.matches || [];
      if (pushed.length > 0) {
        setNotifications(prev => {
          const newNotifs = pushed.map(m => ({
            id: m.notification_id || `realtime-${Date.now()}-${Math.random()}`,
            notification_text: m.notification_text,
            source_label: m.source_label,
            source_type: m.source_type,
            priority: m.priority || 0,
            triggered_at: new Date().toISOString(),
            dismissed: false,
            _realtime: true
          }));
          return [...newNotifs, ...prev].slice(0, maxVisible);
        });
      }
    };
    window.addEventListener('ommni-notifications', onPush);

    return () => {
      clearInterval(interval);
      window.removeEventListener('ommni-notifications', onPush);
    };
  }, [fetchNotifications, maxVisible]);

  const handleDismiss = useCallback(async (notif) => {
    // Optimistic removal
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    // Persist dismissal (skip for real-time-only entries)
    if (!notif._realtime && notif.id) {
      try {
        await base44.entities.OmmniNotification.update(notif.id, { dismissed: true });
      } catch (e) {
        // Silent fail
      }
    }
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', [position]: 0, position: 'relative' }}>
      <AnimatePresence>
        {notifications.map((notif) => {
          const isTraining = notif.source_type === 'training' || notif.source_label?.startsWith('Training');
          const Icon = isTraining ? GraduationCap : Shield;
          const accentColor = isTraining ? '#7c3aed' : '#0891b2';

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}40`,
                backdropFilter: 'blur(8px)',
                boxShadow: `0 4px 16px ${accentColor}20`,
              }}
            >
              <div style={{
                flexShrink: 0,
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: `${accentColor}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  {notif.notification_text}
                </p>
                {notif.source_label && (
                  <p style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: accentColor,
                    margin: '4px 0 0',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}>
                    {notif.source_label}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleDismiss(notif)}
                style={{
                  flexShrink: 0,
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textSecondary,
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}