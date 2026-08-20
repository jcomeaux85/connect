// ALERA | loud — API wrapper. All base44 SDK access for this module.
import { base44 } from "@/api/base44Client";

const real = (rows) => (rows || []).filter((r) => !r.is_test);

function genToken() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const loudApi = {
  async me() {
    return base44.auth.me();
  },

  // ---------- Surveys ----------
  async listSurveys() {
    return base44.entities.LoudSurvey.list("-created_date");
  },
  async createSurvey(data) {
    return base44.entities.LoudSurvey.create({ ...data, share_token: genToken() });
  },
  async updateSurvey(id, data) {
    return base44.entities.LoudSurvey.update(id, data);
  },
  async deleteSurvey(id) {
    return base44.entities.LoudSurvey.delete(id);
  },
  async getSurveyByToken(token) {
    const rows = await base44.entities.LoudSurvey.filter({ share_token: token });
    return rows[0] || null;
  },

  // ---------- Submissions ----------
  async listSubmissions() {
    return base44.entities.LoudSubmission.list("-created_date", 1000);
  },
  async listSubmissionsForSurvey(surveyId) {
    return base44.entities.LoudSubmission.filter({ survey_id: surveyId });
  },
  async createSubmission(data) {
    return base44.entities.LoudSubmission.create({
      ...data,
      submitted_at: new Date().toISOString(),
    });
  },

  // ---------- Post-call triggers ----------
  async listPostCallSurveys() {
    return base44.entities.LoudPostCallSurvey.list("-created_date", 500);
  },
  async createPostCallSurvey(data) {
    return base44.entities.LoudPostCallSurvey.create(data);
  },
  async updatePostCallSurvey(id, data) {
    return base44.entities.LoudPostCallSurvey.update(id, data);
  },

  // ---------- Trigger post-call survey after a call ends ----------
  async triggerPostCall({ call, customer, surveyId }) {
    if (!surveyId || !customer?.phone) return null;
    return this.createPostCallSurvey({
      survey_id: surveyId,
      survey_title: "Post-call survey",
      call_id: call?.id,
      customer_phone: customer.phone,
      customer_id: customer?.id,
      customer_email: customer?.email,
      status: "pending",
    });
  },

  // ---------- Admin rollup ----------
  async loadAdminData() {
    const [surveys, submissions, postCalls] = await Promise.all([
      this.listSurveys(),
      this.listSubmissions(),
      this.listPostCallSurveys(),
    ]);
    return {
      surveys: real(surveys),
      submissions: real(submissions),
      postCalls: real(postCalls),
    };
  },
};