// eQuo — main admin page. Tabbed: Dashboard (rollup), My view (employee),
// Questions (compose + schedule), History (past surveys). Alerts pinned above all.
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquareHeart, LayoutDashboard, User, PenLine, History, Download } from "lucide-react";
import { equoTheme as t } from "../equoTheme";
import { useEquoUser } from "../useEquoUser";
import { useEquoAdmin } from "./useEquoAdmin";
import { equoApi } from "../equoApi";
import { exportToCSV, responsesToCSV, moodsToCSV, shoutoutsToCSV } from "./csvExport";
import AlertsBanner from "./AlertsBanner";
import QuestionComposer from "./QuestionComposer";
import ScheduledList from "./ScheduledList";
import SurveyResults from "./SurveyResults";
import PersonTrendline from "./PersonTrendline";
import EquoDashboard from "./EquoDashboard";
import EmployeeView from "./EmployeeView";
import ShoutOutComposer from "./ShoutOutComposer";
import ShoutOutFeed from "./ShoutOutFeed";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "myview", label: "My view", icon: User },
  { id: "questions", label: "Questions", icon: PenLine },
  { id: "history", label: "History", icon: History },
];

export default function EquoAdminPage() {
  const queryClient = useQueryClient();
  const { user, isAdmin, isLoading } = useEquoUser();
  const { data, isLoading: loadingData } = useEquoAdmin(isAdmin);
  const [tab, setTab] = useState("dashboard");

  const handleResolve = async (id) => {
    await equoApi.resolveAlert(id);
    queryClient.invalidateQueries({ queryKey: ["equo-admin"] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: t.shadowDark, borderTopColor: t.violet }} />
      </div>
    );
  }

  const { questions = [], surveys = [], responses = [], alerts = [], shoutouts = [], moods = [] } = data || {};

  const handleExport = () => {
    if (tab === "dashboard") {
      exportToCSV(`equo-responses-${new Date().toISOString().slice(0, 10)}.csv`,
        responsesToCSV(responses, surveys, questions));
    } else if (tab === "history") {
      exportToCSV(`equo-responses-${new Date().toISOString().slice(0, 10)}.csv`,
        responsesToCSV(responses, surveys, questions));
    }
  };

  return (
    <div className="min-h-screen p-6 sm:p-10" style={{ background: t.bg }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-12 h-12 flex items-center justify-center rounded-2xl"
            style={{ background: `linear-gradient(135deg, ${t.violet}, ${t.violetDeep})`, boxShadow: `4px 4px 12px ${t.shadowDark}, -4px -4px 12px ${t.shadowLight}` }}
          >
            <MessageSquareHeart className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black" style={{ color: t.violetDeep }}>eQuo</h1>
            <p className="text-sm font-medium" style={{ color: t.textSoft }}>Weekly engagement & wellbeing</p>
          </div>
          {(tab === "dashboard" || tab === "history") && responses.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl"
              style={{ background: t.surface, color: t.violetDeep, boxShadow: `3px 3px 8px ${t.shadowDark}, -3px -3px 8px ${t.shadowLight}` }}
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1.5 rounded-2xl" style={{ background: t.surface, boxShadow: `inset 3px 3px 7px ${t.shadowDark}, inset -3px -3px 7px ${t.shadowLight}` }}>
          {TABS.map((tb) => {
            const Icon = tb.icon;
            const active = tab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all"
                style={{
                  background: active ? t.surface : "transparent",
                  color: active ? t.violetDeep : t.textSoft,
                  boxShadow: active ? `3px 3px 8px ${t.shadowDark}, -3px -3px 8px ${t.shadowLight}` : "none",
                }}
              >
                <Icon className="w-4 h-4" /> {tb.label}
              </button>
            );
          })}
        </div>

        {loadingData ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: t.shadowDark, borderTopColor: t.violet }} />
          </div>
        ) : (
          <>
            {/* Alerts pinned above everything */}
            <AlertsBanner alerts={alerts} onResolve={handleResolve} />

            {tab === "dashboard" && (
              <EquoDashboard
                responses={responses}
                surveys={surveys}
                questions={questions}
                moods={moods}
                shoutouts={shoutouts}
                alerts={alerts}
                user={user}
              />
            )}

            {tab === "myview" && <EmployeeView user={user} />}

            {tab === "questions" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <QuestionComposer />
                  <ScheduledList questions={questions} />
                </div>
                <div className="mb-6">
                  <PersonTrendline responses={responses} surveys={surveys} moods={moods} />
                </div>
              </>
            )}

            {tab === "history" && (
              <>
                <h2 className="text-lg font-black mb-1 px-1" style={{ color: t.text }}>Check-in history</h2>
                <p className="text-xs mb-4 px-1" style={{ color: t.textSoft }}>Browse past surveys — expand any to see per-question averages, then drill into individual answers.</p>
                <SurveyResults surveys={surveys} questions={questions} responses={responses} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}