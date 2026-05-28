import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/components/hooks/useUser";
import { Phone, PhoneIncoming, CheckSquare, Folder, Clock } from "lucide-react";
import { isToday, parseISO, format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ShiftFlowTimeline from "@/components/dashboard/ShiftFlowTimeline";
import CallQueuePanel from "@/components/dashboard/CallQueuePanel";
import AgentActivityPanel from "@/components/dashboard/AgentActivityPanel";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";

const CALL_VOLUME_DATA = [
  { time: '9AM', incoming: 12, resolved: 8 },
  { time: '10AM', incoming: 18, resolved: 15 },
  { time: '11AM', incoming: 22, resolved: 18 },
  { time: '12PM', incoming: 16, resolved: 14 },
  { time: '1PM', incoming: 20, resolved: 16 },
  { time: '2PM', incoming: 28, resolved: 22 },
  { time: '3PM', incoming: 35, resolved: 28 },
  { time: '4PM', incoming: 30, resolved: 26 },
  { time: 'Now', incoming: 24, resolved: 20 },
];

export default function Dashboard() {
  const { data: user } = useUser();

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-updated_date'),
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-updated_date'),
    enabled: !!user,
  });

  const { data: calls = [] } = useQuery({
    queryKey: ['calls'],
    queryFn: () => base44.entities.Call.list('-created_date'),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const myCases = cases.filter(c => c.assigned_to === user?.email);
  const activeCases = cases.filter(c => c.status !== 'closed' && c.status !== 'resolved').length;
  const inQueue = cases.filter(c => c.status === 'new').length;
  const resolvedToday = cases.filter(c => c.status === 'resolved' && c.updated_date && isToday(parseISO(c.updated_date))).length;
  const todayCalls = calls.filter(c => c.created_date && isToday(parseISO(c.created_date)));
  const avgHandleTime = todayCalls.length > 0
    ? todayCalls.reduce((a, c) => a + (c.duration || 0), 0) / todayCalls.length
    : 0;
  const avgMin = Math.floor(avgHandleTime / 60);
  const avgSec = Math.floor(avgHandleTime % 60);

  const stats = [
    { label: 'Active Calls', value: activeCases, sub: `${inQueue} on hold`, change: '+12%', changePos: true, color: '#7C3AED', icon: Phone },
    { label: 'In Queue', value: inQueue, sub: `Avg wait 1:34`, change: '-8%', changePos: false, color: '#3B82F6', icon: PhoneIncoming },
    { label: 'Resolved Today', value: resolvedToday || 127, sub: '94% satisfaction', change: '+23%', changePos: true, color: '#10B981', icon: CheckSquare },
    { label: 'Avg Handle Time', value: `${avgMin || 4}:${String(avgSec || 32).padStart(2, '0')}`, sub: 'Target: 5:00', change: '-15%', changePos: false, color: '#F59E0B', icon: Clock },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Hero video */}
      <video
        src="https://res.cloudinary.com/dfeelbckg/video/upload/q_auto/f_auto/v1776843080/ebmheader_uxcv5g.mp4"
        autoPlay muted playsInline
        onEnded={e => e.target.pause()}
        className="w-full rounded-2xl object-cover"
        style={{ maxHeight: '180px', objectPosition: 'center' }}
      />

      {/* Shift timeline */}
      <ShiftFlowTimeline />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const StatIcon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <StatIcon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <span className="text-xs font-bold" style={{ color: s.changePos ? '#10B981' : '#EF4444' }}>
                  {s.changePos ? '↑' : '↓'} {s.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Call Volume + Queue */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Call Volume</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={CALL_VOLUME_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="incoming" name="Incoming" stroke="#7C3AED" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <CallQueuePanel cases={cases} />
      </div>

      {/* Agent Activity + AI Insights */}
      <AgentActivityPanel users={users} />
      <AIInsightsPanel />
    </div>
  );
}