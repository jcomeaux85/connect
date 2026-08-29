import React, { useMemo, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import CallWaveform from '@/components/dashboard/CallWaveform';
import CallRecordingModal from '@/components/dashboard/CallRecordingModal';
import { useUser } from '@/components/hooks/useUser';
import { useSimulatedClock, CLOCK_START_MIN, CLOCK_SPAN } from '@/hooks/useSimulatedClock';
import { AGENTS, AGENT_CONFIG, DEMO_CALLS } from '@/data/callCenterDemo';

// DEMO AUDIO — drop one recording URL per agent here.
const DEMO_AUDIO_BY_AGENT = {
  Ryan: null,
  Vanessa: null,
  Chris: null,
  Jarrad: null,
};

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

const EMPLOYER_BY_NAME = Object.fromEntries(EMPLOYER_DEMO_COLORS.map(e => [e.name, e]));

function seededRand(seed) {
  const x = Math.sin(seed * 99991.137) * 43758.5453;
  return x - Math.floor(x);
}

function buildWaveform(seed, barCount) {
  const bars = [];
  for (let i = 0; i < barCount; i++) {
    const r = seededRand(seed + i * 7.13);
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

function durToPercent(seconds) {
  return Math.max((seconds / 60) / TOTAL_MINS * 100, 1.5);
}

// Convert "HH:MM" → minutes since midnight
function timeToMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Check if a call time (minutes) falls inside any of the agent's break/lunch windows
function isInBreak(callMins, breaks) {
  return breaks.some(b => {
    const s = timeToMins(b.start);
    const e = timeToMins(b.end);
    return callMins >= s && callMins < e;
  });
}

// Break/lunch block position + width as percentages
function breakPct(b) {
  const s = timeToMins(b.start);
  const e = timeToMins(b.end);
  return {
    left: ((s - CLOCK_START_MIN) / CLOCK_SPAN) * 100,
    width: ((e - s) / CLOCK_SPAN) * 100,
  };
}

const LABEL_W = 64;
const GAP = 3;

export default function AgentCallTimeline({ calls: incomingCalls = [] }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const isAdmin = user?.role === 'admin';
  const [tooltip, setTooltip] = useState(null);
  const [recordingModal, setRecordingModal] = useState(null);

  // Shared simulated clock — progressive call population
  const { nowMins } = useSimulatedClock();
  const nowPct = ((nowMins - CLOCK_START_MIN) / CLOCK_SPAN) * 100;

  const handleCallClick = (c, agent) => {
    if (isAdmin) {
      setRecordingModal({
        agent,
        direction: c.direction,
        time: `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`,
        employer: c.employer.name,
        color: c.employer.primary,
        secondary: c.employer.secondary,
        audioUrl: DEMO_AUDIO_BY_AGENT[agent] || null,
      });
      return;
    }
    if (c.caseId) navigate(`/Case?id=${c.caseId}`);
  };

  const today = new Date().toISOString().split('T')[0];
  const realCalls = Array.isArray(incomingCalls) ? incomingCalls : [];

  const { data: employers = [] } = useQuery({
    queryKey: ['employers-for-timeline'],
    queryFn: () => base44.entities.Employer.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-timeline'],
    queryFn: () => base44.entities.User.list(),
    staleTime: 5 * 60 * 1000,
  });

  const userById = useMemo(() => {
    const map = {};
    users.forEach(u => { map[u.id] = (u.full_name || u.email || '').toLowerCase(); });
    return map;
  }, [users]);

  const employerColorMap = useMemo(() => {
    const map = {};
    employers.forEach(e => {
      map[e.id] = { name: e.employer_name, primary: e.dot_color_primary || '#94a3b8', secondary: e.dot_color_secondary || '#cbd5e1' };
    });
    return map;
  }, [employers]);

  // Build per-agent call blocks — progressive (only calls whose time has
  // arrived on the simulated clock) and filtered by break/lunch windows
  // (demo path only — agents don't take calls during breaks/lunch).
  const agentBlocks = useMemo(() => {
    const todayCalls = realCalls.filter(c => c.call_start_time?.startsWith(today));

    const matchAgent = (c) => {
      const creator = (c.created_by_id && userById[c.created_by_id]) || (c.created_by || '').toLowerCase();
      if (!creator) return null;
      return AGENTS.find(a => creator.includes(a.toLowerCase())) || null;
    };

    const realByAgent = {};
    let totalRealMatched = 0;
    todayCalls.forEach(c => {
      const a = matchAgent(c);
      if (!a) return;
      totalRealMatched++;
      (realByAgent[a] = realByAgent[a] || []).push(c);
    });

    const useDemo = totalRealMatched === 0;
    const agentBreaks = (agent) => AGENT_CONFIG[agent]?.breaks || [];

    const result = {};
    AGENTS.forEach((agent, agentIdx) => {
      let counter = 0;

      const rawList = useDemo
        ? DEMO_CALLS[agent].map(c => {
            const [h, m] = c.time.split(':').map(Number);
            return { hour: h, minute: m, direction: c.direction, duration: c.duration, callId: null, caseId: null, employer: EMPLOYER_BY_NAME[c.employer] || null };
          })
        : (realByAgent[agent] || []).map(c => {
            const d = new Date(c.call_start_time);
            return { hour: d.getHours(), minute: d.getMinutes(), direction: c.direction, duration: c.duration || 180, callId: c.id, caseId: c.case_id, employer: c.employer_id ? employerColorMap[c.employer_id] : null };
          });

      // Progressive filter: only show calls whose time has arrived on the clock.
      // Demo path: also skip calls that fall during a break/lunch window.
      const visible = rawList.filter(c => {
        const callMins = c.hour * 60 + c.minute;
        if (callMins > nowMins) return false;           // hasn't arrived yet
        if (useDemo && isInBreak(callMins, agentBreaks(agent))) return false;
        return true;
      });

      result[agent] = visible.map((c, i) => {
        const employer = c.employer || EMPLOYER_DEMO_COLORS[(counter++ + agentIdx) % EMPLOYER_DEMO_COLORS.length];
        const seed = (agentIdx + 1) * 131 + i * 17 + c.hour * 3 + c.minute;
        return { ...c, employer, seed };
      });
    });
    return result;
  }, [realCalls, today, employerColorMap, userById, nowMins]);

  const totalCalls = Object.values(agentBlocks).reduce((s, a) => s + a.length, 0);

  const textPrimary   = isDark ? '#f0f0f0' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const laneBg        = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const laneBorder    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <div style={{ width: '100%', height: 280, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header: count + IN/OUT labels + simulated time */}
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: LABEL_W, marginBottom: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: textSecondary, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>▲ IN</span>
        <span style={{ fontSize: 9, color: textSecondary, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 8 }}>▼ OUT</span>
        <span style={{ fontSize: 10, color: textSecondary, marginLeft: 'auto', fontWeight: 600 }}>
          {totalCalls} calls · {String(Math.floor(nowMins / 60) % 12 || 12).padStart(2,'0')}:{String(Math.floor(nowMins % 60)).padStart(2,'0')} {nowMins >= 720 ? 'PM' : 'AM'}
        </span>
      </div>

      {/* Agent rows */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, position: 'relative' }}>
        {/* Single now-line — one thin white line spanning all lanes */}
        {nowPct > 0 && nowPct < 100 && (
          <div style={{ position: 'absolute', left: LABEL_W, right: 0, top: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
            <div style={{
              position: 'absolute',
              left: `${nowPct}%`,
              top: 0, bottom: 0,
              width: 1,
              background: '#ffffff',
              transform: 'translateX(-50%)',
            }} />
          </div>
        )}
        {AGENTS.map(agent => {
          const blocks = agentBlocks[agent] || [];
          const inbound  = blocks.filter(c => c.direction === 'inbound');
          const outbound = blocks.filter(c => c.direction === 'outbound');
          const cfg = AGENT_CONFIG[agent];
          const agentColor = cfg?.color || '#94a3b8';
          const breaks = cfg?.breaks || [];

          return (
            <div key={agent} style={{ display: 'flex', alignItems: 'center', flex: 1, minHeight: 0 }}>
              {/* Label — colored dot + name */}
              <div style={{ width: LABEL_W, flexShrink: 0, paddingRight: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: agentColor, boxShadow: `0 0 5px ${agentColor}aa`, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: textPrimary, textAlign: 'right', whiteSpace: 'nowrap' }}>{agent}</span>
              </div>

              {/* Lane */}
              <div
                onMouseLeave={() => setTooltip(null)}
                style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', background: laneBg, borderRadius: 8, border: `1px solid ${laneBorder}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: GAP, padding: '4px 0' }}>

                {/* Break / lunch blocks — agent color, full lane height, behind calls */}
                {breaks.map((b, i) => {
                  const { left, width } = breakPct(b);
                  if (width <= 0) return null;
                  const isLunch = b.type === 'lunch';
                  return (
                    <div key={`brk-${i}`} style={{
                      position: 'absolute',
                      left: `${left}%`,
                      width: `${width}%`,
                      top: 0, bottom: 0,
                      background: isLunch ? `${agentColor}22` : `${agentColor}14`,
                      borderLeft: `1.5px dashed ${agentColor}55`,
                      borderRight: `1.5px dashed ${agentColor}55`,
                      zIndex: 0,
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isLunch && width > 4 && (
                        <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.1em', color: `${agentColor}cc`, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                          LUNCH
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Center divider — agent's queue color */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1.5, background: `${agentColor}66`, pointerEvents: 'none', zIndex: 1 }} />

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
                        onClick={() => handleCallClick(c, agent)}
                        style={{
                          position: 'absolute',
                          left: `${left}%`,
                          width: `${width}%`,
                          height: '100%',
                          bottom: 0,
                          cursor: isAdmin || c.caseId ? 'pointer' : 'default',
                          opacity: 0.92,
                          transition: 'opacity 0.1s',
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = '1'}
                        onMouseOut={e => e.currentTarget.style.opacity = '0.92'}
                      >
                        <CallWaveform bars={bars} color={col} secondary={sec} direction="inbound" />
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
                        onClick={() => handleCallClick(c, agent)}
                        style={{
                          position: 'absolute',
                          left: `${left}%`,
                          width: `${width}%`,
                          height: '100%',
                          top: 0,
                          cursor: isAdmin || c.caseId ? 'pointer' : 'default',
                          opacity: 0.85,
                          transition: 'opacity 0.1s',
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = '1'}
                        onMouseOut={e => e.currentTarget.style.opacity = '0.85'}
                      >
                        <CallWaveform bars={bars} color={col} secondary={sec} direction="outbound" />
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

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 8, flexShrink: 0 }}>
        {EMPLOYER_DEMO_COLORS.map(e => (
          <div key={e.name} className="flex items-center gap-1" style={{ minWidth: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: e.primary, boxShadow: `0 0 4px ${e.primary}88`, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: textSecondary, fontWeight: 600, whiteSpace: 'nowrap' }}>{e.name}</span>
          </div>
        ))}
      </div>

      <CallRecordingModal
        isOpen={!!recordingModal}
        onClose={() => setRecordingModal(null)}
        call={recordingModal}
      />

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