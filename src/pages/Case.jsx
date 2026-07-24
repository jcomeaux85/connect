import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { invokeAI } from "@/api/aiProvider";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Phone, PhoneCall, PhoneOff, MessageSquare, Send, FileText,
  Clock, User, Mail, Calendar, CheckCircle2, Plus, Trash2, Edit3,
  Pause, AlertCircle, Activity, TrendingUp, CheckSquare, Square,
  Sparkles, Brain, Shield, Zap, Target, Users, UserPlus, Building2,
  Briefcase, Paperclip, ChevronDown, ChevronUp, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import AISuggestionsOrb from "../components/assistant/AISuggestionsOrb";
import ActiveCallPanel from "../components/phone/ActiveCallPanel";
import PDFViewer from "../components/PDFViewer";
import AttachmentsPanel from "../components/case/AttachmentsPanel";
import { summarizeCall, suggestNotes, detectPriority, generateResponse, scoreCallQuality, checkCompliance } from "../components/ai/aiHelpers";
import { useTheme } from "@/components/ThemeProvider";
import { useUser } from "@/components/hooks/useUser";

// ─── Small reusable accordion section ───────────────────────────────────────
function Section({ title, icon: Icon, count, defaultOpen = true, accent, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const { colors, getButtonStyle } = useTheme();
  return (
    <div className="rounded-2xl overflow-hidden" style={{ boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`, background: colors.bg }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 border-0"
        style={{ background: 'transparent' }}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: accent || colors.textSecondary }} />
          <span className="text-sm font-semibold" style={{ color: colors.text }}>{title}</span>
          {count !== undefined && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: accent ? `${accent}20` : colors.border, color: accent || colors.textSecondary }}>
              {count}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: colors.textTertiary }} /> : <ChevronDown className="w-4 h-4" style={{ color: colors.textTertiary }} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CasePage() {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [callDuration, setCallDuration] = useState(0);
  const [isOnCall, setIsOnCall] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callTimer, setCallTimer] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [thirdPartyNumber, setThirdPartyNumber] = useState("");
  const [isThreeWay, setIsThreeWay] = useState(false);
  const [showThreeWayInput, setShowThreeWayInput] = useState(false);
  const [recordTranscript, setRecordTranscript] = useState(true);
  const [smsMessage, setSmsMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showActiveCallPanel, setShowActiveCallPanel] = useState(false);
  const [callTranscriptEntries, setCallTranscriptEntries] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [callSummary, setCallSummary] = useState(null);
  const [complianceCheck, setComplianceCheck] = useState(null);
  const [qualityScore, setQualityScore] = useState(null);
  const [isEditingCase, setIsEditingCase] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState(null);
  const [pdfViewerTitle, setPdfViewerTitle] = useState('');
  const [showAttachmentsPanel, setShowAttachmentsPanel] = useState(false);
  const [manualTranscript, setManualTranscript] = useState('');
  const [processingTranscript, setProcessingTranscript] = useState(false);

  const { colors, isDark } = useTheme();
  const { data: user } = useUser();

  const getButtonStyle = (shadowStrength = '3px', bgColor = colors.bg) => ({
    background: bgColor,
    boxShadow: `${shadowStrength} ${shadowStrength} ${parseInt(shadowStrength) * 2}px ${colors.shadowDark}, -${shadowStrength} -${shadowStrength} ${parseInt(shadowStrength) * 2}px ${colors.shadowLight}`
  });
  const getInsetStyle = (shadowStrength = '4px', bgColor = colors.bg) => ({
    background: bgColor,
    boxShadow: `inset ${shadowStrength} ${shadowStrength} ${parseInt(shadowStrength) * 2}px ${colors.shadowDark}, inset -${shadowStrength} -${shadowStrength} ${parseInt(shadowStrength) * 2}px ${colors.shadowLight}`
  });

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => { const r = await base44.entities.Case.filter({ id: caseId }); return r[0]; },
    enabled: !!caseId
  });
  const { data: customer } = useQuery({
    queryKey: ['case-customer', caseData?.customer_id],
    queryFn: async () => { const r = await base44.entities.Customer.filter({ id: caseData.customer_id }); return r[0]; },
    enabled: !!caseData?.customer_id
  });
  const { data: employer } = useQuery({
    queryKey: ['customer-employer', customer?.company_id],
    queryFn: async () => { const r = await base44.entities.Employer.filter({ id: customer.company_id }); return r[0]; },
    enabled: !!customer?.company_id
  });
  const { data: client } = useQuery({
    queryKey: ['customer-client', customer?.client_id],
    queryFn: async () => { const r = await base44.entities.Company.filter({ id: customer.client_id }); return r[0]; },
    enabled: !!customer?.client_id
  });
  const { data: customers = [] } = useQuery({ queryKey: ['customers-list'], queryFn: () => base44.entities.Customer.list('-updated_date', 100) });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });
  const { data: calls = [] } = useQuery({ queryKey: ['case-calls', caseId], queryFn: () => base44.entities.Call.filter({ case_id: caseId }, '-created_date'), enabled: !!caseId });
  const { data: smsMessages = [] } = useQuery({ queryKey: ['case-sms', caseId], queryFn: () => base44.entities.SMS.filter({ case_id: caseId }, '-created_date'), enabled: !!caseId });
  const { data: notes = [] } = useQuery({ queryKey: ['case-notes', caseId], queryFn: () => base44.entities.Note.filter({ case_id: caseId }, '-created_date'), enabled: !!caseId });
  const { data: tasks = [] } = useQuery({ queryKey: ['case-tasks', caseId], queryFn: () => base44.entities.Task.filter({ case_id: caseId }, '-created_date'), enabled: !!caseId });
  const { data: textTemplates = [] } = useQuery({ queryKey: ['text-templates'], queryFn: () => base44.entities.TextTemplate.filter({ is_active: true }) });
  const { data: callTranscripts = [] } = useQuery({ queryKey: ['case-transcripts', caseId], queryFn: () => base44.entities.CallTranscript.filter({ case_id: caseId }, '-created_date'), enabled: !!caseId });
  const { data: attachments = [] } = useQuery({ queryKey: ['case-attachments', caseId], queryFn: () => base44.entities.Attachment.filter({ case_id: caseId }, '-created_date'), enabled: !!caseId });

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const updateCaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Case.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['case', caseId] }); queryClient.invalidateQueries({ queryKey: ['cases'] }); queryClient.invalidateQueries({ queryKey: ['case-customer'] }); }
  });
  const createCallMutation = useMutation({
    mutationFn: (d) => base44.entities.Call.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['case-calls', caseId] }); queryClient.invalidateQueries({ queryKey: ['calls'] }); }
  });
  const updateCallMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Call.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['case-calls', caseId] }); queryClient.invalidateQueries({ queryKey: ['calls'] }); }
  });
  const createSmsMutation = useMutation({
    mutationFn: (d) => base44.entities.SMS.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['case-sms', caseId] }); setSmsMessage(""); }
  });
  const createNoteMutation = useMutation({
    mutationFn: (d) => base44.entities.Note.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['case-notes', caseId] }); setNewNote(""); setComplianceCheck(null); }
  });
  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['case-notes', caseId] })
  });
  const createTaskMutation = useMutation({
    mutationFn: (d) => base44.entities.Task.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] }); setNewTaskTitle(""); }
  });
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] })
  });
  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] })
  });
  const createTranscriptMutation = useMutation({
    mutationFn: (d) => base44.entities.CallTranscript.create(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['case-transcripts', caseId] })
  });

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const staleCalls = calls.filter(c => c.status === 'in_progress' && c.call_start_time && (new Date() - new Date(c.call_start_time)) / 3600000 > 1);
    staleCalls.forEach(c => updateCallMutation.mutate({ id: c.id, data: { status: 'failed', call_end_time: c.call_start_time } }));
  }, [calls]);

  useEffect(() => {
    if (customer?.primary_phone) setPhoneNumber(customer.primary_phone);
    else if (caseData?.customer_phone) setPhoneNumber(caseData.customer_phone);
  }, [caseData, customer]);

  useEffect(() => {
    if (caseData) { setSelectedCategory(caseData.call_category || null); setSelectedReason(caseData.call_reason || null); }
  }, [caseData?.id]);

  useEffect(() => {
    if (caseData) handleSmartNoteSuggestions();
  }, [caseData?.id]);

  // ─── AI Handlers ──────────────────────────────────────────────────────────────
  const handleSummarizeCall = async () => {
    if (!calls.length) return;
    setAiLoading(true);
    try {
      const lastCall = calls[0];
      const callNotes = notes.filter(n => n.note_type === 'call_note' && new Date(n.created_date) > new Date(lastCall.call_start_time)).map(n => n.content).join('\n');
      const summary = await summarizeCall(callNotes || "No notes available", lastCall.duration || 0, lastCall.status);
      setCallSummary(summary); setAiSuggestion(summary);
    } catch(e) { console.error(e); }
    setAiLoading(false);
  };
  const handleSmartNoteSuggestions = async () => {
    if (!caseData) return;
    setAiLoading(true);
    try {
      const s = await suggestNotes(caseData.case_type, caseData.description || "", caseData.customer_name);
      setAiSuggestion({ ...s, summary: "Here's what you should document for this case:" });
    } catch(e) { console.error(e); }
    setAiLoading(false);
  };
  const handleDetectPriority = async () => {
    if (!caseData) return;
    setAiLoading(true);
    try {
      const p = await detectPriority(caseData.description || "", caseData.case_type, `${calls.length} previous calls, ${notes.length} notes`);
      setAiSuggestion({ ...p, summary: `AI recommends ${p.priority.toUpperCase()} priority` });
    } catch(e) { console.error(e); }
    setAiLoading(false);
  };
  const handleGenerateResponse = async () => {
    if (!caseData) return;
    setAiLoading(true);
    try {
      const r = await generateResponse(caseData.description || "Customer needs assistance", caseData.customer_name, caseData.case_type, "professional");
      setSmsMessage(r.sms_version);
      setAiSuggestion({ ...r, summary: "AI generated response template:" });
    } catch(e) { console.error(e); }
    setAiLoading(false);
  };
  const handleScoreQuality = async () => {
    if (!notes.length) return;
    setAiLoading(true);
    try {
      const allNotes = notes.map(n => n.content).join('\n\n');
      const score = await scoreCallQuality(allNotes, allNotes, caseData.resolution || "In progress");
      setQualityScore(score);
      setAiSuggestion({ ...score, summary: `Quality Score: ${score.overall_score}/100`, key_points: score.strengths, action_items: score.improvements });
    } catch(e) { console.error(e); }
    setAiLoading(false);
  };
  const handleCheckCompliance = async () => {
    if (!newNote.trim()) return;
    setAiLoading(true);
    try {
      const check = await checkCompliance(newNote, caseData?.case_type || "general", "insurance");
      setComplianceCheck(check);
      setAiSuggestion({ ...check, summary: check.compliant ? `✓ Compliant (${check.compliance_score}/100)` : `⚠ Issues Found (${check.compliance_score}/100)`, key_points: check.suggestions, action_items: check.missing_elements });
    } catch(e) { console.error(e); }
    setAiLoading(false);
  };

  // ─── Call Handlers ────────────────────────────────────────────────────────────
  const formatCallDuration = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${m}:${String(sec).padStart(2,'0')}`;
  };
  const handleStartCall = () => {
    setIsOnCall(true); setCallDuration(0); setShowActiveCallPanel(true); setCallTranscriptEntries([]);
    window.dispatchEvent(new CustomEvent('call-state-change', { detail: { isOnCall: true } }));
    const timer = setInterval(() => setCallDuration(p => p + 1), 1000);
    setCallTimer(timer);
    createCallMutation.mutate({ case_id: caseId, customer_phone: phoneNumber, direction: 'outbound', call_start_time: new Date().toISOString(), status: 'in_progress', recording_url: 'transcript_enabled' }, { onSuccess: d => setCurrentCallId(d.id) });
  };
  const handleEndCall = async () => {
    clearInterval(callTimer);
    setIsOnCall(false); setIsOnHold(false); setIsThreeWay(false); setShowThreeWayInput(false); setShowActiveCallPanel(false); setCallTranscriptEntries([]);
    if (currentCallId) {
      updateCallMutation.mutate({ id: currentCallId, data: { duration: callDuration, call_end_time: new Date().toISOString(), status: 'completed' } });
      await generateCallTranscript(currentCallId);
    }
    setCallDuration(0); setRecordTranscript(true); setThirdPartyNumber(""); setCurrentCallId(null);
    window.dispatchEvent(new CustomEvent('call-state-change', { detail: { isOnCall: false } }));
    setTimeout(() => handleSummarizeCall(), 1000);
  };
  const generateCallTranscript = async (callId) => {
    setAiLoading(true);
    try {
      const currentCall = calls.find(c => c.id === callId);
      const callNotesDuringCall = notes.filter(n => n.note_type === 'call_note' && currentCall && new Date(n.created_date) >= new Date(currentCall.call_start_time)).map(n => n.content).join('\n\n');
      const response = await invokeAI({
        prompt: `Analyze this call based ONLY on the notes taken during the call.\nCall Duration: ${formatCallDuration(callDuration)}\nCustomer: ${caseData?.customer_name || 'N/A'}\n\nCall notes:\n${callNotesDuringCall || 'No notes were taken during this call'}\n\nProvide: summary, key points, action items, sentiment, compliance score (0-100), quality score (0-100).`,
        response_json_schema: { type: "object", properties: { summary: { type: "string" }, key_points: { type: "array", items: { type: "string" } }, action_items: { type: "array", items: { type: "string" } }, sentiment: { type: "string", enum: ["positive", "neutral", "negative"] }, compliance_score: { type: "number" }, quality_score: { type: "number" } }, required: ["summary", "key_points", "action_items", "sentiment", "compliance_score", "quality_score"] }
      });
      createTranscriptMutation.mutate({ call_id: callId, case_id: caseId, transcript_text: callNotesDuringCall || "No notes.", ai_summary: response.summary, key_points: response.key_points, action_items: response.action_items, sentiment: response.sentiment, compliance_score: response.compliance_score, quality_score: response.quality_score, created_date: new Date().toISOString() });
      if (response.action_items?.length) response.action_items.forEach(item => createTaskMutation.mutate({ case_id: caseId, title: item, status: 'pending', priority: 'medium', assigned_to: user?.email }));
      setAiSuggestion({ summary: `Call Analysis Complete - Quality: ${response.quality_score}/100`, key_points: response.key_points, action_items: response.action_items });
    } catch(e) { console.error(e); }
    setAiLoading(false);
  };
  const handleToggleHold = () => {
    const next = !isOnHold; setIsOnHold(next);
    createNoteMutation.mutate({ case_id: caseId, content: next ? `Call placed on hold at ${format(new Date(), 'h:mm a')}` : `Call resumed from hold at ${format(new Date(), 'h:mm a')}`, note_type: 'call_note' });
  };
  const handleAddThirdParty = () => {
    if (!thirdPartyNumber.trim()) return;
    setIsThreeWay(true); setShowThreeWayInput(false);
    createNoteMutation.mutate({ case_id: caseId, content: `3-way call initiated with ${thirdPartyNumber} at ${format(new Date(), 'h:mm a')}`, note_type: 'call_note' });
  };
  const handleSendSms = () => {
    if (!smsMessage.trim()) return;
    createSmsMutation.mutate({ case_id: caseId, customer_phone: phoneNumber, message: smsMessage, direction: 'sent', status: 'sent', sent_at: new Date().toISOString() });
  };
  const handleQuickSend = (template) => {
    setSmsMessage(template.message);
    setTimeout(() => { createSmsMutation.mutate({ case_id: caseId, customer_phone: phoneNumber, message: template.message, direction: 'sent', status: 'sent', sent_at: new Date().toISOString() }); setSmsMessage(""); }, 100);
  };
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    if (complianceCheck && !complianceCheck.compliant && complianceCheck.risk_level === 'high') {
      if (!window.confirm("This note has compliance issues. Save anyway?")) return;
    }
    createNoteMutation.mutate({ case_id: caseId, content: newNote, note_type: noteType });
  };
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({ case_id: caseId, title: newTaskTitle, status: 'pending', priority: 'medium', assigned_to: user?.email });
  };
  const handleToggleTask = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTaskMutation.mutate({ id: task.id, data: { status: newStatus, completed_date: newStatus === 'completed' ? new Date().toISOString() : null } });
  };

  const getEmploymentStatus = () => {
    if (!customer?.hire_date) return [];
    const days = differenceInDays(new Date(), new Date(customer.hire_date));
    const out = [];
    if (days >= 0 && days <= 30) out.push({ label: 'New Hire', color: '#10B981' });
    if (days >= 0 && days < 90) out.push({ label: `Benefits in ${90 - days}d`, color: '#3B82F6' });
    if (days >= 365) out.push({ label: 'Annual Review Due', color: '#F59E0B' });
    return out;
  };

  const allActivity = [
    ...calls.map(c => ({ ...c, type: 'call', timestamp: c.created_date })),
    ...smsMessages.map(s => ({ ...s, type: 'sms', timestamp: s.created_date || s.sent_at })),
    ...notes.map(n => ({ ...n, type: 'note', timestamp: n.created_date })),
    ...tasks.map(t => ({ ...t, type: 'task', timestamp: t.created_date })),
    ...attachments.map(a => ({ ...a, type: 'attachment', timestamp: a.created_date }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const priorityColor = { urgent: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#9CA3AF' };
  const statusColor = { new: '#10B981', in_progress: '#3B82F6', pending: '#F59E0B', resolved: '#8B5CF6', closed: '#9CA3AF' };
  const employmentStatus = getEmploymentStatus();

  if (caseLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg }}><div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.textSecondary }} /></div>;
  if (!caseData) return <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg }}><div className="text-center"><h2 style={{ color: colors.text }}>Case not found</h2><Link to={createPageUrl("Cases")}><Button className="mt-4 rounded-2xl border-0" style={{ ...getButtonStyle('4px'), color: colors.textSecondary }}>Back to Cases</Button></Link></div></div>;

  return (
    <div className="min-h-screen p-4 md:p-5" style={{ background: colors.bg }}>
      <div className="max-w-[1600px] mx-auto">

        {/* ── BACK + ACTIVE CALL BANNER ── */}
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <Link to={createPageUrl("Cases")}>
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs border-0" style={{ ...getButtonStyle('3px'), color: colors.textSecondary }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Cases
            </button>
          </Link>
          {isOnCall && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 px-4 py-2 rounded-xl flex-1" style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-semibold flex-1">Call in Progress · {formatCallDuration(callDuration)}</span>
              <button onClick={() => setShowActiveCallPanel(true)} className="text-white text-xs underline opacity-80 hover:opacity-100">Show Panel</button>
            </motion.div>
          )}
        </div>

        {/* ── HERO HEADER ── */}
        <div className="rounded-3xl overflow-hidden mb-5" style={{ boxShadow: `14px 14px 28px ${colors.shadowDark}, -14px -14px 28px ${colors.shadowLight}`, background: colors.bg }}>

          {/* Top bar: name + controls */}
          <div className="flex flex-wrap items-center gap-3 px-5 pt-5 pb-3 border-b" style={{ borderColor: colors.border }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={createPageUrl(`Customer?id=${caseData.customer_id}`)}>
                  <h1 className="text-2xl font-bold hover:underline" style={{ color: colors.text }}>{caseData.customer_name}</h1>
                </Link>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${priorityColor[caseData.priority] || '#9CA3AF'}20`, color: priorityColor[caseData.priority] || '#9CA3AF' }}>
                  {caseData.priority}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${statusColor[caseData.status] || '#9CA3AF'}20`, color: statusColor[caseData.status] || '#9CA3AF' }}>
                  {caseData.status?.replace('_', ' ')}
                </span>
                {qualityScore && <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>Quality {qualityScore.overall_score}/100</span>}
                {employmentStatus.map((s, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${s.color}20`, color: s.color }}>{s.label}</span>)}
              </div>
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{caseData.case_number} · {caseData.case_type} · <Link to={createPageUrl(`Customer?id=${caseData.customer_id}`)} className="hover:underline" style={{ color: '#3B82F6' }}>View Profile →</Link></p>
            </div>

            {/* Dropdowns + controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={caseData.customer_id || ''} onValueChange={v => { const c = customers.find(x => x.id === v); updateCaseMutation.mutate({ id: caseId, data: { customer_id: v, customer_name: c ? `${c.first_name} ${c.last_name}` : null, customer_phone: c?.primary_phone || null, customer_email: c?.primary_email || null } }); }}>
                <SelectTrigger className="rounded-xl border-0 h-8 w-44 text-xs" style={{ ...getButtonStyle('3px'), color: colors.text }}>
                  <SelectValue>{customer ? <span className="flex items-center gap-1"><User className="w-3 h-3" />{customer.first_name} {customer.last_name}</span> : <span style={{ color: colors.textSecondary }}>Select Customer</span>}</SelectValue>
                </SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name} · {c.primary_phone}</SelectItem>)}</SelectContent>
              </Select>

              <Select value={caseData.assigned_to || 'unassigned'} onValueChange={v => updateCaseMutation.mutate({ id: caseId, data: { assigned_to: v === 'unassigned' ? null : v } })}>
                <SelectTrigger className="rounded-xl border-0 h-8 w-40 text-xs" style={{ ...getButtonStyle('3px'), color: colors.text }}>
                  <SelectValue>{caseData.assigned_to ? <span className="flex items-center gap-1"><User className="w-3 h-3" />{users.find(u => u.email === caseData.assigned_to)?.full_name || caseData.assigned_to}</span> : <span style={{ color: colors.textSecondary }}>Assign Agent</span>}</SelectValue>
                </SelectTrigger>
                <SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{users.map(u => <SelectItem key={u.email} value={u.email}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
              </Select>

              <Select value={caseData.status} onValueChange={v => updateCaseMutation.mutate({ id: caseId, data: { status: v } })}>
                <SelectTrigger className="rounded-xl border-0 h-8 w-36 text-xs" style={{ ...getButtonStyle('3px'), color: colors.text }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['new','in_progress','pending','resolved','closed'].map(s => <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>)}
                </SelectContent>
              </Select>

              <button onClick={() => setShowAttachmentsPanel(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs border-0" style={{ ...getButtonStyle('3px'), color: colors.textSecondary }}>
                <Paperclip className="w-3.5 h-3.5" />Attachments{attachments.length > 0 && ` (${attachments.length})`}
              </button>
              <button onClick={() => setIsEditingCase(p => !p)} className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs border-0" style={{ ...getButtonStyle('3px'), color: isEditingCase ? '#F59E0B' : colors.textSecondary }}>
                <Edit3 className="w-3.5 h-3.5" />{isEditingCase ? 'Close Editor' : 'Edit Case'}
              </button>
            </div>
          </div>

          {/* Info row: logo + description + tags + links */}
          <div className="flex items-center gap-4 px-5 py-3 flex-wrap">
            {employer?.company_logo_url
              ? <img src={employer.company_logo_url} alt={employer.employer_name} className="h-12 object-contain flex-shrink-0" />
              : <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={getInsetStyle('3px')}><Building2 className="w-6 h-6" style={{ color: colors.textTertiary }} /></div>
            }
            <div className="flex-1 min-w-0">
              {caseData.description && <p className="text-sm font-medium truncate" style={{ color: colors.text }}>{caseData.description}</p>}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {caseData.call_category && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: isDark ? '#1E3A8A' : '#DBEAFE', color: isDark ? '#93C5FD' : '#1E40AF' }}>{caseData.call_category}</span>}
                {caseData.call_reason && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: isDark ? '#5B21B6' : '#EDE9FE', color: isDark ? '#C4B5FD' : '#5B21B6' }}>{caseData.call_reason}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {employer?.benefit_guide_url && <button onClick={() => { setPdfViewerUrl(employer.benefit_guide_url); setPdfViewerTitle(`${employer.employer_name} - Benefit Guide`); setShowPDFViewer(true); }} className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs border-0" style={{ ...getButtonStyle('3px'), color: '#3B82F6' }}><FileText className="w-3 h-3" />Benefit Guide</button>}
              {employer?.portal_link_1_url && <a href={employer.portal_link_1_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs no-underline" style={{ ...getButtonStyle('3px'), color: '#10B981' }}>{employer.portal_link_1_label || 'Portal 1'}</a>}
              {employer?.portal_link_2_url && <a href={employer.portal_link_2_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs no-underline" style={{ ...getButtonStyle('3px'), color: '#8B5CF6' }}>{employer.portal_link_2_label || 'Portal 2'}</a>}
            </div>
          </div>

          {/* Edit Case Panel (collapsible) */}
          <AnimatePresence>
            {isEditingCase && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t" style={{ borderColor: colors.border }}>
                <div className="p-5 space-y-4">
                  {/* POC Transcript */}
                  <div className="p-4 rounded-xl" style={{ background: isDark ? '#1f2937' : '#fef3c7', border: '2px dashed #F59E0B' }}>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: '#F59E0B' }}>🧪 POC: Paste Transcript</label>
                    <Textarea value={manualTranscript} onChange={e => setManualTranscript(e.target.value)} placeholder="Paste call transcript here..." className="rounded-xl border-0 min-h-20 mb-2" style={{ ...getInsetStyle('3px'), color: colors.text }} />
                    <Button onClick={async () => {
                      if (!manualTranscript.trim()) return;
                      setProcessingTranscript(true);
                      try {
                        const response = await invokeAI({ prompt: `Analyze this call transcript:\n${manualTranscript}\nCustomer: ${caseData?.customer_name || 'N/A'}\nProvide: summary, key points, action items, sentiment (positive/neutral/negative), compliance score (0-100), quality score (0-100).`, response_json_schema: { type: "object", properties: { summary:{type:"string"}, key_points:{type:"array",items:{type:"string"}}, action_items:{type:"array",items:{type:"string"}}, sentiment:{type:"string",enum:["positive","neutral","negative"]}, compliance_score:{type:"number"}, quality_score:{type:"number"} }, required: ["summary","key_points","action_items","sentiment","compliance_score","quality_score"] } });
                        createTranscriptMutation.mutate({ call_id: 'manual-poc', case_id: caseId, transcript_text: manualTranscript, ai_summary: response.summary, key_points: response.key_points, action_items: response.action_items, sentiment: response.sentiment, compliance_score: response.compliance_score, quality_score: response.quality_score, created_date: new Date().toISOString() });
                        setAiSuggestion({ summary: `Analysis Complete - Quality: ${response.quality_score}/100`, key_points: response.key_points, action_items: response.action_items });
                        setManualTranscript('');
                      } catch(e) { console.error(e); }
                      setProcessingTranscript(false);
                    }} disabled={!manualTranscript.trim() || processingTranscript} className="rounded-xl h-8 px-4 border-0 text-xs" style={{ ...getButtonStyle('3px', '#F59E0B'), color: '#fff', fontWeight: 600 }}>
                      {processingTranscript ? 'Processing...' : '🧪 Process'}
                    </Button>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: colors.text }}>What is this call about?</label>
                    <div className="flex flex-wrap gap-2">
                      {['General Benefits','HSA/FSA','Medical','Dental','Vision','Life','Disability','Other'].map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} className="px-3 py-1.5 rounded-xl text-xs border-0" style={selectedCategory === cat ? { background: isDark ? '#3B82F6' : '#DBEAFE', color: isDark ? '#fff' : '#1E40AF', boxShadow: `inset 2px 2px 4px ${colors.shadowDark}` } : { background: isDark ? '#374151' : '#F3F4F6', color: colors.textSecondary, boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}` }}>{cat}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: colors.text }}>Why did they call?</label>
                    <div className="flex flex-wrap gap-2">
                      {['General Questions','Enrollment Assistance','Claim Assistance','Document Submissions','Provider Search','Billing Inquiry','Authorization Request','Other'].map(r => (
                        <button key={r} onClick={() => setSelectedReason(r)} className="px-3 py-1.5 rounded-xl text-xs border-0" style={selectedReason === r ? { background: isDark ? '#8B5CF6' : '#EDE9FE', color: isDark ? '#fff' : '#5B21B6', boxShadow: `inset 2px 2px 4px ${colors.shadowDark}` } : { background: isDark ? '#4B5563' : '#E5E7EB', color: colors.textSecondary, boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}` }}>{r}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => { updateCaseMutation.mutate({ id: caseId, data: { call_category: selectedCategory, call_reason: selectedReason } }); setIsEditingCase(false); }} className="rounded-xl h-8 px-5 border-0 text-xs" style={{ ...getButtonStyle('3px', '#10B981'), color: '#fff', fontWeight: 600 }}>Save</Button>
                    <Button onClick={() => { setSelectedCategory(caseData.call_category||null); setSelectedReason(caseData.call_reason||null); setIsEditingCase(false); }} className="rounded-xl h-8 px-5 border-0 text-xs" style={{ ...getButtonStyle('3px'), color: colors.textSecondary }}>Cancel</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── AI TOOLS BAR ── */}
        <div className="flex items-center gap-2 flex-wrap mb-5 p-3 rounded-2xl" style={{ boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`, background: colors.bg }}>
          <span className="text-[10px] font-bold mr-1" style={{ color: colors.textTertiary }}>Ai</span>
          {[
            { label: 'Summarize', icon: Brain, fn: handleSummarizeCall, disabled: aiLoading || !calls.length },
            { label: 'Priority', icon: Target, fn: handleDetectPriority, disabled: aiLoading },
            { label: 'Response', icon: Zap, fn: handleGenerateResponse, disabled: aiLoading },
            { label: 'Quality', icon: TrendingUp, fn: handleScoreQuality, disabled: aiLoading || !notes.length },
            { label: 'Compliance', icon: Shield, fn: handleCheckCompliance, disabled: aiLoading || !newNote.trim() },
          ].map(({ label, icon: Icon, fn, disabled }) => (
            <button key={label} onClick={fn} disabled={disabled} className="flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium border-0 disabled:opacity-40" style={{ ...getButtonStyle('2px'), color: '#8B5CF6' }}>
              <Icon className="w-2.5 h-2.5" />{label}
            </button>
          ))}
        </div>

        {/* ── MAIN 2-COLUMN GRID ── */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* LEFT: Tabbed main content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="comms">
              <TabsList className="w-full rounded-2xl border-0 p-1 mb-4 grid grid-cols-4" style={getInsetStyle('3px')}>
                <TabsTrigger value="comms" className="rounded-xl text-xs font-semibold" style={{ color: colors.textSecondary }}>
                  📞 Call & SMS {smsMessages.length > 0 && `(${smsMessages.length})`}
                </TabsTrigger>
                <TabsTrigger value="notes" className="rounded-xl text-xs font-semibold" style={{ color: colors.textSecondary }}>
                  📝 Notes & Tasks {notes.length + tasks.length > 0 && `(${notes.length + tasks.length})`}
                </TabsTrigger>
                <TabsTrigger value="activity" className="rounded-xl text-xs font-semibold" style={{ color: colors.textSecondary }}>
                  ⚡ Activity {allActivity.length > 0 && `(${allActivity.length})`}
                </TabsTrigger>
                <TabsTrigger value="transcripts" className="rounded-xl text-xs font-semibold" style={{ color: colors.textSecondary }}>
                  🧠 Analysis {callTranscripts.length > 0 && `(${callTranscripts.length})`}
                </TabsTrigger>
              </TabsList>

              {/* ── CALL & SMS TAB ── */}
              <TabsContent value="comms" className="space-y-4">
                {/* Call Interface */}
                <Section title="Call Interface" icon={Phone} accent={isOnCall ? '#10B981' : undefined} defaultOpen={true}>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1 (555) 000-0000" disabled={isOnCall} className="rounded-2xl border-0 h-10 flex-1" style={{ ...getInsetStyle('3px'), color: colors.text }} />
                      {!isOnCall && (
                        <Button onClick={handleStartCall} disabled={!phoneNumber} className="rounded-2xl h-10 px-5 border-0 font-semibold text-sm" style={customer?.is_vip ? { ...getButtonStyle('5px'), backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa7c4cb70fe91d38015eba/381316158_image.png)', backgroundSize: 'cover', color: '#000', border: '3px solid #D97706' } : { ...getButtonStyle('5px'), color: '#10B981', fontWeight: 700 }}>
                          <PhoneCall className="w-4 h-4 mr-1.5" />{customer?.is_vip ? '✨ VIP Call' : 'Call'}
                        </Button>
                      )}
                    </div>

                    {isOnCall && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-2xl" style={getInsetStyle('4px')}>
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isOnHold ? 'animate-pulse' : ''}`} style={{ background: isOnHold ? '#F59E0B' : '#10B981', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
                              {isOnHold ? <Pause className="w-7 h-7 text-white" /> : <PhoneCall className="w-7 h-7 text-white" />}
                            </div>
                            <div>
                              <p className="text-2xl font-bold tabular-nums" style={{ color: colors.text }}>{formatCallDuration(callDuration)}</p>
                              <p className="text-xs" style={{ color: colors.textSecondary }}>{isOnHold ? 'On hold' : 'Active'}{isThreeWay && ' · 3-Way'}</p>
                            </div>
                          </div>
                          {recordTranscript && <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: '#EF444420', color: '#EF4444' }}><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />Recording</span>}
                        </div>
                        <AnimatePresence>
                          {showThreeWayInput && !isThreeWay && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex gap-2">
                              <Input value={thirdPartyNumber} onChange={e => setThirdPartyNumber(e.target.value)} placeholder="Third party number" className="rounded-2xl border-0 h-9 flex-1" style={{ ...getInsetStyle('3px'), color: colors.text }} />
                              <Button onClick={handleAddThirdParty} disabled={!thirdPartyNumber.trim()} className="rounded-2xl h-9 px-4 border-0 text-xs" style={{ ...getButtonStyle('3px'), color: colors.textSecondary }}>Add</Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {isThreeWay && <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: '#3B82F620', color: '#3B82F6' }}><Users className="w-4 h-4" />3-Way Active · {thirdPartyNumber}</div>}
                        <div className="grid grid-cols-3 gap-2">
                          <Button onClick={handleToggleHold} className="rounded-xl h-10 border-0 flex-col gap-0.5 text-xs" style={isOnHold ? { ...getInsetStyle('3px', '#F59E0B'), color: '#fff' } : { ...getButtonStyle('3px'), color: colors.text }}>
                            <Pause className="w-4 h-4" />{isOnHold ? 'Resume' : 'Hold'}
                          </Button>
                          <Button onClick={() => setShowThreeWayInput(p => !p)} disabled={isThreeWay} className="rounded-xl h-10 border-0 flex-col gap-0.5 text-xs" style={isThreeWay || showThreeWayInput ? { ...getInsetStyle('3px', '#3B82F6'), color: '#fff' } : { ...getButtonStyle('3px'), color: colors.text }}>
                            <Users className="w-4 h-4" />3-Way
                          </Button>
                          <Button onClick={handleEndCall} className="rounded-xl h-10 border-0 flex-col gap-0.5 text-xs" style={{ ...getButtonStyle('3px', '#EF4444'), color: '#fff' }}>
                            <PhoneOff className="w-4 h-4" />End
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Section>

                {/* SMS */}
                <Section title="SMS Messages" icon={MessageSquare} count={smsMessages.length} accent="#3B82F6" defaultOpen={true}>
                  <div className="max-h-56 overflow-y-auto space-y-2 mb-3 p-3 rounded-xl" style={getInsetStyle('3px')}>
                    {smsMessages.length === 0
                      ? <p className="text-center text-xs py-4" style={{ color: colors.textSecondary }}>No messages yet</p>
                      : smsMessages.map(sms => (
                          <div key={sms.id} className={`p-2.5 rounded-xl max-w-[78%] text-sm ${sms.direction === 'sent' ? 'ml-auto' : 'mr-auto'}`} style={{ background: sms.direction === 'sent' ? '#2563EB' : isDark ? '#374151' : '#F3F4F6', color: sms.direction === 'sent' ? '#fff' : colors.text }}>
                            <p>{sms.message}</p>
                            <p className="text-xs opacity-60 mt-0.5">{format(new Date(sms.created_date), 'h:mm a')}</p>
                          </div>
                        ))
                    }
                  </div>
                  {textTemplates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {textTemplates.map(t => <button key={t.id} onClick={() => handleQuickSend(t)} className="h-6 px-2.5 rounded-lg text-xs border-0" style={{ ...getButtonStyle('2px'), color: colors.textSecondary }}>{t.label}</button>)}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <Input value={smsMessage} onChange={e => setSmsMessage(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && handleSendSms()} className="rounded-2xl border-0 h-10" style={{ ...getInsetStyle('3px'), color: colors.text }} />
                      <button onClick={handleGenerateResponse} disabled={aiLoading} className="w-10 h-10 rounded-xl border-0 flex items-center justify-center flex-shrink-0" style={{ ...getButtonStyle('3px'), color: '#8B5CF6' }} title="AI Generate"><Sparkles className="w-4 h-4" /></button>
                    </div>
                    <Button onClick={handleSendSms} disabled={!smsMessage.trim()} className="rounded-2xl h-10 px-4 border-0" style={{ ...getButtonStyle('4px'), color: colors.textSecondary }}><Send className="w-4 h-4" /></Button>
                  </div>
                </Section>

                {/* Call Log */}
                <Section title="Call Log" icon={Phone} count={calls.length} defaultOpen={false}>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {calls.length === 0 ? <p className="text-xs text-center py-6" style={{ color: colors.textSecondary }}>No calls yet</p>
                      : calls.map(call => {
                          const hasTranscript = callTranscripts.some(t => t.call_id === call.id);
                          return (
                            <div key={call.id} className="flex items-center gap-3 p-3 rounded-xl" style={getButtonStyle('3px')}>
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: call.direction === 'inbound' ? '#DBEAFE' : '#DCFCE7' }}>
                                <Phone className="w-4 h-4" style={{ color: call.direction === 'inbound' ? '#2563EB' : '#059669' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold" style={{ color: colors.text }}>{call.direction === 'inbound' ? 'Incoming' : 'Outgoing'} · {call.customer_phone}</p>
                                <p className="text-xs" style={{ color: colors.textSecondary }}>{call.duration ? formatCallDuration(call.duration) + ' · ' : ''}{format(new Date(call.created_date), 'MMM d, h:mm a')}</p>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: call.status === 'completed' ? '#DCFCE7' : '#FEE2E2', color: call.status === 'completed' ? '#166534' : '#991B1B' }}>{call.status}</span>
                              {hasTranscript && <button onClick={() => document.getElementById('transcript-tab')?.click()} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>Transcript</button>}
                            </div>
                          );
                        })
                    }
                  </div>
                </Section>
              </TabsContent>

              {/* ── NOTES & TASKS TAB ── */}
              <TabsContent value="notes" className="space-y-4">
                {/* Add Note */}
                <Section title="Add Note" icon={FileText} defaultOpen={true} accent="#F59E0B">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select value={noteType} onValueChange={setNoteType}>
                        <SelectTrigger className="rounded-xl border-0 h-9 w-40 text-xs" style={{ ...getInsetStyle('3px'), color: colors.text }}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['general','call_note','follow_up','important'].map(t => <SelectItem key={t} value={t}>{t.replace('_',' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {complianceCheck && (
                        <span className="flex items-center gap-1 text-xs px-2 rounded-xl" style={{ background: complianceCheck.compliant ? '#DCFCE7' : '#FEE2E2', color: complianceCheck.compliant ? '#166534' : '#991B1B' }}>
                          {complianceCheck.compliant ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {complianceCheck.compliant ? 'OK' : 'Issues'}
                        </span>
                      )}
                    </div>
                    <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." className="rounded-2xl border-0 min-h-20" style={{ ...getInsetStyle('3px'), color: colors.text }} />
                    <div className="flex gap-2">
                      <button onClick={handleCheckCompliance} disabled={!newNote.trim() || aiLoading} className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs border-0 disabled:opacity-40" style={{ ...getButtonStyle('3px'), color: '#EF4444' }}><Shield className="w-3.5 h-3.5" />Check</button>
                      <button onClick={handleSmartNoteSuggestions} disabled={aiLoading} className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs border-0 disabled:opacity-40" style={{ ...getButtonStyle('3px'), color: '#8B5CF6' }}><Sparkles className="w-3.5 h-3.5" />AI Suggest</button>
                      <Button onClick={handleAddNote} disabled={!newNote.trim()} className="flex-1 rounded-2xl h-9 border-0 text-sm font-semibold" style={{ ...getButtonStyle('4px'), color: '#10B981' }}><Plus className="w-4 h-4 mr-1" />Add Note</Button>
                    </div>
                  </div>
                </Section>

                {/* Notes List */}
                <Section title="Notes" icon={FileText} count={notes.filter(n => n.note_type !== 'follow_up').length} defaultOpen={true}>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notes.filter(n => n.note_type !== 'follow_up').length === 0
                      ? <p className="text-xs text-center py-6" style={{ color: colors.textSecondary }}>No notes yet</p>
                      : notes.filter(n => n.note_type !== 'follow_up').map(note => (
                          <div key={note.id} className="p-3 rounded-xl" style={getButtonStyle('3px')}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: colors.border, color: colors.textSecondary }}>{note.note_type.replace('_',' ')}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: colors.textTertiary }}>{format(new Date(note.created_date), 'MMM d, h:mm a')}</span>
                                <button onClick={() => deleteNoteMutation.mutate(note.id)} className="w-6 h-6 flex items-center justify-center rounded-lg border-0" style={{ background: 'transparent', color: '#EF4444' }}><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                            <p className="text-sm" style={{ color: colors.text }}>{note.content}</p>
                          </div>
                        ))
                    }
                  </div>
                </Section>

                {/* Follow Ups */}
                <Section title="Follow Ups" icon={Clock} count={notes.filter(n => n.note_type === 'follow_up').length} accent="#F59E0B" defaultOpen={notes.filter(n => n.note_type === 'follow_up').length > 0}>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {notes.filter(n => n.note_type === 'follow_up').length === 0
                      ? <p className="text-xs text-center py-4" style={{ color: colors.textSecondary }}>No follow-ups yet</p>
                      : notes.filter(n => n.note_type === 'follow_up').map(note => (
                          <div key={note.id} className="p-3 rounded-xl" style={getButtonStyle('3px')}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>Follow Up</span>
                              <button onClick={() => deleteNoteMutation.mutate(note.id)} className="w-6 h-6 flex items-center justify-center rounded-lg border-0" style={{ background: 'transparent', color: '#EF4444' }}><Trash2 className="w-3 h-3" /></button>
                            </div>
                            <p className="text-sm" style={{ color: colors.text }}>{note.content}</p>
                            <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>{format(new Date(note.created_date), 'MMM d, h:mm a')}</p>
                          </div>
                        ))
                    }
                  </div>
                </Section>

                {/* Tasks */}
                <Section title="Tasks" icon={CheckCircle2} count={tasks.length} accent="#10B981" defaultOpen={true}>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto mb-3">
                    {tasks.length === 0
                      ? <p className="text-xs text-center py-4" style={{ color: colors.textSecondary }}>No tasks yet</p>
                      : tasks.map(task => (
                          <div key={task.id} className="flex items-center gap-2 p-2.5 rounded-xl" style={getButtonStyle('2px')}>
                            <button onClick={() => handleToggleTask(task)} className="w-5 h-5 flex items-center justify-center border-0" style={{ background: 'transparent' }}>
                              {task.status === 'completed' ? <CheckSquare className="w-4 h-4" style={{ color: '#10B981' }} /> : <Square className="w-4 h-4" style={{ color: colors.textTertiary }} />}
                            </button>
                            <span className={`flex-1 text-sm ${task.status === 'completed' ? 'line-through' : ''}`} style={{ color: task.status === 'completed' ? colors.textTertiary : colors.text }}>{task.title}</span>
                            <button onClick={() => deleteTaskMutation.mutate(task.id)} className="w-5 h-5 flex items-center justify-center border-0" style={{ background: 'transparent', color: '#EF4444' }}><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))
                    }
                  </div>
                  <div className="flex gap-2">
                    <Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="New task..." onKeyDown={e => e.key === 'Enter' && handleAddTask()} className="rounded-2xl border-0 h-9 flex-1" style={{ ...getInsetStyle('3px'), color: colors.text }} />
                    <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()} className="rounded-2xl h-9 px-3 border-0" style={{ ...getButtonStyle('3px'), color: colors.textSecondary }}><Plus className="w-4 h-4" /></Button>
                  </div>
                </Section>
              </TabsContent>

              {/* ── ACTIVITY TAB ── */}
              <TabsContent value="activity">
                <div className="rounded-2xl overflow-hidden" style={{ boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`, background: colors.bg }}>
                  <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: colors.border }}>
                    <Activity className="w-4 h-4" style={{ color: colors.textSecondary }} />
                    <span className="text-sm font-semibold" style={{ color: colors.text }}>Activity Timeline</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: colors.border, color: colors.textSecondary }}>{allActivity.length}</span>
                  </div>
                  <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
                    {allActivity.length === 0
                      ? <p className="text-center text-sm py-12" style={{ color: colors.textSecondary }}>No activity yet</p>
                      : allActivity.map((a, i) => (
                          <div key={`${a.type}-${a.id}-${i}`} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={getButtonStyle('2px')}>
                                {a.type === 'call' && <Phone className="w-4 h-4" style={{ color: '#3B82F6' }} />}
                                {a.type === 'sms' && <MessageSquare className="w-4 h-4" style={{ color: '#F59E0B' }} />}
                                {a.type === 'note' && <FileText className="w-4 h-4" style={{ color: '#8B5CF6' }} />}
                                {a.type === 'task' && <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />}
                                {a.type === 'attachment' && <Paperclip className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
                              </div>
                              {i < allActivity.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: colors.border }} />}
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex items-start justify-between">
                                <p className="text-xs font-semibold" style={{ color: colors.text }}>
                                  {a.type === 'call' && `${a.direction === 'inbound' ? 'Incoming' : 'Outgoing'} Call`}
                                  {a.type === 'sms' && `SMS ${a.direction === 'sent' ? 'Sent' : 'Received'}`}
                                  {a.type === 'note' && 'Note Added'}
                                  {a.type === 'task' && `Task: ${a.title}`}
                                  {a.type === 'attachment' && `Attachment: ${a.title || a.file_name || 'File'}`}
                                </p>
                                <span className="text-xs ml-2 flex-shrink-0" style={{ color: colors.textTertiary }}>{format(new Date(a.timestamp), 'MMM d, h:mm a')}</span>
                              </div>
                              {a.type === 'call' && a.duration && <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{formatCallDuration(a.duration)}</p>}
                              {a.type === 'sms' && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: colors.textSecondary }}>{a.message}</p>}
                              {a.type === 'note' && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: colors.textSecondary }}>{a.content}</p>}
                              {a.type === 'attachment' && a.file_url && <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: '#3B82F6' }}>View File</a>}
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>
              </TabsContent>

              {/* ── TRANSCRIPTS TAB ── */}
              <TabsContent value="transcripts" id="transcript-tab">
                <div className="space-y-4">
                  {callTranscripts.length === 0
                    ? (
                      <div className="rounded-2xl p-12 text-center" style={{ boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`, background: colors.bg }}>
                        <Brain className="w-10 h-10 mx-auto mb-3" style={{ color: colors.textTertiary }} />
                        <p className="text-sm" style={{ color: colors.textSecondary }}>No transcripts yet. Transcripts are generated automatically after each call.</p>
                      </div>
                    )
                    : callTranscripts.map(t => (
                        <div key={t.id} className="rounded-2xl overflow-hidden" style={{ boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`, background: colors.bg }}>
                          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: t.sentiment === 'positive' ? '#DCFCE7' : t.sentiment === 'negative' ? '#FEE2E2' : '#DBEAFE', color: t.sentiment === 'positive' ? '#166534' : t.sentiment === 'negative' ? '#991B1B' : '#1D4ED8' }}>{t.sentiment}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>Quality {t.quality_score}/100</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#10B98120', color: '#10B981' }}>Compliance {t.compliance_score}/100</span>
                            </div>
                            <span className="text-xs" style={{ color: colors.textTertiary }}>{format(new Date(t.created_date), 'MMM d, h:mm a')}</span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="p-3 rounded-xl text-sm" style={getInsetStyle('3px')}>
                              <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>Summary</p>
                              <p style={{ color: colors.text }}>{t.ai_summary}</p>
                            </div>
                            {t.key_points?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>Key Points</p>
                                <ul className="space-y-1">{t.key_points.map((p, i) => <li key={i} className="flex items-start gap-2 text-xs" style={{ color: colors.text }}><ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#8B5CF6' }} />{p}</li>)}</ul>
                              </div>
                            )}
                            {t.action_items?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1.5" style={{ color: colors.textSecondary }}>Action Items</p>
                                <ul className="space-y-1">{t.action_items.map((a, i) => <li key={i} className="flex items-start gap-2 text-xs" style={{ color: colors.text }}><CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} />{a}</li>)}</ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  }
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-4">
            {/* Customer Quick Info */}
            <Section title="Customer" icon={User} defaultOpen={true}>
              <div className="space-y-2.5">
                {caseData.customer_phone && (
                  <a href={`tel:${caseData.customer_phone}`} className="flex items-center gap-2.5 no-underline">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={getButtonStyle('2px')}><Phone className="w-3.5 h-3.5" style={{ color: '#10B981' }} /></div>
                    <div><p className="text-xs" style={{ color: colors.textTertiary }}>Phone</p><p className="text-sm font-medium" style={{ color: '#3B82F6' }}>{caseData.customer_phone}</p></div>
                  </a>
                )}
                {caseData.customer_email && (
                  <a href={`mailto:${caseData.customer_email}`} className="flex items-center gap-2.5 no-underline">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={getButtonStyle('2px')}><Mail className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} /></div>
                    <div className="min-w-0"><p className="text-xs" style={{ color: colors.textTertiary }}>Email</p><p className="text-sm font-medium truncate" style={{ color: '#3B82F6' }}>{caseData.customer_email}</p></div>
                  </a>
                )}
                {caseData.policy_number && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={getButtonStyle('2px')}><FileText className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} /></div>
                    <div><p className="text-xs" style={{ color: colors.textTertiary }}>Policy</p><p className="text-sm font-medium" style={{ color: colors.text }}>{caseData.policy_number}</p></div>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={getButtonStyle('2px')}><Calendar className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} /></div>
                  <div><p className="text-xs" style={{ color: colors.textTertiary }}>Opened</p><p className="text-sm font-medium" style={{ color: colors.text }}>{format(new Date(caseData.created_date), 'MMM d, yyyy')}</p></div>
                </div>
              </div>
            </Section>

            {/* Carrier Info */}
            {client && (
              <Section title="Carrier Info" icon={Briefcase} defaultOpen={true} accent="#F59E0B">
                <div className="space-y-2">
                  {client.company_logo_url && <img src={client.company_logo_url} alt={client.company_name} className="max-h-10 object-contain mb-2" />}
                  {[
                    { name: client.carrier_medical_name, phone: client.carrier_medical_phone, logo: client.carrier_medical_logo_url, label: 'Medical' },
                    { name: client.carrier_dental_name, phone: client.carrier_dental_phone, logo: client.carrier_dental_logo_url, label: 'Dental' },
                    { name: client.carrier_vision_name, phone: client.carrier_vision_phone, logo: client.carrier_vision_logo_url, label: 'Vision' },
                    { name: client.carrier_life_name, phone: client.carrier_life_phone, logo: client.carrier_life_logo_url, label: 'Life' },
                    { name: client.carrier_disability_name, phone: client.carrier_disability_phone, logo: client.carrier_disability_logo_url, label: 'Disability' },
                  ].filter(c => c.name).map(c => (
                    <div key={c.label} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={getButtonStyle('2px')}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" style={getInsetStyle('2px')}>
                        {c.logo ? <img src={c.logo} alt={c.label} className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4" style={{ color: colors.textSecondary }} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs" style={{ color: colors.textTertiary }}>{c.label}</p>
                        <p className="text-xs font-semibold truncate" style={{ color: colors.text }}>{c.name}</p>
                        {c.phone && <a href={`tel:${c.phone}`} className="text-xs hover:underline" style={{ color: '#3B82F6' }}>{c.phone}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Calls', value: calls.length, color: '#3B82F6' },
                { label: 'Notes', value: notes.length, color: '#8B5CF6' },
                { label: 'Tasks', value: `${tasks.filter(t => t.status === 'completed').length}/${tasks.length}`, color: '#10B981' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center" style={getButtonStyle('3px')}>
                  <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FLOATING OVERLAYS ── */}
      <AISuggestionsOrb
        suggestion={aiSuggestion}
        isLoading={aiLoading}
        onAccept={s => { if (s.priority) updateCaseMutation.mutate({ id: caseId, data: { priority: s.priority } }); setAiSuggestion(null); }}
        onDismiss={() => setAiSuggestion(null)}
        type={callSummary ? "summary" : qualityScore ? "quality" : complianceCheck ? "compliance" : "suggestion"}
      />

      <ActiveCallPanel
        isVisible={showActiveCallPanel}
        callDuration={callDuration}
        phoneNumber={phoneNumber}
        customerName={caseData?.customer_name}
        isOnHold={isOnHold}
        isThreeWay={isThreeWay}
        thirdPartyNumber={thirdPartyNumber}
        transcript={callTranscriptEntries}
        isVIP={customer?.is_vip}
        onToggleHold={handleToggleHold}
        onEndCall={handleEndCall}
        onMinimize={() => setShowActiveCallPanel(false)}
      />

      {showPDFViewer && <PDFViewer pdfUrl={pdfViewerUrl} title={pdfViewerTitle} onClose={() => { setShowPDFViewer(false); setPdfViewerUrl(null); setPdfViewerTitle(''); }} />}
      <AttachmentsPanel isOpen={showAttachmentsPanel} onClose={() => setShowAttachmentsPanel(false)} caseId={caseId} />
    </div>
  );
}