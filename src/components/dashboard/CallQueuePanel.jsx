import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { telephony } from '@/api/telephony';
import { PITCH_MODE } from '@/lib/pitchMode';
import { useSimulatedClock } from '@/hooks/useSimulatedClock';
import { AGENTS, DEMO_CALLS, DEMO_QUEUE, QUEUE_POOL } from '@/data/callCenterDemo';

const PRIORITY_COLORS = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
};

function countArrivedInbound(nowMins) {
  let count = 0;
  AGENTS.forEach((agent) => {
    (DEMO_CALLS[agent] || []).forEach((c) => {
      const [h, m] = c.time.split(':').map(Number);
      if (c.direction === 'inbound' && h * 60 + m <= nowMins) count += 1;
    });
  });
  return count;
}

function waitLabel(created) {
  const start = created ? new Date(created).getTime() : Date.now();
  const secs = Math.max(0, Math.floor((Date.now() - start) / 1000));
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function PitchQueue({ isDark, textPrimary, textSecondary, cardBg, cardBorder, headerBg, headerBorder }) {
  const { nowMins } = useSimulatedClock();
  const [queue, setQueue] = useState(() => DEMO_QUEUE.map((q, i) => ({ ...q, id: `q${i}` })));
  const prevArrived = useRef(0);
  const prevNowMins = useRef(nowMins);
  const poolIdx = useRef(0);

  useEffect(() => {
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
      setQueue((prev) => {
        const next = [...prev];
        for (let i = 0; i < shifts; i += 1) {
          next.shift();
          const poolItem = QUEUE_POOL[poolIdx.current % QUEUE_POOL.length];
          poolIdx.current += 1;
          next.push({ ...poolItem, id: `p${poolIdx.current}`, created_date: new Date().toISOString() });
        }
        return next;
      });
    }
    prevArrived.current = arrived;
  }, [nowMins]);

  return (
    <QueueCard
      title="Call Queue"
      badge={queue.length}
      rows={queue.map((c) => ({
        id: c.id,
        name: c.customer_name || 'Unknown',
        sub: c.call_reason || c.case_type || 'General Inquiry',
        wait: waitLabel(c.created_date),
        color: PRIORITY_COLORS[c.priority] || '#9CA3AF',
      }))}
      isDark={isDark}
      textPrimary={textPrimary}
      textSecondary={textSecondary}
      cardBg={cardBg}
      cardBorder={cardBorder}
      headerBg={headerBg}
      headerBorder={headerBorder}
    />
  );
}

function LiveQueue({ isDark, textPrimary, textSecondary, cardBg, cardBorder, headerBg, headerBorder }) {
  const { data: incoming = [] } = useQuery({
    queryKey: ['incoming-calls'],
    queryFn: () => telephony.getRingingCalls(),
    refetchInterval: 3000,
  });

  const rows = incoming.map((c, i) => ({
    id: c.id,
    name: c.caller_name || c.phone_number || 'Unknown caller',
    sub: [c.phone_number, [c.caller_city, c.caller_state].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'Ringing',
    wait: waitLabel(c.created_date || c.ringing_at),
    color: i === 0 ? '#10B981' : '#3B82F6',
  }));

  return (
    <QueueCard
      title="Call Queue"
      badge={incoming.length}
      rows={rows}
      empty="No calls ringing"
      isDark={isDark}
      textPrimary={textPrimary}
      textSecondary={textSecondary}
      cardBg={cardBg}
      cardBorder={cardBorder}
      headerBg={headerBg}
      headerBorder={headerBorder}
    />
  );
}

function QueueCard({ title, badge, rows, empty = 'Queue is empty', isDark, textPrimary, textSecondary, cardBg, cardBorder, headerBg, headerBorder }) {
  return (
    <div className="rounded-2xl p-4 h-full" style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderTop: '2px solid #a78bfa' }}>
      <div className="flex items-center justify-between mb-4 -mx-4 px-4 py-2 rounded-t-2xl" style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}>
        <h3 className="text-sm font-bold" style={{ color: textPrimary }}>{title}</h3>
        {badge > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#7C3AED', color: '#fff' }}>
            {badge} waiting
          </span>
        )}
      </div>
      <div className="space-y-0">
        {rows.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: textSecondary }}>{empty}</p>
        )}
        <AnimatePresence initial={false}>
          {rows.map((c) => (
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
              <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>{c.name}</p>
                <p className="text-xs truncate" style={{ color: textSecondary }}>{c.sub}</p>
              </div>
              <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: textSecondary }}>
                <Clock className="w-3 h-3" />
                <span>{c.wait}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function CallQueuePanel() {
  const { isDark } = useTheme();
  const cardBg = isDark ? '#555555' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const headerBg = isDark ? 'rgba(124,58,237,0.15)' : 'linear-gradient(90deg, #ede9fe 0%, #f5f3ff 100%)';
  const headerBorder = isDark ? 'rgba(124,58,237,0.25)' : '#ddd6fe';
  const textPrimary = isDark ? '#f0f0f0' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const theme = { isDark, textPrimary, textSecondary, cardBg, cardBorder, headerBg, headerBorder };

  return PITCH_MODE ? <PitchQueue {...theme} /> : <LiveQueue {...theme} />;
}
