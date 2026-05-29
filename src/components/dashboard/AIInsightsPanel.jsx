import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const INSIGHTS = [
  {
    color: '#F59E0B',
    title: 'Peak Hour Alert',
    body: 'Call volume expected to spike 40% between 3–4 PM based on historical patterns.',
  },
  {
    color: '#8B5CF6',
    title: 'Compliance Score',
    body: 'Team compliance is at 96.4% today. 2 calls flagged for review.',
  },
  {
    color: '#10B981',
    title: 'Resolution Rate',
    body: 'First-call resolution improved 8% this week. Top performer: Lisa Chang.',
  },
];

export default function AIInsightsPanel() {
  const { isDark } = useTheme();

  const cardBg = isDark ? '#555555' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6';
  const headerBg = isDark ? 'rgba(251,146,60,0.15)' : 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)';
  const headerBorder = isDark ? 'rgba(251,146,60,0.25)' : '#fed7aa';
  const tileBg = isDark ? '#555555' : '#f9fafb';
  const tileBorder = isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6';
  const textPrimary = isDark ? '#f0f0f0' : '#1f2937';
  const textSecondary = isDark ? '#d1d5db' : '#6b7280';

  return (
    <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderTop: '2px solid #fb923c' }}>
      <div className="flex items-center gap-2 mb-4 -mx-4 px-4 py-2 rounded-t-2xl" style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}>
        <Sparkles className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-bold" style={{ color: textPrimary }}>AI Insights</h3>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {INSIGHTS.map((ins, i) => (
          <div key={i} className="p-3 rounded-xl" style={{ background: tileBg, border: `1px solid ${tileBorder}` }}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: ins.color }} />
              <p className="text-xs font-bold" style={{ color: textPrimary }}>{ins.title}</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: textSecondary }}>{ins.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}