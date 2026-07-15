import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, StickyNote, PhoneIncoming, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

// Global active-call control — dispatch these from anywhere (dialer, answer button)
export const callBarEvents = {
  start: (callData) => window.dispatchEvent(new CustomEvent('active-call-start', { detail: callData })),
  end: () => window.dispatchEvent(new CustomEvent('active-call-end')),
};

// ── synthesized ring (no audio asset to ship). Dual-tone, gentle, looping. ──
function useRingtone() {
  const ctxRef = useRef(null);
  const loopRef = useRef(null);

  const ensure = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const blip = useCallback((vip) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    [480, 620].forEach((f) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(g); g.connect(ctx.destination);
      const peak = vip ? 0.11 : 0.07;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(peak, now + 0.02);
      g.gain.setValueAtTime(peak, now + 0.9);
      g.gain.linearRampToValueAtTime(0, now + 1.0);
      o.start(now); o.stop(now + 1.05);
    });
  }, []);

  const start = useCallback((vip) => {
    if (loopRef.current) return;
    ensure();
    blip(vip);
    loopRef.current = setInterval(() => blip(vip), 2600);
  }, [ensure, blip]);

  const stop = useCallback(() => {
    if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; }
  }, []);

  // resume audio on first user gesture so autoplay policy doesn't mute the ring
  useEffect(() => {
    const kick = () => ensure();
    window.addEventListener('pointerdown', kick, { once: true });
    return () => window.removeEventListener('pointerdown', kick);
  }, [ensure]);

  return { start, stop, ensure };
}

/**
 * ActiveCallBar — the push-down call banner.
 * Lives as a flex child at the TOP of the app column, so its height reflows
 * (pushes down) the entire site rather than overlaying it — same principle as
 * the DOC right-side compression, on the vertical axis.
 *
 * Lifecycle:
 *   RINGING (from `incomingCall` prop) → amber flashing edge + ringtone + caller ID + Answer/Decline
 *   CONNECTED (from active-call-start event) → timer, mute, Notes drawer, End
 *   ended → retracts; notes handed to the disposition form's call_notes
 *
 * @param incomingCall  a ringing IncomingCall entity (or null) — drives RINGING
 * @param customer      matched Customer record (optional, for VIP / name)
 * @param onAnswer      async () => update entity to answered
 * @param onDecline     async () => update entity to declined
 */
export default function ActiveCallBar({ incomingCall = null, customer = null, onAnswer, onDecline }) {
  const { colors, isDark } = useTheme();
  const ring = useRingtone();

  const [activeCall, setActiveCall] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const notesRef = useRef('');
  notesRef.current = notes;

  const isRinging = !!incomingCall && !activeCall;
  const isActive = !!activeCall;
  const isVip = !!(customer?.is_vip || activeCall?.is_vip || activeCall?.isVip);

  // connected-call timer
  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isActive]);

  // active-call start/end wiring
  useEffect(() => {
    const onStart = (e) => { setActiveCall(e.detail || {}); setElapsed(0); setMuted(false); setNotes(''); setNotesOpen(false); };
    const onEnd = () => { setActiveCall(null); setElapsed(0); };
    window.addEventListener('active-call-start', onStart);
    window.addEventListener('active-call-end', onEnd);
    return () => {
      window.removeEventListener('active-call-start', onStart);
      window.removeEventListener('active-call-end', onEnd);
    };
  }, []);

  // ringtone follows the ringing state
  useEffect(() => {
    if (isRinging) ring.start(isVip); else ring.stop();
    return () => ring.stop();
  }, [isRinging, isVip, ring]);

  // guard against losing a call on hard reload / close / external nav
  useEffect(() => {
    if (!isRinging && !isActive) return;
    const guard = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [isRinging, isActive]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const callerName = incomingCall?.caller_name || customer?.name || incomingCall?.phone_number || 'Unknown caller';
  const callerSub = [
    incomingCall?.phone_number,
    [incomingCall?.caller_city, incomingCall?.caller_state].filter(Boolean).join(', '),
  ].filter(Boolean).join('  ·  ');

  const handleAnswer = async () => {
    ring.stop();
    try { await onAnswer?.(); } catch (err) { console.error(err); }
    // hand the caller context to the connected state (and the right-side panel)
    callBarEvents.start({
      name: callerName,
      phone: incomingCall?.phone_number,
      is_vip: isVip,
      customer_id: incomingCall?.customer_id,
      case_id: incomingCall?.case_id,
    });
  };

  const handleDecline = async () => {
    ring.stop();
    try { await onDecline?.(); } catch (err) { console.error(err); }
  };

  const handleEnd = () => {
    window.dispatchEvent(new CustomEvent('show-disposition-form', {
      detail: { ...(activeCall || {}), call_notes: notesRef.current, completion_time_seconds: elapsed },
    }));
    callBarEvents.end();
  };

  const show = isRinging || isActive;
  const baseRowH = 60;
  const notesH = isActive && notesOpen ? 168 : 0;
  const barH = show ? baseRowH + notesH : 0;

  // palette
  const RING_BG = isDark ? 'linear-gradient(90deg,#2D1B5E,#3B2570)' : 'linear-gradient(90deg,#2D1B5E,#4326a0)';
  const LIVE_BG = 'linear-gradient(90deg,#059669 0%,#10B981 100%)';
  const bg = isRinging ? RING_BG : LIVE_BG;
  const edge = isVip ? '#D4A853' : '#F59E0B';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: barH, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          style={{ background: bg, overflow: 'hidden', flexShrink: 0, zIndex: 45, position: 'relative' }}
        >
          {/* ringing: flashing bottom edge */}
          {isRinging && (
            <motion.div
              aria-hidden
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: edge }}
              animate={{ opacity: [0.25, 1, 0.25], boxShadow: [`0 0 0px ${edge}00`, `0 0 14px ${edge}`, `0 0 0px ${edge}00`] }}
              transition={{ duration: isVip ? 0.9 : 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* ── main row ── */}
          <div className="flex items-center gap-3 px-4" style={{ height: baseRowH }}>
            {isRinging ? (
              <>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(255,255,255,0.14)' }}>
                  <PhoneIncoming className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold text-sm truncate flex items-center gap-2">
                    {isVip && (
                      <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                            style={{ color: '#D4A853', border: '1px solid rgba(212,168,83,0.5)' }}>VIP</span>
                    )}
                    Incoming — {callerName}
                  </p>
                  {callerSub && <p className="text-white/60 text-xs truncate">{callerSub}</p>}
                </div>
                <button onClick={handleAnswer}
                        className="px-4 h-9 rounded-full text-xs font-semibold text-white flex items-center gap-1.5"
                        style={{ background: isVip ? '#D4A853' : '#10B981', color: isVip ? '#2a2110' : '#fff' }}>
                  <Phone className="w-3.5 h-3.5" /> Answer
                </button>
                <button onClick={handleDecline}
                        className="px-4 h-9 rounded-full text-xs font-semibold text-white"
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.35)' }}>
                  Decline
                </button>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-white flex-shrink-0 animate-pulse" />
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold text-sm truncate">{activeCall?.name || 'Active call'}</p>
                  {activeCall?.phone && <p className="text-white/70 text-xs truncate">{activeCall.phone}</p>}
                </div>
                <span className="text-white font-mono text-sm tabular-nums bg-white/10 px-2.5 py-1 rounded-full">{fmt(elapsed)}</span>
                <button onClick={() => setMuted((m) => !m)}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: muted ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.18)' }}
                        title={muted ? 'Unmute' : 'Mute'}>
                  {muted ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                </button>
                <button onClick={() => setNotesOpen((n) => !n)}
                        className="px-3 h-9 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all"
                        style={{ background: notesOpen ? '#fff' : 'rgba(255,255,255,0.14)', color: notesOpen ? '#059669' : '#fff' }}
                        title="Call notes">
                  <StickyNote className="w-3.5 h-3.5" /> Notes
                </button>
                <button onClick={handleEnd}
                        className="px-3 h-9 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 hover:brightness-110"
                        style={{ background: 'rgba(0,0,0,0.28)' }}>
                  <PhoneOff className="w-3.5 h-3.5" /> End
                </button>
              </>
            )}
          </div>

          {/* ── notes drawer (pushes the site down further) ── */}
          {isActive && notesOpen && (
            <div className="px-4 pb-3" style={{ height: notesH }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold tracking-widest uppercase text-white/55">
                  Call notes — attach to disposition
                </span>
                <button onClick={() => setNotesOpen(false)} className="text-white/50 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                autoFocus
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type as you talk… saved to the wrap-up automatically."
                className="w-full resize-none rounded-lg text-sm text-white placeholder-white/40 p-2.5 outline-none"
                style={{ height: 118, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', lineHeight: 1.5 }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
