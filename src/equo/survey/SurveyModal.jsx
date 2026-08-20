// eQuo — full-screen paginated survey. One question at a time; submit on
// the last question sends everything at once. Includes anonymity toggle
// when the survey allows it.
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { equoTheme as t } from "../equoTheme";
import { NeuButton, NeuPrimaryButton } from "../EquoPrimitives";
import QuestionCard from "./QuestionCard";
import EquoSuccess from "./EquoSuccess";
import AnonymityToggle from "./AnonymityToggle";
import { submitEquo } from "../submitEquo";

export default function SurveyModal({ survey, questions, user, onClose }) {
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [answers, setAnswers] = useState(() =>
    questions.map((q) => ({
      question: q,
      text: "",
      rating: q.question_type === "free_text" ? null : 7,
      flagged: false,
      anonymous: false,
    }))
  );

  const total = questions.length;
  const isLast = index === total - 1;
  const setAnswer = (a) => setAnswers((prev) => prev.map((x, i) => (i === index ? a : x)));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const finalAnswers = answers.map((a) => ({ ...a, anonymous }));
      await submitEquo({ survey, user, answers: finalAnswers });
      queryClient.invalidateQueries({ queryKey: ["equo-active-survey"] });
      queryClient.invalidateQueries({ queryKey: ["equo-admin"] });
      queryClient.invalidateQueries({ queryKey: ["equo-employee"] });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      style={{
        background: "rgba(250, 247, 255, 0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="w-full max-w-2xl">
        {done ? (
          <div className="flex justify-center">
            <EquoSuccess name={user?.full_name} onDone={onClose} />
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.94, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <div className="text-lg font-black" style={{ color: t.violetDeep }}>eQuo</div>
                <div className="text-xs font-medium" style={{ color: t.textSoft }}>Your weekly check-in</div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full"
                style={{ background: t.surface, boxShadow: `3px 3px 8px ${t.shadowDark}, -3px -3px 8px ${t.shadowLight}` }}
              >
                <X className="w-4 h-4" style={{ color: t.textSoft }} />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-5 px-1">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-all"
                  style={{ background: i <= index ? t.violet : t.shadowDark }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <QuestionCard
                key={questions[index].id}
                question={questions[index]}
                index={index}
                total={total}
                answer={answers[index]}
                onChange={setAnswer}
              />
            </AnimatePresence>

            {/* Anonymity toggle (only if survey allows it) */}
            {survey.is_anonymous && (
              <div className="mt-4 px-1">
                <AnonymityToggle anonymous={anonymous} onToggle={setAnonymous} />
              </div>
            )}

            {/* Nav */}
            <div className="flex items-center justify-between mt-5 px-1">
              <NeuButton
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </NeuButton>

              {isLast ? (
                <NeuPrimaryButton onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit eQuo"}
                </NeuPrimaryButton>
              ) : (
                <NeuPrimaryButton onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}>
                  <span className="flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></span>
                </NeuPrimaryButton>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}