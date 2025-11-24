import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  Briefcase,
  List,
  LayoutGrid,
  Filter,
  Loader2,
  Building2,
  FolderOpen,
  MessageSquare,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import CreateCustomerModal from "../components/customers/CreateCustomerModal";
import { useTheme } from "@/components/ThemeProvider";

// Fuzzy search helper
const fuzzyMatch = (str, pattern) => {
  if (!str || !pattern) return false;
  str = str.toLowerCase();
  pattern = pattern.toLowerCase();
  
  // Simple substring match
  if (str.includes(pattern)) return true;
  
  // Character-by-character fuzzy match
  let patternIdx = 0;
  let strIdx = 0;
  
  while (strIdx < str.length && patternIdx < pattern.length) {
    if (str[strIdx] === pattern[patternIdx]) {
      patternIdx++;
    }
    strIdx++;
  }
  
  return patternIdx === pattern.length;
};

export default function Customers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    employer: 'all',
    hasEmail: 'all',
    hasPhone: 'all',
  });

  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-updated_date'),
  });

  const { data: employers = [] } = useQuery({
    queryKey: ['employers-list'],
    queryFn: () => base44.entities.Employer.list('employer_name'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['all-cases'],
    queryFn: () => base44.entities.Case.list('-updated_date'),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (customerData) => base44.entities.Customer.create(customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
    },
  });

  const handleCreateCustomer = async (customerData) => {
    createCustomerMutation.mutate(customerData);
  };

  const filteredCustomers = customers.filter((customer) => {
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    
    // Basic fuzzy search (case insensitive, spelling forgiving)
    const matchesSearch = !searchTerm ||
      fuzzyMatch(fullName, searchTerm) ||
      fuzzyMatch(customer.primary_phone, searchTerm) ||
      fuzzyMatch(customer.primary_email, searchTerm) ||
      fuzzyMatch(customer.employee_id, searchTerm) ||
      (customer.company_name && fuzzyMatch(customer.company_name, searchTerm));

    const matchesCategory = selectedCategory === 'all' || customer.call_category === selectedCategory;

    // Advanced filters
    let matchesAdvancedFilters = true;
    if (showAdvancedSearch) {
      const matchesEmployer = advancedFilters.employer === 'all' || customer.company_id === advancedFilters.employer;
      const matchesEmail = advancedFilters.hasEmail === 'all' ||
        (advancedFilters.hasEmail === 'yes' && customer.primary_email) ||
        (advancedFilters.hasEmail === 'no' && !customer.primary_email);
      const matchesPhone = advancedFilters.hasPhone === 'all' ||
        (advancedFilters.hasPhone === 'yes' && customer.primary_phone) ||
        (advancedFilters.hasPhone === 'no' && !customer.primary_phone);

      matchesAdvancedFilters = matchesEmployer && matchesEmail && matchesPhone;
    }

    return matchesSearch && matchesCategory && matchesAdvancedFilters;
  });

  const categories = [
    ...new Set(customers.map((c) => c.call_category).filter(Boolean)),
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
              Customers
            </h1>
            <p className="text-base mt-1" style={{ color: colors.textSecondary }}>
              Manage customer profiles and information
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl h-12 px-6 font-medium border-0"
            style={{
              background: colors.bg,
              boxShadow: colors.neumorphicShadowSoft,
              color: colors.textSecondary,
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Customer
          </Button>
        </div>

        {/* Search and Filters */}
        <Card
          className="border-0 mb-8"
          style={{
            background: colors.bg,
            boxShadow: colors.neumorphicShadowHard,
          }}
        >
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <div
                    className="rounded-2xl"
                    style={{
                      background: colors.bg,
                      boxShadow: colors.neumorphicShadowInset,
                    }}
                  >
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5" style={{ color: colors.textTertiary }} />
                    </div>
                    <Input
                      id="search"
                      name="search"
                      className="block w-full pl-12 pr-3 py-3 border-0 rounded-2xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-0 text-sm"
                      placeholder="Search customers (fuzzy search enabled)..."
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ background: "transparent", color: colors.text }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Category Filter */}
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger
                      className="rounded-2xl border-0 h-12 w-full md:w-48"
                      style={{
                        background: colors.bg,
                        boxShadow: colors.neumorphicShadowSoft,
                        color: colors.textPrimary,
                      }}
                    >
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          {selectedCategory === "all"
                            ? "All Categories"
                            : selectedCategory}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Advanced Search Toggle */}
                  <Button
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className="rounded-2xl h-12 px-4 border-0 text-sm"
                    style={{
                      background: colors.bg,
                      boxShadow: showAdvancedSearch ? colors.neumorphicShadowInset : colors.neumorphicShadowSoft,
                      color: colors.textSecondary
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced
                  </Button>

                  {/* View Mode Toggle */}
                  <div
                    className="flex p-1 rounded-2xl"
                    style={{
                      background: colors.bg,
                      boxShadow: colors.neumorphicShadowInsetSoft,
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={`rounded-xl h-10 w-10 border-0`}
                      style={{
                        background: viewMode === "grid" ? colors.bg : "transparent",
                        boxShadow: viewMode === "grid" ? colors.neumorphicShadowSoft : "none",
                      }}
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className={`rounded-xl h-10 w-10 border-0`}
                      style={{
                        background: viewMode === "list" ? colors.bg : "transparent",
                        boxShadow: viewMode === "list" ? colors.neumorphicShadowSoft : "none",
                      }}
                    >
                      <List className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Advanced Search Filters */}
              <AnimatePresence>
                {showAdvancedSearch && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-wrap gap-3 overflow-hidden"
                  >
                    <Select
                      value={advancedFilters.employer}
                      onValueChange={(value) => setAdvancedFilters({...advancedFilters, employer: value})}
                    >
                      <SelectTrigger
                        className="rounded-2xl border-0 h-10 w-48"
                        style={{
                          background: colors.bg,
                          boxShadow: colors.neumorphicShadowInset,
                          color: colors.textPrimary
                        }}
                      >
                        <SelectValue placeholder="All Employers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employers</SelectItem>
                        {employers.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.employer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={advancedFilters.hasEmail}
                      onValueChange={(value) => setAdvancedFilters({...advancedFilters, hasEmail: value})}
                    >
                      <SelectTrigger
                        className="rounded-2xl border-0 h-10 w-40"
                        style={{
                          background: colors.bg,
                          boxShadow: colors.neumorphicShadowInset,
                          color: colors.textPrimary
                        }}
                      >
                        <SelectValue placeholder="Has Email" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Email</SelectItem>
                        <SelectItem value="yes">Has Email</SelectItem>
                        <SelectItem value="no">No Email</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={advancedFilters.hasPhone}
                      onValueChange={(value) => setAdvancedFilters({...advancedFilters, hasPhone: value})}
                    >
                      <SelectTrigger
                        className="rounded-2xl border-0 h-10 w-40"
                        style={{
                          background: colors.bg,
                          boxShadow: colors.neumorphicShadowInset,
                          color: colors.textPrimary
                        }}
                      >
                        <SelectValue placeholder="Has Phone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Phone</SelectItem>
                        <SelectItem value="yes">Has Phone</SelectItem>
                        <SelectItem value="no">No Phone</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => {
                        setAdvancedFilters({ employer: 'all', hasEmail: 'all', hasPhone: 'all' });
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                      className="rounded-2xl h-10 px-4 border-0 text-xs"
                      style={{
                        background: colors.bg,
                        boxShadow: colors.neumorphicShadowSoft,
                        color: colors.textTertiary
                      }}
                    >
                      Clear All
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: colors.textSecondary }} />
            <p className="mt-4" style={{ color: colors.textSecondary }}>Loading customers...</p>
          </div>
        ) : (
          <AnimatePresence>
            {viewMode === "grid" ? (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCustomers.map((customer) => {
                  const employerInfo = employers.find(e => e.id === customer.company_id);
                  const hasOpenCase = cases.some(c => c.customer_id === customer.id && (c.status === 'new' || c.status === 'in_progress'));
                  
                  return (
                    <motion.div key={customer.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} whileHover={{ y: -5 }}>
                      <Card className="border-0 overflow-hidden h-full" style={{ background: colors.bg, boxShadow: colors.neumorphicShadowHard }}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: colors.avatarGradient, boxShadow: colors.neumorphicShadowInset }}>
                              {employerInfo?.company_logo_url ? <img src={employerInfo.company_logo_url} alt={employerInfo.employer_name} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6" style={{ color: colors.textSecondary }} />}
                            </div>
                            <Link to={createPageUrl(`Customer?id=${customer.id}`)} className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold mb-1" style={{ color: colors.text }}>{`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed Customer'}</h3>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: colors.textSecondary }}>
                                {customer.job_title && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{customer.job_title}</span>}
                                {customer.primary_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.primary_phone}</span>}
                                {customer.primary_email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 flex-shrink-0" /><span className="truncate">{customer.primary_email}</span></span>}
                              </div>
                            </Link>
                            <Badge className="border-0 text-xs px-3 py-1 flex-shrink-0" style={{ background: customer.employment_status === 'terminated' ? '#FEE2E2' : '#D1FAE5', color: customer.employment_status === 'terminated' ? '#991B1B' : '#065F46', boxShadow: colors.neumorphicShadowSoftSmall }}>
                              {customer.employment_status === 'terminated' ? <><XCircle className="w-3 h-3 mr-1 inline" />Terminated</> : <><CheckCircle className="w-3 h-3 mr-1 inline" />Active</>}
                            </Badge>
                            {hasOpenCase && <div className="flex-shrink-0"><FolderOpen className="w-5 h-5" style={{ color: '#F59E0B' }} /></div>}
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button onClick={(e) => { e.preventDefault(); window.location.href = `tel:${customer.primary_phone}`; }} className="rounded-lg h-6 px-2 border-0 text-xs flex items-center gap-1" style={{ background: colors.bg, boxShadow: colors.neumorphicShadowSoft, color: '#10B981' }}><Phone className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.preventDefault(); window.location.href = createPageUrl(`Customer?id=${customer.id}`); }} className="rounded-lg h-6 px-2 border-0 text-xs flex items-center gap-1" style={{ background: colors.bg, boxShadow: colors.neumorphicShadowSoft, color: '#3B82F6' }}><MessageSquare className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.preventDefault(); window.location.href = `mailto:${customer.primary_email}`; }} className="rounded-lg h-6 px-2 border-0 text-xs flex items-center gap-1" style={{ background: colors.bg, boxShadow: colors.neumorphicShadowSoft, color: '#8B5CF6' }}><Mail className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map((customer, index) => {
                  const employerInfo = employers.find(e => e.id === customer.company_id);
                  const hasOpenCase = cases.some(c => c.customer_id === customer.id && (c.status === 'new' || c.status === 'in_progress'));
                  return (
                    <motion.div key={customer.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}>
                      <div className="p-2 rounded-2xl hover:shadow-xl transition-all" style={{ background: colors.bg, boxShadow: colors.neumorphicShadowSoft }}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: colors.avatarGradient, boxShadow: colors.neumorphicShadowInset }}>
                            {employerInfo?.company_logo_url ? <img src={employerInfo.company_logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4" style={{ color: colors.textSecondary }} />}
                          </div>
                          <Link to={createPageUrl(`Customer?id=${customer.id}`)} className="min-w-[140px]"><span className="font-semibold text-sm" style={{ color: colors.text }}>{`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A'}</span></Link>
                          <div className="min-w-[120px] text-xs truncate" style={{ color: colors.textSecondary }}>{customer.job_title || 'N/A'}</div>
                          <div className="min-w-[110px] text-xs" style={{ color: colors.textSecondary }}>{customer.primary_phone || 'N/A'}</div>
                          <div className="flex-1 min-w-[150px] text-xs truncate" style={{ color: colors.textSecondary }}>{customer.primary_email || 'N/A'}</div>
                          <Badge className="border-0 text-xs px-2 py-0.5 flex-shrink-0" style={{ background: customer.employment_status === 'terminated' ? '#FEE2E2' : '#D1FAE5', color: customer.employment_status === 'terminated' ? '#991B1B' : '#065F46' }}>
                            {customer.employment_status === 'terminated' ? 'Term' : 'Active'}
                          </Badge>
                          {hasOpenCase && <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: '#F59E0B' }} />}
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={(e) => { e.preventDefault(); window.location.href = `tel:${customer.primary_phone}`; }} className="rounded-lg h-7 w-7 border-0 flex items-center justify-center" style={{ background: colors.bg, boxShadow: colors.neumorphicShadowSoft, color: '#10B981' }}><Phone className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.preventDefault(); window.location.href = createPageUrl(`Customer?id=${customer.id}`); }} className="rounded-lg h-7 w-7 border-0 flex items-center justify-center" style={{ background: colors.bg, boxShadow: colors.neumorphicShadowSoft, color: '#3B82F6' }}><MessageSquare className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.preventDefault(); window.location.href = `mailto:${customer.primary_email}`; }} className="rounded-lg h-7 w-7 border-0 flex items-center justify-center" style={{ background: colors.bg, boxShadow: colors.neumorphicShadowSoft, color: '#8B5CF6' }}><Mail className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        )}

        {filteredCustomers.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-lg font-medium" style={{ color: colors.textSecondary }}>
              No customers found
            </p>
            <p className="mt-2 text-sm" style={{ color: colors.textTertiary }}>
              Try adjusting your search or filter.
            </p>
          </div>
        )}
      </div>

      <CreateCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCustomer}
      />
    </div>
  );
}