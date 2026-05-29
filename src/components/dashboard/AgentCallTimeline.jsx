import React, { useMemo, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

const AGENTS = ['Ryan', 'Vanessa', 'Chris', 'Jarrad'];

const EMPLOYER_DEMO_COLORS = [
  { name: 'Lazer',       primary: '#ef4444', secondary: '#fca5a5' },
  { name: 'Orbital',     primary: '#f97316', secondary: '#fdba74' },
  { name: 'PSP',         primary: '#22c55e', secondary: '#86efac' },
  { name: 'PAM',         primary: '#3b82f6', secondary: '#93c5fd' },
  { name: 'Dohrn',       primary: '#8b5cf6', secondary: '#c4b5fd' },
  { name: 'Tekni-Plex',  primary: '#06b6d4', secondary: '#67e8f9' },
  { name: "Buddy's",     primary: '#f43f5e', secondary: '#fda4af' },
  { name: 'GCL',         primary: '#eab308', secondary: '#fde047' },
  { name: 'SwimUSA',     primary: '#14b8a6', secondary: '#5eead4' },
  { name: 'Brandywine',  primary: '#ec4899', secondary: '#f9a8d4' },
];

// Each demo call: time, direction, duration (seconds)
const DEMO_CALLS = {
  Ryan: [
    { time: '08:11', direction: 'inbound',  duration: 180 },
    { time: '08:44', direction: 'outbound', duration: 240 },
    { time: '09:08', direction: 'inbound',  duration: 120 },
    { time: '09:31', direction: 'inbound',  duration: 300 },
    { time: '09:52', direction: 'outbound', duration: 90  },
    { time: '11:07', direction: 'inbound',  duration: 210 },
    { time: '11:29', direction: 'inbound',  duration: 150 },
    { time: '11:54', direction: 'outbound', duration: 270 },
    { time: '12:18', direction: 'inbound',  duration: 180 },
    { time: '12:46', direction: 'inbound',  duration: 240 },
    { time: '13:14', direction: 'outbound', duration: 120 },
    { time: '13:41', direction: 'inbound',  duration: 300 },
    { time: '14:09', direction: 'inbound',  duration: 90  },
    { time: '14:38', direction: 'outbound', duration: 180 },
    { time: '15:05', direction: 'inbound',  duration: 210 },
    { time: '15:44', direction: 'inbound',  duration: 150 },
    { time: '16:22', direction: 'outbound', duration: 270 },
    { time: '17:08', direction: 'inbound',  duration: 120 },
  ],
  Vanessa: [
    { time: '08:19', direction: 'outbound', duration: 150 },
    { time: '08:52', direction: 'inbound',  duration: 200 },
    { time: '09:17', direction: 'inbound',  duration: 240 },
    { time: '09:43', direction: 'outbound', duration: 90  },
    { time: '10:06', direction: 'inbound',  duration: 180 },
    { time: '10:34', direction: 'inbound',  duration: 300 },
    { time: '12:04', direction: 'inbound',  duration: 120 },
    { time: '12:31', direction: 'outbound', duration: 210 },
    { time: '12:58', direction: 'inbound',  duration: 270 },
    { time: '13:22', direction: 'inbound',  duration: 180 },
    { time: '13:51', direction: 'outbound', duration: 150 },
    { time: '14:17', direction: 'inbound',  duration: 240 },
    { time: '14:49', direction: 'inbound',  duration: 90  },
    { time: '15:16', direction: 'outbound', duration: 300 },
    { time: '15:52', direction: 'inbound',  duration: 180 },
    { time: '16:28', direction: 'inbound',  duration: 120 },
    { time: '17:14', direction: 'outbound', duration: 210 },
    { time: '17:43', direction: 'inbound',  duration: 150 },
  ],
  Chris: [
    { time: '08:28', direction: 'inbound',  duration: 240 },
    { time: '09:03', direction: 'outbound', duration: 180 },
    { time: '09:26', direction: 'inbound',  duration: 120 },
    { time: '09:58', direction: 'inbound',  duration: 300 },
    { time: '10:21', direction: 'outbound', duration: 90  },
    { time: '10:49', direction: 'inbound',  duration: 210 },
    { time: '11:15', direction: 'inbound',  duration: 270 },
    { time: '11:44', direction: 'outbound', duration: 150 },
    { time: '13:07', direction: 'inbound',  duration: 180 },
    { time: '13:33', direction: 'outbound', duration: 240 },
    { time: '13:58', direction: 'inbound',  duration: 120 },
    { time: '14:26', direction: 'inbound',  duration: 300 },
    { time: '14:55', direction: 'outbound', duration: 180 },
    { time: '15:23', direction: 'inbound',  duration: 90  },
    { time: '16:01', direction: 'inbound',  duration: 210 },
    { time: '16:39', direction: 'outbound', duration: 150 },
    { time: '17:18', direction: 'inbound',  duration: 270 },
  ],
  Jarrad: [
    { time: '08:36', direction: 'outbound', duration: 120 },
    { time: '09:11', direction: 'inbound',  duration: 300 },
    { time: '09:38', direction: 'inbound',  duration: 180 },
    { time: '10:04', direction: 'outbound', duration: 240 },
    { time: '10:33', direction: 'inbound',  duration: 90  },
    { time: '11:02', direction: 'inbound',  duration: 210 },
    { time: '11:28', direction: 'outbound', duration: 150 },
    { time: '11:57', direction: 'inbound',  duration: 270 },
    { time: '12:22', direction: 'inbound',  duration: 180 },
    { time: '14:08', direction: 'outbound', duration: 120 },
    { time: '14:37', direction: 'inbound',  duration: 300 },
    { time: '15:04', direction: 'inbound',  duration: 240 },
    { time: '15:31', direction: 'outbound', duration: 90  },
    { time: '15:59', direction: 'inbound',  duration: 180 },
    { time: '16:34', direction: 'inbound',  duration: 210 },
    { time: '17:12', direction: 'outbound', duration: 150 },
    { time: '17:46', direction: 'inbound',  duration: 120 },
  ],
};

const START_HOUR = 8;
const END_HOUR = 18;
const TOTAL_MINS = (END_HOUR - START_HOUR) * 60;

function toPercent(hour, minute) {
  return ((hour - START_HOUR) * 60 + minute) / TOTAL_MINS * 100;
}

// Duration in seconds → % of timeline width
function durToPercent(seconds) {
  return (seconds / 60) / TOTAL_MINS * 100;
}

const HOUR_LABELS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
  const h = START_HOUR + i;
  return h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`;
});

const LABEL_W = 64;
const TRACK_H = 14; // px height for each inbound/outbound bar
const GAP = 3;      // px gap between tracks
const ROW_H = TRACK_H * 2 + GAP + 16; // total row height with padding

export default function AgentCallTimeline() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [tooltip, setTooltip] = React.useState(null);

  const today = new Date().toISOString().split('T')[0];

  const { data: realCalls = [] } = useQuery({
    queryKey: ['calls-today-timeline'],
    queryFn: () => base44.entities.Call.list('-call_start_time', 200),
    refetchInterval: 60000,
  });

  const { data: employers = [] } = useQuery({
    queryKey: ['employers-for-timeline'],
    queryFn: () => base44.entities.Employer.list(),
    staleTime: 5 * 60 * 1000,
  });

  const employerColorMap = useMemo(() => {
    const map = {};
    employers.forEach(e => {
      map[e.id] = { name: e.employer_name, primary: e.dot_color_primary || '#94a3b8', secondary: e.dot_color_secondary || '#cbd5e1' };
    });
    return map;
  }, [employers]);

  // Build per-agent call blocks
  const agentBlocks = useMemo(() => {
    const todayCalls = realCalls.filter(c => c.call_start_time?.startsWith(today));
    const useDemo = todayCalls.length === 0;

    const result = {};
    AGENTS.forEach((agent, agentIdx) => {
      const colorOffset = { Ryan: 0, Vanessa: 3, Chris: 6, Jarrad: 1 }[agent] || 0;
      let counter = 0;

      const rawList = useDemo
        ? DEMO_CALLS[agent].map(c => {
            const [h, m] = c.time.split(':').map(Number);
            return { hour: h, minute: m, direction: c.direction, duration: c.duration, callId: null, caseId: null, employer: null };
          })
        : todayCalls
            .filter(c => c.created_by?.toLowerCase().includes(agent.toLowerCase()))
            .map(c => {
              const d = new Date(c.call_start_time);
              return { hour: d.getHours(), minute: d.getMinutes(), direction: c.direction, duration: c.duration || 180, callId: c.id, caseId: c.case_id, employer: c.employer_id ? employerColorMap[c.employer_id] : null };
            });

      result[agent] = rawList.map(c => {
        const employer = c.employer || EMPLOYER_DEMO_COLORS[(counter++ + colorOffset) % EMPLOYER_DEMO_COLORS.length];
        return { ...c, employer };
      });
    });
    return result;
  }, [realCalls, today, employerColorMap]);

  const totalCalls = Object.values(agentBlocks).reduce((s, a) => s + a.length, 0);

  const textPrimary   = isDark ? '#f0f0f0' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const gridLine      = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const laneBg        = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const laneBorder    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const centerLine    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <div style={{ width: '100%' }}>
      {/* Legend */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {EMPLOYER_DEMO_COLORS.map(e => (
          <div key={e.name} className="flex items-center gap-1">
            <div style={{ width: 8, height: 8, borderRadius: 2, background: e.primary, boxShadow: `0 0 4px ${e.primary}88` }} />
            <span style={{ fontSize: 10, color: textSecondary, fontWeight: 600 }}>{e.name}</span>
          </div>
        ))}
        <span style={{ fontSize: 10, color: textSecondary, marginLeft: 'auto' }}>{totalCalls} calls today</span>
      </div>

      {/* Direction labels */}
      <div style={{ display: 'flex', paddingLeft: LABEL_W, marginBottom: 2 }}>
        <span style={{ fontSize: 9, color: textSecondary, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>▲ IN</span>
        <span style={{ fontSize: 9, color: textSecondary, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 8 }}>▼ OUT</span>
      </div>

      {/* Agent rows */}
      {AGENTS.map(agent => {
        const blocks = agentBlocks[agent] || [];
        const inbound  = blocks.filter(c => c.direction === 'inbound');
        const outbound = blocks.filter(c => c.direction === 'outbound');

        return (
          <div key={agent} style={{ display: 'flex', alignItems: 'center', height: ROW_H, marginBottom: 4 }}>
            {/* Label */}
            <div style={{ width: LABEL_W, flexShrink: 0, fontSize: 11, fontWeight: 700, color: textPrimary, textAlign: 'right', paddingRight: 10 }}>
              {agent}
            </div>

            {/* Lane */}
            <div style={{ flex: 1, height: '100%', position: 'relative', background: laneBg, borderRadius: 8, border: `1px solid ${laneBorder}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4px 0' }}>

              {/* Hour grid lines */}
              {HOUR_LABELS.slice(0, -1).map((_, i) => (
                <div key={i} style={{ position: 'absolute', left: `${(i / (HOUR_LABELS.length - 1)) * 100}%`, top: 0, bottom: 0, width: 1, background: gridLine, pointerEvents: 'none' }} />
              ))}

              {/* Center divider */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: centerLine, pointerEvents: 'none' }} />

              {/* Inbound track (top half) */}
              <div style={{ position: 'relative', height: TRACK_H, marginBottom: GAP }}>
                {inbound.map((c, idx) => {
                  const left = toPercent(c.hour, c.minute);
                  const width = Math.max(durToPercent(c.duration), 0.4);
                  const col = c.employer.primary;
                  const sec = c.employer.secondary;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setTooltip({ agent, direction: 'inbound', time: `${String(c.hour).padStart(2,'0')}:${String(c.minute).padStart(2,'0')}`, dur: c.duration, employer: c.employer.name, color: col })}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => c.caseId && navigate(`/Case?id=${c.caseId}`)}
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        width: `${width}%`,
                        height: '100%',
                        bottom: 0,
                        borderRadius: '3px 3px 0 0',
                        background: `linear-gradient(180deg, ${sec} 0%, ${col} 100%)`,
                        boxShadow: `0 0 6px ${col}66, inset 0 1px 0 ${sec}`,
                        cursor: c.caseId ? 'pointer' : 'default',
                        opacity: 0.92,
                        transition: 'opacity 0.1s',
                      }}
                      onMouseOver={e => e.currentTarget.style.opacity = '1'}
                      onMouseOut={e => e.currentTarget.style.opacity = '0.92'}
                    />
                  );
                })}
              </div>

              {/* Outbound track (bottom half) */}
              <div style={{ position: 'relative', height: TRACK_H }}>
                {outbound.map((c, idx) => {
                  const left = toPercent(c.hour, c.minute);
                  const width = Math.max(durToPercent(c.duration), 0.4);
                  const col = c.employer.primary;
                  const sec = c.employer.secondary;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setTooltip({ agent, direction: 'outbound', time: `${String(c.hour).padStart(2,'0')}:${String(c.minute).padStart(2,'0')}`, dur: c.duration, employer: c.employer.name, color: col })}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => c.caseId && navigate(`/Case?id=${c.caseId}`)}
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        width: `${width}%`,
                        height: '100%',
                        top: 0,
                        borderRadius: '0 0 3px 3px',
                        background: `linear-gradient(180deg, ${col} 0%, ${sec} 100%)`,
                        boxShadow: `0 0 6px ${col}66, inset 0 -1px 0 ${sec}`,
                        cursor: c.caseId ? 'pointer' : 'default',
                        opacity: 0.85,
                        transition: 'opacity 0.1s',
                      }}
                      onMouseOver={e => e.currentTarget.style.opacity = '1'}
                      onMouseOut={e => e.currentTarget.style.opacity = '0.85'}
                    />
                  );
                })}
              </div>

              {/* Count badge */}
              <div style={{ position: 'absolute', right: -26, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontWeight: 700, color: textSecondary }}>
                {blocks.length}
              </div>
            </div>
          </div>
        );
      })}

      {/* X-axis */}
      <div style={{ display: 'flex', paddingLeft: LABEL_W, marginTop: 4, paddingRight: 30 }}>
        {HOUR_LABELS.map((label, i) => (
          <div key={label} style={{ flex: i === HOUR_LABELS.length - 1 ? 0 : 1, fontSize: 9, color: textSecondary, fontWeight: 600 }}>
            {label}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: isDark ? '#1e1b2e' : '#fff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
          borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600,
          color: textPrimary, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          pointerEvents: 'none', zIndex: 999, whiteSpace: 'nowrap',
        }}>
          <span style={{ color: tooltip.color, fontWeight: 800 }}>{tooltip.employer}</span>
          <span style={{ color: textSecondary, marginLeft: 8 }}>{tooltip.agent}</span>
          <span style={{ marginLeft: 8 }}>{tooltip.time}</span>
          <span style={{ color: textSecondary, marginLeft: 8, fontSize: 11 }}>
            {tooltip.direction} · {Math.floor(tooltip.dur / 60)}m{tooltip.dur % 60 > 0 ? ` ${tooltip.dur % 60}s` : ''}
          </span>
        </div>
      )}
    </div>
  );
}