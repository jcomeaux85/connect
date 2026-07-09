// Concensus — admin dashboard. Alerts pinned above everything, then compose /
// scheduled, then survey results and per-person trendline. Fully self-contained;
// wraps itself in the Concensus violet/cream neumorphic surface.
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquareHeart } from "lucide-react";
import { concensusTheme as t } from "./concensusTheme";
import { useConcensusUser } from "./useConcensusUser";
import { useConcensusAdmin } from "./admin/useConcensusAdmin";
import { concensusApi } from "./concensusApi";
import AlertsBanner from "./admin/AlertsBanner";
import QuestionComposer from "./admin/QuestionComposer";
import ScheduledList from "./admin/ScheduledList";
import SurveyResults from "./admin/SurveyResults";
import PersonTrendline from "./admin/PersonTrendline";

export default function ConcensusAdminPage() {
  const queryClient = useQueryClient();
  const { isAdmin, isLoading } = useConcensusUser();
  const { data, isLoading: loadingData } = useConcensusAdmin(isAdmin);

  const handleResolve = async (id) => {
    await concensusApi.resolveAlert(id);
    queryClient.invalidateQueries({ queryKey: ["concensus-admin"] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: t.shadowDark, borderTopColor: t.violet }} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: t.bg }}>
        <div className="p-8 text-center rounded-3xl" style={{ background: t.surface, boxShadow: `7px 7px 16px ${t.shadowDark}, -7px -7px 16px ${t.shadowLight}` }}>
          <h2 className="text-xl font-black mb-2" style={{ color: t.text }}>Admins only</h2>
          <p className="text-sm" style={{ color: t.textSoft }}>The Concensus dashboard is available to admins.</p>
        </div>
      </div>
    );
  }

  const { questions = [], surveys = [], responses = [], alerts = [] } = data || {};

  return (
    <div className="min-h-screen p-6 sm:p-10" style={{ background: t.bg }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-12 h-12 flex items-center justify-center rounded-2xl"
            style={{ background: `linear-gradient(135deg, ${t.violet}, ${t.violetDeep})`, boxShadow: `4px 4px 12px ${t.shadowDark}, -4px -4px 12px ${t.shadowLight}` }}
          >
            <MessageSquareHeart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black" style={{ color: t.violetDeep }}>Concensus</h1>
            <p className="text-sm font-medium" style={{ color: t.textSoft }}>Weekly team check-ins & wellbeing</p>
          </div>
        </div>

        {loadingData ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: t.shadowDark, borderTopColor: t.violet }} />
          </div>
        ) : (
          <>
            {/* Alerts pinned above everything */}
            <AlertsBanner alerts={alerts} onResolve={handleResolve} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <QuestionComposer />
              <ScheduledList questions={questions} />
            </div>

            <div className="mb-6">
              <PersonTrendline responses={responses} surveys={surveys} />
            </div>

            <h2 className="text-lg font-black mb-4 px-1" style={{ color: t.text }}>Published surveys</h2>
            <SurveyResults surveys={surveys} questions={questions} responses={responses} />
          </>
        )}
      </div>
    </div>
  );
}