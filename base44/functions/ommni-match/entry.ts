import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// OMMNI matching engine — server-side rule evaluation.
// Takes text + user + source channel, checks against all active rules
// (admin rules for everyone + training-sourced rules scoped to the user
// within their 14-day window), creates OmmniNotification records for
// matches, and returns them sorted by priority descending.
//
// Matching types:
//   keyword  — case-insensitive word-boundary substring match
//   regex    — direct RegExp pattern test
//   semantic — batched LLM similarity check (InvokeLLM) vs threshold

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { text, source_channel, context_snippet } = body;
    if (!text || !source_channel) {
      return Response.json({ error: 'text and source_channel required' }, { status: 400 });
    }

    // Fetch all active rules (service-role so we see training-sourced rules too)
    const allRules = await base44.asServiceRole.entities.OmmniRule.filter({ active: true });
    const now = new Date();

    // Filter to rules applicable to THIS user:
    //  - admin rules with no user_email scope (apply to everyone)
    //  - training rules scoped to this user, within their 14-day window
    const applicableRules = allRules.filter(r => {
      if (r.source_type === 'admin' && !r.user_email) return true;
      if (r.source_type === 'training' && r.user_email === user.email) {
        if (r.expires_at && new Date(r.expires_at) < now) return false;
        return true;
      }
      // Admin could also create user-scoped rules
      if (r.source_type === 'admin' && r.user_email === user.email) return true;
      return false;
    });

    const matches = [];

    // --- Keyword + Regex matching (fast, synchronous) ---
    for (const rule of applicableRules) {
      if (rule.trigger_type === 'keyword') {
        const pattern = new RegExp('\\b' + escapeRegex(rule.condition_value) + '\\b', 'i');
        if (pattern.test(text)) {
          matches.push({ rule, matched_text: rule.condition_value });
        }
      } else if (rule.trigger_type === 'regex') {
        try {
          const regex = new RegExp(rule.condition_value, 'i');
          const m = text.match(regex);
          if (m) {
            matches.push({ rule, matched_text: m[0] });
          }
        } catch (e) {
          // Invalid regex pattern — skip this rule
        }
      }
    }

    // --- Semantic matching (batched LLM call for efficiency) ---
    const semanticRules = applicableRules.filter(r => r.trigger_type === 'semantic');
    if (semanticRules.length > 0) {
      const concepts = semanticRules.map(r => ({ id: r.id, concept: r.condition_value }));
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a semantic similarity engine. For each concept below, rate how semantically similar it is to the provided text on a scale of 0.0 to 1.0. Return a JSON object with a "results" array, each entry having "id" (the concept id) and "similarity" (number 0-1).\n\nText:\n${text}\n\nConcepts:\n${concepts.map(c => c.id + ': ' + c.concept).join('\n')}`,
        response_json_schema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  similarity: { type: 'number' }
                }
              }
            }
          }
        }
      });

      const results = result?.results || [];
      for (const res of results) {
        const rule = semanticRules.find(r => r.id === res.id);
        if (rule && res.similarity >= (rule.semantic_threshold || 0.75)) {
          matches.push({ rule, matched_text: `[semantic: ${rule.condition_value}]` });
        }
      }
    }

    // --- Create notification records for all matches ---
    const notifications = [];
    for (const { rule, matched_text } of matches) {
      const sourceLabel = rule.source_label
        ? (rule.source_type === 'training' ? `Training: ${rule.source_label}` : rule.source_label)
        : (rule.source_type === 'training' ? 'Training rule' : 'Admin rule');

      const notification = await base44.asServiceRole.entities.OmmniNotification.create({
        rule_id: rule.id,
        user_email: user.email,
        context_snippet: (context_snippet || text).substring(0, 200),
        source_channel,
        source_label: sourceLabel,
        notification_text: rule.notification_text,
        priority: rule.priority || 0,
        triggered_at: new Date().toISOString(),
        dismissed: false
      });

      notifications.push({
        notification_id: notification.id,
        rule_id: rule.id,
        notification_text: rule.notification_text,
        source_label: sourceLabel,
        source_type: rule.source_type,
        priority: rule.priority || 0,
        matched_text
      });
    }

    // Sort by priority descending (highest first)
    notifications.sort((a, b) => b.priority - a.priority);

    return Response.json({ matches: notifications });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}