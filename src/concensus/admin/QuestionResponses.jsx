// Concensus — drill-down into individual employee answers for one question.
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { concensusTheme as t, raisedSoft, inset, ratingColor } from "../concensusTheme";

export default function QuestionResponses({ question, count, avg, responses }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4" style={raisedSoft(14)}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-4 text-left">
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
          <motion.div animate={{ rotate: open ? 180 : 0 }}>
            <ChevronDown className="w-4 h-4" style={{ color: t.textSoft }} />
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
            <div className="pt-4 space-y-2">
              {responses.length === 0 && (
                <p className="text-xs px-1" style={{ color: t.textFaint }}>No responses yet.</p>
              )}
              {responses.map((r) => (
                <div key={r.id} className="p-3 flex items-start gap-3 rounded-xl" style={inset(12)}>
                  <div
                    className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: ratingColor(r.rating) }}
                  >
                    {r.rating}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black" style={{ color: t.text }}>
                      {r.respondent_name || r.respondent_email}
                    </div>
                    {r.answer_text ? (
                      <p className="text-xs mt-0.5" style={{ color: t.textSoft }}>{r.answer_text}</p>
                    ) : (
                      <p className="text-xs mt-0.5 italic" style={{ color: t.textFaint }}>No comment</p>
                    )}
                  </div>
                  {r.is_flagged && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0" style={{ background: t.peach, color: t.amberDeep }}>
                      Flagged
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}