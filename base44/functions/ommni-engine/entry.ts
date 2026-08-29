import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// OMMNI Engine — org-wide aggregation, anomaly detection, predictive
// forecasting, and cross-module correlation. Horizontal read/service layer
// sitting on top of the CORPS// suite entities. Callable by any module.
//
// Actions:
//   overview   — aggregate stats from all data sources
//   anomalies  — run anomaly detection, return flags filtered by access tier
//   query      — plain-language question → LLM synthesis with citations
//   signal     — context-specific anomaly flags for module embedding
//   forecast   — statistical extrapolation → probability scores & trajectories
//   correlate  — LLM weaves multi-module data into narrative correlation stories
//   push       — proactive: run anomalies+forecast, write targeted Notifications
//
// Access tiers:
//   admin      — full cross-team correlation and drill-down
//   team_lead  — aggregate team-level view only
//   specialist — own data only, no dashboard access
//
// The `push` action may be called by a scheduled workflow with no user
// session — in that case it runs as admin (service role).

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // `push` is allowed without a user session (workflow-triggered)
    if (!user && action !== 'push') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessTier = !user ? 'admin'
      : user.role === 'admin' ? 'admin'
      : user.role === 'team_lead' ? 'team_lead'
      : 'specialist';

    const srv = base44.asServiceRole;

    if (action === 'overview') return Response.json(await handleOverview(srv, accessTier, user));
    if (action === 'anomalies') return Response.json(await handleAnomalies(srv, accessTier, user, body));
    if (action === 'query') return Response.json(await handleQuery(srv, body, accessTier, user));
    if (action === 'signal') return Response.json(await handleSignal(srv, body, accessTier, user));
    if (action === 'forecast') return Response.json(await handleForecast(srv, accessTier, user));
    if (action === 'correlate') return Response.json(await handleCorrelate(srv, body, accessTier, user));
    if (action === 'push') return Response.json(await handlePush(srv, user));

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ── LLM retry wrapper (protects against transient 500s) ────────
async function invokeLLMWithRetry(srv, args, attempts = 2, backoffMs = 1000) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await srv.integrations.Core.InvokeLLM(args);
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, backoffMs));
    }
  }
  throw lastErr;
}

// ── Statistical helpers ─────────────────────────────────────────
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  const ssTot = points.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0);
  const ssRes = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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

  const teamMap = {};
  employees.forEach(e => {
    const team = e.team || e.department || 'Unassigned';
    if (!teamMap[team]) teamMap[team] = 0;
    teamMap[team]++;
  });

  const ptoDenied = ptoReqs.filter(r => r.status === 'denied' || r.status === 'rejected').length;
  const ptoDenialRate = ptoReqs.length ? ptoDenied / ptoReqs.length : null;

  return {
    access_tier: accessTier,
    data_sources: [
      {
        key: 'equo', label: 'eQuo', icon: 'HeartPulse',
        metrics: {
          mood_entries: moods.length,
          avg_mood: avgMood ? Math.round(avgMood * 10) / 10 : null,
          survey_responses: responses.length,
          shoutouts: shoutouts.length,
          open_alerts: alerts.filter(a => !a.is_resolved).length,
        },
      },
      {
        key: 'loud', label: 'ALERA|LOUD', icon: 'Megaphone',
        metrics: {
          submissions: loudSubs.length,
          avg_csat: avgCsat ? Math.round(avgCsat * 10) / 10 : null,
          post_call_count: loudSubs.filter(s => s.trigger_type === 'post_call').length,
        },
      },
      {
        key: 'call_center', label: 'Call Center', icon: 'Phone',
        metrics: {
          total_calls: calls.length,
          avg_duration_sec: avgCallDur ? Math.round(avgCallDur) : null,
          completed: calls.filter(c => c.status === 'completed').length,
          missed: calls.filter(c => c.status === 'missed' || c.status === 'no_answer').length,
        },
      },
      {
        key: 'corps', label: 'CORPS//', icon: 'Clock',
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

// ── QUERY (plain-language → LLM with citations, retry-wrapped) ─
async function handleQuery(srv, body, accessTier, user) {
  const question = body.question || '';
  if (!question.trim()) return { error: 'No question provided' };

  const [overview, anomalies] = await Promise.all([
    handleOverview(srv, accessTier, user),
    detectAnomalies(srv, accessTier, user, null),
  ]);

  const contextParts = [];
  const citations = [];

  overview.data_sources.forEach((src, i) => {
    const metrics = Object.entries(src.metrics).map(([k, v]) => `${k}: ${v}`).join(', ');
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
        source: a.source_module, ref: citations.length + i + 1,
        type: 'anomaly', description: a.description,
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

  const llmRes = await invokeLLMWithRetry(srv, {
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        answer: { type: 'string', description: 'Concise answer with [ref] citations' },
        key_findings: { type: 'array', items: { type: 'string' }, description: '2-4 key findings or patterns' },
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

// ── FORECAST (statistical extrapolation → probabilities) ───────
async function handleForecast(srv, accessTier, user) {
  const [moods, loudSubs, calls, timecards, employees, responses, shoutouts] = await Promise.all([
    srv.entities.EquoMood.list('-created_date', 200).catch(() => []),
    srv.entities.LoudSubmission.list('-created_date', 200).catch(() => []),
    srv.entities.Call.list('-created_date', 200).catch(() => []),
    srv.entities.CoreTimecardEntry.list('-created_date', 200).catch(() => []),
    srv.entities.CoreEmployee.list('-created_date', 200).catch(() => []),
    srv.entities.EquoResponse.list('-created_date', 200).catch(() => []),
    srv.entities.EquoShoutout.list('-created_date', 50).catch(() => []),
  ]);

  const forecasts = [];

  // Mood by person (sorted ascending by week)
  const moodByPerson = {};
  moods.forEach(m => {
    if (!m.respondent_email) return;
    if (!moodByPerson[m.respondent_email]) moodByPerson[m.respondent_email] = [];
    moodByPerson[m.respondent_email].push(m);
  });
  Object.values(moodByPerson).forEach(arr => arr.sort((a, b) => new Date(a.week_of) - new Date(b.week_of)));

  // Overtime by person
  const otByPerson = {};
  timecards.forEach(t => {
    const key = t.employee_email || t.employee_id;
    if (!key) return;
    if (t.is_overtime || t.overtime_hours) {
      otByPerson[key] = (otByPerson[key] || 0) + (t.hours || t.overtime_hours || 0);
    }
  });

  // 1. BURNOUT RISK per employee
  Object.entries(moodByPerson).forEach(([email, personMoods]) => {
    if (personMoods.length < 2) return;
    const points = personMoods.map(m => ({ x: new Date(m.week_of).getTime(), y: m.mood_value }));
    const reg = linearRegression(points);
    if (!reg) return;
    const latest = personMoods[personMoods.length - 1].mood_value;
    const emp = employees.find(e => e.email === email);
    const otHours = otByPerson[email] || 0;

    const moodDeclineSignal = reg.slope < 0 ? clamp01(Math.abs(reg.slope) * WEEK_MS / 2) : 0;
    const lowMoodSignal = clamp01((5 - latest) / 4);
    const overtimeSignal = clamp01(otHours / 20);
    const burnoutProb = clamp01(0.4 * lowMoodSignal + 0.35 * moodDeclineSignal + 0.25 * overtimeSignal);

    if (burnoutProb > 0.3) {
      const nextX = points[points.length - 1].x + WEEK_MS;
      forecasts.push({
        type: 'burnout_risk',
        entity: { email, name: emp?.full_name, team: emp?.department },
        probability: Math.round(burnoutProb * 100),
        confidence: Math.round(reg.r2 * 100) / 100,
        trajectory: points.map(p => p.y),
        trajectory_labels: personMoods.map(m => m.week_of),
        projected_next: Math.round((reg.slope * nextX + reg.intercept) * 10) / 10,
        factors: [
          { label: 'Mood trend', value: reg.slope < 0 ? 'declining' : 'stable', weight: 'high' },
          { label: 'Current mood', value: latest, weight: 'high' },
          { label: 'Overtime (h)', value: Math.round(otHours), weight: 'medium' },
        ],
      });
    }
  });

  // 2. ATTRITION LIKELIHOOD per employee (engagement drop + mood decline)
  Object.entries(moodByPerson).forEach(([email, personMoods]) => {
    if (personMoods.length < 2) return;
    const points = personMoods.map(m => ({ x: new Date(m.week_of).getTime(), y: m.mood_value }));
    const reg = linearRegression(points);
    if (!reg) return;
    const latest = personMoods[personMoods.length - 1].mood_value;
    const emp = employees.find(e => e.email === email);
    const myResponses = responses.filter(r => r.respondent_email === email).length;
    const myShoutouts = shoutouts.filter(s => s.from_email === email || s.to_email === email).length;
    const engagementSignal = clamp01(1 - (myResponses + myShoutouts) / 4);
    const moodDeclineSignal = reg.slope < 0 ? clamp01(Math.abs(reg.slope) * WEEK_MS / 2) : 0;
    const lowMoodSignal = clamp01((4 - latest) / 3);
    const attritionProb = clamp01(0.4 * lowMoodSignal + 0.3 * moodDeclineSignal + 0.3 * engagementSignal);

    const hasBurnout = forecasts.some(f => f.type === 'burnout_risk' && f.entity?.email === email);
    if (attritionProb > 0.4 && !hasBurnout) {
      const nextX = points[points.length - 1].x + WEEK_MS;
      forecasts.push({
        type: 'attrition_risk',
        entity: { email, name: emp?.full_name, team: emp?.department },
        probability: Math.round(attritionProb * 100),
        confidence: Math.round(reg.r2 * 100) / 100,
        trajectory: points.map(p => p.y),
        trajectory_labels: personMoods.map(m => m.week_of),
        projected_next: Math.round((reg.slope * nextX + reg.intercept) * 10) / 10,
        factors: [
          { label: 'Engagement', value: myResponses + myShoutouts, weight: 'high' },
          { label: 'Mood trend', value: reg.slope < 0 ? 'declining' : 'stable', weight: 'medium' },
        ],
      });
    }
  });

  // 3. CSAT TRAJECTORY (org-level)
  const csatPoints = loudSubs
    .filter(s => s.overall_rating != null && s.submitted_at)
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
    .map((s, i) => ({ x: i, y: s.overall_rating }));
  if (csatPoints.length >= 2) {
    const reg = linearRegression(csatPoints);
    if (reg) {
      const projectedNext = reg.slope * csatPoints.length + reg.intercept;
      const dropProb = projectedNext < 3.5 ? clamp01((3.5 - projectedNext) / 1.5) : 0;
      forecasts.push({
        type: 'csat_trajectory',
        entity: { type: 'org' },
        probability: Math.round(dropProb * 100),
        confidence: Math.round(reg.r2 * 100) / 100,
        trajectory: csatPoints.map(p => p.y),
        projected_next: Math.round(projectedNext * 10) / 10,
        factors: [
          { label: 'Current avg', value: csatPoints[csatPoints.length - 1].y, weight: 'high' },
          { label: 'Trend', value: reg.slope < 0 ? 'declining' : 'improving', weight: 'high' },
        ],
      });
    }
  }

  // 4. CALL VOLUME FORECAST (daily counts → next-week projection)
  const callsByDay = {};
  calls.forEach(c => {
    const d = (c.call_start_time || c.created_date)?.slice(0, 10);
    if (!d) return;
    callsByDay[d] = (callsByDay[d] || 0) + 1;
  });
  const dayPoints = Object.entries(callsByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([d, count], i) => ({ x: i, y: count }));
  if (dayPoints.length >= 3) {
    const reg = linearRegression(dayPoints);
    if (reg) {
      const projectedNextWeek = Math.round(reg.slope * dayPoints.length + reg.intercept);
      forecasts.push({
        type: 'call_volume',
        entity: { type: 'org' },
        probability: 0,
        confidence: Math.round(reg.r2 * 100) / 100,
        trajectory: dayPoints.map(p => p.y),
        projected_next: Math.max(0, projectedNextWeek),
        factors: [
          { label: 'Daily avg', value: Math.round(dayPoints.reduce((s, p) => s + p.y, 0) / dayPoints.length), weight: 'medium' },
          { label: 'Trend', value: reg.slope > 0 ? 'increasing' : 'decreasing', weight: 'medium' },
        ],
      });
    }
  }

  // Access tier filtering
  const filtered = forecasts.filter(f => {
    if (accessTier === 'specialist') return f.entity?.email === user?.email || f.entity?.type === 'org';
    if (accessTier === 'team_lead') return f.entity?.type === 'org' || f.entity?.email === user?.email;
    return true;
  });

  return { access_tier: accessTier, forecasts: filtered, count: filtered.length };
}

// ── CORRELATE (LLM narrative stories across modules) ──────────
async function handleCorrelate(srv, body, accessTier, user) {
  const [overview, anomalies, forecast] = await Promise.all([
    handleOverview(srv, accessTier, user),
    detectAnomalies(srv, accessTier, user, null),
    handleForecast(srv, accessTier, user),
  ]);

  const contextParts = [];
  const citations = [];

  overview.data_sources.forEach((src, i) => {
    const metrics = Object.entries(src.metrics).map(([k, v]) => `${k}: ${v}`).join(', ');
    contextParts.push(`[${i + 1}] ${src.label}: ${metrics}`);
    citations.push({ ref: i + 1, source: src.label, data: src.metrics });
  });

  let refIdx = citations.length;
  anomalies.slice(0, 20).forEach(a => {
    const ref = ++refIdx;
    citations.push({ ref, source: a.source_module, type: 'anomaly', description: a.description });
    contextParts.push(`[${ref}] Anomaly (${a.severity}): ${a.description} [source: ${a.source_module}]`);
  });
  forecast.forecasts.forEach(f => {
    const ref = ++refIdx;
    const who = f.entity?.name || f.entity?.email || 'org-wide';
    citations.push({ ref, source: 'OMMNI Forecast', type: 'forecast', description: `${f.type} for ${who}` });
    contextParts.push(`[${ref}] Forecast: ${f.type} for ${who} — probability ${f.probability}%, projected next: ${f.projected_next} [factors: ${f.factors.map(fac => fac.label + '=' + fac.value).join(', ')}]`);
  });

  const prompt = `You are OMMNI — an org-wide correlation engine for the BEN|connect call center platform. You find patterns across modules (eQuo engagement, ALERA|LOUD feedback, CORPS// workforce, Call Center) that no single module can see.

DATA CONTEXT (each line cited with [ref]):
${contextParts.join('\n')}

ACCESS TIER: ${accessTier}
${accessTier === 'specialist' ? 'Do not reveal individual-level data about other employees.' : ''}

Find 3-5 cross-module correlation stories — patterns that connect data points from at least 2 different modules into a narrative insight. For each story:
- A short, vivid title
- A 2-3 sentence narrative explaining the correlation and why it matters
- The specific [ref] numbers that support it
- Severity (high/medium/low) based on business impact
- Who should be notified (the person, their lead, or org-wide)

Focus on actionable correlations — things a business would wish they knew before they become problems. Do not fabricate data; only use what's in the context.`;

  const llmRes = await invokeLLMWithRetry(srv, {
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        stories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              narrative: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              refs: { type: 'array', items: { type: 'number' } },
              notify: { type: 'string', description: 'who should be notified' },
              modules: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  });

  return { stories: llmRes.stories || [], citations, access_tier: accessTier };
}

// ── PUSH (proactive notifications to the right people) ────────
async function handlePush(srv, callerUser) {
  // Always run as admin to see everything
  const [anomalies, forecast] = await Promise.all([
    detectAnomalies(srv, 'admin', null, null),
    handleForecast(srv, 'admin', null),
  ]);

  const admins = await srv.entities.User.list().catch(() => []);
  const adminEmails = admins.filter(u => u.role === 'admin').map(u => u.email).filter(Boolean);
  if (adminEmails.length === 0 && callerUser?.email) adminEmails.push(callerUser.email);

  const notifications = [];
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const createIfNew = async (email, title, message, priority, metadata) => {
    const existing = await srv.entities.Notification.filter(
      { user_email: email, type: 'ommni_insight' }, '-created_date', 5
    ).catch(() => []);
    const isDup = existing.some(n => n.title === title && new Date(n.created_date) > dayAgo);
    if (isDup) return null;
    const n = await srv.entities.Notification.create({
      user_email: email, type: 'ommni_insight', title, message, priority, metadata,
    });
    return n;
  };

  // High/medium anomalies → notify
  for (const a of anomalies) {
    if (a.severity !== 'high' && a.severity !== 'medium') continue;
    const title = `OMMNI: ${a.type.replace(/_/g, ' ')}`;
    const priority = a.severity === 'high' ? 'urgent' : 'high';
    let recipients = a.entity_ref?.type === 'employee' && a.entity_ref?.email
      ? [a.entity_ref.email, ...adminEmails]
      : adminEmails;
    for (const email of [...new Set(recipients)]) {
      const n = await createIfNew(email, title, a.description, priority, {
        anomaly_type: a.type, severity: a.severity, source_module: a.source_module,
        pushed_at: now.toISOString(),
      });
      if (n) notifications.push({ id: n.id, to: email, title });
    }
  }

  // High-probability forecasts → notify
  for (const f of forecast.forecasts) {
    if (f.probability < 50) continue;
    const title = `OMMNI Forecast: ${f.type.replace(/_/g, ' ')}`;
    const who = f.entity?.name || f.entity?.email || 'the organization';
    const message = `${who} — ${f.probability}% probability. Projected: ${f.projected_next}. Factors: ${f.factors.map(fac => `${fac.label}=${fac.value}`).join(', ')}`;
    const priority = f.probability >= 75 ? 'urgent' : 'high';
    let recipients = f.entity?.email ? [f.entity.email, ...adminEmails] : adminEmails;
    for (const email of [...new Set(recipients)]) {
      const n = await createIfNew(email, title, message, priority, {
        forecast_type: f.type, probability: f.probability, pushed_at: now.toISOString(),
      });
      if (n) notifications.push({ id: n.id, to: email, title });
    }
  }

  return { pushed: notifications.length, notifications, ran_at: now.toISOString() };
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

  // 2. LOW CSAT — org-wide CSAT below 3.5
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

  // 5. BURNOUT RISK — low mood + high overtime
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

  // 7. UNRESOLVED ALERTS
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
    return anomalies.filter(a => a.entity_ref?.email === user?.email || a.entity_ref?.type === 'org');
  }
  if (accessTier === 'team_lead') {
    return anomalies.filter(a => a.entity_ref?.type !== 'employee' || a.entity_ref?.email === user?.email);
  }
  return anomalies;
}