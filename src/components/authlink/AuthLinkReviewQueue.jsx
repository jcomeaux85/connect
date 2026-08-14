import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/ThemeProvider";
import { Clock, ListFilter, X, KeyRound, Loader2 } from "lucide-react";

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

// Returns "expired" if older than 3 days, else a countdown string
function expiryCountdown(dateStr) {
  if (!dateStr) return null;
  const created = new Date(dateStr).getTime();
  const expires = created + 3 * 24 * 60 * 60 * 1000;
  const remaining = expires - Date.now();
  if (remaining <= 0) return "expired";
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  if (hours < 1) return `<1h left`;
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export default function AuthLinkReviewQueue({ submissions, onSelect }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState(null);

  const queue = useMemo(() => {
    return submissions
      .filter((s) => s.status === "submitted" || s.status === "link_generated")
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [submissions]);

  const handleCancel = async (e, item) => {
    e.stopPropagation();
    if (!confirm(`Cancel the authorization for ${item.member_full_name || "this member"}? They will no longer be able to submit.`)) return;
    setCancellingId(item.id);
    try {
      await base44.entities.AuthSubmission.update(item.id, {
        status: "cancelled",
      });
      queryClient.invalidateQueries({ queryKey: ["auth-submissions"] });
    } catch (e) {
      // ignore
    } finally {
      setCancellingId(null);
    }
  };

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
            const isAwaiting = item.status === "link_generated";
            const expiry = isAwaiting ? expiryCountdown(item.created_date) : null;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl transition"
                style={itemStyle}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    background: isReady ? "#dc3545" : "#6c757d",
                    boxShadow: isReady ? "0 0 8px rgba(220,53,69,0.5)" : "none",
                  }}
                />
                <button
                  onClick={() => isReady && onSelect?.(item.id)}
                  disabled={!isReady}
                  className="flex-1 min-w-0 text-left disabled:cursor-default"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                      {item.member_full_name || "Unknown"}
                    </p>
                    {isAwaiting && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0"
                        style={{ background: "#7aaec520", color: "#7aaec5" }}
                      >
                        <KeyRound size={9} />
                        {item.verification_code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: colors.textTertiary }}>
                    Policy {item.policy_id} — {item.authorized_representative || "—"}
                  </p>
                </button>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs" style={{ color: colors.textTertiary }}>
                    {isReady ? timeAgo(item.submitted_at) : "Awaiting member"}
                  </span>
                  {isAwaiting && expiry && (
                    <span
                      className="text-[10px] font-medium"
                      style={{
                        color: expiry === "expired" ? "#dc3545" : colors.textTertiary,
                      }}
                    >
                      {expiry === "expired" ? "auto-deleting soon" : expiry}
                    </span>
                  )}
                </div>
                {isAwaiting && (
                  <button
                    onClick={(e) => handleCancel(e, item)}
                    disabled={cancellingId === item.id}
                    className="p-1.5 rounded-lg transition flex-shrink-0"
                    style={{
                      background: colors.cardBg,
                      boxShadow: `2px 2px 5px ${colors.shadowDark}, -2px -2px 5px ${colors.shadowLight}`,
                    }}
                    title="Cancel authorization"
                  >
                    {cancellingId === item.id ? (
                      <Loader2 size={14} className="animate-spin" style={{ color: colors.textTertiary }} />
                    ) : (
                      <X size={14} style={{ color: "#dc3545" }} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}