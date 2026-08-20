// eQuo — weekly manager digest. Sends each admin/manager an email summarizing
// their direct reports' status, flags, and mood for the week.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const todayStr = () => new Date().toISOString().slice(0, 10);

function getWeekOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const weekOf = getWeekOf();

    // Load all data
    const [users, surveys, responses, alerts, moods] = await Promise.all([
      svc.entities.User.list(),
      svc.entities.EquoSurvey.list("-publish_date"),
      svc.entities.EquoResponse.list("-created_date", 1000),
      svc.entities.EquoAlert.list("-created_date", 500),
      svc.entities.EquoMood.list("-created_date", 1000),
    ]);

    const realResponses = responses.filter((r) => !r.is_test);
    const realAlerts = alerts.filter((a) => !a.is_test && !a.is_resolved);
    const realMoods = moods.filter((m) => !m.is_test);

    // Find this week's survey
    const thisWeekSurvey = surveys.find((s) => s.status === "active" && !s.is_test);
    const weekResponses = thisWeekSurvey
      ? realResponses.filter((r) => r.survey_id === thisWeekSurvey.id)
      : [];
    const weekMoods = realMoods.filter((m) => m.week_of === weekOf);

    // Build per-employee summary
    const employeeMap = new Map();
    for (const u of users) {
      employeeMap.set(u.email, {
        name: u.full_name || u.email,
        email: u.email,
        responded: false,
        rating: null,
        flagged: false,
        mood: null,
        alerts: 0,
      });
    }

    for (const r of weekResponses) {
      const emp = employeeMap.get(r.respondent_email);
      if (!emp) continue;
      emp.responded = true;
      if (r.rating != null) emp.rating = r.rating;
      if (r.is_flagged) emp.flagged = true;
    }

    for (const m of weekMoods) {
      const emp = employeeMap.get(m.respondent_email);
      if (emp) emp.mood = m.mood_value;
    }

    for (const a of realAlerts) {
      const emp = employeeMap.get(a.respondent_email);
      if (emp) emp.alerts += 1;
    }

    const employees = [...employeeMap.values()];
    const participated = employees.filter((e) => e.responded).length;
    const participationRate = employees.length ? Math.round((participated / employees.length) * 100) : 0;

    // Build email body
    const lines = [
      `<h2>eQuo Weekly Digest — ${weekOf}</h2>`,
      `<p><strong>Participation:</strong> ${participationRate}% (${participated}/${employees.length})</p>`,
      `<h3>Team status:</h3>`,
      `<table style="border-collapse:collapse;width:100%;">`,
      `<tr style="background:#f3eefb;"><th style="text-align:left;padding:6px;">Name</th><th>Responded</th><th>Rating</th><th>Mood</th><th>Flags</th><th>Alerts</th></tr>`,
    ];

    for (const e of employees) {
      lines.push(
        `<tr style="border-bottom:1px solid #eee;">`,
        `<td style="padding:6px;">${e.name}</td>`,
        `<td style="text-align:center;">${e.responded ? "✓" : "—"}</td>`,
        `<td style="text-align:center;">${e.rating ?? "—"}</td>`,
        `<td style="text-align:center;">${e.mood ?? "—"}</td>`,
        `<td style="text-align:center;">${e.flagged ? "⚠" : "—"}</td>`,
        `<td style="text-align:center;">${e.alerts || "—"}</td>`,
        `</tr>`
      );
    }
    lines.push(`</table>`);

    if (realAlerts.length > 0) {
      lines.push(`<h3>Open alerts (${realAlerts.length}):</h3><ul>`);
      for (const a of realAlerts.slice(0, 10)) {
        lines.push(`<li><strong>${a.respondent_name || a.respondent_email}</strong> — ${a.reason}: ${a.answer_text || ""}</li>`);
      }
      lines.push(`</ul>`);
    }

    const body = lines.join("\n");

    // Send to each admin
    const admins = users.filter((u) => u.role === "admin");
    let sent = 0;
    for (const admin of admins) {
      try {
        await svc.integrations.Core.SendEmail({
          to: admin.email,
          subject: `eQuo Weekly Digest — ${weekOf}`,
          body,
        });
        sent += 1;
      } catch {
        // Email send may fail for non-registered users; continue
      }
    }

    return Response.json({ sent, participationRate, totalEmployees: employees.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}