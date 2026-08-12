import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { corpsData } from '@/api/corpsData';
import { computeLivePay } from '@/services/core/livePayEngine';
import { TrendingUp, Zap } from 'lucide-react';

// LivePayPreview — shows projected gross/net for the current pay period,
// updating the moment timecard entries change. Self-contained: fetches
// its own employee profile + prior paystubs so the parent only passes
// the current entries + user email.
export default function LivePayPreview({ entries, userEmail }) {
  const { data: employee } = useQuery({
    queryKey: ['core-employee', userEmail],
    queryFn: async () => {
      const results = await corpsData.CoreEmployee.filter({ email: userEmail });
      return results[0] || null;
    },
    enabled: !!userEmail,
  });

  const { data: paystubs = [] } = useQuery({
    queryKey: ['core-paystubs-live', userEmail],
    queryFn: () => corpsData.CorePaystub.filter({ employee_email: userEmail }, '-pay_date', 26),
    enabled: !!userEmail,
  });

  const live = computeLivePay({ entries, employee, paystubs });

  return (
    <div className="spot-panel bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> LIVE PREVIEW
          </p>
          <h3 className="text-lg font-bold text-gray-900">Projected Pay</h3>
        </div>
        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-purple-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-xl bg-gray-50">
          <p className="text-[10px] text-gray-400 uppercase font-semibold">GROSS</p>
          <p className="text-2xl font-bold text-gray-900">${live.gross.toFixed(2)}</p>
        </div>
        <div className="p-3 rounded-xl bg-green-50">
          <p className="text-[10px] text-gray-400 uppercase font-semibold">NET</p>
          <p className="text-2xl font-bold text-green-600">${live.net.toFixed(2)}</p>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Regular ({live.regular.toFixed(1)}h × ${live.hourlyRate})</span>
          <span className="text-gray-600 font-medium">${(live.regular * live.hourlyRate).toFixed(2)}</span>
        </div>
        {live.overtime > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Overtime ({live.overtime.toFixed(1)}h ×${(live.hourlyRate * 1.5).toFixed(0)})</span>
            <span className="text-gray-600 font-medium">${(live.overtime * live.hourlyRate * 1.5).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-400">Total Tax</span>
          <span className="text-red-400 font-medium">-${live.taxes.total.toFixed(2)}</span>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-gray-300 leading-snug">
        Updates live as timecard entries change — no batch run needed.
      </p>
    </div>
  );
}