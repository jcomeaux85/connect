// Concensus — warm submission confirmation.
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { concensusTheme as t, raised } from "../concensusTheme";

export default function ConcensusSuccess({ name, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-10 text-center max-w-md"
      style={raised(28)}
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full"
        style={{ background: `linear-gradient(135deg, ${t.violetSoft}, ${t.peach})` }}
      >
        <Sparkles className="w-9 h-9" style={{ color: t.violetDeep }} />
      </motion.div>
      <h2 className="text-2xl font-black mb-2" style={{ color: t.text }}>
        Concensus submitted
      </h2>
      <p className="text-base" style={{ color: t.textSoft }}>
        Thanks for your feedback this week{name ? `, ${name.split(" ")[0]}` : ""}. It genuinely helps. 💜
      </p>
    </motion.div>
  );
}