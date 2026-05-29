import React from 'react';
import { Clock } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const PRIORITY_COLORS = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
};

const DEMO_QUEUE = [
  { id: 'd1', customer_name: 'Maria Gonzalez', call_reason: 'Claim Assistance', priority: 'urgent', created_date: new Date(Date.now() - 4 * 60000).toISOString() },
  { id: 'd2', customer_name: 'James Thornton', call_reason: 'Benefits Inquiry', priority: 'high', created_date: new Date(Date.now() - 9 * 60000).toISOString() },
  { id: 'd3', customer_name: 'Aisha Patel', call_reason: 'Provider Search', priority: 'medium', created_date: new Date(Date.now() - 14 * 60000).toISOString() },
  { id: 'd4', customer_name: 'Robert Kim', call_reason: 'General Inquiry', priority: 'low', created_date: new Date(Date.now() - 21 * 60000).toISOString() },
  { id: 'd5', customer_name: 'Sandra Lee', call_reason: 'Enrollment Help', priority: 'medium', created_date: new Date(Date.now() - 27 * 60000).toISOString() },
];

export default function CallQueuePanel({ cases = [] }) {
  const { isDark } = useTheme();
  const realQueue = cases.filter(c => c.status !== 'closed' && c.status !== 'resolved').slice(0, 8);
  const queue = realQueue.length > 0 ? realQueue : DEMO_QUEUE;

  const cardBg = isDark ? '#23263a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const headerBg = isDark ? 'rgba(124,58,237,0.15)' : 'linear-gradient(90deg, #ede9fe 0%, #f5f3ff 100%)';
  const headerBorder = isDark ? 'rgba(124,58,237,0.25)' : '#ddd6fe';
  const textPrimary = isDark ? '#f0f0f0' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const rowBorder = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb';

  return (
    <div className="rounded-2xl p-4 h-full" style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderTop: '2px solid #a78bfa' }}>
      <div className="flex items-center justify-between mb-4 -mx-4 px-4 py-2 rounded-t-2xl" style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}>
        <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Call Queue</h3>
        {queue.length > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#7C3AED', color: '#fff' }}>
            {queue.length} waiting
          </span>
        )}
      </div>
      <div className="space-y-2">
        {queue.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: textSecondary }}>Queue is empty</p>
        )}
        {queue.map((c, i) => {
          const waitSecs = Math.floor((Date.now() - new Date(c.created_date).getTime()) / 1000);
          const waitMin = Math.floor(waitSecs / 60);
          const waitSec = waitSecs % 60;
          return (
            <div key={c.id} className="flex items-center gap-3 py-2 last:border-0" style={{ borderBottom: `1px solid ${rowBorder}` }}>
              <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLORS[c.priority] || '#9CA3AF' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>{c.customer_name || 'Unknown'}</p>
                <p className="text-xs truncate" style={{ color: textSecondary }}>{c.call_reason || c.case_type || 'General Inquiry'}</p>
              </div>
              <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: textSecondary }}>
                <Clock className="w-3 h-3" />
                <span>{waitMin}:{String(waitSec).padStart(2,'0')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}