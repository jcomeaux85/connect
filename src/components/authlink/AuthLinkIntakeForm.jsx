import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/components/ThemeProvider";
import { Link as LinkIcon, Loader2, Copy, Check, KeyRound } from "lucide-react";

const SCOPE_OPTIONS = ["Full authority", "Limited authority", "Specific issue"];

const EMPTY = {
  member_full_name: "",
  date_of_birth: "",
  phone: "",
  email: "",
  policy_id: "",
  employer_group: "",
  authorized_representative: "",
  relationship: "",
  scope: "Full authority",
  authorization_expiration: "",
};

function generateCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export default function AuthLinkIntakeForm({ user, onGenerated }) {
  const { colors } = useTheme();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = {
    background: colors.bg,
    boxShadow: `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`,
    border: "none",
    color: colors.textPrimary,
  };

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleGenerate = async () => {
    setError("");
    if (!form.member_full_name || !form.policy_id || !form.employer_group) {
      setError("Member full name, policy ID, and employer group are required.");
      return;
    }
    setSaving(true);
    try {
      const code = generateCode();
      const record = await base44.entities.AuthSubmission.create({
        ...form,
        verification_code: code,
        specialist_email: user?.email || "",
        status: "link_generated",
      });
      const link = `${window.location.origin}/AuthLink/Member/${record.id}`;
      setGeneratedLink(link);
      setGeneratedCode(code);
      setForm(EMPTY);
      onGenerated?.();
    } catch (e) {
      setError(e.message || "Failed to generate link.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const cardStyle = {
    background: colors.cardBg,
    boxShadow: `6px 6px 14px ${colors.shadowDark}, -6px -6px 14px ${colors.shadowLight}`,
    borderRadius: "18px",
  };

  return (
    <div id="new-authorization" className="p-6 scroll-mt-4" style={cardStyle}>
      <h2 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
        New authorization
      </h2>

      {generatedLink && generatedCode && (
        <div className="mb-4 space-y-3">
          {/* 5-digit access code — prominent */}
          <div
            className="p-4 rounded-xl flex items-center gap-4"
            style={{
              background: colors.bg,
              boxShadow: `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: colors.cardBg,
                boxShadow: `3px 3px 7px ${colors.shadowDark}, -3px -3px 7px ${colors.shadowLight}`,
              }}
            >
              <KeyRound size={18} style={{ color: "#7aaec5" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                Member access code
              </p>
              <p className="text-2xl font-bold tracking-[0.25em]" style={{ color: colors.textPrimary }}>
                {generatedCode}
              </p>
              <p className="text-xs" style={{ color: colors.textTertiary }}>
                Give this code to the member — they need it to open their session.
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg transition flex-shrink-0"
              style={{ background: colors.cardBg, boxShadow: `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}` }}
            >
              {copiedCode ? <Check size={16} style={{ color: "#22c55e" }} /> : <Copy size={16} style={{ color: colors.textSecondary }} />}
            </button>
          </div>

          {/* Link */}
          <div
            className="p-3 rounded-xl flex items-center gap-2"
            style={{
              background: colors.bg,
              boxShadow: `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`,
            }}
          >
            <LinkIcon size={16} style={{ color: "#7aaec5", flexShrink: 0 }} />
            <span
              className="text-xs flex-1 truncate"
              style={{ color: colors.textSecondary }}
            >
              {generatedLink}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg transition"
              style={{ background: colors.cardBg, boxShadow: `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}` }}
            >
              {copied ? <Check size={14} style={{ color: "#22c55e" }} /> : <Copy size={14} style={{ color: colors.textSecondary }} />}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Member full name *" required>
          <input
            type="text"
            value={form.member_full_name}
            onChange={(e) => handleChange("member_full_name", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </Field>
        <Field label="Date of birth *">
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(e) => handleChange("date_of_birth", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </Field>
        <Field label="Phone *">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </Field>
        <Field label="Email *">
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </Field>
        <Field label="Policy ID *">
          <input
            type="text"
            value={form.policy_id}
            onChange={(e) => handleChange("policy_id", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </Field>
        <Field label="Employer group *">
          <input
            type="text"
            value={form.employer_group}
            onChange={(e) => handleChange("employer_group", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </Field>
        <Field label="Authorized representative *">
          <input
            type="text"
            value={form.authorized_representative}
            onChange={(e) => handleChange("authorized_representative", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </Field>
        <Field label="Relationship *">
          <input
            type="text"
            value={form.relationship}
            onChange={(e) => handleChange("relationship", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </Field>
        <Field label="Scope">
          <select
            value={form.scope}
            onChange={(e) => handleChange("scope", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          >
            {SCOPE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Authorization expiration *">
          <input
            type="date"
            value={form.authorization_expiration}
            onChange={(e) => handleChange("authorization_expiration", e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </Field>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-3">{error}</p>
      )}

      <button
        onClick={handleGenerate}
        disabled={saving}
        className="w-full mt-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
        style={{
          background: "#7aaec5",
          color: "#ffffff",
          boxShadow: `3px 3px 7px ${colors.shadowDark}, -3px -3px 7px ${colors.shadowLight}`,
        }}
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
        {saving ? "Generating..." : "Generate member link"}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  const { colors } = useTheme();
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: colors.textSecondary }}>
        {label}
      </label>
      {children}
    </div>
  );
}