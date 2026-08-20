// eQuo — one question at a time: prompt, answer box, rating slider (for rating
// questions only), flag, and anonymity toggle.
import React from "react";
import { motion } from "framer-motion";
import { equoTheme as t, raised } from "../equoTheme";
import { NeuTextarea } from "../EquoPrimitives";
import RatingSlider from "./RatingSlider";
import FlagButton from "./FlagButton";

export default function QuestionCard({ question, index, total, answer, onChange, showAnonymity, anonymityToggle }) {
  const isFreeText = question.question_type === "free_text";
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-6 sm:p-8"
      style={raised(26)}
    >
      <div className="flex items-start justify-between gap-6 mb-5">
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: t.violet }}>
            Question {index + 1} of {total}
            {isFreeText && <span className="ml-2 px-2 py-0.5 rounded-full" style={{ background: t.peach, color: t.amberDeep }}>Free text</span>}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold leading-snug" style={{ color: t.text }}>
            {question.text}
          </h2>
        </div>
        <div className="pl-2">
          <FlagButton flagged={!!answer.flagged} onToggle={() => onChange({ ...answer, flagged: !answer.flagged })} />
        </div>
      </div>

      <NeuTextarea
        value={answer.text}
        onChange={(e) => onChange({ ...answer, text: e.target.value })}
        placeholder="Share what's on your mind this week…"
        rows={4}
      />

      {!isFreeText && (
        <div className="mt-6">
          <RatingSlider value={answer.rating} onChange={(rating) => onChange({ ...answer, rating })} />
        </div>
      )}
    </motion.div>
  );
}