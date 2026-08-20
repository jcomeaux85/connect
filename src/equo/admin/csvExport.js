// eQuo — CSV export utility for dashboard views.
// Leadership will ask for this eventually.

function csvEscape(val) {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportToCSV(filename, rows, headers) {
  const cols = headers || (rows.length ? Object.keys(rows[0]) : []);
  const lines = [cols.join(",")];
  for (const row of rows) {
    lines.push(cols.map((c) => csvEscape(row[c])).join(","));
  }
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function responsesToCSV(responses, surveys, questions) {
  const surveyMap = new Map(surveys.map((s) => [s.id, s]));
  const qMap = new Map(questions.map((q) => [q.id, q]));
  return responses.map((r) => ({
    date: surveyMap.get(r.survey_id)?.publish_date || "",
    survey: surveyMap.get(r.survey_id)?.title || "",
    question: r.question_text || qMap.get(r.question_id)?.text || "",
    respondent: r.is_anonymous ? "Anonymous" : (r.respondent_name || r.respondent_email),
    rating: r.rating ?? "",
    answer: r.answer_text || "",
    flagged: r.is_flagged ? "Yes" : "No",
    anonymous: r.is_anonymous ? "Yes" : "No",
  }));
}

export function moodsToCSV(moods) {
  return moods.map((m) => ({
    week_of: m.week_of,
    respondent: m.respondent_name || m.respondent_email,
    mood: m.mood_value,
    note: m.note || "",
  }));
}

export function shoutoutsToCSV(shoutouts) {
  return shoutouts.map((s) => ({
    date: s.created_date,
    from: s.from_name || s.from_email,
    to: s.to_name || s.to_email,
    message: s.message,
    public: s.is_public ? "Yes" : "No",
  }));
}