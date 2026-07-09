// Concensus — unresolved alerts, shown above everything for admins. Warm amber /
// soft red, never harsh system red. Visible unread count. Resolve inline.
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Flag, Check } from "lucide-react";
import { concensusTheme as t, raised, raisedSoft } from "../concensusTheme";

function reasonMeta(reason) {
  if (reason === "flagged") return { label: "Flagged", icon: Flag };
  if (reason === "low_rating") return { label: "Low rating", icon: AlertTriangle };
  return { label: "Flagged + low rating", icon: AlertTriangle };
}

export default function AlertsBanner({ alerts, onResolve }) {
  const unresolved = alerts.filter((a) => !a.is_resolved);
  if (unresolved.length === 0) return null;

  return (
    <div
      className="p-6 mb-8"
      style={{
        ...raised(24),
        background: `linear-gradient(135deg, ${t.cream}, ${t.peach})`,
        boxShadow: `7px 7px 18px ${t.shadowDark}, -7px -7px 18px ${t.shadowLight}, inset 0 0 0 1.5px ${t.amber}55`,
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-11 h-11 flex items-center justify-center rounded-2xl"
          style={{ background: `linear-gradient(135deg, ${t.amber}, ${t.softRed})`, boxShadow: `3px 3px 8px ${t.shadowDark}` }}
        >
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-black" style={{ color: t.amberDeep }}>Attention needed</h3>
          <p className="text-xs font-semibold" style={{ color: t.textSoft }}>
            {unresolved.length} unresolved {unresolved.length === 1 ? "alert" : "alerts"} from recent responses
          </p>
        </div>
        <div
          className="ml-auto min-w-[32px] h-8 px-2.5 flex items-center justify-center rounded-full text-sm font-black text-white"
          style={{ background: t.softRedDeep, boxShadow: "0 0 10px rgba(201,106,92,0.5)" }}
        >
          {unresolved.length}
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {unresolved.map((a) => {
            const meta = reasonMeta(a.reason);
            const Icon = meta.icon;
            return (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="p-4 flex items-start gap-4"
                style={raisedSoft(16)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                      style={{ background: a.reason === "flagged" ? t.softRedDeep : t.amberDeep }}
                    >
                      <Icon className="w-3 h-3" /> {meta.label}
                    </span>
                    <span className="text-sm font-bold" style={{ color: t.text }}>{a.respondent_name || a.respondent_email}</span>
                    {typeof a.rating === "number" && (
                      <span className="text-xs font-bold" style={{ color: t.softRedDeep }}>· rated {a.rating}/10</span>
                    )}
                  </div>
                  {a.question_text && (
                    <p className="text-xs font-semibold mb-0.5" style={{ color: t.textSoft }}>{a.question_text}</p>
                  )}
                  {a.answer_text && (
                    <p className="text-sm italic" style={{ color: t.text }}>"{a.answer_text}"</p>
                  )}
                </div>
                <button
                  onClick={() => onResolve(a.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl shrink-0"
                  style={{ background: t.surface, color: t.violetDeep, boxShadow: `3px 3px 8px ${t.shadowDark}, -3px -3px 8px ${t.shadowLight}` }}
                >
                  <Check className="w-3.5 h-3.5" /> Resolve
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}