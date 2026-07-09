// Concensus — all published surveys with per-question average rating and
// respondent count, expandable per survey.
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Users, Star } from "lucide-react";
import { concensusTheme as t, raised, raisedSoft, inset } from "../concensusTheme";

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
              {perQuestion.map(({ question, count, avg }) => (
                <div key={question.id} className="p-4 flex items-center gap-4" style={raisedSoft(14)}>
                  <p className="text-sm flex-1" style={{ color: t.text }}>{question.text}</p>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="px-3 py-1.5 rounded-xl text-center" style={inset(10)}>
                      <div className="text-sm font-black" style={{ color: t.violetDeep }}>{avg || "—"}</div>
                      <div className="text-[9px] font-semibold" style={{ color: t.textFaint }}>avg rating</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl text-center" style={inset(10)}>
                      <div className="text-sm font-black" style={{ color: t.text }}>{count}</div>
                      <div className="text-[9px] font-semibold" style={{ color: t.textFaint }}>responses</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SurveyResults({ surveys, questions, responses }) {
  const published = useMemo(
    () => surveys.filter((s) => questions.some((q) => q.survey_id === s.id))
      .sort((a, b) => (b.publish_date || "").localeCompare(a.publish_date || "")),
    [surveys, questions]
  );

  if (published.length === 0) {
    return (
      <div className="p-8 text-center" style={raised(24)}>
        <p className="text-sm" style={{ color: t.textSoft }}>No published surveys yet. Write a question above to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {published.map((survey) => (
        <SurveyRow key={survey.id} survey={survey} questions={questions} responses={responses} />
      ))}
    </div>
  );
}