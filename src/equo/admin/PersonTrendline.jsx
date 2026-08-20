// eQuo — per-person average rating over time (extended: now also shows mood
// overlay when mood data is provided). Respects anonymity — anonymous responses
// are included in aggregate but the person selector only shows non-anonymous.
import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { equoTheme as t, raised, inset } from "../equoTheme";

export default function PersonTrendline({ responses, surveys, moods = [] }) {
  const people = useMemo(() => {
    const map = {};
    responses.forEach((r) => {
      if (r.is_anonymous) return; // don't list anonymous respondents by name
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

  const ratingData = useMemo(() => {
    const rows = responses.filter((r) => r.respondent_email === activeEmail && r.rating != null);
    const bySurvey = {};
    rows.forEach((r) => {
      (bySurvey[r.survey_id] = bySurvey[r.survey_id] || []).push(r.rating);
    });
    return Object.entries(bySurvey)
      .map(([sid, ratings]) => ({
        date: surveyDate[sid] || "",
        avg: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
      }))
      .filter((d) => d.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [responses, activeEmail, surveyDate]);

  const moodData = useMemo(() => {
    return moods
      .filter((m) => m.respondent_email === activeEmail)
      .map((m) => ({ date: m.week_of, mood: m.mood_value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [moods, activeEmail]);

  // Merge for combined chart
  const combined = useMemo(() => {
    const map = {};
    ratingData.forEach((d) => { map[d.date] = { ...map[d.date], date: d.date, avg: d.avg }; });
    moodData.forEach((d) => { map[d.date] = { ...map[d.date], date: d.date, mood: d.mood }; });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [ratingData, moodData]);

  return (
    <div className="p-6" style={raised(24)}>
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-black" style={{ color: t.text }}>Per-person trendline</h3>
          <p className="text-xs" style={{ color: t.textSoft }}>Average rating + mood over time</p>
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

      {combined.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm" style={{ color: t.textFaint }}>
          No responses yet for this person.
        </div>
      ) : (
        <div className="h-56 rounded-2xl p-3" style={inset(18)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combined} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.shadowDark} opacity={0.5} />
              <XAxis dataKey="date" tick={{ fill: t.textSoft, fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fill: t.textSoft, fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: t.surface, border: "none", borderRadius: 12, boxShadow: `4px 4px 12px ${t.shadowDark}` }}
                labelStyle={{ color: t.text }}
              />
              <Line type="monotone" dataKey="avg" name="Rating" stroke={t.violetDeep} strokeWidth={3} dot={{ r: 4, fill: t.violet }} />
              <Line type="monotone" dataKey="mood" name="Mood" stroke={t.peachAccent} strokeWidth={2} dot={{ r: 3, fill: t.peachAccent }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}