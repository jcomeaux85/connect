import { PITCH_MODE } from '@/lib/pitchMode';

export const SAMPLE_FORECASTS = [
  { type: 'burnout_risk', probability: 74, projected_next: '18 days to threshold', trajectory: [2.1, 2.0, 1.8, 1.6, 1.4, 1.2, 1.1, 0.9], confidence: 0.86, entity: { name: 'Ryan Hinton', email: 'ryan@queue.demo' }, factors: [{ label: 'Mood trend', value: 'declining 8 wks' }, { label: 'Overtime', value: '11.4h / wk' }, { label: 'Repeat claims', value: '+38% personal load' }] },
  { type: 'burnout_risk', probability: 61, projected_next: '26 days to threshold', trajectory: [2.4, 2.2, 2.1, 1.9, 1.7, 1.6, 1.5, 1.4], confidence: 0.81, entity: { name: 'Vanessa Reyes', email: 'vanessa@queue.demo' }, factors: [{ label: 'Mood trend', value: 'declining' }, { label: 'EQUO flags', value: '3 knowledge-gap weeks' }, { label: 'LOUD score', value: 'fair / slipping' }] },
  { type: 'csat_trajectory', probability: 68, projected_next: '3.6 / 5 next month', trajectory: [4.6, 4.5, 4.4, 4.2, 4.0, 3.9, 3.8, 3.7], confidence: 0.79, entity: { name: 'Medical / Prior-Auth queue' }, factors: [{ label: 'Current avg', value: '3.8' }, { label: 'Trend', value: 'declining' }, { label: 'Driver', value: 'same-day denial letters' }, { label: 'Lag', value: 'CSAT trails mood by 4 days' }] },
  { type: 'call_volume', probability: 84, projected_next: '+22% week of Oct 6', trajectory: [142, 138, 151, 148, 166, 171, 164, 189], confidence: 0.84, entity: { name: 'Org-wide inbound' }, factors: [{ label: 'Daily avg', value: '164' }, { label: 'Trend', value: 'rising into OE' }, { label: 'Trigger', value: 'open enrollment packets drop' }] },
  { type: 'attrition_risk', probability: 41, projected_next: '1 transfer request this quarter', trajectory: [12, 14, 18, 21, 24, 28, 31, 34], confidence: 0.72, entity: { name: 'Claims pod' }, factors: [{ label: 'Internal moves', value: '2 asked off phones' }, { label: 'PTO denials', value: '4 in 6 weeks' }, { label: 'LOUD theme', value: 'no backup on denials' }] },
  { type: 'sla_risk', probability: 79, projected_next: '12:05-12:50 breach window daily', trajectory: [1.1, 1.2, 1.4, 1.8, 2.1, 2.4, 2.3, 2.4], confidence: 0.91, entity: { name: 'Noon coverage hole' }, factors: [{ label: 'Wait vs baseline', value: '2.4x' }, { label: 'Cause', value: 'stacked lunches, not headcount' }, { label: 'CORPS read', value: 'fully staffed' }] },
  { type: 'cost_drift', probability: 63, projected_next: '$18.4k unplanned OT this OE window', trajectory: [4.2, 4.8, 5.1, 6.4, 8.2, 11.0, 14.6, 18.4], confidence: 0.77, entity: { name: 'Workforce + payroll lock' }, factors: [{ label: 'Pattern age', value: '3 seasons' }, { label: 'Bonus lock', value: 'sits inside packet+6d' }, { label: 'Avoidable share', value: '~61% with one lunch move' }] },
];

export const SAMPLE_STORIES = [
  { severity: 'high', modules: ['EQUO', 'Call Center', 'LOUD'], title: 'Prior-auth denials are burning the same two agents — and members feel it 4 days later.', narrative: 'EQUO mood for Ryan and Vanessa dropped in lockstep the week a national carrier tightened prior-auth windows. Their personal queues absorbed 38% more denial callbacks. LOUD comments that week cluster on already-authorized. CSAT on Medical trails the mood drop by four days. No single module sees the chain. OMMNI does.', refs: ['EQUO/mood-8wk', 'CC/disp-prior-auth', 'LOUD/theme-scripts'], notify: 'Claims supervisor + workforce desk' },
  { severity: 'high', modules: ['Qflo', 'Call Center', 'CORPS//'], title: 'Lunch stacking at 12:00 is inventing a fake staffing shortage.', narrative: 'Qflo shows Chris and Jarrad lunches overlapping the same 45 minutes as two reserved breaks. Inbound wait in that window jumped 2.4x while headcount on paper stayed flat. CORPS// still reports fully staffed. The company is not short people. It is short that hour.', refs: ['Qflo/lunch-grid', 'CC/wait-by-hod', 'CORPS/roster'], notify: 'Floor lead' },
  { severity: 'medium', modules: ['Call Center', 'DOC', 'AUTHLINK'], title: 'ID-card reprints are one vendor incident wearing 47 different member names.', narrative: 'Disposition ID Card Inquiry rose 3.1x after the print vendor cutover. DOC searches for the same plan PDF spiked the same morning. AUTHLINK proxies started calling on behalf of spouses who never received the new card. Pulled apart, each case looks unique. Aggregated, it is one operational failure with no PHI required to see it.', refs: ['CC/reason-id-card', 'DOC/search-idcard', 'AUTHLINK/volume'], notify: 'Client success + vendor manager' },
  { severity: 'medium', modules: ['LEARN', 'Call Center', 'EQUO'], title: 'Agents who skipped the QLE module are manufacturing second calls.', narrative: 'LEARN completion for Qualifying Life Events is 61% on the floor. Those incomplete seats account for 44% of callback scheduled dispositions this month and a higher EQUO knowledge-gap rate. Training debt is showing up as handle time, not as a red LEARN tile.', refs: ['LEARN/qle-module', 'CC/resolution-callback', 'EQUO/knowledge-gap'], notify: 'Training + team leads' },
  { severity: 'low', modules: ['CORPS//', 'Call Center'], title: 'Open enrollment volume will land the week payroll already locks bonuses.', narrative: 'Last three OE seasons, inbound peaked 6-9 days after packets mailed. Payroll lock for annual bonuses sits inside that window. Overtime this year will look like a surprise unless workforce books the overlap now. Same pattern, third year.', refs: ['CC/oe-history', 'CORPS/payroll-calendar'], notify: 'HR ops + finance partner' },
  { severity: 'high', modules: ['DOC', 'Call Center', 'LEARN'], title: 'The prior-auth exhibit is being searched, not known.', narrative: 'The same SPD exhibit was opened 86 times in seven days and bookmarked zero times. Average handle on those calls is 4:10 longer than the queue mean. LEARN has no module that names the exhibit. Knowledge is leaking through search. Search is not training.', refs: ['DOC/search-spd', 'CC/aht-by-reason', 'LEARN/catalog'], notify: 'Knowledge owner + training' },
];

export const SAMPLE_ANOMALIES = [
  { severity: 'high', source_module: 'Call Center', type: 'volume_spike', title: 'Medical / prior-auth dispositions +41% week over week', description: 'Medical / prior-auth dispositions +41% week over week. Not explained by headcount or new clients. Carrier bulletin dropped Tuesday.', detail: 'Carrier bulletin dropped Tuesday.', window: '7d', data_points: [{ metric: 'wow_change', value: '+41%' }, { metric: 'concentration', value: '2 agents hold 38%' }] },
  { severity: 'high', source_module: 'EQUO', type: 'mood_collapse', title: 'Two-person mood collapse in claims pod', description: 'Ryan Hinton and Vanessa Reyes both below 1.5 for three consecutive checks. Pair risk, not floor-wide collapse.', detail: 'Both below 1.5 for three checks.', window: '21d', data_points: [{ metric: 'ryan', value: '1.1' }, { metric: 'vanessa', value: '1.4' }] },
  { severity: 'medium', source_module: 'Qflo', type: 'coverage_hole', title: 'Covered-hour hole 12:05-12:50', description: 'Two lunches + one reserved break. Wait 2.4x baseline. CORPS// still reads fully staffed.', detail: 'Wait 2.4x baseline.', window: 'today', data_points: [{ metric: 'wait_multiple', value: '2.4x' }, { metric: 'seats_missing', value: '3 overlapping' }] },
  { severity: 'medium', source_module: 'LOUD', type: 'theme_emergence', title: 'Theme already-authorized is a new cluster', description: 'Did not exist as a phrase family before the prior-auth window change. Script gap, not attitude.', detail: 'New phrase family since the bulletin.', window: '14d', data_points: [{ metric: 'theme_share', value: '19% of Medical comments' }] },
  { severity: 'low', source_module: 'DOC', type: 'knowledge_leak', title: 'Same SPD searched 86 times, zero bookmarks', description: 'Agents cannot find the prior-auth exhibit. Knowledge problem wearing a volume costume.', detail: 'Knowledge, not volume.', window: '7d', data_points: [{ metric: 'searches', value: '86' }, { metric: 'bookmarks', value: '0' }] },
  { severity: 'medium', source_module: 'AUTHLINK', type: 'proxy_surge', title: 'Spouse-proxy verifications +2.6x after card vendor cutover', description: 'AUTHLINK volume is not fraud. It is the reprint storm arriving as identity work.', detail: 'Reprint storm as identity work.', window: '14d', data_points: [{ metric: 'proxy_wow', value: '+2.6x' }] },
];

export const SAMPLE_SOURCES = [
  { key: 'equo', label: 'EQUO', metrics: { check_ins: 214, declining: 11, flags: 7 } },
  { key: 'loud', label: 'LOUD', metrics: { responses: 89, themes: 6, nps: 41 } },
  { key: 'call_center', label: 'Call Center', metrics: { calls_30d: 4820, aht_sec: 312, first_call: 64 } },
  { key: 'corps', label: 'CORPS//', metrics: { on_shift: 18, pto_denied: 4, ot_hours: 126 } },
  { key: 'doc', label: 'DOC', metrics: { searches_7d: 412, unique_exhibits: 19, bookmarks: 3 } },
  { key: 'learn', label: 'LEARN', metrics: { qle_complete: '61%', gated_seats: 7, callbacks_tied: '44%' } },
  { key: 'authlink', label: 'AUTHLINK', metrics: { verifications: 156, proxy_share: '38%', reprint_tied: 47 } },
  { key: 'qflo', label: 'Qflo', metrics: { covered_hours: '93%', noon_hole: '45m', stacked_breaks: 3 } },
];

export const SAMPLE_WATCHLIST = [
  { id: 'w1', watch: 'Prior-auth denials in Medical', rule: 'Alert if week-over-week > 12%', horizon: '14 days', status: 'armed' },
  { id: 'w2', watch: 'Ryan Hinton + Vanessa Reyes mood pair', rule: 'Alert if both stay at or below 1.5 for another check-in', horizon: 'ongoing', status: 'triggered' },
  { id: 'w3', watch: 'ID-card dispositions after vendor cutover', rule: 'Alert if still > 2x baseline on day 21', horizon: '21 days', status: 'armed' },
  { id: 'w4', watch: 'QLE module non-completes on the floor', rule: 'Alert if their callback rate stays > 30%', horizon: '30 days', status: 'armed' },
  { id: 'w5', watch: 'Noon wait multiple', rule: 'Alert if 12:05-12:50 wait stays >= 2x after the lunch move', horizon: '5 days', status: 'armed' },
];

export const SAMPLE_DIRECTIVES = [
  { to: 'Claims supervisor', action: 'Pair Ryan with Vanessa on denial callbacks for 5 days. Do not add seats. Add a shared denial script from DOC exhibit B.', why: 'Same two people, same reason code, same LOUD phrase. A third agent will not fix a script gap.', letter: 'Team — for the next five shifts, denial callbacks in Medical route to a two-person pod (Ryan / Vanessa) with the updated prior-auth script. This is not a performance action. The carrier changed the window. We are matching the work to the people who already hold the context.' },
  { to: 'Floor lead', action: 'Move one lunch out of the 12:00 stack. Recover about 18% wait in that hour without hiring.', why: 'Qflo already shows the hole. CORPS// still says fully staffed. That contradiction is the tell.', letter: 'Please shift one scheduled lunch to 14:00 starting Monday. The 12:05-12:50 window is where members wait, not where we lack bodies. I will revisit after five days of wait data.' },
  { to: 'Training', action: 'Make the QLE LEARN module a gate before unsupervised inbound. Incomplete seats are writing second calls.', why: '61% complete. Incomplete seats = 44% of callback dispositions.', letter: 'Effective next Monday, agents who have not finished Qualifying Life Events stay on assisted queue only. This is cheaper than the callbacks those seats are creating.' },
  { to: 'Vendor / client success', action: 'Treat ID-card as one incident. Stop counting 47 unique members as 47 unique problems.', why: 'AUTHLINK proxies + DOC search + one reason code all fire the same morning as the print cutover.', letter: 'The reprint storm is a single vendor event. Please open one vendor ticket and one member comms template. Do not open 47 cases. OMMNI will watch whether the reason code falls after the template ships.' },
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

export const SAMPLE_BRIEFING = {
  as_of: 'This morning · hive read',
  headline: 'You are not understaffed. You are mis-aimed.',
  body: 'Three objects, one company: a carrier tightened prior-auth and two named agents caught the blast; lunches stacked into a fake shortage at noon; a print vendor cutover is arriving as 47 unique ID-card lives. Volume is the shadow. Those three are the object. OMMNI already drafted the letters. The cost of waiting until Friday is an 18-day burnout clock and a 4-day CSAT lag you will explain as the phones.',
  seeing: [
    'Ryan 74% to threshold in 18 days. Vanessa 61% in 26. Same queue.',
    'Wait 2.4x between 12:05 and 12:50. Headcount on paper is fine.',
    'CSAT on Medical will print the mood drop from four days ago. It is already in the mail.',
    'ID-card + AUTHLINK proxy + one PDF search spike = one vendor, not a membership crisis.',
  ],
};

export const SAMPLE_CASCADES = [
  { id: 'c1', name: 'Denial → mood → member', lag: '4 days', cost: 'CSAT -0.4 on Medical', steps: [{ module: 'Carrier', event: 'Prior-auth window tightens Tuesday' }, { module: 'Call Center', event: 'Denial callbacks concentrate on Ryan + Vanessa' }, { module: 'EQUO', event: 'Paired mood drop below 1.5' }, { module: 'LOUD', event: 'already-authorized becomes a theme' }, { module: 'Member', event: 'CSAT on Medical prints the lag' }] },
  { id: 'c2', name: 'Calendar → wait → overtime', lag: 'same day', cost: '~18% of noon wait is optional', steps: [{ module: 'CORPS//', event: 'Roster reads fully staffed' }, { module: 'Qflo', event: 'Two lunches + reserved break stack at 12:00' }, { module: 'Call Center', event: 'Wait 2.4x in a 45-minute hole' }, { module: 'Finance', event: 'OT requested as if the floor is short people' }] },
  { id: 'c3', name: 'Vendor → identity → second call', lag: '1-3 days', cost: '47 cases that should be one ticket', steps: [{ module: 'Vendor', event: 'ID-card print cutover' }, { module: 'DOC', event: 'Same plan PDF searched 86x, bookmarked 0' }, { module: 'AUTHLINK', event: 'Spouse proxies +2.6x' }, { module: 'Call Center', event: 'ID Card Inquiry 3.1x — each name looks unique' }] },
];

export const SAMPLE_COUNTERFACTUALS = [
  { id: 'cf1', move: 'Shift one lunch to 14:00 Monday', if_yes: 'Noon wait multiple falls toward 1.4x within five days. No req. No OT story.', if_no: 'The hole becomes we need two more seats by the OE packet week.', dollars: '$0 hire · ~$4.1k OT avoided in the window', confidence: 0.88 },
  { id: 'cf2', move: 'Pair Ryan / Vanessa + ship DOC exhibit B script', if_yes: 'Personal denial load stops compounding. Burnout clocks pause instead of hiring against a script gap.', if_no: 'One transfer request this quarter becomes two. CSAT lag keeps printing.', dollars: 'Attrition replacement ~$9-14k vs. a script', confidence: 0.81 },
  { id: 'cf3', move: 'Gate unsupervised inbound on QLE LEARN complete', if_yes: 'Callback-scheduled dispositions from incomplete seats fall inside 30 days.', if_no: 'Training debt keeps arriving as handle time and EQUO knowledge-gap flags.', dollars: 'Second-call cost > module time', confidence: 0.76 },
];

export const SAMPLE_HORIZON = [
  { when: 'Today 12:05-12:50', what: 'Coverage hole repeats unless the lunch moves.', tone: 'hot' },
  { when: 'Next 4 days', what: 'Medical CSAT will publish the mood drop already on the books.', tone: 'warm' },
  { when: 'Packet drop + 6 days', what: 'OE inbound +22%. Bonus lock sits in the same week. Third year in a row.', tone: 'hot' },
  { when: '18 days', what: 'Ryan burnout probability crosses the internal threshold if denial load stays paired.', tone: 'hot' },
  { when: 'Day 21 of vendor cutover', what: 'ID-card reason code should be back under 2x if the template shipped. Watch w3.', tone: 'ok' },
];

export const SAMPLE_UNASKED = [
  { q: 'Who will quietly ask off phones this quarter?', a: 'Claims pod. Two already asked. The next signal is a transfer request, not a resignation letter. LOUD theme is no backup on denials — that is the tell, not a survey score.' },
  { q: 'What will finance think is a volume problem that is actually a calendar?', a: 'OE overtime the week bonuses lock. Three-season pattern. Book it now or explain it later as surprise load.' },
  { q: 'Which member-looking events contain zero PHI and still run the floor?', a: 'Reason-code shape, wait-by-hour, DOC search without the query text, AUTHLINK volume without the face. That is the telemetry posture: after-call aggregate, identifier-free.' },
];

const QA = [
  { match: /pain|biggest|quarter/i, confidence: 'high', answer: 'The quarter pain is not call volume. It is prior-auth denials concentrated on two agents, a 12:00 coverage hole that looks like understaffing, and ID-card reprints that are one vendor incident with 47 names on it. Volume is the shadow. Those three are the object.', key_findings: ['Medical / prior-auth dispositions +41% WoW after the carrier bulletin.', 'Ryan + Vanessa hold a disproportionate share of that queue and both EQUO scores are falling.', 'ID-card reason codes 3.1x after print-vendor cutover — DOC search logs agree.'], citations: [{ ref: 'CC-DISP', source: 'Call dispositions 30d' }, { ref: 'EQUO-MOOD', source: 'EQUO check-ins' }, { ref: 'DOC-SEARCH', source: 'SharePoint search' }] },
  { match: /happiness|department|mood/i, confidence: 'high', answer: 'Org mood is not one number. Claims pod is the hole — two named agents under 1.5 for three checks. Retirement and new-hire desk are flat-to-fine. Leave/COBRA is warming because OE is coming, not because the team is failing. Treat employee happiness as a map, not an average.', key_findings: ['Claims pod: declining. Everyone else: hold.', 'PTO denials in that pod: 4 in 6 weeks — CORPS//.', 'LOUD theme in claims: no backup on denials.'], citations: [{ ref: 'EQUO', source: 'EQUO by department' }, { ref: 'CORPS', source: 'PTO + OT' }, { ref: 'LOUD', source: 'Open comments' }] },
  { match: /pto|denial rates|team/i, confidence: 'medium', answer: 'PTO denials are not evenly spread. Four of the last six sit in the claims pod — the same pod carrying the prior-auth spike. Denying rest on the team that is already over-indexed on the hardest work is how you buy attrition with a calendar.', key_findings: ['4 denials / 6 weeks in claims. 0-1 elsewhere.', 'Those denials sit inside Ryan/Vanessa 21-day window.', 'CORPS// still reads as policy applied consistently. OMMNI reads the collision.'], citations: [{ ref: 'CORPS-PTO', source: 'Leave decisions' }, { ref: 'EQUO', source: 'Pod mood' }] },
  { match: /burnout/i, confidence: 'high', answer: 'Burnout risk is named, not abstract: Ryan Hinton 74% probability to threshold in about 18 days, Vanessa Reyes 61% in about 26. Both are on the denial queue. A hiring req will lose to a script plus a lunch move this month.', key_findings: ['Two-person problem, not a floor-wide collapse.', 'Overtime 11.4h/wk on Ryan. Knowledge-gap weeks on Vanessa.', 'Recommended directive already drafted for the claims supervisor.'], citations: [{ ref: 'EQUO-TREND', source: '8-week mood' }, { ref: 'CC-LOAD', source: 'Personal queue share' }] },
  { match: /repeat|pattern|this month/i, confidence: 'high', answer: 'Repeat shapes this month: prior-auth already-authorized, ID-card after the vendor cut, and QLE callbacks from agents who have not finished LEARN. Those three reason codes explain more recontacts than any client or carrier slice — which is why the pack stays aggregated.', key_findings: ['Prior-auth phrase family is new since the bulletin.', 'ID-card is one incident, many names.', 'QLE incompletes write second calls.'], citations: [{ ref: 'CC-SHAPE', source: 'Disposition taxonomy' }, { ref: 'LEARN', source: 'Module completion' }] },
  { match: /what if|lunch|noon|staff|hire|hiring/i, confidence: 'high', answer: 'If you move one lunch to 14:00, the 12:05-12:50 hole stops impersonating a staffing crisis. Counterfactual: hire two seats and leave the stack — you will still miss that hour, and finance will fund a ghost. The omniscient move is the cheaper one. Correspondence for the floor lead is already written.', key_findings: ['Wait 2.4x in a 45-minute window. Roster is full.', 'Avoidable OT in the OE window ~$4.1k from this one calendar fix.', 'CORPS// and Qflo disagree. Believe the clock, not the headcount.'], citations: [{ ref: 'QFLO', source: 'Lunch grid' }, { ref: 'CC-WAIT', source: 'Wait by hour' }, { ref: 'CORPS', source: 'Roster' }] },
  { match: /cost|dollar|overtime|ot\b|finance|bonus/i, confidence: 'high', answer: 'Unplanned OT into the OE window is tracking toward $18.4k. About 61% of that is the noon hole plus denial load sitting on two people while payroll already locked bonuses. That is not a tax opinion. It is a calendar finance can book against, third season running.', key_findings: ['Packet drop + 6 days = inbound peak. Same as the last two OEs.', 'Bonus lock sits inside that week.', 'Documented peak-load windows beat a surprise OT narrative.'], citations: [{ ref: 'CC-OE', source: 'Three-season inbound' }, { ref: 'CORPS-PAY', source: 'Payroll calendar' }] },
  { match: /tomorrow|next 72|horizon|will happen|predict/i, confidence: 'high', answer: 'Next 72 hours are already scheduled: the noon hole repeats today; Medical CSAT will print a four-day-old mood drop; AUTHLINK proxies keep arriving as if they were new identities. Nothing in that sentence requires a new event. It requires you to act on objects already in the hive.', key_findings: ['Today 12:05-12:50: coverage hole repeats unless the lunch moves.', 'Next 4 days: Medical CSAT publishes the mood drop already on the books.', 'Packet drop + 6 days: OE inbound +22% against a bonus lock.'], citations: [{ ref: 'OMMNI-HZ', source: '72-hour horizon' }] },
  { match: /omniscient|don.t know|did not ask|unasked|what am i missing/i, confidence: 'medium', answer: 'The thing you did not ask: who will quietly request off phones, which finance surprise is actually a calendar, and which member-looking storm contains no PHI. Claims pod, OE week vs bonus lock, ID-card as one vendor event. Those are the questions a billion-dollar operator pays an omniscient layer to ask first.', key_findings: ['Who will quietly ask off phones this quarter?', 'What will finance think is a volume problem that is actually a calendar?', 'Which member-looking events contain zero PHI and still run the floor?'], citations: [{ ref: 'OMMNI-SIGHT', source: 'Unasked set' }] },
  { match: /telemetry|phi|privacy|aggregate/i, confidence: 'high', answer: 'Telemetry here is after-call and identifier-free: disposition shape, duration band, transcript-class, wait-by-hour, DOC search counts without the query string. No member name leaves the floor pack. The reprint storm is visible as a reason-code spike plus AUTHLINK volume. That is enough to sell a carrier pulse. It is not a case file.', key_findings: ['projectCall strips identifiers before any pack leaves the suite.', 'OMMNI correlates modules on aggregates, then writes letters to roles — not to members.', 'Pitch proof does not require PHI. It requires the chain.'], citations: [{ ref: 'CC-TAX', source: 'Disposition taxonomy' }, { ref: 'OMMNI', source: 'Hive posture' }] },
];

export function answerOmmniQuestion(question) {
  const q = (question || '').trim();
  const hit = QA.find((row) => row.match.test(q));
  if (hit) return { answer: hit.answer, key_findings: hit.key_findings, citations: hit.citations, confidence: hit.confidence };
  return {
    answer: 'I do not have a canned read on that phrasing. Across the suite right now the live tensions are: prior-auth load on two agents, a noon coverage hole, and a print-vendor reprint storm. Ask one of those three — or ask what happens if we move a lunch — and I will go deep.',
    key_findings: SAMPLE_ANOMALIES.slice(0, 3).map((a) => a.title),
    citations: [{ ref: 'OMMNI', source: 'Sample hive (engine offline or unmatched)' }],
    confidence: 'medium',
  };
}

export function normalizeConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n > 1 ? n / 100 : n;
}

export function isWeakLiveForecasts(liveForecasts) {
  if (!Array.isArray(liveForecasts) || liveForecasts.length === 0) return true;
  let weak = 0;
  for (const f of liveForecasts) {
    const conf = normalizeConfidence(f.confidence);
    const prob = Number(f.probability) || 0;
    const proj = f.projected_next;
    const projIsTinyNumber = typeof proj === 'number' && Math.abs(proj) < 15;
    const csatSaturated = f.type === 'csat_trajectory' && prob >= 95 && (conf < 0.8 || projIsTinyNumber);
    if (conf < 0.35 || projIsTinyNumber || csatSaturated) weak += 1;
  }
  return weak >= Math.max(1, Math.ceil(liveForecasts.length / 2));
}

export function shouldUseOmmniSample(liveForecasts) {
  if (PITCH_MODE) return true;
  return isWeakLiveForecasts(liveForecasts);
}

export function getSampleOverview() {
  return { access_tier: 'admin', data_sources: SAMPLE_SOURCES };
}

export function getSampleAnomalies() {
  return { anomalies: SAMPLE_ANOMALIES };
}
