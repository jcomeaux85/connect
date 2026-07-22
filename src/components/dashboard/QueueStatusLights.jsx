import React from "react";

// Four little colored status lights that sit under the QFLO progress bar.
// Each represents one color-coded person in the queue:
//   - "on"    → logged in: solid, fully lit with a soft glow
//   - "off"   → logged out: greyed out, dim
//   - "break" → on break / at lunch: soft fade in-and-out (never fully off)
//
// The pulsing is driven by an inline <style> keyframe so no global CSS or
// extra dependency is needed.
export default function QueueStatusLights({ lights = [] }) {
  return (
    <div className="flex items-center gap-2.5 mt-2 pl-0.5">
      <style>{`
        @keyframes qflo-break-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
      `}</style>
      {lights.map((l, i) => {
        const isOff = l.state === "off";
        const isBreak = l.state === "break";
        return (
          <span
            key={i}
            title={l.label || ""}
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: isOff ? "#9ca3af" : l.color,
              opacity: isOff ? 0.4 : 1,
              boxShadow: isOff ? "none" : `0 0 6px ${l.color}aa`,
              filter: isOff ? "grayscale(1)" : "none",
              animation: isBreak ? "qflo-break-pulse 1.6s ease-in-out infinite" : "none",
              transition: "opacity 0.3s ease, box-shadow 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
}