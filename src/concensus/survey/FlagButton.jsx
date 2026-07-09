// Concensus — flag toggle. Neutral when off; glowing red dot at center when on.
import React from "react";
import { concensusTheme as t, pressable } from "../concensusTheme";
import { Flag } from "lucide-react";

export default function FlagButton({ flagged, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Flag this response"
      className="relative flex items-center justify-center"
      style={{
        ...pressable(flagged, 14),
        width: 42,
        height: 42,
      }}
    >
      <Flag className="w-4 h-4" style={{ color: flagged ? t.softRedDeep : t.textFaint }} />
      {flagged && (
        <span
          className="absolute rounded-full"
          style={{
            width: 8,
            height: 8,
            background: "#ff4d4d",
            boxShadow: "0 0 6px 2px rgba(255,77,77,0.8), 0 0 12px 4px rgba(255,77,77,0.45)",
          }}
        />
      )}
    </button>
  );
}