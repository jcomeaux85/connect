import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CreateCustomerModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    primary_phone: '',
    secondary_phone: '',
    primary_email: '',
    secondary_email: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    company_id: '',
    client_id: '',
    hire_date: '',
    job_title: '',
    employee_id: '',
    member_id: '',
    group_number: '',
    call_category: 'other',
    call_type: 'other',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch companies and clients
  const { data: companies = [] } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => base44.entities.Company.list('-company_name', 100),
    enabled: isOpen,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => base44.entities.Client.list('-client_name', 100),
    enabled: isOpen,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.primary_phone.trim()) {
      alert('First Name, Last Name, and Primary Phone are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        primary_phone: '',
        secondary_phone: '',
        primary_email: '',
        secondary_email: '',
        address_street: '',
        address_city: '',
        address_state: '',
        address_zip: '',
        company_id: '',
        client_id: '',
        hire_date: '',
        job_title: '',
        employee_id: '',
        member_id: '',
        group_number: '',
        call_category: 'other',
        call_type: 'other',
        notes: ''
      });
      onClose();
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-3xl border-0 rounded-3xl max-h-[90vh] overflow-y-auto"
        style={{
          background: '#E0E5EC',
          boxShadow: '12px 12px 24px #a3b1c6, -12px -12px 24px #ffffff'
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold" style={{ color: '#374151' }}>
            Create New Customer Profile
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-4">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4" style={{ background: '#E0E5EC' }}>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>First Name *</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="John"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Last Name *</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Doe"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Primary Phone *</Label>
                  <Input
                    value={formData.primary_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Secondary Phone</Label>
                  <Input
                    value={formData.secondary_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondary_phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Primary Email</Label>
                  <Input
                    type="email"
                    value={formData.primary_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_email: e.target.value }))}
                    placeholder="john@example.com"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Secondary Email</Label>
                  <Input
                    type="email"
                    value={formData.secondary_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondary_email: e.target.value }))}
                    placeholder="john.doe@work.com"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label style={{ color: '#374151' }}>Street Address</Label>
                <Input
                  value={formData.address_street}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_street: e.target.value }))}
                  placeholder="123 Main St"
                  className="rounded-2xl border-0 h-12"
                  style={{
                    background: '#E0E5EC',
                    boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                    color: '#374151'
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>City</Label>
                  <Input
                    value={formData.address_city}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_city: e.target.value }))}
                    placeholder="City"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>State</Label>
                  <Input
                    value={formData.address_state}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_state: e.target.value }))}
                    placeholder="State"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>ZIP Code</Label>
                  <Input
                    value={formData.address_zip}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_zip: e.target.value }))}
                    placeholder="12345"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Company</Label>
                  <Select
                    value={formData.company_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, company_id: value }))}
                  >
                    <SelectTrigger 
                      className="rounded-2xl border-0 h-12"
                      style={{
                        background: '#E0E5EC',
                        boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                        color: '#374151'
                      }}
                    >
                      <SelectValue placeholder="Select company..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Client</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                  >
                    <SelectTrigger 
                      className="rounded-2xl border-0 h-12"
                      style={{
                        background: '#E0E5EC',
                        boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                        color: '#374151'
                      }}
                    >
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Job Title</Label>
                  <Input
                    value={formData.job_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                    placeholder="Manager"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Employee ID</Label>
                  <Input
                    value={formData.employee_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                    placeholder="EMP-12345"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Hire Date</Label>
                  <Input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insurance" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Member ID</Label>
                  <Input
                    value={formData.member_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, member_id: e.target.value }))}
                    placeholder="MEM-123456"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Group Number</Label>
                  <Input
                    value={formData.group_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, group_number: e.target.value }))}
                    placeholder="GRP-789"
                    className="rounded-2xl border-0 h-12"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                      color: '#374151'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Call Category</Label>
                  <Select
                    value={formData.call_category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, call_category: value }))}
                  >
                    <SelectTrigger 
                      className="rounded-2xl border-0 h-12"
                      style={{
                        background: '#E0E5EC',
                        boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                        color: '#374151'
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dental">Dental</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="vision">Vision</SelectItem>
                      <SelectItem value="life">Life</SelectItem>
                      <SelectItem value="disability">Disability</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label style={{ color: '#374151' }}>Call Type</Label>
                  <Select
                    value={formData.call_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, call_type: value }))}
                  >
                    <SelectTrigger 
                      className="rounded-2xl border-0 h-12"
                      style={{
                        background: '#E0E5EC',
                        boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                        color: '#374151'
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claims_assistance">Claims Assistance</SelectItem>
                      <SelectItem value="id_cards">ID Cards</SelectItem>
                      <SelectItem value="benefits_inquiry">Benefits Inquiry</SelectItem>
                      <SelectItem value="provider_search">Provider Search</SelectItem>
                      <SelectItem value="authorization">Authorization</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="enrollment">Enrollment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label style={{ color: '#374151' }}>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  className="rounded-2xl border-0 min-h-24"
                  style={{
                    background: '#E0E5EC',
                    boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                    color: '#374151'
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t" style={{ borderColor: '#D1D9E6' }}>
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-2xl h-12 px-6 border-0"
              style={{
                background: '#E0E5EC',
                boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff',
                color: '#6B7280'
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl h-12 px-6 border-0"
              style={{
                background: '#E0E5EC',
                boxShadow: '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff',
                color: '#4B5563'
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}