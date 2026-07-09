// Concensus — pending scheduled questions (awaiting their auto-publish date).
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Trash2 } from "lucide-react";
import { concensusTheme as t, raised, raisedSoft } from "../concensusTheme";
import { concensusApi } from "../concensusApi";

export default function ScheduledList({ questions }) {
  const queryClient = useQueryClient();
  const scheduled = questions
    .filter((q) => q.status === "scheduled")
    .sort((a, b) => (a.publish_date || "").localeCompare(b.publish_date || ""));

  if (scheduled.length === 0) return null;

  const remove = async (id) => {
    await concensusApi.deleteQuestion(id);
    queryClient.invalidateQueries({ queryKey: ["concensus-admin"] });
  };

  return (
    <div className="p-6" style={raised(24)}>
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-4 h-4" style={{ color: t.violet }} />
        <h3 className="text-lg font-black" style={{ color: t.text }}>Scheduled</h3>
      </div>
      <div className="space-y-3">
        {scheduled.map((q) => (
          <div key={q.id} className="p-4 flex items-center gap-4" style={raisedSoft(16)}>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: t.peach, color: t.amberDeep }}>
              {q.publish_date}
            </span>
            <p className="text-sm flex-1" style={{ color: t.text }}>{q.text}</p>
            <button onClick={() => remove(q.id)} className="shrink-0 p-2 rounded-lg" style={{ color: t.textFaint }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}