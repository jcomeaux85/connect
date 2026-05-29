import React, { useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/components/hooks/useUser";
import { Link } from "react-router-dom";
import { Phone, PhoneIncoming, CheckSquare, Clock } from "lucide-react";
import { isToday, parseISO } from "date-fns";
import AgentCallTimeline from "@/components/dashboard/AgentCallTimeline";
import ShiftFlowTimeline from "@/components/dashboard/ShiftFlowTimeline";
import CallQueuePanel from "@/components/dashboard/CallQueuePanel";
import AgentActivityPanel from "@/components/dashboard/AgentActivityPanel";
import AIInsightsPanel from "@/components/dashboard/AIInsightsPanel";
import StatSlidePanel from "@/components/dashboard/StatSlidePanel";
import { useTheme } from "@/components/ThemeProvider";


// Tilt card with glare
function TiltCard({ children, onClick, className, style }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ mx: 50, my: 50, op: 0 });
  const [locked, setLocked] = useState(false);

  const onMove = useCallback((e) => {
    if (locked) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width - 0.5;
    const fy = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -fy * 10, y: fx * 10 });
    setGlare({ mx: (fx + 0.5) * 100, my: (fy + 0.5) * 100, op: 0.12 });
  }, [locked]);

  const onLeave = useCallback(() => {
    if (locked) return;
    setTilt({ x: 0, y: 0 });
    setGlare(g => ({ ...g, op: 0 }));
  }, [locked]);

  const handleClick = useCallback(() => {
    setLocked(true);
    setTilt({ x: 0, y: 0 });
    setGlare(g => ({ ...g, op: 0 }));
    onClick && onClick();
    // Unlock after panel closes (user will click away)
    setTimeout(() => setLocked(false), 300);
  }, [onClick]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        transform: locked ? 'perspective(600px) rotateX(0deg) rotateY(0deg)' : `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
        willChange: 'transform',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={handleClick}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: `radial-gradient(circle at ${glare.mx}% ${glare.my}%, rgba(255,255,255,${glare.op}) 0%, transparent 60%)`,
        transition: 'opacity 0.15s',
      }} />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data: user } = useUser();
  const { isDark } = useTheme();
  const [openPanel, setOpenPanel] = useState(null); // statType string

  const pageBg = isDark ? '#1a1d27' : '#f3f4f6';
  const cardBg = isDark ? '#23263a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const textPrimary = isDark ? '#f0f0f0' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const textTertiary = isDark ? '#6b7280' : '#9ca3af';

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

  const activeCases = cases.filter(c => c.status !== 'closed' && c.status !== 'resolved');
  const inQueueCases = cases.filter(c => c.status === 'new');
  const resolvedTodayCases = cases.filter(c => c.status === 'resolved' && c.updated_date && isToday(parseISO(c.updated_date)));
  const todayCalls = calls.filter(c => c.created_date && isToday(parseISO(c.created_date)));

  const avgHandleTime = todayCalls.length > 0
    ? todayCalls.reduce((a, c) => a + (c.duration || 0), 0) / todayCalls.length
    : 0;
  const avgMin = Math.floor(avgHandleTime / 60);
  const avgSec = Math.floor(avgHandleTime % 60);

  const stats = [
    {
      label: 'Active Calls', value: activeCases.length, sub: `${inQueueCases.length} on hold`,
      change: '+12%', changePos: true, color: '#7C3AED', icon: Phone,
      panelData: activeCases,
    },
    {
      label: 'In Queue', value: inQueueCases.length, sub: 'Avg wait 1:34',
      change: '-8%', changePos: false, color: '#3B82F6', icon: PhoneIncoming,
      panelData: inQueueCases,
    },
    {
      label: 'Resolved Today', value: resolvedTodayCases.length || 127, sub: '94% satisfaction',
      change: '+23%', changePos: true, color: '#10B981', icon: CheckSquare,
      panelData: resolvedTodayCases,
    },
    {
      label: 'Avg Handle Time', value: `${avgMin || 4}:${String(avgSec || 32).padStart(2, '0')}`,
      sub: 'Target: 5:00', change: '-15%', changePos: false, color: '#F59E0B', icon: Clock,
      panelData: todayCalls,
    },
  ];

  const panelDataMap = {};
  stats.forEach(s => { panelDataMap[s.label] = s.panelData; });

  return (
    <div className="min-h-full relative" style={{ background: pageBg, transition: 'background 0.3s' }}>
      {/* Hanging Nav */}
      <div className="flex justify-center py-1.5 border-b" style={{ borderColor: cardBorder }} onMouseMove={(e) => { const navRect = e.currentTarget.getBoundingClientRect(); const mouseX = e.clientX; const mouseY = e.clientY; const links = e.currentTarget.querySelectorAll('a'); links.forEach(link => { const rect = link.getBoundingClientRect(); const closestX = Math.max(rect.left, Math.min(mouseX, rect.right)); const closestY = Math.max(rect.top, Math.min(mouseY, rect.bottom)); const distance = Math.hypot(mouseX - closestX, mouseY - closestY); const proximity = Math.max(0, 1 - distance / 150); link.style.color = `rgba(255,255,255,${0.4 + proximity * 0.6})`; link.style.textShadow = `-0.5px -0.5px 0 #4338ca, 0.5px -0.5px 0 #4338ca, -0.5px 0.5px 0 #4338ca, 0.5px 0.5px 0 #4338ca, 0 0 ${proximity * 20}px #00d4ff`; }); }} onMouseLeave={(e) => { const links = e.currentTarget.querySelectorAll('a'); links.forEach(link => { link.style.color = textPrimary; link.style.textShadow = '0 0 1px rgba(255,255,255,0.3)'; }); }}>
        <div className="flex gap-16 w-4/5 justify-center">
          <Link to="/Cases" className="text-base font-semibold tracking-widest transition-all duration-300" style={{ color: textPrimary, textShadow: '0 0 1px rgba(255,255,255,0.3)' }}>CASES</Link>
          <Link to="/Tasks" className="text-base font-semibold tracking-widest transition-all duration-300" style={{ color: textPrimary, textShadow: '0 0 1px rgba(255,255,255,0.3)' }}>TASKS</Link>
          <Link to="/Customers" className="text-base font-semibold tracking-widest transition-all duration-300" style={{ color: textPrimary, textShadow: '0 0 1px rgba(255,255,255,0.3)' }}>CUSTOMERS</Link>
          <Link to="/Phone" className="text-base font-semibold tracking-widest transition-all duration-300" style={{ color: textPrimary, textShadow: '0 0 1px rgba(255,255,255,0.3)' }}>PHONE</Link>
          <Link to="/Messages" className="text-base font-semibold tracking-widest transition-all duration-300" style={{ color: textPrimary, textShadow: '0 0 1px rgba(255,255,255,0.3)' }}>MESSAGES</Link>
          <Link to="/Timeline" className="text-base font-semibold tracking-widest transition-all duration-300" style={{ color: textPrimary, textShadow: '0 0 1px rgba(255,255,255,0.3)' }}>TIMELINE</Link>
        </div>
      </div>
      
      <div className="p-6 space-y-4" style={{ minHeight: 'calc(100% - 60px)' }}>
      {/* Hero video */}
      <video
        src="https://res.cloudinary.com/dfeelbckg/video/upload/q_auto/f_auto/v1776843080/ebmheader_uxcv5g.mp4"
        autoPlay muted playsInline
        className="w-full rounded-2xl object-cover"
        style={{ maxHeight: '180px', objectPosition: 'center' }}
      />

      {/* Shift timeline */}
      <ShiftFlowTimeline />

      {/* Stats row — tilt + click to open panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const StatIcon = s.icon;
          return (
            <TiltCard
              key={i}
              onClick={() => setOpenPanel(s.label)}
              className="rounded-2xl p-4"
              style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.07)', transition: 'background 0.3s' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}20` }}>
                  <StatIcon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <span className="text-xs font-bold" style={{ color: s.changePos ? '#10B981' : '#EF4444' }}>
                  {s.changePos ? '↑' : '↓'} {s.change}
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: textPrimary }}>{s.value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: textSecondary }}>{s.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: textTertiary }}>{s.sub}</p>
              <p className="text-[9px] mt-2 font-medium" style={{ color: s.color, opacity: 0.7 }}>Click to view →</p>
            </TiltCard>
          );
        })}
      </div>

      {/* Call Volume + Queue */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-4 relative flex flex-col" style={{ background: cardBg, borderTop: `1px solid ${cardBorder}`, borderLeft: `1px solid ${cardBorder}`, borderRight: `1px solid ${cardBorder}`, borderBottom: 'none', transition: 'background 0.3s', minHeight: '480px' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Call Volume — Today</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AgentCallTimeline incomingCalls={calls} />
          </div>
          {/* Chip left-justified, positioned at bottom */}
          <div className="absolute left-8 bottom-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', pointerEvents: 'none' }}>
           <img
             src="https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/c99f7b418_Gemini_Generated_Image_1hvf8a1hvf8a1hvf.png"
             alt="BenConnect chip"
             style={{ width: '300px', height: 'auto', opacity: 0.85 }}
           />
          </div>
        </div>
        <CallQueuePanel cases={cases} />
      </div>

      {/* Agent Activity + AI Insights */}
      <AgentActivityPanel users={users} currentUser={user} calls={calls} />
      <AIInsightsPanel />

      {/* Slide-out detail panel */}
      <StatSlidePanel
        open={!!openPanel}
        onClose={() => setOpenPanel(null)}
        statType={openPanel}
        data={panelDataMap[openPanel] || []}
      />
      </div>
    </div>
  );
}