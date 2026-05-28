import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX,
  Pause, Play, Users, Star, Hash, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

// Demo transcript lines that stream in one by one
const DEMO_TRANSCRIPT = [
  { speaker: 'Agent', text: 'Thank you for calling BENconnect benefits support, this is Ryan speaking. How can I help you today?' },
  { speaker: 'Member', text: "Hi, I'm calling about a claim that was denied. I received a letter yesterday and I'm not sure why it was rejected." },
  { speaker: 'Agent', text: "I'm sorry to hear that. I'd be happy to look into that for you. Can I get your member ID or date of birth to pull up your account?" },
  { speaker: 'Member', text: "Sure, it's March 15th, 1982 and my member ID is MBR-449201." },
  { speaker: 'Agent', text: "Thank you. I've pulled up your account. I can see the claim from April 28th — it looks like it was denied due to a prior authorization requirement for that procedure." },
  { speaker: 'Member', text: "My doctor said they already submitted the authorization. I don't understand why it was denied." },
  { speaker: 'Agent', text: "I completely understand your frustration. Let me check the authorization records right now... I can see an authorization was submitted, but it came in after the service date, which is unfortunately outside our policy window." },
  { speaker: 'Member', text: "So what are my options? Can I appeal this?" },
  { speaker: 'Agent', text: "Absolutely. You have 180 days from the denial date to file a formal appeal. I can send you the appeal form right now to the email on file, and I'll also note this call in your account." },
  { speaker: 'Member', text: "Yes please, that would be great. I really appreciate your help." },
  { speaker: 'Agent', text: "Of course. I'll get that sent right away. Is there anything else I can help you with today?" },
];

export default function PersistentCallPanel() {
  const { colors, isDark } = useTheme();
  const [activeCall, setActiveCall] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [threeWay, setThreeWay] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const transcriptRef = useRef(null);
  const transcriptTimer = useRef(null);
  const transcriptIdx = useRef(0);

  // Listen for global call events
  useEffect(() => {
    const onStart = (e) => {
      setActiveCall(e.detail || { name: 'Demo Member', phone: '(555) 449-2010' });
      setElapsed(0);
      setMuted(false);
      setHeld(false);
      setTranscript([]);
      setCollapsed(false);
      transcriptIdx.current = 0;
    };
    const onEnd = () => {
      setActiveCall(null);
      setTranscript([]);
      clearInterval(transcriptTimer.current);
    };
    window.addEventListener('active-call-start', onStart);
    window.addEventListener('active-call-end', onEnd);
    return () => {
      window.removeEventListener('active-call-start', onStart);
      window.removeEventListener('active-call-end', onEnd);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (!activeCall) return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [activeCall]);

  // Demo transcript streaming
  useEffect(() => {
    if (!activeCall) return;
    transcriptTimer.current = setInterval(() => {
      if (transcriptIdx.current < DEMO_TRANSCRIPT.length) {
        setTranscript(prev => [...prev, DEMO_TRANSCRIPT[transcriptIdx.current]]);
        transcriptIdx.current += 1;
      } else {
        clearInterval(transcriptTimer.current);
      }
    }, 4500);
    return () => clearInterval(transcriptTimer.current);
  }, [activeCall]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleEnd = () => {
    window.dispatchEvent(new CustomEvent('show-disposition-form', { detail: activeCall || {} }));
    window.dispatchEvent(new CustomEvent('active-call-end'));
  };

  const isVIP = activeCall?.isVip || activeCall?.is_vip;

  const PANEL_BG = isVIP
    ? 'linear-gradient(160deg, #3d2800 0%, #2a1a00 100%)'
    : isDark
      ? 'linear-gradient(160deg, #1e1b2e 0%, #16132a 100%)'
      : 'linear-gradient(160deg, #ffffff 0%, #f5f3ff 100%)';

  const ACCENT = isVIP ? '#f59e0b' : '#7c3aed';
  const TEXT = isVIP ? '#fde68a' : (isDark ? '#f0f0f0' : '#111827');
  const TEXT2 = isVIP ? '#fcd34d' : (isDark ? '#9ca3af' : '#6b7280');
  const BORDER = isVIP ? 'rgba(245,158,11,0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');
  const BTN_BG = isVIP ? 'rgba(245,158,11,0.15)' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)');
  const BTN_ACTIVE_BG = isVIP ? 'rgba(245,158,11,0.35)' : 'rgba(124,58,237,0.3)';

  const CtrlBtn = ({ active, onClick, icon: Icon, label, danger }) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 rounded-2xl transition-all"
      style={{
        height: '60px',
        flex: 1,
        background: danger ? 'rgba(239,68,68,0.85)' : (active ? BTN_ACTIVE_BG : BTN_BG),
        border: `1px solid ${danger ? 'rgba(239,68,68,0.5)' : BORDER}`,
        color: danger ? '#fff' : (active ? ACCENT : TEXT2),
        boxShadow: active && !danger ? `0 0 12px ${ACCENT}40` : 'none',
      }}
    >
      <Icon className="w-4 h-4" />
      <span style={{ fontSize: '10px', fontWeight: 600 }}>{label}</span>
    </button>
  );

  return (
    <AnimatePresence>
      {activeCall && (
        <>
          {/* Collapse tab when collapsed */}
          {collapsed && (
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              onClick={() => setCollapsed(false)}
              className="fixed right-0 z-[110] flex items-center gap-2 px-3 py-2 rounded-l-xl"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff',
                boxShadow: '-4px 0 16px rgba(0,0,0,0.3)',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
          )}

          {/* Main panel */}
          {!collapsed && (
            <motion.div
              key="call-panel"
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 h-full z-[110] flex flex-col"
              style={{
                width: '340px',
                background: PANEL_BG,
                borderLeft: `1px solid ${BORDER}`,
                boxShadow: '-6px 0 40px rgba(0,0,0,0.4)',
              }}
            >
              {/* Header */}
              <div className="flex-shrink-0 p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Status orb */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center relative"
                      style={{
                        background: held
                          ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                          : 'linear-gradient(135deg,#10b981,#059669)',
                        boxShadow: held ? '0 0 14px #f59e0b80' : '0 0 14px #10b98180',
                      }}
                    >
                      {held ? <Pause className="w-4 h-4 text-white" /> : <Phone className="w-4 h-4 text-white" />}
                      {isVIP && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-yellow-400">
                          <Star className="w-2.5 h-2.5 text-yellow-900 fill-yellow-900" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: TEXT }}>{activeCall.name || 'Member'}</p>
                      <p style={{ fontSize: '11px', color: TEXT2 }}>{activeCall.phone || ''}</p>
                    </div>
                  </div>
                  <button onClick={() => setCollapsed(true)} style={{ color: TEXT2 }}>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Timer + badges */}
                <div className="flex items-center gap-2">
                  <div
                    className="font-mono font-bold text-xl"
                    style={{ color: held ? '#f59e0b' : '#10b981' }}
                  >
                    {fmt(elapsed)}
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}
                    >
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                      REC
                    </span>
                    {held && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                        ON HOLD
                      </span>
                    )}
                    {threeWay && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                        <Users className="w-2.5 h-2.5" /> 3-WAY
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex-shrink-0 p-3 flex gap-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <CtrlBtn active={muted} onClick={() => setMuted(m => !m)} icon={muted ? MicOff : Mic} label={muted ? 'Muted' : 'Mute'} />
                <CtrlBtn active={held} onClick={() => setHeld(h => !h)} icon={held ? Play : Pause} label={held ? 'Resume' : 'Hold'} />
                <CtrlBtn active={speakerOn} onClick={() => setSpeakerOn(s => !s)} icon={speakerOn ? Volume2 : VolumeX} label="Speaker" />
                <CtrlBtn active={threeWay} onClick={() => setThreeWay(t => !t)} icon={Users} label="3-Way" />
                <CtrlBtn danger onClick={handleEnd} icon={PhoneOff} label="End" />
              </div>

              {/* Live transcript */}
              <div className="flex-1 flex flex-col min-h-0 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: TEXT2, letterSpacing: '0.5px' }}>LIVE TRANSCRIPT</span>
                </div>
                <div
                  ref={transcriptRef}
                  className="flex-1 overflow-y-auto space-y-3 pr-1"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {transcript.length === 0 && (
                    <p style={{ fontSize: '12px', color: TEXT2, textAlign: 'center', marginTop: '32px' }}>
                      Transcript will appear here as the call progresses...
                    </p>
                  )}
                  {transcript.map((line, i) => {
                    const isAgent = line.speaker === 'Agent';
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                      >
                        <span style={{ fontSize: '9px', fontWeight: 700, color: TEXT2, marginBottom: '2px', letterSpacing: '0.5px' }}>
                          {line.speaker.toUpperCase()}
                        </span>
                        <div
                          className="rounded-xl px-3 py-2 max-w-[90%]"
                          style={{
                            fontSize: '12px',
                            lineHeight: 1.4,
                            background: isAgent
                              ? (isVIP ? 'rgba(245,158,11,0.2)' : 'rgba(124,58,237,0.2)')
                              : BTN_BG,
                            color: TEXT,
                            border: `1px solid ${isAgent ? (isVIP ? 'rgba(245,158,11,0.3)' : 'rgba(124,58,237,0.3)') : BORDER}`,
                          }}
                        >
                          {line.text}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Footer warning */}
              <div
                className="flex-shrink-0 py-2 text-center"
                style={{ fontSize: '10px', fontWeight: 600, color: TEXT2, borderTop: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.1)' }}
              >
                {isVIP ? '⭐ VIP Member — Handle with Priority' : '⚠️  Call in progress — all pages remain accessible'}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}