import React from 'react';

const STATUS_COLORS = {
  'On Call': '#10B981',
  'Available': '#3B82F6',
  'Wrapping Up': '#F59E0B',
  'On Break': '#6366F1',
  'Offline': '#9CA3AF',
};

const MOCK_AGENTS = [
  { name: 'Jane Doe', initials: 'JD', status: 'On Call', calls: 12, avg: '4:23' },
  { name: 'Mike Torres', initials: 'MT', status: 'Available', calls: 6, avg: '3:45' },
  { name: 'Lisa Chang', initials: 'LC', status: 'Wrapping Up', calls: 15, avg: '3:10' },
  { name: 'Rob Miller', initials: 'RM', status: 'On Break', calls: 6, avg: '6:02' },
  { name: 'Sam Wilson', initials: 'SW', status: 'On Call', calls: 10, avg: '4:55' },
  { name: 'Amy Lee', initials: 'AL', status: 'Available', calls: 8, avg: '3:30' },
];

export default function AgentActivityPanel({ users = [] }) {
  const agents = users.length > 0
    ? users.slice(0, 6).map((u, i) => ({
        name: u.full_name || u.email,
        initials: (u.full_name || 'UU').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        status: MOCK_AGENTS[i % MOCK_AGENTS.length].status,
        calls: MOCK_AGENTS[i % MOCK_AGENTS.length].calls,
        avg: MOCK_AGENTS[i % MOCK_AGENTS.length].avg,
      }))
    : MOCK_AGENTS;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm" style={{ borderTop: '2px solid #60a5fa' }}>
      <h3 className="text-sm font-bold text-gray-800 mb-4">Agent Activity</h3>
      <div className="grid grid-cols-2 gap-2">
        {agents.map((agent, i) => (
          <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
              {agent.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{agent.name}</p>
              <p className="text-[10px] font-medium" style={{ color: STATUS_COLORS[agent.status] || '#9CA3AF' }}>{agent.status}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-gray-400">{agent.calls} calls</p>
              <p className="text-[10px] text-gray-500 font-mono">Avg {agent.avg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}