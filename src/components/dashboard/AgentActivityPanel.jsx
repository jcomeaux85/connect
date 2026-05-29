import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const STATUS_COLORS = {
  'On Call': '#10B981',
  'Available': '#3B82F6',
  'Wrapping Up': '#F59E0B',
  'On Break': '#6366F1',
  'Offline': '#9CA3AF',
};

const MOCK_STATUSES = [
  'On Call', 'Available', 'Wrapping Up', 'On Break', 'Offline'
];

export default function AgentActivityPanel({ users = [], currentUser = null, calls = [] }) {
  const { isDark } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Build agent call counts
  const callsByAgent = {};
  calls.forEach(call => {
    const agent = call.assigned_to || 'unassigned';
    callsByAgent[agent] = (callsByAgent[agent] || 0) + 1;
  });

  // Create agent list with current user first
  let agents = [];
  if (currentUser?.email) {
    const userCalls = callsByAgent[currentUser.email] || 0;
    agents.push({
      name: currentUser.full_name || currentUser.email,
      initials: (currentUser.full_name || 'ME').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      status: MOCK_STATUSES[0],
      calls: userCalls,
      avg: '4:23',
      isCurrentUser: true,
    });
  }

  // Add other users
  users.forEach((u, i) => {
    if (u.email !== currentUser?.email) {
      const userCalls = callsByAgent[u.email] || 0;
      agents.push({
        name: u.full_name || u.email,
        initials: (u.full_name || 'UU').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        status: MOCK_STATUSES[(i + 1) % MOCK_STATUSES.length],
        calls: userCalls,
        avg: '3:45',
        isCurrentUser: false,
      });
    }
  });

  agents = agents.slice(0, 6);

  const cardBg = isDark ? '#555555' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const headerBg = isDark ? 'rgba(59,130,246,0.15)' : 'linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)';
  const headerBorder = isDark ? 'rgba(59,130,246,0.25)' : '#bfdbfe';
  const textPrimary = isDark ? '#f0f0f0' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const tileBg = isDark ? '#555555' : '#f9fafb';
  const tileBorder = isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6';

  if (isCollapsed) {
    const totalCalls = agents.reduce((sum, a) => sum + a.calls, 0);
    const onCallCount = agents.filter(a => a.status === 'On Call').length;
    const availableCount = agents.filter(a => a.status === 'Available').length;

    return (
      <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderTop: '2px solid #60a5fa' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Agent Activity</h3>
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: STATUS_COLORS['On Call'] }}>{onCallCount} on call</span>
              <span style={{ color: textSecondary }}>·</span>
              <span style={{ color: STATUS_COLORS['Available'] }}>{availableCount} available</span>
              <span style={{ color: textSecondary }}>·</span>
              <span style={{ color: textSecondary }}>{totalCalls} calls today</span>
            </div>
          </div>
          <button onClick={() => setIsCollapsed(false)} className="p-1">
            <ChevronDown className="w-4 h-4" style={{ color: textSecondary }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderTop: '2px solid #60a5fa' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Agent Activity</h3>
        <button onClick={() => setIsCollapsed(true)} className="p-1">
          <ChevronDown className="w-4 h-4 transform rotate-180" style={{ color: textSecondary }} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {agents.map((agent, i) => (
          <div
            key={i}
            className={agent.isCurrentUser ? '' : 'flex items-center gap-2 p-3 rounded-xl'}
            style={agent.isCurrentUser ? {} : { background: tileBg, border: `1px solid ${tileBorder}` }}
          >
            {agent.isCurrentUser ? (
              <div className="mb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
                    {agent.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: textPrimary }}>{agent.name}</p>
                    <p className="text-xs font-medium" style={{ color: STATUS_COLORS[agent.status] || '#9CA3AF' }}>YOU • {agent.status}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p style={{ color: textSecondary }}>Calls</p>
                    <p className="text-lg font-bold" style={{ color: textPrimary }}>{agent.calls}</p>
                  </div>
                  <div>
                    <p style={{ color: textSecondary }}>Avg Handle</p>
                    <p className="text-lg font-bold font-mono" style={{ color: textPrimary }}>{agent.avg}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
                  {agent.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: textPrimary }}>{agent.name}</p>
                  <p className="text-[10px] font-medium" style={{ color: STATUS_COLORS[agent.status] || '#9CA3AF' }}>{agent.status}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px]" style={{ color: textSecondary }}>{agent.calls} calls</p>
                  <p className="text-[10px] font-mono" style={{ color: textSecondary }}>Avg {agent.avg}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}