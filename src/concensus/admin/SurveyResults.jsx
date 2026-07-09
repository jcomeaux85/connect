// Concensus — all published surveys with per-question average rating and
// respondent count, expandable per survey.
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Users, Star, Search } from "lucide-react";
import { concensusTheme as t, raised, inset } from "../concensusTheme";
import QuestionResponses from "./QuestionResponses";

function SurveyRow({ survey, questions, responses }) {
  const [open, setOpen] = useState(false);

  const surveyQuestions = questions
    .filter((q) => q.survey_id === survey.id)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const surveyResponses = responses.filter((r) => r.survey_id === survey.id);
  const respondents = new Set(surveyResponses.map((r) => r.respondent_email)).size;
  const overallAvg = surveyResponses.length
    ? Math.round((surveyResponses.reduce((a, r) => a + r.rating, 0) / surveyResponses.length) * 10) / 10
    : 0;

  const perQuestion = surveyQuestions.map((q) => {
    const rs = surveyResponses.filter((r) => r.question_id === q.id);
    const avg = rs.length ? Math.round((rs.reduce((a, r) => a + r.rating, 0) / rs.length) * 10) / 10 : 0;
    return { question: q, count: rs.length, avg, responses: rs };
  });

  return (
    <div className="p-5" style={raised(22)}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-4 text-left">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black" style={{ color: t.text }}>{survey.title || `Survey ${survey.publish_date}`}</div>
          <div className="text-xs" style={{ color: t.textSoft }}>{survey.publish_date} · {surveyQuestions.length} questions</div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-center">
            <div className="flex items-center gap-1 text-sm font-black" style={{ color: t.violetDeep }}>
              <Star className="w-3.5 h-3.5" /> {overallAvg || "—"}
            </div>
            <div className="text-[10px] font-semibold" style={{ color: t.textFaint }}>avg</div>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-sm font-black" style={{ color: t.text }}>
              <Users className="w-3.5 h-3.5" /> {respondents}
            </div>
            <div className="text-[10px] font-semibold" style={{ color: t.textFaint }}>people</div>
          </div>
          <motion.div animate={{ rotate: open ? 180 : 0 }}>
            <ChevronDown className="w-5 h-5" style={{ color: t.textSoft }} />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-5 space-y-3">
              {perQuestion.map(({ question, count, avg, responses: qResponses }) => (
                <QuestionResponses
                  key={question.id}
                  question={question}
                  count={count}
                  avg={avg}
                  responses={qResponses}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SurveyResults({ surveys, questions, responses }) {
  const [search, setSearch] = useState("");

  const published = useMemo(
    () => surveys.filter((s) => questions.some((q) => q.survey_id === s.id))
      .sort((a, b) => (b.publish_date || "").localeCompare(a.publish_date || "")),
    [surveys, questions]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return published;
    return published.filter((s) => {
      const title = (s.title || `Survey ${s.publish_date}`).toLowerCase();
      const date = (s.publish_date || "").toLowerCase();
      const qs = questions.filter((qq) => qq.survey_id === s.id).map((qq) => (qq.text || "").toLowerCase()).join(" ");
      return title.includes(q) || date.includes(q) || qs.includes(q);
    });
  }, [published, questions, search]);

  if (published.length === 0) {
    return (
      <div className="p-8 text-center" style={raised(24)}>
        <p className="text-sm" style={{ color: t.textSoft }}>No published surveys yet. Write a question above to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search past check-ins */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl" style={inset(16)}>
        <Search className="w-4 h-4 shrink-0" style={{ color: t.textFaint }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search past check-ins by date, title, or question…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: t.text }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center" style={raised(24)}>
          <p className="text-sm" style={{ color: t.textSoft }}>No check-ins match “{search}”.</p>
        </div>
      ) : (
        filtered.map((survey) => (
          <SurveyRow key={survey.id} survey={survey} questions={questions} responses={responses} />
        ))
      )}
    </div>
  );
}