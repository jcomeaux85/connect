import React, { useState } from 'react';
import { useUser } from '@/components/hooks/useUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Download, Plus } from 'lucide-react';

export default function CorePay() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ pay_period_start: '', pay_period_end: '', gross_pay: '', net_pay: '', hours_worked: '', pay_date: '' });

  const { data: paystubs = [] } = useQuery({
    queryKey: ['core-pay', user?.email],
    queryFn: () => base44.entities.CorePaystub.filter({ employee_email: user?.email }, '-pay_date'),
    enabled: !!user?.email,
  });

  const { data: employeeProfile } = useQuery({
    queryKey: ['core-employee', user?.email],
    queryFn: async () => {
      const r = await base44.entities.CoreEmployee.filter({ email: user?.email });
      return r[0] || null;
    },
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CorePaystub.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['core-pay'] }); setShowAdd(false); },
  });

  const ytdEarnings = paystubs.reduce((s, p) => s + (p.gross_pay || 0), 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">COMPENSATION</p>
          <h1 className="text-2xl font-bold text-gray-900">Pay</h1>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">
            <Plus className="w-4 h-4" /> Add Paystub
          </button>
        )}
      </div>

      {/* YTD summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">YTD GROSS</p>
          <p className="text-2xl font-bold text-gray-900">${ytdEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">PAY TYPE</p>
          <p className="text-2xl font-bold text-gray-900">{employeeProfile?.pay_type || 'Salaried'}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">FREQUENCY</p>
          <p className="text-2xl font-bold text-gray-900">{employeeProfile?.pay_frequency || 'Bi-weekly'}</p>
        </div>
      </div>

      {/* Paystubs */}
      <div className="space-y-3">
        {paystubs.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-gray-400">No paystubs available</p>
          </div>
        ) : (
          paystubs.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">
                  Pay Period: {p.pay_period_start && format(new Date(p.pay_period_start), 'MMM d')} – {p.pay_period_end && format(new Date(p.pay_period_end), 'MMM d, yyyy')}
                </h4>
                <p className="text-sm text-gray-400 mt-0.5">Pay Date: {p.pay_date && format(new Date(p.pay_date), 'MMM d, yyyy')} · {p.hours_worked} hrs</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Gross / Net</p>
                <p className="font-bold text-gray-900">${(p.gross_pay || 0).toLocaleString()} / ${(p.net_pay || 0).toLocaleString()}</p>
              </div>
              <button className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 ml-2">
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Add Paystub</h3>
            <div className="space-y-3">
              {[
                { label: 'Period Start', key: 'pay_period_start', type: 'date' },
                { label: 'Period End', key: 'pay_period_end', type: 'date' },
                { label: 'Pay Date', key: 'pay_date', type: 'date' },
                { label: 'Gross Pay ($)', key: 'gross_pay', type: 'number' },
                { label: 'Net Pay ($)', key: 'net_pay', type: 'number' },
                { label: 'Hours Worked', key: 'hours_worked', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
              <button onClick={() => createMutation.mutate({ ...form, employee_email: user?.email, gross_pay: parseFloat(form.gross_pay), net_pay: parseFloat(form.net_pay), hours_worked: parseFloat(form.hours_worked) })}
                className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}