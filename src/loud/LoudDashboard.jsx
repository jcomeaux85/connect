// ALERA | loud — results dashboard. Shows survey list with submission counts,
// average ratings, and expandable results. Baked into BEN|connect.
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Star, Users, Link as LinkIcon, Phone } from "lucide-react";
import { useLoudTheme } from "./loudTheme";

function SurveyResultRow({ survey, submissions, t, raised, inset }) {
  const [open, setOpen] = useState(false);
  const surveySubs = submissions.filter((s) => s.survey_id === survey.id);
  const rated = surveySubs.filter((s) => s.overall_rating != null);
  const avg = rated.length
    ? Math.round((rated.reduce((a, s) => a + s.overall_rating, 0) / rated.length) * 10) / 10
    : 0;

  return (
    <div className="p-5" style={raised(22)}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-4 text-left">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black" style={{ color: t.text }}>{survey.title}</div>
          <div className="text-xs flex items-center gap-2" style={{ color: t.textSoft }}>
            {survey.trigger_type === "post_call" ? <Phone className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
            {survey.trigger_type === "post_call" ? "Post-call" : "Email link"}
            <span>· {surveySubs.length} submissions</span>
          </div>
        </div>
        {avg > 0 && (
          <div className="text-center">
            <div className="flex items-center gap-1 text-sm font-black" style={{ color: t.orangeDeep }}>
              <Star className="w-3.5 h-3.5" /> {avg}
            </div>
            <div className="text-[10px] font-semibold" style={{ color: t.textFaint }}>avg</div>
          </div>
        )}
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="w-5 h-5" style={{ color: t.textSoft }} />
        </motion.div>
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
              {surveySubs.length === 0 && (
                <p className="text-xs px-1" style={{ color: t.textFaint }}>No submissions yet.</p>
              )}
              {surveySubs.map((s) => (
                <div key={s.id} className="p-3 flex items-start gap-3" style={inset(12)}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold" style={{ color: t.text }}>
                      {s.respondent_name || s.respondent_email || s.customer_phone || "Anonymous"}
                    </div>
                    {s.answers && (
                      <p className="text-xs mt-0.5" style={{ color: t.textSoft }}>
                        {(() => {
                          try {
                            const ans = JSON.parse(s.answers);
                            return Object.entries(ans).map(([k, v]) => `${k}: ${v}`).join(" · ");
                          } catch { return ""; }
                        })()}
                      </p>
                    )}
                  </div>
                  {s.overall_rating != null && (
                    <div className="text-sm font-black" style={{ color: t.orangeDeep }}>{s.overall_rating}/5</div>
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

export default function LoudDashboard({ surveys, submissions }) {
  const { theme: t, raised, raisedSoft, inset } = useLoudTheme();
  const sorted = useMemo(() =>
    [...surveys].sort((a, b) => (b.created_date || "").localeCompare(a.created_date || "")),
  [surveys]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5" style={raised(20)}>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" style={{ color: t.orange }} />
            <span className="text-xs font-bold" style={{ color: t.textSoft }}>Total surveys</span>
          </div>
          <div className="text-2xl font-black" style={{ color: t.orangeDeep }}>{surveys.length}</div>
        </div>
        <div className="p-5" style={raised(20)}>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4" style={{ color: t.orange }} />
            <span className="text-xs font-bold" style={{ color: t.textSoft }}>Submissions</span>
          </div>
          <div className="text-2xl font-black" style={{ color: t.orangeDeep }}>{submissions.length}</div>
        </div>
        <div className="p-5" style={raised(20)}>
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4" style={{ color: t.orange }} />
            <span className="text-xs font-bold" style={{ color: t.textSoft }}>Post-call</span>
          </div>
          <div className="text-2xl font-black" style={{ color: t.orangeDeep }}>
            {surveys.filter((s) => s.trigger_type === "post_call").length}
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center" style={raised(24)}>
          <p className="text-sm" style={{ color: t.textSoft }}>No surveys yet. Create one to get started.</p>
        </div>
      ) : (
        sorted.map((survey) => (
          <SurveyResultRow key={survey.id} survey={survey} submissions={submissions} t={t} raised={raised} inset={inset} />
        ))
      )}
    </div>
  );
}