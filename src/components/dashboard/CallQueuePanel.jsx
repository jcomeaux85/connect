import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { useSimulatedClock } from '@/hooks/useSimulatedClock';
import { AGENTS, DEMO_CALLS, DEMO_QUEUE, QUEUE_POOL } from '@/data/callCenterDemo';

const PRIORITY_COLORS = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
};

// Count inbound demo calls across all agents whose time has arrived
function countArrivedInbound(nowMins) {
  let count = 0;
  AGENTS.forEach(agent => {
    (DEMO_CALLS[agent] || []).forEach(c => {
      const [h, m] = c.time.split(':').map(Number);
      if (c.direction === 'inbound' && h * 60 + m <= nowMins) count++;
    });
  });
  return count;
}

export default function CallQueuePanel({ cases = [] }) {
  const { isDark } = useTheme();
  const { nowMins } = useSimulatedClock();

  // Demo queue state — shifts as calls arrive on the timeline.
  // Pitch mode: always use the demo queue so the shifting line is visible.
  const [queue, setQueue] = useState(() => DEMO_QUEUE.map((q, i) => ({ ...q, id: `q${i}` })));
  const prevArrived = useRef(0);
  const prevNowMins = useRef(nowMins);
  const poolIdx = useRef(0);

  useEffect(() => {
    // Detect cycle reset (clock looped back to 8am)
    if (nowMins < prevNowMins.current) {
      setQueue(DEMO_QUEUE.map((q, i) => ({ ...q, id: `q${i}` })));
      prevArrived.current = 0;
      poolIdx.current = 0;
      prevNowMins.current = nowMins;
      return;
    }
    prevNowMins.current = nowMins;

    const arrived = countArrivedInbound(nowMins);
    if (arrived > prevArrived.current) {
      const shifts = arrived - prevArrived.current;
      setQueue(prev => {
        let newQ = [...prev];
        for (let i = 0; i < shifts; i++) {
          newQ.shift(); // top item routed → goes away
          const poolItem = QUEUE_POOL[poolIdx.current % QUEUE_POOL.length];
          poolIdx.current++;
          newQ.push({ ...poolItem, id: `p${poolIdx.current}`, created_date: new Date().toISOString() });
        }
        return newQ;
      });
    }
    prevArrived.current = arrived;
  }, [nowMins]);

  const displayQueue = queue;

  const cardBg = isDark ? '#555555' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const headerBg = isDark ? 'rgba(124,58,237,0.15)' : 'linear-gradient(90deg, #ede9fe 0%, #f5f3ff 100%)';
  const headerBorder = isDark ? 'rgba(124,58,237,0.25)' : '#ddd6fe';
  const textPrimary = isDark ? '#f0f0f0' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';

  return (
    <div className="rounded-2xl p-4 h-full" style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderTop: '2px solid #a78bfa' }}>
      <div className="flex items-center justify-between mb-4 -mx-4 px-4 py-2 rounded-t-2xl" style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}>
        <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Call Queue</h3>
        {displayQueue.length > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#7C3AED', color: '#fff' }}>
            {displayQueue.length} waiting
          </span>
        )}
      </div>
      <div className="space-y-0">
        {displayQueue.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: textSecondary }}>Queue is empty</p>
        )}
        <AnimatePresence initial={false}>
          {displayQueue.map((c) => {
            const waitSecs = Math.floor((Date.now() - new Date(c.created_date || Date.now()).getTime()) / 1000);
            const waitMin = Math.floor(waitSecs / 60);
            const waitSec = waitSecs % 60;
            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex items-center gap-3 py-2 overflow-hidden"
                style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb'}` }}
              >
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLORS[c.priority] || '#9CA3AF' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>{c.customer_name || 'Unknown'}</p>
                  <p className="text-xs truncate" style={{ color: textSecondary }}>{c.call_reason || c.case_type || 'General Inquiry'}</p>
                </div>
                <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: textSecondary }}>
                  <Clock className="w-3 h-3" />
                  <span>{waitMin}:{String(waitSec).padStart(2,'0')}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}