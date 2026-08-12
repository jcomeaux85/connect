import React from 'react';
import { detectAnomalies } from '@/services/core/anomalyEngine';
import { AlertTriangle, AlertCircle, Info, ShieldCheck } from 'lucide-react';

const severityConfig = {
  high: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  medium: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400' },
};

// PayrollAlerts — proactive anomaly detection banner. Scans timecard
// entries the moment they load and surfaces problems by severity,
// so issues are caught at entry time, not at end-of-cycle.
export default function PayrollAlerts({ entries, shifts }) {
  const alerts = detectAnomalies({ entries, shifts });

  if (alerts.length === 0) {
    return (
      <div className="spot-panel bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">All clear</p>
            <p className="text-xs text-gray-400">No payroll anomalies detected.</p>
          </div>
        </div>
      </div>
    );
  }

  const highCount = alerts.filter((a) => a.severity === 'high').length;

  return (
    <div className="spot-panel bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-sm font-bold text-gray-900">Payroll Alerts</h3>
        </div>
        <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
          {alerts.length}{highCount > 0 ? ` · ${highCount} urgent` : ''}
        </span>
      </div>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((a, i) => {
          const cfg = severityConfig[a.severity];
          const Icon = cfg.icon;
          return (
            <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl ${cfg.bg} border ${cfg.border}`}>
              <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0 mt-0.5`} />
              <div className="min-w-0">
                <p className={`text-xs font-bold ${cfg.color}`}>{a.title}</p>
                <p className="text-xs text-gray-500 leading-snug">{a.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}