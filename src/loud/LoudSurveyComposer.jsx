// ALERA | loud — survey composer. Admin creates a survey with inline questions,
// picks trigger type (email link or post-call), and gets a shareable link.
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Send, Copy, Check } from "lucide-react";
import { useLoudTheme } from "./loudTheme";
import { loudApi } from "./loudApi";

const DEFAULT_QUESTIONS = [
  { id: "q1", prompt: "How would you rate your experience?", type: "rating", required: true },
  { id: "q2", prompt: "What could we do better?", type: "text", required: false },
];

export default function LoudSurveyComposer({ user }) {
  const { theme: t, raised, inset, pressable } = useLoudTheme();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("email_link");
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [busy, setBusy] = useState(false);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { id: `q${Date.now()}`, prompt: "", type: "text", required: true }]);
  };

  const updateQ = (id, field, value) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const removeQ = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const survey = await loudApi.createSurvey({
        title: title.trim(),
        description: description.trim(),
        questions: questions.filter((q) => q.prompt.trim()),
        trigger_type: triggerType,
        status: "active",
        created_by_email: user?.email,
      });
      const link = `${window.location.origin}/LoudSurvey/${survey.share_token}`;
      setCreatedLink(link);
      queryClient.invalidateQueries({ queryKey: ["loud-admin"] });
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6" style={raised(24)}>
      <h3 className="text-lg font-black mb-1" style={{ color: t.text }}>Create a survey</h3>
      <p className="text-xs mb-4" style={{ color: t.textSoft }}>
        Build a survey, pick how it's delivered — email link or automatic post-call.
      </p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Survey title…"
        className="w-full px-4 py-3 text-sm outline-none mb-3"
        style={{ ...inset(12), color: t.text, border: "none" }}
      />

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description / intro (optional)…"
        className="w-full px-4 py-3 text-sm outline-none mb-4"
        style={{ ...inset(12), color: t.text, border: "none" }}
      />

      {/* Trigger type */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTriggerType("email_link")}
          className="px-4 py-2 text-sm font-semibold"
          style={{ ...pressable(triggerType === "email_link"), color: t.text }}
        >
          Email link
        </button>
        <button
          onClick={() => setTriggerType("post_call")}
          className="px-4 py-2 text-sm font-semibold"
          style={{ ...pressable(triggerType === "post_call"), color: t.text }}
        >
          Post-call (automatic)
        </button>
      </div>

      {/* Questions */}
      <div className="space-y-3 mb-4">
        {questions.map((q, i) => (
          <div key={q.id} className="p-4" style={inset(14)}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold" style={{ color: t.textFaint }}>Q{i + 1}</span>
              <select
                value={q.type}
                onChange={(e) => updateQ(q.id, "type", e.target.value)}
                className="px-2 py-1 text-xs outline-none"
                style={{ ...inset(8), color: t.text, border: "none" }}
              >
                <option value="rating">Rating (1-5)</option>
                <option value="text">Text</option>
                <option value="choice">Choice</option>
              </select>
              <button onClick={() => removeQ(q.id)} className="ml-auto p-1" style={{ color: t.textFaint }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              value={q.prompt}
              onChange={(e) => updateQ(q.id, "prompt", e.target.value)}
              placeholder="Question prompt…"
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ ...inset(10), color: t.text, border: "none" }}
            />
          </div>
        ))}
        <button
          onClick={addQuestion}
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: t.orangeDeep }}
        >
          <Plus className="w-4 h-4" /> Add question
        </button>
      </div>

      {createdLink && (
        <div className="p-4 mb-4" style={inset(14)}>
          <div className="text-xs font-bold mb-2" style={{ color: t.textSoft }}>Shareable link:</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs px-3 py-2 rounded-lg" style={{ ...inset(10), color: t.orangeDeep }}>
              {createdLink}
            </code>
            <button onClick={copyLink} className="p-2 rounded-lg" style={{ ...pressable(false, 10), color: t.orangeDeep }}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          disabled={busy || !title.trim()}
          className="flex items-center gap-2 px-5 py-3 text-sm font-bold"
          style={{
            borderRadius: 16,
            border: "none",
            color: t.onAccent,
            background: `linear-gradient(135deg, ${t.orange}, ${t.orangeDeep})`,
            boxShadow: `4px 4px 12px ${t.shadowDark}`,
            opacity: busy || !title.trim() ? 0.5 : 1,
            cursor: busy || !title.trim() ? "not-allowed" : "pointer",
          }}
        >
          <Send className="w-4 h-4" /> {createdLink ? "Create another" : "Create survey"}
        </button>
      </div>
    </div>
  );
}