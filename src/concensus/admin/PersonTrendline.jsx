// Concensus — per-person average rating over time (across surveys).
import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { concensusTheme as t, raised, inset } from "../concensusTheme";

export default function PersonTrendline({ responses, surveys }) {
  // Build person list from responses.
  const people = useMemo(() => {
    const map = {};
    responses.forEach((r) => {
      map[r.respondent_email] = r.respondent_name || r.respondent_email;
    });
    return Object.entries(map).map(([email, name]) => ({ email, name }));
  }, [responses]);

  const [selected, setSelected] = useState("");
  const activeEmail = selected || people[0]?.email || "";

  const surveyDate = useMemo(() => {
    const m = {};
    surveys.forEach((s) => { m[s.id] = s.publish_date; });
    return m;
  }, [surveys]);

  const data = useMemo(() => {
    const rows = responses.filter((r) => r.respondent_email === activeEmail);
    // Average rating per survey, ordered by survey publish_date.
    const bySurvey = {};
    rows.forEach((r) => {
      const key = r.survey_id;
      (bySurvey[key] = bySurvey[key] || []).push(r.rating);
    });
    return Object.entries(bySurvey)
      .map(([sid, ratings]) => ({
        date: surveyDate[sid] || "",
        avg: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
      }))
      .filter((d) => d.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [responses, activeEmail, surveyDate]);

  return (
    <div className="p-6" style={raised(24)}>
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-black" style={{ color: t.text }}>Per-person trendline</h3>
          <p className="text-xs" style={{ color: t.textSoft }}>Average rating across all surveys over time</p>
        </div>
        <select
          value={activeEmail}
          onChange={(e) => setSelected(e.target.value)}
          className="px-4 py-2.5 text-sm font-semibold outline-none"
          style={{ ...inset(12), color: t.text, border: "none" }}
        >
          {people.map((p) => (
            <option key={p.email} value={p.email}>{p.name}</option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm" style={{ color: t.textFaint }}>
          No responses yet for this person.
        </div>
      ) : (
        <div className="h-56 rounded-2xl p-3" style={inset(18)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.shadowDark} opacity={0.5} />
              <XAxis dataKey="date" tick={{ fill: t.textSoft, fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fill: t.textSoft, fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: t.surface, border: "none", borderRadius: 12, boxShadow: `4px 4px 12px ${t.shadowDark}` }}
                labelStyle={{ color: t.text }}
              />
              <Line type="monotone" dataKey="avg" stroke={t.violetDeep} strokeWidth={3} dot={{ r: 4, fill: t.violet }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}