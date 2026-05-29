import React, { useMemo, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

const AGENTS = ['Ryan', 'Vanessa', 'Chris', 'Jarrad'];

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

export default function AgentCallTimeline({ calls: liveCalls }) {
  const { isDark } = useTheme();

  const demoCalls = useMemo(() => generateDemoCalls(), []);

  // Always use demo data — this is a demo environment
  const allCalls = demoCalls;

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