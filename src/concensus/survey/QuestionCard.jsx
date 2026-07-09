// Concensus — one question at a time: prompt, answer box, rating slider, flag.
import React from "react";
import { motion } from "framer-motion";
import { concensusTheme as t, raised } from "../concensusTheme";
import { NeuTextarea } from "../ConcensusPrimitives";
import RatingSlider from "./RatingSlider";
import FlagButton from "./FlagButton";

export default function QuestionCard({ question, index, total, answer, onChange }) {
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
          </div>
          <h2 className="text-xl sm:text-2xl font-bold leading-snug" style={{ color: t.text }}>
            {question.text}
          </h2>
        </div>
        {/* Flag lives far top-right, hard to hit by accident */}
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

      <div className="mt-6">
        <RatingSlider value={answer.rating} onChange={(rating) => onChange({ ...answer, rating })} />
      </div>
    </motion.div>
  );
}