// eQuo — admin dashboard rollup. Participation rate, team sentiment, mood trend,
// flagged/escalated responses, shout-out feed. This is the "leadership asks for
// this eventually" view.
import React, { useMemo } from "react";
import { Users, TrendingUp, AlertCircle, Megaphone, Flame } from "lucide-react";
import { equoTheme as t, raised, raisedSoft, inset } from "../equoTheme";
import TeamSentimentChart from "./TeamSentimentChart";
import MoodTrendChart from "./MoodTrendChart";
import ShoutOutFeed from "./ShoutOutFeed";
import ShoutOutComposer from "./ShoutOutComposer";
import { equoApi } from "../equoApi";

function getWeekOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export default function EquoDashboard({ responses, surveys, questions, moods, shoutouts, alerts, user }) {
  const thisWeek = getWeekOf();

  // Participation rate this week
  const participation = useMemo(() => {
    const thisWeekSurvey = surveys.find((s) => s.publish_date === thisWeek || s.publish_date >= thisWeek);
    if (!thisWeekSurvey) return { rate: 0, completed: 0, total: 0 };
    const surveyQs = questions.filter((q) => q.survey_id === thisWeekSurvey.id);
    if (surveyQs.length === 0) return { rate: 0, completed: 0, total: 0 };
    const respondents = new Set(
      responses.filter((r) => r.survey_id === thisWeekSurvey.id).map((r) => r.respondent_email)
    );
    // Total = all users (approximate from all respondents ever)
    const allRespondentsEver = new Set(responses.map((r) => r.respondent_email));
    const total = Math.max(allRespondentsEver.size, respondents.size);
    return {
      rate: total ? Math.round((respondents.size / total) * 100) : 0,
      completed: respondents.size,
      total,
    };
  }, [surveys, questions, responses, thisWeek]);

  // Flagged/escalated responses
  const flaggedAlerts = useMemo(() => alerts.filter((a) => !a.is_resolved), [alerts]);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5" style={raised(20)}>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" style={{ color: t.violet }} />
            <span className="text-xs font-bold" style={{ color: t.textSoft }}>Participation</span>
          </div>
          <div className="text-2xl font-black" style={{ color: t.violetDeep }}>{participation.rate}%</div>
          <div className="text-[10px]" style={{ color: t.textFaint }}>{participation.completed} of {participation.total} this week</div>
        </div>

        <div className="p-5" style={raised(20)}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" style={{ color: t.softRedDeep }} />
            <span className="text-xs font-bold" style={{ color: t.textSoft }}>Open alerts</span>
          </div>
          <div className="text-2xl font-black" style={{ color: t.softRedDeep }}>{flaggedAlerts.length}</div>
          <div className="text-[10px]" style={{ color: t.textFaint }}>flagged / escalated</div>
        </div>

        <div className="p-5" style={raised(20)}>
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="w-4 h-4" style={{ color: t.goldDeep }} />
            <span className="text-xs font-bold" style={{ color: t.textSoft }}>Shout-outs</span>
          </div>
          <div className="text-2xl font-black" style={{ color: t.goldDeep }}>{shoutouts.length}</div>
          <div className="text-[10px]" style={{ color: t.textFaint }}>all time</div>
        </div>

        <div className="p-5" style={raised(20)}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: t.peachAccent }} />
            <span className="text-xs font-bold" style={{ color: t.textSoft }}>Mood checks</span>
          </div>
          <div className="text-2xl font-black" style={{ color: t.peachAccent }}>{moods.length}</div>
          <div className="text-[10px]" style={{ color: t.textFaint }}>all time</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamSentimentChart responses={responses} moods={moods} surveys={surveys} />
        <MoodTrendChart moods={moods} />
      </div>

      {/* Shout-outs + composer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ShoutOutComposer user={user} />
        <ShoutOutFeed shoutouts={shoutouts} limit={6} />
      </div>
    </div>
  );
}