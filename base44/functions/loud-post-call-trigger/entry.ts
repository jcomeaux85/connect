// ALERA | loud — post-call survey trigger. Called after a call ends.
// Finds the active post-call survey config, creates a LoudPostCallSurvey
// record, and sends the survey link to the customer via SMS or email.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Parse the call data from the request body
    const body = await req.json().catch(() => ({}));
    const { call_id, customer_id, customer_phone, customer_email } = body;

    if (!customer_phone && !customer_email) {
      return Response.json({ error: "Customer phone or email required" }, { status: 400 });
    }

    // Find the active post-call survey
    const surveys = await svc.entities.LoudSurvey.filter({ trigger_type: "post_call", status: "active" });
    const survey = surveys.find((s) => !s.is_test);
    if (!survey) {
      return Response.json({ message: "No active post-call survey configured" });
    }

    // Create the post-call survey record
    const postCall = await svc.entities.LoudPostCallSurvey.create({
      survey_id: survey.id,
      survey_title: survey.title,
      call_id,
      customer_phone,
      customer_id,
      customer_email,
      status: "pending",
    });

    // Build the survey link
    const link = `${body.app_url || "https://benconnect.ndrndr.com"}/LoudSurvey/${survey.share_token}`;

    // Send via SMS if we have a phone
    if (customer_phone) {
      try {
        await svc.entities.SMS.create({
          customer_phone,
          message: `Thank you for your call. We'd love your feedback: ${link}`,
          direction: "sent",
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      } catch {
        // SMS send may fail; continue
      }
    }

    // Send via email if we have an email
    if (customer_email) {
      try {
        await svc.integrations.Core.SendEmail({
          to: customer_email,
          subject: `Quick feedback about your call — ${survey.title}`,
          body: `<p>Thank you for your recent call. We'd love your feedback:</p><p><a href="${link}">${link}</a></p>`,
        });
      } catch {
        // Email send may fail; continue
      }
    }

    // Mark as sent
    await svc.entities.LoudPostCallSurvey.update(postCall.id, {
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return Response.json({ postCallId: postCall.id, surveyId: survey.id, link });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}