// Concensus — admin writes questions, publishes now (into a survey grouped by
// today's date) or schedules for a future date (auto-publishes on that date).
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, CalendarClock } from "lucide-react";
import { concensusTheme as t, raised, inset } from "../concensusTheme";
import { NeuTextarea, NeuButton, NeuPrimaryButton } from "../ConcensusPrimitives";
import { concensusApi, todayStr } from "../concensusApi";

export default function QuestionComposer() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [mode, setMode] = useState("now"); // now | schedule
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["concensus-admin"] });
    queryClient.invalidateQueries({ queryKey: ["concensus-active-survey"] });
  };

  const handlePublishNow = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const day = todayStr();
      let survey = await concensusApi.findSurveyByDate(day);
      if (!survey) {
        survey = await concensusApi.createSurvey({ title: `Weekly Concensus — ${day}`, publish_date: day, status: "active" });
      }
      const existing = await concensusApi.listResponsesForSurvey(survey.id);
      // order_index simply appends
      await concensusApi.createQuestion({
        text: text.trim(),
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
      await concensusApi.createQuestion({
        text: text.trim(),
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

      <div className="flex gap-2 mt-4 mb-4">
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