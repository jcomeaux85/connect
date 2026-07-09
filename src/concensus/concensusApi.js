// Concensus — API wrapper. ALL base44 SDK access for this module lives here,
// so the UI never talks to the platform directly. Swap this file to port the
// module to a different stack.

import { base44 } from "@/api/base44Client";

const todayStr = () => new Date().toISOString().slice(0, 10);

export const concensusApi = {
  // ---------- Auth ----------
  async me() {
    return base44.auth.me();
  },

  // ---------- Questions ----------
  async listQuestions() {
    return base44.entities.ConcensusQuestion.list("-created_date");
  },
  async createQuestion(data) {
    return base44.entities.ConcensusQuestion.create(data);
  },
  async updateQuestion(id, data) {
    return base44.entities.ConcensusQuestion.update(id, data);
  },
  async deleteQuestion(id) {
    return base44.entities.ConcensusQuestion.delete(id);
  },

  // ---------- Surveys ----------
  async listSurveys() {
    return base44.entities.ConcensusSurvey.list("-publish_date");
  },
  async createSurvey(data) {
    return base44.entities.ConcensusSurvey.create(data);
  },
  async findSurveyByDate(date) {
    const rows = await base44.entities.ConcensusSurvey.filter({ publish_date: date });
    return rows[0] || null;
  },

  // ---------- Responses ----------
  async listResponses() {
    return base44.entities.ConcensusResponse.list("-created_date", 1000);
  },
  async listResponsesForSurvey(surveyId) {
    return base44.entities.ConcensusResponse.filter({ survey_id: surveyId });
  },
  async listMyResponses(email) {
    return base44.entities.ConcensusResponse.filter({ respondent_email: email });
  },
  async createResponses(rows) {
    return base44.entities.ConcensusResponse.bulkCreate(rows);
  },

  // ---------- Alerts ----------
  async listAlerts() {
    return base44.entities.ConcensusAlert.list("-created_date", 500);
  },
  async createAlert(data) {
    return base44.entities.ConcensusAlert.create(data);
  },
  async resolveAlert(id) {
    return base44.entities.ConcensusAlert.update(id, {
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    });
  },

  // ---------- Auto-publish scheduled questions ----------
  // Checked once per session on app load. Groups all scheduled questions due
  // today (or earlier) into a single weekly survey per publish date.
  async runAutoPublish() {
    const questions = await base44.entities.ConcensusQuestion.filter({ status: "scheduled" });
    const today = todayStr();
    const due = questions.filter((q) => q.publish_date && q.publish_date <= today);
    if (due.length === 0) return { published: 0 };

    // Group by publish_date
    const byDate = {};
    due.forEach((q) => {
      (byDate[q.publish_date] = byDate[q.publish_date] || []).push(q);
    });

    let published = 0;
    for (const [date, qs] of Object.entries(byDate)) {
      // Reuse an existing survey for that date if one exists, else create one.
      let survey = await this.findSurveyByDate(date);
      if (!survey) {
        survey = await this.createSurvey({
          title: `Weekly Concensus — ${date}`,
          publish_date: date,
          status: "active",
        });
      }
      for (const q of qs) {
        await base44.entities.ConcensusQuestion.update(q.id, {
          status: "published",
          survey_id: survey.id,
        });
        published += 1;
      }
    }
    return { published };
  },
};

export { todayStr };