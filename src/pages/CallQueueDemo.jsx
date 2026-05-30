import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────────
const STATES = { IDLE: 'IDLE', NEXT: 'NEXT', RINGING: 'RINGING', CONNECTED: 'CONNECTED', ENDED: 'ENDED' };

const BANNER_HEIGHT = { IDLE: 0, NEXT: 36, RINGING: 36, CONNECTED: 72, ENDED: 36 };

const CALLER = { name: 'Sarah Martinez', company: 'PAM Health', case: 'Case #4471' };

// ── Styles ────────────────────────────────────────────────────────────────────
const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const globalStyles = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes pulse-edge {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }
  @keyframes flash-red {
    0% { background: #EF4444; }
    60% { background: #EF4444; }
    100% { background: rgba(255,255,255,0.25); }
  }
  @keyframes circuit-drift {
    0% { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: -60; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${font}; background: #F4F4F7; }
  button:focus { outline: none; }
`;

// ── Sub-components ─────────────────────────────────────────────────────────────

function BannerEdge({ state, endedFlash }) {
  const base = {
    width: 4,
    flexShrink: 0,
    transition: 'background 0.3s ease-out',
    borderRadius: '0 2px 2px 0',
  };
  if (state === STATES.NEXT) return <div style={{ ...base, background: '#10B981' }} />;
  if (state === STATES.RINGING) return (
    <div style={{ ...base, background: '#F59E0B', animation: 'pulse-edge 1.5s ease-in-out infinite' }} />
  );
  if (state === STATES.CONNECTED) return <div style={{ ...base, background: 'rgba(255,255,255,0.5)' }} />;
  if (state === STATES.ENDED) return (
    <div style={{ ...base, background: 'rgba(255,255,255,0.25)', animation: endedFlash ? 'flash-red 1s ease-out forwards' : 'none' }} />
  );
  return <div style={{ ...base, background: 'transparent' }} />;
}

function NextContent() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, overflow: 'hidden', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%', background: '#10B981', flexShrink: 0,
          animation: 'pulse-dot 1.5s ease-in-out infinite'
        }} />
        <span style={{ fontSize: 14, color: '#fff', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          You're next in queue
        </span>
      </div>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        Position 1 of 3 waiting
      </span>
    </div>
  );
}

function RingingContent({ onAnswer, onDecline }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, overflow: 'hidden', gap: 16 }}>
      <span style={{ fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
        <span style={{ color: '#F59E0B', fontWeight: 600 }}>Incoming:</span>
        {' '}Sarah Martinez, PAM Health — returning call on Case #4471
      </span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onAnswer}
          style={{
            padding: '4px 14px', borderRadius: 20, border: 'none',
            background: '#10B981', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: font,
          }}
          onMouseEnter={e => e.target.style.background = '#0fa872'}
          onMouseLeave={e => e.target.style.background = '#10B981'}
        >
          Answer
        </button>
        <button
          onClick={onDecline}
          style={{
            padding: '4px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.6)',
            background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: font,
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.target.style.background = 'transparent'}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function ConnectedContent({ timer }) {
  const iconBtn = (label) => (
    <button
      key={label}
      title={label}
      style={{
        width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)',
        background: 'transparent', color: 'rgba(255,255,255,0.75)', fontSize: 11,
        cursor: 'pointer', fontFamily: font, fontWeight: 600, letterSpacing: 0.3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {label.slice(0, 2)}
    </button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden', gap: 20 }}>
      {/* Caller info */}
      <div style={{ overflow: 'hidden', minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {CALLER.name}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
          {CALLER.company} · {CALLER.case}
        </div>
      </div>

      {/* Timer */}
      <div style={{
        flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 600, color: '#fff',
        fontVariantNumeric: 'tabular-nums', letterSpacing: 1, flexShrink: 0,
      }}>
        {timer}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {['Hold', 'Transfer', 'Conf', 'Notes'].map(iconBtn)}
      </div>
    </div>
  );
}

function EndedContent({ duration, wrapUp }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, overflow: 'hidden', gap: 16 }}>
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Call ended · {duration} duration
      </span>
      <span style={{ fontSize: 12, color: '#EF4444', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 600 }}>
        Wrap-up: {wrapUp}s
      </span>
    </div>
  );
}

// ── Queue Cards ────────────────────────────────────────────────────────────────
function QueueCards({ state }) {
  const visible = state === STATES.NEXT || state === STATES.RINGING || state === STATES.CONNECTED;
  const callers = [
    { name: 'Sarah Martinez', company: 'PAM Health', case: '#4471', wait: '1:12', status: state === STATES.RINGING ? 'Ringing' : state === STATES.CONNECTED ? 'Connected' : 'Next' },
    { name: 'Michael Torres', company: 'Apex Benefits', case: '#3892', wait: '2:44', status: 'Waiting' },
    { name: 'Linda Fong', company: 'CareFirst', case: '#5103', wait: '3:58', status: 'Waiting' },
  ];

  if (!visible) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#aaa', fontSize: 13 }}>
      Queue is empty
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {callers.map((c, i) => {
        const statusColor = c.status === 'Ringing' ? '#F59E0B' : c.status === 'Connected' ? '#10B981' : c.status === 'Next' ? '#10B981' : '#94a3b8';
        return (
          <div key={i} style={{
            background: '#fff', borderRadius: 8, padding: '10px 14px',
            boxShadow: '2px 2px 6px rgba(0,0,0,0.07), -1px -1px 4px rgba(255,255,255,0.8)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.company} · Case {c.case}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>{c.status}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.wait} wait</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Metric Card ────────────────────────────────────────────────────────────────
function MetricCard({ icon, delta, value, label, sub, positive }) {
  return (
    <div style={{
      flex: 1, background: '#fff', borderRadius: 8, padding: 24,
      boxShadow: '4px 4px 10px rgba(0,0,0,0.07), -2px -2px 6px rgba(255,255,255,0.9)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: '#c4b5fd' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: positive ? '#10B981' : '#EF4444' }}>{delta}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#1e1b4b', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ── Circuit Hero ───────────────────────────────────────────────────────────────
function CircuitHero() {
  return (
    <div style={{
      width: '100%', height: 280, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #2D1B5E 45%, #1a1040 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* SVG circuit lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} xmlns="http://www.w3.org/2000/svg">
        {[0,1,2,3,4,5].map(i => (
          <line key={`h${i}`} x1="0" y1={40 + i * 44} x2="100%" y2={40 + i * 44}
            stroke="#818cf8" strokeWidth="0.5" strokeDasharray="12 8" />
        ))}
        {[0,1,2,3,4,5,6,7,8].map(i => (
          <line key={`v${i}`} x1={60 + i * 90} y1="0" x2={60 + i * 90} y2="100%"
            stroke="#818cf8" strokeWidth="0.5" strokeDasharray="8 14" />
        ))}
        {[[120,80],[320,170],[520,100],[680,200],[820,130]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#a78bfa" />
        ))}
      </svg>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>
          BEN|connect Platform
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>
          eBenefit Marketplace
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
          Integrated benefits administration · Real-time call management
        </div>
      </div>
    </div>
  );
}

// ── Case / Content Cards ───────────────────────────────────────────────────────
const CONTENT_BLOCKS = [
  { title: 'Case #4471 — Prescription Coverage Dispute', height: 160, body: 'Member reports that their Tier 2 medication was rejected at point of sale. Pharmacy benefit manager indicates formulary exclusion. Member states medication is medically necessary per attending physician. Review of prior authorization history shows approval lapsed Feb 2026. Agent initiated PA renewal with clinical team on hold.' },
  { title: 'Case #3892 — EOB Reconciliation Request', height: 140, body: 'Member received an explanation of benefits showing balance bill from out-of-network provider. Member states they were not informed of OON status at time of service. Request for provider network verification at time of service submitted to claims team. Follow-up scheduled for 72-hour resolution window.' },
  { title: 'Case #5103 — New Hire Enrollment Window', height: 120, body: 'New employee onboarding — 30-day enrollment window opens May 29. Medical, dental, and vision elections pending. HSA contribution setup required. Dependent verification documents collected. Benefits guide emailed to member personal address on file.' },
  { title: 'Case #4987 — Short-Term Disability Claim', height: 150, body: 'Member submitted STD claim following surgical procedure April 14. Physician certification received. Waiting period satisfied. Claim approved for 60% of base salary through return-to-work date. Member inquiring about FMLA coordination and EAP resources. Referred to HR partner.' },
  { title: 'Case #4102 — COBRA Election Inquiry', height: 130, body: 'Termed employee requesting COBRA election information. 60-day election window from qualifying event date March 22. Premium quotes provided for medical and dental continuation. Member opted to waive dental. COBRA administrator notified. Election confirmation letter to be sent within 14 days.' },
  { title: 'Member Notes — Patricia Okonkwo', height: 120, body: 'Chronic condition management participant. Enrolled in disease management program for Type 2 Diabetes. Care coordinator assigned. Preventive care visit completed Q1. Annual deductible $1,400 — fully met as of April 3. Out-of-pocket max $4,200 — $2,847 accumulated to date.' },
  { title: 'Case #5210 — Provider Directory Complaint', height: 140, body: 'Member states primary care physician listed in network directory is no longer accepting new patients under plan. Directory accuracy complaint filed. Medical group relations team notified. Interim care options provided. Escalation flag set for director review within 5 business days.' },
  { title: 'Case #4654 — Vision Benefit Clarification', height: 110, body: 'Member requesting clarification on out-of-network vision benefit reimbursement schedule. Verified frame allowance $150, lens allowance $120, contact lens allowance $150 per benefit year. Member elected contact lens option. Reimbursement form mailed to address on file.' },
];

function ContentBlock({ title, body, height }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 8, padding: 24, minHeight: height,
      boxShadow: '4px 4px 10px rgba(0,0,0,0.06), -2px -2px 6px rgba(255,255,255,0.85)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>{body}</div>
    </div>
  );
}

// ── Shortcut Panel ─────────────────────────────────────────────────────────────
function ShortcutPanel({ state, visible, onToggle }) {
  if (!visible) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9998,
          width: 24, height: 24, borderRadius: '50%',
          background: 'rgba(20,10,50,0.75)', border: 'none', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      />
    );
  }
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9998,
      width: 280, background: 'rgba(20,10,50,0.92)', borderRadius: 8,
      padding: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      fontFamily: font, fontSize: 12, color: '#fff', lineHeight: 1.9,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#a78bfa', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
        State: {state}
      </div>
      {[
        ['Ctrl+1', 'Next in queue'],
        ['Ctrl+2', 'Incoming ring'],
        ['Ctrl+3', 'Answer call'],
        ['Ctrl+4', 'End call'],
        ['Ctrl+0', 'Reset to idle'],
        ['Ctrl+H', 'Hide this panel'],
      ].map(([key, desc]) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: '#a78bfa', fontWeight: 600, flexShrink: 0 }}>{key}</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{desc}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CallQueueDemo() {
  const [state, setState] = useState(STATES.IDLE);
  const [timer, setTimer] = useState('0:00');
  const [frozenDuration, setFrozenDuration] = useState('0:00');
  const [wrapUp, setWrapUp] = useState(30);
  const [showPanel, setShowPanel] = useState(true);
  const [endedFlash, setEndedFlash] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  const connectedStartRef = useRef(null);
  const timerRef = useRef(null);
  const wrapUpRef = useRef(null);
  const endedTimeoutRef = useRef(null);

  const bannerH = BANNER_HEIGHT[state];

  // Format seconds to M:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    connectedStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - connectedStartRef.current) / 1000);
      setTimer(formatTime(elapsed));
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    const elapsed = Math.floor((Date.now() - connectedStartRef.current) / 1000);
    return formatTime(elapsed);
  };

  const goTo = useCallback((newState) => {
    // Cleanup
    clearInterval(timerRef.current);
    clearInterval(wrapUpRef.current);
    clearTimeout(endedTimeoutRef.current);
    setEndedFlash(false);

    if (newState === STATES.CONNECTED) {
      setTimer('0:00');
      startTimer();
    }

    if (newState === STATES.ENDED) {
      const dur = stopTimer();
      setFrozenDuration(dur);
      setEndedFlash(true);
      setWrapUp(30);
      let w = 30;
      wrapUpRef.current = setInterval(() => {
        w -= 1;
        setWrapUp(w);
        if (w <= 0) {
          clearInterval(wrapUpRef.current);
        }
      }, 1000);
      endedTimeoutRef.current = setTimeout(() => {
        goTo(STATES.IDLE);
      }, 4000);
    }

    // Fade content swap
    setContentVisible(false);
    setTimeout(() => {
      setState(newState);
      setContentVisible(true);
    }, 80);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!e.ctrlKey) return;
      switch (e.key) {
        case '1': e.preventDefault(); goTo(STATES.NEXT); break;
        case '2': e.preventDefault(); goTo(STATES.RINGING); break;
        case '3': e.preventDefault(); if (state === STATES.RINGING) goTo(STATES.CONNECTED); break;
        case '4': e.preventDefault(); if (state === STATES.CONNECTED) goTo(STATES.ENDED); break;
        case '0': e.preventDefault(); goTo(STATES.IDLE); break;
        case 'h': case 'H': e.preventDefault(); setShowPanel(p => !p); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state, goTo]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(wrapUpRef.current);
    clearTimeout(endedTimeoutRef.current);
  }, []);

  return (
    <>
      <style>{globalStyles}</style>

      {/* ── Banner ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        height: bannerH,
        overflow: 'hidden',
        transition: 'height 0.2s ease-out',
        background: '#2D1B5E',
        display: 'flex',
        alignItems: 'center',
      }}>
        <BannerEdge state={state} endedFlash={endedFlash} />
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          padding: state === STATES.CONNECTED ? '10px 20px' : '0 20px',
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.1s ease-out',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {state === STATES.NEXT && <NextContent />}
          {state === STATES.RINGING && (
            <RingingContent
              onAnswer={() => goTo(STATES.CONNECTED)}
              onDecline={() => goTo(STATES.IDLE)}
            />
          )}
          {state === STATES.CONNECTED && <ConnectedContent timer={timer} />}
          {state === STATES.ENDED && <EndedContent duration={frozenDuration} wrapUp={wrapUp} />}
        </div>
      </div>

      {/* ── Page Content ── */}
      <div style={{
        paddingTop: bannerH,
        transition: 'padding-top 0.2s ease-out',
        fontFamily: font,
        minHeight: '100vh',
        background: '#F4F4F7',
      }}>

        {/* Chrome Bar */}
        <div style={{
          background: '#2D1B5E',
          height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>
            BEN<span style={{ color: '#a78bfa' }}>|</span>connect
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(16,185,129,0.18)', border: '1px solid #10B981',
              borderRadius: 20, padding: '3px 10px',
              fontSize: 11, color: '#10B981', fontWeight: 600, letterSpacing: 0.5,
            }}>
              Available
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
            }}>
              DJ
            </div>
          </div>
        </div>

        {/* Hero */}
        <CircuitHero />

        {/* Metric cards */}
        <div style={{ padding: '24px 24px 0', display: 'flex', gap: 16 }}>
          <MetricCard delta="+0%" value="0" label="Active Calls" sub="0 on hold" positive={true} />
          <MetricCard delta="+2" value="0" label="In Queue" sub="Avg wait 1:34" positive={false} />
          <MetricCard delta="+12%" value="127" label="Resolved Today" sub="94% satisfaction" positive={true} />
          <MetricCard delta="-8%" value="4:32" label="Avg Handle Time" sub="Target: 5:00" positive={true} />
        </div>

        {/* Two-panel row */}
        <div style={{ display: 'flex', gap: 16, padding: '16px 24px 0' }}>
          {/* Left: Call Volume */}
          <div style={{
            flex: 2, background: '#fff', borderRadius: 8, padding: 24,
            boxShadow: '4px 4px 10px rgba(0,0,0,0.06), -2px -2px 6px rgba(255,255,255,0.85)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginBottom: 16 }}>Call Volume — Today</div>
            <DotPlot />
          </div>

          {/* Right: Queue */}
          <div style={{
            flex: 1, background: '#fff', borderRadius: 8, padding: 24,
            boxShadow: '4px 4px 10px rgba(0,0,0,0.06), -2px -2px 6px rgba(255,255,255,0.85)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginBottom: 12 }}>Call Queue</div>
            <QueueCards state={state} />
          </div>
        </div>

        {/* Content blocks */}
        <div style={{ padding: '16px 24px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {CONTENT_BLOCKS.map((b, i) => (
            <ContentBlock key={i} {...b} />
          ))}
        </div>
      </div>

      {/* Shortcut panel */}
      <ShortcutPanel state={state} visible={showPanel} onToggle={() => setShowPanel(p => !p)} />
    </>
  );
}

// ── Dot Plot ──────────────────────────────────────────────────────────────────
const REPS = ['Jarrad', 'Vanessa', 'Ryan', 'Chris'];
const DOTS = [
  // [rep_index, hour_offset (0–10 = 8AM–6PM), inbound]
  [0,0.5,true],[0,1.2,false],[0,2.8,true],[0,3.5,true],[0,5.1,false],[0,6.4,true],[0,7.8,false],[0,8.3,true],
  [1,0.3,false],[1,1.8,true],[1,2.1,true],[1,4.0,false],[1,5.5,true],[1,6.9,false],[1,8.8,true],[1,9.2,false],
  [2,0.8,true],[2,2.3,false],[2,3.1,true],[2,4.7,true],[2,5.8,false],[2,7.2,true],[2,8.5,false],[2,9.5,true],
  [3,0.2,false],[3,1.5,true],[3,2.9,false],[3,3.8,true],[3,5.0,false],[3,6.6,true],[3,7.4,false],[3,9.1,true],
];
const HOURS = ['8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM'];

function DotPlot() {
  const rowH = 36;
  const labelW = 64;
  const totalH = REPS.length * rowH;

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Hour labels */}
      <div style={{ display: 'flex', marginLeft: labelW, marginBottom: 6 }}>
        {HOURS.map(h => (
          <div key={h} style={{ flex: 1, fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>{h}</div>
        ))}
      </div>
      {/* Grid + dots */}
      <div style={{ position: 'relative', height: totalH }}>
        {REPS.map((rep, ri) => (
          <div key={rep} style={{
            position: 'absolute', top: ri * rowH, left: 0, right: 0, height: rowH,
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{ width: labelW, fontSize: 11, fontWeight: 600, color: '#475569', flexShrink: 0 }}>{rep}</div>
            <div style={{ flex: 1, height: '100%', position: 'relative', borderBottom: '1px solid #f1f5f9' }}>
              {DOTS.filter(d => d[0] === ri).map(([,h,inbound], di) => (
                <div key={di} style={{
                  position: 'absolute',
                  left: `${(h / 10) * 100}%`,
                  top: '50%', transform: 'translateY(-50%)',
                  width: 7, height: 7, borderRadius: '50%',
                  background: inbound ? '#3b82f6' : '#f97316',
                  opacity: 0.8,
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, marginLeft: labelW }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6' }} />
          <span style={{ fontSize: 10, color: '#64748b' }}>Inbound</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f97316' }} />
          <span style={{ fontSize: 10, color: '#64748b' }}>Outbound</span>
        </div>
      </div>
    </div>
  );
}