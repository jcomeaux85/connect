import React, { useMemo, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

const AGENTS = ['Jarrad', 'Vanessa', 'Ryan', 'Chris'];

// Generate demo calls for today spread across 8am–6pm
function generateDemoCalls() {
  const calls = [];
  const now = new Date();
  const baseDate = now.toISOString().split('T')[0];

  // Realistic call center cadence:
  // Quiet open (8–9), mid-morning surge (9:30–11:30), lunch lull (12–13),
  // afternoon peak (13:30–16), wind-down (16:30–18)
  const agentCalls = {
    Jarrad: [
      { time: '08:22', direction: 'inbound' },   // quiet open
      { time: '09:08', direction: 'inbound' },   // ramp up
      { time: '09:34', direction: 'outbound' },
      { time: '09:52', direction: 'inbound' },
      { time: '10:18', direction: 'inbound' },   // morning surge
      { time: '10:41', direction: 'inbound' },
      { time: '11:03', direction: 'outbound' },
      { time: '11:29', direction: 'inbound' },
      { time: '11:54', direction: 'inbound' },
      { time: '13:07', direction: 'inbound' },   // post-lunch ramp
      { time: '13:38', direction: 'outbound' },
      { time: '14:12', direction: 'inbound' },   // afternoon peak
      { time: '14:44', direction: 'inbound' },
      { time: '15:06', direction: 'outbound' },
      { time: '15:33', direction: 'inbound' },
      { time: '16:01', direction: 'inbound' },
      { time: '16:48', direction: 'outbound' },  // wind-down
      { time: '17:22', direction: 'inbound' },
    ],
    Vanessa: [
      { time: '08:35', direction: 'outbound' },  // quiet open
      { time: '09:14', direction: 'inbound' },
      { time: '09:42', direction: 'inbound' },   // ramp up
      { time: '10:07', direction: 'outbound' },
      { time: '10:29', direction: 'inbound' },   // morning surge
      { time: '10:58', direction: 'inbound' },
      { time: '11:17', direction: 'inbound' },
      { time: '11:45', direction: 'outbound' },
      { time: '13:02', direction: 'outbound' },  // post-lunch
      { time: '13:31', direction: 'inbound' },
      { time: '14:05', direction: 'inbound' },   // afternoon peak
      { time: '14:37', direction: 'inbound' },
      { time: '15:11', direction: 'outbound' },
      { time: '15:48', direction: 'inbound' },
      { time: '16:19', direction: 'inbound' },
      { time: '17:04', direction: 'outbound' },  // wind-down
      { time: '17:38', direction: 'inbound' },
    ],
    Ryan: [
      { time: '08:18', direction: 'inbound' },   // quiet open
      { time: '09:22', direction: 'inbound' },
      { time: '09:49', direction: 'outbound' },  // ramp up
      { time: '10:14', direction: 'inbound' },   // morning surge
      { time: '10:47', direction: 'inbound' },
      { time: '11:09', direction: 'inbound' },
      { time: '11:38', direction: 'outbound' },
      { time: '12:51', direction: 'inbound' },   // post-lunch
      { time: '13:22', direction: 'inbound' },
      { time: '13:55', direction: 'outbound' },  // afternoon peak
      { time: '14:28', direction: 'inbound' },
      { time: '15:03', direction: 'inbound' },
      { time: '15:41', direction: 'outbound' },
      { time: '16:14', direction: 'inbound' },
      { time: '16:52', direction: 'inbound' },   // wind-down
      { time: '17:29', direction: 'outbound' },
    ],
    Chris: [
      { time: '08:47', direction: 'outbound' },  // quiet open
      { time: '09:17', direction: 'inbound' },
      { time: '09:55', direction: 'inbound' },   // ramp up
      { time: '10:22', direction: 'outbound' },  // morning surge
      { time: '10:51', direction: 'inbound' },
      { time: '11:13', direction: 'inbound' },
      { time: '11:42', direction: 'inbound' },
      { time: '13:15', direction: 'outbound' },  // post-lunch
      { time: '13:44', direction: 'inbound' },
      { time: '14:09', direction: 'inbound' },   // afternoon peak
      { time: '14:52', direction: 'outbound' },
      { time: '15:19', direction: 'inbound' },
      { time: '15:57', direction: 'inbound' },
      { time: '16:33', direction: 'outbound' },  // wind-down
      { time: '17:11', direction: 'inbound' },
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

export default function AgentCallTimeline({ calls: liveCalls }) {
  const { isDark } = useTheme();

  const demoCalls = useMemo(() => generateDemoCalls(), []);

  // Use live calls only if they have real call_start_time data, else demo
  const allCalls = useMemo(() => {
    const liveWithTime = (liveCalls || []).filter(c => c.call_start_time);
    if (liveWithTime.length > 0) {
      return liveWithTime
        .map(c => {
          const d = new Date(c.call_start_time);
          const agentIdx = Math.abs(c.id?.charCodeAt(0) || 0) % AGENTS.length;
          return {
            agent: AGENTS[agentIdx],
            hour: d.getHours(),
            minute: d.getMinutes(),
            direction: c.direction || 'inbound',
          };
        })
        .filter(c => c.hour >= START_HOUR && c.hour < END_HOUR);
    }
    return demoCalls;
  }, [liveCalls, demoCalls]);

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
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#38bdf8' }} />
          <span style={{ fontSize: '11px', color: textSecondary, fontWeight: 600 }}>Inbound</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#fb923c' }} />
          <span style={{ fontSize: '11px', color: textSecondary, fontWeight: 600 }}>Outbound</span>
        </div>
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

                {/* Call dots */}
                {agentCalls.map((call, idx) => {
                  const pct = timeToPercent(call.hour, call.minute);
                  const isInbound = call.direction === 'inbound';
                  const color = isInbound ? '#38bdf8' : '#fb923c';
                  const timeStr = `${String(call.hour).padStart(2, '0')}:${String(call.minute).padStart(2, '0')}`;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={(e) => setTooltip({ agent, time: timeStr, direction: call.direction, x: pct })}
                      onMouseLeave={() => setTooltip(null)}
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
                        cursor: 'pointer',
                        zIndex: 2,
                        transition: 'transform 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.5)'}
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
          {tooltip.agent} · {tooltip.time} ·{' '}
          <span style={{ color: tooltip.direction === 'inbound' ? '#38bdf8' : '#fb923c' }}>
            {tooltip.direction}
          </span>
        </div>
      )}
    </div>
  );
}