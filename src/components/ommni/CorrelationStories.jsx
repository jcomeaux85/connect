import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, ChevronDown, Link2, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';
import { SAMPLE_STORIES } from '@/ommni/samplePulse';

const SEV_STYLES = {
  high: { bg: '#ef444415', border: '#ef4444', text: '#ef4444', label: 'High' },
  medium: { bg: '#f59e0b15', border: '#f59e0b', text: '#f59e0b', label: 'Medium' },
  low: { bg: '#3b82f615', border: '#3b82f6', text: '#3b82f6', label: 'Low' },
};

export default function CorrelationStories() {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const [stories, setStories] = useState(SAMPLE_STORIES);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(0);
  const [source, setSource] = useState('sample');

  const runCorrelate = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('ommni-engine', { action: 'correlate' });
      const live = res.data?.stories || [];
      if (live.length) {
        setStories(live);
        setSource('live');
      } else {
        setStories(SAMPLE_STORIES);
        setSource('sample');
      }
    } catch {
      setStories(SAMPLE_STORIES);
      setSource('sample');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: '11px', color: colors.textTertiary }}>
          {source === 'sample' ? 'Hive sample stories — patterns no single module can see.' : 'Live correlate.'}
        </p>
        <button
          onClick={runCorrelate}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700, color: '#fff',
            background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? 'Connecting…' : 'Refresh stories'}
        </button>
      </div>

      {loading && (
        <div style={{ ...getButtonStyle(), borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 12 }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#06b6d4' }} />
          <span style={{ fontSize: '13px', color: colors.textSecondary }}>
            OMMNI is connecting the dots across all modules…
          </span>
        </div>
      )}

      <AnimatePresence>
        {stories && stories.length > 0 && !loading && (
          <div className="flex flex-col gap-2.5">
            {stories.map((s, i) => {
              const sev = SEV_STYLES[s.severity] || SEV_STYLES.medium;
              const isOpen = expanded === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    ...getButtonStyle(),
                    borderRadius: '14px',
                    padding: '16px',
                    borderLeft: `4px solid ${sev.border}`,
                  }}
                >
                  <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : i)}>
                    <div style={{
                      flexShrink: 0, width: '32px', height: '32px', borderRadius: '10px',
                      background: '#06b6d415', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Link2 className="w-4 h-4" style={{ color: '#06b6d4' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                          background: sev.bg, color: sev.text, textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{sev.label}</span>
                        {s.modules?.map((m) => (
                          <span key={m} style={{
                            fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                            background: '#06b6d415', color: '#06b6d4',
                          }}>{m}</span>
                        ))}
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: colors.text, lineHeight: 1.3 }}>{s.title}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 flex-shrink-0 mt-1" style={{
                      color: colors.textTertiary, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
                    }} />
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                          <p style={{ fontSize: '13px', lineHeight: 1.6, color: colors.textSecondary }}>{s.narrative}</p>
                          {s.refs?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {s.refs.map((ref, j) => (
                                <span key={j} style={{
                                  fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                                  background: '#06b6d415', color: '#06b6d4',
                                }}>[{ref}]</span>
                              ))}
                            </div>
                          )}
                          {s.notify && (
                            <div className="flex items-center gap-2 mt-3">
                              <Shield className="w-3.5 h-3.5" style={{ color: colors.textTertiary }} />
                              <span style={{ fontSize: '11px', color: colors.textTertiary }}>
                                Notify: <strong style={{ color: colors.textSecondary }}>{s.notify}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
