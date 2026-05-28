import React from 'react';
import { Clock } from 'lucide-react';

const PRIORITY_COLORS = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
};

export default function CallQueuePanel({ cases = [] }) {
  // Show open/in-progress cases as "queue"
  const queue = cases.filter(c => c.status !== 'closed' && c.status !== 'resolved').slice(0, 8);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800">Call Queue</h3>
        {queue.length > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
            {queue.length} waiting
          </span>
        )}
      </div>
      <div className="space-y-2">
        {queue.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Queue is empty</p>
        )}
        {queue.map((c, i) => {
          const waitSecs = Math.floor((Date.now() - new Date(c.created_date).getTime()) / 1000);
          const waitMin = Math.floor(waitSecs / 60);
          const waitSec = waitSecs % 60;
          return (
            <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLORS[c.priority] || '#9CA3AF' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{c.customer_name || 'Unknown'}</p>
                <p className="text-xs text-gray-400 truncate">{c.call_reason || c.case_type || 'General Inquiry'}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
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