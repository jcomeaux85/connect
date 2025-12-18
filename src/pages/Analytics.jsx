import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  MessageSquare,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle
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
  Cell
} from 'recharts';
import { format, eachDayOfInterval, subDays } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('week');
  const { colors, getButtonStyle, getInsetStyle, isDark } = useTheme();

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

  // Calculate metrics
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

  // Call volume by day
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const callVolumeData = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayCalls = calls.filter(c =>
      format(new Date(c.created_date), 'yyyy-MM-dd') === dayStr
    );
    return {
      date: format(day, 'EEE'),
      calls: dayCalls.length,
      inbound: dayCalls.filter(c => c.direction === 'inbound').length,
      outbound: dayCalls.filter(c => c.direction === 'outbound').length
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

  const stats = [
    {
      title: "Total Calls",
      value: totalCalls,
      change: "+12%",
      icon: Phone,
      color: "#3B82F6"
    },
    {
      title: "Active Cases",
      value: activeCases,
      change: "+8%",
      icon: Activity,
      color: "#10B981"
    },
    {
      title: "Avg Call Time",
      value: `${Math.floor(avgCallDuration / 60)}:${(avgCallDuration % 60).toString().padStart(2, '0')}`,
      change: "-5%",
      icon: Clock,
      color: "#F59E0B"
    },
    {
      title: "Resolved",
      value: resolvedCases,
      change: "+15%",
      icon: CheckCircle2,
      color: "#8B5CF6"
    }
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
              Analytics Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Call center performance metrics
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={getInsetStyle()}
                    >
                      <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
                      background: colors.insetBg,
                      boxShadow: colors.insetShadow,
                      color: '#16a34a'
                    }}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: colors.text }}>
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Call Volume Chart */}
          <Card
            className="border-0"
            style={{
              background: colors.bg,
              boxShadow: colors.cardShadow
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: colors.textPrimary }}>Call Volume (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={callVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                  <XAxis dataKey="date" stroke={colors.textSecondary} />
                  <YAxis stroke={colors.textSecondary} />
                  <Tooltip
                    contentStyle={{
                      background: isDark ? 'rgba(42, 46, 58, 0.95)' : 'rgba(224, 229, 236, 0.95)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`,
                      color: colors.text
                    }}
                  />
                  <Bar dataKey="inbound" fill={colors.success} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="outbound" fill={colors.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: colors.success }} />
                  <span className="text-sm" style={{ color: colors.textSecondary }}>Inbound</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: colors.primary }} />
                  <span className="text-sm" style={{ color: colors.textSecondary }}>Outbound</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Case Status Distribution */}
          <Card
            className="border-0"
            style={{
              background: colors.bg,
              boxShadow: colors.cardShadow
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: colors.textPrimary }}>Case Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={caseStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : null}
                    labelLine={true}
                  >
                    {caseStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: isDark ? 'rgba(42, 46, 58, 0.95)' : 'rgba(224, 229, 236, 0.95)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`,
                      color: colors.text
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card
            className="border-0"
            style={{
              background: colors.bg,
              boxShadow: colors.cardShadow
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: colors.textPrimary }}>Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priorityData.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                        {item.name}
                      </span>
                      <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                        {item.value}
                      </span>
                    </div>
                    <div
                      className="h-3 rounded-full overflow-hidden"
                      style={{
                        background: colors.bg,
                        boxShadow: colors.innerBarShadow
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.value / cases.length) * 100}%` }}
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

          {/* Quick Stats */}
          <Card
            className="border-0"
            style={{
              background: colors.bg,
              boxShadow: colors.cardShadow
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: colors.textPrimary }}>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowLight}, -4px -4px 8px ${colors.shadowDark}`
                }}
              >
                <div className="flex items-center gap-3">
                  <PhoneIncoming className="w-5 h-5" style={{ color: colors.success }} />
                  <span className="font-medium" style={{ color: colors.textPrimary }}>Inbound Calls</span>
                </div>
                <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {inboundCalls}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowLight}, -4px -4px 8px ${colors.shadowDark}`
                }}
              >
                <div className="flex items-center gap-3">
                  <PhoneOutgoing className="w-5 h-5" style={{ color: colors.primary }} />
                  <span className="font-medium" style={{ color: colors.textPrimary }}>Outbound Calls</span>
                </div>
                <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {outboundCalls}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowLight}, -4px -4px 8px ${colors.shadowDark}`
                }}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5" style={{ color: colors.info }} />
                  <span className="font-medium" style={{ color: colors.textPrimary }}>SMS Sent</span>
                </div>
                <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {sms.length}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowLight}, -4px -4px 8px ${colors.shadowDark}`
                }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" style={{ color: colors.success }} />
                  <span className="font-medium" style={{ color: colors.textPrimary }}>Tasks Completed</span>
                </div>
                <span className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {completedTasks}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowLight}, -4px -4px 8px ${colors.shadowDark}`
                }}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" style={{ color: colors.danger }} />
                  <span className="font-medium" style={{ color: colors.textPrimary }}>Urgent Cases</span>
                </div>
                <span className="text-xl font-bold" style={{ color: colors.danger }}>
                  {urgentCases}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}