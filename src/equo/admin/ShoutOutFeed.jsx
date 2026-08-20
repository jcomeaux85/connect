// eQuo — public shout-out feed. Shows recent shout-outs from the team.
// Warm gold accent, distinct from the violet scoring palette.
import React from "react";
import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { equoTheme as t, raised, raisedSoft } from "../equoTheme";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ShoutOutFeed({ shoutouts, limit = 10 }) {
  const sorted = [...shoutouts]
    .filter((s) => s.is_public !== false)
    .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))
    .slice(0, limit);

  return (
    <div className="p-6" style={raised(24)}>
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(135deg, ${t.gold}, ${t.goldDeep})` }}
        >
          <Megaphone className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-black" style={{ color: t.text }}>Shout-outs</h3>
      </div>

      {sorted.length === 0 ? (
        <div className="p-6 text-center rounded-2xl" style={raisedSoft(16)}>
          <p className="text-sm" style={{ color: t.textSoft }}>No shout-outs yet. Recognize a coworker to get the feed started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 flex items-start gap-3"
              style={raisedSoft(16)}
            >
              <div
                className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-black text-white"
                style={{ background: `linear-gradient(135deg, ${t.gold}, ${t.goldDeep})` }}
              >
                {(s.from_name || s.from_email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold mb-0.5" style={{ color: t.text }}>
                  {s.from_name || s.from_email}
                  <span className="font-normal" style={{ color: t.textFaint }}> → </span>
                  <span style={{ color: t.goldDeep }}>{s.to_name || s.to_email}</span>
                  <span className="ml-2 font-normal text-[10px]" style={{ color: t.textFaint }}>{timeAgo(s.created_date)}</span>
                </div>
                <p className="text-sm" style={{ color: t.textSoft }}>{s.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}