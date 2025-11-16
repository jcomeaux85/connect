import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Phone, MessageSquare, FileText, CheckCircle2, Search, Filter, Download } from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TimelinePage() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAssignedTo, setFilterAssignedTo] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [filterCase, setFilterCase] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const { colors, isDark, getButtonStyle, getInsetStyle } = useTheme();

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

  const { data: calls = [] } = useQuery({
    queryKey: ['all-calls'],
    queryFn: () => base44.entities.Call.list('-created_date', 500),
    enabled: !!user,
  });

  const { data: smsMessages = [] } = useQuery({
    queryKey: ['all-sms'],
    queryFn: () => base44.entities.SMS.list('-created_date', 500),
    enabled: !!user,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['all-notes'],
    queryFn: () => base44.entities.Note.list('-created_date', 500),
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
    enabled: !!user,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['all-cases'],
    queryFn: () => base44.entities.Case.list('-updated_date', 500),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => base44.entities.Customer.list('-updated_date', 500),
    enabled: !!user,
  });

  // Combine all activities
  const allActivity = [
    ...calls.map(c => ({ ...c, type: 'call', timestamp: c.created_date })),
    ...smsMessages.map(s => ({ ...s, type: 'sms', timestamp: s.created_date || s.sent_at })),
    ...notes.map(n => ({ ...n, type: 'note', timestamp: n.created_date })),
    ...tasks.map(t => ({ ...t, type: 'task', timestamp: t.created_date }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Add case details to activities
  const activitiesWithDetails = allActivity.map(activity => {
    const caseData = cases.find(c => c.id === activity.case_id);
    return {
      ...activity,
      case: caseData
    };
  });

  // Apply filters
  const filteredActivities = activitiesWithDetails.filter(activity => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesCase = activity.case?.case_number?.toLowerCase().includes(searchLower);
      const matchesCustomer = activity.case?.customer_name?.toLowerCase().includes(searchLower);
      const matchesContent = activity.content?.toLowerCase().includes(searchLower);
      const matchesMessage = activity.message?.toLowerCase().includes(searchLower);
      const matchesTitle = activity.title?.toLowerCase().includes(searchLower);
      if (!matchesCase && !matchesCustomer && !matchesContent && !matchesMessage && !matchesTitle) return false;
    }

    // Type filter
    if (filterType !== "all" && activity.type !== filterType) return false;

    // Assigned to filter
    if (filterAssignedTo !== "all" && activity.case?.assigned_to !== filterAssignedTo) return false;

    // Customer filter
    if (filterCustomer !== "all" && activity.case?.customer_id !== filterCustomer) return false;

    // Case filter
    if (filterCase !== "all" && activity.case_id !== filterCase) return false;

    // Date range filter
    if (dateFrom && new Date(activity.timestamp) < new Date(dateFrom)) return false;
    if (dateTo && new Date(activity.timestamp) > new Date(dateTo)) return false;

    return true;
  });

  const formatCallDuration = (seconds) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'call': return Phone;
      case 'sms': return MessageSquare;
      case 'note': return FileText;
      case 'task': return CheckCircle2;
      default: return Activity;
    }
  };

  const uniqueCustomers = [...new Map(customers.map(c => [c.id, c])).values()];
  const uniqueCases = [...new Map(cases.map(c => [c.id, c])).values()];

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

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
              Activity Timeline
            </h1>
            <p style={{ color: colors.textSecondary }}>
              {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
            </p>
          </div>
          <Button
            className="rounded-2xl h-12 px-6 border-0"
            style={{ ...getButtonStyle('6px'), color: colors.textSecondary }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card
          className="border-0"
          style={{
            background: colors.bg,
            boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: colors.textTertiary }} />
              <Input
                placeholder="Search by case, customer, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl border-0 h-12"
                style={{ ...getInsetStyle('4px'), color: colors.text }}
              />
            </div>

            {/* Filter Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="rounded-2xl border-0 h-12" style={{ ...getInsetStyle('3px'), color: colors.text }}>
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="call">Calls</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAssignedTo} onValueChange={setFilterAssignedTo}>
                <SelectTrigger className="rounded-2xl border-0 h-12" style={{ ...getInsetStyle('3px'), color: colors.text }}>
                  <SelectValue placeholder="Assigned To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.email} value={u.email}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                <SelectTrigger className="rounded-2xl border-0 h-12" style={{ ...getInsetStyle('3px'), color: colors.text }}>
                  <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {uniqueCustomers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCase} onValueChange={setFilterCase}>
                <SelectTrigger className="rounded-2xl border-0 h-12" style={{ ...getInsetStyle('3px'), color: colors.text }}>
                  <SelectValue placeholder="Case" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  {uniqueCases.slice(0, 50).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.case_number} - {c.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm mb-2 block" style={{ color: colors.textSecondary }}>From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-2xl border-0 h-12"
                  style={{ ...getInsetStyle('3px'), color: colors.text }}
                />
              </div>
              <div>
                <label className="text-sm mb-2 block" style={{ color: colors.textSecondary }}>To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-2xl border-0 h-12"
                  style={{ ...getInsetStyle('3px'), color: colors.text }}
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || filterType !== "all" || filterAssignedTo !== "all" || filterCustomer !== "all" || filterCase !== "all" || dateFrom || dateTo) && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                  setFilterAssignedTo("all");
                  setFilterCustomer("all");
                  setFilterCase("all");
                  setDateFrom("");
                  setDateTo("");
                }}
                variant="outline"
                className="rounded-2xl h-10"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Activity List */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
              }}
            >
              <CardContent className="text-center py-12">
                <Activity className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textTertiary }} />
                <p style={{ color: colors.textSecondary }}>No activities found</p>
              </CardContent>
            </Card>
          ) : (
            filteredActivities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              
              return (
                <motion.div
                  key={`${activity.type}-${activity.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Link to={activity.case_id ? createPageUrl(`Case?id=${activity.case_id}`) : '#'}>
                    <Card
                      className="border-0 cursor-pointer hover:scale-[1.01] transition-transform"
                      style={{
                        background: colors.bg,
                        boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{
                              ...getButtonStyle('4px'),
                            }}
                          >
                            <Icon className="w-6 h-6" style={{ color: colors.textSecondary }} />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold mb-1" style={{ color: colors.text }}>
                                  {activity.type === 'call' && `${activity.direction === 'inbound' ? 'Incoming' : 'Outgoing'} Call`}
                                  {activity.type === 'sms' && `SMS ${activity.direction === 'sent' ? 'Sent' : 'Received'}`}
                                  {activity.type === 'note' && 'Note Added'}
                                  {activity.type === 'task' && `Task: ${activity.title}`}
                                </h4>
                                {activity.case && (
                                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                                    {activity.case.case_number} - {activity.case.customer_name}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs" style={{ color: colors.textTertiary }}>
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                              </span>
                            </div>

                            {activity.type === 'call' && activity.duration && (
                              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                                Duration: {formatCallDuration(activity.duration)}
                                {activity.recording_url === 'transcript_enabled' && ' (Transcript Recorded)'}
                              </p>
                            )}
                            {activity.type === 'sms' && (
                              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                                {activity.message}
                              </p>
                            )}
                            {activity.type === 'note' && (
                              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                                {activity.content}
                              </p>
                            )}
                            {activity.type === 'task' && (
                              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                                Status: {activity.status} • Priority: {activity.priority}
                              </p>
                            )}

                            <p className="text-xs" style={{ color: colors.textTertiary }}>
                              {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}