
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Plus,
  Search,
  Grid3X3,
  LayoutList,
  FolderOpen,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  User,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/ThemeProvider";

import CreateCaseModal from "../components/cases/CreateCaseModal";

export default function Cases() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignedTo, setFilterAssignedTo] = useState("all");

  const { colors, getButtonStyle, getInsetStyle, isDark } = useTheme();

  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-updated_date'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('full_name'),
  });

  const createCaseMutation = useMutation({
    mutationFn: (caseData) => base44.entities.Case.create(caseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowCreateModal(false);
    },
    onError: (error) => {
      console.error("Failed to create case:", error);
      alert("Failed to create case. Please try again.");
    }
  });

  const assignCaseMutation = useMutation({
    mutationFn: ({ caseId, agentEmail }) => base44.entities.Case.update(caseId, { assigned_to: agentEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });

  const handleCreateCase = async (caseData) => {
    try {
      await createCaseMutation.mutateAsync(caseData);
    } catch (error) {
      console.error("Error in handleCreateCase:", error);
      throw error;
    }
  };

  const handleAssignCase = (caseId, agentEmail) => {
    assignCaseMutation.mutate({ caseId, agentEmail });
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = !searchQuery ||
      caseItem.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.policy_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || caseItem.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || caseItem.priority === filterPriority;
    const matchesAssignment = filterAssignedTo === 'all' ||
                              (filterAssignedTo === 'unassigned' && !caseItem.assigned_to) ||
                              caseItem.assigned_to === filterAssignedTo;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignment;
  });

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.text }}>
              Cases
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Manage customer insurance cases
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-2xl h-12 px-6 font-medium text-sm border-0 flex items-center gap-2"
            style={getButtonStyle()}
          >
            <Plus className="w-4 h-4" />
            New Case
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="rounded-2xl" style={getInsetStyle()}>
              <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ color: colors.textSecondary }} />
              <Input
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-3 border-0 rounded-2xl h-12 text-sm"
                style={{ background: 'transparent', color: colors.text }}
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setViewMode("grid")}
              className="rounded-2xl h-12 px-4 border-0"
              style={getButtonStyle(viewMode === "grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="rounded-2xl h-12 px-4 border-0"
              style={getButtonStyle(viewMode === "list")}
            >
              <LayoutList className="w-4 h-4" />
            </button>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-2xl h-12 px-4 border-0 text-sm"
              style={getInsetStyle()}
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="rounded-2xl h-12 px-4 border-0 text-sm"
              style={getInsetStyle()}
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={filterAssignedTo}
              onChange={(e) => setFilterAssignedTo(e.target.value)}
              className="rounded-2xl h-12 px-4 border-0 text-sm"
              style={getInsetStyle()}
            >
              <option value="all">All Agents</option>
              <option value="unassigned">Unassigned</option>
              {users.map(user => (
                <option key={user.email} value={user.email}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cases List/Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.text }}></div>
              <p className="mt-4" style={{ color: colors.textSecondary }}>Loading cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
                style={getInsetStyle()}
              >
                <FolderOpen className="w-10 h-10" style={{ color: colors.textSecondary }} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>No cases found</h3>
              <p className="mb-6" style={{ color: colors.textSecondary }}>
                {searchQuery ? "Try adjusting your search" : "Create your first case to get started"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-2xl h-12 px-6 border-0"
                  style={getButtonStyle()}
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Create First Case
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCases.map((caseItem, index) => {
                const assignedUser = users.find(u => u.email === caseItem.assigned_to);

                return (
                  <motion.div
                    key={caseItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="border-0 overflow-hidden h-full"
                      style={{
                        background: colors.bg,
                        boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
                      }}
                    >
                      <div
                        className="h-2 w-full"
                        style={{
                          background: caseItem.priority === 'urgent' ? '#EF4444' :
                                     caseItem.priority === 'high' ? '#F59E0B' :
                                     caseItem.priority === 'medium' ? '#3B82F6' : colors.textSecondary
                        }}
                      />
                      <CardContent className="p-5">
                        <Link to={createPageUrl(`Case?id=${caseItem.id}`)}>
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center"
                              style={getInsetStyle()}
                            >
                              <User className="w-6 h-6" style={{ color: colors.textSecondary }} />
                            </div>
                            <div className="flex gap-2">
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={getInsetStyle()}
                              >
                                {caseItem.status}
                              </span>
                            </div>
                          </div>

                          <h3 className="font-bold text-lg mb-1" style={{ color: colors.text }}>
                            {caseItem.customer_name}
                          </h3>
                          <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                            {caseItem.case_number} · {caseItem.case_type}
                          </p>
                        </Link>

                        <div className="space-y-2 mb-4">
                          {caseItem.customer_phone && (
                            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                              <Phone className="w-4 h-4" />
                              {caseItem.customer_phone}
                            </div>
                          )}
                          {caseItem.customer_email && (
                            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                              <Mail className="w-4 h-4" />
                              {caseItem.customer_email}
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>
                            Assigned To
                          </label>
                          <Select
                            value={caseItem.assigned_to || 'unassigned'}
                            onValueChange={(value) => handleAssignCase(caseItem.id, value === 'unassigned' ? null : value)}
                          >
                            <SelectTrigger
                              className="rounded-2xl border-0 h-9 text-xs"
                              style={getInsetStyle()}
                            >
                              <SelectValue>
                                {assignedUser ? (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {assignedUser.full_name || assignedUser.email}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1" style={{ color: colors.textSecondary }}>
                                    <UserPlus className="w-3 h-3" />
                                    Unassigned
                                  </span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent style={{ background: colors.bg, color: colors.text }}>
                              <SelectItem value="unassigned">
                                <span className="flex items-center gap-2">
                                  <UserPlus className="w-4 h-4" />
                                  Unassigned
                                </span>
                              </SelectItem>
                              {users.map(user => (
                                <SelectItem key={user.email} value={user.email}>
                                  <span className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {user.full_name || user.email}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Link to={createPageUrl(`Case?id=${caseItem.id}`)}>
                          <div className="pt-3 border-t" style={{ borderColor: colors.border }}>
                            <div className="flex items-center justify-between text-xs" style={{ color: colors.textSecondary }}>
                              <span>Updated {formatDistanceToNow(new Date(caseItem.updated_date), { addSuffix: true })}</span>
                              {caseItem.priority === 'urgent' && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Horizontal List View
            <div className="space-y-3">
              {filteredCases.map((caseItem, index) => {
                const assignedUser = users.find(u => u.email === caseItem.assigned_to);
                
                return (
                  <motion.div
                    key={caseItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link to={createPageUrl(`Case?id=${caseItem.id}`)}>
                      <div
                        className="p-4 rounded-2xl cursor-pointer hover:shadow-xl transition-all"
                        style={{
                          background: colors.bg,
                          boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`
                        }}
                      >
                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Priority Indicator */}
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              background: caseItem.priority === 'urgent' ? '#EF4444' :
                                         caseItem.priority === 'high' ? '#F59E0B' :
                                         caseItem.priority === 'medium' ? '#3B82F6' : colors.textSecondary
                            }}
                          />

                          {/* Customer Name */}
                          <div className="flex-1 min-w-[150px]">
                            <h4 className="font-semibold text-base" style={{ color: colors.text }}>
                              {caseItem.customer_name}
                            </h4>
                          </div>

                          {/* Case Number */}
                          <div className="flex-shrink-0 min-w-[120px]">
                            <span className="text-sm" style={{ color: colors.textSecondary }}>
                              {caseItem.case_number}
                            </span>
                          </div>

                          {/* Type */}
                          <div className="flex-shrink-0 min-w-[100px]">
                            <span className="text-sm" style={{ color: colors.textSecondary }}>
                              {caseItem.case_type}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="flex-shrink-0">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={getInsetStyle()}
                            >
                              {caseItem.status}
                            </span>
                          </div>

                          {/* Priority Badge */}
                          <div className="flex-shrink-0">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={getInsetStyle()}
                            >
                              {caseItem.priority}
                            </span>
                          </div>

                          {/* Assigned User */}
                          <div className="flex-shrink-0 min-w-[120px] flex items-center gap-2">
                            <User className="w-4 h-4" style={{ color: colors.textSecondary }} />
                            <span className="text-sm" style={{ color: colors.textSecondary }}>
                              {assignedUser ? (assignedUser.full_name || assignedUser.email) : 'Unassigned'}
                            </span>
                          </div>

                          {/* Updated Time */}
                          <div className="flex-shrink-0 flex items-center gap-2 text-xs" style={{ color: colors.textTertiary }}>
                            <Clock className="w-3 h-3" />
                            <span>{formatDistanceToNow(new Date(caseItem.updated_date), { addSuffix: true })}</span>
                            {caseItem.priority === 'urgent' && (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        <CreateCaseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCase}
        />
      </div>
    </div>
  );
}
