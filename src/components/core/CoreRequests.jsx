import React, { useState } from 'react';
import { useUser } from '@/components/hooks/useUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

const REQUEST_TYPES = ['Vacation', 'Sick Leave', 'Personal Day', 'Bereavement', 'Other'];

export default function CoreRequests() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ request_type: 'Vacation', start_date: '', end_date: '', notes: '' });

  const { data: requests = [] } = useQuery({
    queryKey: ['core-requests', user?.email],
    queryFn: () => base44.entities.CoreTimeOffRequest.filter({ employee_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CoreTimeOffRequest.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['core-requests'] }); setShowForm(false); setForm({ request_type: 'Vacation', start_date: '', end_date: '', notes: '' }); },
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-600 border border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-600 border border-yellow-200';
      case 'denied': return 'bg-red-50 text-red-500 border border-red-200';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">TIME OFF</p>
          <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* Requests list */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-gray-400">No requests yet</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-semibold text-gray-800">{req.request_type}</h4>
                  <span className={`text-xs font-semibold px-3 py-0.5 rounded-full uppercase ${getStatusStyle(req.status)}`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {format(new Date(req.start_date), 'MMM d')} – {format(new Date(req.end_date), 'MMM d, yyyy')}
                </p>
                {req.notes && <p className="text-xs text-gray-400 mt-1 italic">{req.notes}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Submitted</p>
                <p className="text-sm font-medium text-gray-600">{format(new Date(req.created_date), 'MMM d, yyyy')}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New request modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request Time Off</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
                <select value={form.request_type} onChange={e => setForm(f => ({ ...f, request_type: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white">
                  {REQUEST_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => createMutation.mutate({ ...form, employee_email: user?.email, status: 'pending' })}
                disabled={!form.start_date || !form.end_date}
                className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}