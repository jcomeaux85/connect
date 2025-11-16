
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, PhoneIncoming, PhoneOutgoing, Search, Filter, Download, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CallLogPage() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDirection, setFilterDirection] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignedTo, setFilterAssignedTo] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("all");
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

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['all-calls'],
    queryFn: () => base44.entities.Call.list('-created_date', 500),
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

  // Get case details for each call
  const callsWithDetails = calls.map(call => {
    const caseData = cases.find(c => c.id === call.case_id);
    return {
      ...call,
      case: caseData
    };
  });

  // Apply filters
  const filteredCalls = callsWithDetails.filter(call => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesPhone = call.customer_phone?.toLowerCase().includes(searchLower);
      const matchesCase = call.case?.case_number?.toLowerCase().includes(searchLower);
      const matchesCustomer = call.case?.customer_name?.toLowerCase().includes(searchLower);
      if (!matchesPhone && !matchesCase && !matchesCustomer) return false;
    }

    // Direction filter
    if (filterDirection !== "all" && call.direction !== filterDirection) return false;

    // Status filter
    if (filterStatus !== "all" && call.status !== filterStatus) return false;

    // Assigned to filter
    if (filterAssignedTo !== "all" && call.case?.assigned_to !== filterAssignedTo) return false;

    // Customer filter
    if (filterCustomer !== "all" && call.case?.customer_id !== filterCustomer) return false;

    // Date range filter
    if (dateFrom && new Date(call.created_date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(call.created_date) > new Date(dateTo)) return false;

    return true;
  });

  const formatCallDuration = (seconds) => {
    if (!seconds) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const uniqueCustomers = [...new Map(customers.map(c => [c.id, c])).values()];

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
              Call Log
            </h1>
            <p style={{ color: colors.textSecondary }}>
              {filteredCalls.length} {filteredCalls.length === 1 ? 'call' : 'calls'}
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
                placeholder="Search by phone, case, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl border-0 h-12"
                style={{ ...getInsetStyle('4px'), color: colors.text }}
              />
            </div>

            {/* Filter Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filterDirection} onValueChange={setFilterDirection}>
                <SelectTrigger className="rounded-2xl border-0 h-12" style={{ ...getInsetStyle('3px'), color: colors.text }}>
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="rounded-2xl border-0 h-12" style={{ ...getInsetStyle('3px'), color: colors.text }}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
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
            {(searchQuery || filterDirection !== "all" || filterStatus !== "all" || filterAssignedTo !== "all" || filterCustomer !== "all" || dateFrom || dateTo) && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setFilterDirection("all");
                  setFilterStatus("all");
                  setFilterAssignedTo("all");
                  setFilterCustomer("all");
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

        {/* Call List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.text }}></div>
              <p style={{ color: colors.textSecondary }}>Loading calls...</p>
            </div>
          ) : filteredCalls.length === 0 ? (
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
              }}
            >
              <CardContent className="text-center py-12">
                <Phone className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textTertiary }} />
                <p style={{ color: colors.textSecondary }}>No calls found</p>
              </CardContent>
            </Card>
          ) : (
            filteredCalls.map((call, index) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={call.case_id ? createPageUrl(`Case?id=${call.case_id}`) : '#'}>
                  <Card
                    className="border-0 cursor-pointer hover:scale-[1.01] transition-transform"
                    style={{
                      background: colors.bg,
                      boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: call.direction === 'inbound'
                                ? isDark ? 'linear-gradient(145deg, #1f2937, #111827)' : 'linear-gradient(145deg, #dbeafe, #bfdbfe)'
                                : isDark ? 'linear-gradient(145deg, #1c2b29, #0c1817)' : 'linear-gradient(145deg, #dcfce7, #bbf7d0)',
                              boxShadow: `inset 4px 4px 8px ${colors.shadowDark}50, inset -4px -4px 8px ${colors.shadowLight}50`
                            }}
                          >
                            {call.direction === 'inbound' ? (
                              <PhoneIncoming className="w-6 h-6" style={{ color: isDark ? '#93c5fd' : '#3b82f6' }} />
                            ) : (
                              <PhoneOutgoing className="w-6 h-6" style={{ color: isDark ? '#6ee7b7' : '#10b981' }} />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg" style={{ color: colors.text }}>
                                {call.customer_phone}
                              </h3>
                              <Badge
                                className="border-0 text-xs px-2 py-0.5"
                                style={{
                                  background: call.status === 'completed'
                                    ? isDark ? 'linear-gradient(145deg, #1c2b29, #0c1817)' : 'linear-gradient(145deg, #dcfce7, #bbf7d0)'
                                    : call.status === 'in_progress'
                                    ? isDark ? 'linear-gradient(145deg, #1e293b, #0f172a)' : 'linear-gradient(145deg, #dbeafe, #bfdbfe)'
                                    : isDark ? 'linear-gradient(145deg, #2e1d1d, #1a0f0f)' : 'linear-gradient(145deg, #fecaca, #fca5a5)',
                                  color: call.status === 'completed'
                                    ? isDark ? '#6ee7b7' : '#065f46'
                                    : call.status === 'in_progress'
                                    ? isDark ? '#93c5fd' : '#1e40af'
                                    : isDark ? '#f87171' : '#991b1b',
                                  boxShadow: `2px 2px 4px ${colors.shadowDark}`
                                }}
                              >
                                {call.status}
                              </Badge>
                            </div>

                            {call.case && (
                              <div className="mb-2">
                                <p className="text-sm" style={{ color: colors.textSecondary }}>
                                  Case: {call.case.case_number} - {call.case.customer_name}
                                </p>
                                {call.case.assigned_to && (
                                  <p className="text-xs" style={{ color: colors.textTertiary }}>
                                    Assigned to: {users.find(u => u.email === call.case.assigned_to)?.full_name || call.case.assigned_to}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm" style={{ color: colors.textSecondary }}>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(call.created_date), 'MMM d, yyyy h:mm a')}
                              </span>
                              {call.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatCallDuration(call.duration)}
                                </span>
                              )}
                            </div>

                            {call.recording_url === 'transcript_enabled' && (
                              <Badge
                                className="mt-2 border-0 text-xs px-2 py-0.5"
                                style={{
                                  background: isDark ? 'linear-gradient(145deg, #2e1d1d, #1a0f0f)' : 'linear-gradient(145deg, #fee2e2, #fecaca)',
                                  color: isDark ? '#f87171' : '#991b1b',
                                  boxShadow: `2px 2px 4px ${colors.shadowDark}`
                                }}
                              >
                                Transcript Recorded
                              </Badge>
                            )}
                            <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>
                              {formatDistanceToNow(new Date(call.created_date), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
