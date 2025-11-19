import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isToday, parseISO } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";

import DailyPlanner from "../components/dashboard/DailyPlanner";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);
  const { colors } = useTheme();

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
          {/* Weather Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              className="border-0 h-full"
              style={{
                background: colors.bg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}
            >
              <CardContent className="p-6">
                {/* Other Time Zones - Right Justified */}
                <div className="mb-4 flex justify-end">
                  <div className="flex flex-col gap-1 text-xs text-right" style={{ color: colors.textTertiary }}>
                    <div className="px-2 py-0.5 rounded inline-block" style={{ background: colors.bg, boxShadow: `inset 1px 1px 2px ${colors.shadowDark}, inset -1px -1px 2px ${colors.shadowLight}` }}>
                      PST: 6:15 AM
                    </div>
                    <div className="px-2 py-0.5 rounded inline-block" style={{ background: colors.bg, boxShadow: `inset 1px 1px 2px ${colors.shadowDark}, inset -1px -1px 2px ${colors.shadowLight}` }}>
                      MST: 7:15 AM
                    </div>
                    <div className="px-2 py-0.5 rounded inline-block" style={{ background: colors.bg, boxShadow: `inset 1px 1px 2px ${colors.shadowDark}, inset -1px -1px 2px ${colors.shadowLight}` }}>
                      EST: 9:15 AM
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold mb-1" style={{ color: colors.text }}>
                      Doc
                    </h2>
                    {weather && (
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {format(new Date(), 'EEEE, MMMM d')}
                      </p>
                    )}
                  </div>
                </div>

                {weather && (
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-20 h-20 rounded-3xl flex items-center justify-center"
                      style={{
                        background: colors.bg,
                        boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`
                      }}
                    >
                      <WeatherIcon className="w-10 h-10" style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                      <p className="text-4xl font-bold" style={{ color: colors.text }}>
                        {weather.temp}°
                      </p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {weather.condition}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex gap-2">
                  <Link to={createPageUrl("Cases")} className="flex-1">
                    <button
                      className="w-full rounded-2xl h-10 px-3 border-0 text-sm flex items-center justify-center gap-2"
                      style={{
                        background: colors.bg,
                        boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                        color: colors.textSecondary
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
                        color: colors.textSecondary
                      }}
                    >
                      <User className="w-4 h-4" />
                      Customers
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Daily Planner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card
              className="border-0 h-full"
              style={{
                background: colors.bg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-4xl font-bold" style={{ color: colors.text }}>
                  8:15 <span className="text-2xl" style={{ color: colors.textSecondary }}>AM</span>
                </CardTitle>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  You have {activeCases} active {activeCases === 1 ? 'case' : 'cases'} · {urgentCases} urgent
                </p>
              </CardHeader>
              <CardContent>
                <DailyPlanner />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card
                  className="border-0"
                  style={{
                    background: colors.bg,
                    boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background: stat.bgGradient,
                          boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`
                        }}
                      >
                        <Icon className="w-7 h-7" style={{ color: stat.color }} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: colors.text }}>
                      {stat.value}
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {stat.title}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card
            className="border-0"
            style={{
              background: colors.bg,
              boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: colors.text }}>Your Recent Cases</CardTitle>
            </CardHeader>
            <CardContent>
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
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      <Link to={createPageUrl(`Case?id=${caseItem.id}`)}>
                        <div
                          className="p-4 rounded-2xl hover:scale-[1.02] transition-all cursor-pointer"
                          style={{
                            background: colors.bg,
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
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}