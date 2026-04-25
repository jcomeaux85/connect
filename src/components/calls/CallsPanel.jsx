import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, X, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function CallsPanel({ user, isOpen, onClose, isOnCall = false }) {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const [dialNumber, setDialNumber] = useState('');
  const panelRef = useRef(null);

  const { data: calls = [] } = useQuery({
    queryKey: ['calls-panel'],
    queryFn: () => base44.entities.Call.list('-created_date', 10),
    enabled: !!user && isOpen,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-calls'],
    queryFn: () => base44.entities.Case.list('-updated_date', 100),
    enabled: !!user && isOpen,
  });

  // Click outside to close (but not during active call)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        if (!isOnCall) onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, isOnCall, onClose]);

  const getCallColor = (direction, status) => {
    if (status === 'missed' || status === 'no_answer') return '#EF4444';
    if (direction === 'inbound') return '#10B981';
    return '#3B82F6';
  };

  const getCallIcon = (direction, status) => {
    if (status === 'missed' || status === 'no_answer') return PhoneMissed;
    if (direction === 'inbound') return PhoneIncoming;
    return PhoneOutgoing;
  };

  const triggerDisposition = () => {
    window.dispatchEvent(new CustomEvent('show-disposition-form', { detail: {} }));
  };

  const handleClose = () => {
    if (isOnCall) return; // blocked during active call
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed z-[80]"
          style={{
            top: '62px',
            right: '80px',
            width: '420px',
            background: colors.bg,
            borderRadius: '18px',
            border: isOnCall ? '1.5px solid rgba(16,185,129,0.5)' : `1px solid ${colors.border}`,
            boxShadow: isOnCall
              ? `0 8px 32px rgba(16,185,129,0.25), 12px 12px 24px ${colors.shadowDark}, -4px -4px 16px ${colors.shadowLight}`
              : `12px 12px 24px ${colors.shadowDark}, -4px -4px 16px ${colors.shadowLight}`,
          }}
        >
          {/* Active call warning banner */}
          {isOnCall && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[18px]" style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold flex-1">Call in Progress — panel locked</span>
              <AlertTriangle className="w-3.5 h-3.5 text-white opacity-80" />
            </div>
          )}

          <div className="p-4 flex flex-col gap-3">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', ...getButtonStyle() }}>
                  <PhoneCall style={{ width: '16px', height: '16px', color: isOnCall ? '#10B981' : colors.textSecondary }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: colors.text, margin: 0 }}>Phone</p>
                  <p style={{ fontSize: '10px', color: isOnCall ? '#10B981' : colors.textTertiary, margin: 0 }}>
                    {isOnCall ? '● Active call' : 'Ready'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                title={isOnCall ? 'Cannot close during active call' : 'Close'}
                style={{
                  width: '30px', height: '30px', borderRadius: '8px', border: 'none',
                  cursor: isOnCall ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: isOnCall ? 0.35 : 1,
                  ...getButtonStyle()
                }}
              >
                <X style={{ width: '14px', height: '14px', color: colors.textSecondary }} />
              </button>
            </div>

            {/* Dial input */}
            <div className="flex gap-2">
              <input
                type="tel"
                value={dialNumber}
                onChange={e => setDialNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && dialNumber && triggerDisposition()}
                placeholder="Enter number to dial..."
                style={{
                  flex: 1, height: '38px', border: 'none', borderRadius: '10px',
                  padding: '0 12px', fontSize: '13px', outline: 'none',
                  background: colors.bg, color: colors.text,
                  boxShadow: `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`
                }}
              />
              <button
                disabled={!dialNumber}
                style={{
                  height: '38px', padding: '0 16px', borderRadius: '10px', border: 'none',
                  cursor: dialNumber ? 'pointer' : 'not-allowed',
                  background: dialNumber ? 'linear-gradient(135deg,#10B981,#059669)' : colors.bg,
                  color: dialNumber ? '#fff' : colors.textTertiary,
                  fontSize: '13px', fontWeight: '600',
                  boxShadow: dialNumber ? '0 2px 8px rgba(16,185,129,0.4)' : `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`,
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}
              >
                <Phone style={{ width: '14px', height: '14px' }} />
                Call
              </button>
            </div>

            {/* Disposition button */}
            <button
              onClick={triggerDisposition}
              style={{
                width: '100%', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff',
                fontSize: '13px', fontWeight: '600', boxShadow: '0 2px 8px rgba(59,130,246,0.35)'
              }}
            >
              + Log Disposition
            </button>

            {/* Divider */}
            <div style={{ height: '1px', background: colors.border }} />

            {/* Recent calls */}
            <div>
              <p style={{ fontSize: '10px', fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Recent Calls</p>
              <div className="flex flex-col gap-1.5" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {calls.length === 0 && (
                  <span style={{ fontSize: '12px', color: colors.textTertiary, padding: '8px 0' }}>No recent calls</span>
                )}
                {calls.slice(0, 8).map(call => {
                  const caseData = cases.find(c => c.id === call.case_id);
                  const Icon = getCallIcon(call.direction, call.status);
                  const color = getCallColor(call.direction, call.status);
                  return (
                    <Link
                      key={call.id}
                      to={call.case_id ? createPageUrl(`Case?id=${call.case_id}`) : '#'}
                      onClick={() => { if (!isOnCall) onClose(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '7px 10px', borderRadius: '10px', textDecoration: 'none',
                        background: colors.bg,
                        boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`
                      }}
                    >
                      <Icon style={{ width: '13px', height: '13px', color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: colors.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {caseData?.customer_name || call.customer_phone}
                      </span>
                      <span style={{ fontSize: '10px', color: colors.textTertiary, flexShrink: 0 }}>
                        {call.created_date ? format(new Date(call.created_date), 'h:mm a') : ''}
                      </span>
                      <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', flexShrink: 0, background: call.status === 'completed' ? '#dcfce7' : '#fee2e2', color: call.status === 'completed' ? '#166534' : '#991b1b' }}>
                        {call.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}