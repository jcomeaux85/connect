// eQuo — weekly mood check. 5-second, under-five-seconds mood prompt with a
// 1-5 emoji-style scale and optional one-line note. Separate from the main
// survey. Sustained low mood (<=2 for 3+ weeks) auto-creates an EquoAlert.
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { equoTheme as t, raised, inset } from "../equoTheme";
import { NeuPrimaryButton, NeuTextarea } from "../EquoPrimitives";
import { equoApi } from "../equoApi";
import { moodLabel, moodColor } from "../equoTheme";

const MOODS = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

export default function MoodCheck({ user, weekOf, onDone }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const handleSubmit = async () => {
    if (value == null) return;
    setSubmitting(true);
    try {
      await equoApi.createMood({
        respondent_email: user.email,
        respondent_name: user.full_name || user.email,
        week_of: weekOf,
        mood_value: value,
        note: note.trim() || undefined,
      });
      await equoApi.checkMoodStreak(user.email, user.full_name || user.email);
      queryClient.invalidateQueries({ queryKey: ["equo-my-mood"] });
      queryClient.invalidateQueries({ queryKey: ["equo-admin"] });
      onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed bottom-6 right-6 z-[180]"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="p-6 w-80"
        style={raised(24)}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-black" style={{ color: t.violetDeep }}>Weekly mood check</div>
            <div className="text-[10px] font-medium" style={{ color: t.textFaint }}>Takes 5 seconds</div>
          </div>
          <button
            onClick={onDone}
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ background: t.surface, boxShadow: `2px 2px 6px ${t.shadowDark}, -2px -2px 6px ${t.shadowLight}` }}
          >
            <X className="w-3.5 h-3.5" style={{ color: t.textSoft }} />
          </button>
        </div>

        <p className="text-xs mb-4" style={{ color: t.textSoft }}>How are you feeling this week?</p>

        <div className="flex justify-between mb-4">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setValue(m.value)}
              className="flex flex-col items-center gap-1 transition-transform"
              style={{
                transform: value === m.value ? "scale(1.15)" : "scale(1)",
                transition: "transform 0.15s ease",
              }}
            >
              <div
                className="w-11 h-11 flex items-center justify-center rounded-full text-xl"
                style={{
                  background: value === m.value ? moodColor(m.value) : t.bg,
                  boxShadow: value === m.value
                    ? `0 0 12px ${moodColor(m.value)}88`
                    : `inset 2px 2px 5px ${t.shadowDark}, inset -2px -2px 5px ${t.shadowLight}`,
                }}
              >
                {m.emoji}
              </div>
              <span
                className="text-[9px] font-bold"
                style={{ color: value === m.value ? moodColor(m.value) : t.textFaint }}
              >
                {m.label}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {value != null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {!showNote ? (
                <button
                  onClick={() => setShowNote(true)}
                  className="text-xs font-semibold mb-3"
                  style={{ color: t.violet }}
                >
                  + Add a note (optional)
                </button>
              ) : (
                <div className="mb-3">
                  <NeuTextarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="One line about why…"
                    rows={2}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <NeuPrimaryButton
          onClick={handleSubmit}
          disabled={value == null || submitting}
          className="w-full"
          style={{ padding: "10px 16px" }}
        >
          {submitting ? "Saving…" : "Save mood"}
        </NeuPrimaryButton>
      </motion.div>
    </motion.div>
  );
}