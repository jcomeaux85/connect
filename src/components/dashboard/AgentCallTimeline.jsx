import React, { useMemo, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import CallWaveform from '@/components/dashboard/CallWaveform';

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

// Each demo call: time, direction, duration (seconds), employer.
// Dispersion: Lazer & PAM dominate; Tekni-Plex & Orbital ~1/4 as frequent;
// PSP gets short voicemail-length calls (mostly early); others spotty.
const DEMO_CALLS = {
  Ryan: [
    { time: '08:06', direction: 'inbound',  duration: 28,   employer: 'PSP'        },  // voicemail
    { time: '08:14', direction: 'outbound', duration: 1980, employer: 'Lazer'      },  // long
    { time: '08:34', direction: 'inbound',  duration: 22,   employer: 'PSP'        },  // voicemail
    { time: '09:02', direction: 'inbound',  duration: 310,  employer: 'PAM'        },
    { time: '09:40', direction: 'outbound', duration: 240,  employer: 'Lazer'      },
    { time: '10:18', direction: 'inbound',  duration: 1860, employer: 'PAM'        },  // long
    { time: '11:05', direction: 'outbound', duration: 200,  employer: 'Tekni-Plex' },
    { time: '11:38', direction: 'inbound',  duration: 265,  employer: 'Lazer'      },
    { time: '13:10', direction: 'outbound', duration: 280,  employer: 'PAM'        },
    { time: '14:02', direction: 'inbound',  duration: 2100, employer: 'Lazer'      },  // long
    { time: '15:00', direction: 'outbound', duration: 230,  employer: 'Orbital'    },
    { time: '15:48', direction: 'inbound',  duration: 255,  employer: 'PAM'        },
    { time: '16:36', direction: 'outbound', duration: 210,  employer: 'Lazer'      },
    { time: '17:20', direction: 'inbound',  duration: 240,  employer: 'PAM'        },
  ],
  Vanessa: [
    { time: '08:10', direction: 'inbound',  duration: 25,   employer: 'PSP'        },  // voicemail
    { time: '08:22', direction: 'outbound', duration: 2100, employer: 'PAM'        },  // long
    { time: '09:05', direction: 'inbound',  duration: 30,   employer: 'PSP'        },  // voicemail
    { time: '09:32', direction: 'outbound', duration: 245,  employer: 'Lazer'      },
    { time: '10:08', direction: 'inbound',  duration: 280,  employer: 'PAM'        },
    { time: '10:46', direction: 'outbound', duration: 1740, employer: 'Lazer'      },  // long
    { time: '11:30', direction: 'inbound',  duration: 215,  employer: 'Orbital'    },
    { time: '13:04', direction: 'outbound', duration: 300,  employer: 'PAM'        },
    { time: '13:46', direction: 'inbound',  duration: 1980, employer: 'Lazer'      },  // long
    { time: '14:42', direction: 'outbound', duration: 185,  employer: 'Tekni-Plex' },
    { time: '15:30', direction: 'inbound',  duration: 270,  employer: 'PAM'        },
    { time: '16:24', direction: 'outbound', duration: 220,  employer: 'Lazer'      },
    { time: '17:18', direction: 'inbound',  duration: 195,  employer: "Buddy's"    },
  ],
  Chris: [
    { time: '08:04', direction: 'inbound',  duration: 24,   employer: 'PSP'        },  // voicemail
    { time: '08:12', direction: 'outbound', duration: 26,   employer: 'PSP'        },  // voicemail
    { time: '08:30', direction: 'inbound',  duration: 1860, employer: 'Lazer'      },  // long
    { time: '09:14', direction: 'outbound', duration: 195,  employer: 'PAM'        },
    { time: '09:50', direction: 'inbound',  duration: 260,  employer: 'Lazer'      },
    { time: '10:30', direction: 'outbound', duration: 2160, employer: 'PAM'        },  // long
    { time: '11:24', direction: 'inbound',  duration: 235,  employer: 'Orbital'    },
    { time: '13:16', direction: 'outbound', duration: 290,  employer: 'Lazer'      },
    { time: '14:00', direction: 'inbound',  duration: 1920, employer: 'PAM'        },  // long
    { time: '14:54', direction: 'outbound', duration: 180,  employer: 'Tekni-Plex' },
    { time: '15:40', direction: 'inbound',  duration: 245,  employer: 'Lazer'      },
    { time: '16:30', direction: 'outbound', duration: 210,  employer: 'PAM'        },
    { time: '17:14', direction: 'inbound',  duration: 160,  employer: 'Rock-it'    },
  ],
  Jarrad: [
    { time: '08:08', direction: 'inbound',  duration: 27,   employer: 'PSP'        },  // voicemail
    { time: '08:20', direction: 'outbound', duration: 2040, employer: 'Lazer'      },  // long
    { time: '09:04', direction: 'inbound',  duration: 21,   employer: 'PSP'        },  // voicemail
    { time: '09:30', direction: 'outbound', duration: 215,  employer: 'PAM'        },
    { time: '10:06', direction: 'inbound',  duration: 270,  employer: 'Lazer'      },
    { time: '10:44', direction: 'outbound', duration: 1620, employer: 'PAM'        },  // long
    { time: '11:28', direction: 'inbound',  duration: 230,  employer: 'Tekni-Plex' },
    { time: '13:08', direction: 'outbound', duration: 245,  employer: 'Lazer'      },
    { time: '13:52', direction: 'inbound',  duration: 2280, employer: 'PAM'        },  // long
    { time: '14:50', direction: 'outbound', duration: 200,  employer: 'Orbital'    },
    { time: '15:38', direction: 'inbound',  duration: 265,  employer: 'Lazer'      },
    { time: '16:28', direction: 'outbound', duration: 185,  employer: 'SwimUSA'    },
    { time: '17:22', direction: 'inbound',  duration: 220,  employer: 'PAM'        },
  ],
};

const EMPLOYER_BY_NAME = Object.fromEntries(EMPLOYER_DEMO_COLORS.map(e => [e.name, e]));

// Deterministic pseudo-random 0..1 from a seed — keeps waveforms stable per call
function seededRand(seed) {
  const x = Math.sin(seed * 99991.137) * 43758.5453;
  return x - Math.floor(x);
}

// Build a waveform bar-height array for a call (seeded so it never reflows)
function buildWaveform(seed, barCount) {
  const bars = [];
  for (let i = 0; i < barCount; i++) {
    const r = seededRand(seed + i * 7.13);
    // envelope: louder in the middle, quieter at edges — feels like speech
    const env = 0.45 + 0.55 * Math.sin((i / Math.max(barCount - 1, 1)) * Math.PI);
    bars.push(Math.max(0.18, r * env));
  }
  return bars;
}

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
  const [hoveredAgent, setHoveredAgent] = React.useState(null);

  // Drive the global SPOTLIGHT so surrounding tiles dim while a lane is hovered
  React.useEffect(() => {
    const body = document.body;
    if (hoveredAgent) {
      body.setAttribute('data-spotlight', 'on');
      body.setAttribute('data-spotlight-active', '');
    } else {
      body.removeAttribute('data-spotlight-active');
    }
    return () => body.removeAttribute('data-spotlight-active');
  }, [hoveredAgent]);

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
      let counter = 0;

      const rawList = useDemo
        ? DEMO_CALLS[agent].map(c => {
            const [h, m] = c.time.split(':').map(Number);
            return { hour: h, minute: m, direction: c.direction, duration: c.duration, callId: null, caseId: null, employer: EMPLOYER_BY_NAME[c.employer] || null };
          })
        : todayCalls
            .filter(c => c.created_by?.toLowerCase().includes(agent.toLowerCase()))
            .map(c => {
              const d = new Date(c.call_start_time);
              return { hour: d.getHours(), minute: d.getMinutes(), direction: c.direction, duration: c.duration || 180, callId: c.id, caseId: c.case_id, employer: c.employer_id ? employerColorMap[c.employer_id] : null };
            });

      result[agent] = rawList.map((c, i) => {
        const employer = c.employer || EMPLOYER_DEMO_COLORS[(counter++ + agentIdx) % EMPLOYER_DEMO_COLORS.length];
        const seed = (agentIdx + 1) * 131 + i * 17 + c.hour * 3 + c.minute;
        return { ...c, employer, seed };
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
  const gridLineMajor = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.16)';
  const bandShade     = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)';

  return (
<div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header: count (top-right) + IN/OUT labels */}
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: LABEL_W, marginBottom: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: textSecondary, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>▲ IN</span>
        <span style={{ fontSize: 9, color: textSecondary, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 8 }}>▼ OUT</span>
        <span style={{ fontSize: 10, color: textSecondary, marginLeft: 'auto', fontWeight: 600 }}>{totalCalls} calls today</span>
      </div>

      {/* Agent rows — vertically centered between the count and the legend */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
        {AGENTS.map(agent => {
          const blocks = agentBlocks[agent] || [];
          const inbound  = blocks.filter(c => c.direction === 'inbound');
          const outbound = blocks.filter(c => c.direction === 'outbound');

          const isHot = hoveredAgent === agent;

          return (
            <div key={agent} style={{ display: 'flex', alignItems: 'center', flex: 1, minHeight: 0 }}>
              {/* Label */}
              <div style={{ width: LABEL_W, flexShrink: 0, fontSize: 14, fontWeight: 700, color: textPrimary, textAlign: 'right', paddingRight: 10, transition: 'transform 0.2s', transform: isHot ? 'scale(1.08)' : 'scale(1)' }}>
                {agent}
              </div>

              {/* Lane */}
              <div
                className={`agent-lane spot-panel${isHot ? ' lane-active' : ''}`}
                data-spot-selected={isHot ? '' : undefined}
                onMouseEnter={() => setHoveredAgent(agent)}
                onMouseLeave={() => { setHoveredAgent(null); setTooltip(null); }}
                style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', background: laneBg, borderRadius: 8, border: `1px solid ${laneBorder}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: GAP, padding: '4px 0' }}>

                {/* Center divider */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: centerLine, pointerEvents: 'none', zIndex: 1 }} />

                {/* Inbound track (top half) */}
                <div style={{ position: 'relative', flex: 1, minHeight: 0, zIndex: 2 }}>
                  {inbound.map((c, idx) => {
                    const left = toPercent(c.hour, c.minute);
                    const width = Math.max(durToPercent(c.duration), 0.4);
                    const col = c.employer.primary;
                    const sec = c.employer.secondary;
                    const barCount = Math.max(3, Math.round(width * 2.2));
                    const bars = buildWaveform(c.seed, barCount);
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
                          cursor: c.caseId ? 'pointer' : 'default',
                          opacity: 0.92,
                          transition: 'opacity 0.1s',
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = '1'}
                        onMouseOut={e => e.currentTarget.style.opacity = '0.92'}
                      >
                        <CallWaveform bars={bars} color={col} secondary={sec} direction="inbound" active={isHot} />
                      </div>
                    );
                  })}
                </div>

                {/* Outbound track (bottom half) */}
                <div style={{ position: 'relative', flex: 1, minHeight: 0, zIndex: 2 }}>
                  {outbound.map((c, idx) => {
                    const left = toPercent(c.hour, c.minute);
                    const width = Math.max(durToPercent(c.duration), 0.4);
                    const col = c.employer.primary;
                    const sec = c.employer.secondary;
                    const barCount = Math.max(3, Math.round(width * 2.2));
                    const bars = buildWaveform(c.seed, barCount);
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
                          cursor: c.caseId ? 'pointer' : 'default',
                          opacity: 0.85,
                          transition: 'opacity 0.1s',
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = '1'}
                        onMouseOut={e => e.currentTarget.style.opacity = '0.85'}
                      >
                        <CallWaveform bars={bars} color={col} secondary={sec} direction="outbound" active={isHot} />
                      </div>
                    );
                  })}
                </div>

                {/* Count badge */}
                <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 700, color: textSecondary, background: laneBg, lineHeight: 1, zIndex: 3, padding: '1px 3px', borderRadius: 3 }}>
                  {blocks.length}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend (fixed bottom) — full width, evenly spaced */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 8, flexShrink: 0 }}>
        {EMPLOYER_DEMO_COLORS.map(e => (
          <div key={e.name} className="flex items-center gap-1" style={{ minWidth: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: e.primary, boxShadow: `0 0 4px ${e.primary}88`, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: textSecondary, fontWeight: 600, whiteSpace: 'nowrap' }}>{e.name}</span>
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