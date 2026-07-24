import React, { useState } from 'react';
import { useUser } from '@/components/hooks/useUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { corpsData } from '@/api/corpsData';
import { Search, Plus, Edit3, Trash2, User } from 'lucide-react';

export default function CoreTeam() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', position: '', department: '', phone: '', hire_date: '', employee_id: '', pay_type: 'Salaried', pay_frequency: 'Bi-weekly', health_plan: '', pto_balance: 80, ytd_earnings: 0 });

  const { data: employees = [] } = useQuery({
    queryKey: ['core-employees-all'],
    queryFn: () => corpsData.CoreEmployee.list('full_name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => corpsData.CoreEmployee.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['core-employees-all'] }); setShowAdd(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => corpsData.CoreEmployee.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['core-employees-all'] }); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => corpsData.CoreEmployee.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['core-employees-all'] }),
  });

  const resetForm = () => setForm({ full_name: '', email: '', position: '', department: '', phone: '', hire_date: '', employee_id: '', pay_type: 'Salaried', pay_frequency: 'Bi-weekly', health_plan: '', pto_balance: 80, ytd_earnings: 0 });

  const filtered = employees.filter(e =>
    !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase()) ||
    e.position?.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'E';

  const EmployeeForm = ({ onSave, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Full Name', key: 'full_name' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Position', key: 'position' },
            { label: 'Department', key: 'department' },
            { label: 'Phone', key: 'phone' },
            { label: 'Employee ID', key: 'employee_id' },
            { label: 'Hire Date', key: 'hire_date', type: 'date' },
            { label: 'PTO Balance (hrs)', key: 'pto_balance', type: 'number' },
            { label: 'YTD Earnings ($)', key: 'ytd_earnings', type: 'number' },
            { label: 'Health Plan', key: 'health_plan' },
          ].map(({ label, key, type = 'text' }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-400 uppercase">{label}</label>
              <input type={type} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase">Pay Type</label>
            <select value={form.pay_type} onChange={e => setForm(f => ({ ...f, pay_type: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200">
              <option>Salaried</option><option>Hourly</option><option>Contract</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase">Pay Frequency</label>
            <select value={form.pay_frequency} onChange={e => setForm(f => ({ ...f, pay_frequency: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200">
              <option>Weekly</option><option>Bi-weekly</option><option>Semi-monthly</option><option>Monthly</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onSave} className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">
            {editingId ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">PEOPLE</p>
          <h1 className="text-3xl font-bold text-gray-900">My Team</h1>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => { resetForm(); setEditingId(null); setShowAdd(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team by name, role, department..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 shadow-sm" />
      </div>

      {/* Employee grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-gray-400">No team members found.</p>
          </div>
        ) : (
          filtered.map(emp => (
            <div key={emp.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {getInitials(emp.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{emp.full_name}</h4>
                  <p className="text-xs text-gray-500 truncate">{emp.position} {emp.department ? `· ${emp.department}` : ''}</p>
                  <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setForm({ ...emp }); setEditingId(emp.id); setShowAdd(true); }}
                      className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100">
                      <Edit3 className="w-3 h-3 text-gray-500" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(emp.id)}
                      className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-red-50">
                      <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-gray-400">Employee ID</p>
                  <p className="font-semibold text-gray-700">{emp.employee_id || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-gray-400">PTO Balance</p>
                  <p className="font-semibold text-gray-700">{emp.pto_balance || 0} hrs</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-gray-400">Pay Type</p>
                  <p className="font-semibold text-gray-700">{emp.pay_type || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-gray-400">Hire Date</p>
                  <p className="font-semibold text-gray-700">{emp.hire_date || '—'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <EmployeeForm
          onSave={() => {
            const data = { ...form, pto_balance: parseFloat(form.pto_balance) || 0, ytd_earnings: parseFloat(form.ytd_earnings) || 0 };
            if (editingId) updateMutation.mutate({ id: editingId, data });
            else createMutation.mutate(data);
          }}
          onCancel={() => { setShowAdd(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}