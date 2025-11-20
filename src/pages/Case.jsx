import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Phone,
  PhoneCall,
  PhoneOff,
  MessageSquare,
  Send,
  FileText,
  Clock,
  User,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  MoreVertical,
  Play,
  Pause,
  Download,
  Pin,
  AlertCircle,
  Activity,
  TrendingUp,
  CheckSquare,
  Square,
  Sparkles,
  Brain,
  Shield,
  Zap,
  Target,
  Users,
  UserPlus,
  Building2, // Added
  Briefcase // Added
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, differenceInDays } from "date-fns"; // Added differenceInDays
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import AiAssistant from "../components/ai/AiAssistant"; // This import can be removed if not used elsewhere, but for now, the orb replaces its usage
import AISuggestionsOrb from "../components/assistant/AISuggestionsOrb"; // New import
import ActiveCallPanel from "../components/phone/ActiveCallPanel";
import {
  summarizeCall,
  suggestNotes,
  detectPriority,
  generateResponse,
  scoreCallQuality,
  checkCompliance } from
"../components/ai/aiHelpers";
import { useTheme } from "@/components/ThemeProvider";
import { useUser } from "@/components/hooks/useUser";

export default function CasePage() {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [callDuration, setCallDuration] = useState(0);
  const [isOnCall, setIsOnCall] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false); // New state for call on hold
  const [callTimer, setCallTimer] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null); // New state for current call ID
  const [phoneNumber, setPhoneNumber] = useState("");
  const [thirdPartyNumber, setThirdPartyNumber] = useState(""); // New state for third party number
  const [isThreeWay, setIsThreeWay] = useState(false); // New state for 3-way call active
  const [showThreeWayInput, setShowThreeWayInput] = useState(false); // New state to show/hide 3-way input
  const [recordTranscript, setRecordTranscript] = useState(true); // Auto-enabled by default
  const [smsMessage, setSmsMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [showActiveCallPanel, setShowActiveCallPanel] = useState(false);
  const [callTranscriptEntries, setCallTranscriptEntries] = useState([]);

  // AI State
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true); // Kept for its usage in useEffect for smart note suggestions
  const [callSummary, setCallSummary] = useState(null);
  const [complianceCheck, setComplianceCheck] = useState(null);
  const [qualityScore, setQualityScore] = useState(null);
  const [isEditingCase, setIsEditingCase] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);

  const { colors, isDark } = useTheme(); // Destructure isDark here
  const { data: user } = useUser();

  // Helper functions for common neumorphic styles
  // `bgColor` parameter allows overriding the default background color (colors.bg)
  const getButtonStyle = (shadowStrength = '3px', bgColor = colors.bg) => ({
    background: bgColor,
    boxShadow: `${shadowStrength} ${shadowStrength} ${parseInt(shadowStrength) * 2}px ${colors.shadowDark}, -${shadowStrength} -${shadowStrength} ${parseInt(shadowStrength) * 2}px ${colors.shadowLight}`
  });

  const getInsetStyle = (shadowStrength = '4px', bgColor = colors.bg) => ({
    background: bgColor,
    boxShadow: `inset ${shadowStrength} ${shadowStrength} ${parseInt(shadowStrength) * 2}px ${colors.shadowDark}, inset -${shadowStrength} -${shadowStrength} ${parseInt(shadowStrength) * 2}px ${colors.shadowLight}`
  });

  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const cases = await base44.entities.Case.filter({ id: caseId });
      return cases[0];
    },
    enabled: !!caseId
  });

  // Add customer query
  const { data: customer } = useQuery({
    queryKey: ['case-customer', caseData?.customer_id],
    queryFn: async () => {
      if (!caseData?.customer_id) return null;
      const customers = await base44.entities.Customer.filter({ id: caseData.customer_id });
      return customers[0];
    },
    enabled: !!caseData?.customer_id
  });

  // Fetch employer/company data
  const { data: employer } = useQuery({
    queryKey: ['customer-employer', customer?.company_id],
    queryFn: async () => {
      if (!customer?.company_id) return null;
      const employers = await base44.entities.Employer.filter({ id: customer.company_id });
      return employers[0];
    },
    enabled: !!customer?.company_id
  });

  // Add customers list query
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => base44.entities.Customer.list('-updated_date', 100)
  });

  const { data: calls = [] } = useQuery({
    queryKey: ['case-calls', caseId],
    queryFn: () => base44.entities.Call.filter({ case_id: caseId }, '-created_date'),
    enabled: !!caseId
  });

  const { data: smsMessages = [] } = useQuery({
    queryKey: ['case-sms', caseId],
    queryFn: () => base44.entities.SMS.filter({ case_id: caseId }, '-created_date'),
    enabled: !!caseId
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['case-notes', caseId],
    queryFn: () => base44.entities.Note.filter({ case_id: caseId }, '-created_date'),
    enabled: !!caseId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['case-tasks', caseId],
    queryFn: () => base44.entities.Task.filter({ case_id: caseId }, '-created_date'),
    enabled: !!caseId
  });

  // Add text templates query
  const { data: textTemplates = [] } = useQuery({
    queryKey: ['text-templates'],
    queryFn: () => base44.entities.TextTemplate.filter({ is_active: true })
  });

  // Add call transcripts query
  const { data: callTranscripts = [] } = useQuery({
    queryKey: ['case-transcripts', caseId],
    queryFn: () => base44.entities.CallTranscript.filter({ case_id: caseId }, '-created_date'),
    enabled: !!caseId
  });

  useEffect(() => {
    // Check for stale calls (calls marked as in_progress that are older than 1 hour)
    const checkForStaleCalls = async () => {
      if (caseId && calls.length > 0) {// Ensure calls data is available
        const staleCalls = calls.filter((call) => {
          if (call.status === 'in_progress' && call.call_start_time) {
            const startTime = new Date(call.call_start_time);
            const hoursSinceStart = (new Date() - startTime) / (1000 * 60 * 60);
            return hoursSinceStart > 1; // More than 1 hour
          }
          return false;
        });

        // Auto-fix stale calls
        for (const staleCall of staleCalls) {
          console.log('Fixing stale call:', staleCall.id);
          updateCallMutation.mutate({
            id: staleCall.id,
            data: {
              status: 'failed',
              call_end_time: staleCall.call_start_time // Set end time to start time
            }
          });
        }
      }
    };

    checkForStaleCalls();
  }, [calls, caseId]); // Added calls and caseId to dependency array

  useEffect(() => {
    // Prioritize customer.primary_phone if available, otherwise caseData.customer_phone
    if (customer?.primary_phone) {
      setPhoneNumber(customer.primary_phone);
    } else if (caseData?.customer_phone) {
      setPhoneNumber(caseData.customer_phone);
    }
  }, [caseData, customer]);

  useEffect(() => {
    if (caseData) {
      setSelectedCategory(caseData.call_category || null);
      setSelectedReason(caseData.call_reason || null);
    }
  }, [caseData?.id]);

  // Auto-suggest notes when case loads
  useEffect(() => {
    if (caseData && showAiPanel) {
      handleSmartNoteSuggestions();
    }
  }, [caseData?.id]);

  const updateCaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Case.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      // Invalidate customer specific query if customer_id was changed
      queryClient.invalidateQueries({ queryKey: ['case-customer'] });
    }
  });

  // Add users query for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list() // Assuming 'full_name' is a valid field, or fetch all and sort/filter later
  });

  const createCallMutation = useMutation({
    mutationFn: (callData) => base44.entities.Call.create(callData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-calls', caseId] });
      queryClient.invalidateQueries({ queryKey: ['calls'] });
    }
  });

  // New update call mutation for ending a call
  const updateCallMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Call.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-calls', caseId] });
      queryClient.invalidateQueries({ queryKey: ['calls'] });
    }
  });

  const createSmsMutation = useMutation({
    mutationFn: (smsData) => base44.entities.SMS.create(smsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-sms', caseId] });
      setSmsMessage("");
    }
  });

  const createNoteMutation = useMutation({
    mutationFn: (noteData) => base44.entities.Note.create(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes', caseId] });
      setNewNote("");
      setComplianceCheck(null);
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => base44.entities.Note.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes', caseId] });
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] });
      setNewTaskTitle("");
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => base44.entities.Task.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-tasks', caseId] });
    }
  });

  const createTranscriptMutation = useMutation({
    mutationFn: (transcriptData) => base44.entities.CallTranscript.create(transcriptData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-transcripts', caseId] });
    }
  });

  // AI Feature Handlers

  // 1. Auto-Summarize Call
  const handleSummarizeCall = async () => {
    if (calls.length === 0) return;

    setAiLoading(true);
    try {
      const lastCall = calls[0]; // Assuming the most recent call is the one to summarize
      const callNotes = notes.
      filter((n) => n.note_type === 'call_note' && new Date(n.created_date) > new Date(lastCall.call_start_time)).
      map((n) => n.content).
      join('\n');

      const summary = await summarizeCall(
        callNotes || "No notes available",
        lastCall.duration || 0,
        lastCall.status
      );

      setCallSummary(summary);
      setAiSuggestion(summary);
    } catch (error) {
      console.error("AI Summarize Error:", error);
    }
    setAiLoading(false);
  };

  // 2. Smart Note Suggestions
  const handleSmartNoteSuggestions = async () => {
    if (!caseData) return;

    setAiLoading(true);
    try {
      const suggestion = await suggestNotes(
        caseData.case_type,
        caseData.description || "",
        caseData.customer_name
      );

      setAiSuggestion({
        ...suggestion,
        summary: "Here's what you should document for this case:"
      });
    } catch (error) {
      console.error("AI Note Suggestion Error:", error);
    }
    setAiLoading(false);
  };

  // 3. Priority Detection
  const handleDetectPriority = async () => {
    if (!caseData) return;

    setAiLoading(true);
    try {
      const priority = await detectPriority(
        caseData.description || "",
        caseData.case_type,
        `${calls.length} previous calls, ${notes.length} notes`
      );

      setAiSuggestion({
        ...priority,
        summary: `AI recommends ${priority.priority.toUpperCase()} priority`
      });
    } catch (error) {
      console.error("AI Priority Detection Error:", error);
    }
    setAiLoading(false);
  };

  // 4. Generate Response
  const handleGenerateResponse = async () => {
    if (!caseData) return;

    setAiLoading(true);
    try {
      const response = await generateResponse(
        caseData.description || "Customer needs assistance",
        caseData.customer_name,
        caseData.case_type,
        "professional"
      );

      setSmsMessage(response.sms_version);
      setAiSuggestion({
        ...response,
        summary: "AI generated response template:"
      });
    } catch (error) {
      console.error("AI Response Generation Error:", error);
    }
    setAiLoading(false);
  };

  // 5. Quality Scoring
  const handleScoreQuality = async () => {
    if (notes.length === 0) return;

    setAiLoading(true);
    try {
      const allNotes = notes.map((n) => n.content).join('\n\n');
      const score = await scoreCallQuality(
        allNotes,
        allNotes,
        caseData.resolution || "In progress"
      );

      setQualityScore(score);
      setAiSuggestion({
        ...score,
        summary: `Quality Score: ${score.overall_score}/100`,
        key_points: score.strengths,
        action_items: score.improvements
      });
    } catch (error) {
      console.error("AI Quality Scoring Error:", error);
    }
    setAiLoading(false);
  };

  // 7. Compliance Check
  const handleCheckCompliance = async () => {
    if (!newNote.trim()) return;

    setAiLoading(true);
    try {
      const check = await checkCompliance(
        newNote,
        caseData?.case_type || "general",
        "insurance"
      );

      setComplianceCheck(check);
      setAiSuggestion({
        ...check,
        summary: check.compliant ?
        `✓ Compliant (Score: ${check.compliance_score}/100)` :
        `⚠ Compliance Issues Found (Score: ${check.compliance_score}/100)`,
        key_points: check.suggestions,
        action_items: check.missing_elements
      });
    } catch (error) {
      console.error("AI Compliance Check Error:", error);
    }
    setAiLoading(false);
  };

  const handleStartCall = () => {
    setIsOnCall(true);
    setCallDuration(0);
    setShowActiveCallPanel(true);
    setCallTranscriptEntries([]);

    const startTime = new Date();
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);

      // Simulate transcript entries for demo
      if (Math.random() > 0.95) {
        setCallTranscriptEntries((prev) => [...prev, {
          speaker: Math.random() > 0.5 ? 'Agent' : 'Customer',
          text: 'Sample transcript text...',
          timestamp: new Date().toISOString()
        }]);
      }
    }, 1000);
    setCallTimer(timer);

    createCallMutation.mutate(
      {
        case_id: caseId,
        customer_phone: phoneNumber,
        direction: 'outbound',
        call_start_time: startTime.toISOString(),
        status: 'in_progress', // Set status to in_progress initially
        recording_url: 'transcript_enabled' // Always record transcript
      },
      {
        onSuccess: (data) => {
          setCurrentCallId(data.id); // Store the ID of the newly created call
        }
      }
    );
  };

  const handleEndCall = async () => {
    clearInterval(callTimer);
    setIsOnCall(false);
    setIsOnHold(false); // Reset hold state
    setIsThreeWay(false); // Reset 3-way state
    setShowThreeWayInput(false); // Reset 3-way input visibility
    setShowActiveCallPanel(false); // Hide the active call panel
    setCallTranscriptEntries([]); // Clear transcript entries

    const endTime = new Date();
    if (currentCallId) {// Only update if there's an active call ID
      updateCallMutation.mutate({
        id: currentCallId,
        data: {
          duration: callDuration,
          call_end_time: endTime.toISOString(),
          status: 'completed'
          // recording_url remains 'transcript_enabled' from creation
        }
      });

      // Generate AI transcript and analysis for the completed call
      await generateCallTranscript(currentCallId);
    } else {
      console.warn("No active call to end.");
    }

    setCallDuration(0);
    setRecordTranscript(true); // Reset transcript recording state to auto-enabled
    setThirdPartyNumber("");
    setCurrentCallId(null); // Clear the current call ID after ending

    // Auto-trigger summary after call (this will use the latest 'calls' data which will include the just-ended call)
    setTimeout(() => handleSummarizeCall(), 1000);
  };

  const generateCallTranscript = async (callId) => {
    setAiLoading(true);
    try {
      // Gather ONLY call notes made during this specific call - NOT case description
      const currentCall = calls.find((c) => c.id === callId);
      const callNotesDuringCall = notes.
      filter((n) => n.note_type === 'call_note' && currentCall && new Date(n.created_date) >= new Date(currentCall.call_start_time) && new Date(n.created_date) <= new Date()).
      map((n) => n.content).
      join('\n\n');

      // ONLY analyze actual call notes, NOT the case description
      const prompt = `Analyze this call based ONLY on the notes taken during the call.
Do NOT infer or assume anything beyond what is explicitly stated in the call notes.

Call Duration: ${formatCallDuration(callDuration)}
Customer: ${caseData?.customer_name || 'N/A'}

Call notes taken during this call:
${callNotesDuringCall || 'No notes were taken during this call'}

Based ONLY on the above notes, provide:
1. A concise summary of what was actually discussed
2. Key points that were explicitly mentioned
3. Action items that were stated or agreed upon
4. Customer sentiment based on the call notes (positive/neutral/negative)
5. Compliance score (0-100) based on proper documentation
6. Quality score (0-100) based on professionalism and resolution

If no notes were taken, indicate that no transcript is available for analysis.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            action_items: { type: "array", items: { type: "string" } },
            sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
            compliance_score: { type: "number" },
            quality_score: { type: "number" }
          },
          required: ["summary", "key_points", "action_items", "sentiment", "compliance_score", "quality_score"]
        }
      });

      // Save transcript
      createTranscriptMutation.mutate({
        call_id: callId,
        case_id: caseId,
        transcript_text: callNotesDuringCall || "No notes were taken during this call.",
        ai_summary: response.summary,
        key_points: response.key_points,
        action_items: response.action_items,
        sentiment: response.sentiment,
        compliance_score: response.compliance_score,
        quality_score: response.quality_score,
        created_date: new Date().toISOString()
      });

      // Automatically create tasks from action items
      if (response.action_items && response.action_items.length > 0) {
        response.action_items.forEach((item) => {
          createTaskMutation.mutate({
            case_id: caseId,
            title: item,
            status: 'pending',
            priority: 'medium',
            assigned_to: user?.email,
            created_date: new Date().toISOString()
          });
        });
      }

      // Show AI summary in the AiAssistant panel
      setAiSuggestion({
        summary: `Call Analysis Complete - Quality: ${response.quality_score}/100`,
        key_points: response.key_points,
        action_items: response.action_items
      });
    } catch (error) {
      console.error("Error generating transcript:", error);
      setAiSuggestion({
        summary: "Error generating call analysis. Check console for details.",
        key_points: [],
        action_items: []
      });
    }
    setAiLoading(false);
  };

  const handleToggleHold = () => {
    const newHoldState = !isOnHold;
    setIsOnHold(newHoldState);

    createNoteMutation.mutate({
      case_id: caseId,
      content: newHoldState ?
      `Call placed on hold at ${format(new Date(), 'h:mm a')}` :
      `Call resumed from hold at ${format(new Date(), 'h:mm a')}`,
      note_type: 'call_note'
    });
  };

  const handleAddThirdParty = () => {
    if (!thirdPartyNumber.trim()) return;

    setIsThreeWay(true);
    setShowThreeWayInput(false);

    createNoteMutation.mutate({
      case_id: caseId,
      content: `3-way call initiated with ${thirdPartyNumber} at ${format(new Date(), 'h:mm a')}`,
      note_type: 'call_note'
    });
  };

  const handleSendSms = () => {
    if (!smsMessage.trim()) return;

    createSmsMutation.mutate({
      case_id: caseId,
      customer_phone: phoneNumber,
      message: smsMessage,
      direction: 'sent',
      status: 'sent',
      sent_at: new Date().toISOString()
    });
  };

  const handleQuickSend = (template) => {
    setSmsMessage(template.message);
    // Optionally auto-send after a small delay to show message in input briefly
    setTimeout(() => {
      createSmsMutation.mutate({
        case_id: caseId,
        customer_phone: phoneNumber,
        message: template.message,
        direction: 'sent',
        status: 'sent',
        sent_at: new Date().toISOString()
      });
      setSmsMessage(""); // Clear message after sending
    }, 100);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    // Check compliance before saving
    if (complianceCheck && !complianceCheck.compliant && complianceCheck.risk_level === 'high') {
      const confirmed = window.confirm("This note has compliance issues. Are you sure you want to save it?");
      if (!confirmed) return;
    }

    createNoteMutation.mutate({
      case_id: caseId,
      content: newNote,
      note_type: noteType
    });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    createTaskMutation.mutate({
      case_id: caseId,
      title: newTaskTitle,
      status: 'pending',
      priority: 'medium',
      assigned_to: user?.email
    });
  };

  const handleToggleTask = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const completedDate = newStatus === 'completed' ? new Date().toISOString() : null;

    updateTaskMutation.mutate({
      id: task.id,
      data: {
        status: newStatus,
        completed_date: completedDate
      }
    });
  };

  const deleteTask = (taskId) => {
    deleteTaskMutation.mutate(taskId);
  };

  const formatCallDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate employment status notifications
  const getEmploymentStatus = () => {
    if (!customer?.hire_date) return null;

    const hireDate = new Date(customer.hire_date);
    const today = new Date();
    const daysEmployed = differenceInDays(today, hireDate);

    // Placeholder logic - will be replaced with company policy calculations
    const notifications = [];

    if (daysEmployed >= 0 && daysEmployed <= 30) {
      notifications.push({ label: 'New Hire', color: '#10B981', days: 30 - daysEmployed, type: 'new_hire' });
    }

    // Placeholder for benefit eligibility (typically 60-90 days)
    if (daysEmployed >= 0 && daysEmployed < 90) {
      const daysUntilBenefits = 90 - daysEmployed;
      notifications.push({ label: `Benefits Eligible in ${daysUntilBenefits} days`, color: '#3B82F6', days: daysUntilBenefits, type: 'benefits_eligibility' });
    }

    if (daysEmployed >= 365) {
      notifications.push({ label: 'Annual Review Due', color: '#F59E0B', days: null, type: 'annual_review' });
    }

    return notifications;
  };

  const allActivity = [
  ...calls.map((c) => ({ ...c, type: 'call', timestamp: c.created_date })),
  ...smsMessages.map((s) => ({ ...s, type: 'sms', timestamp: s.created_date || s.sent_at })),
  ...notes.map((n) => ({ ...n, type: 'note', timestamp: n.created_date })),
  ...tasks.map((t) => ({ ...t, type: 'task', timestamp: t.created_date }))].
  sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (caseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.textSecondary }}></div>
          <p className="text-lg" style={{ color: colors.textSecondary }}>Loading case...</p>
        </div>
      </div>);

  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>Case not found</h2>
          <Link to={createPageUrl("Cases")}>
            <Button className="rounded-2xl border-0" style={{
              ...getButtonStyle('6px'), // Apply getButtonStyle
              color: colors.textSecondary
            }}>
              Back to Cases
            </Button>
          </Link>
        </div>
      </div>);

  }

  const employmentStatus = getEmploymentStatus();

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl("Cases")}>
            <Button
              variant="ghost"
              className="mb-4 rounded-2xl border-0"
              style={{
                ...getButtonStyle('4px'), // Apply getButtonStyle
                color: colors.textSecondary
              }}>

              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cases
            </Button>
          </Link>

          {/* Active Call Warning Banner */}
          {isOnCall &&
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(145deg, #10B981, #059669)',
              boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`
            }}>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  <span className="text-white font-semibold">
                    Call in Progress - {formatCallDuration(callDuration)}
                  </span>
                </div>
                <Button
                onClick={() => setShowActiveCallPanel(true)}
                className="rounded-xl h-8 px-4 border-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}>

                  Show Call Panel
                </Button>
              </div>
            </motion.div>
          }

          {/* Main Header Section */}
          <div className="mb-1 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <button
              onClick={() => setIsEditingCase(!isEditingCase)}
              className="rounded-xl h-8 px-4 text-xs border-0"
              style={{ ...getButtonStyle('3px'), color: colors.textSecondary }}
            >
              <Edit3 className="w-3 h-3 mr-1 inline" />
              {isEditingCase ? 'Cancel' : 'Edit Case Details'}
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link to={createPageUrl(`Customer?id=${caseData.customer_id}`)}>
                  <h1 className="text-3xl font-bold hover:underline cursor-pointer" style={{ color: colors.text }}>
                    {caseData.customer_name}
                  </h1>
                </Link>
                <Badge
                  className="border-0 text-xs px-3 py-1 rounded-full"
                  style={{
                    background: caseData.priority === 'urgent' ? colors.badgeUrgentBg :
                    caseData.priority === 'high' ? colors.badgeHighBg :
                    colors.badgeMediumBg,
                    color: caseData.priority === 'urgent' ? colors.badgeUrgentText :
                    caseData.priority === 'high' ? colors.badgeHighText : colors.badgeMediumText,
                    boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}`
                  }}>

                  {caseData.priority}
                </Badge>
                {qualityScore &&
                <Badge
                  className="border-0 text-xs px-3 py-1 rounded-full"
                  style={{
                    background: colors.badgeQualityBg,
                    color: colors.badgeQualityText,
                    boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}`
                  }}>

                    Quality: {qualityScore.overall_score}/100
                  </Badge>
                }
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {caseData.case_number} · {caseData.case_type}
                </p>
                {caseData.customer_id &&
                <Link to={createPageUrl(`Customer?id=${caseData.customer_id}`)}>
                    <span className="text-xs hover:underline" style={{ color: '#3B82F6' }}>
                      View Profile →
                    </span>
                  </Link>
                }
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Customer Selection Dropdown */}
              <Select
                value={caseData.customer_id || ''}
                onValueChange={(value) => {
                  const selectedCustomer = customers.find((c) => c.id === value);
                  updateCaseMutation.mutate({
                    id: caseId,
                    data: {
                      customer_id: value,
                      customer_name: selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : null,
                      customer_phone: selectedCustomer?.primary_phone || null,
                      customer_email: selectedCustomer?.primary_email || null
                    }
                  });
                }}>

                <SelectTrigger
                  className="rounded-2xl border-0 h-10 w-56"
                  style={{
                    ...getButtonStyle('4px'), // Apply getButtonStyle
                    color: colors.text
                  }}>

                  <SelectValue>
                    {customer ?
                    <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {customer.first_name} {customer.last_name}
                      </span> :

                    <span className="flex items-center gap-2" style={{ color: colors.textPlaceholder }}>
                        <UserPlus className="w-4 h-4" />
                        Select Customer...
                      </span>
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) =>
                  <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {c.first_name} {c.last_name} - {c.primary_phone}
                      </span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* Assigned To Dropdown */}
              <Select
                value={caseData.assigned_to || 'unassigned'}
                onValueChange={(value) => updateCaseMutation.mutate({
                  id: caseId,
                  data: { assigned_to: value === 'unassigned' ? null : value }
                })}>

                <SelectTrigger
                  className="rounded-2xl border-0 h-10 w-48"
                  style={{
                    ...getButtonStyle('4px'), // Apply getButtonStyle
                    color: colors.text
                  }}>

                  <SelectValue>
                    {caseData.assigned_to ?
                    <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {users.find((u) => u.email === caseData.assigned_to)?.full_name || caseData.assigned_to}
                      </span> :

                    <span className="flex items-center gap-2" style={{ color: colors.textPlaceholder }}>
                        <UserPlus className="w-4 h-4" />
                        Assign Agent...
                      </span>
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Unassigned
                    </span>
                  </SelectItem>
                  {users.map((user) =>
                  <SelectItem key={user.email} value={user.email}>
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {user.full_name || user.email}
                      </span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select
                value={caseData.status}
                onValueChange={(value) => updateCaseMutation.mutate({ id: caseId, data: { status: value } })}>

                <SelectTrigger
                  className="rounded-2xl border-0 h-10 w-40"
                  style={{
                    ...getButtonStyle('4px'), // Apply getButtonStyle
                    color: colors.text
                  }}>

                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Case Description Banner with Company Logo */}
          <div className="relative rounded-3xl overflow-hidden mb-6" style={{
            background: colors.bg,
            boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
          }}>
            {isEditingCase && (
              <div className="p-6 border-b" style={{ borderColor: colors.border }}>
                <div className="mb-4">
                  <label className="text-sm font-semibold mb-2 block" style={{ color: colors.text }}>
                    What is this call about?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['General Benefits', 'HSA/FSA', 'Medical', 'Dental', 'Vision', 'Life', 'Disability', 'Other'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className="px-4 py-2 rounded-xl text-sm border-0 transition-all"
                        style={selectedCategory === cat ? {
                          background: isDark ? '#3B82F6' : '#DBEAFE',
                          color: isDark ? '#ffffff' : '#1E40AF',
                          boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
                        } : {
                          background: isDark ? '#374151' : '#F3F4F6',
                          color: colors.textSecondary,
                          boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-semibold mb-2 block" style={{ color: colors.text }}>
                    Why did they call?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['General Questions', 'Enrollment Assistance', 'Claim Assistance', 'Document Submissions', 'Provider Search', 'Billing Inquiry', 'Authorization Request', 'Other'].map(reason => (
                      <button
                        key={reason}
                        onClick={() => setSelectedReason(reason)}
                        className="px-4 py-2 rounded-xl text-sm border-0 transition-all"
                        style={selectedReason === reason ? {
                          background: isDark ? '#8B5CF6' : '#EDE9FE',
                          color: isDark ? '#ffffff' : '#5B21B6',
                          boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
                        } : {
                          background: isDark ? '#4B5563' : '#E5E7EB',
                          color: colors.textSecondary,
                          boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`
                        }}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      updateCaseMutation.mutate({
                        id: caseId,
                        data: {
                          call_category: selectedCategory,
                          call_reason: selectedReason
                        }
                      });
                      setIsEditingCase(false);
                    }}
                    className="rounded-2xl h-10 px-6 border-0"
                    style={{ ...getButtonStyle('4px', '#10B981'), color: '#ffffff', fontWeight: '600' }}
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedCategory(caseData.call_category || null);
                      setSelectedReason(caseData.call_reason || null);
                      setIsEditingCase(false);
                    }}
                    className="rounded-2xl h-10 px-6 border-0"
                    style={{ ...getButtonStyle('4px'), color: colors.textSecondary }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 p-6">
              {/* Left: Company Logo */}
              <div className="flex items-center justify-center">
                {employer?.company_logo_url ? (
                  <img 
                    src={employer.company_logo_url} 
                    alt={employer.employer_name}
                    className="max-w-full max-h-24 object-contain"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center"
                    style={getInsetStyle('4px')}
                  >
                    <Building2 className="w-12 h-12" style={{ color: colors.textTertiary }} />
                  </div>
                )}
              </div>

              {/* Center: Case Description */}
              <div className="md:col-span-2 flex flex-col justify-center">
                {caseData.description && (
                  <>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                      Case Description
                    </h3>
                    <p className="text-lg leading-relaxed" style={{ color: colors.text }}>
                      {caseData.description}
                    </p>
                  </>
                )}
                
                {/* Employment Status Notifications */}
                {employmentStatus && employmentStatus.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {employmentStatus.map((status, idx) => (
                      <Badge
                        key={idx}
                        className="border-0 text-xs px-3 py-1 rounded-full"
                        style={{
                          background: status.color + '20',
                          color: status.color,
                          boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}`
                        }}
                      >
                        {status.label}
                      </Badge>
                    ))}
                  </div>
                )}
                </div>
                </div>

                {/* Selected Tags Display */}
                {(caseData.call_category || caseData.call_reason) && (
                <div className="px-6 pb-4 pt-2 border-t" style={{ borderColor: colors.border }}>
                <div className="flex flex-wrap gap-2">
                  {caseData.call_category && (
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: isDark ? '#1E3A8A' : '#DBEAFE',
                        color: isDark ? '#93C5FD' : '#1E40AF',
                        boxShadow: `2px 2px 4px ${colors.shadowDark}50`
                      }}
                    >
                      {caseData.call_category}
                    </span>
                  )}
                  {caseData.call_reason && (
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: isDark ? '#5B21B6' : '#EDE9FE',
                        color: isDark ? '#C4B5FD' : '#5B21B6',
                        boxShadow: `2px 2px 4px ${colors.shadowDark}50`
                      }}
                    >
                      {caseData.call_reason}
                    </span>
                  )}
                </div>
                </div>
                )}
                </div>
        </div>










        {/* AI Quick Actions Bar */}
        <Card
          className="border-0 mb-6"
          style={{
            background: colors.bg,
            boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
          }}>

          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: colors.text }}>
                <Sparkles className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                AI Tools:
              </span>
              <Button
                onClick={handleSummarizeCall}
                disabled={aiLoading || calls.length === 0}
                className="rounded-xl h-8 px-3 text-xs border-0 font-medium"
                style={{
                  ...getButtonStyle('3px'),
                  color: '#8B5CF6'
                }}>

                <Brain className="w-3 h-3 mr-1" />
                Summarize
              </Button>
              <Button
                onClick={handleDetectPriority}
                disabled={aiLoading}
                className="rounded-xl h-8 px-3 text-xs border-0 font-medium"
                style={{
                  ...getButtonStyle('3px'),
                  color: '#8B5CF6'
                }}>

                <Target className="w-3 h-3 mr-1" />
                Detect Priority
              </Button>
              <Button
                onClick={handleGenerateResponse}
                disabled={aiLoading}
                className="rounded-xl h-8 px-3 text-xs border-0 font-medium"
                style={{
                  ...getButtonStyle('3px'),
                  color: '#8B5CF6'
                }}>

                <Zap className="w-3 h-3 mr-1" />
                Generate Response
              </Button>
              <Button
                onClick={handleScoreQuality}
                disabled={aiLoading || notes.length === 0}
                className="rounded-xl h-8 px-3 text-xs border-0 font-medium"
                style={{
                  ...getButtonStyle('3px'),
                  color: '#8B5CF6'
                }}>

                <TrendingUp className="w-3 h-3 mr-1" />
                Score Quality
              </Button>
              <Button
                onClick={handleCheckCompliance}
                disabled={aiLoading || !newNote.trim()}
                className="rounded-xl h-8 px-3 text-xs border-0 font-medium"
                style={{
                  ...getButtonStyle('3px'),
                  color: '#8B5CF6'
                }}>

                <Shield className="w-3 h-3 mr-1" />
                Check Compliance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Removed AiAssistant component from here */}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Call Interface */}
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}>

              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                  <Phone className="w-5 h-5" />
                  Call Interface
                  {isThreeWay &&
                  <Badge
                    className="ml-2 border-0 text-xs px-3 py-1 rounded-full"
                    style={{
                      background: colors.badgeThreeWayBg,
                      color: colors.badgeThreeWayText,
                      boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}`
                    }}>

                      3-Way Call Active
                    </Badge>
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                    Phone Number
                  </label>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    disabled={isOnCall}
                    className="rounded-2xl border-0 h-12"
                    style={{ ...getInsetStyle('4px'), color: colors.text }} />

                </div>

                {isOnCall &&
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4">

                    {/* Call Status Display */}
                    <div className="text-center py-6">
                      <div
                      className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${isOnHold ? 'animate-pulse' : ''}`}
                      style={{
                        background: isOnHold ?
                        colors.callHoldBg // Orange for hold
                        : colors.callActiveBg, // Green for active
                        boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`
                      }}>

                        {isOnHold ?
                      <Pause className="w-12 h-12" style={{ color: colors.callHoldText }} /> // Pause icon for hold
                      :
                      <PhoneCall className="w-12 h-12" style={{ color: colors.callActiveText }} /> // PhoneCall for active
                      }
                      </div>
                      <p className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                        {formatCallDuration(callDuration)}
                      </p>
                      <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                        {isOnHold ? 'Call on hold...' : 'Call in progress...'}
                        {isThreeWay && <span className="ml-1">(3-Way)</span>}
                      </p>
                      {recordTranscript &&
                    <Badge
                      className="border-0 text-xs px-3 py-1 rounded-full inline-flex items-center"
                      style={{
                        background: colors.badgeRecordingBg, // Reddish for recording
                        color: colors.badgeRecordingText,
                        boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}`
                      }}>

                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                          Recording Transcript
                        </Badge>
                    }
                    </div>

                    {/* 3-Way Call Section */}
                    <AnimatePresence>
                      {showThreeWayInput && !isThreeWay &&
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2">

                          <label className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                            Add Third Party Number
                          </label>
                          <div className="flex gap-2">
                            <Input
                          value={thirdPartyNumber}
                          onChange={(e) => setThirdPartyNumber(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="rounded-2xl border-0 h-10"
                          style={{ ...getInsetStyle('3px'), color: colors.text }} />

                            <Button
                          onClick={handleAddThirdParty}
                          disabled={!thirdPartyNumber.trim()}
                          className="rounded-2xl h-10 px-4 border-0"
                          style={{ ...getButtonStyle('4px'), color: colors.textSecondary }}>

                              Add
                            </Button>
                          </div>
                        </motion.div>
                    }
                    </AnimatePresence>

                    {isThreeWay &&
                  <div className="p-3 rounded-2xl flex items-center justify-between" style={{
                    background: colors.badgeThreeWayBg,
                    boxShadow: `inset 2px 2px 4px ${colors.shadowDark}50, inset -2px -2px 4px ${colors.shadowLight}50`
                  }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.badgeThreeWayText }}>
                            3-Way Call Active
                          </p>
                          <p className="text-xs" style={{ color: colors.blue }}>
                            {thirdPartyNumber}
                          </p>
                        </div>
                        <Users className="w-5 h-5" style={{ color: colors.blue }} />
                      </div>
                  }

                    {/* Call Control Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Hold Button */}
                      <Button
                      onClick={handleToggleHold}
                      className="rounded-2xl h-12 border-0 flex-col gap-1"
                      style={isOnHold ?
                      { ...getInsetStyle('4px', '#F59E0B'), color: '#ffffff', fontWeight: '600' } :
                      { ...getButtonStyle('4px'), color: colors.text, fontWeight: '600' }
                      }>

                        <Pause className="w-5 h-5" />
                        <span className="text-xs">{isOnHold ? 'Resume' : 'Hold'}</span>
                      </Button>

                      {/* 3-Way Call Button */}
                      <Button
                      onClick={() => setShowThreeWayInput((prev) => !prev)}
                      disabled={isThreeWay}
                      className="rounded-2xl h-12 border-0 flex-col gap-1"
                      style={isThreeWay || showThreeWayInput ?
                      { ...getInsetStyle('4px', '#3B82F6'), color: '#ffffff', fontWeight: '600' } :
                      { ...getButtonStyle('4px'), color: colors.text, fontWeight: '600' }
                      }>

                        <Users className="w-5 h-5" />
                        <span className="text-xs">3-Way</span>
                      </Button>

                      {/* End Call Button */}
                      <Button
                      onClick={handleEndCall}
                      className="rounded-2xl h-12 border-0 flex-col gap-1"
                      style={{
                        ...getButtonStyle('4px', '#EF4444'),
                        color: '#ffffff',
                        fontWeight: '600'
                      }}>

                        <PhoneOff className="w-5 h-5" />
                        <span className="text-xs">End Call</span>
                      </Button>
                    </div>
                  </motion.div>
                }

                {!isOnCall &&
                <div className="flex gap-3">
                    <Button
                    onClick={handleStartCall}
                    disabled={!phoneNumber}
                    className="flex-1 rounded-2xl h-12 border-0 font-semibold"
                    style={customer?.is_vip ? {
                      ...getButtonStyle('6px'),
                      backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa7c4cb70fe91d38015eba/381316158_image.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      color: '#000000',
                      fontWeight: '700',
                      border: '3px solid #D97706'
                    } : {
                      ...getButtonStyle('6px', '#10B981'),
                      color: '#ffffff',
                      fontWeight: '600'
                    }}>

                      <PhoneCall className="w-5 h-5 mr-2" />
                      {customer?.is_vip ? <span>✨ Start VIP Call</span> : 'Start Call'}
                    </Button>
                  </div>
                }
              </CardContent>
            </Card>

            {/* SMS Interface */}
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}>

              <CardHeader>
                <CardTitle className="flex items-center justify-between" style={{ color: colors.text }}>
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    SMS Messages
                  </span>
                  <Button
                    onClick={handleGenerateResponse}
                    disabled={aiLoading}
                    className="rounded-xl h-8 px-3 text-xs border-0"
                    style={{ ...getButtonStyle('3px'), color: '#8B5CF6' }}>

                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generate
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="mb-4 max-h-64 overflow-y-auto space-y-2 p-4 rounded-2xl"
                  style={getInsetStyle('4px')}>

                  {smsMessages.length === 0 ?
                  <p className="text-center text-sm" style={{ color: colors.textSecondary }}>
                      No messages yet
                    </p> :

                  smsMessages.map((sms) =>
                  <motion.div
                    key={sms.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-2xl max-w-[80%] ${
                    sms.direction === 'sent' ? 'ml-auto' : 'mr-auto'}`
                    }
                    style={{
                      background: sms.direction === 'sent' ?
                      isDark ? '#3B82F6' : '#2563EB' :
                      isDark ? '#374151' : '#F3F4F6',
                      boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`,
                      color: sms.direction === 'sent' ? '#ffffff' : colors.text
                    }}>

                        <p className="text-sm mb-1">
                          {sms.message}
                        </p>
                        <p className="text-xs opacity-70">
                          {format(new Date(sms.created_date), 'h:mm a')}
                        </p>
                      </motion.div>
                  )
                  }
                </div>

                {/* Quick Send Templates */}
                {textTemplates.length > 0 &&
                <div className="mb-4">
                    <p className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                      Quick Send:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {textTemplates.map((template) =>
                    <Button
                      key={template.id}
                      onClick={() => handleQuickSend(template)}
                      className="rounded-xl h-8 px-3 text-xs border-0"
                      style={{ ...getButtonStyle('3px'), color: colors.textSecondary }}>

                          {template.label}
                        </Button>
                    )}
                    </div>
                  </div>
                }

                <div className="flex gap-2">
                  <Input
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSendSms()}
                    className="rounded-2xl border-0 h-12"
                    style={{
                      ...getInsetStyle('4px'),
                      color: colors.text
                    }} />

                  <Button
                    onClick={handleSendSms}
                    disabled={!smsMessage.trim()}
                    className="rounded-2xl h-12 px-6 border-0"
                    style={{ ...getButtonStyle('6px'), color: colors.textSecondary }}>

                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Call Transcripts */}
            {callTranscripts.length > 0 &&
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}>

                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                    <Brain className="w-5 h-5" />
                    Call Analysis & Transcripts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {callTranscripts.map((transcript, index) =>
                  <motion.div
                    key={transcript.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-2xl"
                    style={{ ...getButtonStyle('4px') }}>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge
                          className="border-0 text-xs px-2 py-0.5"
                          style={{
                            background: transcript.sentiment === 'positive' ?
                            isDark ? 'linear-gradient(145deg, #1c2b29, #0c1817)' : 'linear-gradient(145deg, #dcfce7, #bbf7d0)' :
                            transcript.sentiment === 'negative' ?
                            isDark ? 'linear-gradient(145deg, #2e1d1d, #1a0f0f)' : 'linear-gradient(145deg, #fecaca, #fca5a5)' :
                            isDark ? 'linear-gradient(145deg, #1e293b, #0f172a)' : 'linear-gradient(145deg, #e0f2fe, #bae6fd)',
                            color: transcript.sentiment === 'positive' ?
                            isDark ? '#6ee7b7' : '#065f46' :
                            transcript.sentiment === 'negative' ?
                            isDark ? '#f87171' : '#991b1b' :
                            isDark ? '#93c5fd' : '#075985',
                            boxShadow: `2px 2px 4px ${colors.shadowDark}`
                          }}>

                              {transcript.sentiment}
                            </Badge>
                            <Badge
                          className="border-0 text-xs px-2 py-0.5"
                          style={{
                            background: colors.badgeQualityBg,
                            color: colors.badgeQualityText,
                            boxShadow: `2px 2px 4px ${colors.shadowDark}`
                          }}>

                              Quality: {transcript.quality_score}/100
                            </Badge>
                            <Badge
                          className="border-0 text-xs px-2 py-0.5"
                          style={{
                            background: colors.badgeComplianceOkBg,
                            color: colors.badgeComplianceOkText,
                            boxShadow: `2px 2px 4px ${colors.shadowDark}`
                          }}>

                              Compliance: {transcript.compliance_score}/100
                            </Badge>
                          </div>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>
                            {format(new Date(transcript.created_date), 'MMM d, h:mm a')}
                          </p>
                        </div>

                        <p className="text-sm mb-3" style={{ color: colors.text }}>
                          <strong>Summary:</strong> {transcript.ai_summary}
                        </p>

                        {transcript.key_points && transcript.key_points.length > 0 &&
                    <div className="mb-3">
                            <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                              Key Points:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              {transcript.key_points.map((point, i) =>
                        <li key={i} className="text-xs" style={{ color: colors.textSecondary }}>
                                  {point}
                                </li>
                        )}
                            </ul>
                          </div>
                    }

                        {transcript.action_items && transcript.action_items.length > 0 &&
                    <div>
                            <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                              Action Items:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              {transcript.action_items.map((item, i) =>
                        <li key={i} className="text-xs" style={{ color: colors.textSecondary }}>
                                  {item}
                                </li>
                        )}
                            </ul>
                          </div>
                    }
                      </motion.div>
                  )}
                  </div>
                </CardContent>
              </Card>
            }

            {/* Call Log */}
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}>

              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                  <Phone className="w-5 h-5" />
                  Call Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {calls.length === 0 ?
                  <p className="text-center text-sm py-8" style={{ color: colors.textSecondary }}>
                      No calls yet
                    </p> :

                  calls.map((call, index) =>
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-2xl"
                    style={{ ...getButtonStyle('4px') }}>

                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: call.direction === 'inbound' ?
                            isDark ? 'linear-gradient(145deg, #1f2937, #111827)' : 'linear-gradient(145deg, #dbeafe, #bfdbfe)' :
                            isDark ? 'linear-gradient(145deg, #1c2b29, #0c1817)' : 'linear-gradient(145deg, #dcfce7, #bbf7d0)',
                            boxShadow: `inset 3px 3px 6px ${colors.shadowDark}50`
                          }}>

                              <Phone
                            className="w-5 h-5"
                            style={{ color: call.direction === 'inbound' ? isDark ? '#93c5fd' : '#3b82f6' : isDark ? '#6ee7b7' : '#10b981' }} />

                            </div>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: colors.text }}>
                                {call.direction === 'inbound' ? 'Incoming' : 'Outgoing'} Call
                              </p>
                              <p className="text-xs" style={{ color: colors.textSecondary }}>
                                {call.customer_phone}
                              </p>
                            </div>
                          </div>
                          <Badge
                        className="border-0 text-xs px-2 py-0.5"
                        style={{
                          background: call.status === 'completed' ?
                          isDark ? 'linear-gradient(145deg, #1c2b29, #0c1817)' : 'linear-gradient(145deg, #dcfce7, #bbf7d0)' :
                          isDark ? 'linear-gradient(145deg, #2e1d1d, #1a0f0f)' : 'linear-gradient(145deg, #fecaca, #fca5a5)',
                          color: call.status === 'completed' ? isDark ? '#6ee7b7' : '#065f46' : isDark ? '#f87171' : '#991b1b',
                          boxShadow: `2px 2px 4px ${colors.shadowDark}`
                        }}>

                            {call.status}
                          </Badge>
                        </div>
                        {call.duration &&
                    <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                            Duration: {formatCallDuration(call.duration)}
                            {call.recording_url === 'transcript_enabled' &&
                      <span className="ml-2 font-semibold" style={{ color: colors.red }}>(Transcript Recorded)</span>
                      }
                          </p>
                    }
                        {call.recording_url === 'transcript_enabled' &&
                    <Badge
                      className="border-0 text-xs px-2 py-0.5"
                      style={{
                        background: isDark ? 'linear-gradient(145deg, #2e1d1d, #1a0f0f)' : 'linear-gradient(145deg, #fee2e2, #fecaca)',
                        color: isDark ? '#f87171' : '#991b1b',
                        boxShadow: `2px 2px 4px ${colors.shadowDark}`
                      }}>

                            Transcript Recorded
                          </Badge>
                    }
                        <p className="text-xs mt-2" style={{ color: colors.textPlaceholder }}>
                          {format(new Date(call.created_date), 'MMM d, h:mm a')}
                        </p>
                      </motion.div>
                  )
                  }
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}>

              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                  <Activity className="w-5 h-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto"> {/* Added max-height and overflow */}
                  {allActivity.length === 0 ?
                  <p className="text-center text-sm py-8" style={{ color: colors.textPlaceholder }}>
                      No activity yet
                    </p> :

                  allActivity.map((activity, index) =>
                  <motion.div
                    key={`${activity.type}-${activity.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4">

                        <div className="flex flex-col items-center">
                          <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ ...getButtonStyle('3px') }}>

                            {activity.type === 'call' && <Phone className="w-5 h-5" style={{ color: colors.textSecondary }} />}
                            {activity.type === 'sms' && <MessageSquare className="w-5 h-5" style={{ color: colors.textSecondary }} />}
                            {activity.type === 'note' && <FileText className="w-5 h-5" style={{ color: colors.textSecondary }} />}
                            {activity.type === 'task' && <CheckCircle2 className="w-5 h-5" style={{ color: colors.textSecondary }} />}
                          </div>
                          {index < allActivity.length - 1 &&
                      <div className="w-0.5 flex-1 mt-2" style={{ background: colors.timelineConnector }} />
                      }
                        </div>
                        <div
                      className="flex-1 p-4 rounded-2xl"
                      style={{ ...getButtonStyle('4px') }}>

                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium" style={{ color: colors.text }}>
                              {activity.type === 'call' && `${activity.direction === 'inbound' ? 'Incoming' : 'Outgoing'} Call`}
                              {activity.type === 'sms' && `SMS ${activity.direction === 'sent' ? 'Sent' : 'Received'}`}
                              {activity.type === 'note' && `Note Added`}
                              {activity.type === 'task' && `Task: ${activity.title}`}
                            </p>
                            <span className="text-xs" style={{ color: colors.textPlaceholder }}>
                              {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          {activity.type === 'call' && activity.duration &&
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                              Duration: {formatCallDuration(activity.duration)}
                              {activity.recording_url === 'transcript_enabled' &&
                        <span className="ml-2 font-semibold" style={{ color: colors.red }}>(Transcript Recorded)</span>
                        }
                            </p>
                      }
                          {activity.type === 'sms' &&
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                              {activity.message}
                            </p>
                      }
                          {activity.type === 'note' &&
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                              {activity.content}
                            </p>
                      }
                          {activity.type === 'task' &&
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                              Status: {activity.status}
                            </p>
                      }
                        </div>
                      </motion.div>
                  )
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
              }}>

              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                  <User className="w-5 h-5" />
                  Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {caseData.customer_phone &&
                <div className="flex items-center gap-3">
                    <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ ...getButtonStyle('3px') }} // Apply getButtonStyle
                  >
                      <Phone className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: colors.textPlaceholder }}>Phone</p>
                      <a
                      href={`tel:${caseData.customer_phone}`}
                      className="font-medium hover:underline"
                      style={{ color: colors.blue }}>

                        {caseData.customer_phone}
                      </a>
                    </div>
                  </div>
                }
                {caseData.customer_email &&
                <div className="flex items-center gap-3">
                    <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ ...getButtonStyle('3px') }} // Apply getButtonStyle
                  >
                      <Mail className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ color: colors.textPlaceholder }}>Email</p>
                      <a
                      href={`mailto:${caseData.customer_email}`}
                      className="font-medium truncate hover:underline block"
                      style={{ color: colors.blue }}>

                        {caseData.customer_email}
                      </a>
                    </div>
                  </div>
                }
                {caseData.policy_number &&
                <div className="flex items-center gap-3">
                    <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ ...getButtonStyle('3px') }} // Apply getButtonStyle
                  >
                      <FileText className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: colors.textPlaceholder }}>Policy</p>
                      <p className="font-medium" style={{ color: colors.text }}>
                        {caseData.policy_number}
                      </p>
                    </div>
                  </div>
                }
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ ...getButtonStyle('3px') }} // Apply getButtonStyle
                  >
                    <Calendar className="w-5 h-5" style={{ color: colors.textSecondary }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.textPlaceholder }}>Created</p>
                    <p className="font-medium" style={{ color: colors.text }}>
                      {format(new Date(caseData.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Follow Ups */}
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
              }}>

              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                  <Clock className="w-5 h-5" />
                  Follow Ups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[200px] overflow-y-auto"> {/* Added max-height and overflow */}
                  {notes.filter((note) => note.note_type === 'follow_up').length === 0 ?
                  <p className="text-sm text-center py-4" style={{ color: colors.textPlaceholder }}>
                      No follow-up notes yet
                    </p> :

                  notes.filter((note) => note.note_type === 'follow_up').map((note) =>
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-2xl"
                    style={{ ...getButtonStyle('3px') }} // Apply getButtonStyle
                  >
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                        className="border-0 text-xs px-2 py-0.5"
                        style={{
                          background: colors.badgeFollowUpBg || colors.badgeGeneralBg, // Use a specific color or default
                          color: colors.textSecondary
                        }}>

                            Follow Up
                          </Badge>
                          <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteNoteMutation.mutate(note.id)}>

                            <Trash2 className="w-3 h-3" style={{ color: colors.red }} />
                          </Button>
                        </div>
                        <p className="text-sm mb-1" style={{ color: colors.text }}>
                          {note.content}
                        </p>
                        <p className="text-xs" style={{ color: colors.textPlaceholder }}>
                          {format(new Date(note.created_date), 'MMM d, h:mm a')}
                        </p>
                      </motion.div>
                  )
                  }
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
              }}>

              <CardHeader>
                <CardTitle className="flex items-center justify-between" style={{ color: colors.text }}>
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Notes
                  </span>
                  <Button
                    onClick={handleSmartNoteSuggestions}
                    disabled={aiLoading}
                    className="rounded-xl h-7 px-2 text-xs border-0"
                    style={{ ...getButtonStyle('2px'), color: '#8B5CF6' }}>

                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Suggest
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto"> {/* Added max-height and overflow */}
                  {notes.filter((note) => note.note_type !== 'follow_up').length === 0 ? // Filter out follow-ups here
                  <p className="text-sm text-center py-4" style={{ color: colors.textPlaceholder }}>
                      No general notes yet
                    </p> :

                  notes.filter((note) => note.note_type !== 'follow_up').map((note) => // Filter out follow-ups here
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-2xl"
                    style={{ ...getButtonStyle('4px') }} // Apply getButtonStyle
                  >
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                        className="border-0 text-xs px-2 py-0.5"
                        style={{
                          background: colors.badgeGeneralBg,
                          color: colors.textSecondary
                        }}>

                            {note.note_type}
                          </Badge>
                          <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteNoteMutation.mutate(note.id)}>

                            <Trash2 className="w-3 h-3" style={{ color: colors.red }} />
                          </Button>
                        </div>
                        <p className="text-sm mb-1" style={{ color: colors.text }}>
                          {note.content}
                        </p>
                        <p className="text-xs" style={{ color: colors.textPlaceholder }}>
                          {format(new Date(note.created_date), 'MMM d, h:mm a')}
                        </p>
                      </motion.div>
                  )
                  }
                </div>

                {complianceCheck &&
                <div
                  className="p-3 rounded-xl mb-3 text-xs"
                  style={{
                    background: complianceCheck.compliant ?
                    colors.badgeComplianceOkBg :
                    colors.badgeComplianceIssueBg,
                    color: complianceCheck.compliant ? colors.badgeComplianceOkText : colors.badgeComplianceIssueText,
                    boxShadow: `inset 2px 2px 4px ${colors.shadowDark}50`
                  }}>

                    {complianceCheck.compliant ?
                  <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Compliant ({complianceCheck.compliance_score}/100)
                      </span> :

                  <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {complianceCheck.issues?.length || 0} Compliance Issues
                      </span>
                  }
                  </div>
                }

                <div className="space-y-2">
                  <Select
                    value={noteType}
                    onValueChange={setNoteType}>

                    <SelectTrigger
                      className="rounded-2xl border-0 h-10"
                      style={{ ...getInsetStyle('3px'), color: colors.text }}>

                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="call_note">Call Note</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="rounded-2xl border-0 min-h-20"
                    style={{ ...getInsetStyle('4px'), color: colors.text }} />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCheckCompliance}
                      disabled={!newNote.trim() || aiLoading}
                      className="rounded-2xl h-10 px-4 border-0"
                      style={{ ...getButtonStyle('4px'), color: colors.red }}>

                      <Shield className="w-4 h-4 mr-2" />
                      Check
                    </Button>
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="flex-1 rounded-2xl h-10 border-0"
                      style={{ ...getButtonStyle('4px'), color: colors.textSecondary }}>

                      <Plus className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
              }}>

              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                  <CheckCircle2 className="w-5 h-5" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto"> {/* Added max-height and overflow */}
                  {tasks.length === 0 ?
                  <p className="text-sm text-center py-4" style={{ color: colors.textPlaceholder }}>
                      No tasks yet
                    </p> :

                  tasks.map((task) =>
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ ...getButtonStyle('3px') }} // Apply getButtonStyle
                  >
                        <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleToggleTask(task)}>

                          {task.status === 'completed' ?
                      <CheckSquare className="w-5 h-5" style={{ color: colors.green }} /> :

                      <Square className="w-5 h-5" style={{ color: colors.textPlaceholder }} />
                      }
                        </Button>
                        <div className="flex-1">
                          <p
                        className={`text-sm ${task.status === 'completed' ? 'line-through' : ''}`}
                        style={{ color: task.status === 'completed' ? colors.textPlaceholder : colors.text }}>

                            {task.title}
                          </p>
                        </div>
                        <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteTask(task.id)}>

                          <Trash2 className="w-3 h-3" style={{ color: colors.red }} />
                        </Button>
                      </motion.div>
                  )
                  }
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="New task..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    className="rounded-2xl border-0 h-10"
                    style={{ ...getInsetStyle('3px'), color: colors.text }} />

                  <Button
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    className="rounded-2xl h-10 px-4 border-0"
                    style={{ ...getButtonStyle('4px'), color: colors.textSecondary }}>

                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Suggestions Orb - Floating Button */}
      <AISuggestionsOrb
        suggestion={aiSuggestion}
        isLoading={aiLoading}
        onAccept={(suggestion) => {
          if (suggestion.priority) {
            updateCaseMutation.mutate({
              id: caseId,
              data: { priority: suggestion.priority }
            });
          }
          setAiSuggestion(null);
        }}
        onDismiss={() => setAiSuggestion(null)}
        type={
        callSummary ? "summary" :
        qualityScore ? "quality" :
        complianceCheck ? "compliance" :
        "suggestion"
        } />


      {/* Active Call Panel */}
      <ActiveCallPanel
        isVisible={showActiveCallPanel}
        callDuration={callDuration}
        phoneNumber={phoneNumber}
        customerName={caseData.customer_name}
        isOnHold={isOnHold}
        isThreeWay={isThreeWay}
        thirdPartyNumber={thirdPartyNumber}
        transcript={callTranscriptEntries}
        isVIP={customer?.is_vip}
        onToggleHold={handleToggleHold}
        onEndCall={handleEndCall}
        onMinimize={() => setShowActiveCallPanel(false)} />

    </div>);

}