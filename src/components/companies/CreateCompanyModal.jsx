import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, Upload } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function CreateCompanyModal({ isOpen, onClose, company }) {
  const queryClient = useQueryClient();
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_logo_url: '',
    website: '',
    hr_contact_name: '',
    hr_contact_phone: '',
    hr_contact_email: '',
    broker_contact_name: '',
    broker_contact_phone: '',
    broker_contact_email: '',
    carrier_dental_name: '',
    carrier_dental_phone: '',
    carrier_medical_name: '',
    carrier_medical_phone: '',
    carrier_vision_name: '',
    carrier_vision_phone: '',
    carrier_life_name: '',
    carrier_life_phone: '',
    carrier_disability_name: '',
    carrier_disability_phone: '',
    notes: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData(company);
    } else {
      setFormData({
        company_name: '',
        company_logo_url: '',
        website: '',
        hr_contact_name: '',
        hr_contact_phone: '',
        hr_contact_email: '',
        broker_contact_name: '',
        broker_contact_phone: '',
        broker_contact_email: '',
        carrier_dental_name: '',
        carrier_dental_phone: '',
        carrier_medical_name: '',
        carrier_medical_phone: '',
        carrier_vision_name: '',
        carrier_vision_phone: '',
        carrier_life_name: '',
        carrier_life_phone: '',
        carrier_disability_name: '',
        carrier_disability_phone: '',
        notes: ''
      });
    }
    setLogoFile(null);
  }, [company, isOpen]);

  const createCompanyMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, company_logo_url: result.file_url });
      setLogoFile(file);
    } catch (error) {
      console.error('Failed to upload logo:', error);
      alert('Failed to upload logo. Please try again.');
    }
    setIsUploadingLogo(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) {
      alert('Please enter a company name');
      return;
    }

    if (company) {
      updateCompanyMutation.mutate({ id: company.id, data: formData });
    } else {
      createCompanyMutation.mutate(formData);
    }
  };

  const isPending = createCompanyMutation.isPending || updateCompanyMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto border-0"
        style={{
          background: colors.bg,
          boxShadow: `20px 20px 40px ${colors.shadowDark}, -20px -20px 40px ${colors.shadowLight}`
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: colors.text }}>
            {company ? 'Edit Company' : 'Create New Company'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList
              className="rounded-2xl border-0 p-1 w-full"
              style={getInsetStyle()}
            >
              <TabsTrigger value="basic" className="rounded-xl flex-1" style={{color: colors.textSecondary}}>
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="contacts" className="rounded-xl flex-1" style={{color: colors.textSecondary}}>
                Contacts
              </TabsTrigger>
              <TabsTrigger value="carriers" className="rounded-xl flex-1" style={{color: colors.textSecondary}}>
                Carriers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Company Name */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                  Company Name *
                </label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  placeholder="Enter company name"
                  className="rounded-2xl border-0 h-12"
                  style={{ ...getInsetStyle(), color: colors.text }}
                  required
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  {formData.company_logo_url && (
                    <div
                      className="w-20 h-20 rounded-2xl overflow-hidden"
                      style={getInsetStyle()}
                    >
                      <img
                        src={formData.company_logo_url}
                        alt="Company logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <label
                    className="flex-1 rounded-2xl h-12 px-4 border-0 flex items-center justify-center gap-2 cursor-pointer"
                    style={getButtonStyle()}
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.company_logo_url && (
                  <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                    Logo uploaded successfully
                  </p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                  Website
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://example.com"
                  className="rounded-2xl border-0 h-12"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                  Notes
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes about the company..."
                  className="rounded-2xl border-0 min-h-24"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-6 mt-4">
              {/* HR Contact */}
              <div
                className="p-4 rounded-2xl"
                style={getButtonStyle()}
              >
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.text }}>
                  <Mail className="w-4 h-4" />
                  HR Contact
                </h3>
                <div className="space-y-3">
                  <Input
                    value={formData.hr_contact_name}
                    onChange={(e) => setFormData({...formData, hr_contact_name: e.target.value})}
                    placeholder="HR Contact Name"
                    className="rounded-2xl border-0 h-10"
                    style={{ ...getInsetStyle(), color: colors.text }}
                  />
                  <Input
                    value={formData.hr_contact_phone}
                    onChange={(e) => setFormData({...formData, hr_contact_phone: e.target.value})}
                    placeholder="HR Phone Number"
                    className="rounded-2xl border-0 h-10"
                    style={{ ...getInsetStyle(), color: colors.text }}
                  />
                  <Input
                    type="email"
                    value={formData.hr_contact_email}
                    onChange={(e) => setFormData({...formData, hr_contact_email: e.target.value})}
                    placeholder="HR Email Address"
                    className="rounded-2xl border-0 h-10"
                    style={{ ...getInsetStyle(), color: colors.text }}
                  />
                </div>
              </div>

              {/* Broker Contact */}
              <div
                className="p-4 rounded-2xl"
                style={getButtonStyle()}
              >
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.text }}>
                  <Phone className="w-4 h-4" />
                  Broker Contact
                </h3>
                <div className="space-y-3">
                  <Input
                    value={formData.broker_contact_name}
                    onChange={(e) => setFormData({...formData, broker_contact_name: e.target.value})}
                    placeholder="Broker Contact Name"
                    className="rounded-2xl border-0 h-10"
                    style={{ ...getInsetStyle(), color: colors.text }}
                  />
                  <Input
                    value={formData.broker_contact_phone}
                    onChange={(e) => setFormData({...formData, broker_contact_phone: e.target.value})}
                    placeholder="Broker Phone Number"
                    className="rounded-2xl border-0 h-10"
                    style={{ ...getInsetStyle(), color: colors.text }}
                  />
                  <Input
                    type="email"
                    value={formData.broker_contact_email}
                    onChange={(e) => setFormData({...formData, broker_contact_email: e.target.value})}
                    placeholder="Broker Email Address"
                    className="rounded-2xl border-0 h-10"
                    style={{ ...getInsetStyle(), color: colors.text }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="carriers" className="space-y-4 mt-4">
              {/* Dental */}
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  value={formData.carrier_dental_name}
                  onChange={(e) => setFormData({...formData, carrier_dental_name: e.target.value})}
                  placeholder="Dental Carrier Name"
                  className="rounded-2xl border-0 h-10"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
                <Input
                  value={formData.carrier_dental_phone}
                  onChange={(e) => setFormData({...formData, carrier_dental_phone: e.target.value})}
                  placeholder="Dental Phone"
                  className="rounded-2xl border-0 h-10"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
              </div>

              {/* Medical */}
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  value={formData.carrier_medical_name}
                  onChange={(e) => setFormData({...formData, carrier_medical_name: e.target.value})}
                  placeholder="Medical Carrier Name"
                  className="rounded-2xl border-0 h-10"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
                <Input
                  value={formData.carrier_medical_phone}
                  onChange={(e) => setFormData({...formData, carrier_medical_phone: e.target.value})}
                  placeholder="Medical Phone"
                  className="rounded-2xl border-0 h-10"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
              </div>

              {/* Vision */}
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  value={formData.carrier_vision_name}
                  onChange={(e) => setFormData({...formData, carrier_vision_name: e.target.value})}
                  placeholder="Vision Carrier Name"
                  className="rounded-2xl border-0 h-10"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
                <Input
                  value={formData.carrier_vision_phone}
                  onChange={(e) => setFormData({...formData, carrier_vision_phone: e.target.value})}
                  placeholder="Vision Phone"
                  className="rounded-2xl border-0 h-10"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
              </div>

              {/* Life */}
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  value={formData.carrier_life_name}
                  onChange={(e) => setFormData({...formData, carrier_life_name: e.target.value})}
                  placeholder="Life Insurance Carrier Name"
                  className="rounded-2xl border-0 h-10"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
                <Input
                  value={formData.carrier_life_phone}
                  onChange={(e) => setFormData({...formData, carrier_life_phone: e.target.value})}
                  placeholder="Life Insurance Phone"
                  className="rounded-2xl border-0 h-10"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
              </div>

              {/* Disability */}
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  value={formData.carrier_disability_name}
                  onChange={(e) => setFormData({...formData, carrier_disability_name: e.target.value})}
                  placeholder="Disability Carrier Name"
                  className="rounded-2xl border-0 h-10"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
                <Input
                  value={formData.carrier_disability_phone}
                  onChange={(e) => setFormData({...formData, carrier_disability_phone: e.target.value})}
                  placeholder="Disability Phone"
                  className="rounded-2xl border-0 h-10"
                  style={{ ...getInsetStyle(), color: colors.text }}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: colors.border }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl h-12 px-6 border-0"
              style={getButtonStyle()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-2xl h-12 px-6 border-0 font-medium"
              style={{ ...getButtonStyle(), color: colors.green }}
            >
              {isPending ? 'Saving...' : company ? 'Update Company' : 'Create Company'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}