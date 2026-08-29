import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, PhoneCall, HeartCrack } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';

const FORECAST_META = {
  burnout_risk: { icon: AlertTriangle, label: 'Burnout Risk', color: '#ef4444' },
  attrition_risk: { icon: HeartCrack, label: 'Attrition Likelihood', color: '#f59e0b' },
  csat_trajectory: { icon: TrendingDown, label: 'CSAT Trajectory', color: '#8b5cf6' },
  call_volume: { icon: PhoneCall, label: 'Call Volume Forecast', color: '#06b6d4' },
};

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const w = 100, h = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - ((data[data.length-1] - min) / range) * h} r={2.5} fill={color} />
    </svg>
  );
}

export default function ForecastCards() {
  const { colors, getButtonStyle } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['ommni-forecast'],
    queryFn: async () => {
      const res = await base44.functions.invoke('ommni-engine', { action: 'forecast' });
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <Activity className="w-6 h-6 animate-spin mx-auto" style={{ color: '#06b6d4' }} />
      </div>
    );
  }

  const forecasts = data?.forecasts || [];
  if (forecasts.length === 0) {
    return (
      <div style={{
        ...getButtonStyle(), borderRadius: '16px', padding: '24px', textAlign: 'center',
      }}>
        <TrendingUp className="w-7 h-7 mx-auto mb-2" style={{ color: '#22c55e' }} />
        <p style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>No forecasts flagged</p>
        <p style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
          Not enough historical data to extrapolate yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <AnimatePresence>
        {forecasts.map((f, i) => {
          const meta = FORECAST_META[f.type] || { icon: Activity, label: f.type, color: '#06b6d4' };
          const Icon = meta.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                ...getButtonStyle(),
                borderRadius: '14px',
                padding: '16px',
                borderLeft: `4px solid ${meta.color}`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: `${meta.color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>{meta.label}</p>
                    <p style={{ fontSize: '10px', color: colors.textTertiary }}>
                      {f.entity?.name || f.entity?.email || 'Org-wide'}
                    </p>
                  </div>
                </div>
                {f.probability > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: meta.color, lineHeight: 1 }}>
                      {f.probability}%
                    </p>
                    <p style={{ fontSize: '9px', color: colors.textTertiary, textTransform: 'uppercase' }}>probability</p>
                  </div>
                )}
              </div>

              {f.trajectory && f.trajectory.length >= 2 && (
                <div className="mb-3" style={{ background: `${meta.color}08`, borderRadius: '8px', padding: '6px 8px' }}>
                  <Sparkline data={f.trajectory} color={meta.color} />
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '10px', color: colors.textTertiary, textTransform: 'uppercase' }}>Projected next</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{f.projected_next}</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-2 pt-2" style={{ borderTop: `1px solid ${colors.border}` }}>
                {f.factors.map((fac, j) => (
                  <span key={j} style={{ fontSize: '10px', color: colors.textSecondary }}>
                    <strong style={{ color: colors.textTertiary }}>{fac.label}:</strong> {fac.value}
                  </span>
                ))}
              </div>

              {f.confidence != null && (
                <p style={{ fontSize: '9px', color: colors.textTertiary, marginTop: '8px' }}>
                  confidence: {Math.round(f.confidence * 100)}%
                </p>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}