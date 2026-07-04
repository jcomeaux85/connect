import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, Download } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CallRecordingModal — single-click recording playback.
 * Opens directly over the timeline, no navigation required.
 */
export default function CallRecordingModal({ isOpen, onClose, call }) {
  const { colors, isDark, getButtonStyle } = useTheme();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
  }, [call?.audioUrl]);

  if (!isOpen || !call) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = pct * (audioRef.current.duration || 0);
    }
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl p-6 border-0"
          style={{
            background: colors.bg,
            boxShadow: `20px 20px 40px ${colors.shadowDark}, -20px -20px 40px ${colors.shadowLight}`
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: call.color }}>
                {call.employer}
              </p>
              <h3 className="text-lg font-bold" style={{ color: colors.text }}>
                {call.agent} · {call.direction} · {call.time}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl h-8 w-8 flex items-center justify-center border-0 flex-shrink-0"
              style={getButtonStyle('3px')}
            >
              <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
            </button>
          </div>

          {call.audioUrl ? (
            <>
              <audio
                ref={audioRef}
                src={call.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onEnded={() => setPlaying(false)}
              />

              <div
                className="h-2 rounded-full mb-3 cursor-pointer relative overflow-hidden"
                style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                onClick={handleSeek}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${duration ? (progress / duration) * 100 : 0}%`,
                    background: `linear-gradient(90deg, ${call.color}, ${call.secondary || call.color})`
                  }}
                />
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs" style={{ color: colors.textTertiary }}>{fmt(progress)}</span>
                <span className="text-xs" style={{ color: colors.textTertiary }}>{fmt(duration)}</span>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={togglePlay}
                  className="rounded-full h-14 w-14 flex items-center justify-center border-0"
                  style={{
                    ...getButtonStyle('6px'),
                    background: `linear-gradient(145deg, ${call.color}, ${call.secondary || call.color})`
                  }}
                >
                  {playing ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
                </button>
                <a
                  href={call.audioUrl}
                  download
                  className="rounded-xl h-10 w-10 flex items-center justify-center border-0"
                  style={getButtonStyle('4px')}
                >
                  <Download className="w-4 h-4" style={{ color: colors.textSecondary }} />
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Volume2 className="w-10 h-10 mx-auto mb-3" style={{ color: colors.textTertiary }} />
              <p className="text-sm" style={{ color: colors.textSecondary }}>No recording attached to this call.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
