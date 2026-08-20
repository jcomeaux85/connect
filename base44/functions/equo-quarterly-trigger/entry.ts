// eQuo — quarterly behavioral module trigger. Fires once per quarter.
// Creates a quarterly response slot for each employee. The actual question
// bank and scoring logic is a stub — the user will swap the real eQuo build
// into fetchQuarterlyQuestions() later.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function getQuarterKey(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const q = Math.floor(m / 3) + 1;
  return `${y}-Q${q}`;
}

// STUB — swap with real question bank logic later
function fetchQuarterlyQuestions() {
  return [
    { id: "q1", prompt: "How has your role evolved this quarter?", type: "text" },
    { id: "q2", prompt: "What's one thing you want to focus on next quarter?", type: "text" },
  ];
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const quarterKey = getQuarterKey();
    const today = new Date().toISOString().slice(0, 10);

    // Check if we already fired this quarter
    const existing = await svc.entities.EquoQuarterlyResponse.filter({ quarter_key: quarterKey });
    if (existing.length > 0) {
      return Response.json({ message: "Quarterly already triggered", quarterKey, count: existing.length });
    }

    // Fetch the quarterly questions (stub)
    const questions = fetchQuarterlyQuestions();

    // Create a quarterly response slot for each user
    const users = await svc.entities.User.list();
    let created = 0;
    for (const u of users) {
      await svc.entities.EquoQuarterlyResponse.create({
        respondent_email: u.email,
        respondent_name: u.full_name || u.email,
        quarter_key: quarterKey,
        quarter_date: today,
        answers: JSON.stringify({ questions, answers: {} }), // stub — real answers filled later
      });
      created += 1;
    }

    return Response.json({ created, quarterKey, questionsCount: questions.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}