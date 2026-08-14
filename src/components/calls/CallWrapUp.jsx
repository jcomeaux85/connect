import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Check, Sparkles, FileText, Link2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import {
  CATEGORIES, QUALIFIERS, AUTO_SELECT,
  RESOLUTIONS, PRIORITIES, SENTIMENTS,
} from "./callClassification";

// ─────────────────────────────────────────────────────────────────────────────
// CallWrapUp — AI-driven two-panel classification wrap-up screen.
// No dropdowns. Everything is clickable neumorphic tiles.
// Panel 1 = Category, Panel 2 = Qualifier. Auto-select rules link them.
// AI analyzes the transcript and pre-suggests tiles (glowing borders).
// Accessible during the call via the ActiveCallBar "Wrap-Up" button.
// ─────────────────────────────────────────────────────────────────────────────

export default function CallWrapUp({ isOpen, onClose, callData, user }) {
  const { colors, getButtonStyle } = useTheme();

  // ── Form state ──
  const [category, setCategory] = useState(null);
  const [qualifier, setQualifier] = useState(null);
  const [resolution, setResolution] = useState(null);
  const [priority, setPriority] = useState("Normal");
  const [sentimentStart, setSentimentStart] = useState(null);
  const [sentimentEnd, setSentimentEnd] = useState(null);
  const [notes, setNotes] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [followUp, setFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");

  // ── AI state ──
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null); // { category, qualifier, notes, sentiment }
  const [aiApplied, setAiApplied] = useState(false);

  // ── Timer ──
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionSecs, setSubmissionSecs] = useState(null);

  // ── Recent cases for this caller ──
  const customerId = callData?.customer_id || callData?.customerId;
  const { data: recentCases = [] } = useQuery({
    queryKey: ["wrapup-recent-cases", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const cases = await base44.entities.Case.filter(
        { customer_id: customerId },
        "-created_date",
        5
      );
      return cases;
    },
    enabled: !!isOpen && !!customerId,
  });

  // ── Reset on open ──
  useEffect(() => {
    if (isOpen) {
      startRef.current = Date.now();
      setElapsed(0);
      setSubmitted(false);
      setCategory(null);
      setQualifier(null);
      setResolution(null);
      setPriority("Normal");
      setSentimentStart(null);
      setSentimentEnd(null);
      setNotes(callData?.call_notes || "");
      setSelectedCaseId(callData?.case_id || null);
      setFollowUp(false);
      setFollowUpDate("");
      setAiSuggestion(null);
      setAiApplied(false);
    }
  }, [isOpen]);

  // ── Timer ──
  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Auto-select logic: clicking a qualifier auto-sets the category ──
  const handleQualifierClick = useCallback((qId) => {
    setQualifier((prev) => (prev === qId ? null : qId));
    // Auto-select category if not already set
    if (AUTO_SELECT[qId]) {
      setCategory((prevCat) => prevCat || AUTO_SELECT[qId]);
    }
  }, []);

  // ── AI analysis from transcript ──
  const runAiAnalysis = useCallback(async () => {
    if (!callData?.transcript && !notes) return;
    setAiSuggesting(true);
    try {
      const transcriptText = callData?.transcript || notes;
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this call transcript and classify it for a benefits call center wrap-up.

Transcript:
${transcriptText}

Return a JSON object with:
- category: one of ${CATEGORIES.map((c) => c.id).join(", ")}
- qualifier: one of ${QUALIFIERS.map((q) => q.id).join(", ")}
- sentiment: one of frustrated, confused, neutral, satisfied, happy
- notes: a concise 2-3 sentence summary of the call

Choose the category and qualifier that best fit the call content.`,
        response_json_schema: {
          type: "object",
          properties: {
            category: { type: "string" },
            qualifier: { type: "string" },
            sentiment: { type: "string" },
            notes: { type: "string" },
          },
          required: ["category", "qualifier", "sentiment", "notes"],
        },
      });
      setAiSuggestion(response);
    } catch (e) {
      console.error("AI analysis failed:", e);
    }
    setAiSuggesting(false);
  }, [callData, notes]);

  // Auto-run AI analysis when transcript is available
  useEffect(() => {
    if (isOpen && (callData?.transcript || callData?.call_notes) && !aiSuggestion && !aiApplied) {
      const timer = setTimeout(() => runAiAnalysis(), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, callData, aiSuggestion, aiApplied, runAiAnalysis]);

  // ── Apply AI suggestion ──
  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setCategory(aiSuggestion.category);
    setQualifier(aiSuggestion.qualifier);
    setSentimentEnd(aiSuggestion.sentiment);
    if (!notes) setNotes(aiSuggestion.notes);
    setAiApplied(true);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!category || !qualifier || !resolution) return;
    setSaving(true);
    const secs = Math.floor((Date.now() - startRef.current) / 1000);

    // Create CallDisposition record
    await base44.entities.CallDisposition.create({
      case_id: selectedCaseId || callData?.case_id || "",
      user_email: user?.email || "",
      client_company: callData?.client_company || "",
      caller_name: callData?.name || callData?.caller_name || "",
      call_type: callData?.direction === "inbound" ? "Inbound" : "Outbound",
      is_vip: !!(callData?.is_vip || callData?.isVip),
      benefit_area: category,
      service_reason: qualifier,
      call_category: category,
      call_qualifier: qualifier,
      resolution_status: resolution,
      task_priority: priority,
      follow_up_required: followUp,
      follow_up_date: followUpDate || "",
      sentiment_start: sentimentStart || "",
      sentiment_end: sentimentEnd || "",
      call_notes: notes,
      completion_time_seconds: secs,
      submitted_at: new Date().toISOString(),
    });

    // Update the Call record with classification + customer link
    if (callData?.callId || callData?.id) {
      await base44.entities.Call.update(callData.callId || callData.id, {
        call_category: category,
        call_qualifier: qualifier,
        notes: notes,
        status: "completed",
        case_id: selectedCaseId || callData?.case_id || "",
        customer_id: customerId || "",
      });
    }

    setSubmissionSecs(secs);
    setSubmitted(true);
    setSaving(false);
  };

  if (!isOpen) return null;

  // ── Tile component ──
  const Tile = ({ active, onClick, label, icon, color, suggested, disabled }) => {
    const [hover, setHover] = useState(false);
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 12px",
          borderRadius: "12px",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "12px",
          fontWeight: active ? "700" : "500",
          opacity: disabled ? 0.4 : 1,
          transition: "all 0.15s ease",
          background: active ? `${color || colors.text}15` : colors.bg,
          color: active ? color || colors.text : colors.textSecondary,
          boxShadow: active
            ? `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
            : suggested
            ? `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}, 0 0 0 2px #8B5CF6`
            : hover
            ? `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}`
            : `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`,
        }}
      >
        {icon && <span style={{ fontSize: "14px" }}>{icon}</span>}
        <span>{label}</span>
        {suggested && !active && (
          <Sparkles style={{ width: "11px", height: "11px", color: "#8B5CF6", marginLeft: "2px" }} />
        )}
      </button>
    );
  };

  // ── Confirmation screen ──
  if (submitted) {
    const cat = CATEGORIES.find((c) => c.id === category);
    const qual = QUALIFIERS.find((q) => q.id === qualifier);
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: `${colors.bg}f0`, backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: colors.bg, borderRadius: "24px", padding: "40px", maxWidth: "460px", width: "100%", textAlign: "center", boxShadow: `20px 20px 40px ${colors.shadowDark}, -20px -20px 40px ${colors.shadowLight}` }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(145deg,#10B981,#059669)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(16,185,129,0.4)" }}>
            <Check style={{ width: "32px", height: "32px", color: "#fff" }} />
          </div>
          <h2 style={{ color: colors.text, fontSize: "22px", fontWeight: "700", margin: "0 0 8px" }}>Wrap-Up Submitted!</h2>
          <p style={{ color: colors.textSecondary, marginBottom: "20px", fontSize: "14px" }}>
            Completed in <strong style={{ color: colors.text }}>{fmt(submissionSecs)}</strong>
            {submissionSecs <= 60 && <span style={{ color: "#10B981", fontWeight: "600" }}> ⚡ Under 60s!</span>}
          </p>
          <div style={{ background: colors.bg, boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`, borderRadius: "16px", padding: "16px", marginBottom: "24px", textAlign: "left" }}>
            <div style={{ color: colors.textTertiary, fontSize: "10px", fontWeight: "600", textTransform: "uppercase", marginBottom: "10px", letterSpacing: "0.05em" }}>Summary</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "13px" }}>
              <span style={{ color: colors.textSecondary, minWidth: "80px" }}>Category:</span>
              <span style={{ color: cat?.color || colors.text, fontWeight: "600" }}>{cat?.icon} {cat?.label}</span>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "13px" }}>
              <span style={{ color: colors.textSecondary, minWidth: "80px" }}>Qualifier:</span>
              <span style={{ color: colors.text, fontWeight: "600" }}>{qual?.icon} {qual?.label}</span>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "13px" }}>
              <span style={{ color: colors.textSecondary, minWidth: "80px" }}>Resolution:</span>
              <span style={{ color: colors.text, fontWeight: "600" }}>{RESOLUTIONS.find((r) => r.id === resolution)?.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: "100%", height: "44px", borderRadius: "14px", border: "none", cursor: "pointer", background: "linear-gradient(145deg,#3B82F6,#2563EB)", color: "#fff", fontWeight: "700", fontSize: "15px", boxShadow: "0 4px 12px rgba(59,130,246,0.4)" }}>Done</button>
        </motion.div>
      </div>
    );
  }

  const requireds = [category, qualifier, resolution];
  const progress = Math.min(100, Math.round((requireds.filter(Boolean).length / 3) * 60 + (priority ? 10 : 0) + (sentimentEnd ? 10 : 0) + (notes ? 20 : 0)));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: `${colors.bg}f0`, backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "16px" }}>
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        style={{ background: colors.bg, borderRadius: "24px", width: "100%", maxWidth: "820px", marginBottom: "20px", boxShadow: `16px 16px 32px ${colors.shadowDark}, -16px -16px 32px ${colors.shadowLight}` }}
      >
        {/* ── Sticky Header ── */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: colors.bg, borderRadius: "24px 24px 0 0", padding: "14px 20px 12px", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div>
              <h2 style={{ color: colors.text, fontWeight: "700", fontSize: "15px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles style={{ width: "16px", height: "16px", color: "#8B5CF6" }} />
                Call Wrap-Up
              </h2>
              {callData?.name && <p style={{ color: colors.textSecondary, fontSize: "12px", margin: "2px 0 0" }}>{callData.name}{callData?.phone ? ` · ${callData.phone}` : ""}</p>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "700", fontSize: "14px", color: elapsed > 60 ? "#EF4444" : elapsed > 45 ? "#F59E0B" : "#10B981" }}>
                <Clock style={{ width: "14px", height: "14px" }} />
                {fmt(elapsed)}
              </span>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textTertiary, padding: "2px", display: "flex" }}>
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: colors.bg, boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`, overflow: "hidden" }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} style={{ height: "100%", borderRadius: "3px", background: progress >= 80 ? "#10B981" : progress >= 50 ? "#3B82F6" : "#F59E0B" }} />
            </div>
            <span style={{ color: colors.textTertiary, fontSize: "11px", fontWeight: "600", minWidth: "34px" }}>{progress}%</span>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px" }}>

          {/* ── AI Suggestion Banner ── */}
          <AnimatePresence>
            {aiSuggestion && !aiApplied && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "14px", background: "#8B5CF615", border: "1px solid #8B5CF640", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Sparkles style={{ width: "18px", height: "18px", color: "#8B5CF6", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#8B5CF6" }}>AI Suggestion Ready</p>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: colors.textSecondary }}>
                      {CATEGORIES.find((c) => c.id === aiSuggestion.category)?.label} → {QUALIFIERS.find((q) => q.id === aiSuggestion.qualifier)?.label}
                    </p>
                  </div>
                  <button onClick={applyAiSuggestion} style={{ height: "32px", padding: "0 14px", borderRadius: "10px", border: "none", cursor: "pointer", background: "#8B5CF6", color: "#fff", fontSize: "12px", fontWeight: "600", flexShrink: 0 }}>
                    Apply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {aiSuggesting && (
            <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "14px", background: colors.bg, boxShadow: `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`, display: "flex", alignItems: "center", gap: "8px" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Sparkles style={{ width: "14px", height: "14px", color: "#8B5CF6" }} />
              </motion.div>
              <span style={{ fontSize: "12px", color: colors.textSecondary }}>AI analyzing transcript…</span>
            </div>
          )}

          {/* ── Recent Cases (link this call to an existing case) ── */}
          {recentCases.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: colors.textSecondary, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Link2 style={{ width: "12px", height: "12px" }} />
                Link to Recent Case
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {recentCases.map((c) => (
                  <Tile
                    key={c.id}
                    active={selectedCaseId === c.id}
                    onClick={() => setSelectedCaseId((prev) => (prev === c.id ? null : c.id))}
                    label={`${c.case_number || "Case"} · ${c.case_type || ""}`}
                    icon="📁"
                    color="#3B82F6"
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Panel 1: Category ── */}
          <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: "12px", fontWeight: "700", color: colors.text, marginBottom: "10px" }}>
              ① Category <span style={{ color: "#EF4444" }}>*</span>
              <span style={{ fontSize: "10px", fontWeight: "400", color: colors.textTertiary, marginLeft: "6px" }}>— what is this about?</span>
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <Tile
                  key={cat.id}
                  active={category === cat.id}
                  onClick={() => setCategory((prev) => (prev === cat.id ? null : cat.id))}
                  label={cat.label}
                  icon={cat.icon}
                  color={cat.color}
                  suggested={aiSuggestion?.category === cat.id && !aiApplied}
                />
              ))}
            </div>
          </div>

          {/* ── Panel 2: Qualifier ── */}
          <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: "12px", fontWeight: "700", color: colors.text, marginBottom: "10px" }}>
              ② Qualifier <span style={{ color: "#EF4444" }}>*</span>
              <span style={{ fontSize: "10px", fontWeight: "400", color: colors.textTertiary, marginLeft: "6px" }}>— why did they call / what specifically?</span>
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {QUALIFIERS.map((qual) => (
                <Tile
                  key={qual.id}
                  active={qualifier === qual.id}
                  onClick={() => handleQualifierClick(qual.id)}
                  label={qual.label}
                  icon={qual.icon}
                  suggested={aiSuggestion?.qualifier === qual.id && !aiApplied}
                />
              ))}
            </div>
            {qualifier && AUTO_SELECT[qualifier] && category === AUTO_SELECT[qualifier] && (
              <p style={{ fontSize: "10px", color: "#8B5CF6", marginTop: "6px", fontStyle: "italic" }}>
                ↳ Auto-linked to {CATEGORIES.find((c) => c.id === AUTO_SELECT[qualifier])?.label}
              </p>
            )}
          </div>

          {/* ── Resolution ── */}
          <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: "12px", fontWeight: "700", color: colors.text, marginBottom: "10px" }}>
              ③ Resolution <span style={{ color: "#EF4444" }}>*</span>
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {RESOLUTIONS.map((res) => (
                <Tile
                  key={res.id}
                  active={resolution === res.id}
                  onClick={() => setResolution((prev) => (prev === res.id ? null : res.id))}
                  label={res.label}
                  color={res.color}
                />
              ))}
            </div>
          </div>

          {/* ── Priority + Sentiment ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px", paddingBottom: "20px", borderBottom: `1px solid ${colors.border}` }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: colors.textSecondary, marginBottom: "8px" }}>Priority</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {PRIORITIES.map((p) => (
                  <Tile key={p.id} active={priority === p.id} onClick={() => setPriority(p.id)} label={p.label} color={p.color} />
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: colors.textSecondary, marginBottom: "8px" }}>Sentiment (end)</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {SENTIMENTS.map((s) => (
                  <Tile
                    key={s.id}
                    active={sentimentEnd === s.id}
                    onClick={() => setSentimentEnd((prev) => (prev === s.id ? null : s.id))}
                    label={s.label}
                    icon={s.emoji}
                    color={s.color}
                    suggested={aiSuggestion?.sentiment === s.id && !aiApplied}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Follow-up toggle ── */}
          <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setFollowUp((f) => !f)}
              style={{
                width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
                position: "relative", transition: "background 0.2s",
                background: followUp ? "#F59E0B" : colors.bg,
                boxShadow: followUp ? "inset 1px 1px 3px rgba(0,0,0,0.2)" : `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`,
                flexShrink: 0,
              }}
            >
              <span style={{ position: "absolute", top: "2px", left: followUp ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
            </button>
            <span style={{ color: colors.text, fontSize: "13px" }}>Follow-up required</span>
            {followUp && (
              <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} style={{ marginLeft: "auto", height: "32px", border: "none", borderRadius: "10px", padding: "0 10px", fontSize: "12px", background: colors.bg, color: colors.text, boxShadow: `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}` }} />
            )}
          </div>

          {/* ── Notes ── */}
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: colors.textSecondary, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <FileText style={{ width: "12px", height: "12px" }} />
              Notes
              {aiSuggestion?.notes && !aiApplied && (
                <button onClick={() => setNotes(aiSuggestion.notes)} style={{ marginLeft: "auto", height: "22px", padding: "0 8px", borderRadius: "6px", border: "none", cursor: "pointer", background: "#8B5CF620", color: "#8B5CF6", fontSize: "10px", fontWeight: "600" }}>
                  Use AI Summary
                </button>
              )}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Call notes… AI summary will appear here when available."
              rows={4}
              style={{
                width: "100%", border: "none", borderRadius: "12px", padding: "10px 12px",
                fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box",
                background: colors.bg, color: colors.text, lineHeight: 1.5,
                boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
              }}
            />
          </div>
        </div>

        {/* ── Sticky Footer ── */}
        <div style={{ position: "sticky", bottom: 0, background: colors.bg, borderRadius: "0 0 24px 24px", padding: "12px 20px", borderTop: `1px solid ${colors.border}`, display: "flex", gap: "10px", alignItems: "center" }}>
          {(!category || !qualifier || !resolution) && (
            <span style={{ color: "#EF4444", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
              <AlertCircle style={{ width: "12px", height: "12px" }} />
              Select category, qualifier & resolution
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ height: "42px", padding: "0 18px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px", ...getButtonStyle(), color: colors.textSecondary }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !category || !qualifier || !resolution}
            style={{
              height: "42px", padding: "0 28px", borderRadius: "12px", border: "none",
              cursor: saving || !category || !qualifier || !resolution ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg,#3B82F6,#2563EB)", color: "#fff",
              fontWeight: "700", fontSize: "14px", boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
              opacity: saving || !category || !qualifier || !resolution ? 0.5 : 1,
            }}
          >
            {saving ? "Submitting…" : "✓ Submit Wrap-Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}