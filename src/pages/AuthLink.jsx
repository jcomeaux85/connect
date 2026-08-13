import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/components/hooks/useUser";
import { useTheme } from "@/components/ThemeProvider";
import AuthLinkIntakeForm from "@/components/authlink/AuthLinkIntakeForm";
import AuthLinkReviewQueue from "@/components/authlink/AuthLinkReviewQueue";
import AuthLinkVerification from "@/components/authlink/AuthLinkVerification";
import { Lock, Plus } from "lucide-react";

export default function AuthLink() {
  const { data: user } = useUser();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);

  const { data: submissions = [] } = useQuery({
    queryKey: ["auth-submissions"],
    queryFn: () => base44.entities.AuthSubmission.list("-created_date", 100),
    refetchInterval: 30000,
  });

  const handleGenerated = () => {
    queryClient.invalidateQueries({ queryKey: ["auth-submissions"] });
  };

  const handleReviewed = () => {
    queryClient.invalidateQueries({ queryKey: ["auth-submissions"] });
    setSelectedSubmissionId(null);
  };

  const handleStartNew = () => {
    const el = document.getElementById("new-authorization");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstInput = el.querySelector("input, select, textarea");
      if (firstInput) setTimeout(() => firstInput.focus(), 350);
    }
  };

  const selected = submissions.find((s) => s.id === selectedSubmissionId);

  // ── Verification detail view ──
  if (selected) {
    return (
      <div className="min-h-full p-4 lg:p-6" style={{ background: colors.bg }}>
        <AuthLinkVerification
          submission={selected}
          user={user}
          onBack={() => setSelectedSubmissionId(null)}
          onReviewed={handleReviewed}
        />
      </div>
    );
  }

  // ── Specialist console: intake form + review queue ──
  return (
    <div className="min-h-full p-4 lg:p-6" style={{ background: colors.bg }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: colors.cardBg,
              boxShadow: `3px 3px 7px ${colors.shadowDark}, -3px -3px 7px ${colors.shadowLight}`,
            }}
          >
            <Lock size={20} style={{ color: colors.textPrimary }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
              AUTH<span style={{ color: "#7aaec5" }}>|</span>link
            </h1>
            <p className="text-xs" style={{ color: colors.textTertiary }}>
              Specialist Console
            </p>
          </div>
        </div>
        <button
          onClick={handleStartNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
          style={{
            background: colors.cardBg,
            color: colors.textPrimary,
            boxShadow: `3px 3px 7px ${colors.shadowDark}, -3px -3px 7px ${colors.shadowLight}`,
          }}
        >
          <Plus size={16} style={{ color: "#7aaec5" }} />
          Start New Authorization
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AuthLinkIntakeForm user={user} onGenerated={handleGenerated} />
        <AuthLinkReviewQueue
          submissions={submissions}
          onSelect={(id) => setSelectedSubmissionId(id)}
        />
      </div>
    </div>
  );
}