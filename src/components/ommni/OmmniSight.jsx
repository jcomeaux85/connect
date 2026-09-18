import React, { useState } from 'react';
import { Eye, GitBranch, Scale, Clock, HelpCircle, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import {
  SAMPLE_BRIEFING,
  SAMPLE_CASCADES,
  SAMPLE_COUNTERFACTUALS,
  SAMPLE_HORIZON,
  SAMPLE_UNASKED,
} from '@/ommni/samplePulse';

const TONE = {
  hot: '#ef4444',
  warm: '#f59e0b',
  ok: '#22c55e',
};

export default function OmmniSight() {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const [openCascade, setOpenCascade] = useState(0);
  const [openUnasked, setOpenUnasked] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="section-header" style={{ color: colors.textTertiary }}>THIS MORNING — WHAT THE FLOOR CANNOT SEE YET</p>
        <div style={{ ...getButtonStyle(), borderRadius: '16px', padding: '20px', borderLeft: '4px solid #06b6d4' }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" style={{ color: '#06b6d4' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0891b2' }}>
              {SAMPLE_BRIEFING.as_of}
            </span>
          </div>
          <p style={{ fontSize: '16px', fontWeight: 800, color: colors.text, lineHeight: 1.3 }}>{SAMPLE_BRIEFING.headline}</p>
          <p style={{ fontSize: '13px', lineHeight: 1.7, color: colors.textSecondary, marginTop: 10 }}>{SAMPLE_BRIEFING.body}</p>
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
            {SAMPLE_BRIEFING.seeing.map((line) => (
              <div key={line} className="flex gap-2 items-start" style={{ marginBottom: 8 }}>
                <Eye className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#06b6d4' }} />
                <p style={{ fontSize: '12px', color: colors.text }}>{line}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="section-header" style={{ color: colors.textTertiary }}>CASCADE MAP — CAUSE, LAG, WHO FEELS IT</p>
        <div className="flex flex-col gap-2.5">
          {SAMPLE_CASCADES.map((c, i) => {
            const open = openCascade === i;
            return (
              <div key={c.id} style={{ ...getButtonStyle(), borderRadius: '14px', padding: '16px' }}>
                <button
                  onClick={() => setOpenCascade(open ? -1 : i)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                >
                  <div className="flex items-start gap-3">
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0891b215', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GitBranch className="w-4 h-4" style={{ color: '#0891b2' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{c.name}</p>
                      <p style={{ fontSize: '11px', color: colors.textSecondary, marginTop: 4 }}>
                        Lag {c.lag} · {c.cost}
                      </p>
                    </div>
                  </div>
                </button>
                {open && (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                    {c.steps.map((s, idx) => (
                      <div key={`${c.id}-${idx}`} className="flex gap-3" style={{ marginBottom: idx === c.steps.length - 1 ? 0 : 10 }}>
                        <div style={{ width: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 8, height: 8, borderRadius: 99, background: '#06b6d4', marginTop: 4 }} />
                          {idx < c.steps.length - 1 && <div style={{ width: 1, flex: 1, background: '#06b6d455', minHeight: 16 }} />}
                        </div>
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.module}</p>
                          <p style={{ fontSize: '12px', color: colors.text, marginTop: 2 }}>{s.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="section-header" style={{ color: colors.textTertiary }}>COUNTERFACTUALS — THE MOVE, OR THE GHOST HIRE</p>
        <div className="flex flex-col gap-2.5">
          {SAMPLE_COUNTERFACTUALS.map((cf) => (
            <div key={cf.id} style={{ ...getButtonStyle(), borderRadius: '14px', padding: '16px' }}>
              <div className="flex items-start gap-3">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#8b5cf618', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Scale className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{cf.move}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    <div style={{ ...getInsetStyle(), borderRadius: 10, padding: 10 }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' }}>If we do</p>
                      <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: 4, lineHeight: 1.5 }}>{cf.if_yes}</p>
                    </div>
                    <div style={{ ...getInsetStyle(), borderRadius: 10, padding: 10 }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>If we wait</p>
                      <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: 4, lineHeight: 1.5 }}>{cf.if_no}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span style={{ fontSize: '11px', fontWeight: 600, color: colors.text }}>{cf.dollars}</span>
                    <span style={{ fontSize: '11px', color: colors.textTertiary }}>confidence {Math.round(cf.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="section-header" style={{ color: colors.textTertiary }}>NEXT 72 HOURS — ALREADY ON THE CLOCK</p>
        <div className="flex flex-col gap-2">
          {SAMPLE_HORIZON.map((h) => (
            <div key={h.when} style={{ ...getButtonStyle(), borderRadius: '12px', padding: '12px 14px' }}>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TONE[h.tone] || TONE.ok }} />
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: TONE[h.tone] || colors.textTertiary }}>{h.when}</p>
                  <p style={{ fontSize: '12px', color: colors.text, marginTop: 2 }}>{h.what}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="section-header" style={{ color: colors.textTertiary }}>QUESTIONS YOU DID NOT ASK</p>
        <div className="flex flex-col gap-2">
          {SAMPLE_UNASKED.map((u, i) => {
            const open = openUnasked === i;
            return (
              <div key={u.q} style={{ ...getButtonStyle(), borderRadius: '14px', padding: '14px 16px' }}>
                <button
                  onClick={() => setOpenUnasked(open ? -1 : i)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#06b6d4' }} />
                    <p style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{u.q}</p>
                  </div>
                </button>
                {open && (
                  <p style={{ fontSize: '12px', lineHeight: 1.65, color: colors.textSecondary, marginTop: 8, marginLeft: 28 }}>
                    {u.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
