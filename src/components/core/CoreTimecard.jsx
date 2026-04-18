import React, { useState } from 'react';
import { useUser } from '@/components/hooks/useUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, CheckCircle } from 'lucide-react';

export default function CoreTimecard() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const [periodStart, setPeriodStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const periodEnd = addDays(periodStart, 6);
  const periodLabel = `${format(periodStart, 'MMM d')} – ${format(periodEnd, 'MMM d, yyyy')}`;

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['core-timecard', user?.email, format(periodStart, 'yyyy-MM-dd')],
    queryFn: () => base44.entities.CoreTimecardEntry.filter({ employee_email: user?.email }, 'work_date'),
    enabled: !!user?.email,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CoreTimecardEntry.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['core-timecard'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CoreTimecardEntry.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['core-timecard'] }),
  });

  const periodEntries = entries.filter(e => {
    const d = new Date(e.work_date);
    return d >= periodStart && d <= periodEnd;
  });

  const regularHours = periodEntries.filter(e => e.entry_type !== 'overtime').reduce((s, e) => s + (e.hours || 0), 0);
  const overtimeHours = periodEntries.filter(e => e.entry_type === 'overtime').reduce((s, e) => s + (e.hours || 0), 0);
  const totalHours = regularHours + overtimeHours;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-600 border border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-600 border border-yellow-200';
      case 'rejected': return 'bg-red-50 text-red-500 border border-red-200';
      default: return 'bg-gray-50 text-gray-500 border border-gray-200';
    }
  };

  // Generate all 7 days in period
  const allDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(periodStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = periodEntries.find(e => e.work_date === dateStr);
    return { date, dateStr, entry };
  });

  const handleSubmitApproval = async () => {
    for (const e of periodEntries.filter(e => e.status === 'pending')) {
      await updateMutation.mutateAsync({ id: e.id, data: { status: 'submitted' } });
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">TIMECARD</p>
          <h1 className="text-2xl font-bold text-gray-900">My Timecard</h1>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleSubmitApproval}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Submit for Approval
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <button
          onClick={() => setPeriodStart(p => subDays(p, 7))}
          className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">PAY PERIOD</p>
          <p className="font-bold text-gray-900">{periodLabel}</p>
        </div>
        <button
          onClick={() => setPeriodStart(p => addDays(p, 7))}
          className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex gap-8 ml-auto text-center">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">REGULAR</p>
            <p className="text-xl font-bold text-gray-900">{regularHours.toFixed(1)} <span className="text-sm font-normal text-gray-400">hrs</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">OVERTIME</p>
            <p className="text-xl font-bold text-gray-900">{overtimeHours.toFixed(1)} <span className="text-sm font-normal text-gray-400">hrs</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">TOTAL</p>
            <p className="text-xl font-bold text-gray-900">{totalHours.toFixed(1)} <span className="text-sm font-normal text-gray-400">hrs</span></p>
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {allDays.map(({ date, dateStr, entry }) => (
          <div key={dateStr} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="text-center w-12 flex-shrink-0">
              <p className="text-xs font-bold text-gray-400 uppercase">{format(date, 'EEE')}</p>
              <p className="text-2xl font-bold text-gray-800">{format(date, 'd')}</p>
            </div>
            <div className="flex-1 flex items-center gap-4">
              {entry ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-mono">{entry.clock_in} – {entry.clock_out}</span>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase ${getStatusStyle(entry.status)}`}>
                    {entry.status}
                  </span>
                  <span className="text-sm text-gray-400 capitalize">{entry.entry_type || 'Regular'}</span>
                </>
              ) : (
                <span className="text-sm text-gray-300 italic">No entry</span>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {entry && (
                <>
                  <p className="text-xs text-gray-400 uppercase font-semibold">HOURS</p>
                  <p className="text-xl font-bold text-gray-900">{(entry.hours || 0).toFixed(1)}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}