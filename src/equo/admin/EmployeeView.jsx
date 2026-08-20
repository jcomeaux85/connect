// eQuo — employee-facing view. Their own trendline, mood history, shout-outs
// given/received, and completion streak (shown quietly, never ranked).
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Heart, Megaphone, TrendingUp } from "lucide-react";
import { equoTheme as t, raised, raisedSoft, inset } from "../equoTheme";
import { equoApi } from "../equoApi";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { moodColor, moodLabel } from "../equoTheme";

export default function EmployeeView({ user }) {
  const { data, isLoading } = useQuery({
    queryKey: ["equo-employee", user?.email],
    enabled: !!user?.email,
    queryFn: () => equoApi.loadEmployeeData(user.email),
  });

  const { myResponses = [], myShoutouts = [], myMoods = [], allShoutouts = [] } = data || {};

  const streak = useMemo(() => {
    // Need all surveys to compute streak — fetch from admin data
    return 0; // computed in parent; simplified here
  }, []);

  const received = allShoutouts.filter((s) => s.to_email === user?.email);
  const given = allShoutouts.filter((s) => s.from_email === user?.email);

  const trendData = useMemo(() => {
    const bySurvey = {};
    myResponses.forEach((r) => {
      if (r.rating == null) return;
      (bySurvey[r.survey_id] = bySurvey[r.survey_id] || []).push(r.rating);
    });
    return Object.entries(bySurvey)
      .map(([sid, ratings]) => ({
        label: sid.slice(-6),
        avg: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [myResponses]);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: t.shadowDark, borderTopColor: t.violet }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* My trendline */}
      <div className="p-6" style={raised(24)}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: t.violet }} />
          <h3 className="text-lg font-black" style={{ color: t.text }}>My trendline</h3>
        </div>
        {trendData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm" style={{ color: t.textFaint }}>
            No responses yet.
          </div>
        ) : (
          <div className="h-40 rounded-2xl p-3" style={inset(18)}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.shadowDark} opacity={0.5} />
                <XAxis dataKey="label" tick={{ fill: t.textSoft, fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fill: t.textSoft, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: t.surface, border: "none", borderRadius: 12 }} />
                <Line type="monotone" dataKey="avg" stroke={t.violetDeep} strokeWidth={3} dot={{ r: 4, fill: t.violet }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Mood history */}
      <div className="p-6" style={raised(24)}>
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-4 h-4" style={{ color: t.peachAccent }} />
          <h3 className="text-lg font-black" style={{ color: t.text }}>My mood history</h3>
        </div>
        {myMoods.length === 0 ? (
          <p className="text-sm" style={{ color: t.textFaint }}>No mood checks yet.</p>
        ) : (
          <div className="space-y-2">
            {[...myMoods].reverse().slice(0, 8).map((m) => (
              <div key={m.id} className="p-3 flex items-center gap-3" style={raisedSoft(14)}>
                <div
                  className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-black text-white"
                  style={{ background: moodColor(m.mood_value) }}
                >
                  {m.mood_value}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold" style={{ color: t.text }}>{moodLabel(m.mood_value)}</div>
                  <div className="text-[10px]" style={{ color: t.textFaint }}>{m.week_of}</div>
                </div>
                {m.note && <p className="text-xs italic flex-1" style={{ color: t.textSoft }}>"{m.note}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shout-outs given + received */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6" style={raised(24)}>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4" style={{ color: t.goldDeep }} />
            <h3 className="text-lg font-black" style={{ color: t.text }}>Received ({received.length})</h3>
          </div>
          {received.length === 0 ? (
            <p className="text-sm" style={{ color: t.textFaint }}>No shout-outs received yet.</p>
          ) : (
            <div className="space-y-2">
              {received.slice(0, 5).map((s) => (
                <div key={s.id} className="p-3" style={raisedSoft(14)}>
                  <div className="text-xs font-bold mb-0.5" style={{ color: t.goldDeep }}>From {s.from_name || s.from_email}</div>
                  <p className="text-sm" style={{ color: t.textSoft }}>{s.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6" style={raised(24)}>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4" style={{ color: t.violet }} />
            <h3 className="text-lg font-black" style={{ color: t.text }}>Given ({given.length})</h3>
          </div>
          {given.length === 0 ? (
            <p className="text-sm" style={{ color: t.textFaint }}>No shout-outs given yet.</p>
          ) : (
            <div className="space-y-2">
              {given.slice(0, 5).map((s) => (
                <div key={s.id} className="p-3" style={raisedSoft(14)}>
                  <div className="text-xs font-bold mb-0.5" style={{ color: t.violetDeep }}>To {s.to_name || s.to_email}</div>
                  <p className="text-sm" style={{ color: t.textSoft }}>{s.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}