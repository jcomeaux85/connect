import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global active call state — shared via window events
export const callBarEvents = {
  start: (callData) => window.dispatchEvent(new CustomEvent('active-call-start', { detail: callData })),
  end: () => window.dispatchEvent(new CustomEvent('active-call-end')),
};

export default function ActiveCallBar({ onHeightChange }) {
  const [activeCall, setActiveCall] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onStart = (e) => { setActiveCall(e.detail); setElapsed(0); setCollapsed(false); };
    const onEnd = () => { setActiveCall(null); setElapsed(0); };
    window.addEventListener('active-call-start', onStart);
    window.addEventListener('active-call-end', onEnd);
    return () => {
      window.removeEventListener('active-call-start', onStart);
      window.removeEventListener('active-call-end', onEnd);
    };
  }, []);

  useEffect(() => {
    if (!activeCall) return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [activeCall]);

  const barHeight = activeCall ? (collapsed ? 36 : 56) : 0;

  useEffect(() => {
    onHeightChange?.(barHeight);
  }, [barHeight, onHeightChange]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleEndCall = () => {
    window.dispatchEvent(new CustomEvent('show-disposition-form', { detail: activeCall || {} }));
    callBarEvents.end();
  };

  return (
    <AnimatePresence>
      {activeCall && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: barHeight, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
            overflow: 'hidden',
            flexShrink: 0,
            zIndex: 45,
          }}
        >
          {collapsed ? (
            <div className="flex items-center justify-between h-full px-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-bold">{activeCall.name || activeCall.phone || 'Active Call'}</span>
                <span className="text-white/80 text-xs font-mono">{formatTime(elapsed)}</span>
              </div>
              <button onClick={() => setCollapsed(false)} className="text-white/80 hover:text-white">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between h-full px-4 gap-3">
              {/* Left: caller info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{activeCall.name || 'Unknown Caller'}</p>
                  <p className="text-white/80 text-xs">{activeCall.phone || ''}</p>
                </div>
                <div className="flex items-center gap-1.5 text-white/90 text-xs font-mono bg-white/10 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  {formatTime(elapsed)}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setMuted(m => !m)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{ background: muted ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)' }}
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-white" />}
                </button>
                <button
                  onClick={() => setSpeakerOff(s => !s)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{ background: speakerOff ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)' }}
                  title={speakerOff ? 'Unmute Speaker' : 'Mute Speaker'}
                >
                  {speakerOff ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
                </button>
                <button
                  onClick={handleEndCall}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold transition-all hover:bg-red-500"
                  style={{ background: 'rgba(0,0,0,0.25)', color: '#fff' }}
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  End
                </button>
                <button onClick={() => setCollapsed(true)} className="text-white/70 hover:text-white">
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}