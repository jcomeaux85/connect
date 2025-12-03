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


export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);
  const { colors, getTransitionDuration } = useTheme();

  useEffect(() => {
    loadUser();
    loadWeather();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
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
      title: "Active Cases",
      value: activeCases,
      icon: Folder,
      color: "#3B82F6",
      bgGradient: "linear-gradient(145deg, #dbeafe, #bfdbfe)"
    },
    {
      title: "Pending Tasks",
      value: pendingTasks,
      icon: CheckSquare,
      color: "#8B5CF6",
      bgGradient: "linear-gradient(145deg, #ede9fe, #ddd6fe)"
    },
    {
      title: "Today's Calls",
      value: todayCalls,
      icon: Phone,
      color: "#10B981",
      bgGradient: "linear-gradient(145deg, #dcfce7, #bbf7d0)"
    },
    {
      title: "Urgent Cases",
      value: urgentCases,
      icon: AlertCircle,
      color: "#EF4444",
      bgGradient: "linear-gradient(145deg, #fee2e2, #fecaca)"
    }
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

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Row - Greeting and Daily Planner */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Weather Card - Now Collapsible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CollapsiblePanel
              title="Doc"
              icon={Sun}
              storageKey="dashboard-weather"
              condensedContent={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold" style={{ color: colors.text }}>
                      {format(new Date(), 'h:mm')} <span className="text-sm" style={{ color: colors.textSecondary }}>{format(new Date(), 'a')}</span>
                    </span>
                    {weather && (
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        {weather.temp}° {weather.condition}
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: colors.textTertiary }}>
                    {format(new Date(), 'EEE, MMM d')}
                  </span>
                </div>
              }
            >
              {/* Time and Weather Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-bold" style={{ color: colors.text }}>
                    {format(new Date(), 'h:mm')} <span className="text-2xl" style={{ color: colors.textSecondary }}>{format(new Date(), 'a')}</span>
                  </h2>
                </div>
                
                {weather && (
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-3xl flex items-center justify-center"
                      style={{
                        background: colors.bg,
                        boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`
                      }}
                    >
                      <WeatherIcon className="w-8 h-8" style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold" style={{ color: colors.text }}>
                        {weather.temp}°
                      </p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {weather.condition}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Other Time Zones - Centered */}
              {weather && (
                <div className="flex flex-row gap-2 text-xs justify-center mb-4" style={{ color: colors.textTertiary }}>
                  <div className="px-2 py-0.5 rounded inline-block" style={{ background: colors.bg, boxShadow: `inset 1px 1px 2px ${colors.shadowDark}, inset -1px -1px 2px ${colors.shadowLight}` }}>
                    PST: {format(new Date(), 'h:mm a')}
                  </div>
                  <div className="px-2 py-0.5 rounded inline-block" style={{ background: colors.bg, boxShadow: `inset 1px 1px 2px ${colors.shadowDark}, inset -1px -1px 2px ${colors.shadowLight}` }}>
                    MST: {format(new Date(), 'h:mm a')}
                  </div>
                  <div className="px-2 py-0.5 rounded inline-block" style={{ background: colors.bg, boxShadow: `inset 1px 1px 2px ${colors.shadowDark}, inset -1px -1px 2px ${colors.shadowLight}` }}>
                    EST: {format(new Date(), 'h:mm a')}
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {format(new Date(), 'EEEE, MMMM d')}
                  </p>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex gap-2">
                <Link to={createPageUrl("Cases")} className="flex-1">
                  <button
                    className="w-full rounded-2xl h-10 px-3 border-0 text-sm flex items-center justify-center gap-2"
                    style={{
                      background: colors.bg,
                      boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                      color: colors.textSecondary,
                      transition: `all ${getTransitionDuration(150)}`
                    }}
                  >
                    <Folder className="w-4 h-4" />
                    Cases
                  </button>
                </Link>
                <Link to={createPageUrl("Customers")} className="flex-1">
                  <button
                    className="w-full rounded-2xl h-10 px-3 border-0 text-sm flex items-center justify-center gap-2"
                    style={{
                      background: colors.bg,
                      boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                      color: colors.textSecondary,
                      transition: `all ${getTransitionDuration(150)}`
                    }}
                  >
                    <User className="w-4 h-4" />
                    Customers
                  </button>
                </Link>
              </div>
            </CollapsiblePanel>
          </motion.div>

          {/* Daily Planner - Now Collapsible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <CollapsiblePanel
              title="Daily Planner"
              icon={CalendarIcon}
              storageKey="dashboard-planner"
              headerExtra={
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  {activeCases} active · {urgentCases} urgent
                </span>
              }
              condensedContent={
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.text }}>
                    {activeCases} active cases
                  </span>
                  <span className="text-xs" style={{ color: urgentCases > 0 ? '#EF4444' : colors.textTertiary }}>
                    {urgentCases > 0 ? `${urgentCases} urgent` : 'No urgent'}
                  </span>
                </div>
              }
            >
              <DailyPlanner />
            </CollapsiblePanel>
          </motion.div>
        </div>

        {/* Stats Grid - Now Collapsible Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const StatIcon = stat.icon;
            const hasValue = stat.value > 0;
            
            // Get recent items for each stat type
            const getRecentItems = () => {
              switch(stat.title) {
                case "Active Cases":
                  return myCases.filter(c => c.status !== 'closed').slice(0, 3).map(c => ({
                    id: c.id,
                    label: c.customer_name || c.case_number,
                    url: `Case?id=${c.id}`
                  }));
                case "Pending Tasks":
                  return myTasks.filter(t => t.status === 'pending').slice(0, 3).map(t => ({
                    id: t.id,
                    label: t.title,
                    url: t.case_id ? `Case?id=${t.case_id}` : null
                  }));
                case "Today's Calls":
                  return calls.filter(call => call.created_date && isToday(parseISO(call.created_date))).slice(0, 3).map(c => {
                    // Find case to get customer name
                    const relatedCase = cases.find(cs => cs.id === c.case_id);
                    return {
                      id: c.id,
                      label: relatedCase?.customer_name || 'Unknown',
                      url: c.case_id ? `Case?id=${c.case_id}` : null
                    };
                  });
                case "Urgent Cases":
                  return myCases.filter(c => c.priority === 'urgent' && c.status !== 'closed').slice(0, 3).map(c => ({
                    id: c.id,
                    label: c.customer_name || c.case_number,
                    url: `Case?id=${c.id}`
                  }));
                default:
                  return [];
              }
            };
            
            const recentItems = getRecentItems();
            
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <CollapsiblePanel
                  title={stat.title}
                  icon={StatIcon}
                  storageKey={`dashboard-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
                  accentColor={hasValue ? stat.color : null}
                  largerIcon
                  condensedContent={
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold" style={{ color: hasValue ? stat.color : colors.text }}>
                        {stat.value}
                      </span>
                    </div>
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Recent Items List */}
                    <div className="flex-1 space-y-1.5">
                      {recentItems.length > 0 ? (
                        recentItems.map((item) => (
                          item.url ? (
                            <Link key={item.id} to={createPageUrl(item.url)}>
                              <div 
                                className="text-xs truncate py-1 px-2 rounded-lg hover:scale-[1.02] transition-all cursor-pointer"
                                style={{ 
                                  color: colors.textSecondary,
                                  background: colors.bg,
                                  boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}`
                                }}
                              >
                                {item.label}
                              </div>
                            </Link>
                          ) : (
                            <div 
                              key={item.id}
                              className="text-xs truncate py-1 px-2 rounded-lg"
                              style={{ 
                                color: colors.textTertiary,
                                background: colors.bg,
                                boxShadow: `inset 1px 1px 2px ${colors.shadowDark}, inset -1px -1px 2px ${colors.shadowLight}`
                              }}
                            >
                              {item.label}
                            </div>
                          )
                        ))
                      ) : (
                        <p className="text-xs" style={{ color: colors.textTertiary }}>None</p>
                      )}
                    </div>
                    {/* Count */}
                    <div className="text-right">
                      <h3 className="text-3xl font-bold" style={{ color: hasValue ? stat.color : colors.text }}>
                        {stat.value}
                      </h3>
                    </div>
                  </div>
                </CollapsiblePanel>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Cases - Now Collapsible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
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
        </motion.div>
      </div>

    </div>
  );
}