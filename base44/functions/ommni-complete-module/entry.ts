import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// ALERA TRAIN → OMMNI completion webhook.
// Called when a user completes a training module. Does two things:
//   1. Writes a TrainingCompletion record (user, module, tags, timestamp)
//   2. Auto-generates OmmniRule rows from the module's tags — one keyword
//      rule per tag, scoped to this user, active for 14 days, then
//      auto-expired by the matching engine via expires_at.
//
// This is the ONLY coupling point between TRAIN and OMMNI. OMMNI runs
// standalone against admin rules with zero training modules present;
// this webhook simply adds training-sourced rules to the same table.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { module_id, module_title, module_tags } = body;
    if (!module_id) return Response.json({ error: 'module_id required' }, { status: 400 });

    // 1. Write the completion record
    const completion = await base44.asServiceRole.entities.TrainingCompletion.create({
      user_email: user.email,
      module_id,
      module_title: module_title || 'Untitled module',
      completed_at: new Date().toISOString(),
      module_tags: module_tags || []
    });

    // 2. Auto-generate OMMNI rules from the module's tags
    const tags = module_tags || [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    let rulesCreated = 0;
    if (tags.length > 0) {
      const rules = await base44.asServiceRole.entities.OmmniRule.bulkCreate(
        tags.map(tag => ({
          trigger_type: 'keyword',
          condition_value: tag,
          notification_text: `Training reminder: "${tag}" — from module "${module_title || 'Unknown'}". Apply what you learned in your next conversation.`,
          source_type: 'training',
          source_id: module_id,
          source_label: module_title || 'Training module',
          active: true,
          priority: 5,
          user_email: user.email,
          expires_at: expiresAt.toISOString(),
          semantic_threshold: 0.75,
          created_by: user.email
        }))
      );
      rulesCreated = Array.isArray(rules) ? rules.length : 0;
    }

    return Response.json({
      completion_id: completion.id,
      rules_created: rulesCreated,
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}