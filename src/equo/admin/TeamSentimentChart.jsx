// eQuo — team sentiment over time. Combines survey ratings + mood into a
// single sentiment line on the admin dashboard.
import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { equoTheme as t, raised, inset } from "../equoTheme";

export default function TeamSentimentChart({ responses, moods, surveys }) {
  const data = useMemo(() => {
    const surveyDate = new Map(surveys.map((s) => [s.id, s.publish_date]));
    const byDate = {};

    // Survey ratings (normalize 1-10 to 0-100)
    responses.forEach((r) => {
      if (r.rating == null) return;
      const date = surveyDate.get(r.survey_id);
      if (!date) return;
      (byDate[date] = byDate[date] || { ratingSum: 0, ratingCount: 0, moodSum: 0, moodCount: 0 });
      byDate[date].ratingSum += r.rating;
      byDate[date].ratingCount += 1;
    });

    // Mood (normalize 1-5 to 0-100)
    moods.forEach((m) => {
      (byDate[m.week_of] = byDate[m.week_of] || { ratingSum: 0, ratingCount: 0, moodSum: 0, moodCount: 0 });
      byDate[m.week_of].moodSum += m.mood_value;
      byDate[m.week_of].moodCount += 1;
    });

    return Object.entries(byDate)
      .map(([date, v]) => {
        const ratingAvg = v.ratingCount ? v.ratingSum / v.ratingCount : null;
        const moodAvg = v.moodCount ? v.moodSum / v.moodCount : null;
        // Combined sentiment: weighted average normalized to 0-100
        let sentiment = null;
        if (ratingAvg != null && moodAvg != null) {
          sentiment = Math.round(((ratingAvg / 10) * 0.6 + (moodAvg / 5) * 0.4) * 100);
        } else if (ratingAvg != null) {
          sentiment = Math.round((ratingAvg / 10) * 100);
        } else if (moodAvg != null) {
          sentiment = Math.round((moodAvg / 5) * 100);
        }
        return { date, sentiment, rating: ratingAvg ? Math.round(ratingAvg * 10) / 10 : null, mood: moodAvg ? Math.round(moodAvg * 10) / 10 : null };
      })
      .filter((d) => d.sentiment != null)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [responses, moods, surveys]);

  return (
    <div className="p-6" style={raised(24)}>
      <h3 className="text-lg font-black mb-1" style={{ color: t.text }}>Team sentiment</h3>
      <p className="text-xs mb-4" style={{ color: t.textSoft }}>Combined survey ratings + mood, normalized to 0-100</p>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm" style={{ color: t.textFaint }}>
          Not enough data yet.
        </div>
      ) : (
        <div className="h-48 rounded-2xl p-3" style={inset(18)}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
              <defs>
                <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.violet} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={t.violet} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.shadowDark} opacity={0.5} />
              <XAxis dataKey="date" tick={{ fill: t.textSoft, fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: t.textSoft, fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: t.surface, border: "none", borderRadius: 12, boxShadow: `4px 4px 12px ${t.shadowDark}` }}
                labelStyle={{ color: t.text }}
              />
              <Area type="monotone" dataKey="sentiment" stroke={t.violetDeep} strokeWidth={2} fill="url(#sentimentGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}