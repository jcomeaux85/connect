// Concensus — full-screen white-wash prompt shown when a user with a pending
// survey goes idle. Light, upbeat. A button opens the survey.
import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { concensusTheme as t, raised } from "../concensusTheme";
import { NeuPrimaryButton } from "../ConcensusPrimitives";

export default function IdlePrompt({ onOpen, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[190] flex items-center justify-center p-6"
      style={{
        background: "rgba(252, 250, 255, 0.86)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
        className="p-10 text-center max-w-md"
        style={raised(28)}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full"
          style={{ background: `linear-gradient(135deg, ${t.violetSoft}, ${t.peach})` }}
        >
          <Sparkles className="w-9 h-9" style={{ color: t.violetDeep }} />
        </motion.div>

        <h2 className="text-2xl font-black mb-2" style={{ color: t.text }}>
          Your weekly Concensus is ready ✨
        </h2>
        <p className="text-base mb-8" style={{ color: t.textSoft }}>
          A few quick questions — no pressure, just a moment to share how your week is going.
        </p>

        <div className="flex flex-col items-center gap-3">
          <NeuPrimaryButton onClick={onOpen} className="w-full">
            Start my check-in
          </NeuPrimaryButton>
          <button
            onClick={onDismiss}
            className="text-sm font-semibold"
            style={{ color: t.textFaint }}
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}