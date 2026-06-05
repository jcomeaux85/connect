import React, { useState, useEffect } from 'react';
import { useUser } from '@/components/hooks/useUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, FileText, CreditCard, User, Play, Square, Cloud } from 'lucide-react';

const quickActions = [
  { id: 'requests', label: 'Request Time Off', icon: FileText, color: 'text-teal-500' },
  { id: 'timecard', label: 'View Timecard', icon: Clock, color: 'text-blue-500' },
  { id: 'pay', label: 'Latest Paystub', icon: CreditCard, color: 'text-purple-500' },
  { id: 'my-info', label: 'Update Profile', icon: User, color: 'text-orange-500' },
];

export default function CoreDashboard({ onNavigate }) {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const [time, setTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(() => !!localStorage.getItem('core-clock-in-time'));
  const [clockInTime, setClockInTime] = useState(() => localStorage.getItem('core-clock-in-time'));
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isClockedIn || !clockInTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(clockInTime)) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  const { data: timecardEntries = [] } = useQuery({
    queryKey: ['core-timecard-entries', user?.email],
    queryFn: () => base44.entities.CoreTimecardEntry.filter({ employee_email: user?.email }, '-work_date', 14),
    enabled: !!user?.email,
  });

  const { data: employeeProfile } = useQuery({
    queryKey: ['core-employee', user?.email],
    queryFn: async () => {
      const results = await base44.entities.CoreEmployee.filter({ email: user?.email });
      return results[0] || null;
    },
    enabled: !!user?.email,
  });

  const handleClockIn = () => {
    const now = new Date().toISOString();
    localStorage.setItem('core-clock-in-time', now);
    setClockInTime(now);
    setIsClockedIn(true);
  };

  const handleClockOut = async () => {
    const inTime = new Date(clockInTime);
    const outTime = new Date();
    const hours = ((outTime - inTime) / 3600000).toFixed(2);
    localStorage.removeItem('core-clock-in-time');
    setIsClockedIn(false);
    setClockInTime(null);
    setElapsed(0);

    await base44.entities.CoreTimecardEntry.create({
      employee_email: user?.email,
      work_date: format(inTime, 'yyyy-MM-dd'),
      clock_in: format(inTime, 'HH:mm'),
      clock_out: format(outTime, 'HH:mm'),
      hours: parseFloat(hours),
      status: 'pending',
      entry_type: 'regular',
    });
    queryClient.invalidateQueries({ queryKey: ['core-timecard-entries'] });
  };

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  // Stats
  const weekHours = timecardEntries.slice(0, 7).reduce((s, e) => s + (e.hours || 0), 0);
  const ptoBalance = employeeProfile?.pto_balance || 82;
  const overtime = timecardEntries.slice(0, 7).reduce((s, e) => s + (e.entry_type === 'overtime' ? e.hours || 0 : 0), 0);
  const ytdEarnings = employeeProfile?.ytd_earnings || 58420;

  // Chart data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = days.map((day, i) => ({
    day,
    hours: timecardEntries[6 - i]?.hours || 0,
  })).reverse();

  // Upcoming shifts (mock from schedule)
  const { data: shifts = [] } = useQuery({
    queryKey: ['core-shifts', user?.email],
    queryFn: () => base44.entities.CoreShift.filter({ employee_email: user?.email }, 'shift_date', 5),
    enabled: !!user?.email,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
          {format(time, 'EEEE')}
        </p>
        <h1 className="text-3xl font-bold text-gray-900">{greeting()}, {firstName}..</h1>
        <p className="text-gray-400 mt-1">Here's your workforce overview for today.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Clock widget */}
        <div className="spot-panel col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            {isClockedIn ? 'TIME ELAPSED' : 'READY TO START'}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-bold text-gray-900 tracking-tight">
                {isClockedIn
                  ? formatElapsed(elapsed)
                  : format(time, 'h:mm:ss')}
                <span className="text-2xl font-normal text-gray-400 ml-2">
                  {!isClockedIn && format(time, 'aa')}
                </span>
              </div>
              <p className="text-gray-400 mt-2 text-sm">{format(time, 'EEEE, MMMM d, yyyy')}</p>
              {isClockedIn && clockInTime && (
                <p className="text-xs text-gray-400 mt-1">Clocked in at {format(new Date(clockInTime), 'h:mm a')}</p>
              )}
            </div>
            <button
              onClick={isClockedIn ? handleClockOut : handleClockIn}
              className={`flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold text-lg shadow-lg transition-all hover:scale-105 ${
                isClockedIn
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
              style={{ background: isClockedIn ? undefined : 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            >
              {isClockedIn ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <Cloud className="w-4 h-4" />
            <span>72°F · Local conditions</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="spot-panel bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">SHORTCUTS</p>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all text-center"
              >
                <Icon className={`w-6 h-6 ${color}`} />
                <span className="text-xs font-medium text-gray-600 leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'HOURS THIS WEEK', value: `${weekHours.toFixed(1)} hrs`, change: '+4.2%', up: true },
          { label: 'PTO BALANCE', value: `${ptoBalance} hrs`, change: '-2%', up: false },
          { label: 'OVERTIME', value: `${overtime.toFixed(1)} hrs`, change: '+12%', up: true },
          { label: 'YTD EARNINGS', value: `$${ytdEarnings.toLocaleString()}`, change: '+3.1%', up: true },
        ].map(({ label, value, change, up }) => (
          <div key={label} className="spot-panel bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <span className={`text-xs font-semibold ${up ? 'text-green-500' : 'text-red-400'}`}>
                {up ? '↑' : '↓'} {change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Hours chart */}
        <div className="spot-panel col-span-2 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">THIS WEEK</p>
              <h3 className="text-lg font-bold text-gray-900">Hours Worked</h3>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{weekHours.toFixed(1)}</p>
              <p className="text-xs text-gray-400">/ 40 HRS</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'white', border: 'none', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v) => [`${v} hrs`, 'Hours']}
              />
              <Area type="monotone" dataKey="hours" stroke="#7c3aed" strokeWidth={2} fill="url(#hoursGrad)" dot={{ r: 4, fill: '#7c3aed' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming shifts */}
        <div className="spot-panel bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">SCHEDULE</p>
              <h3 className="text-lg font-bold text-gray-900">Upcoming Shifts</h3>
            </div>
            <button className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100">↗</button>
          </div>
          <div className="space-y-3">
            {shifts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No upcoming shifts</p>
            ) : (
              shifts.slice(0, 4).map((shift) => (
                <div key={shift.id} className="flex items-center gap-3">
                  <div className="text-center w-10 flex-shrink-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(shift.shift_date), 'MMM')}</p>
                    <p className="text-lg font-bold text-gray-800 leading-none">{format(new Date(shift.shift_date), 'd')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">{shift.shift_name || 'Scheduled'}</p>
                    <p className="text-xs text-gray-400">{shift.start_time} – {shift.end_time}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">SCHEDULED</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}