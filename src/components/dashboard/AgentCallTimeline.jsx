import React, { useMemo, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

const AGENTS = ['Ryan', 'Vanessa', 'Chris', 'Jarrad'];

const EMPLOYER_DEMO_COLORS = [
  { name: 'Lazer',       primary: '#ff0808ff', secondary: '#ca1818ff' },
  { name: 'Orbital',     primary: '#ffb625ff', secondary: 'rgba(255, 166, 0, 1)' },
  { name: 'PSP',         primary: '#22c55e', secondary: 'rgba(30, 109, 11, 1)' },
  { name: 'PAM',         primary: 'rgba(20, 133, 232, 1)', secondary: 'rgba(127, 166, 220, 1)' },
  { name: 'Dohrn',       primary: 'rgba(255, 179, 0, 1)', secondary: '#f60400ff' },
  { name: 'Tekni-Plex',  primary: '#8400ffff', secondary: '#787878ff' },
  { name: "Buddy's",     primary: 'rgba(249, 237, 16, 1)', secondary: 'hsla(206, 100%, 43%, 1.00)' },
  { name: 'Rock-it',     primary: 'rgba(43, 197, 248, 1)', secondary: 'rgba(245, 48, 48, 1)' },
  { name: 'SwimUSA',     primary: '#010101ff', secondary: 'rgba(51, 51, 51, 1)' },
  { name: 'Brandywine',  primary: 'rgba(44, 162, 195, 1)', secondary: 'rgba(161, 160, 160, 1)' },
];

// Each demo call: time, direction, duration (seconds) — no overlaps per agent, 12 each = 48 total
// Long calls (30-60 min) are placed with enough gap so the next call starts after they end
// Lunch block: 12:00-13:00 (no calls during this window)
const DEMO_CALLS = {
  Ryan: [
    { time: '08:09', direction: 'inbound',  duration: 260  },  // ~4m
    { time: '08:58', direction: 'outbound', duration: 1980 },  // 33m ← long (ends ~09:31)
    { time: '09:38', direction: 'inbound',  duration: 310  },  // ~5m
    { time: '10:22', direction: 'outbound', duration: 195  },  // ~3m
    { time: '11:05', direction: 'inbound',  duration: 2340 },  // 39m ← long (ends ~11:44, before lunch)
    // LUNCH 12:00-13:00
    { time: '13:08', direction: 'outbound', duration: 280  },  // ~5m
    { time: '14:02', direction: 'inbound',  duration: 2700 },  // 45m ← long (ends ~14:47)
    { time: '14:55', direction: 'outbound', duration: 230  },  // ~4m
    { time: '15:42', direction: 'inbound',  duration: 265  },  // ~4m
    { time: '16:30', direction: 'outbound', duration: 210  },  // ~3m
    { time: '17:18', direction: 'inbound',  duration: 240  },  // ~4m
  ],
  Vanessa: [
    { time: '08:14', direction: 'outbound', duration: 2100 },  // 35m ← long (ends ~08:49)
    { time: '08:56', direction: 'inbound',  duration: 280  },  // ~5m
    { time: '09:48', direction: 'outbound', duration: 215  },  // ~4m
    { time: '10:33', direction: 'inbound',  duration: 2520 },  // 42m ← long (ends ~11:15, before lunch)
    // LUNCH 12:00-13:00
    { time: '13:04', direction: 'outbound', duration: 300  },  // ~5m
    { time: '13:58', direction: 'inbound',  duration: 1800 },  // 30m ← long (ends ~14:28)
    { time: '14:46', direction: 'outbound', duration: 185  },  // ~3m
    { time: '15:38', direction: 'inbound',  duration: 270  },  // ~5m
    { time: '16:30', direction: 'outbound', duration: 220  },  // ~4m
    { time: '17:22', direction: 'inbound',  duration: 195  },  // ~3m
  ],
  Chris: [
    { time: '08:28', direction: 'inbound',  duration: 245  },  // ~4m
    { time: '09:12', direction: 'outbound', duration: 2400 },  // 40m ← long (ends ~09:52)
    { time: '10:04', direction: 'inbound',  duration: 195  },  // ~3m
    { time: '10:48', direction: 'outbound', duration: 260  },  // ~4m
    { time: '11:36', direction: 'inbound',  duration: 2100 },  // 35m ← long (ends ~12:11, after lunch start)
    // LUNCH 12:00-13:00
    { time: '13:18', direction: 'outbound', duration: 290  },  // ~5m
    { time: '14:10', direction: 'inbound',  duration: 1980 },  // 33m ← long (ends ~14:43)
    { time: '14:55', direction: 'outbound', duration: 180  },  // ~3m
    { time: '15:40', direction: 'inbound',  duration: 235  },  // ~4m
    { time: '16:28', direction: 'outbound', duration: 210  },  // ~3m
    { time: '17:16', direction: 'inbound',  duration: 160  },  // ~3m
  ],
  Jarrad: [
    { time: '08:21', direction: 'outbound', duration: 230  },  // ~4m
    { time: '09:06', direction: 'inbound',  duration: 2700 },  // 45m ← long (ends ~09:51)
    { time: '10:04', direction: 'outbound', duration: 215  },  // ~4m
    { time: '10:48', direction: 'inbound',  duration: 270  },  // ~5m
    { time: '11:38', direction: 'outbound', duration: 1440 },  // 24m ← (ends ~12:02, straddles lunch)
    // LUNCH 12:00-13:00
    { time: '13:08', direction: 'inbound',  duration: 245  },  // ~4m
    { time: '14:00', direction: 'outbound', duration: 3000 },  // 50m ← long (ends ~14:50)
    { time: '15:02', direction: 'inbound',  duration: 200  },  // ~3m
    { time: '15:48', direction: 'outbound', duration: 265  },  // ~4m
    { time: '16:38', direction: 'inbound',  duration: 185  },  // ~3m
    { time: '17:24', direction: 'outbound', duration: 220  },  // ~4m
  ],
};

const START_HOUR = 8;
const END_HOUR = 18;
const TOTAL_MINS = (END_HOUR - START_HOUR) * 60;

function toPercent(hour, minute) {
  return ((hour - START_HOUR) * 60 + minute) / TOTAL_MINS * 100;
}

// Duration in seconds → % of timeline width. Minimum visible = 1.5%
function durToPercent(seconds) {
  return Math.max((seconds / 60) / TOTAL_MINS * 100, 1.5);
}

const HOUR_LABELS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
  const h = START_HOUR + i;
  return h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`;
});

const LABEL_W = 64;
const TRACK_H = 14; // px height for each inbound/outbound bar
const GAP = 3;      // px gap between tracks
const ROW_H = TRACK_H * 2 + GAP + 16; // total row height with padding

export default function AgentCallTimeline({ calls: incomingCalls = [] }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [tooltip, setTooltip] = React.useState(null);

  const today = new Date().toISOString().split('T')[0];

  const realCalls = Array.isArray(incomingCalls) ? incomingCalls : [];
  const callsLoading = false;

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
    if (callsLoading) return {};
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
    <div style={{ width: '100%', overflow: 'hidden' }}>
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
            <div style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', background: laneBg, borderRadius: 8, border: `1px solid ${laneBorder}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: GAP, padding: '4px 0' }}>

              {/* Hour grid lines */}
              {HOUR_LABELS.slice(0, -1).map((_, i) => (
                <div key={i} style={{ position: 'absolute', left: `${(i / (HOUR_LABELS.length - 1)) * 100}%`, top: 0, bottom: 0, width: 1, background: gridLine, pointerEvents: 'none' }} />
              ))}

              {/* Center divider */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: centerLine, pointerEvents: 'none' }} />

              {/* Inbound track (top half) */}
              <div style={{ position: 'relative', height: TRACK_H, flexShrink: 0 }}>
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
              <div style={{ position: 'relative', height: TRACK_H, flexShrink: 0 }}>
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
              <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 700, color: textSecondary, background: laneBg, lineHeight: 1 }}>
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