import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Folder,
  CheckSquare,
  Phone,
  AlertCircle,
  Clock,
  User,
  Calendar as CalendarIcon,
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  MessageSquare,
  Search,
  Settings,
  Edit3
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isToday, parseISO } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";

import DailyPlanner from "../components/dashboard/DailyPlanner";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import DraggableDashboard from "../components/dashboard/DraggableDashboard";
import LayoutSelector from "../components/settings/LayoutSelector";
import { LayoutGrid } from 'lucide-react';


export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const { colors, getTransitionDuration } = useTheme();

  useEffect(() => {
    loadUser();
    loadWeather();
  }, []);

  const PROFILE_PHOTO = "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/77ac5f78c_kling_20260419__Could_you__3685_5.png";

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      // Set profile photo if not already set
      if (!userData.profile_photo_url) {
        await base44.auth.updateMe({ profile_photo_url: PROFILE_PHOTO });
        userData.profile_photo_url = PROFILE_PHOTO;
      }
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadWeather = async () => {
    try {
      // Get user's location (you can also use a default city)
      const response = await fetch('https://api.weatherapi.com/v1/current.json?key=demo&q=auto:ip');
      const data = await response.json();
      setWeather({
        temp: Math.round(data.current.temp_f),
        condition: data.current.condition.text,
        icon: data.current.condition.code
      });
    } catch (error) {
      // Fallback weather
      setWeather({ temp: 72, condition: 'Partly Cloudy', icon: 1003 });
    }
  };

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-updated_date'),
    enabled: !!user,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-updated_date'),
    enabled: !!user,
  });

  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['calls'],
    queryFn: () => base44.entities.Call.list('-created_date'),
    enabled: !!user,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-for-dashboard'],
    queryFn: () => base44.entities.Customer.list('-updated_date', 100),
    enabled: !!user,
  });

  // Filter data for current user
  const myCases = cases.filter(c => c.assigned_to === user?.email);
  const myTasks = tasks.filter(t => t.assigned_to === user?.email);

  // Calculate stats
  const activeCases = myCases.filter(c => c.status !== 'closed').length;
  const pendingTasks = myTasks.filter(t => t.status === 'pending').length;
  const todayCalls = calls.filter(call => {
    if (!call.created_date) return false;
    return isToday(parseISO(call.created_date));
  }).length;
  const urgentCases = myCases.filter(c => c.priority === 'urgent' && c.status !== 'closed').length;

  const stats = [
    {
      title: "Pending Tasks",
      value: pendingTasks,
      icon: CheckSquare,
      color: "#8B5CF6",
    },
    {
      title: "Today's Calls",
      value: todayCalls,
      icon: Phone,
      color: "#10B981",
    },
  ];

  const getWeatherIcon = (condition) => {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('rain')) return CloudRain;
    if (conditionLower.includes('snow')) return CloudSnow;
    if (conditionLower.includes('cloud')) return Cloud;
    return Sun;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.text }}></div>
          <p style={{ color: colors.textSecondary }}>Loading...</p>
        </div>
      </div>
    );
  }

  const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Sun;

  const greeting = `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}`;
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  // Define dashboard panels
  const dashboardPanels = [
    {
      id: 'planner',
      defaultWidth: 3,
      defaultHeight: 2,
      minWidth: 320,
      content: (
        <CollapsiblePanel
          title="Daily Planner"
          icon={CalendarIcon}
          storageKey="dashboard-planner"
          headerExtra={
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tabular-nums" style={{ color: colors.text }}>{format(new Date(), 'h:mm a')}</span>
                <span className="text-xs" style={{ color: colors.textSecondary }}>{format(new Date(), 'EEEE, MMM d')}</span>
                {weather && (
                  <>
                    <WeatherIcon className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} />
                    <span className="text-xs font-semibold" style={{ color: colors.text }}>{weather.temp}°</span>
                    <span className="text-xs" style={{ color: colors.textSecondary }}>{weather.condition}</span>
                  </>
                )}
              </div>
              <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{greeting}, {firstName}!</span>
              <Link to={createPageUrl("Cases")}>
                <button className="h-6 px-3 rounded-lg border-0 text-xs flex items-center gap-1.5" style={{ background: colors.bg, boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`, color: colors.textSecondary }}>
                  <Folder className="w-3 h-3" />Cases
                </button>
              </Link>
              <Link to={createPageUrl("Customers")}>
                <button className="h-6 px-3 rounded-lg border-0 text-xs flex items-center gap-1.5" style={{ background: colors.bg, boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`, color: colors.textSecondary }}>
                  <User className="w-3 h-3" />Customers
                </button>
              </Link>
            </div>
          }
          condensedContent={
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: colors.text }}>{activeCases} active cases</span>
            </div>
          }
        >
          <DailyPlanner user={user} greeting={`${greeting}, ${firstName}!`} activeCases={activeCases} urgentCases={0} />
        </CollapsiblePanel>
      )
    },
    // ── STAT ROW PANEL 1: Active Cases ──
    {
      id: 'stat-active-cases',
      defaultWidth: 1,
      defaultHeight: 1,
      content: (() => {
        const recentItems = myCases.filter(c => c.status !== 'closed').slice(0, 3).map(c => ({ id: c.id, label: c.customer_name || c.case_number, url: `Case?id=${c.id}` }));
        const hasValue = activeCases > 0;
        return (
          <CollapsiblePanel title="Active Cases" icon={Folder} storageKey="dashboard-stat-active-cases" accentColor={hasValue ? '#3B82F6' : null} largerIcon
            condensedContent={<span className="text-2xl font-bold" style={{ color: hasValue ? '#3B82F6' : colors.text }}>{activeCases}</span>}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1.5">
                {recentItems.length > 0 ? recentItems.map(item => (
                  <Link key={item.id} to={createPageUrl(item.url)}>
                    <div className="text-xs truncate py-1 px-2 rounded-lg hover:scale-[1.02] transition-all cursor-pointer" style={{ color: colors.textSecondary, background: colors.bg, boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}` }}>{item.label}</div>
                  </Link>
                )) : <p className="text-xs" style={{ color: colors.textTertiary }}>None</p>}
              </div>
              <h3 className="text-3xl font-bold" style={{ color: hasValue ? '#3B82F6' : colors.text }}>{activeCases}</h3>
            </div>
          </CollapsiblePanel>
        );
      })()
    },
    // ── STAT ROW PANEL 3: Pending Tasks ──
    {
      id: 'stat-pending-tasks',
      defaultWidth: 1,
      defaultHeight: 1,
      content: (() => {
        const recentItems = myTasks.filter(t => t.status === 'pending').slice(0, 3).map(t => ({ id: t.id, label: t.title, url: t.case_id ? `Case?id=${t.case_id}` : null }));
        const hasValue = pendingTasks > 0;
        return (
          <CollapsiblePanel title="Pending Tasks" icon={CheckSquare} storageKey="dashboard-stat-pending-tasks" accentColor={hasValue ? '#8B5CF6' : null} largerIcon
            condensedContent={<span className="text-2xl font-bold" style={{ color: hasValue ? '#8B5CF6' : colors.text }}>{pendingTasks}</span>}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1.5">
                {recentItems.length > 0 ? recentItems.map(item => (
                  item.url ? (
                    <Link key={item.id} to={createPageUrl(item.url)}>
                      <div className="text-xs truncate py-1 px-2 rounded-lg hover:scale-[1.02] transition-all cursor-pointer" style={{ color: colors.textSecondary, background: colors.bg, boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}` }}>{item.label}</div>
                    </Link>
                  ) : (
                    <div key={item.id} className="text-xs truncate py-1 px-2 rounded-lg" style={{ color: colors.textTertiary, background: colors.bg, boxShadow: `inset 1px 1px 2px ${colors.shadowDark}, inset -1px -1px 2px ${colors.shadowLight}` }}>{item.label}</div>
                  )
                )) : <p className="text-xs" style={{ color: colors.textTertiary }}>None</p>}
              </div>
              <h3 className="text-3xl font-bold" style={{ color: hasValue ? '#8B5CF6' : colors.text }}>{pendingTasks}</h3>
            </div>
          </CollapsiblePanel>
        );
      })()
    },
    // ── STAT ROW PANEL 4: Today's Calls ──
    {
      id: 'stat-todays-calls',
      defaultWidth: 1,
      defaultHeight: 1,
      content: (() => {
        const recentItems = calls.filter(call => call.created_date && isToday(parseISO(call.created_date))).slice(0, 3).map(c => {
          const relatedCase = cases.find(cs => cs.id === c.case_id);
          return { id: c.id, label: relatedCase?.customer_name || 'Unknown', url: c.case_id ? `Case?id=${c.case_id}` : null };
        });
        const hasValue = todayCalls > 0;
        return (
          <CollapsiblePanel title="Today's Calls" icon={Phone} storageKey="dashboard-stat-todays-calls" accentColor={hasValue ? '#10B981' : null} largerIcon
            condensedContent={<span className="text-2xl font-bold" style={{ color: hasValue ? '#10B981' : colors.text }}>{todayCalls}</span>}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1.5">
                {recentItems.length > 0 ? recentItems.map(item => (
                  item.url ? (
                    <Link key={item.id} to={createPageUrl(item.url)}>
                      <div className="text-xs truncate py-1 px-2 rounded-lg hover:scale-[1.02] transition-all cursor-pointer" style={{ color: colors.textSecondary, background: colors.bg, boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}` }}>{item.label}</div>
                    </Link>
                  ) : (
                    <div key={item.id} className="text-xs truncate py-1 px-2 rounded-lg" style={{ color: colors.textTertiary, background: colors.bg, boxShadow: `inset 1px 1px 2px ${colors.shadowDark}, inset -1px -1px 2px ${colors.shadowLight}` }}>{item.label}</div>
                  )
                )) : <p className="text-xs" style={{ color: colors.textTertiary }}>None</p>}
              </div>
              <h3 className="text-3xl font-bold" style={{ color: hasValue ? '#10B981' : colors.text }}>{todayCalls}</h3>
            </div>
          </CollapsiblePanel>
        );
      })()
    },
    // ── STAT ROW PANEL 5: Chip image (replaces Urgent Cases) ──
    {
      id: 'chip-image',
      defaultWidth: 1,
      defaultHeight: 1,
      content: (
        <img
          src="https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/10b930afa_Gemini_Generated_Image_1hvf8a1hvf8a1hvf.png"
          alt="BEN|CONNECT chip"
          style={{ width: '100%', height: '180px', objectFit: 'contain', objectPosition: 'center', display: 'block', borderRadius: '1rem', filter: 'drop-shadow(4px 5px 1px rgba(0,0,0,0.35)) drop-shadow(6px 8px 16px rgba(0,0,0,0.5))' }}
        />
      )
    },
    {
      id: 'recent-cases',
      defaultWidth: 3,
      defaultHeight: 1,
      content: (
        <CollapsiblePanel
          title="Your Recent Cases"
          icon={Folder}
          storageKey="dashboard-recent-cases"
          headerExtra={
            <span className="text-xs" style={{ color: colors.textSecondary }}>
              {myCases.length} total
            </span>
          }
          condensedContent={
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: colors.text }}>
                {myCases.filter(c => c.status !== 'closed').length} open cases
              </span>
              <span className="text-xs" style={{ color: colors.textTertiary }}>
                Click to expand
              </span>
            </div>
          }
        >
          <div className="space-y-4">
            {myCases.length === 0 ? (
              <p className="text-center py-8" style={{ color: colors.textSecondary }}>
                No cases assigned yet
              </p>
            ) : (
              myCases.slice(0, 5).map((caseItem, index) => (
                <motion.div
                  key={caseItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link to={createPageUrl(`Case?id=${caseItem.id}`)}>
                    <div
                      className="p-4 rounded-2xl hover:scale-[1.02] transition-all cursor-pointer"
                      style={{
                        background: colors.cardBg,
                        boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1" style={{ color: colors.text }}>
                            {caseItem.customer_name}
                          </h4>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>
                            {caseItem.case_number} · {caseItem.case_type}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            className="border-0"
                            style={{
                              background:
                                caseItem.status === 'closed' ? 'linear-gradient(145deg, #d1d5db, #9ca3af)' :
                                caseItem.status === 'resolved' ? 'linear-gradient(145deg, #dcfce7, #bbf7d0)' :
                                caseItem.status === 'in_progress' ? 'linear-gradient(145deg, #dbeafe, #bfdbfe)' :
                                'linear-gradient(145deg, #fef3c7, #fde68a)',
                              color:
                                caseItem.status === 'closed' ? '#374151' :
                                caseItem.status === 'resolved' ? '#065f46' :
                                caseItem.status === 'in_progress' ? '#1e40af' :
                                '#92400e'
                            }}
                          >
                            {caseItem.status}
                          </Badge>
                          <Badge
                            className="border-0"
                            style={{
                              background:
                                caseItem.priority === 'urgent' ? 'linear-gradient(145deg, #fee2e2, #fecaca)' :
                                caseItem.priority === 'high' ? 'linear-gradient(145deg, #fed7aa, #fdba74)' :
                                'linear-gradient(145deg, #dbeafe, #bfdbfe)',
                              color:
                                caseItem.priority === 'urgent' ? '#991b1b' :
                                caseItem.priority === 'high' ? '#9a3412' :
                                '#1e40af'
                            }}
                          >
                            {caseItem.priority}
                          </Badge>
                        </div>
                      </div>
                      {caseItem.description && (
                        <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                          {caseItem.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: colors.textTertiary }}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(caseItem.created_date), 'MMM d, h:mm a')}
                        </span>
                        {caseItem.customer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {caseItem.customer_phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </CollapsiblePanel>
      )
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <img
            src="https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/10b930afa_Gemini_Generated_Image_1hvf8a1hvf8a1hvf.png"
            alt="BEN|CONNECT chip"
            className="w-full rounded-2xl object-cover"
            style={{ maxHeight: '180px', objectPosition: 'center', objectFit: 'cover' }}
          />
          <p className="text-center mt-2 font-light tracking-widest text-xs uppercase" style={{ color: '#9ca3af', letterSpacing: '0.25em' }}>dashboard</p>
        </div>
        
        <DraggableDashboard panels={dashboardPanels} />
        
        <LayoutSelector 
          isOpen={showLayoutSelector} 
          onClose={() => setShowLayoutSelector(false)} 
        />
      </div>
    </div>
  );
}