// ─────────────────────────────────────────────────────────────────────────────
// Call Classification System — Two-Panel Tile Definitions
// Panel 1 = Category (the "what"), Panel 2 = Qualifier (the "why/how")
// Auto-select rules fire when a Panel 2 tile is clicked, auto-setting Panel 1.
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: "medical",        label: "Medical",        icon: "🏥", color: "#3B82F6" },
  { id: "dental",         label: "Dental",         icon: "🦷", color: "#06B6D4" },
  { id: "vision",         label: "Vision",         icon: "👁️", color: "#8B5CF6" },
  { id: "life",           label: "Life",           icon: "💜", color: "#A855F7" },
  { id: "disability",     label: "Disability",     icon: "♿", color: "#EC4899" },
  { id: "hsa_fsa",        label: "HSA/FSA",        icon: "🏦", color: "#F59E0B" },
  { id: "retirement_401k", label: "401k/Retirement", icon: "💰", color: "#10B981" },
  { id: "ben_admin",      label: "Ben Admin",      icon: "⚙️", color: "#6B7280" },
  { id: "system_issue",   label: "System Issue",   icon: "🔧", color: "#EF4444" },
  { id: "member_id",      label: "Member ID",      icon: "🪪", color: "#F97316" },
  { id: "qle",            label: "QLE",            icon: "🔄", color: "#6366F1" },
  { id: "open_enrollment", label: "Open Enrollment", icon: "📅", color: "#14B8A6" },
  { id: "cobra",          label: "COBRA",          icon: "📋", color: "#0EA5E9" },
  { id: "fmla_loa",       label: "FMLA/LOA",       icon: "📜", color: "#D97706" },
  { id: "prescription",   label: "Prescription/Rx", icon: "💊", color: "#0891B2" },
  { id: "general_benefits", label: "General Benefits", icon: "📋", color: "#9CA3AF" },
];

export const QUALIFIERS = [
  { id: "how_to",          label: "How to?",          icon: "❓" },
  { id: "what_is",         label: "What is?",         icon: "💡" },
  { id: "why_did",         label: "Why did?",          icon: "🤔" },
  { id: "billing",         label: "Billing",          icon: "💳" },
  { id: "claims",          label: "Claims",           icon: "📄" },
  { id: "enrollment",      label: "Enrollment",        icon: "✍️" },
  { id: "id_card",         label: "ID Card",          icon: "🪪" },
  { id: "network_provider", label: "Network/Provider", icon: "🔍" },
  { id: "new_hire",        label: "New Hire",         icon: "🆕" },
  { id: "demographics",    label: "Demographics",     icon: "📝" },
  { id: "documentation",   label: "Documentation",    icon: "📎" },
  { id: "prior_auth",      label: "Prior Auth",       icon: "🔐" },
  { id: "payroll",         label: "Payroll",          icon: "💵" },
  { id: "tax_form",        label: "Tax Form",         icon: "🧾" },
  { id: "waive",           label: "Waive Benefits",   icon: "🚫" },
  { id: "guide_request",   label: "Guide Request",    icon: "📖" },
  { id: "cocc",           label: "COCC Request",     icon: "📌" },
  { id: "general_questions", label: "General Questions", icon: "💬" },
  { id: "other",           label: "Other",            icon: "⋯" },
];

// Auto-select rules: when a qualifier is clicked, auto-set the category.
// Key = qualifier id, Value = category id to auto-select.
export const AUTO_SELECT = {
  new_hire:        "general_benefits",
  qle:             "medical",
  open_enrollment: "general_benefits",
  billing:         "medical",
  claims:          "medical",
  id_card:         "medical",
  prior_auth:      "medical",
  enrollment:      "general_benefits",
  payroll:         "retirement_401k",
  tax_form:        "ben_admin",
  demographics:    "ben_admin",
  documentation:   "ben_admin",
  guide_request:   "general_benefits",
  cocc:            "ben_admin",
  waive:           "general_benefits",
  network_provider: "medical",
};

export const RESOLUTIONS = [
  { id: "resolved_first_call",       label: "Resolved — First Call",     color: "#10B981" },
  { id: "resolved_followup",        label: "Resolved — Follow-Up",      color: "#10B981" },
  { id: "pending_carrier",           label: "Pending — Carrier",        color: "#F59E0B" },
  { id: "pending_client_hr",         label: "Pending — Client HR",      color: "#F59E0B" },
  { id: "pending_member_docs",       label: "Pending — Member Docs",    color: "#F59E0B" },
  { id: "escalated_supervisor",      label: "Escalated — Supervisor",   color: "#EF4444" },
  { id: "escalated_compliance",      label: "Escalated — Compliance",   color: "#EF4444" },
  { id: "transferred",               label: "Transferred",              color: "#8B5CF6" },
  { id: "callback_scheduled",        label: "Callback Scheduled",       color: "#3B82F6" },
];

export const PRIORITIES = [
  { id: "Urgent", label: "Urgent", color: "#EF4444" },
  { id: "High",   label: "High",   color: "#F59E0B" },
  { id: "Normal", label: "Normal", color: "#3B82F6" },
  { id: "Low",    label: "Low",    color: "#9CA3AF" },
];

export const SENTIMENTS = [
  { id: "frustrated", label: "Frustrated", emoji: "😤", color: "#EF4444" },
  { id: "confused",   label: "Confused",   emoji: "😕", color: "#F59E0B" },
  { id: "neutral",    label: "Neutral",    emoji: "😐", color: "#6B7280" },
  { id: "satisfied",  label: "Satisfied",  emoji: "😊", color: "#3B82F6" },
  { id: "happy",      label: "Happy",      emoji: "😄", color: "#10B981" },
];