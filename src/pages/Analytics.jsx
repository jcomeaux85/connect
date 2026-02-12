import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  MessageSquare,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  PhoneMissed,
  Shield,
  FolderOpen,
  FolderCheck,
  ListChecks,
  UserPlus,
  Zap,
  BarChart3,
  Target,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { format, eachDayOfInterval, subDays, startOfWeek, endOfWeek, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const { colors, getButtonStyle, getInsetStyle, isDark } = useTheme();

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

  const { data: cases = [] } = useQuery({
    queryKey: ['cases-analytics'],
    queryFn: () => base44.entities.Case.list('-created_date'),
  });

  const { data: calls = [] } = useQuery({
    queryKey: ['calls-analytics'],
    queryFn: () => base44.entities.Call.list('-created_date'),
  });

  const { data: sms = [] } = useQuery({
    queryKey: ['sms-analytics'],
    queryFn: () => base44.entities.SMS.list('-created_date'),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-analytics'],
    queryFn: () => base44.entities.Task.list('-created_date'),
  });

  // Week calculations
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 });
  const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 0 });
  const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 0 });

  const isThisWeek = (date) => isWithinInterval(parseISO(date), { start: thisWeekStart, end: thisWeekEnd });
  const isLastWeek = (date) => isWithinInterval(parseISO(date), { start: lastWeekStart, end: lastWeekEnd });

  // Call Metrics
  const thisWeekCalls = calls.filter(c => c.created_date && isThisWeek(c.created_date));
  const lastWeekCalls = calls.filter(c => c.created_date && isLastWeek(c.created_date));
  
  const thisWeekCallTime = thisWeekCalls.reduce((sum, c) => sum + (c.duration || 0), 0);
  const lastWeekCallTime = lastWeekCalls.reduce((sum, c) => sum + (c.duration || 0), 0);
  
  const avgCallTimeThisWeek = thisWeekCalls.length > 0 ? Math.round(thisWeekCallTime / thisWeekCalls.length) : 0;
  const avgCallTimeLastWeek = lastWeekCalls.length > 0 ? Math.round(lastWeekCallTime / lastWeekCalls.length) : 0;
  
  const missedCallsThisWeek = thisWeekCalls.filter(c => c.status === 'missed' || c.status === 'no_answer').length;
  const missedCallsLastWeek = lastWeekCalls.filter(c => c.status === 'missed' || c.status === 'no_answer').length;
  
  const outboundCallsThisWeek = thisWeekCalls.filter(c => c.direction === 'outbound').length;
  const outboundCallsLastWeek = lastWeekCalls.filter(c => c.direction === 'outbound').length;

  // 3-way calls (simulated - you'd need a field for this)
  const threeWayCallsThisWeek = 0; // Placeholder
  const threeWayCallsLastWeek = 0; // Placeholder

  // Case Metrics
  const casesOpenedThisWeek = cases.filter(c => c.created_date && isThisWeek(c.created_date)).length;
  const casesOpenedLastWeek = cases.filter(c => c.created_date && isLastWeek(c.created_date)).length;
  
  const casesClosedThisWeek = cases.filter(c => c.updated_date && isThisWeek(c.updated_date) && (c.status === 'closed' || c.status === 'resolved')).length;
  const casesClosedLastWeek = cases.filter(c => c.updated_date && isLastWeek(c.updated_date) && (c.status === 'closed' || c.status === 'resolved')).length;
  
  const escalatedCasesThisWeek = cases.filter(c => c.created_date && isThisWeek(c.created_date) && c.priority === 'urgent').length;
  const escalatedCasesLastWeek = cases.filter(c => c.created_date && isLastWeek(c.created_date) && c.priority === 'urgent').length;

  // Task Metrics
  const tasksCreatedByUser = tasks.filter(t => t.created_by === user?.email).length;
  const tasksAssignedToUser = tasks.filter(t => t.assigned_to === user?.email).length;
  const tasksCompletedThisWeek = tasks.filter(t => t.completed_date && isThisWeek(t.completed_date)).length;
  const tasksCompletedLastWeek = tasks.filter(t => t.completed_date && isLastWeek(t.completed_date)).length;

  // Compliance & Quality
  const complianceRating = 94; // Placeholder - would come from CallTranscript compliance_score
  const qualityScore = 87; // Placeholder - would come from CallTranscript quality_score

  // Overall metrics
  const totalCalls = calls.length;
  const inboundCalls = calls.filter(c => c.direction === 'inbound').length;
  const outboundCalls = calls.filter(c => c.direction === 'outbound').length;
  const avgCallDuration = calls.length > 0
    ? Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length)
    : 0;

  const activeCases = cases.filter(c => c.status !== 'closed' && c.status !== 'resolved').length;
  const resolvedCases = cases.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const urgentCases = cases.filter(c => c.priority === 'urgent').length;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;

  // Call volume by day (last 14 days for better trends)
  const last14Days = eachDayOfInterval({
    start: subDays(new Date(), 13),
    end: new Date()
  });

  const callVolumeData = last14Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayCalls = calls.filter(c =>
      c.created_date && format(new Date(c.created_date), 'yyyy-MM-dd') === dayStr
    );
    return {
      date: format(day, 'MMM d'),
      calls: dayCalls.length,
      inbound: dayCalls.filter(c => c.direction === 'inbound').length,
      outbound: dayCalls.filter(c => c.direction === 'outbound').length,
      missed: dayCalls.filter(c => c.status === 'missed' || c.status === 'no_answer').length,
      avgDuration: dayCalls.length > 0 ? Math.round(dayCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / dayCalls.length / 60) : 0
    };
  });

  // Case trends
  const caseTrendData = last14Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayCases = cases.filter(c =>
      c.created_date && format(new Date(c.created_date), 'yyyy-MM-dd') === dayStr
    );
    return {
      date: format(day, 'MMM d'),
      opened: dayCases.length,
      closed: dayCases.filter(c => c.status === 'closed' || c.status === 'resolved').length,
      escalated: dayCases.filter(c => c.priority === 'urgent').length
    };
  });

  // Case status distribution
  const caseStatusData = [
    { name: 'Active', value: cases.filter(c => c.status === 'in_progress').length, color: colors.primary },
    { name: 'New', value: cases.filter(c => c.status === 'new').length, color: colors.success },
    { name: 'Pending', value: cases.filter(c => c.status === 'pending').length, color: colors.warning },
    { name: 'Resolved', value: resolvedCases, color: colors.gray }
  ];

  // Priority distribution
  const priorityData = [
    { name: 'Urgent', value: cases.filter(c => c.priority === 'urgent').length, color: colors.danger },
    { name: 'High', value: cases.filter(c => c.priority === 'high').length, color: colors.warning },
    { name: 'Medium', value: cases.filter(c => c.priority === 'medium').length, color: colors.primary },
    { name: 'Low', value: cases.filter(c => c.priority === 'low').length, color: colors.gray }
  ];

  // Helper function to format time
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate percentage changes
  const callTimeChange = lastWeekCallTime > 0 ? Math.round(((thisWeekCallTime - lastWeekCallTime) / lastWeekCallTime) * 100) : 0;
  const avgCallTimeChange = avgCallTimeLastWeek > 0 ? Math.round(((avgCallTimeThisWeek - avgCallTimeLastWeek) / avgCallTimeLastWeek) * 100) : 0;
  const casesOpenedChange = casesOpenedLastWeek > 0 ? Math.round(((casesOpenedThisWeek - casesOpenedLastWeek) / casesOpenedLastWeek) * 100) : 0;
  const casesClosedChange = casesClosedLastWeek > 0 ? Math.round(((casesClosedThisWeek - casesClosedLastWeek) / casesClosedLastWeek) * 100) : 0;

  // Stat card component
  const StatCard = ({ title, value, subtitle, change, icon: Icon, color, trend }) => (
    <Card className="border-0" style={{ background: colors.bg, boxShadow: colors.cardShadow }}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={getInsetStyle()}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {change > 0 ? (
                <TrendingUp className="w-4 h-4" style={{ color: colors.success }} />
              ) : change < 0 ? (
                <TrendingDown className="w-4 h-4" style={{ color: colors.danger }} />
              ) : null}
              <span className="text-xs font-medium" style={{ color: change > 0 ? colors.success : change < 0 ? colors.danger : colors.textSecondary }}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>{title}</p>
        <p className="text-3xl font-bold mb-1" style={{ color: colors.text }}>{value}</p>
        {subtitle && <p className="text-xs" style={{ color: colors.textTertiary }}>{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold" style={{ color: colors.text }}>
              Analytics Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Comprehensive call center performance metrics and insights
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6" style={{ background: colors.bg, boxShadow: colors.cardShadow, padding: '4px' }}>
            <TabsTrigger value="overview" style={activeTab === 'overview' ? getButtonStyle(true) : getButtonStyle(false)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="calls" style={activeTab === 'calls' ? getButtonStyle(true) : getButtonStyle(false)}>
              <Phone className="w-4 h-4 mr-2" />
              Call Analytics
            </TabsTrigger>
            <TabsTrigger value="cases" style={activeTab === 'cases' ? getButtonStyle(true) : getButtonStyle(false)}>
              <Activity className="w-4 h-4 mr-2" />
              Case Analytics
            </TabsTrigger>
            <TabsTrigger value="performance" style={activeTab === 'performance' ? getButtonStyle(true) : getButtonStyle(false)}>
              <Award className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Calls (All Time)"
                value={totalCalls}
                icon={Phone}
                color={colors.primary}
              />
              <StatCard
                title="Active Cases"
                value={activeCases}
                subtitle={`${resolvedCases} resolved`}
                icon={Activity}
                color={colors.success}
              />
              <StatCard
                title="Avg Call Time"
                value={formatTime(avgCallDuration)}
                icon={Clock}
                color={colors.warning}
              />
              <StatCard
                title="Compliance Rating"
                value={`${complianceRating}%`}
                icon={Shield}
                color={colors.purple}
              />
            </div>

            {/* Main Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0" style={{ background: colors.bg, boxShadow: colors.cardShadow }}>
                <CardHeader>
                  <CardTitle style={{ color: colors.text }}>Call Volume Trends (14 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={callVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3a3e4a' : '#d1d9e6'} />
                      <XAxis dataKey="date" stroke={colors.textSecondary} fontSize={12} />
                      <YAxis stroke={colors.textSecondary} fontSize={12} />
                      <Tooltip contentStyle={{
                        background: isDark ? 'rgba(42, 46, 58, 0.95)' : 'rgba(224, 229, 236, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`,
                        color: colors.text
                      }} />
                      <Legend />
                      <Area type="monotone" dataKey="inbound" stackId="1" stroke={colors.success} fill={colors.success} fillOpacity={0.6} />
                      <Area type="monotone" dataKey="outbound" stackId="1" stroke={colors.primary} fill={colors.primary} fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0" style={{ background: colors.bg, boxShadow: colors.cardShadow }}>
                <CardHeader>
                  <CardTitle style={{ color: colors.text }}>Case Trends (14 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={caseTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3a3e4a' : '#d1d9e6'} />
                      <XAxis dataKey="date" stroke={colors.textSecondary} fontSize={12} />
                      <YAxis stroke={colors.textSecondary} fontSize={12} />
                      <Tooltip contentStyle={{
                        background: isDark ? 'rgba(42, 46, 58, 0.95)' : 'rgba(224, 229, 236, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`,
                        color: colors.text
                      }} />
                      <Legend />
                      <Line type="monotone" dataKey="opened" stroke={colors.primary} strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="closed" stroke={colors.success} strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="escalated" stroke={colors.danger} strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

          </TabsContent>

          {/* Call Analytics Tab */}
          <TabsContent value="calls" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="This Week Call Time"
                value={formatDuration(thisWeekCallTime)}
                change={callTimeChange}
                icon={Clock}
                color={colors.primary}
              />
              <StatCard
                title="Last Week Call Time"
                value={formatDuration(lastWeekCallTime)}
                icon={Clock}
                color={colors.textSecondary}
              />
              <StatCard
                title="Avg Call Time (This Week)"
                value={formatTime(avgCallTimeThisWeek)}
                subtitle={`Last week: ${formatTime(avgCallTimeLastWeek)}`}
                change={avgCallTimeChange}
                icon={Activity}
                color={colors.warning}
              />
              <StatCard
                title="Missed Calls (This Week)"
                value={missedCallsThisWeek}
                subtitle={`Last week: ${missedCallsLastWeek}`}
                icon={PhoneMissed}
                color={colors.danger}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Outbound Calls (This Week)"
                value={outboundCallsThisWeek}
                subtitle={`Last week: ${outboundCallsLastWeek}`}
                icon={PhoneOutgoing}
                color={colors.primary}
              />
              <StatCard
                title="Inbound Calls (This Week)"
                value={thisWeekCalls.filter(c => c.direction === 'inbound').length}
                subtitle={`Last week: ${lastWeekCalls.filter(c => c.direction === 'inbound').length}`}
                icon={PhoneIncoming}
                color={colors.success}
              />
              <StatCard
                title="3-Way Calls (This Week)"
                value={threeWayCallsThisWeek}
                subtitle={`Last week: ${threeWayCallsLastWeek}`}
                icon={Users}
                color={colors.purple}
              />
              <StatCard
                title="Total Calls (This Week)"
                value={thisWeekCalls.length}
                subtitle={`Last week: ${lastWeekCalls.length}`}
                icon={Phone}
                color={colors.info}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0" style={{ background: colors.bg, boxShadow: colors.cardShadow }}>
                <CardHeader>
                  <CardTitle style={{ color: colors.text }}>Daily Average Call Duration (Minutes)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={callVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3a3e4a' : '#d1d9e6'} />
                      <XAxis dataKey="date" stroke={colors.textSecondary} fontSize={12} />
                      <YAxis stroke={colors.textSecondary} fontSize={12} />
                      <Tooltip contentStyle={{
                        background: isDark ? 'rgba(42, 46, 58, 0.95)' : 'rgba(224, 229, 236, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`,
                        color: colors.text
                      }} />
                      <Bar dataKey="avgDuration" fill={colors.warning} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0" style={{ background: colors.bg, boxShadow: colors.cardShadow }}>
                <CardHeader>
                  <CardTitle style={{ color: colors.text }}>Call Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: calls.filter(c => c.status === 'completed').length, color: colors.success },
                          { name: 'Missed', value: calls.filter(c => c.status === 'missed').length, color: colors.danger },
                          { name: 'Busy', value: calls.filter(c => c.status === 'busy').length, color: colors.warning },
                          { name: 'No Answer', value: calls.filter(c => c.status === 'no_answer').length, color: colors.textSecondary },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : null}
                      >
                        {[
                          { name: 'Completed', value: calls.filter(c => c.status === 'completed').length, color: colors.success },
                          { name: 'Missed', value: calls.filter(c => c.status === 'missed').length, color: colors.danger },
                          { name: 'Busy', value: calls.filter(c => c.status === 'busy').length, color: colors.warning },
                          { name: 'No Answer', value: calls.filter(c => c.status === 'no_answer').length, color: colors.textSecondary },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{
                        background: isDark ? 'rgba(42, 46, 58, 0.95)' : 'rgba(224, 229, 236, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`,
                        color: colors.text
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Case Analytics Tab */}
          <TabsContent value="cases" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Cases Opened (This Week)"
                value={casesOpenedThisWeek}
                subtitle={`Last week: ${casesOpenedLastWeek}`}
                change={casesOpenedChange}
                icon={FolderOpen}
                color={colors.primary}
              />
              <StatCard
                title="Cases Closed (This Week)"
                value={casesClosedThisWeek}
                subtitle={`Last week: ${casesClosedLastWeek}`}
                change={casesClosedChange}
                icon={FolderCheck}
                color={colors.success}
              />
              <StatCard
                title="Escalated Cases (This Week)"
                value={escalatedCasesThisWeek}
                subtitle={`Last week: ${escalatedCasesLastWeek}`}
                icon={Zap}
                color={colors.danger}
              />
              <StatCard
                title="Active Cases"
                value={activeCases}
                subtitle={`${resolvedCases} total resolved`}
                icon={Activity}
                color={colors.info}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0" style={{ background: colors.bg, boxShadow: colors.cardShadow }}>
                <CardHeader>
                  <CardTitle style={{ color: colors.text }}>Case Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: cases.filter(c => c.status === 'in_progress').length, color: colors.primary },
                          { name: 'New', value: cases.filter(c => c.status === 'new').length, color: colors.success },
                          { name: 'Pending', value: cases.filter(c => c.status === 'pending').length, color: colors.warning },
                          { name: 'Resolved', value: resolvedCases, color: colors.textSecondary }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : null}
                      >
                        {[
                          { name: 'Active', value: cases.filter(c => c.status === 'in_progress').length, color: colors.primary },
                          { name: 'New', value: cases.filter(c => c.status === 'new').length, color: colors.success },
                          { name: 'Pending', value: cases.filter(c => c.status === 'pending').length, color: colors.warning },
                          { name: 'Resolved', value: resolvedCases, color: colors.textSecondary }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{
                        background: isDark ? 'rgba(42, 46, 58, 0.95)' : 'rgba(224, 229, 236, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`,
                        color: colors.text
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0" style={{ background: colors.bg, boxShadow: colors.cardShadow }}>
                <CardHeader>
                  <CardTitle style={{ color: colors.text }}>Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      { name: 'Urgent', value: cases.filter(c => c.priority === 'urgent').length, color: colors.danger },
                      { name: 'High', value: cases.filter(c => c.priority === 'high').length, color: colors.warning },
                      { name: 'Medium', value: cases.filter(c => c.priority === 'medium').length, color: colors.primary },
                      { name: 'Low', value: cases.filter(c => c.priority === 'low').length, color: colors.textSecondary }
                    ].map((item) => (
                      <div key={item.name}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium" style={{ color: colors.text }}>
                            {item.name}
                          </span>
                          <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                            {item.value}
                          </span>
                        </div>
                        <div className="h-4 rounded-full overflow-hidden" style={{
                          background: colors.bg,
                          boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`
                        }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cases.length > 0 ? (item.value / cases.length) * 100 : 0}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full rounded-full"
                            style={{ background: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Compliance Rating"
                value={`${complianceRating}%`}
                subtitle="Based on call quality"
                icon={Shield}
                color={colors.success}
              />
              <StatCard
                title="Quality Score"
                value={`${qualityScore}%`}
                subtitle="Agent performance"
                icon={Award}
                color={colors.primary}
              />
              <StatCard
                title="Tasks Created by Me"
                value={tasksCreatedByUser}
                icon={ListChecks}
                color={colors.purple}
              />
              <StatCard
                title="Tasks Assigned to Me"
                value={tasksAssignedToUser}
                subtitle={`${tasks.filter(t => t.assigned_to === user?.email && t.status === 'completed').length} completed`}
                icon={UserCheck}
                color={colors.info}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0" style={{ background: colors.bg, boxShadow: colors.cardShadow }}>
                <CardHeader>
                  <CardTitle style={{ color: colors.text }}>Weekly Task Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={[
                      { week: 'This Week', completed: tasksCompletedThisWeek, pending: tasks.filter(t => t.status === 'pending' && t.created_date && isThisWeek(t.created_date)).length },
                      { week: 'Last Week', completed: tasksCompletedLastWeek, pending: tasks.filter(t => t.status === 'pending' && t.created_date && isLastWeek(t.created_date)).length }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3a3e4a' : '#d1d9e6'} />
                      <XAxis dataKey="week" stroke={colors.textSecondary} fontSize={12} />
                      <YAxis stroke={colors.textSecondary} fontSize={12} />
                      <Tooltip contentStyle={{
                        background: isDark ? 'rgba(42, 46, 58, 0.95)' : 'rgba(224, 229, 236, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`,
                        color: colors.text
                      }} />
                      <Legend />
                      <Bar dataKey="completed" fill={colors.success} radius={[8, 8, 0, 0]} />
                      <Bar dataKey="pending" fill={colors.warning} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0" style={{ background: colors.bg, boxShadow: colors.cardShadow }}>
                <CardHeader>
                  <CardTitle style={{ color: colors.text }}>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: colors.text }}>Compliance Score</span>
                        <span className="text-sm font-bold" style={{ color: colors.success }}>{complianceRating}%</span>
                      </div>
                      <div className="h-4 rounded-full overflow-hidden" style={{
                        background: colors.bg,
                        boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${complianceRating}%` }}
                          transition={{ duration: 1 }}
                          className="h-full rounded-full"
                          style={{ background: colors.success }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: colors.text }}>Quality Score</span>
                        <span className="text-sm font-bold" style={{ color: colors.primary }}>{qualityScore}%</span>
                      </div>
                      <div className="h-4 rounded-full overflow-hidden" style={{
                        background: colors.bg,
                        boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${qualityScore}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ background: colors.primary }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: colors.text }}>Task Completion Rate</span>
                        <span className="text-sm font-bold" style={{ color: colors.purple }}>
                          {tasksAssignedToUser > 0 ? Math.round((tasks.filter(t => t.assigned_to === user?.email && t.status === 'completed').length / tasksAssignedToUser) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-4 rounded-full overflow-hidden" style={{
                        background: colors.bg,
                        boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${tasksAssignedToUser > 0 ? (tasks.filter(t => t.assigned_to === user?.email && t.status === 'completed').length / tasksAssignedToUser) * 100 : 0}%` }}
                          transition={{ duration: 1, delay: 0.4 }}
                          className="h-full rounded-full"
                          style={{ background: colors.purple }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: colors.text }}>Case Resolution Rate</span>
                        <span className="text-sm font-bold" style={{ color: colors.info }}>
                          {cases.length > 0 ? Math.round((resolvedCases / cases.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-4 rounded-full overflow-hidden" style={{
                        background: colors.bg,
                        boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cases.length > 0 ? (resolvedCases / cases.length) * 100 : 0}%` }}
                          transition={{ duration: 1, delay: 0.6 }}
                          className="h-full rounded-full"
                          style={{ background: colors.info }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}