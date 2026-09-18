import { PITCH_MODE } from '@/lib/pitchMode';

export const SAMPLE_FORECASTS = [
  { type: 'burnout_risk', probability: 74, projected_next: '18 days to threshold', trajectory: [2.1, 2.0, 1.8, 1.6, 1.4, 1.2, 1.1, 0.9], confidence: 0.86, entity: { name: 'Ryan Hinton', email: 'ryan@queue.demo' }, factors: [{ label: 'Mood trend', value: 'declining 8 wks' }, { label: 'Overtime', value: '11.4h / wk' }, { label: 'Repeat claims', value: '+38% personal load' }] },
  { type: 'burnout_risk', probability: 61, projected_next: '26 days to threshold', trajectory: [2.4, 2.2, 2.1, 1.9, 1.7, 1.6, 1.5, 1.4], confidence: 0.81, entity: { name: 'Vanessa Reyes', email: 'vanessa@queue.demo' }, factors: [{ label: 'Mood trend', value: 'declining' }, { label: 'EQUO flags', value: '3 knowledge-gap weeks' }, { label: 'LOUD score', value: 'fair / slipping' }] },
  { type: 'csat_trajectory', probability: 68, projected_next: '3.6 / 5 next month', trajectory: [4.6, 4.5, 4.4, 4.2, 4.0, 3.9, 3.8, 3.7], confidence: 0.79, entity: { name: 'Medical / Prior-Auth queue' }, factors: [{ label: 'Current avg', value: '3.8' }, { label: 'Trend', value: 'declining' }, { label: 'Driver', value: 'same-day denial letters' }] },
  { type: 'call_volume', probability: 0, projected_next: '+22% week of Oct 6', trajectory: [142, 138, 151, 148, 166, 171, 164, 189], confidence: 0.84, entity: { name: 'Org-wide inbound' }, factors: [{ label: 'Daily avg', value: '164' }, { label: 'Trend', value: 'rising into OE' }, { label: 'Trigger', value: 'open enrollment packets drop' }] },
  { type: 'attrition_risk', probability: 41, projected_next: '1 transfer request this quarter', trajectory: [12, 14, 18, 21, 24, 28, 31, 34], confidence: 0.72, entity: { name: 'Claims pod' }, factors: [{ label: 'Internal moves', value: '2 asked off phones' }, { label: 'PTO denials', value: '4 in 6 weeks' }, { label: 'LOUD theme', value: 'no backup on denials' }] },
];

export const SAMPLE_STORIES = [
  { severity: 'high', modules: ['EQUO', 'Call Center', 'LOUD'], title: 'Prior-auth denials are burning the same two agents — and members feel it 4 days later.', narrative: 'EQUO mood for Ryan and Vanessa dropped in lockstep the week a national carrier tightened prior-auth windows. Their personal queues absorbed 38% more denial callbacks. LOUD comments that week cluster on already-authorized. CSAT on Medical trails the mood drop by four days. No single module sees the chain. OMMNI does.', refs: ['EQUO/mood-8wk', 'CC/disp-prior-auth', 'LOUD/theme-scripts'], notify: 'Claims supervisor + workforce desk' },
  { severity: 'high', modules: ['Qflo', 'Call Center', 'CORPS//'], title: 'Lunch stacking at 12:00 is inventing a fake staffing shortage.', narrative: 'Qflo shows Chris and Jarrad lunches overlapping the same 45 minutes as two reserved breaks. Inbound wait in that window jumped 2.4x while headcount on paper stayed flat. CORPS// still reports fully staffed. The company is not short people. It is short that hour.', refs: ['Qflo/lunch-grid', 'CC/wait-by-hod', 'CORPS/roster'], notify: 'Floor lead' },
  { severity: 'medium', modules: ['Call Center', 'DOC', 'AUTHLINK'], title: 'ID-card reprints are one vendor incident wearing 47 different member names.', narrative: 'Disposition ID Card Inquiry rose 3.1x after the print vendor cutover. DOC searches for the same plan PDF spiked the same morning. AUTHLINK proxies started calling on behalf of spouses who never received the new card. Pulled apart, each case looks unique. Aggregated, it is one operational failure with no PHI required to see it.', refs: ['CC/reason-id-card', 'DOC/search-idcard', 'AUTHLINK/volume'], notify: 'Client success + vendor manager' },
  { severity: 'medium', modules: ['LEARN', 'Call Center', 'EQUO'], title: 'Agents who skipped the QLE module are manufacturing second calls.', narrative: 'LEARN completion for Qualifying Life Events is 61% on the floor. Those incomplete seats account for 44% of callback scheduled dispositions this month and a higher EQUO knowledge-gap rate. Training debt is showing up as handle time, not as a red LEARN tile.', refs: ['LEARN/qle-module', 'CC/resolution-callback', 'EQUO/knowledge-gap'], notify: 'Training + team leads' },
  { severity: 'low', modules: ['CORPS//', 'Call Center'], title: 'Open enrollment volume will land the week payroll already locks bonuses.', narrative: 'Last three OE seasons, inbound peaked 6-9 days after packets mailed. Payroll lock for annual bonuses sits inside that window. Overtime this year will look like a surprise unless workforce books the overlap now. Same pattern, third year.', refs: ['CC/oe-history', 'CORPS/payroll-calendar'], notify: 'HR ops + finance partner' },
];

export const SAMPLE_ANOMALIES = [
  { severity: 'high', source_module: 'Call Center', title: 'Medical / prior-auth dispositions +41% week over week', detail: 'Not explained by headcount or new clients. Carrier bulletin dropped Tuesday.', window: '7d' },
  { severity: 'high', source_module: 'EQUO', title: 'Two-person mood collapse in claims pod', detail: 'Ryan Hinton and Vanessa Reyes both below 1.5 for three consecutive checks.', window: '21d' },
  { severity: 'medium', source_module: 'Qflo', title: 'Covered-hour hole 12:05-12:50', detail: 'Two lunches + one reserved break. Wait 2.4x baseline.', window: 'today' },
  { severity: 'medium', source_module: 'LOUD', title: 'Theme already-authorized is a new cluster', detail: 'Did not exist as a phrase family before the prior-auth window change.', window: '14d' },
  { severity: 'low', source_module: 'DOC', title: 'Same SPD searched 86 times, zero bookmarks', detail: 'Agents cannot find the prior-auth exhibit. Knowledge, not volume.', window: '7d' },
];

export const SAMPLE_SOURCES = [
  { key: 'equo', label: 'EQUO', metrics: { check_ins: 214, declining: 11, flags: 7 } },
  { key: 'loud', label: 'LOUD', metrics: { responses: 89, themes: 6, nps: 41 } },
  { key: 'call_center', label: 'Call Center', metrics: { calls_30d: 4820, aht_sec: 312, first_call: 64 } },
  { key: 'corps', label: 'CORPS//', metrics: { on_shift: 18, pto_denied: 4, ot_hours: 126 } },
];

export const SAMPLE_WATCHLIST = [
  { id: 'w1', watch: 'Prior-auth denials in Medical', rule: 'Alert if week-over-week > 12%', horizon: '14 days', status: 'armed' },
  { id: 'w2', watch: 'Ryan Hinton + Vanessa Reyes mood pair', rule: 'Alert if both stay at or below 1.5 for another check-in', horizon: 'ongoing', status: 'triggered' },
  { id: 'w3', watch: 'ID-card dispositions after vendor cutover', rule: 'Alert if still > 2x baseline on day 21', horizon: '21 days', status: 'armed' },
  { id: 'w4', watch: 'QLE module non-completes on the floor', rule: 'Alert if their callback rate stays > 30%', horizon: '30 days', status: 'armed' },
];

export const SAMPLE_DIRECTIVES = [
  { to: 'Claims supervisor', action: 'Pair Ryan with Vanessa on denial callbacks for 5 days. Do not add seats. Add a shared denial script from DOC exhibit B.', why: 'Same two people, same reason code, same LOUD phrase. A third agent will not fix a script gap.', letter: 'Team — for the next five shifts, denial callbacks in Medical route to a two-person pod (Ryan / Vanessa) with the updated prior-auth script. This is not a performance action. The carrier changed the window. We are matching the work to the people who already hold the context.' },
  { to: 'Floor lead', action: 'Move one lunch out of the 12:00 stack. Recover about 18% wait in that hour without hiring.', why: 'Qflo already shows the hole. CORPS// still says fully staffed. That contradiction is the tell.', letter: 'Please shift one scheduled lunch to 14:00 starting Monday. The 12:05-12:50 window is where members wait, not where we lack bodies. I will revisit after five days of wait data.' },
  { to: 'Training', action: 'Make the QLE LEARN module a gate before unsupervised inbound. Incomplete seats are writing second calls.', why: '61% complete. Incomplete seats = 44% of callback dispositions.', letter: 'Effective next Monday, agents who have not finished Qualifying Life Events stay on assisted queue only. This is cheaper than the callbacks those seats are creating.' },
];

export const SAMPLE_TAX_NOTE = {
  title: 'Timing the company can actually file against',
  body: 'COBRA / QLE inbound and OE overtime cluster in weeks 12-14 and again at packet-drop + 6 days. That pattern has repeated three seasons. Documented peak-load windows are what a benefits administrator uses when they talk to finance about staffing, training hours, and whether a slice of LEARN time is qualified educational assistance — not a tax opinion, a calendar the books can see.',
};

export const SAMPLE_PULSE = [
  { dept: 'Medical', signal: 'denials heating', tone: 'hot' },
  { dept: 'Retirement', signal: 'stable', tone: 'ok' },
  { dept: 'Leave / COBRA', signal: 'pre-OE rise', tone: 'warm' },
  { dept: 'Claims pod', signal: 'mood + load', tone: 'hot' },
  { dept: 'New hire desk', signal: 'quiet', tone: 'ok' },
  { dept: 'Vendor / cards', signal: 'reprint storm', tone: 'warm' },
];

const QA = [
  { match: /pain|biggest|quarter/i, confidence: 'high', answer: 'The quarter pain is not call volume. It is prior-auth denials concentrated on two agents, a 12:00 coverage hole that looks like understaffing, and ID-card reprints that are one vendor incident with 47 names on it. Volume is the shadow. Those three are the object.', key_findings: ['Medical / prior-auth dispositions +41% WoW after the carrier bulletin.', 'Ryan + Vanessa hold a disproportionate share of that queue and both EQUO scores are falling.', 'ID-card reason codes 3.1x after print-vendor cutover — DOC search logs agree.'], citations: [{ ref: 'CC-DISP', source: 'Call dispositions 30d' }, { ref: 'EQUO-MOOD', source: 'EQUO check-ins' }, { ref: 'DOC-SEARCH', source: 'SharePoint search' }] },
  { match: /happiness|department|mood/i, confidence: 'high', answer: 'Org mood is not one number. Claims pod is the hole — two named agents under 1.5 for three checks. Retirement and new-hire desk are flat-to-fine. Leave/COBRA is warming because OE is coming, not because the team is failing. Treat employee happiness as a map, not an average.', key_findings: ['Claims pod: declining. Everyone else: hold.', 'PTO denials in that pod: 4 in 6 weeks — CORPS//.', 'LOUD theme in claims: no backup on denials.'], citations: [{ ref: 'EQUO', source: 'EQUO by department' }, { ref: 'CORPS', source: 'PTO + OT' }, { ref: 'LOUD', source: 'Open comments' }] },
  { match: /pto|denial rates|team/i, confidence: 'medium', answer: 'PTO denials are not evenly spread. Four of the last six sit in the claims pod — the same pod carrying the prior-auth spike. Denying rest on the team that is already over-indexed on the hardest work is how you buy attrition with a calendar.', key_findings: ['4 denials / 6 weeks in claims. 0-1 elsewhere.', 'Those denials sit inside Ryan/Vanessa 21-day window.', 'CORPS// still reads as policy applied consistently. OMMNI reads the collision.'], citations: [{ ref: 'CORPS-PTO', source: 'Leave decisions' }, { ref: 'EQUO', source: 'Pod mood' }] },
  { match: /burnout/i, confidence: 'high', answer: 'Burnout risk is named, not abstract: Ryan Hinton 74% probability to threshold in about 18 days, Vanessa Reyes 61% in about 26. Both are on the denial queue. A hiring req will lose to a script plus a lunch move this month.', key_findings: ['Two-person problem, not a floor-wide collapse.', 'Overtime 11.4h/wk on Ryan. Knowledge-gap weeks on Vanessa.', 'Recommended directive already drafted for the claims supervisor.'], citations: [{ ref: 'EQUO-TREND', source: '8-week mood' }, { ref: 'CC-LOAD', source: 'Personal queue share' }] },
  { match: /repeat|pattern|this month/i, confidence: 'high', answer: 'Repeat shapes this month: prior-auth already-authorized, ID-card after the vendor cut, and QLE callbacks from agents who have not finished LEARN. Those three reason codes explain more recontacts than any client or carrier slice — which is why the pack stays aggregated.', key_findings: ['Prior-auth phrase family is new since the bulletin.', 'ID-card is one incident, many names.', 'QLE incompletes write second calls.'], citations: [{ ref: 'CC-SHAPE', source: 'Disposition taxonomy' }, { ref: 'LEARN', source: 'Module completion' }] },
];

export function answerOmmniQuestion(question) {
  const q = (question || '').trim();
  const hit = QA.find((row) => row.match.test(q));
  if (hit) return { answer: hit.answer, key_findings: hit.key_findings, citations: hit.citations, confidence: hit.confidence };
  return {
    answer: 'I do not have a canned read on that phrasing. Across the suite right now the live tensions are: prior-auth load on two agents, a noon coverage hole, and a print-vendor reprint storm. Ask one of those three and I will go deep.',
    key_findings: SAMPLE_ANOMALIES.slice(0, 3).map((a) => a.title),
    citations: [{ ref: 'OMMNI', source: 'Sample hive (engine offline or unmatched)' }],
    confidence: 'medium',
  };
}

export function shouldUseOmmniSample(liveForecasts) {
  if (PITCH_MODE) return true;
  if (!Array.isArray(liveForecasts) || liveForecasts.length === 0) return true;
  return liveForecasts.some((f) => (Number(f.confidence) || 0) < 0.2);
}
