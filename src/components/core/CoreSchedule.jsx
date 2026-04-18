import React, { useState } from 'react';
import { useUser } from '@/components/hooks/useUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function CoreSchedule() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showAdd, setShowAdd] = useState(false);
  const [newShift, setNewShift] = useState({ shift_date: '', start_time: '09:00', end_time: '17:00', shift_name: 'Software Team', notes: '' });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: shifts = [] } = useQuery({
    queryKey: ['core-shifts-all', user?.email, format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => base44.entities.CoreShift.filter({ employee_email: user?.email }, 'shift_date'),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CoreShift.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['core-shifts-all'] }); setShowAdd(false); },
  });

  const weekShifts = shifts.filter(s => {
    const d = new Date(s.shift_date);
    return d >= weekStart && d <= addDays(weekStart, 6);
  });

  const getShiftsForDay = (date) => weekShifts.filter(s => s.shift_date === format(date, 'yyyy-MM-dd'));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">SCHEDULE</p>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Shift
        </button>
      </div>

      {/* Week nav */}
      <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
        <button onClick={() => setWeekStart(w => addDays(w, -7))} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <p className="font-semibold text-gray-800">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </p>
        <button onClick={() => setWeekStart(w => addDays(w, 7))} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-3">
        {days.map((day) => {
          const dayShifts = getShiftsForDay(day);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          return (
            <div key={day.toISOString()} className={`bg-white rounded-2xl p-3 shadow-sm min-h-[120px] ${isToday ? 'ring-2 ring-purple-300' : ''}`}>
              <p className={`text-xs font-bold uppercase mb-1 ${isToday ? 'text-purple-600' : 'text-gray-400'}`}>{format(day, 'EEE')}</p>
              <p className={`text-2xl font-bold mb-2 ${isToday ? 'text-purple-700' : 'text-gray-800'}`}>{format(day, 'd')}</p>
              {dayShifts.length === 0 ? (
                <p className="text-xs text-gray-300 italic">Off</p>
              ) : (
                dayShifts.map(s => (
                  <div key={s.id} className="bg-purple-50 rounded-lg p-2 mb-1">
                    <p className="text-xs font-semibold text-purple-700 truncate">{s.shift_name}</p>
                    <p className="text-xs text-purple-400">{s.start_time} – {s.end_time}</p>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* Add shift modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Shift</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Date</label>
                <input type="date" value={newShift.shift_date} onChange={e => setNewShift(s => ({ ...s, shift_date: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Start</label>
                  <input type="time" value={newShift.start_time} onChange={e => setNewShift(s => ({ ...s, start_time: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">End</label>
                  <input type="time" value={newShift.end_time} onChange={e => setNewShift(s => ({ ...s, end_time: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Shift Name</label>
                <input type="text" value={newShift.shift_name} onChange={e => setNewShift(s => ({ ...s, shift_name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => createMutation.mutate({ ...newShift, employee_email: user?.email, status: 'scheduled' })}
                className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}