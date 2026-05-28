import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  AlertCircle,
  Plus,
  Edit3,
  Save,
  X,
  FolderOpen,
  Clock,
  IdCard,
  FileText,
  MessageSquare,
  PhoneIncoming,
  PhoneOutgoing,
  Activity,
  Send,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow, differenceInYears, differenceInMonths } from "date-fns";
import CreateCaseModal from "@/components/cases/CreateCaseModal";
import { useTheme } from "@/components/ThemeProvider";
import PDFViewer from "@/components/PDFViewer";
import EmailComposerModal from "@/components/email/EmailComposerModal";
import CustomerProviderMap from "@/components/customer/CustomerProviderMap";


export default function CustomerPage() {
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState({});
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState(null);
  const [pdfViewerTitle, setPdfViewerTitle] = useState('');
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  const { colors, getButtonStyle, getInsetStyle } = useTheme();

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const customers = await base44.entities.Customer.filter({ id: customerId });
      return customers[0];
    },
    enabled: !!customerId,
  });

  const { data: customerEmployerEntity } = useQuery({
    queryKey: ['customerEmployerEntity', customer?.company_id],
    queryFn: async () => {
      if (!customer?.company_id) return null;
      const employers = await base44.entities.Employer.filter({ id: customer.company_id });
      return employers[0];
    },
    enabled: !!customer?.company_id,
  });

  const { data: customerClientCompanyEntity } = useQuery({
    queryKey: ['customerClientCompanyEntity', customer?.client_id],
    queryFn: async () => {
      if (!customer?.client_id) return null;
      const companies = await base44.entities.Company.filter({ id: customer.client_id });
      return companies[0];
    },
    enabled: !!customer?.client_id,
  });

  const { data: employers = [] } = useQuery({
    queryKey: ['employers-list'],
    queryFn: () => base44.entities.Employer.list('employer_name'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => base44.entities.Company.list('company_name'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['customer-cases', customerId],
    queryFn: () => base44.entities.Case.filter({ customer_id: customerId }, '-created_date'),
    enabled: !!customerId,
  });

  const { data: calls = [] } = useQuery({
    queryKey: ['customer-calls', customerId],
    queryFn: async () => {
      if (cases.length === 0) return [];
      const caseIds = cases.map(c => c.id);
      const allCalls = await base44.entities.Call.list('-created_date', 100);
      return allCalls.filter(call => caseIds.includes(call.case_id));
    },
    enabled: cases.length > 0,
  });

  const { data: smsMessages = [] } = useQuery({
    queryKey: ['customer-sms', customerId],
    queryFn: async () => {
      if (cases.length === 0) return [];
      const caseIds = cases.map(c => c.id);
      const allSMS = await base44.entities.SMS.list('-created_date', 100);
      return allSMS.filter(sms => caseIds.includes(sms.case_id));
    },
    enabled: cases.length > 0,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['customer-notes', customerId],
    queryFn: async () => {
      if (cases.length === 0) return [];
      const caseIds = cases.map(c => c.id);
      const allNotes = await base44.entities.Note.list('-created_date', 100);
      return allNotes.filter(note => caseIds.includes(note.case_id));
    },
    enabled: cases.length > 0,
  });

  const timeline = React.useMemo(() => {
    const events = [];
    cases.forEach(c => {
      events.push({ type: 'case', date: c.created_date, data: c, icon: FolderOpen, color: '#3B82F6' });
    });
    calls.forEach(call => {
      events.push({ type: 'call', date: call.created_date, data: call, icon: call.direction === 'inbound' ? PhoneIncoming : PhoneOutgoing, color: call.direction === 'inbound' ? '#10B981' : '#8B5CF6' });
    });
    smsMessages.forEach(sms => {
      events.push({ type: 'sms', date: sms.created_date, data: sms, icon: MessageSquare, color: '#F59E0B' });
    });
    notes.forEach(note => {
      events.push({ type: 'note', date: note.created_date, data: note, icon: FileText, color: '#6B7280' });
    });
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [cases, calls, smsMessages, notes]);

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Customer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customerEmployerEntity', editedCustomer.company_id] });
      queryClient.invalidateQueries({ queryKey: ['customerClientCompanyEntity', editedCustomer.client_id] });
      setIsEditing(false);
    },
  });

  const toggleEscalationMutation = useMutation({
    mutationFn: ({ id, value }) => base44.entities.Customer.update(id, { escalation_flag: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const createCaseMutation = useMutation({
    mutationFn: (caseData) => base44.entities.Case.create(caseData),
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ['customer-cases', customerId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowCreateCaseModal(false);
      // Navigate to the newly created case
      window.location.href = createPageUrl(`Case?id=${newCase.id}`);
    },
  });

  useEffect(() => {
    if (customer) {
      setEditedCustomer(customer);
    }
  }, [customer]);

  const calculateTimeEmployed = (hireDate) => {
    if (!hireDate) return 'N/A';
    try {
      const years = differenceInYears(new Date(), new Date(hireDate));
      const months = differenceInMonths(new Date(), new Date(hireDate)) % 12;
      return `${years} years, ${months} months`;
    } catch {
      return 'N/A';
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleSave = () => {
    updateCustomerMutation.mutate({
      id: customerId,
      data: editedCustomer
    });
  };

  const handleToggleEscalation = () => {
    toggleEscalationMutation.mutate({
      id: customerId,
      value: !customer.escalation_flag
    });
  };

  const handleCallClick = () => {
    // Just trigger the phone panel
    window.dispatchEvent(new CustomEvent('toggle-phone', { 
      detail: { phoneNumber: customer.primary_phone }
    }));
  };

  const handleSMSClick = async () => {
    // Find most recent open case or create new one
    const openCase = cases.find(c => c.status === 'new' || c.status === 'in_progress');
    
    if (openCase) {
      // Navigate to existing open case
      window.location.href = createPageUrl(`Case?id=${openCase.id}`);
    } else {
      // Create new case and navigate
      const caseNumber = `CASE-${Date.now().toString().slice(-8)}`;
      const newCaseData = {
        case_number: caseNumber,
        customer_id: customerId,
        customer_name: `${customer.first_name} ${customer.last_name}`,
        customer_phone: customer.primary_phone,
        customer_email: customer.primary_email || null,
        case_type: 'inquiry',
        priority: customer.is_vip ? 'high' : 'medium',
        description: `SMS conversation initiated from customer profile`,
        status: 'new'
      };
      
      await createCaseMutation.mutateAsync(newCaseData);
    }
  };

  const handleEmailClick = () => {
    setShowEmailComposer(true);
  };

  const handleCreateCase = async (caseData) => {
    try {
      await createCaseMutation.mutateAsync(caseData);
    } catch (error) {
      console.error("Error creating case:", error);
      throw error;
    }
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.textSecondary }}></div>
          <p className="text-lg" style={{ color: colors.textSecondary }}>Loading customer...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>Customer not found</h2>
          <Link to={createPageUrl("Customers")}>
            <Button className="rounded-2xl border-0" style={getButtonStyle()}>
              Back to Customers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
  const isVIP = customer.is_vip || false;

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl("Customers")}>
            <Button
              variant="ghost"
              className="mb-4 rounded-2xl border-0"
              style={getButtonStyle()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
          </Link>

          {/* Header with Company Logo Background */}
          <div 
            className="relative rounded-2xl overflow-hidden mb-6 p-8"
            style={{
              background: customerEmployerEntity?.company_logo_url 
                ? `linear-gradient(to bottom, ${colors.bg}dd, ${colors.bg}f5), url(${customerEmployerEntity.company_logo_url})`
                : colors.bg,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
            }}
          >
            {/* Customer Info - Centered */}
            <div className="flex flex-col items-center text-center w-full relative z-10">
              <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
                  {fullName}
                </h1>
                {isVIP && (
                  <Badge
                    className="border-0 text-xs px-3 py-1 rounded-full"
                    style={{
                      backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa7c4cb70fe91d38015eba/381316158_image.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      color: '#000000',
                      fontWeight: '700',
                      boxShadow: '0 0 15px rgba(245, 158, 11, 0.5), 4px 4px 8px rgba(180, 83, 9, 0.4)'
                    }}
                  >
                    <Star className="w-3 h-3 mr-1 fill-yellow-900" />
                    VIP
                  </Badge>
                )}
                {customer.escalation_flag && (
                  <Badge
                    className="border-0 text-xs px-3 py-1 rounded-full animate-pulse"
                    style={{
                      background: 'linear-gradient(145deg, #fee2e2, #fecaca)',
                      color: '#dc2626',
                      boxShadow: '2px 2px 4px #a3b1c6, -2px -2px 4px #ffffff'
                    }}
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    ESCALATION
                  </Badge>
                )}
              </div>
              <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                {customer.job_title || 'No job title'} at {employers.find(e => e.id === customer.company_id)?.employer_name || 'Unknown Company'}
              </p>

              <div className="flex gap-2 flex-wrap justify-center">
                {customer.primary_phone && (
                  <Button
                    onClick={handleCallClick}
                    disabled={createCaseMutation.isPending}
                    className="rounded-2xl h-10 px-4 border-0 font-medium flex items-center gap-2"
                    style={isVIP ? {
                      ...getButtonStyle(),
                      border: '5px solid #F59E0B',
                      color: '#000000',
                      fontWeight: '600'
                    } : {
                      ...getButtonStyle(),
                      color: '#10b981'
                    }}
                  >
                    <Phone className="w-4 h-4" />
                    {isVIP ? <span>✨ Call VIP</span> : 'Call'}
                  </Button>
                )}
                {customer.primary_phone && (
                  <Button
                    onClick={handleSMSClick}
                    disabled={createCaseMutation.isPending}
                    className="rounded-2xl h-10 px-4 border-0"
                    style={{
                      ...getButtonStyle(),
                      color: '#3b82f6'
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                )}
                <Button
                  onClick={handleEmailClick}
                  className="rounded-2xl h-10 px-4 border-0"
                  style={getButtonStyle()}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  onClick={handleToggleEscalation}
                  className="rounded-2xl h-10 px-4 border-0"
                  style={{
                    ...getButtonStyle(),
                    background: customer.escalation_flag ? 'linear-gradient(145deg, #fee2e2, #fecaca)' : colors.bg,
                    color: customer.escalation_flag ? '#dc2626' : colors.textSecondary
                  }}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {customer.escalation_flag ? 'Remove Escalation' : 'Mark for Escalation'}
                </Button>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="rounded-2xl h-10 px-4 border-0"
                    style={getButtonStyle()}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex justify-center">
            <TabsList
              className="rounded-2xl border-0 p-1"
              style={getInsetStyle()}
            >
              <TabsTrigger value="overview" className="rounded-xl" style={{color: colors.textSecondary}}>Overview</TabsTrigger>
              <TabsTrigger value="cases" className="rounded-xl" style={{color: colors.textSecondary}}>Cases</TabsTrigger>
              <TabsTrigger value="calls" className="rounded-xl" style={{color: colors.textSecondary}}>Calls</TabsTrigger>
              <TabsTrigger value="sms" className="rounded-xl" style={{color: colors.textSecondary}}>Messages</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-xl" style={{color: colors.textSecondary}}>Timeline</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Customer Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <Card
                  className="border-0"
                  style={{
                    background: colors.bg,
                    boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          First Name
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.first_name || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, first_name: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customer.first_name || 'N/A'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Last Name
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.last_name || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, last_name: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customer.last_name || 'N/A'}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEditing ? editedCustomer.is_vip : customer.is_vip}
                            onChange={(e) => isEditing && setEditedCustomer({...editedCustomer, is_vip: e.target.checked})}
                            disabled={!isEditing}
                            className="w-5 h-5 rounded border-2 border-gray-300"
                          />
                          <span className="text-sm font-medium flex items-center gap-2" style={{ color: customer.is_vip ? '#F59E0B' : colors.textSecondary }}>
                            <Star className={`w-4 h-4 ${customer.is_vip ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            VIP / Person of Interest (shows gold call interface)
                          </span>
                        </label>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Date of Birth
                        </label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editedCustomer.date_of_birth || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, date_of_birth: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {formatDateDisplay(customer.date_of_birth)}
                          </p>
                        )}
                      </div>

                      {customer.date_of_birth && !isEditing && (
                        <div>
                          <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                            Age
                          </label>
                          <p className="font-medium" style={{ color: colors.text }}>
                            {(() => {
                              const [year, month, day] = customer.date_of_birth.split('-').map(Number);
                              const birthDate = new Date(year, month - 1, day);
                              const age = differenceInYears(new Date(), birthDate);
                              return `${age} years old`;
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card
                  className="border-0"
                  style={{
                    background: colors.bg,
                    boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                      <Phone className="w-5 h-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Primary Phone
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.primary_phone || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, primary_phone: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          customer.primary_phone ? (
                            <a
                              href={`tel:${customer.primary_phone}`}
                              className="font-medium hover:underline inline-flex items-center gap-2 text-left"
                              style={{ color: '#3B82F6' }}
                            >
                              <Phone className="w-4 h-4" />
                              {customer.primary_phone}
                            </a>
                          ) : (
                            <p className="font-medium" style={{ color: colors.text }}>N/A</p>
                          )
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Secondary Phone
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.secondary_phone || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, secondary_phone: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          customer.secondary_phone ? (
                            <a
                              href={`tel:${customer.secondary_phone}`}
                              className="font-medium hover:underline inline-flex items-center gap-2 text-left"
                              style={{ color: '#3B82F6' }}
                            >
                              <Phone className="w-4 h-4" />
                              {customer.secondary_phone}
                            </a>
                          ) : (
                            <p className="font-medium" style={{ color: colors.text }}>N/A</p>
                          )
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Primary Email
                        </label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editedCustomer.primary_email || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, primary_email: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          customer.primary_email ? (
                            <a
                              href={`mailto:${customer.primary_email}`}
                              className="font-medium hover:underline inline-flex items-center gap-2 break-all"
                              style={{ color: '#3B82F6' }}
                            >
                              <Mail className="w-4 h-4 flex-shrink-0" />
                              {customer.primary_email}
                            </a>
                          ) : (
                            <p className="font-medium" style={{ color: colors.text }}>N/A</p>
                          )
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Secondary Email
                        </label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editedCustomer.secondary_email || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, secondary_email: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          customer.secondary_email ? (
                            <a
                              href={`mailto:${customer.secondary_email}`}
                              className="font-medium hover:underline inline-flex items-center gap-2 break-all"
                              style={{ color: '#3B82F6' }}
                            >
                              <Mail className="w-4 h-4 flex-shrink-0" />
                              {customer.secondary_email}
                            </a>
                          ) : (
                            <p className="font-medium" style={{ color: colors.text }}>N/A</p>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Address
                      </label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Street Address"
                            value={editedCustomer.address_street || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, address_street: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="City"
                              value={editedCustomer.address_city || ''}
                              onChange={(e) => setEditedCustomer({...editedCustomer, address_city: e.target.value})}
                              className="rounded-2xl border-0 h-10"
                              style={{
                                ...getInsetStyle(),
                                color: colors.text
                              }}
                            />
                            <Input
                              placeholder="State"
                              value={editedCustomer.address_state || ''}
                              onChange={(e) => setEditedCustomer({...editedCustomer, address_state: e.target.value})}
                              className="rounded-2xl border-0 h-10"
                              style={{
                                ...getInsetStyle(),
                                color: colors.text
                              }}
                            />
                            <Input
                              placeholder="ZIP"
                              value={editedCustomer.address_zip || ''}
                              onChange={(e) => setEditedCustomer({...editedCustomer, address_zip: e.target.value})}
                              className="rounded-2xl border-0 h-10"
                              style={{
                                ...getInsetStyle(),
                                color: colors.text
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="font-medium" style={{ color: colors.text }}>
                          {[customer.address_street, customer.address_city, customer.address_state, customer.address_zip]
                            .filter(Boolean)
                            .join(', ') || 'N/A'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Employment Information */}
                <Card
                  className="border-0"
                  style={{
                    background: colors.bg,
                    boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                      <Briefcase className="w-5 h-5" />
                      Employment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Employer
                        </label>
                        <div className="flex gap-2">
                          {isEditing ? (
                            <select
                              value={editedCustomer.company_id || ''}
                              onChange={(e) => setEditedCustomer({...editedCustomer, company_id: e.target.value})}
                              className="flex-1 rounded-2xl border-0 h-10 px-3"
                              style={{
                                ...getInsetStyle(),
                                color: colors.text
                              }}
                            >
                              <option value="">Select Company...</option>
                              {employers.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.employer_name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <>
                              <p className="flex-1 font-medium" style={{ color: colors.text }}>
                                {employers.find(e => e.id === customer.company_id)?.employer_name || 'N/A'}
                              </p>
                              {customerEmployerEntity?.benefit_guide_url && (
                                <a
                                  href={customerEmployerEntity.benefit_guide_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-2xl h-10 px-4 border-0 inline-flex items-center gap-2 font-medium text-sm"
                                  style={{
                                    ...getButtonStyle(),
                                    color: '#3B82F6'
                                  }}
                                >
                                  <FileText className="w-4 h-4" />
                                  Benefit Guide
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Client
                        </label>
                        {isEditing ? (
                          <select
                            value={editedCustomer.client_id || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, client_id: e.target.value})}
                            className="w-full rounded-2xl border-0 h-10 px-3"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          >
                            <option value="">Select Client...</option>
                            {companies.map(comp => (
                              <option key={comp.id} value={comp.id}>
                                {comp.company_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customerClientCompanyEntity?.company_name || 'N/A'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Job Title
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.job_title || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, job_title: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customer.job_title || 'N/A'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Employee ID
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.employee_id || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, employee_id: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customer.employee_id || 'N/A'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Hire Date
                        </label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editedCustomer.hire_date || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, hire_date: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {formatDateDisplay(customer.hire_date)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Time Employed
                        </label>
                        <p className="font-medium" style={{ color: colors.text }}>
                          {calculateTimeEmployed(customer.hire_date)}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Member ID
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.member_id || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, member_id: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customer.member_id || 'N/A'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Group Number
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.group_number || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, group_number: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customer.group_number || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes Section */}
                <Card
                  className="border-0"
                  style={{
                    background: colors.bg,
                    boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                      <FileText className="w-5 h-5" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={editedCustomer.notes || ''}
                        onChange={(e) => setEditedCustomer({...editedCustomer, notes: e.target.value})}
                        placeholder="Add notes about this customer..."
                        className="rounded-2xl border-0 min-h-32"
                        style={{
                          ...getInsetStyle(),
                          color: colors.text
                        }}
                      />
                    ) : (
                      <p style={{ color: colors.text }}>
                        {customer.notes || 'No notes'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Employment and Carrier Info */}
              <div className="space-y-6">
                {/* Provider Map */}
                <CustomerProviderMap
                  customer={customer}
                  clientCompany={customerClientCompanyEntity}
                />

                {/* Employment Information */}
                <Card
                  className="border-0"
                  style={{
                    background: colors.cardBg,
                    boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                      <Briefcase className="w-5 h-5" />
                      Employment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Employer
                        </label>
                        <div className="flex gap-2 flex-col">
                          {isEditing ? (
                            <select
                              value={editedCustomer.company_id || ''}
                              onChange={(e) => setEditedCustomer({...editedCustomer, company_id: e.target.value})}
                              className="rounded-2xl border-0 h-10 px-3"
                              style={{
                                ...getInsetStyle(),
                                color: colors.text
                              }}
                            >
                              <option value="">Select Company...</option>
                              {employers.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.employer_name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <>
                              <p className="font-medium" style={{ color: colors.text }}>
                                {employers.find(e => e.id === customer.company_id)?.employer_name || 'N/A'}
                              </p>
                              {customerEmployerEntity?.benefit_guide_url && (
                                <button
                                  onClick={() => {
                                    setPdfViewerUrl(customerEmployerEntity.benefit_guide_url);
                                    setPdfViewerTitle(`${customerEmployerEntity.employer_name} - Benefit Guide`);
                                    setShowPDFViewer(true);
                                  }}
                                  className="rounded-2xl h-10 px-4 border-0 inline-flex items-center gap-2 font-medium text-sm justify-center"
                                  style={{
                                    ...getButtonStyle(),
                                    color: '#3B82F6'
                                  }}
                                >
                                  <FileText className="w-4 h-4" />
                                  Benefit Guide
                                </button>
                              )}
                              {customerEmployerEntity?.portal_link_1_url && (
                                <a
                                  href={customerEmployerEntity.portal_link_1_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-2xl h-10 px-4 border-0 inline-flex items-center gap-2 font-medium text-sm justify-center"
                                  style={{
                                    ...getButtonStyle(),
                                    color: '#10B981'
                                  }}
                                >
                                  {customerEmployerEntity.portal_link_1_label || 'Portal 1'}
                                </a>
                              )}
                              {customerEmployerEntity?.portal_link_2_url && (
                                <a
                                  href={customerEmployerEntity.portal_link_2_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-2xl h-10 px-4 border-0 inline-flex items-center gap-2 font-medium text-sm justify-center"
                                  style={{
                                    ...getButtonStyle(),
                                    color: '#8B5CF6'
                                  }}
                                >
                                  {customerEmployerEntity.portal_link_2_label || 'Portal 2'}
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Client
                        </label>
                        {isEditing ? (
                          <select
                            value={editedCustomer.client_id || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, client_id: e.target.value})}
                            className="w-full rounded-2xl border-0 h-10 px-3"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          >
                            <option value="">Select Client...</option>
                            {companies.map(comp => (
                              <option key={comp.id} value={comp.id}>
                                {comp.company_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customerClientCompanyEntity?.company_name || 'N/A'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Job Title
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.job_title || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, job_title: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customer.job_title || 'N/A'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Employee ID
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.employee_id || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, employee_id: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customer.employee_id || 'N/A'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Hire Date
                        </label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editedCustomer.hire_date || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, hire_date: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {formatDateDisplay(customer.hire_date)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Time Employed
                        </label>
                        <p className="font-medium" style={{ color: colors.text }}>
                          {calculateTimeEmployed(customer.hire_date)}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Member ID
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.member_id || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, member_id: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customer.member_id || 'N/A'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                          Group Number
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedCustomer.group_number || ''}
                            onChange={(e) => setEditedCustomer({...editedCustomer, group_number: e.target.value})}
                            className="rounded-2xl border-0 h-10"
                            style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}
                          />
                        ) : (
                          <p className="font-medium" style={{ color: colors.text }}>
                            {customer.group_number || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Carrier Information */}
                <Card
                  className="border-0"
                  style={{
                    background: colors.cardBg,
                    boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                      <Building2 className="w-5 h-5" />
                      Carrier Phone Numbers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!customerClientCompanyEntity ? (
                      <div className="text-center py-8">
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          No company selected
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {customerClientCompanyEntity.carrier_dental_name && (
                          <div
                            className="p-3 rounded-2xl"
                            style={{
                              ...getInsetStyle(),
                              background: colors.cardBg
                            }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                              Dental
                            </p>
                            <p className="font-bold mb-1" style={{ color: colors.text }}>
                              {customerClientCompanyEntity.carrier_dental_name}
                            </p>
                            <a
                              href={`tel:${customerClientCompanyEntity.carrier_dental_phone}`}
                              className="text-sm font-medium hover:underline inline-flex items-center gap-1 transition-all"
                              style={{ color: '#3B82F6' }}
                            >
                              <Phone className="w-3 h-3" />
                              {customerClientCompanyEntity.carrier_dental_phone}
                            </a>
                          </div>
                        )}

                        {customerClientCompanyEntity.carrier_medical_name && (
                          <div
                            className="p-3 rounded-2xl"
                            style={{
                              ...getInsetStyle(),
                              background: colors.cardBg
                            }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                              Medical
                            </p>
                            <p className="font-bold mb-1" style={{ color: colors.text }}>
                              {customerClientCompanyEntity.carrier_medical_name}
                            </p>
                            <a
                              href={`tel:${customerClientCompanyEntity.carrier_medical_phone}`}
                              className="text-sm font-medium hover:underline inline-flex items-center gap-1 transition-all"
                              style={{ color: '#3B82F6' }}
                            >
                              <Phone className="w-3 h-3" />
                              {customerClientCompanyEntity.carrier_medical_phone}
                            </a>
                          </div>
                        )}

                        {customerClientCompanyEntity.carrier_vision_name && (
                          <div
                            className="p-3 rounded-2xl"
                            style={{
                              ...getInsetStyle(),
                              background: colors.cardBg
                            }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                              Vision
                            </p>
                            <p className="font-bold mb-1" style={{ color: colors.text }}>
                              {customerClientCompanyEntity.carrier_vision_name}
                            </p>
                            <a
                              href={`tel:${customerClientCompanyEntity.carrier_vision_phone}`}
                              className="text-sm font-medium hover:underline inline-flex items-center gap-1 transition-all"
                              style={{ color: '#3B82F6' }}
                            >
                              <Phone className="w-3 h-3" />
                              {customerClientCompanyEntity.carrier_vision_phone}
                            </a>
                          </div>
                        )}

                        {customerClientCompanyEntity.carrier_life_name && (
                          <div
                            className="p-3 rounded-2xl"
                            style={{
                              ...getInsetStyle(),
                              background: colors.cardBg
                            }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                              Life
                            </p>
                            <p className="font-bold mb-1" style={{ color: colors.text }}>
                              {customerClientCompanyEntity.carrier_life_name}
                            </p>
                            <a
                              href={`tel:${customerClientCompanyEntity.carrier_life_phone}`}
                              className="text-sm font-medium hover:underline inline-flex items-center gap-1 transition-all"
                              style={{ color: '#3B82F6' }}
                            >
                              <Phone className="w-3 h-3" />
                              {customerClientCompanyEntity.carrier_life_phone}
                            </a>
                          </div>
                        )}

                        {customerClientCompanyEntity.carrier_disability_name && (
                          <div
                            className="p-3 rounded-2xl"
                            style={{
                              ...getInsetStyle(),
                              background: colors.cardBg
                            }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                              Disability
                            </p>
                            <p className="font-bold mb-1" style={{ color: colors.text }}>
                              {customerClientCompanyEntity.carrier_disability_name}
                            </p>
                            <a
                              href={`tel:${customerClientCompanyEntity.carrier_disability_phone}`}
                              className="text-sm font-medium hover:underline inline-flex items-center gap-1 transition-all"
                              style={{ color: '#3B82F6' }}
                            >
                              <Phone className="w-3 h-3" />
                              {customerClientCompanyEntity.carrier_disability_phone}
                            </a>
                          </div>
                        )}

                        {!customerClientCompanyEntity.carrier_dental_name && !customerClientCompanyEntity.carrier_medical_name &&
                         !customerClientCompanyEntity.carrier_vision_name && !customerClientCompanyEntity.carrier_life_name &&
                         !customerClientCompanyEntity.carrier_disability_name && (
                          <div className="text-center py-8">
                            <p className="text-sm" style={{ color: colors.textSecondary }}>
                              No carrier information available
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Cases Tab */}
          <TabsContent value="cases">
            <Card
              className="border-0 mt-4"
              style={{
                background: colors.cardBg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle style={{ color: colors.text }}>Cases</CardTitle>
                  <Button
                    onClick={() => setShowCreateCaseModal(true)}
                    className="rounded-2xl h-10 px-4 border-0"
                    style={getButtonStyle()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Case
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {cases.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textTertiary }} />
                    <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                      No cases yet for this customer
                    </p>
                    <Button
                      onClick={() => setShowCreateCaseModal(true)}
                      className="rounded-2xl h-10 px-4 border-0"
                      style={{
                        ...getButtonStyle(),
                        color: colors.textSecondary
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Case
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cases.map((caseItem, index) => (
                      <Link key={caseItem.id} to={createPageUrl(`Case?id=${caseItem.id}`)}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 rounded-2xl hover:shadow-lg transition-all"
                          style={{
                            background: colors.bg,
                            boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold" style={{ color: colors.text }}>
                                {caseItem.case_number}
                              </h4>
                              <p className="text-sm" style={{ color: colors.textSecondary }}>
                                {caseItem.case_type}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge
                                className="border-0 text-xs px-2 py-1"
                                style={{
                                  background: caseItem.priority === 'urgent' ? 'linear-gradient(145deg, #fee2e2, #fecaca)' :
                                             caseItem.priority === 'high' ? 'linear-gradient(145deg, #fed7aa, #fdba74)' :
                                             'linear-gradient(145deg, #e0f2fe, #bae6fd)',
                                  color: caseItem.priority === 'urgent' ? '#991b1b' :
                                         caseItem.priority === 'high' ? '#9a3412' : '#075985'
                                }}
                              >
                                {caseItem.priority}
                              </Badge>
                              <Badge
                                className="border-0 text-xs px-2 py-1"
                                style={{
                                  background: 'linear-gradient(145deg, #f0f4f8, #d1d9e6)',
                                  color: '#6B7280'
                                }}
                              >
                                {caseItem.status}
                              </Badge>
                            </div>
                          </div>
                          {caseItem.description && (
                            <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                              {caseItem.description.substring(0, 100)}
                              {caseItem.description.length > 100 && '...'}
                            </p>
                          )}
                          <div className="flex justify-between items-center text-xs" style={{ color: colors.textTertiary }}>
                            <span>Created {formatDistanceToNow(new Date(caseItem.created_date), { addSuffix: true })}</span>
                            {caseItem.assigned_to && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Assigned
                              </span>
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calls Tab */}
          <TabsContent value="calls">
            <Card
              className="border-0 mt-4"
              style={{
                background: colors.cardBg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: colors.text }}>Call History</CardTitle>
              </CardHeader>
              <CardContent>
                {calls.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: colors.textSecondary }}>No calls yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {calls.map((call, index) => (
                      <motion.div
                        key={call.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-2xl"
                        style={{
                          background: colors.bg,
                          boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={getButtonStyle()}
                          >
                            {call.direction === 'inbound' ? (
                              <PhoneIncoming className="w-5 h-5" style={{ color: '#10b981' }} />
                            ) : (
                              <PhoneOutgoing className="w-5 h-5" style={{ color: '#3b82f6' }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium" style={{ color: colors.text }}>
                                {call.direction === 'inbound' ? 'Incoming Call' : 'Outgoing Call'}
                              </p>
                              <Badge
                                className="border-0 text-xs"
                                style={{
                                  background: call.status === 'completed' ? 'linear-gradient(145deg, #dcfce7, #bbf7d0)' :
                                             'linear-gradient(145deg, #fee2e2, #fecaca)',
                                  color: call.status === 'completed' ? '#166534' : '#991b1b'
                                }}
                              >
                                {call.status}
                              </Badge>
                            </div>
                            <a
                              href={`tel:${call.customer_phone}`}
                              className="text-sm mb-2 hover:underline inline-flex items-center gap-1"
                              style={{ color: '#3B82F6' }}
                            >
                              <Phone className="w-3 h-3" />
                              {call.customer_phone}
                              {call.duration && ` · ${Math.floor(call.duration / 60)}m ${call.duration % 60}s`}
                            </a>
                            {call.notes && (
                              <p className="text-sm p-2 rounded-xl mt-2" style={{
                                ...getInsetStyle(),
                                color: colors.text
                              }}>
                                {call.notes}
                              </p>
                            )}
                            <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>
                              {format(new Date(call.created_date), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms">
            <Card
              className="border-0 mt-4"
              style={{
                background: colors.cardBg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: colors.text }}>SMS Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {smsMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: colors.textSecondary }}>No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {smsMessages.map((sms, index) => (
                      <motion.div
                        key={sms.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-2xl"
                        style={{
                          background: colors.bg,
                          boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={getButtonStyle()}
                          >
                            {sms.direction === 'sent' ? (
                              <Send className="w-5 h-5" style={{ color: '#3b82f6' }} />
                            ) : (
                              <MessageSquare className="w-5 h-5" style={{ color: '#10b981' }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium" style={{ color: colors.text }}>
                                {sms.direction === 'sent' ? 'Sent' : 'Received'}
                              </p>
                              <Badge
                                className="border-0 text-xs"
                                style={{
                                  background: sms.status === 'delivered' ? 'linear-gradient(145deg, #dcfce7, #bbf7d0)' :
                                             sms.status === 'sent' ? 'linear-gradient(145deg, #dbeafe, #bfdbfe)' :
                                             'linear-gradient(145deg, #fed7aa, #fdba74)',
                                  color: sms.status === 'delivered' ? '#166534' :
                                         sms.status === 'sent' ? '#1e40af' : '#9a3412'
                                }}
                              >
                                {sms.status}
                              </Badge>
                            </div>
                            <a
                              href={`tel:${sms.customer_phone}`}
                              className="text-sm mb-2 hover:underline inline-flex items-center gap-1"
                              style={{ color: '#3B82F6' }}
                            >
                              <Phone className="w-3 h-3" />
                              {sms.customer_phone}
                            </a>
                            <p className="text-sm p-3 rounded-xl mt-2" style={{
                              ...getInsetStyle(),
                              color: colors.text
                            }}>
                              {sms.message}
                            </p>
                            <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>
                              {format(new Date(sms.created_date), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card
              className="border-0 mt-4"
              style={{
                background: colors.cardBg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: colors.text }}>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: colors.textSecondary }}>No activity yet</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className="absolute left-5 top-0 bottom-0 w-0.5"
                      style={{ background: colors.border }}
                    />

                    <div className="space-y-6">
                      {timeline.map((event, index) => (
                        <motion.div
                          key={`${event.type}-${event.data.id}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative pl-14"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center absolute left-0"
                            style={getButtonStyle()}
                          >
                            <event.icon className="w-5 h-5" style={{ color: event.color }} />
                          </div>

                          <div
                            className="p-4 rounded-2xl"
                            style={getButtonStyle()}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold" style={{ color: colors.text }}>
                                  {event.type === 'case' && `Case ${event.data.case_number}`}
                                  {event.type === 'call' && `${event.data.direction === 'inbound' ? 'Incoming' : 'Outgoing'} Call`}
                                  {event.type === 'sms' && `SMS ${event.data.direction === 'sent' ? 'Sent' : 'Received'}`}
                                  {event.type === 'note' && 'Note Added'}
                                </p>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>
                                  {format(new Date(event.date), 'MMM d, h:mm a')}
                                </p>
                              </div>
                              <Badge
                                className="border-0 text-xs"
                                style={{
                                  background: `${event.color}20`,
                                  color: event.color
                                }}
                              >
                                {event.type}
                              </Badge>
                            </div>

                            {event.type === 'case' && (
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {event.data.case_type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {event.data.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {event.data.priority}
                                </Badge>
                              </div>
                            )}

                            {event.type === 'call' && event.data.notes && (
                              <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                                {event.data.notes}
                              </p>
                            )}

                            {event.type === 'sms' && (
                              <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                                {event.data.message}
                              </p>
                            )}

                            {event.type === 'note' && (
                              <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                                {event.data.content}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Save/Cancel Bar when editing */}
      {isEditing && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
          style={{
            background: colors.bg,
            boxShadow: `0 -8px 24px ${colors.shadowDark}`
          }}
        >
          <div className="max-w-7xl mx-auto flex justify-end gap-3">
            <Button
              onClick={() => {
                setIsEditing(false);
                setEditedCustomer(customer);
              }}
              className="rounded-2xl h-12 px-6 border-0"
              style={{
                ...getButtonStyle(),
                color: '#ef4444'
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateCustomerMutation.isPending}
              className="rounded-2xl h-12 px-6 border-0"
              style={{
                ...getButtonStyle(),
                color: '#10b981'
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateCustomerMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </motion.div>
      )}

      <CreateCaseModal
        isOpen={showCreateCaseModal}
        onClose={() => setShowCreateCaseModal(false)}
        onSubmit={handleCreateCase}
        prefilledCustomerId={customerId}
      />

      {showPDFViewer && (
        <PDFViewer
          pdfUrl={pdfViewerUrl}
          title={pdfViewerTitle}
          onClose={() => {
            setShowPDFViewer(false);
            setPdfViewerUrl(null);
            setPdfViewerTitle('');
          }}
        />
      )}

      <EmailComposerModal
        isOpen={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
        toEmail={customer.primary_email}
        toName={fullName}
      />
    </div>
  );
}