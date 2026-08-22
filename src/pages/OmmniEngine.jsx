import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, Loader2, AlertTriangle, TrendingDown, TrendingUp,
  HeartPulse, Megaphone, Phone, Clock, Shield, Zap, ChevronRight, Quote,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';

const SOURCE_ICONS = {
  equo: HeartPulse,
  loud: Megaphone,
  call_center: Phone,
  corps: Clock,
};

const SEVERITY_STYLES = {
  high: { bg: '#ef444420', border: '#ef4444', text: '#ef4444', label: 'High' },
  medium: { bg: '#f59e0b20', border: '#f59e0b', text: '#f59e0b', label: 'Medium' },
  low: { bg: '#3b82f620', border: '#3b82f6', text: '#3b82f6', label: 'Low' },
};

const SUGGESTED_QUERIES = [
  'Biggest pain points this quarter',
  'Employee happiness by department',
  'PTO denial rates by team',
  'Which teams show burnout risk?',
  'Repeat call patterns this month',
];

export default function OmmniEngine() {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [querying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState(null);

  // Overview data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['ommni-overview'],
    queryFn: async () => {
      const res = await base44.functions.invoke('ommni-engine', { action: 'overview' });
      return res.data;
    },
  });

  // Anomalies data
  const { data: anomaliesData, isLoading: anomaliesLoading } = useQuery({
    queryKey: ['ommni-anomalies'],
    queryFn: async () => {
      const res = await base44.functions.invoke('ommni-engine', { action: 'anomalies' });
      return res.data;
    },
  });

  const runQuery = useCallback(async (q) => {
    const question = (q || query).trim();
    if (!question || querying) return;
    setQuerying(true);
    setQueryError(null);
    setQuery(question);
    try {
      const res = await base44.functions.invoke('ommni-engine', {
        action: 'query',
        question,
      });
      setQueryResult(res.data);
    } catch (err) {
      setQueryError(err.message || 'Query failed');
    } finally {
      setQuerying(false);
    }
  }, [query, querying]);

  const accessTier = overview?.access_tier || 'admin';
  const anomalies = anomaliesData?.anomalies || [];

  return (
    <div className="min-h-screen pb-12" style={{ background: colors.bg }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-11 h-11 rounded-2xl flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                boxShadow: '0 4px 16px rgba(8,145,178,0.35)',
              }}
            >
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(22px, 3vw, 28px)',
                color: colors.text,
                letterSpacing: '0.02em',
                lineHeight: 1.1,
              }}>
                OMMNI
              </h1>
              <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                Org-wide aggregation & anomaly detection
              </p>
            </div>
          </div>

          {/* Access tier badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '999px',
            background: accessTier === 'admin' ? '#22c55e15' : accessTier === 'team_lead' ? '#f59e0b15' : '#6b728015',
            border: `1px solid ${accessTier === 'admin' ? '#22c55e30' : accessTier === 'team_lead' ? '#f59e0b30' : '#6b728030'}`,
          }}>
            <Shield className="w-3.5 h-3.5" style={{
              color: accessTier === 'admin' ? '#22c55e' : accessTier === 'team_lead' ? '#f59e0b' : '#6b7280'
            }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'capitalize',
              color: accessTier === 'admin' ? '#22c55e' : accessTier === 'team_lead' ? '#f59e0b' : '#6b7280',
            }}>
              {accessTier.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* ── Query Box ── */}
        <div style={{
          ...getButtonStyle(),
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '12px' }}>
            Ask OMMNI anything across the suite
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runQuery()}
              placeholder="e.g. Biggest pain points this quarter"
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '14px',
                color: colors.text,
                ...getInsetStyle(),
              }}
            />
            <button
              onClick={() => runQuery()}
              disabled={!query.trim() || querying}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '0 18px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                background: !query.trim() || querying ? colors.bg : 'linear-gradient(135deg, #0891b2, #06b6d4)',
                color: !query.trim() || querying ? colors.textTertiary : '#fff',
                boxShadow: !query.trim() || querying ? 'none' : '0 4px 12px rgba(8,145,178,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {querying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline">Ask</span>
            </button>
          </div>

          {/* Suggested queries */}
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTED_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => runQuery(q)}
                disabled={querying}
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: `1px solid ${colors.border}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.textSecondary,
                  transition: 'all 0.15s',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* ── Query Result ── */}
        <AnimatePresence>
          {querying && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                ...getButtonStyle(),
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#0891b2' }} />
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                OMMNI is analyzing across all modules…
              </span>
            </motion.div>
          )}
          {queryError && !querying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                ...getInsetStyle(),
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '20px',
                border: '1px solid #ef444440',
              }}
            >
              <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>{queryError}</p>
            </motion.div>
          )}
          {queryResult && !querying && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                ...getButtonStyle(),
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '20px',
                borderLeft: '4px solid #06b6d4',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Quote className="w-4 h-4" style={{ color: '#0891b2' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0891b2' }}>
                  Answer
                </span>
                {queryResult.confidence && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: queryResult.confidence === 'high' ? '#22c55e15' : queryResult.confidence === 'medium' ? '#f59e0b15' : '#6b728015',
                    color: queryResult.confidence === 'high' ? '#22c55e' : queryResult.confidence === 'medium' ? '#f59e0b' : '#6b7280',
                  }}>
                    {queryResult.confidence} confidence
                  </span>
                )}
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: colors.text, whiteSpace: 'pre-wrap' }}>
                {queryResult.answer}
              </p>
              {queryResult.key_findings?.length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textTertiary, marginBottom: '8px' }}>
                    Key Findings
                  </p>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {queryResult.key_findings.map((f, i) => (
                      <li key={i} style={{ fontSize: '13px', color: colors.textSecondary, display: 'flex', gap: '8px' }}>
                        <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#06b6d4' }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {queryResult.citations?.length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textTertiary, marginBottom: '8px' }}>
                    Data Sources ({queryResult.citations.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {queryResult.citations.map((c, i) => (
                      <span key={i} style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#0891b215',
                        color: '#0891b2',
                      }}>
                        [{c.ref}] {c.source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Data Sources ── */}
        <div className="mb-6">
          <p className="section-header" style={{ color: colors.textTertiary }}>DATA SOURCES</p>
          {overviewLoading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: colors.textTertiary }} />
            </div>
          ) : overview ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {overview.data_sources.map(src => {
                const Icon = SOURCE_ICONS[src.key] || Brain;
                return (
                  <div
                    key={src.key}
                    style={{
                      ...getButtonStyle(),
                      borderRadius: '14px',
                      padding: '16px',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: '#0891b215',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Icon className="w-4 h-4" style={{ color: '#0891b2' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>
                        {src.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {Object.entries(src.metrics).map(([k, v]) => (
                        <div key={k} className="flex justify-between items-baseline">
                          <span style={{ fontSize: '10px', color: colors.textTertiary, textTransform: 'capitalize' }}>
                            {k.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>
                            {v == null ? '—' : typeof v === 'number' && k.includes('rate') ? `${v}%` : v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* ── Anomaly Feed ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-header" style={{ color: colors.textTertiary, marginBottom: 0 }}>
              ANOMALY FEED
            </p>
            {anomalies.length > 0 && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                background: anomalies.length > 5 ? '#ef444415' : '#f59e0b15',
                color: anomalies.length > 5 ? '#ef4444' : '#f59e0b',
              }}>
                {anomalies.length} active
              </span>
            )}
          </div>

          {anomaliesLoading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: colors.textTertiary }} />
            </div>
          ) : anomalies.length === 0 ? (
            <div style={{
              ...getInsetStyle(),
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
            }}>
              <TrendingUp className="w-8 h-8 mx-auto mb-3" style={{ color: '#22c55e' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>
                No anomalies detected
              </p>
              <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                All modules are within normal ranges.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <AnimatePresence>
                {anomalies.map((a, i) => (
                  <AnomalyCard
                    key={i}
                    anomaly={a}
                    colors={colors}
                    getButtonStyle={getButtonStyle}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── How modules consume OMMNI ── */}
        <div className="mt-8">
          <p className="section-header" style={{ color: colors.textTertiary }}>CALLABLE SERVICE — HOW MODULES USE OMMNI</p>
          <div style={{
            ...getInsetStyle(),
            borderRadius: '14px',
            padding: '16px',
          }}>
            <div className="flex flex-col gap-3">
              {[
                { mod: 'DOC', desc: 'Queries OMMNI mid-call for anomaly flags on the member/client being worked' },
                { mod: 'CORPS//', desc: 'Surfaces OMMNI-derived signal on an employee\'s own profile trend' },
                { mod: 'ALERA|LOUD', desc: 'Pulls an OMMNI baseline to contextualize a single call score' },
                { mod: 'Leadership', desc: 'Dashboard is one consumer of the engine, not the whole product' },
              ].map(item => (
                <div key={item.mod} className="flex items-start gap-3">
                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#0891b2' }} />
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>
                      {item.mod}
                    </span>
                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                      {' — '}{item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Anomaly Card ──
function AnomalyCard({ anomaly, colors, getButtonStyle }) {
  const sev = SEVERITY_STYLES[anomaly.severity] || SEVERITY_STYLES.medium;
  const Icon = anomaly.severity === 'high' ? AlertTriangle : anomaly.severity === 'medium' ? TrendingDown : AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      style={{
        ...getButtonStyle(),
        borderRadius: '14px',
        padding: '16px',
        borderLeft: `4px solid ${sev.border}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div style={{
          flexShrink: 0,
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: sev.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon className="w-4 h-4" style={{ color: sev.text }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: sev.bg,
              color: sev.text,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {sev.label}
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#0891b215',
              color: '#0891b2',
            }}>
              {anomaly.source_module}
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: colors.textTertiary,
              textTransform: 'capitalize',
            }}>
              {anomaly.type.replace(/_/g, ' ')}
            </span>
          </div>

          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            color: colors.text,
            lineHeight: 1.4,
          }}>
            {anomaly.description}
          </p>

          {anomaly.data_points?.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {anomaly.data_points.map((dp, i) => (
                <span key={i} style={{ fontSize: '11px', color: colors.textSecondary }}>
                  <strong style={{ color: colors.textTertiary }}>{dp.metric.replace(/_/g, ' ')}:</strong>{' '}
                  {dp.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}