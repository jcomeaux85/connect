// eQuo — API wrapper (renamed from concensusApi). ALL base44 SDK access for this
// module lives here, so the UI never talks to the platform directly.

import { base44 } from "@/api/base44Client";

const todayStr = () => new Date().toISOString().slice(0, 10);

// Filter out test/demo records unless explicitly included
const real = (rows) => (rows || []).filter((r) => !r.is_test);

export const equoApi = {
  // ---------- Auth ----------
  async me() {
    return base44.auth.me();
  },

  // ---------- Questions ----------
  async listQuestions() {
    return base44.entities.EquoQuestion.list("-created_date");
  },
  async createQuestion(data) {
    return base44.entities.EquoQuestion.create(data);
  },
  async updateQuestion(id, data) {
    return base44.entities.EquoQuestion.update(id, data);
  },
  async deleteQuestion(id) {
    return base44.entities.EquoQuestion.delete(id);
  },

  // ---------- Surveys ----------
  async listSurveys() {
    return base44.entities.EquoSurvey.list("-publish_date");
  },
  async createSurvey(data) {
    return base44.entities.EquoSurvey.create(data);
  },
  async findSurveyByDate(date) {
    const rows = await base44.entities.EquoSurvey.filter({ publish_date: date });
    return rows[0] || null;
  },

  // ---------- Responses ----------
  async listResponses() {
    return base44.entities.EquoResponse.list("-created_date", 1000);
  },
  async listResponsesForSurvey(surveyId) {
    return base44.entities.EquoResponse.filter({ survey_id: surveyId });
  },
  async listMyResponses(email) {
    return base44.entities.EquoResponse.filter({ respondent_email: email });
  },
  async createResponses(rows) {
    return base44.entities.EquoResponse.bulkCreate(rows);
  },

  // ---------- Alerts ----------
  async listAlerts() {
    return base44.entities.EquoAlert.list("-created_date", 500);
  },
  async createAlert(data) {
    return base44.entities.EquoAlert.create(data);
  },
  async resolveAlert(id) {
    return base44.entities.EquoAlert.update(id, {
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    });
  },

  // ---------- Shout-outs ----------
  async listShoutouts() {
    return base44.entities.EquoShoutout.list("-created_date", 500);
  },
  async createShoutout(data) {
    return base44.entities.EquoShoutout.create(data);
  },
  async listShoutoutsForUser(email) {
    const all = await this.listShoutouts();
    return all.filter((s) => s.to_email === email || s.from_email === email);
  },

  // ---------- Mood ----------
  async listMoods() {
    return base44.entities.EquoMood.list("-created_date", 1000);
  },
  async listMyMoods(email) {
    return base44.entities.EquoMood.filter({ respondent_email: email });
  },
  async createMood(data) {
    return base44.entities.EquoMood.create(data);
  },
  async findMoodForWeek(email, weekOf) {
    const rows = await base44.entities.EquoMood.filter({ respondent_email: email, week_of: weekOf });
    return rows[0] || null;
  },

  // ---------- Quarterly ----------
  async listQuarterlyResponses() {
    return base44.entities.EquoQuarterlyResponse.list("-created_date", 500);
  },
  async createQuarterlyResponse(data) {
    return base44.entities.EquoQuarterlyResponse.create(data);
  },

  // ---------- Auto-publish scheduled questions ----------
  async runAutoPublish() {
    const questions = await base44.entities.EquoQuestion.filter({ status: "scheduled" });
    const today = todayStr();
    const due = questions.filter((q) => q.publish_date && q.publish_date <= today);
    if (due.length === 0) return { published: 0 };

    const byDate = {};
    due.forEach((q) => {
      (byDate[q.publish_date] = byDate[q.publish_date] || []).push(q);
    });

    let published = 0;
    for (const [date, qs] of Object.entries(byDate)) {
      let survey = await this.findSurveyByDate(date);
      if (!survey) {
        survey = await this.createSurvey({
          title: `Weekly eQuo — ${date}`,
          publish_date: date,
          status: "active",
        });
      }
      for (const q of qs) {
        await base44.entities.EquoQuestion.update(q.id, {
          status: "published",
          survey_id: survey.id,
        });
        published += 1;
      }
    }
    return { published };
  },

  // ---------- Admin rollup data ----------
  async loadAdminData() {
    const [questions, surveys, responses, alerts, shoutouts, moods] = await Promise.all([
      this.listQuestions(),
      this.listSurveys(),
      this.listResponses(),
      this.listAlerts(),
      this.listShoutouts(),
      this.listMoods(),
    ]);
    return {
      questions: real(questions),
      surveys: real(surveys),
      responses: real(responses),
      alerts: real(alerts),
      shoutouts: real(shoutouts),
      moods: real(moods),
    };
  },

  // ---------- Employee-facing data ----------
  async loadEmployeeData(email) {
    const [myResponses, shoutouts, myMoods] = await Promise.all([
      this.listMyResponses(email),
      this.listShoutouts(),
      this.listMyMoods(email),
    ]);
    return {
      myResponses: real(myResponses),
      myShoutouts: real(shoutouts).filter((s) => s.to_email === email || s.from_email === email),
      myMoods: real(myMoods),
      allShoutouts: real(shoutouts),
    };
  },

  // ---------- Completion streak ----------
  // Weeks in a row the user has submitted at least one response, counting back
  // from the most recent survey they answered. Quietly shown on their own profile.
  computeStreak(myResponses, surveys) {
    if (!myResponses.length || !surveys.length) return 0;
    const surveyDates = new Map(surveys.map((s) => [s.id, s.publish_date]));
    const answeredSurveyIds = new Set(myResponses.map((r) => r.survey_id));
    const dates = [...answeredSurveyIds]
      .map((id) => surveyDates.get(id))
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));
    if (!dates.length) return 0;
    let streak = 0;
    let cursor = new Date(dates[0]);
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      const diff = Math.round((cursor - d) / (7 * 24 * 60 * 60 * 1000));
      if (i === 0 || diff === 1) {
        streak += 1;
        cursor = d;
      } else {
        break;
      }
    }
    return streak;
  },

  // ---------- Mood streak detection ----------
  // Sustained low mood (<=2 for 3+ consecutive weeks) → create alert
  async checkMoodStreak(email, name) {
    const moods = await this.listMyMoods(email);
    const realMoods = real(moods).sort((a, b) => (a.week_of || "").localeCompare(b.week_of || ""));
    if (realMoods.length < 3) return null;
    const last3 = realMoods.slice(-3);
    const allLow = last3.every((m) => m.mood_value <= 2);
    if (!allLow) return null;

    // Check if we already have an unresolved mood_streak alert for this person
    const alerts = await this.listAlerts();
    const existing = real(alerts).find(
      (a) => a.respondent_email === email && a.reason === "mood_streak" && !a.is_resolved
    );
    if (existing) return existing;

    return this.createAlert({
      respondent_email: email,
      respondent_name: name || email,
      reason: "mood_streak",
      alert_type: "mood",
      answer_text: `Sustained low mood for 3+ weeks (latest: ${last3[2].mood_value}/5)`,
      rating: last3[2].mood_value,
      is_resolved: false,
    });
  },
};

export { todayStr };