import React, { useState, useMemo } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Clock, ListFilter } from "lucide-react";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  const remMin = mins % 60;
  if (hours < 24) return `${hours}h ${remMin}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AuthLinkReviewQueue({ submissions, onSelect }) {
  const { colors } = useTheme();
  const [filter, setFilter] = useState("pending");

  const queue = useMemo(() => {
    return submissions
      .filter((s) => s.status === "submitted" || s.status === "link_generated")
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [submissions]);

  const cardStyle = {
    background: colors.cardBg,
    boxShadow: `6px 6px 14px ${colors.shadowDark}, -6px -6px 14px ${colors.shadowLight}`,
    borderRadius: "18px",
  };

  const itemStyle = {
    background: colors.bg,
    boxShadow: `inset 2px 2px 5px ${colors.shadowDark}, inset -2px -2px 5px ${colors.shadowLight}`,
    borderRadius: "12px",
  };

  return (
    <div className="p-6" style={cardStyle}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListFilter size={18} style={{ color: colors.textSecondary }} />
          <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            Review queue
          </h2>
        </div>
        <span className="text-xs flex items-center gap-1" style={{ color: colors.textTertiary }}>
          <Clock size={12} />
          Auto-refreshes every 30s
        </span>
      </div>

      {queue.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 rounded-xl"
          style={itemStyle}
        >
          <p className="text-sm" style={{ color: colors.textTertiary }}>
            No pending submissions
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {queue.map((item) => {
            const isReady = item.status === "submitted";
            return (
              <button
                key={item.id}
                onClick={() => isReady && onSelect?.(item.id)}
                disabled={!isReady}
                className="flex items-center gap-3 p-3 text-left rounded-xl transition disabled:cursor-default"
                style={itemStyle}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    background: isReady ? "#dc3545" : "#6c757d",
                    boxShadow: isReady ? "0 0 8px rgba(220,53,69,0.5)" : "none",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                    {item.member_full_name || "Unknown"}
                  </p>
                  <p className="text-xs truncate" style={{ color: colors.textTertiary }}>
                    Policy {item.policy_id} — {item.authorized_representative || "—"}
                  </p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: colors.textTertiary }}>
                  {isReady ? timeAgo(item.submitted_at) : "Awaiting member"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}