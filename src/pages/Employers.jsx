import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Search,
  Building2,
  X,
  Save,
  Users,
  Phone,
  FileText,
  Map
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

export default function EmployersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState(null);
  const [formData, setFormData] = useState({
    employer_name: "",
    industry: "",
    employee_count: "",
    ceo_name: "",
    cfo_name: "",
    hr_director_name: "",
    key_contacts: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    benefit_guide_url: "",
    notes: "",
    map_medical_carrier: "", map_medical_group: "",
    map_dental_carrier: "", map_dental_group: "",
    map_vision_carrier: "", map_vision_group: "",
    map_life_carrier: "", map_life_group: "",
    map_disability_carrier: "", map_disability_group: ""
  });

  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const queryClient = useQueryClient();

  const { data: employers = [], isLoading } = useQuery({
    queryKey: ['employers'],
    queryFn: () => base44.entities.Employer.list('employer_name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Employer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employers'] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employers'] });
      setShowModal(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      employer_name: "",
      industry: "",
      employee_count: "",
      ceo_name: "",
      cfo_name: "",
      hr_director_name: "",
      key_contacts: "",
      address_street: "",
      address_city: "",
      address_state: "",
      address_zip: "",
      contact_person: "",
      contact_phone: "",
      contact_email: "",
      benefit_guide_url: "",
      notes: "",
      map_medical_carrier: "", map_medical_group: "",
      map_dental_carrier: "", map_dental_group: "",
      map_vision_carrier: "", map_vision_group: "",
      map_life_carrier: "", map_life_group: "",
      map_disability_carrier: "", map_disability_group: ""
      });
      setEditingEmployer(null);
  };

  const handleEdit = (employer) => {
    setEditingEmployer(employer);
    setFormData({ ...employer });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      employee_count: formData.employee_count ? parseInt(formData.employee_count) : null
    };

    if (editingEmployer) {
      updateMutation.mutate({ id: editingEmployer.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const filteredEmployers = employers.filter(emp =>
    emp.employer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.text }}>
              Employers
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Manage employer companies
            </p>
          </div>
          
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="rounded-2xl h-12 px-6 font-medium text-sm border-0 flex items-center gap-2"
            style={getButtonStyle()}
          >
            <Plus className="w-4 h-4" />
            New Employer
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <div className="rounded-2xl" style={getInsetStyle()}>
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ color: colors.textSecondary }} />
            <Input
              placeholder="Search employers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-3 border-0 rounded-2xl h-12 text-sm"
              style={{ background: 'transparent', color: colors.text }}
            />
          </div>
        </div>

        {/* Employers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployers.map((employer, index) => (
            <motion.div
              key={employer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="border-0 cursor-pointer"
                onClick={() => handleEdit(employer)}
                style={{
                  background: colors.bg,
                  boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
                }}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={getInsetStyle()}
                    >
                      <Building2 className="w-6 h-6" style={{ color: colors.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base mb-1 truncate" style={{ color: colors.text }}>
                        {employer.employer_name}
                      </CardTitle>
                      {employer.industry && (
                        <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                          {employer.industry}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {employer.employee_count && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                        <Users className="w-4 h-4" />
                        <span>{employer.employee_count.toLocaleString()} employees</span>
                      </div>
                    )}
                    {employer.contact_phone && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                        <Phone className="w-4 h-4" />
                        <span>{employer.contact_phone}</span>
                      </div>
                    )}
                    {employer.benefit_guide_url && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                        <FileText className="w-4 h-4" />
                        <span>Benefit Guide Available</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl"
                style={{
                  background: colors.bg,
                  boxShadow: `20px 20px 40px ${colors.shadowDark}, -20px -20px 40px ${colors.shadowLight}`
                }}
              >
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
                      {editingEmployer ? 'Edit Employer' : 'New Employer'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="rounded-xl h-10 w-10 flex items-center justify-center border-0"
                      style={getButtonStyle()}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        Employer Name *
                      </label>
                      <Input
                        required
                        value={formData.employer_name}
                        onChange={(e) => setFormData({...formData, employer_name: e.target.value})}
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        Industry
                      </label>
                      <Input
                        value={formData.industry}
                        onChange={(e) => setFormData({...formData, industry: e.target.value})}
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        Employee Count
                      </label>
                      <Input
                        type="number"
                        value={formData.employee_count}
                        onChange={(e) => setFormData({...formData, employee_count: e.target.value})}
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        CEO Name
                      </label>
                      <Input
                        value={formData.ceo_name}
                        onChange={(e) => setFormData({...formData, ceo_name: e.target.value})}
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        CFO Name
                      </label>
                      <Input
                        value={formData.cfo_name}
                        onChange={(e) => setFormData({...formData, cfo_name: e.target.value})}
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        HR Director Name
                      </label>
                      <Input
                        value={formData.hr_director_name}
                        onChange={(e) => setFormData({...formData, hr_director_name: e.target.value})}
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        Key Contacts / Persons of Interest
                      </label>
                      <Input
                        value={formData.key_contacts}
                        onChange={(e) => setFormData({...formData, key_contacts: e.target.value})}
                        placeholder="John Smith, Jane Doe"
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        Benefit Guide URL
                      </label>
                      <Input
                        type="url"
                        value={formData.benefit_guide_url}
                        onChange={(e) => setFormData({...formData, benefit_guide_url: e.target.value})}
                        placeholder="https://example.com/benefit-guide.pdf"
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        Street Address
                      </label>
                      <Input
                        value={formData.address_street}
                        onChange={(e) => setFormData({...formData, address_street: e.target.value})}
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        City
                      </label>
                      <Input
                        value={formData.address_city}
                        onChange={(e) => setFormData({...formData, address_city: e.target.value})}
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          State
                        </label>
                        <Input
                          value={formData.address_state}
                          onChange={(e) => setFormData({...formData, address_state: e.target.value})}
                          className="rounded-2xl border-0 h-12"
                          style={getInsetStyle()}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          ZIP
                        </label>
                        <Input
                          value={formData.address_zip}
                          onChange={(e) => setFormData({...formData, address_zip: e.target.value})}
                          className="rounded-2xl border-0 h-12"
                          style={getInsetStyle()}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        Contact Person
                      </label>
                      <Input
                        value={formData.contact_person}
                        onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        Contact Phone
                      </label>
                      <Input
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        Contact Email
                      </label>
                      <Input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        Notes
                      </label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="rounded-2xl border-0 min-h-24"
                        style={getInsetStyle()}
                      />
                    </div>

                    {/* Map Network Settings */}
                    <div className="md:col-span-2 mt-2">
                      <div className="flex items-center gap-2 mb-4 pt-4" style={{ borderTop: `1px solid ${colors.border || "#e5e7eb"}` }}>
                        <Map className="w-4 h-4" style={{ color: "#3b82f6" }} />
                        <span className="text-base font-semibold" style={{ color: colors.text }}>Map Network Settings</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1e40af" }}>
                          Applied to all employees at this company
                        </span>
                      </div>
                      <p className="text-xs mb-4" style={{ color: colors.textSecondary }}>
                        Define the carrier and group number for each benefit type. These will be used to display in-network providers on the customer provider map.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          { key: "medical",    label: "Medical",    color: "#ef4444" },
                          { key: "dental",     label: "Dental",     color: "#3b82f6" },
                          { key: "vision",     label: "Vision",     color: "#8b5cf6" },
                          { key: "life",       label: "Life",       color: "#10b981" },
                          { key: "disability", label: "Disability", color: "#f59e0b" },
                        ].map(({ key, label, color }) => (
                          <div key={key} className="rounded-2xl p-4" style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                              <span className="text-sm font-semibold" style={{ color: colors.text }}>{label}</span>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Carrier Name</label>
                                <Input
                                  placeholder={`e.g. Blue Cross Blue Shield`}
                                  value={formData[`map_${key}_carrier`] || ""}
                                  onChange={(e) => setFormData({ ...formData, [`map_${key}_carrier`]: e.target.value })}
                                  className="rounded-xl border-0 h-10 text-sm"
                                  style={getInsetStyle()}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Group Number</label>
                                <Input
                                  placeholder={`e.g. GRP-00123`}
                                  value={formData[`map_${key}_group`] || ""}
                                  onChange={(e) => setFormData({ ...formData, [`map_${key}_group`]: e.target.value })}
                                  className="rounded-xl border-0 h-10 text-sm"
                                  style={getInsetStyle()}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="rounded-2xl h-12 px-6 border-0"
                      style={getButtonStyle()}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-2xl h-12 px-6 border-0"
                      style={{...getButtonStyle(), color: colors.success}}
                    >
                      <Save className="w-4 h-4 mr-2 inline" />
                      {editingEmployer ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}