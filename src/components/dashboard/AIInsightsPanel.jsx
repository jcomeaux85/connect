import React from 'react';
import { Sparkles } from 'lucide-react';

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
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-bold text-gray-800">AI Insights</h3>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {INSIGHTS.map((ins, i) => (
          <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: ins.color }} />
              <p className="text-xs font-bold text-gray-700">{ins.title}</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{ins.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}