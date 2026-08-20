// eQuo — team mood trend chart. Aggregates all mood checks into a team
// sentiment line over time (average mood per week).
import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { equoTheme as t, raised, inset } from "../equoTheme";

export default function MoodTrendChart({ moods }) {
  const data = useMemo(() => {
    const byWeek = {};
    moods.forEach((m) => {
      (byWeek[m.week_of] = byWeek[m.week_of] || []).push(m.mood_value);
    });
    return Object.entries(byWeek)
      .map(([week, vals]) => ({
        week,
        avg: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
        count: vals.length,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [moods]);

  return (
    <div className="p-6" style={raised(24)}>
      <h3 className="text-lg font-black mb-1" style={{ color: t.text }}>Team mood trend</h3>
      <p className="text-xs mb-4" style={{ color: t.textSoft }}>Average mood (1-5) across the team over time</p>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm" style={{ color: t.textFaint }}>
          No mood checks yet.
        </div>
      ) : (
        <div className="h-48 rounded-2xl p-3" style={inset(18)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.shadowDark} opacity={0.5} />
              <XAxis dataKey="week" tick={{ fill: t.textSoft, fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fill: t.textSoft, fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: t.surface, border: "none", borderRadius: 12, boxShadow: `4px 4px 12px ${t.shadowDark}` }}
                labelStyle={{ color: t.text }}
              />
              <Line type="monotone" dataKey="avg" stroke={t.peachAccent} strokeWidth={3} dot={{ r: 4, fill: t.peachAccent }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}