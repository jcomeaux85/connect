
import React, { useState } from 'react';
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
import { Plus, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function CreateCaseModal({ isOpen, onClose, onSubmit, prefilledCustomerId = null }) {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    policy_number: '',
    case_type: 'inquiry',
    priority: 'medium',
    description: '',
    assigned_to: ''
  });
  
  // Full customer profile fields
  const [customerProfile, setCustomerProfile] = useState({
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
    job_title: '',
    employee_id: '',
    member_id: '',
    group_number: '',
    call_category: '',
    call_type: '',
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(prefilledCustomerId);
  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch all customers for search
  const { data: allCustomers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => base44.entities.Customer.list('-updated_date', 100),
    enabled: isOpen && !prefilledCustomerId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => base44.entities.User.list('full_name'),
    enabled: isOpen,
  });

  const { data: prefilledCustomer } = useQuery({
    queryKey: ['customer-prefill', prefilledCustomerId],
    queryFn: async () => {
      if (!prefilledCustomerId) return null;
      const customers = await base44.entities.Customer.filter({ id: prefilledCustomerId });
      return customers[0];
    },
    enabled: !!prefilledCustomerId && isOpen,
  });

  // Filter customers based on search query
  const searchResults = customerSearchQuery.trim() 
    ? allCustomers.filter(c => 
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        c.primary_phone?.includes(customerSearchQuery) ||
        c.primary_email?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        c.employee_id?.toLowerCase().includes(customerSearchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  React.useEffect(() => {
    if (prefilledCustomerId && prefilledCustomer) {
      setSelectedCustomerId(prefilledCustomerId);
      setFormData(prev => ({
        ...prev,
        customer_name: `${prefilledCustomer.first_name} ${prefilledCustomer.last_name}`,
        customer_phone: prefilledCustomer.primary_phone || '',
        customer_email: prefilledCustomer.primary_email || '',
      }));
      setCreateNewCustomer(false);
      setCustomerSearchQuery(`${prefilledCustomer.first_name} ${prefilledCustomer.last_name}`);
    } else if (!prefilledCustomerId) {
      setSelectedCustomerId(null);
      setFormData(prev => ({
        ...prev,
        customer_name: '',
        customer_phone: '',
        customer_email: '',
      }));
      setCreateNewCustomer(false);
      setCustomerSearchQuery("");
    }
  }, [prefilledCustomerId, prefilledCustomer, isOpen]);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomerId(customer.id);
    setCreateNewCustomer(false);
    setCustomerSearchQuery(`${customer.first_name} ${customer.last_name}`);
    setFormData(prev => ({
      ...prev,
      customer_name: `${customer.first_name} ${customer.last_name}`,
      customer_phone: customer.primary_phone || '',
      customer_email: customer.primary_email || '',
    }));
    setShowSearchResults(false);
  };

  const handleCreateNewCustomerClick = () => {
    setCreateNewCustomer(true);
    setSelectedCustomerId(null);
    setCustomerSearchQuery("");
    setFormData(prev => ({
      ...prev,
      customer_name: '',
      customer_phone: '',
      customer_email: '',
    }));
    setShowSearchResults(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.description.trim()) {
      alert('Description is required');
      return;
    }

    if (!prefilledCustomerId && !selectedCustomerId && !createNewCustomer) {
      alert('Please select an existing customer or create a new one.');
      return;
    }

    if (createNewCustomer) {
      if (showFullProfile) {
        if (!customerProfile.first_name.trim() || !customerProfile.last_name.trim() || !customerProfile.primary_phone.trim()) {
          alert('First Name, Last Name, and Primary Phone are required for new customer.');
          return;
        }
      } else {
        if (!formData.customer_name.trim() || !formData.customer_phone.trim()) {
          alert('Customer Name and Phone are required for new customer.');
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      let customerId = selectedCustomerId || prefilledCustomerId;

      if (createNewCustomer) {
        let firstName, lastName;
        
        if (showFullProfile) {
          firstName = customerProfile.first_name.trim();
          lastName = customerProfile.last_name.trim();
        } else {
          const nameParts = formData.customer_name.trim().split(' ');
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ') || '';
        }

        const newCustomer = await base44.entities.Customer.create(
          showFullProfile ? {
            first_name: firstName,
            last_name: lastName,
            date_of_birth: customerProfile.date_of_birth || null,
            primary_phone: customerProfile.primary_phone,
            secondary_phone: customerProfile.secondary_phone || null,
            primary_email: customerProfile.primary_email || null,
            secondary_email: customerProfile.secondary_email || null,
            address_street: customerProfile.address_street || null,
            address_city: customerProfile.address_city || null,
            address_state: customerProfile.address_state || null,
            address_zip: customerProfile.address_zip || null,
            job_title: customerProfile.job_title || null,
            employee_id: customerProfile.employee_id || null,
            member_id: customerProfile.member_id || null,
            group_number: customerProfile.group_number || null,
            call_category: customerProfile.call_category || null,
            call_type: customerProfile.call_type || null,
            notes: customerProfile.notes || null
          } : {
            first_name: firstName,
            last_name: lastName,
            primary_phone: formData.customer_phone,
            primary_email: formData.customer_email || null,
            notes: `Customer created from case on ${new Date().toLocaleDateString()}`
          }
        );

        customerId = newCustomer.id;
      }

      const caseNumber = `CASE-${Date.now().toString().slice(-8)}`;
      
      const selectedCustomer = prefilledCustomer || allCustomers.find(c => c.id === customerId);
      
      const caseData = {
        case_number: caseNumber,
        customer_id: customerId,
        customer_name: selectedCustomer 
          ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` 
          : (showFullProfile 
            ? `${customerProfile.first_name} ${customerProfile.last_name}` 
            : formData.customer_name),
        customer_phone: selectedCustomer?.primary_phone || formData.customer_phone || customerProfile.primary_phone || null,
        customer_email: selectedCustomer?.primary_email || formData.customer_email || customerProfile.primary_email || null,
        policy_number: formData.policy_number || null,
        case_type: formData.case_type,
        priority: formData.priority,
        description: formData.description,
        status: 'new',
        assigned_to: formData.assigned_to || null
      };

      await onSubmit(caseData);
      
      // Reset form
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        policy_number: '',
        case_type: 'inquiry',
        priority: 'medium',
        description: '',
        assigned_to: ''
      });
      setCustomerProfile({
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
        job_title: '',
        employee_id: '',
        member_id: '',
        group_number: '',
        call_category: '',
        call_type: '',
        notes: ''
      });
      setSelectedCustomerId(null);
      setCreateNewCustomer(false);
      setShowFullProfile(false);
      setCustomerSearchQuery("");
      onClose(); // Close modal on success
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Failed to create case. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl border-0 rounded-3xl max-h-[90vh] overflow-y-auto"
        style={{
          background: colors.bg,
          boxShadow: 'none',
          border: `1px solid ${colors.border}`
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold" style={{ color: colors.text }}>
            Create New Case
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!prefilledCustomerId && (
            <div className="space-y-2">
              <Label style={{ color: colors.text }}>Customer *</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.iconColor }} />
                  <Input
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setShowSearchResults(true);
                      if (selectedCustomerId) { // If a customer was previously selected, clear it on search input change
                        setSelectedCustomerId(null);
                        setFormData(prev => ({
                          ...prev,
                          customer_name: '',
                          customer_phone: '',
                          customer_email: '',
                        }));
                      }
                      if (createNewCustomer) { // If creating new customer, clear that state too
                        setCreateNewCustomer(false);
                      }
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)} // Delay to allow click on results
                    placeholder="Search customer by name, phone, email..."
                    className="pl-11 rounded-2xl border-0 h-12"
                    style={{
                      ...getInsetStyle(),
                      color: colors.text
                    }}
                  />
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && (customerSearchQuery.length > 0 || selectedCustomerId === null) && (
                  <div
                    className="absolute z-10 w-full mt-2 rounded-2xl border max-h-64 overflow-y-auto"
                    style={{
                      background: colors.bg,
                      borderColor: colors.border,
                      boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCreateNewCustomerClick}
                      className="w-full p-3 text-left hover:bg-opacity-80 transition-colors border-b flex items-center gap-2"
                      style={{
                        borderColor: colors.border,
                        color: '#10b981'
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-semibold">Create New Customer</span>
                    </button>
                    
                    {searchResults.length > 0 ? (
                      searchResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full p-3 text-left hover:bg-opacity-80 transition-colors border-b last:border-b-0"
                          style={{
                            borderColor: colors.border
                          }}
                        >
                          <div className="font-medium" style={{ color: colors.text }}>
                            {customer.first_name} {customer.last_name}
                          </div>
                          <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            {customer.primary_phone} {customer.primary_email && `· ${customer.primary_email}`}
                          </div>
                          {customer.employee_id && (
                            <div className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                              Employee ID: {customer.employee_id}
                            </div>
                          )}
                        </button>
                      ))
                    ) : customerSearchQuery.length > 0 ? (
                      <div className="p-4 text-center text-sm" style={{ color: colors.textSecondary }}>
                        No customers found. Click "Create New Customer" above.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {(createNewCustomer || (!selectedCustomerId && !prefilledCustomerId && customerSearchQuery.length === 0)) && (
            <div className={!prefilledCustomerId ? "border-t pt-4" : ""} style={{ borderColor: colors.border }}>
              {createNewCustomer && (
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium" style={{ color: '#10b981' }}>
                    Creating New Customer
                  </p>
                  <Button
                    type="button"
                    onClick={() => setShowFullProfile(!showFullProfile)}
                    className="text-xs h-8 px-3 rounded-xl border-0"
                    style={getButtonStyle()}
                  >
                    {showFullProfile ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                    {showFullProfile ? 'Basic Info' : 'Full Profile'}
                  </Button>
                </div>
              )}

              {!showFullProfile ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="customer_name" style={{ color: colors.text }}>
                      Customer Name *
                    </Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="John Doe"
                      className="rounded-2xl border-0 h-12"
                      style={getInsetStyle()}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_phone" style={{ color: colors.text }}>
                        Phone Number *
                      </Label>
                      <Input
                        id="customer_phone"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer_email" style={{ color: colors.text }}>
                        Email
                      </Label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                        placeholder="john@example.com"
                        className="rounded-2xl border-0 h-12"
                        style={getInsetStyle()}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4 p-4 rounded-2xl" style={getInsetStyle()}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>First Name *</Label>
                      <Input
                        value={customerProfile.first_name}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, first_name: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>Last Name *</Label>
                      <Input
                        value={customerProfile.last_name}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, last_name: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>Date of Birth</Label>
                      <Input
                        type="date"
                        value={customerProfile.date_of_birth}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>Primary Phone *</Label>
                      <Input
                        value={customerProfile.primary_phone}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, primary_phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>Secondary Phone</Label>
                      <Input
                        value={customerProfile.secondary_phone}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, secondary_phone: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>Primary Email</Label>
                      <Input
                        type="email"
                        value={customerProfile.primary_email}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, primary_email: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label style={{ color: colors.text }}>Address</Label>
                    <Input
                      value={customerProfile.address_street}
                      onChange={(e) => setCustomerProfile(prev => ({ ...prev, address_street: e.target.value }))}
                      placeholder="Street Address"
                      className="rounded-xl border-0 h-10"
                      style={getInsetStyle('sm')}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>City</Label>
                      <Input
                        value={customerProfile.address_city}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, address_city: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>State</Label>
                      <Input
                        value={customerProfile.address_state}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, address_state: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>ZIP</Label>
                      <Input
                        value={customerProfile.address_zip}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, address_zip: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>Job Title</Label>
                      <Input
                        value={customerProfile.job_title}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, job_title: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>Employee ID</Label>
                      <Input
                        value={customerProfile.employee_id}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, employee_id: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>Member ID</Label>
                      <Input
                        value={customerProfile.member_id}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, member_id: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>Group Number</Label>
                      <Input
                        value={customerProfile.group_number}
                        onChange={(e) => setCustomerProfile(prev => ({ ...prev, group_number: e.target.value }))}
                        className="rounded-xl border-0 h-10"
                        style={getInsetStyle('sm')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ color: colors.text }}>Call Category</Label>
                      <Select
                        value={customerProfile.call_category}
                        onValueChange={(value) => setCustomerProfile(prev => ({ ...prev, call_category: value }))}
                      >
                        <SelectTrigger className="rounded-xl border-0 h-10" style={getInsetStyle('sm')}>
                          <SelectValue placeholder="Select..." />
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
                      <Label style={{ color: colors.text }}>Call Type</Label>
                      <Select
                        value={customerProfile.call_type}
                        onValueChange={(value) => setCustomerProfile(prev => ({ ...prev, call_type: value }))}
                      >
                        <SelectTrigger className="rounded-xl border-0 h-10" style={getInsetStyle('sm')}>
                          <SelectValue placeholder="Select..." />
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
                    <Label style={{ color: colors.text }}>Notes</Label>
                    <Textarea
                      value={customerProfile.notes}
                      onChange={(e) => setCustomerProfile(prev => ({ ...prev, notes: e.target.value }))}
                      className="rounded-xl border-0 min-h-20"
                      style={getInsetStyle('sm')}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {prefilledCustomerId && (
            <div className="space-y-2">
              <Label htmlFor="customer_name_prefilled" style={{ color: colors.text }}>
                Customer Name
              </Label>
              <Input
                id="customer_name_prefilled"
                value={formData.customer_name}
                className="rounded-2xl border-0 h-12"
                style={getInsetStyle()}
                disabled
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="policy_number" style={{ color: colors.text }}>
              Policy Number
            </Label>
            <Input
              id="policy_number"
              value={formData.policy_number}
              onChange={(e) => setFormData(prev => ({ ...prev, policy_number: e.target.value }))}
              placeholder="POL-123456"
              className="rounded-2xl border-0 h-12"
              style={getInsetStyle()}
            />
          </div>

          <div className="space-y-2">
            <Label style={{ color: colors.text }}>Assign To</Label>
            <Select
              value={formData.assigned_to || 'unassigned'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value === 'unassigned' ? '' : value }))}
            >
              <SelectTrigger 
                className="rounded-2xl border-0 h-12"
                style={getInsetStyle()}
              >
                <SelectValue placeholder="Select agent..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.email} value={user.email}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label style={{ color: colors.text }}>Case Type *</Label>
              <Select
                value={formData.case_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, case_type: value }))}
              >
                <SelectTrigger 
                  className="rounded-2xl border-0 h-12"
                  style={getInsetStyle()}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claim">Claim</SelectItem>
                  <SelectItem value="inquiry">Inquiry</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                  <SelectItem value="new_policy">New Policy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label style={{ color: colors.text }}>Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger 
                  className="rounded-2xl border-0 h-12"
                  style={getInsetStyle()}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" style={{ color: colors.text }}>
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What is this case about? Provide details..."
              className="rounded-2xl border-0 min-h-24"
              style={getInsetStyle()}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-2xl h-12 px-6 border-0"
              style={getButtonStyle()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.description.trim() ||
                (
                  !prefilledCustomerId && // Only if not prefilled
                  (
                    (!selectedCustomerId && !createNewCustomer) || // Must have selected or be creating
                    (createNewCustomer && showFullProfile && (!customerProfile.first_name.trim() || !customerProfile.last_name.trim() || !customerProfile.primary_phone.trim())) || // Full profile validation
                    (createNewCustomer && !showFullProfile && (!formData.customer_name.trim() || !formData.customer_phone.trim())) // Basic profile validation
                  )
                )
              }
              className="rounded-2xl h-12 px-6 border-0"
              style={getButtonStyle()}
            >
              {isSubmitting ? 'Creating...' : 'Create Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
