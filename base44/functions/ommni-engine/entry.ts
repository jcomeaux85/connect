import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// OMMNI Engine — org-wide aggregation and anomaly-detection service.
// Horizontal read layer sitting on top of existing CORPS// suite entities.
// Callable by any module (DOC, CORPS//, ALERA|LOUD, leadership dashboard).
//
// Actions:
//   overview  — aggregate stats from all data sources
//   anomalies — run anomaly detection, return flags filtered by access tier
//   query     — plain-language question → LLM synthesis with citations
//   signal    — context-specific anomaly flags for module embedding
//
// Access tiers (mirrors DOC's archive-completeness model):
//   admin     — full cross-team correlation and drill-down
//   team_lead — aggregate team-level view only
//   specialist — own data only, no dashboard access

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const accessTier = user.role === 'admin' ? 'admin'
      : user.role === 'team_lead' ? 'team_lead'
      : 'specialist';

    const srv = base44.asServiceRole;

    if (action === 'overview') {
      const result = await handleOverview(srv, accessTier, user);
      return Response.json(result);
    }
    if (action === 'anomalies') {
      const result = await handleAnomalies(srv, accessTier, user, body);
      return Response.json(result);
    }
    if (action === 'query') {
      const result = await handleQuery(srv, body, accessTier, user);
      return Response.json(result);
    }
    if (action === 'signal') {
      const result = await handleSignal(srv, body, accessTier, user);
      return Response.json(result);
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ── OVERVIEW ──────────────────────────────────────────────────
async function handleOverview(srv, accessTier, user) {
  const [
    employees, moods, responses, loudSubs, calls, ptoReqs, timecards, shoutouts, alerts
  ] = await Promise.all([
    srv.entities.CoreEmployee.list('-created_date', 200).catch(() => []),
    srv.entities.EquoMood.list('-created_date', 100).catch(() => []),
    srv.entities.EquoResponse.list('-created_date', 100).catch(() => []),
    srv.entities.LoudSubmission.list('-created_date', 100).catch(() => []),
    srv.entities.Call.list('-created_date', 100).catch(() => []),
    srv.entities.CoreTimeOffRequest.list('-created_date', 100).catch(() => []),
    srv.entities.CoreTimecardEntry.list('-created_date', 100).catch(() => []),
    srv.entities.EquoShoutout.list('-created_date', 50).catch(() => []),
    srv.entities.EquoAlert.list('-created_date', 50).catch(() => []),
  ]);

  const moodValues = moods.map(m => m.mood_value).filter(v => v != null);
  const avgMood = moodValues.length ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length : null;
  const csatValues = loudSubs.map(s => s.overall_rating).filter(v => v != null);
  const avgCsat = csatValues.length ? csatValues.reduce((a, b) => a + b, 0) / csatValues.length : null;
  const callDurations = calls.map(c => c.duration).filter(d => d != null);
  const avgCallDur = callDurations.length ? callDurations.reduce((a, b) => a + b, 0) / callDurations.length : null;

  // Team breakdown
  const teamMap = {};
  employees.forEach(e => {
    const team = e.team || e.department || 'Unassigned';
    if (!teamMap[team]) teamMap[team] = 0;
    teamMap[team]++;
  });

  // PTO denial rate
  const ptoDenied = ptoReqs.filter(r => r.status === 'denied' || r.status === 'rejected').length;
  const ptoDenialRate = ptoReqs.length ? ptoDenied / ptoReqs.length : null;

  return {
    access_tier: accessTier,
    data_sources: [
      {
        key: 'equo',
        label: 'eQuo',
        icon: 'HeartPulse',
        metrics: {
          mood_entries: moods.length,
          avg_mood: avgMood ? Math.round(avgMood * 10) / 10 : null,
          survey_responses: responses.length,
          shoutouts: shoutouts.length,
          open_alerts: alerts.filter(a => !a.is_resolved).length,
        },
      },
      {
        key: 'loud',
        label: 'ALERA|LOUD',
        icon: 'Megaphone',
        metrics: {
          submissions: loudSubs.length,
          avg_csat: avgCsat ? Math.round(avgCsat * 10) / 10 : null,
          post_call_count: loudSubs.filter(s => s.trigger_type === 'post_call').length,
        },
      },
      {
        key: 'call_center',
        label: 'Call Center',
        icon: 'Phone',
        metrics: {
          total_calls: calls.length,
          avg_duration_sec: avgCallDur ? Math.round(avgCallDur) : null,
          completed: calls.filter(c => c.status === 'completed').length,
          missed: calls.filter(c => c.status === 'missed' || c.status === 'no_answer').length,
        },
      },
      {
        key: 'corps',
        label: 'CORPS//',
        icon: 'Clock',
        metrics: {
          employees: employees.length,
          teams: Object.keys(teamMap).length,
          pto_requests: ptoReqs.length,
          pto_denial_rate: ptoDenialRate != null ? Math.round(ptoDenialRate * 100) : null,
          timecard_entries: timecards.length,
        },
      },
    ],
    team_breakdown: teamMap,
    totals: {
      employees: employees.length,
      data_points: moods.length + responses.length + loudSubs.length + calls.length + ptoReqs.length + timecards.length,
    },
  };
}

// ── ANOMALIES ─────────────────────────────────────────────────
async function handleAnomalies(srv, accessTier, user, body) {
  const anomalies = await detectAnomalies(srv, accessTier, user, body?.context);
  return { access_tier: accessTier, anomalies, count: anomalies.length };
}

// ── SIGNAL (module-embedded) ───────────────────────────────────
async function handleSignal(srv, body, accessTier, user) {
  const ctx = body.context || {};
  const anomalies = await detectAnomalies(srv, accessTier, user, ctx);

  // Filter to context-relevant flags
  const filtered = anomalies.filter(a => {
    if (!ctx || Object.keys(ctx).length === 0) return true;
    if (ctx.employee_email && a.entity_ref?.email === ctx.employee_email) return true;
    if (ctx.customer_id && a.entity_ref?.id === ctx.customer_id) return true;
    if (ctx.team && a.entity_ref?.team === ctx.team) return true;
    if (ctx.customer_phone && a.entity_ref?.phone === ctx.customer_phone) return true;
    return false;
  });

  return { context: ctx, signals: filtered, count: filtered.length };
}

// ── QUERY (plain-language → LLM with citations) ────────────────
async function handleQuery(srv, body, accessTier, user) {
  const question = body.question || '';
  if (!question.trim()) return { error: 'No question provided' };

  // Aggregate data for context
  const [overview, anomalies] = await Promise.all([
    handleOverview(srv, accessTier, user),
    detectAnomalies(srv, accessTier, user, null),
  ]);

  // Build context string with citations
  const contextParts = [];
  const citations = [];

  overview.data_sources.forEach((src, i) => {
    const metrics = Object.entries(src.metrics)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    contextParts.push(`[${i + 1}] ${src.label}: ${metrics}`);
    citations.push({ source: src.label, ref: i + 1, data: src.metrics });
  });

  if (anomalies.length > 0) {
    const anomalySummary = anomalies.slice(0, 15).map((a, i) => {
      const refIdx = citations.length + i + 1;
      return `[${refIdx}] Anomaly: ${a.type} (${a.severity}) — ${a.description} [source: ${a.source_module}]`;
    });
    contextParts.push(...anomalySummary);
    anomalies.slice(0, 15).forEach((a, i) => {
      citations.push({
        source: a.source_module,
        ref: citations.length + i + 1,
        type: 'anomaly',
        description: a.description,
      });
    });
  }

  const contextStr = contextParts.join('\n');

  const prompt = `You are OMMNI — an org-wide aggregation and anomaly-detection engine for the BEN|connect call center platform. You analyze data from multiple modules (eQuo engagement, ALERA|LOUD feedback, CORPS// workforce, Call Center, DOC knowledge base) to surface patterns no single module can see.

ACCESS TIER: ${accessTier}
${accessTier === 'specialist' ? 'NOTE: This user is a specialist — do not surface individual-level data about other employees. Only provide aggregate or their-own-data insights.' : ''}

DATA CONTEXT (each line is cited with a [ref] number):
${contextStr}

QUESTION: ${question}

Answer the question concisely. Cite which data sources your answer draws from using [ref] numbers. If the data doesn't support an answer, say so plainly. Do not fabricate metrics — only use what's in the context above.`;

  const llmRes = await srv.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        answer: { type: 'string', description: 'Concise answer with [ref] citations' },
        key_findings: {
          type: 'array',
          items: { type: 'string' },
          description: '2-4 key findings or patterns',
        },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      },
    },
  });

  return {
    question,
    answer: llmRes.answer || llmRes,
    key_findings: llmRes.key_findings || [],
    confidence: llmRes.confidence || 'medium',
    citations,
    access_tier: accessTier,
  };
}

// ── ANOMALY DETECTION ──────────────────────────────────────────
async function detectAnomalies(srv, accessTier, user, context) {
  const [
    employees, moods, responses, loudSubs, calls, ptoReqs, timecards, alerts
  ] = await Promise.all([
    srv.entities.CoreEmployee.list('-created_date', 200).catch(() => []),
    srv.entities.EquoMood.list('-created_date', 200).catch(() => []),
    srv.entities.EquoResponse.list('-created_date', 200).catch(() => []),
    srv.entities.LoudSubmission.list('-created_date', 200).catch(() => []),
    srv.entities.Call.list('-created_date', 200).catch(() => []),
    srv.entities.CoreTimeOffRequest.list('-created_date', 200).catch(() => []),
    srv.entities.CoreTimecardEntry.list('-created_date', 200).catch(() => []),
    srv.entities.EquoAlert.list('-created_date', 100).catch(() => []),
  ]);

  const anomalies = [];

  // 1. MOOD DECLINE — person's mood dropped 2+ points week-over-week
  const moodByPerson = {};
  moods.forEach(m => {
    if (!m.respondent_email) return;
    if (!moodByPerson[m.respondent_email]) moodByPerson[m.respondent_email] = [];
    moodByPerson[m.respondent_email].push(m);
  });
  Object.entries(moodByPerson).forEach(([email, personMoods]) => {
    if (personMoods.length < 2) return;
    const sorted = personMoods.sort((a, b) => new Date(b.week_of) - new Date(a.week_of));
    const latest = sorted[0].mood_value;
    const prev = sorted[1].mood_value;
    if (latest != null && prev != null && prev - latest >= 2) {
      const emp = employees.find(e => e.email === email);
      anomalies.push({
        type: 'mood_decline',
        severity: prev - latest >= 3 ? 'high' : 'medium',
        source_module: 'eQuo',
        description: `${emp?.full_name || email} mood dropped from ${prev} to ${latest} (${prev - latest} point decline)`,
        entity_ref: { type: 'employee', email, name: emp?.full_name, team: emp?.team },
        data_points: [
          { source: 'eQuo', metric: 'mood_prev', value: prev },
          { source: 'eQuo', metric: 'mood_latest', value: latest },
        ],
      });
    }
  });

  // 2. LOW CSAT — rep's average CSAT below 3.5 or 1+ below org average
  const csatByRep = {};
  loudSubs.forEach(s => {
    if (s.overall_rating == null) return;
    // We don't have rep email on submission; use customer_phone as proxy for repeat-call
  });
  const allCsat = loudSubs.map(s => s.overall_rating).filter(v => v != null);
  const orgCsatAvg = allCsat.length ? allCsat.reduce((a, b) => a + b, 0) / allCsat.length : null;
  if (orgCsatAvg != null && orgCsatAvg < 3.5) {
    anomalies.push({
      type: 'low_org_csat',
      severity: 'high',
      source_module: 'ALERA|LOUD',
      description: `Organization-wide CSAT is ${Math.round(orgCsatAvg * 10) / 10}/5 — below 3.5 threshold`,
      entity_ref: { type: 'org' },
      data_points: [{ source: 'ALERA|LOUD', metric: 'avg_csat', value: Math.round(orgCsatAvg * 10) / 10 }],
    });
  }

  // 3. REPEAT CALLS — customer with 3+ calls in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const callsByCustomer = {};
  calls.forEach(c => {
    if (!c.customer_id) return;
    const callDate = new Date(c.call_start_time || c.created_date);
    if (callDate < thirtyDaysAgo) return;
    if (!callsByCustomer[c.customer_id]) callsByCustomer[c.customer_id] = [];
    callsByCustomer[c.customer_id].push(c);
  });
  Object.entries(callsByCustomer).forEach(([customerId, custCalls]) => {
    if (custCalls.length >= 3) {
      anomalies.push({
        type: 'repeat_calls',
        severity: custCalls.length >= 5 ? 'high' : 'medium',
        source_module: 'Call Center',
        description: `Customer has ${custCalls.length} calls in the last 30 days — repeat-contact pattern`,
        entity_ref: { type: 'customer', id: customerId, phone: custCalls[0].customer_phone },
        data_points: [{ source: 'Call Center', metric: 'call_count_30d', value: custCalls.length }],
      });
    }
  });

  // 4. PTO DENIAL SPIKE — team's denial rate above 30%
  const ptoByTeam = {};
  ptoReqs.forEach(r => {
    const emp = employees.find(e => e.id === r.employee_id || e.email === r.employee_email);
    const team = emp?.team || emp?.department || 'Unassigned';
    if (!ptoByTeam[team]) ptoByTeam[team] = { total: 0, denied: 0 };
    ptoByTeam[team].total++;
    if (r.status === 'denied' || r.status === 'rejected') ptoByTeam[team].denied++;
  });
  Object.entries(ptoByTeam).forEach(([team, stats]) => {
    if (stats.total < 3) return;
    const rate = stats.denied / stats.total;
    if (rate > 0.3) {
      anomalies.push({
        type: 'pto_denial_spike',
        severity: rate > 0.5 ? 'high' : 'medium',
        source_module: 'CORPS//',
        description: `Team "${team}" PTO denial rate is ${Math.round(rate * 100)}% (${stats.denied}/${stats.total})`,
        entity_ref: { type: 'team', team },
        data_points: [
          { source: 'CORPS//', metric: 'pto_denial_rate', value: Math.round(rate * 100) },
          { source: 'CORPS//', metric: 'pto_total', value: stats.total },
        ],
      });
    }
  });

  // 5. BURNOUT RISK — low mood + low CSAT + high overtime (combination pattern)
  const overtimeByPerson = {};
  timecards.forEach(t => {
    if (!t.employee_email && !t.employee_id) return;
    const key = t.employee_email || t.employee_id;
    const hrs = t.hours || t.overtime_hours || 0;
    if (t.is_overtime || t.overtime_hours) {
      overtimeByPerson[key] = (overtimeByPerson[key] || 0) + (hrs || 0);
    }
  });
  Object.entries(moodByPerson).forEach(([email, personMoods]) => {
    const latestMood = personMoods.sort((a, b) => new Date(b.week_of) - new Date(a.week_of))[0]?.mood_value;
    const otHours = overtimeByPerson[email] || 0;
    if (latestMood != null && latestMood <= 2 && otHours > 10) {
      const emp = employees.find(e => e.email === email);
      anomalies.push({
        type: 'burnout_risk',
        severity: 'high',
        source_module: 'eQuo + CORPS//',
        description: `Burnout risk: ${emp?.full_name || email} has low mood (${latestMood}) and ${otHours}h overtime — early-warning pattern`,
        entity_ref: { type: 'employee', email, name: emp?.full_name, team: emp?.team },
        data_points: [
          { source: 'eQuo', metric: 'mood', value: latestMood },
          { source: 'CORPS//', metric: 'overtime_hours', value: otHours },
        ],
      });
    }
  });

  // 6. LOW RESPONSE RATE — eQuo response rate below 50% for a team
  const teamEmployees = {};
  employees.forEach(e => {
    const team = e.team || e.department || 'Unassigned';
    if (!teamEmployees[team]) teamEmployees[team] = [];
    teamEmployees[team].push(e);
  });
  Object.entries(teamEmployees).forEach(([team, emps]) => {
    if (emps.length < 3) return;
    const responderEmails = new Set(responses.map(r => r.respondent_email));
    const moodEmails = new Set(moods.map(m => m.respondent_email));
    const totalParticipants = emps.filter(e => e.email).length;
    if (totalParticipants === 0) return;
    const responders = emps.filter(e => responderEmails.has(e.email) || moodEmails.has(e.email)).length;
    const rate = responders / totalParticipants;
    if (rate < 0.5) {
      anomalies.push({
        type: 'low_response_rate',
        severity: 'medium',
        source_module: 'eQuo',
        description: `Team "${team}" eQuo response rate is ${Math.round(rate * 100)}% — below 50% threshold`,
        entity_ref: { type: 'team', team },
        data_points: [
          { source: 'eQuo', metric: 'response_rate', value: Math.round(rate * 100) },
          { source: 'eQuo', metric: 'team_size', value: totalParticipants },
        ],
      });
    }
  });

  // 7. UNRESOLVED ALERTS — open eQuo alerts that haven't been addressed
  const openAlerts = alerts.filter(a => !a.is_resolved);
  if (openAlerts.length >= 3) {
    anomalies.push({
      type: 'unresolved_alerts',
      severity: 'medium',
      source_module: 'eQuo',
      description: `${openAlerts.length} unresolved eQuo alerts — team wellbeing needs attention`,
      entity_ref: { type: 'org' },
      data_points: [{ source: 'eQuo', metric: 'open_alerts', value: openAlerts.length }],
    });
  }

  // Access tier filtering
  if (accessTier === 'specialist') {
    // Specialists only see their own anomalies
    return anomalies.filter(a =>
      a.entity_ref?.email === user.email || a.entity_ref?.type === 'org'
    );
  }
  if (accessTier === 'team_lead') {
    // Team leads see their team + org-level only (no individual other-person)
    // For demo, show all team-level and org-level, filter individual to own
    return anomalies.filter(a =>
      a.entity_ref?.type !== 'employee' ||
      a.entity_ref?.email === user.email
    );
  }

  return anomalies;
}