import React, { useState } from 'react';
import { useUser } from '@/components/hooks/useUser';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { corpsData } from '@/api/corpsData';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  Clock, Calendar, DollarSign, Activity,
  CheckCircle2, FileText, X, Plus, Loader2
} from 'lucide-react';

const typeConfig = {
  timecard: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Timecard', actionLabel: 'Approve' },
  timeoff:  { icon: Calendar, color: 'text-teal-500', bg: 'bg-teal-50', label: 'Time Off', actionLabel: 'Approve' },
  pay:      { icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Pay', actionLabel: 'View' },
};

// ─────────────────────────────────────────────────────────────
// BI-DIRECTIONAL ACTION TIMELINE
// Each event row is now interactive — agents can act directly on
// the timeline instead of navigating to separate approval screens.
// Inline actions: Approve / Reject / Add Note, each mutating the
// underlying entity in place with optimistic UI.
// ─────────────────────────────────────────────────────────────
export default function BidirectionalActionTimeline() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const [actingId, setActingId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteFor, setNoteFor] = useState(null);

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
      id: t.id, type: 'timecard', date: t.work_date,
      title: `${(t.hours || 0).toFixed(1)} hrs logged`,
      sub: t.clock_in ? `${t.clock_in}${t.clock_out ? '–' + t.clock_out : ''}` : 'Manual entry',
      status: t.status, raw: t,
    })),
    ...timeoff.map((t) => ({
      id: t.id, type: 'timeoff', date: t.start_date,
      title: t.request_type,
      sub: `${t.start_date} → ${t.end_date} · ${t.status}`,
      status: t.status, raw: t,
    })),
    ...paystubs.map((p) => ({
      id: p.id, type: 'pay', date: p.pay_date,
      title: `Net $${(p.net_pay || 0).toLocaleString()}`,
      sub: `Gross $${(p.gross_pay || 0).toLocaleString()} · ${(p.hours_worked || 0).toFixed(1)} hrs`,
      status: 'approved', raw: p,
    })),
  ]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 8);

  // ── Inline actions ──
  const handleApprove = async (ev) => {
    setActingId(ev.id);
    try {
      if (ev.type === 'timecard') {
        await corpsData.CoreTimecardEntry.update(ev.id, { status: 'approved' });
      } else if (ev.type === 'timeoff') {
        await corpsData.CoreTimeOffRequest.update(ev.id, { status: 'approved' });
      }
      queryClient.invalidateQueries(['core-timeline-timecard', user?.email]);
      queryClient.invalidateQueries(['core-timeline-timeoff', user?.email]);
    } catch (e) {
      console.error('Timeline action failed:', e);
    }
    setActingId(null);
  };

  const handleReject = async (ev) => {
    setActingId(ev.id);
    try {
      if (ev.type === 'timecard') {
        await corpsData.CoreTimecardEntry.update(ev.id, { status: 'rejected' });
      } else if (ev.type === 'timeoff') {
        await corpsData.CoreTimeOffRequest.update(ev.id, { status: 'denied' });
      }
      queryClient.invalidateQueries(['core-timeline-timecard', user?.email]);
      queryClient.invalidateQueries(['core-timeline-timeoff', user?.email]);
    } catch (e) {
      console.error('Timeline action failed:', e);
    }
    setActingId(null);
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !noteFor) return;
    setActingId(noteFor.id);
    try {
      await base44.entities.Note.create({
        entity_type: noteFor.type,
        entity_id: noteFor.id,
        content: noteText.trim(),
        author_email: user?.email,
      });
      setNoteText('');
      setNoteFor(null);
    } catch (e) {
      console.error('Note creation failed:', e);
    }
    setActingId(null);
  };

  return (
    <div className="spot-panel bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">UNIFIED FEED</p>
          <h3 className="text-lg font-bold text-gray-900">Action Timeline</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            Click-to-act
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev, i) => {
            const cfg = typeConfig[ev.type];
            const Icon = cfg.icon;
            const isPending = ev.status === 'pending';
            const isResolved = ev.status === 'approved' || ev.status === 'rejected' || ev.status === 'denied';
            const isActing = actingId === ev.id;

            return (
              <div
                key={i}
                className={`group flex items-center gap-3 rounded-lg p-2 transition-colors ${
                  isPending ? 'hover:bg-gray-50' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                  <p className="text-xs text-gray-400 truncate">{ev.sub}</p>
                </div>

                {/* Inline action zone — only for pending items */}
                {isPending && !isResolved && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleApprove(ev)}
                      disabled={isActing}
                      className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(ev)}
                      disabled={isActing}
                      className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                      Reject
                    </button>
                    <button
                      onClick={() => setNoteFor(ev)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      Note
                    </button>
                  </div>
                )}

                {/* Status badge for resolved items */}
                {isResolved && (
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-md flex-shrink-0 ${
                    ev.status === 'approved' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                  }`}>
                    {ev.status === 'approved' ? '✓' : '✗'} {ev.status}
                  </span>
                )}

                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {ev.date ? format(new Date(ev.date), 'MMM d') : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline note composer */}
      {noteFor && (
        <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-lg p-2">
          <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            placeholder={`Add note to "${noteFor.title}"...`}
            className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-700 placeholder-gray-400"
            autoFocus
          />
          <button
            onClick={handleAddNote}
            disabled={actingId === noteFor.id}
            className="text-[10px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
          >
            {actingId === noteFor.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
          </button>
          <button
            onClick={() => { setNoteFor(null); setNoteText(''); }}
            className="text-[10px] font-semibold text-gray-500 hover:text-gray-700 px-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}