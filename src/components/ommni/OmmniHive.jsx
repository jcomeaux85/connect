import React, { useState } from 'react';
import { Eye, Mail, Radio, Landmark, Copy, Check } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import {
  SAMPLE_WATCHLIST,
  SAMPLE_DIRECTIVES,
  SAMPLE_TAX_NOTE,
  SAMPLE_PULSE,
} from '@/ommni/samplePulse';

const TONE = {
  hot: { bg: '#ef444418', fg: '#ef4444' },
  warm: { bg: '#f59e0b18', fg: '#f59e0b' },
  ok: { bg: '#22c55e18', fg: '#22c55e' },
};

export default function OmmniHive() {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const [openLetter, setOpenLetter] = useState(null);
  const [copied, setCopied] = useState(false);

  const copyLetter = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="section-header" style={{ color: colors.textTertiary }}>HIVE PULSE — BY DESK</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SAMPLE_PULSE.map((p) => {
            const t = TONE[p.tone] || TONE.ok;
            return (
              <div key={p.dept} style={{ ...getButtonStyle(), borderRadius: '12px', padding: '12px 14px' }}>
                <div className="flex items-center justify-between gap-2">
                  <span style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>{p.dept}</span>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: t.fg, boxShadow: `0 0 8px ${t.fg}` }} />
                </div>
                <p style={{ fontSize: '11px', color: colors.textSecondary, marginTop: 4 }}>{p.signal}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="section-header" style={{ color: colors.textTertiary }}>WATCHING — SAID SO OUT LOUD</p>
        <div className="flex flex-col gap-2">
          {SAMPLE_WATCHLIST.map((w) => (
            <div key={w.id} style={{ ...getButtonStyle(), borderRadius: '14px', padding: '14px 16px' }}>
              <div className="flex items-start gap-3">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0891b215', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Eye className="w-4 h-4" style={{ color: '#0891b2' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{w.watch}</p>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: w.status === 'triggered' ? '#ef444418' : '#22c55e18',
                      color: w.status === 'triggered' ? '#ef4444' : '#22c55e',
                      textTransform: 'uppercase',
                    }}>{w.status}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: colors.textSecondary }}>{w.rule}</p>
                  <p style={{ fontSize: '10px', color: colors.textTertiary, marginTop: 4 }}>Horizon {w.horizon}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="section-header" style={{ color: colors.textTertiary }}>TELL THE MIDDLE — DRAFTS, NOT DASHBOARDS</p>
        <div className="flex flex-col gap-2.5">
          {SAMPLE_DIRECTIVES.map((d, i) => (
            <div key={d.to} style={{ ...getButtonStyle(), borderRadius: '14px', padding: '16px', borderLeft: '4px solid #06b6d4' }}>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#0891b2' }} />
                <div className="min-w-0 flex-1">
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.to}</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: colors.text, marginTop: 4 }}>{d.action}</p>
                  <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: 6 }}>{d.why}</p>
                  <button
                    onClick={() => setOpenLetter(openLetter === i ? null : i)}
                    style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#06b6d4' }}
                  >
                    {openLetter === i ? 'Hide correspondence' : 'Show correspondence'}
                  </button>
                  {openLetter === i && (
                    <div style={{ ...getInsetStyle(), borderRadius: 12, padding: 12, marginTop: 8 }}>
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: colors.text, whiteSpace: 'pre-wrap' }}>{d.letter}</p>
                      <button
                        onClick={() => copyLetter(d.letter)}
                        style={{
                          marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                          border: 'none', cursor: 'pointer', borderRadius: 8, padding: '6px 10px',
                          background: '#0891b218', color: '#0891b2', fontSize: 11, fontWeight: 700,
                        }}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy to send'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="section-header" style={{ color: colors.textTertiary }}>CALENDAR THE BOOKS CAN SEE</p>
        <div style={{ ...getButtonStyle(), borderRadius: '14px', padding: '16px' }}>
          <div className="flex items-start gap-3">
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f59e0b18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Landmark className="w-4 h-4" style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{SAMPLE_TAX_NOTE.title}</p>
              <p style={{ fontSize: '12px', lineHeight: 1.65, color: colors.textSecondary, marginTop: 6 }}>{SAMPLE_TAX_NOTE.body}</p>
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 10, color: colors.textTertiary, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Radio className="w-3 h-3" />
        Sample hive for the pitch. Live engine still wins when it returns strong forecasts.
      </p>
    </div>
  );
}
