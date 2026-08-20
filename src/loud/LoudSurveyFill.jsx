// ALERA | loud — public survey fill page. Reached via /LoudSurvey/:token.
// No auth required — anyone with the link can fill it.
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Volume2, Check, Star } from "lucide-react";
import { loudTheme as t, raised, inset, pressable } from "./loudTheme";
import { loudApi } from "./loudApi";

export default function LoudSurveyFill() {
  const { token } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    loudApi.getSurveyByToken(token).then((s) => {
      setSurvey(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const questions = survey.questions || [];
      let overallRating = null;
      const answerMap = {};
      questions.forEach((q) => {
        const val = answers[q.id];
        if (val != null) {
          answerMap[q.prompt] = val;
          if (q.type === "rating" && overallRating == null) overallRating = val;
        }
      });
      await loudApi.createSubmission({
        survey_id: survey.id,
        survey_title: survey.title,
        trigger_type: survey.trigger_type || "email_link",
        answers: JSON.stringify(answerMap),
        overall_rating: overallRating,
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: t.shadowDark, borderTopColor: t.orange }} />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: t.bg }}>
        <div className="p-8 text-center" style={raised(24)}>
          <h2 className="text-xl font-black mb-2" style={{ color: t.text }}>Survey not found</h2>
          <p className="text-sm" style={{ color: t.textSoft }}>This survey link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: t.bg }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 text-center max-w-md"
          style={raised(28)}
        >
          <div
            className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full"
            style={{ background: `linear-gradient(135deg, ${t.orange}, ${t.orangeDeep})` }}
          >
            <Check className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-2" style={{ color: t.text }}>Thank you!</h2>
          <p className="text-base" style={{ color: t.textSoft }}>Your feedback has been received.</p>
        </motion.div>
      </div>
    );
  }

  const questions = survey.questions || [];

  return (
    <div className="min-h-screen p-6 sm:p-10" style={{ background: t.bg }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-12 h-12 flex items-center justify-center rounded-2xl"
            style={{ background: `linear-gradient(135deg, ${t.orange}, ${t.orangeDeep})` }}
          >
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: t.orangeDeep }}>{survey.title}</h1>
            {survey.description && <p className="text-sm" style={{ color: t.textSoft }}>{survey.description}</p>}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="p-6" style={raised(22)}>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: t.orange }}>
                Question {i + 1}
              </div>
              <h2 className="text-lg font-bold mb-4" style={{ color: t.text }}>{q.prompt}</h2>

              {q.type === "rating" && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setAnswers({ ...answers, [q.id]: n })}
                      className="flex-1 py-3 flex items-center justify-center"
                      style={{
                        ...pressable(answers[q.id] === n, 12),
                        color: answers[q.id] === n ? t.orangeDeep : t.textFaint,
                      }}
                    >
                      <Star className="w-5 h-5" fill={answers[q.id] >= n ? t.orange : "none"} />
                    </button>
                  ))}
                </div>
              )}

              {q.type === "text" && (
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Type your answer…"
                  rows={3}
                  className="w-full px-4 py-3 text-sm outline-none resize-none"
                  style={{ ...inset(12), color: t.text, border: "none" }}
                />
              )}

              {q.type === "choice" && (q.choices || []).map((choice) => (
                <button
                  key={choice}
                  onClick={() => setAnswers({ ...answers, [q.id]: choice })}
                  className="w-full text-left px-4 py-3 text-sm mb-2"
                  style={{
                    ...pressable(answers[q.id] === choice, 12),
                    color: answers[q.id] === choice ? t.orangeDeep : t.text,
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 text-sm font-bold"
            style={{
              borderRadius: 16,
              border: "none",
              color: t.onAccent,
              background: `linear-gradient(135deg, ${t.orange}, ${t.orangeDeep})`,
              boxShadow: `4px 4px 12px ${t.shadowDark}`,
              opacity: submitting ? 0.5 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting…" : "Submit survey"}
          </button>
        </div>
      </div>
    </div>
  );
}