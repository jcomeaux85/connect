// eQuo — Friday reminder + auto-publish. Scheduled weekly (Friday).
// Auto-publishes scheduled questions, then nudges every employee who hasn't
// completed this week's check-in. One polite end-of-day escalation, not a nag.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const today = todayStr();

    // 1. Auto-publish scheduled questions due today or earlier
    const questions = await svc.entities.EquoQuestion.filter({ status: "scheduled" });
    const due = questions.filter((q) => q.publish_date && q.publish_date <= today);
    const byDate = {};
    due.forEach((q) => { (byDate[q.publish_date] = byDate[q.publish_date] || []).push(q); });

    let published = 0;
    for (const [date, qs] of Object.entries(byDate)) {
      let survey = (await svc.entities.EquoSurvey.filter({ publish_date: date }))[0];
      if (!survey) {
        survey = await svc.entities.EquoSurvey.create({
          title: `Weekly eQuo — ${date}`,
          publish_date: date,
          status: "active",
        });
      }
      for (const q of qs) {
        await svc.entities.EquoQuestion.update(q.id, { status: "published", survey_id: survey.id });
        published += 1;
      }
    }

    // 2. Find this week's active survey
    const surveys = await svc.entities.EquoSurvey.list("-publish_date");
    const thisWeekSurvey = surveys.find((s) => s.status === "active" && !s.is_test);
    if (!thisWeekSurvey) {
      return Response.json({ published, nudged: 0, message: "No active survey to nudge for." });
    }

    // 3. Find all employees (users) who haven't responded this week
    const users = await svc.entities.User.list();
    const responses = await svc.entities.EquoResponse.filter({ survey_id: thisWeekSurvey.id });
    const respondedEmails = new Set(responses.map((r) => r.respondent_email));
    const incomplete = users.filter((u) => !respondedEmails.has(u.email));

    // 4. Nudge each incomplete employee with a Notification
    let nudged = 0;
    for (const u of incomplete) {
      await svc.entities.Notification.create({
        user_email: u.email,
        title: "Your weekly eQuo is waiting",
        message: "Take 2 minutes to share how your week went. Your weekly check-in is ready.",
        type: "reminder",
        is_read: false,
      });
      nudged += 1;
    }

    return Response.json({ published, nudged, surveyDate: thisWeekSurvey.publish_date });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}