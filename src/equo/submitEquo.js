// eQuo — submit all responses for a survey at once, then raise alerts for
// flagged or low-rated responses. Flag now notifies an admin (Notification entity).
import { equoApi } from "./equoApi";
import { base44 } from "@/api/base44Client";

export async function submitEquo({ survey, user, answers }) {
  const isAnonymous = !!survey.is_anonymous && answers.some((a) => a.anonymous);

  const rows = answers.map((a) => ({
    survey_id: survey.id,
    question_id: a.question.id,
    question_text: a.question.text,
    respondent_email: user.email,
    respondent_name: user.full_name || user.email,
    answer_text: a.text || "",
    rating: a.question.question_type === "free_text" ? null : a.rating,
    is_flagged: !!a.flagged,
    is_anonymous: isAnonymous,
  }));

  const created = await equoApi.createResponses(rows);

  // Create alerts for flagged or low-rated responses.
  const alertJobs = [];
  (created || []).forEach((resp, i) => {
    const a = answers[i];
    const low = a.rating != null && a.rating <= 3;
    const flagged = !!a.flagged;
    if (!low && !flagged) return;
    const reason = flagged && low ? "flagged_and_low" : flagged ? "flagged" : "low_rating";
    alertJobs.push(
      equoApi.createAlert({
        response_id: resp?.id,
        survey_id: survey.id,
        question_text: a.question.text,
        respondent_email: user.email,
        respondent_name: user.full_name || user.email,
        answer_text: a.text || "",
        rating: a.rating,
        reason,
        alert_type: "survey",
        is_resolved: false,
      })
    );
  });

  // Flag button now notifies an admin via the Notification entity
  if (answers.some((a) => a.flagged)) {
    try {
      const admins = await base44.entities.User.list();
      const flagQ = answers.find((a) => a.flagged);
      for (const admin of admins.filter((u) => u.role === "admin")) {
        await base44.entities.Notification.create({
          user_email: admin.email,
          title: "eQuo flag raised",
          message: `${user.full_name || user.email} flagged a response: "${flagQ?.question?.text || ""}"`,
          type: "alert",
          is_read: false,
        });
      }
    } catch {
      // Notification is best-effort — don't block submission
    }
  }

  await Promise.all(alertJobs);

  // Check mood streak after submission (in case mood was also submitted)
  await equoApi.checkMoodStreak(user.email, user.full_name || user.email);

  return created;
}