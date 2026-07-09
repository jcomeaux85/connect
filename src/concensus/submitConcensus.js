// Concensus — submit all responses for a survey at once, then raise alerts for
// any flagged response or any rating <= 3.
import { concensusApi } from "./concensusApi";

export async function submitConcensus({ survey, user, answers }) {
  // answers: [{ question, text, rating, flagged }]
  const rows = answers.map((a) => ({
    survey_id: survey.id,
    question_id: a.question.id,
    question_text: a.question.text,
    respondent_email: user.email,
    respondent_name: user.full_name || user.email,
    answer_text: a.text || "",
    rating: a.rating,
    is_flagged: !!a.flagged,
  }));

  const created = await concensusApi.createResponses(rows);

  // Create alerts for flagged or low-rated responses.
  const alertJobs = [];
  (created || []).forEach((resp, i) => {
    const a = answers[i];
    const low = a.rating <= 3;
    const flagged = !!a.flagged;
    if (!low && !flagged) return;
    const reason = flagged && low ? "flagged_and_low" : flagged ? "flagged" : "low_rating";
    alertJobs.push(
      concensusApi.createAlert({
        response_id: resp?.id,
        survey_id: survey.id,
        question_text: a.question.text,
        respondent_email: user.email,
        respondent_name: user.full_name || user.email,
        answer_text: a.text || "",
        rating: a.rating,
        reason,
        is_resolved: false,
      })
    );
  });
  await Promise.all(alertJobs);
  return created;
}