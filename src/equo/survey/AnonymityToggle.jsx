// eQuo — per-respondent anonymity toggle. When the survey allows anonymity,
// the respondent can choose to submit anonymously. Admin sees aggregate only.
import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { equoTheme as t, pressable } from "../equoTheme";

export default function AnonymityToggle({ anonymous, onToggle }) {
  return (
    <button
      onClick={() => onToggle(!anonymous)}
      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold"
      style={{
        ...pressable(anonymous, 12),
        color: anonymous ? t.violetDeep : t.textSoft,
      }}
    >
      {anonymous ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      {anonymous ? "Submitting anonymously" : "Submit with my name"}
    </button>
  );
}