import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Building2,
  Globe,
  Mail,
  Edit3,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

import CreateCompanyModal from "../components/companies/CreateCompanyModal";

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('company_name'),
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (companyId) => base44.entities.Company.delete(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const handleEdit = (company) => {
    setEditingCompany(company);
    setShowCreateModal(true);
  };

  const handleDelete = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      deleteCompanyMutation.mutate(companyId);
    }
  };

  const filteredCompanies = companies.filter(company =>
    !searchQuery ||
    company.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.carrier_dental_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.carrier_medical_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.text }}>
              Companies
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Manage insurance carriers and company profiles
            </p>
          </div>
          
          <button
            onClick={() => {
              setEditingCompany(null);
              setShowCreateModal(true);
            }}
            className="rounded-2xl h-12 px-6 font-medium text-sm border-0 flex items-center gap-2"
            style={getButtonStyle()}
          >
            <Plus className="w-4 h-4" />
            New Company
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="rounded-2xl" style={getInsetStyle()}>
              <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ color: colors.textSecondary }} />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-3 border-0 rounded-2xl h-12 text-sm"
                style={{ background: 'transparent', color: colors.text }}
              />
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.text }}></div>
              <p className="mt-4" style={{ color: colors.textSecondary }}>Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
                style={getInsetStyle()}
              >
                <Building2 className="w-10 h-10" style={{ color: colors.textSecondary }} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>No companies found</h3>
              <p className="mb-6" style={{ color: colors.textSecondary }}>
                {searchQuery ? "Try adjusting your search" : "Create your first company to get started"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    setEditingCompany(null);
                    setShowCreateModal(true);
                  }}
                  className="rounded-2xl h-12 px-6 border-0"
                  style={getButtonStyle()}
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Create First Company
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company, index) => (
                <motion.div
                  key={company.id}
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
                    <CardContent className="p-5">
                      {/* Logo and Name */}
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                          style={getInsetStyle()}
                        >
                          {company.company_logo_url ? (
                            <img
                              src={company.company_logo_url}
                              alt={company.company_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-8 h-8" style={{ color: colors.textSecondary }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1 truncate" style={{ color: colors.text }}>
                            {company.company_name}
                          </h3>
                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm flex items-center gap-1 hover:underline truncate"
                              style={{ color: colors.textSecondary }}
                            >
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Carriers */}
                      <div className="space-y-2 mb-4">
                        {[
                          { name: company.carrier_dental_name, phone: company.carrier_dental_phone, label: 'Dental' },
                          { name: company.carrier_medical_name, phone: company.carrier_medical_phone, label: 'Medical' },
                          { name: company.carrier_vision_name, phone: company.carrier_vision_phone, label: 'Vision' },
                          { name: company.carrier_life_name, phone: company.carrier_life_phone, label: 'Life' },
                          { name: company.carrier_disability_name, phone: company.carrier_disability_phone, label: 'Disability' },
                        ].filter(carrier => carrier.name).slice(0, 3).map((carrier, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl text-xs"
                            style={getInsetStyle('2px')}
                          >
                            <div className="flex justify-between items-center">
                              <Badge
                                className="border-0 text-xs px-2 py-0.5"
                                style={{
                                  background: colors.badgeGeneralBg,
                                  color: colors.textSecondary
                                }}
                              >
                                {carrier.label}
                              </Badge>
                              <span className="font-medium" style={{ color: colors.text }}>{carrier.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Contacts */}
                      <div className="space-y-2 mb-4">
                        {company.hr_contact_email && (
                          <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">HR: {company.hr_contact_email}</span>
                          </div>
                        )}
                        {company.broker_contact_email && (
                          <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Broker: {company.broker_contact_email}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t" style={{ borderColor: colors.border }}>
                        <button
                          onClick={() => handleEdit(company)}
                          className="flex-1 rounded-2xl h-9 px-3 text-sm border-0 flex items-center justify-center gap-2"
                          style={getButtonStyle()}
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          disabled={deleteCompanyMutation.isPending}
                          className="rounded-2xl h-9 px-3 text-sm border-0 flex items-center justify-center"
                          style={{ ...getButtonStyle(), color: colors.red }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <CreateCompanyModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCompany(null);
          }}
          company={editingCompany}
        />
      </div>
    </div>
  );
}