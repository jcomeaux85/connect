// ALERA | loud — main admin page. Survey composer + results dashboard.
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Volume2 } from "lucide-react";
import { loudTheme as t } from "./loudTheme";
import { loudApi } from "./loudApi";
import LoudSurveyComposer from "./LoudSurveyComposer";
import LoudDashboard from "./LoudDashboard";
import { useEquoUser } from "@/equo/useEquoUser";

export default function LoudAdminPage() {
  const { user, isAdmin, isLoading } = useEquoUser();
  const { data, isLoading: loadingData } = useQuery({
    queryKey: ["loud-admin"],
    enabled: !!isAdmin,
    refetchInterval: 30000,
    queryFn: () => loudApi.loadAdminData(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: t.shadowDark, borderTopColor: t.orange }} />
      </div>
    );
  }

  const { surveys = [], submissions = [], postCalls = [] } = data || {};

  return (
    <div className="min-h-screen p-6 sm:p-10" style={{ background: t.bg }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-12 h-12 flex items-center justify-center rounded-2xl"
            style={{ background: `linear-gradient(135deg, ${t.orange}, ${t.orangeDeep})`, boxShadow: `4px 4px 12px ${t.shadowDark}, -4px -4px 12px ${t.shadowLight}` }}
          >
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black" style={{ color: t.orangeDeep }}>ALERA | loud</h1>
            <p className="text-sm font-medium" style={{ color: t.textSoft }}>User-generated surveys & post-call feedback</p>
          </div>
        </div>

        {loadingData ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: t.shadowDark, borderTopColor: t.orange }} />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <LoudSurveyComposer user={user} />
            </div>
            <LoudDashboard surveys={surveys} submissions={submissions} />
          </>
        )}
      </div>
    </div>
  );
}