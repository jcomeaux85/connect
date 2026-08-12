import React from 'react';
import { useUser } from '@/components/hooks/useUser';
import { useQuery } from '@tanstack/react-query';
import { corpsData } from '@/api/corpsData';
import { format } from 'date-fns';
import { Clock, Calendar, DollarSign, Activity } from 'lucide-react';

const typeConfig = {
  timecard: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Timecard' },
  timeoff: { icon: Calendar, color: 'text-teal-500', bg: 'bg-teal-50', label: 'Time Off' },
  pay: { icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Pay' },
};

// ActionTimeline — unified feed merging timecard, time-off, and pay
// events into one chronological stream. The "one-page" view: instead
// of jumping between separate UKG-style tabs, the whole workforce
// story is visible at a glance.
export default function ActionTimeline() {
  const { data: user } = useUser();

  const { data: timecard = [] } = useQuery({
    queryKey: ['core-timeline-timecard', user?.email],
    queryFn: () => corpsData.CoreTimecardEntry.filter({ employee_email: user?.email }, '-work_date', 12),
    enabled: !!user?.email,
  });
  const { data: timeoff = [] } = useQuery({
    queryKey: ['core-timeline-timeoff', user?.email],
    queryFn: () => corpsData.CoreTimeOffRequest.filter({ employee_email: user?.email }, '-created_date', 12),
    enabled: !!user?.email,
  });
  const { data: paystubs = [] } = useQuery({
    queryKey: ['core-timeline-pay', user?.email],
    queryFn: () => corpsData.CorePaystub.filter({ employee_email: user?.email }, '-pay_date', 12),
    enabled: !!user?.email,
  });

  const events = [
    ...timecard.map((t) => ({
      type: 'timecard',
      date: t.work_date,
      title: `${(t.hours || 0).toFixed(1)} hrs logged`,
      sub: t.clock_in ? `${t.clock_in}${t.clock_out ? '–' + t.clock_out : ''}` : 'Manual entry',
    })),
    ...timeoff.map((t) => ({
      type: 'timeoff',
      date: t.start_date,
      title: t.request_type,
      sub: `${t.start_date} → ${t.end_date} · ${t.status}`,
    })),
    ...paystubs.map((p) => ({
      type: 'pay',
      date: p.pay_date,
      title: `Net $${(p.net_pay || 0).toLocaleString()}`,
      sub: `Gross $${(p.gross_pay || 0).toLocaleString()} · ${(p.hours_worked || 0).toFixed(1)} hrs`,
    })),
  ]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 8);

  return (
    <div className="spot-panel bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">UNIFIED FEED</p>
          <h3 className="text-lg font-bold text-gray-900">Action Timeline</h3>
        </div>
        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
          <Activity className="w-5 h-5 text-purple-500" />
        </div>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {events.map((ev, i) => {
            const cfg = typeConfig[ev.type];
            const Icon = cfg.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                  <p className="text-xs text-gray-400 truncate">{ev.sub}</p>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {ev.date ? format(new Date(ev.date), 'MMM d') : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}