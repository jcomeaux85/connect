
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

export default function Customers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-updated_date'),
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

  const filteredCustomers = customers.filter(
    (customer) => {
      const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
      const matchesSearch = !searchTerm ||
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.primary_phone && customer.primary_phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.primary_email && customer.primary_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.employee_id && customer.employee_id.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || customer.call_category === selectedCategory;

      return matchesSearch && matchesCategory;
    }
  );

  const categories = [
    ...new Set(customers.map((c) => c.call_category).filter(Boolean)),
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              Customers
            </h1>
            <p className="text-base mt-1" style={{ color: colors.textMuted }}>
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
                    <Search className="h-5 w-5" style={{ color: colors.iconMuted }} />
                  </div>
                  <Input
                    id="search"
                    name="search"
                    className="block w-full pl-12 pr-3 py-3 border-0 rounded-2xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-0 text-sm"
                    placeholder="Search customers..."
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: "transparent", color: colors.textPrimary }}
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
          </CardContent>
        </Card>

        {/* Customer List */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: colors.iconMuted }} />
            <p className="mt-4" style={{ color: colors.textMuted }}>Loading customers...</p>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              layout
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredCustomers.map((customer) => (
                <motion.div
                  key={customer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                >
                  <Link to={createPageUrl(`Customer?id=${customer.id}`)}>
                    <Card
                      className="border-0 overflow-hidden h-full"
                      style={{
                        background: colors.bg,
                        boxShadow: colors.neumorphicShadowHard,
                      }}
                    >
                      <CardHeader className="relative pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-16 h-16 rounded-2xl flex items-center justify-center"
                              style={{
                                background: colors.avatarGradient,
                                boxShadow: colors.neumorphicShadowInset,
                              }}
                            >
                              <Users
                                className="w-8 h-8"
                                style={{ color: colors.iconMuted }}
                              />
                            </div>
                            <div>
                              <CardTitle
                                className="text-xl font-bold"
                                style={{ color: colors.textPrimary }}
                              >
                                {`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed Customer'}
                              </CardTitle>
                              {customer.job_title && (
                                <p
                                  className="text-sm"
                                  style={{ color: colors.textMuted }}
                                >
                                  {customer.job_title}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        {customer.call_category && (
                          <Badge
                            className="absolute top-4 right-4 border-0 text-xs px-3 py-1"
                            style={{
                              background: colors.badgeCategoryBg,
                              color: colors.badgeCategoryText,
                              boxShadow: colors.neumorphicShadowSoftSmall,
                            }}
                          >
                            {customer.call_category}
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 mb-4">
                          {customer.primary_phone && (
                            <div className="flex items-center gap-3">
                              <Phone
                                className="w-4 h-4"
                                style={{ color: colors.iconMuted }}
                              />
                              <span
                                className="text-sm"
                                style={{ color: colors.textPrimary }}
                              >
                                {customer.primary_phone}
                              </span>
                            </div>
                          )}
                          {customer.primary_email && (
                            <div className="flex items-center gap-3">
                              <Mail
                                className="w-4 h-4"
                                style={{ color: colors.iconMuted }}
                              />
                              <span
                                className="text-sm truncate"
                                style={{ color: colors.textPrimary }}
                              >
                                {customer.primary_email}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge
                            variant="outline"
                            className="border rounded-full text-xs"
                            style={{
                              borderColor: colors.borderColor,
                              color: colors.textMuted,
                            }}
                          >
                            Call Type
                          </Badge>
                          {customer.call_type && (
                            <Badge
                              className="border-0 text-xs px-3 py-1"
                              style={{
                                background: colors.badgeCallTypeBg,
                                color: colors.badgeCallTypeText,
                                boxShadow: colors.neumorphicShadowSoftSmall,
                              }}
                            >
                              {customer.call_type.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {filteredCustomers.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-lg font-medium" style={{ color: colors.textMuted }}>
              No customers found
            </p>
            <p className="mt-2 text-sm" style={{ color: colors.textFaded }}>
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
