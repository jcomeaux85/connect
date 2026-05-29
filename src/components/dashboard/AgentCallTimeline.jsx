import React, { useMemo, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

const AGENTS = ['Ryan', 'Vanessa', 'Chris', 'Jarrad'];

// Fallback employer colors (used for demo rotation when no employer_id on call)
const EMPLOYER_DEMO_COLORS = [
  { name: 'Lazer',           primary: '#ef4444', secondary: '#fca5a5' },
  { name: 'Orbital',         primary: '#f97316', secondary: '#fdba74' },
  { name: 'PSP',             primary: '#22c55e', secondary: '#86efac' },
  { name: 'PAM',             primary: '#3b82f6', secondary: '#93c5fd' },
  { name: 'Dohrn',           primary: '#8b5cf6', secondary: '#c4b5fd' },
  { name: 'Tekni-Plex',      primary: '#06b6d4', secondary: '#67e8f9' },
  { name: "Buddy's",         primary: '#f43f5e', secondary: '#fda4af' },
  { name: 'GCL/Rock-it',     primary: '#eab308', secondary: '#fde047' },
  { name: 'SwimUSA',         primary: '#14b8a6', secondary: '#5eead4' },
  { name: 'Brandywine',      primary: '#ec4899', secondary: '#f9a8d4' },
];

// Generate demo calls for today spread across 8am–6pm
function generateDemoCalls() {
  const calls = [];
  const now = new Date();
  const baseDate = now.toISOString().split('T')[0];

  // Staggered lunches: Ryan 10–11, Vanessa 11–12, Chris 12–13, Jarrad 13–14
  const agentCalls = {
    Ryan: [
      { time: '08:11', direction: 'inbound' },   // quiet open
      { time: '08:44', direction: 'outbound' },
      { time: '09:08', direction: 'inbound' },   // ramp up
      { time: '09:31', direction: 'inbound' },
      { time: '09:52', direction: 'outbound' },
      // LUNCH 10:00–11:00 — gap
      { time: '11:07', direction: 'inbound' },   // back from lunch
      { time: '11:29', direction: 'inbound' },
      { time: '11:54', direction: 'outbound' },
      { time: '12:18', direction: 'inbound' },   // afternoon build
      { time: '12:46', direction: 'inbound' },
      { time: '13:14', direction: 'outbound' },
      { time: '13:41', direction: 'inbound' },   // peak
      { time: '14:09', direction: 'inbound' },
      { time: '14:38', direction: 'outbound' },
      { time: '15:05', direction: 'inbound' },
      { time: '15:44', direction: 'inbound' },
      { time: '16:22', direction: 'outbound' },  // wind-down
      { time: '17:08', direction: 'inbound' },
    ],
    Vanessa: [
      { time: '08:19', direction: 'outbound' },  // quiet open
      { time: '08:52', direction: 'inbound' },
      { time: '09:17', direction: 'inbound' },   // ramp up
      { time: '09:43', direction: 'outbound' },
      { time: '10:06', direction: 'inbound' },   // mid-morning
      { time: '10:34', direction: 'inbound' },
      // LUNCH 11:00–12:00 — gap
      { time: '12:04', direction: 'inbound' },   // back from lunch
      { time: '12:31', direction: 'outbound' },
      { time: '12:58', direction: 'inbound' },
      { time: '13:22', direction: 'inbound' },   // afternoon build
      { time: '13:51', direction: 'outbound' },
      { time: '14:17', direction: 'inbound' },   // peak
      { time: '14:49', direction: 'inbound' },
      { time: '15:16', direction: 'outbound' },
      { time: '15:52', direction: 'inbound' },
      { time: '16:28', direction: 'inbound' },   // wind-down
      { time: '17:14', direction: 'outbound' },
      { time: '17:43', direction: 'inbound' },
    ],
    Chris: [
      { time: '08:28', direction: 'inbound' },   // quiet open
      { time: '09:03', direction: 'outbound' },
      { time: '09:26', direction: 'inbound' },   // ramp up
      { time: '09:58', direction: 'inbound' },
      { time: '10:21', direction: 'outbound' },  // mid-morning
      { time: '10:49', direction: 'inbound' },
      { time: '11:15', direction: 'inbound' },
      { time: '11:44', direction: 'outbound' },
      // LUNCH 12:00–13:00 — gap
      { time: '13:07', direction: 'inbound' },   // back from lunch
      { time: '13:33', direction: 'outbound' },
      { time: '13:58', direction: 'inbound' },   // peak
      { time: '14:26', direction: 'inbound' },
      { time: '14:55', direction: 'outbound' },
      { time: '15:23', direction: 'inbound' },
      { time: '16:01', direction: 'inbound' },   // wind-down
      { time: '16:39', direction: 'outbound' },
      { time: '17:18', direction: 'inbound' },
    ],
    Jarrad: [
      { time: '08:36', direction: 'outbound' },  // quiet open
      { time: '09:11', direction: 'inbound' },
      { time: '09:38', direction: 'inbound' },   // ramp up
      { time: '10:04', direction: 'outbound' },  // mid-morning
      { time: '10:33', direction: 'inbound' },
      { time: '11:02', direction: 'inbound' },
      { time: '11:28', direction: 'outbound' },
      { time: '11:57', direction: 'inbound' },
      { time: '12:22', direction: 'inbound' },
      // LUNCH 13:00–14:00 — gap
      { time: '14:08', direction: 'outbound' },  // back from lunch / peak
      { time: '14:37', direction: 'inbound' },
      { time: '15:04', direction: 'inbound' },
      { time: '15:31', direction: 'outbound' },
      { time: '15:59', direction: 'inbound' },
      { time: '16:34', direction: 'inbound' },   // wind-down
      { time: '17:12', direction: 'outbound' },
      { time: '17:46', direction: 'inbound' },
    ],
  };

  Object.entries(agentCalls).forEach(([agent, agentList]) => {
    agentList.forEach(c => {
      const [h, m] = c.time.split(':').map(Number);
      calls.push({ agent, hour: h, minute: m, direction: c.direction });
    });
  });

  return calls;
}

const START_HOUR = 8;
const END_HOUR = 18;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function timeToPercent(hour, minute) {
  const totalMinutes = (hour - START_HOUR) * 60 + minute;
  return (totalMinutes / (TOTAL_HOURS * 60)) * 100;
}

const HOUR_LABELS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const h = START_HOUR + i;
  return h === 12 ? '12PM' : h < 12 ? `${h}AM` : `${h - 12}PM`;
});

// Map agent names to their call_start_time hours/minutes for matching
const AGENT_CALL_MAP = {
  Ryan:    ['08:11','08:44','09:08','09:31','09:52','11:07','11:29','11:54','12:18','12:46','13:14','13:41','14:09','14:38','15:05','15:44','16:22','17:08'],
  Vanessa: ['08:19','08:52','09:17','09:43','10:06','10:34','12:04','12:31','12:58','13:22','13:51','14:17','14:49','15:16','15:52','16:28','17:14','17:43'],
  Chris:   ['08:28','09:03','09:26','09:58','10:21','10:49','11:15','11:44','13:07','13:33','13:58','14:26','14:55','15:23','16:01','16:39','17:18'],
  Jarrad:  ['08:36','09:11','09:38','10:04','10:33','11:02','11:28','11:57','12:22','14:08','14:37','15:04','15:31','15:59','16:34','17:12','17:46'],
};

export default function AgentCallTimeline({ calls: liveCalls }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();

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

  // Build employer color map keyed by id
  const employerColorMap = useMemo(() => {
    const map = {};
    employers.forEach(e => {
      map[e.id] = {
        name: e.employer_name,
        primary: e.dot_color_primary || '#94a3b8',
        secondary: e.dot_color_secondary || '#cbd5e1',
      };
    });
    return map;
  }, [employers]);

  // Match real Call records to agents by time
  const allCalls = useMemo(() => {
    const todayCalls = realCalls.filter(c => c.call_start_time && c.call_start_time.startsWith(today));

    // Assign demo employer colors by rotating through the list per-agent
    const agentCounters = { Ryan: 0, Vanessa: 0, Chris: 0, Jarrad: 0 };

    const assignEmployer = (agent, match) => {
      if (match?.employer_id && employerColorMap[match.employer_id]) {
        return employerColorMap[match.employer_id];
      }
      // Rotate through demo employers per agent for visual variety
      const idx = agentCounters[agent] % EMPLOYER_DEMO_COLORS.length;
      agentCounters[agent] = (agentCounters[agent] + 1);
      // Offset each agent so they don't all start on Lazer
      const agentOffset = { Ryan: 0, Vanessa: 3, Chris: 6, Jarrad: 1 };
      return EMPLOYER_DEMO_COLORS[(idx + (agentOffset[agent] || 0)) % EMPLOYER_DEMO_COLORS.length];
    };

    if (todayCalls.length === 0) {
      return generateDemoCalls().map(c => ({
        ...c, callId: null, caseId: null,
        employer: assignEmployer(c.agent, null),
      }));
    }

    const result = [];
    Object.entries(AGENT_CALL_MAP).forEach(([agent, times]) => {
      times.forEach(t => {
        const [th, tm] = t.split(':').map(Number);
        const match = todayCalls.find(c => {
          const d = new Date(c.call_start_time);
          return d.getHours() === th && Math.abs(d.getMinutes() - tm) <= 2;
        });
        result.push({
          agent, hour: th, minute: tm,
          direction: match?.direction || 'inbound',
          callId: match?.id || null,
          caseId: match?.case_id || null,
          employer: assignEmployer(agent, match),
        });
      });
    });
    return result;
  }, [realCalls, today, employerColorMap]);

  const textPrimary = isDark ? '#f0f0f0' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const gridLine = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const agentLineBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const agentBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  const ROW_HEIGHT = 48;
  const LABEL_WIDTH = 72;

  const [tooltip, setTooltip] = React.useState(null);

  return (
    <div style={{ width: '100%' }}>
      {/* Legend — employer colors */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {EMPLOYER_DEMO_COLORS.map(e => (
          <div key={e.name} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: e.primary, boxShadow: `0 0 4px ${e.primary}88` }} />
            <span style={{ fontSize: '10px', color: textSecondary, fontWeight: 600 }}>{e.name}</span>
          </div>
        ))}
        <span style={{ fontSize: '10px', color: textSecondary, marginLeft: 'auto' }}>
          {allCalls.length} calls today
        </span>
      </div>

      {/* Chart area */}
      <div style={{ position: 'relative' }}>
        {/* Agent rows */}
        {AGENTS.map((agent) => {
          const agentCalls = allCalls.filter(c => c.agent === agent);
          return (
            <div
              key={agent}
              className="flex items-center"
              style={{ height: `${ROW_HEIGHT}px`, marginBottom: '6px' }}
            >
              {/* Agent name label */}
              <div
                style={{
                  width: `${LABEL_WIDTH}px`,
                  flexShrink: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: textPrimary,
                  paddingRight: '10px',
                  textAlign: 'right',
                }}
              >
                {agent}
              </div>

              {/* Timeline lane */}
              <div
                style={{
                  flex: 1,
                  height: '100%',
                  position: 'relative',
                  background: agentLineBg,
                  borderRadius: '10px',
                  border: `1px solid ${agentBorder}`,
                  overflow: 'visible',
                }}
              >
                {/* Hour grid lines */}
                {HOUR_LABELS.slice(0, -1).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${(i / TOTAL_HOURS) * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      background: gridLine,
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {/* Center line */}
                <div style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  top: '50%',
                  height: '1px',
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  pointerEvents: 'none',
                }} />

                {/* Call dots — colored by employer */}
                {agentCalls.map((call, idx) => {
                  const pct = timeToPercent(call.hour, call.minute);
                  const color = call.employer?.primary || '#94a3b8';
                  const timeStr = `${String(call.hour).padStart(2, '0')}:${String(call.minute).padStart(2, '0')}`;
                  const hasLink = !!call.caseId;
                  const employerName = call.employer?.name || '';
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setTooltip({ agent, time: timeStr, direction: call.direction, hasLink, employer: employerName, color })}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => call.caseId && navigate(`/Case?id=${call.caseId}`)}
                      style={{
                        position: 'absolute',
                        left: `${pct}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: color,
                        boxShadow: `0 0 6px ${color}99`,
                        cursor: hasLink ? 'pointer' : 'default',
                        zIndex: 2,
                        transition: 'transform 0.15s',
                        border: `1.5px solid ${call.employer?.secondary || color}`,
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.6)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
                    />
                  );
                })}

                {/* Call count badge */}
                <div style={{
                  position: 'absolute',
                  right: '-28px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: textSecondary,
                  minWidth: '22px',
                }}>
                  {agentCalls.length}
                </div>
              </div>
            </div>
          );
        })}

        {/* X-axis labels */}
        <div className="flex" style={{ paddingLeft: `${LABEL_WIDTH}px`, marginTop: '4px', paddingRight: '30px' }}>
          {HOUR_LABELS.map((label, i) => (
            <div
              key={label}
              style={{
                flex: i === HOUR_LABELS.length - 1 ? 0 : 1,
                fontSize: '10px',
                color: textSecondary,
                fontWeight: 600,
                textAlign: 'left',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: isDark ? '#1e1b2e' : '#fff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
            borderRadius: '10px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: textPrimary,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            zIndex: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.agent} · {tooltip.time}
          {tooltip.employer && (
            <span style={{ color: tooltip.color, marginLeft: '6px', fontWeight: 700 }}>{tooltip.employer}</span>
          )}
          <span style={{ color: isDark ? '#9ca3af' : '#6b7280', marginLeft: '6px', fontSize: '11px' }}>
            {tooltip.direction}
          </span>
          {tooltip.hasLink && <span style={{ color: '#a3e635', marginLeft: '6px' }}>→ case</span>}
        </div>
      )}
    </div>
  );
}