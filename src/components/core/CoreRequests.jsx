import React, { useState } from 'react';
import { useUser } from '@/components/hooks/useUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Plus, X, Calendar } from 'lucide-react';

const REQUEST_TYPES = ['Vacation', 'Sick', 'Personal', 'Bereavement', 'Jury Duty', 'Unpaid'];

export default function CoreRequests() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ request_type: 'Vacation', start_date: '', end_date: '', total_hours: 8, notes: '' });

  const { data: requests = [] } = useQuery({
    queryKey: ['core-requests', user?.email],
    queryFn: () => base44.entities.CoreTimeOffRequest.filter({ employee_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CoreTimeOffRequest.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['core-requests'] }); setShowForm(false); setForm({ request_type: 'Vacation', start_date: '', end_date: '', total_hours: 8, notes: '' }); },
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-600 border border-green-200';
      case 'pending': return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'denied': return 'bg-red-50 text-red-500 border border-red-200';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const stats = [
    { label: 'VACATION', value: '82', unit: 'hrs' },
    { label: 'SICK', value: '40', unit: 'hrs' },
    { label: 'PERSONAL', value: '16', unit: 'hrs' },
    { label: 'PENDING', value: String(pendingCount), unit: '' },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">TIME OFF</p>
          <h1 className="text-3xl font-bold text-gray-900">Requests</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-full text-sm font-semibold shadow-md hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, unit }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value} {unit && <span className="text-sm font-normal text-gray-400">{unit}</span>}</p>
          </div>
        ))}
      </div>

      {/* New request form (inline) */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">NEW REQUEST</p>
              <h3 className="text-xl font-bold text-gray-900">Request Time Off</h3>
            </div>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {REQUEST_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, request_type: t }))}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                      form.request_type === t
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</label>
                <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End Date</label>
                <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Hours</label>
              <input type="number" value={form.total_hours} onChange={e => setForm(f => ({ ...f, total_hours: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason (Optional)</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Add a note for your manager..."
                className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none" />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
            <button
              onClick={() => createMutation.mutate({ employee_email: user?.email, request_type: form.request_type, start_date: form.start_date, end_date: form.end_date, notes: form.notes, status: 'pending' })}
              disabled={!form.start_date || !form.end_date}
              className="flex-1 py-3 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            >
              Submit Request
            </button>
          </div>
        </div>
      )}

      {/* All requests */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">ALL REQUESTS ({requests.length})</p>
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <p className="text-gray-400">No requests yet.</p>
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-0.5">
                    <h4 className="font-semibold text-gray-800">{req.request_type}</h4>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${getStatusStyle(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {format(new Date(req.start_date), 'MMM d')} – {format(new Date(req.end_date), 'MMM d, yyyy')}
                  </p>
                  {req.notes && <p className="text-xs text-gray-400 mt-1 italic">{req.notes}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}