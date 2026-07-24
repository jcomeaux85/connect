import React, { useState } from 'react';
import { useUser } from '@/components/hooks/useUser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { corpsData } from '@/api/corpsData';
import { Briefcase, Calendar, Shield, CreditCard, Heart, Edit3, Save, X } from 'lucide-react';

export default function CoreMyInfo() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['core-employee', user?.email],
    queryFn: async () => {
      const r = await corpsData.CoreEmployee.filter({ email: user?.email });
      return r[0] || null;
    },
    enabled: !!user?.email,
  });

  const [form, setForm] = useState(null);

  const startEdit = () => {
    setForm({
      position: profile?.position || '',
      department: profile?.department || '',
      hire_date: profile?.hire_date || '',
      employee_id: profile?.employee_id || '',
      pay_type: profile?.pay_type || 'Salaried',
      pay_frequency: profile?.pay_frequency || 'Bi-weekly',
      health_plan: profile?.health_plan || '',
      retirement_contribution: profile?.retirement_contribution || '',
      emergency_contact_name: profile?.emergency_contact_name || '',
      emergency_contact_phone: profile?.emergency_contact_phone || '',
      emergency_contact_relation: profile?.emergency_contact_relation || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    });
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (profile?.id) return corpsData.CoreEmployee.update(profile.id, data);
      return corpsData.CoreEmployee.create({ ...data, email: user?.email, full_name: user?.full_name });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['core-employee'] }); setEditing(false); },
  });

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const InfoRow = ({ label, value, icon: IconComp }) => (
    <div className="flex items-start gap-3">
      {IconComp && <IconComp className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );

  const EditField = ({ label, fieldKey, type = 'text' }) => (
    <div>
      <label className="text-xs font-semibold text-gray-400 uppercase">{label}</label>
      <input type={type} value={form?.[fieldKey] || ''} onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">PROFILE</p>
          <h1 className="text-3xl font-bold text-gray-900">My Information</h1>
        </div>
        {!editing ? (
          <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={() => saveMutation.mutate(form)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        )}
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
            <span className="text-xs font-semibold bg-green-50 text-green-600 border border-green-200 px-3 py-0.5 rounded-full">ACTIVE</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{profile?.position || 'Employee'} {profile?.department ? `• ${profile.department}` : ''}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400 flex-wrap">
            {user?.email && <span>✉ {user.email}</span>}
            {profile?.phone && <span>📞 {profile.phone}</span>}
            {profile?.address && <span>📍 {profile.address}</span>}
          </div>
        </div>
      </div>

      {!editing ? (
        <div className="grid grid-cols-2 gap-4">
          {/* Employment */}
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">EMPLOYMENT</h3>
            <InfoRow label="Position" value={profile?.position} icon={Briefcase} />
            <InfoRow label="Department" value={profile?.department} icon={Briefcase} />
            <InfoRow label="Hire Date" value={profile?.hire_date} icon={Calendar} />
            <InfoRow label="Employee ID" value={profile?.employee_id} icon={Shield} />
          </div>

          {/* Compensation */}
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">COMPENSATION</h3>
            <InfoRow label="Pay Rate" value={profile?.pay_type} icon={CreditCard} />
            <InfoRow label="Pay Frequency" value={profile?.pay_frequency} icon={Calendar} />
            <InfoRow label="Health Plan" value={profile?.health_plan} icon={Heart} />
            <InfoRow label="401(k)" value={profile?.retirement_contribution ? `${profile.retirement_contribution}% contribution` : null} icon={Shield} />
          </div>

          {/* Emergency Contact */}
          {(profile?.emergency_contact_name) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4 col-span-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">EMERGENCY CONTACT</h3>
              <div className="grid grid-cols-3 gap-4">
                <InfoRow label="Name" value={profile?.emergency_contact_name} />
                <InfoRow label="Phone" value={profile?.emergency_contact_phone} />
                <InfoRow label="Relationship" value={profile?.emergency_contact_relation} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">EMPLOYMENT</h3>
            <EditField label="Position" fieldKey="position" />
            <EditField label="Department" fieldKey="department" />
            <EditField label="Hire Date" fieldKey="hire_date" type="date" />
            <EditField label="Employee ID" fieldKey="employee_id" />
            <EditField label="Phone" fieldKey="phone" />
            <EditField label="Address" fieldKey="address" />
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">COMPENSATION & EMERGENCY</h3>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Pay Type</label>
              <select value={form?.pay_type || ''} onChange={e => setForm(f => ({ ...f, pay_type: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white">
                <option>Salaried</option><option>Hourly</option><option>Contract</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Pay Frequency</label>
              <select value={form?.pay_frequency || ''} onChange={e => setForm(f => ({ ...f, pay_frequency: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white">
                <option>Weekly</option><option>Bi-weekly</option><option>Semi-monthly</option><option>Monthly</option>
              </select>
            </div>
            <EditField label="Health Plan" fieldKey="health_plan" />
            <EditField label="401(k) Contribution %" fieldKey="retirement_contribution" />
            <EditField label="Emergency Contact Name" fieldKey="emergency_contact_name" />
            <EditField label="Emergency Contact Phone" fieldKey="emergency_contact_phone" />
            <EditField label="Emergency Relationship" fieldKey="emergency_contact_relation" />
          </div>
        </div>
      )}
    </div>
  );
}