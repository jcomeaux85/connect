import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Phone,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Users,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import DailyPlanner from "@/components/dashboard/DailyPlanner";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [dynamicGreeting, setDynamicGreeting] = useState("");
  const { colors, getButtonStyle, isDark } = useTheme();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: allCases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['all-cases'],
    queryFn: async () => {
      try {
        return await base44.entities.Case.list('-updated_date', 100);
      } catch (error) {
        console.error("Error fetching cases:", error);
        return [];
      }
    },
    enabled: !!user,
    retry: 1,
  });

  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      try {
        return await base44.entities.Task.list('-updated_date', 100);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }
    },
    enabled: !!user,
    retry: 1,
  });

  const { data: allCalls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['all-calls'],
    queryFn: async () => {
      try {
        return await base44.entities.Call.list('-created_date', 100);
      } catch (error) {
        console.error("Error fetching calls:", error);
        return [];
      }
    },
    enabled: !!user,
    retry: 1,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const cases = (allCases || []).filter(c => c && c.assigned_to === user?.email);
  const tasks = (allTasks || []).filter(t => t && t.assigned_to === user?.email);
  const caseIds = cases.map(c => c.id);
  const calls = (allCalls || []).filter(call => call && caseIds.includes(call.case_id));

  const activeCases = cases.filter(c => c.status !== 'closed' && c.status !== 'resolved').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const todayCalls = calls.filter(c => {
    try {
      const callDate = new Date(c.created_date);
      const today = new Date();
      return callDate.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  }).length;
  const urgentCases = cases.filter(c => c.priority === 'urgent' && c.status !== 'closed').length;

  const greeting = dynamicGreeting || `${getGreeting()}, ${user?.full_name?.split(' ')[0] || 'Agent'}!`;

  const stats = [
    {
      title: "My Active Cases",
      value: activeCases,
      icon: FolderOpen,
      color: "#6B7280"
    },
    {
      title: "My Pending Tasks",
      value: pendingTasks,
      icon: CheckCircle2,
      color: "#6B7280"
    },
    {
      title: "Calls Today",
      value: todayCalls,
      icon: Phone,
      color: "#6B7280"
    },
    {
      title: "Urgent Cases",
      value: urgentCases,
      icon: AlertCircle,
      color: "#EF4444"
    }
  ];

  const recentCases = cases.slice(0, 5);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: colors.bg }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.text }}></div>
          <p style={{ color: colors.textSecondary }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: colors.bg }}>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        
        {/* Top Row: Greeting + Daily Planner */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Greeting Card - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            <Card
              className="border-0 h-full"
              style={{
                background: colors.bg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}
            >
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                  <h1 className="text-xl font-bold leading-tight mb-2" style={{ color: colors.text }}>
                    {greeting}
                  </h1>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {activeCases > 0 ? `You have ${activeCases} active cases` : 'All caught up!'}
                    {urgentCases > 0 && ` · ${urgentCases} urgent`}
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-6">
                  <Link to={createPageUrl("Cases")}>
                    <button
                      className="w-full rounded-2xl h-10 px-4 font-medium text-sm flex items-center justify-center gap-2"
                      style={getButtonStyle()}
                    >
                      <FolderOpen className="w-4 h-4" />
                      My Cases
                    </button>
                  </Link>

                  <Link to={createPageUrl("Customers")}>
                    <button
                      className="w-full rounded-2xl h-10 px-4 font-medium text-sm flex items-center justify-center gap-2"
                      style={getButtonStyle()}
                    >
                      <Users className="w-4 h-4" />
                      Customers
                    </button>
                  </Link>

                  <Link to={createPageUrl("Analytics")}>
                    <button
                      className="w-full rounded-2xl h-10 px-4 font-medium text-sm flex items-center justify-center gap-2"
                      style={getButtonStyle()}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Planner */}
          <div className="lg:col-span-3">
            <DailyPlanner 
              user={user} 
              greeting={greeting}
              activeCases={activeCases} 
              urgentCases={urgentCases} 
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="border-0"
                style={{
                  background: colors.bg,
                  boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        background: isDark 
                          ? 'linear-gradient(145deg, #141721, #1f222e)'
                          : 'linear-gradient(145deg, #f0f4f8, #d1d9e6)',
                        boxShadow: isDark
                          ? `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
                          : `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
                      }}
                    >
                      <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.text }}>
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Cases */}
        <Card
          className="border-0"
          style={{
            background: colors.bg,
            boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
          }}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: isDark 
                      ? 'linear-gradient(145deg, #141721, #1f222e)'
                      : colors.gradient,
                    boxShadow: isDark
                      ? `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
                      : `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`
                  }}
                >
                  <FolderOpen className="w-6 h-6" style={{ color: colors.textSecondary }} />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold" style={{ color: colors.text }}>
                    My Recent Cases
                  </CardTitle>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>Your assigned cases</p>
                </div>
              </div>
              <Link to={createPageUrl("Cases")}>
                <button
                  className="rounded-2xl h-10 px-4 text-sm flex items-center gap-2"
                  style={getButtonStyle()}
                >
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: colors.textSecondary }}>No cases assigned to you yet</p>
              </div>
            ) : (
              recentCases.map((caseItem, index) => (
                <Link key={caseItem.id} to={createPageUrl(`Case?id=${caseItem.id}`)}>
                  <div
                    className="p-4 rounded-2xl cursor-pointer"
                    style={{
                      background: colors.bg,
                      boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`,
                      marginBottom: index < recentCases.length - 1 ? '12px' : '0'
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base truncate" style={{ color: colors.text }}>
                          {caseItem.customer_name}
                        </h4>
                        <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                          {caseItem.case_number} · {caseItem.case_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: caseItem.priority === 'urgent' ? 'linear-gradient(145deg, #fee2e2, #fecaca)' :
                                       caseItem.priority === 'high' ? 'linear-gradient(145deg, #fed7aa, #fdba74)' :
                                       'linear-gradient(145deg, #e0f2fe, #bae6fd)',
                            color: caseItem.priority === 'urgent' ? '#991b1b' :
                                   caseItem.priority === 'high' ? '#9a3412' : '#075985',
                            boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}`
                          }}
                        >
                          {caseItem.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}