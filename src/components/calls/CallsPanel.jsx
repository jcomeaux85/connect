import React, { useState } from 'react';
import { Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, X } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function CallsPanel({ user, isOpen, onClose }) {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const [dialNumber, setDialNumber] = useState('');

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

  return (
    <div style={{
      background: colors.bg,
      borderBottom: `1px solid ${colors.border}`,
      boxShadow: `0 4px 12px ${colors.shadowDark}`,
    }}>
      <div style={{ maxWidth: '100%', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '16px', overflowX: 'auto' }}>

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}` }}>
            <PhoneCall style={{ width: '18px', height: '18px', color: '#10B981' }} />
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: '700', color: colors.text, margin: 0 }}>Phone Panel</p>
            <p style={{ fontSize: '11px', color: colors.textTertiary, margin: 0 }}>Ready</p>
          </div>
        </div>

        <div style={{ width: '1px', height: '36px', background: colors.border, flexShrink: 0 }} />

        {/* Dial input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <input
            type="tel"
            value={dialNumber}
            onChange={e => setDialNumber(e.target.value)}
            placeholder="Enter number..."
            style={{
              width: '160px', height: '36px', border: 'none', borderRadius: '10px',
              padding: '0 12px', fontSize: '13px', outline: 'none',
              background: colors.bg, color: colors.text,
              boxShadow: `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`
            }}
          />
          <button
            disabled={!dialNumber}
            style={{
              height: '36px', padding: '0 14px', borderRadius: '10px', border: 'none',
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

        <div style={{ width: '1px', height: '36px', background: colors.border, flexShrink: 0 }} />

        {/* Recent calls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: colors.textTertiary, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent</span>
          {calls.slice(0, 5).map(call => {
            const caseData = cases.find(c => c.id === call.case_id);
            const Icon = getCallIcon(call.direction, call.status);
            const color = getCallColor(call.direction, call.status);
            return (
              <Link
                key={call.id}
                to={call.case_id ? createPageUrl(`Case?id=${call.case_id}`) : '#'}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '10px', textDecoration: 'none', flexShrink: 0, background: colors.bg, boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}` }}
              >
                <Icon style={{ width: '12px', height: '12px', color }} />
                <span style={{ fontSize: '12px', color: colors.text, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {caseData?.customer_name || call.customer_phone}
                </span>
                {call.created_date && (
                  <span style={{ fontSize: '10px', color: colors.textTertiary }}>{format(new Date(call.created_date), 'h:mm a')}</span>
                )}
              </Link>
            );
          })}
          {calls.length === 0 && (
            <span style={{ fontSize: '12px', color: colors.textTertiary }}>No recent calls</span>
          )}
        </div>

        {/* Disposition + Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
          <button
            onClick={triggerDisposition}
            style={{
              height: '36px', padding: '0 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff',
              fontSize: '13px', fontWeight: '600', boxShadow: '0 2px 8px rgba(59,130,246,0.35)'
            }}
          >
            + Disposition
          </button>
          <button
            onClick={onClose}
            style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', ...getButtonStyle() }}
          >
            <X style={{ width: '16px', height: '16px', color: colors.textSecondary }} />
          </button>
        </div>
      </div>
    </div>
  );
}