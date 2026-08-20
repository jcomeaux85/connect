// eQuo — admin writes questions, publishes now or schedules for a future date.
// Now supports question_type (rating vs free_text) and per-survey anonymity.
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, CalendarClock } from "lucide-react";
import { equoTheme as t, raised, inset } from "../equoTheme";
import { NeuTextarea, NeuButton, NeuPrimaryButton } from "../EquoPrimitives";
import { equoApi, todayStr } from "../equoApi";

export default function QuestionComposer() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [questionType, setQuestionType] = useState("rating");
  const [anonymous, setAnonymous] = useState(false);
  const [mode, setMode] = useState("now");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["equo-admin"] });
    queryClient.invalidateQueries({ queryKey: ["equo-active-survey"] });
  };

  const handlePublishNow = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const day = todayStr();
      let survey = await equoApi.findSurveyByDate(day);
      if (!survey) {
        survey = await equoApi.createSurvey({
          title: `Weekly eQuo — ${day}`,
          publish_date: day,
          status: "active",
          is_anonymous: anonymous,
        });
      }
      await equoApi.createQuestion({
        text: text.trim(),
        question_type: questionType,
        status: "published",
        publish_date: day,
        survey_id: survey.id,
        order_index: Date.now(),
      });
      setText("");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleSchedule = async () => {
    if (!text.trim() || !date) return;
    setBusy(true);
    try {
      await equoApi.createQuestion({
        text: text.trim(),
        question_type: questionType,
        status: "scheduled",
        publish_date: date,
        order_index: Date.now(),
      });
      setText("");
      setDate("");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6" style={raised(24)}>
      <h3 className="text-lg font-black mb-1" style={{ color: t.text }}>Write a question</h3>
      <p className="text-xs mb-4" style={{ color: t.textSoft }}>
        Publish now, or schedule for a future date — scheduled questions on the same date group into one weekly survey automatically.
      </p>

      <NeuTextarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. What's one thing that went well this week, and one thing that felt hard?"
        rows={3}
      />

      <div className="flex items-center gap-2 mt-4 mb-3">
        <span className="text-xs font-bold" style={{ color: t.textSoft }}>Type:</span>
        <NeuButton onClick={() => setQuestionType("rating")} active={questionType === "rating"} style={{ padding: "6px 12px" }}>
          Rating (1-10)
        </NeuButton>
        <NeuButton onClick={() => setQuestionType("free_text")} active={questionType === "free_text"} style={{ padding: "6px 12px" }}>
          Free text
        </NeuButton>
      </div>

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="w-4 h-4"
          style={{ accentColor: t.violetDeep }}
        />
        <span className="text-xs font-semibold" style={{ color: t.textSoft }}>
          Allow anonymous responses (admins see aggregate only)
        </span>
      </label>

      <div className="flex gap-2 mb-4">
        <NeuButton onClick={() => setMode("now")} active={mode === "now"}>Publish now</NeuButton>
        <NeuButton onClick={() => setMode("schedule")} active={mode === "schedule"}>Schedule</NeuButton>
      </div>

      {mode === "schedule" && (
        <input
          type="date"
          value={date}
          min={todayStr()}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-3 text-sm outline-none mb-4 w-full"
          style={{ ...inset(12), color: t.text, border: "none" }}
        />
      )}

      <div className="flex justify-end">
        {mode === "now" ? (
          <NeuPrimaryButton onClick={handlePublishNow} disabled={busy || !text.trim()}>
            <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Publish now</span>
          </NeuPrimaryButton>
        ) : (
          <NeuPrimaryButton onClick={handleSchedule} disabled={busy || !text.trim() || !date}>
            <span className="flex items-center gap-2"><CalendarClock className="w-4 h-4" /> Schedule</span>
          </NeuPrimaryButton>
        )}
      </div>
    </div>
  );
}