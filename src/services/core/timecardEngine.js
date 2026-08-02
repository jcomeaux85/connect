// timecardEngine.js — Pure time & attendance calculation rules for CORPS//.
// No React, no Base44, no external deps. Fully portable to any JS runtime.
//
// Implements FLSA-compliant weekly overtime, optional daily overtime /
// double-time, automatic lunch deduction, and quarter-hour rounding —
// the core "time & attendance" rules an HRIS must enforce.

// ── Time parsing ──────────────────────────────────────────────
// "HH:mm" -> minutes since midnight. Handles overnight by staying absolute;
// overnight spans are resolved by computeDuration which knows the clock-in date.
export function timeToMinutes(t) {
  if (!t || typeof t !== "string") return null;
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

// ── Duration ──────────────────────────────────────────────────
// clockInISO / clockOutISO are ISO date-time strings.
// Returns hours worked as a float, after optional unpaid lunch deduction.
export function computeDuration(clockInISO, clockOutISO, opts = {}) {
  const inMs = new Date(clockInISO).getTime();
  const outMs = new Date(clockOutISO).getTime();
  if (isNaN(inMs) || isNaN(outMs) || outMs <= inMs) return 0;
  let hours = (outMs - inMs) / 3600000;

  // Auto-deduct an unpaid lunch if the shift is long enough and none recorded.
  const { autoLunchMinutes = 0, autoLunchThresholdMinutes = 360 } = opts;
  if (autoLunchMinutes && hours * 60 >= autoLunchThresholdMinutes) {
    hours -= autoLunchMinutes / 60;
  }
  return Math.max(0, hours);
}

// ── Rounding ──────────────────────────────────────────────────
// Round to the nearest N-minute increment (default 15 / quarter-hour),
// the standard payroll rounding rule. 7m -> 0, 8m -> 15, 22m -> 15, 23m -> 30.
export function roundToIncrement(hours, incrementMinutes = 15) {
  if (!incrementMinutes) return hours;
  const totalMin = Math.round(hours * 60);
  const inc = Math.max(1, incrementMinutes);
  return Math.round(totalMin / inc) * inc / 60;
}

// ── Hours classification ──────────────────────────────────────
// Split a weekly total into regular / overtime / double-time buckets.
// FLSA default: hours over 40 in a workweek are 1.5x (OT).
// Optional daily OT (e.g. CA: >8/day) and double-time (e.g. >12/day).
export function classifyHours(totalHours, rules = {}) {
  const {
    weeklyOvertimeThreshold = 40,
    dailyOvertimeThreshold = null,   // e.g. 8
    dailyDoubletimeThreshold = null, // e.g. 12
    isDaily = false,
  } = rules;

  const hrs = Math.max(0, totalHours);
  let regular = hrs;
  let overtime = 0;
  let doubletime = 0;

  if (isDaily && dailyDoubletimeThreshold != null && hrs > dailyDoubletimeThreshold) {
    doubletime = hrs - dailyDoubletimeThreshold;
    regular = dailyDoubletimeThreshold;
  }
  if (isDaily && dailyOvertimeThreshold != null && regular > dailyOvertimeThreshold) {
    overtime = regular - dailyOvertimeThreshold;
    regular = dailyOvertimeThreshold;
  }
  // Weekly FLSA OT applies on top: any hours beyond the weekly threshold
  // that haven't already been counted as daily OT/DT.
  const nonDt = hrs - doubletime;
  if (weeklyOvertimeThreshold != null && nonDt > weeklyOvertimeThreshold) {
    const weeklyOt = nonDt - weeklyOvertimeThreshold;
    overtime += weeklyOt;
    regular = Math.max(0, regular - weeklyOt);
  }
  return { regular, overtime, doubletime, total: hrs };
}

// ── Weekly aggregation ────────────────────────────────────────
// Given raw timecard entries [{ work_date, hours, entry_type, ... }],
// return per-week totals + classified breakdown.
// A "work week" is anchored on weekStartDay (0=Sun ... 6=Sat).
export function aggregateWeekly(entries, rules = {}) {
  const {
    weekStartDay = 0,
    roundingMinutes = 15,
    autoLunchMinutes = 0,
  } = rules;

  const buckets = {};
  for (const e of entries || []) {
    if (!e.work_date) continue;
    const d = new Date(e.work_date + "T00:00:00");
    if (isNaN(d.getTime())) continue;
    const key = weekKey(d, weekStartDay);
    if (!buckets[key]) buckets[key] = { weekStart: key, rawHours: 0, entries: [] };
    const rounded = roundToIncrement(e.hours || 0, roundingMinutes);
    buckets[key].rawHours += rounded;
    buckets[key].entries.push({ ...e, roundedHours: rounded });
  }

  return Object.values(buckets)
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1))
    .map((wk) => ({
      ...wk,
      classified: classifyHours(wk.rawHours, rules),
    }));
}

// Return YYYY-MM-DD of the week's anchor for date d given weekStartDay.
function weekKey(d, weekStartDay) {
  const day = d.getDay();
  let diff = (day - weekStartDay + 7) % 7;
  const anchor = new Date(d);
  anchor.setDate(d.getDate() - diff);
  return anchor.toISOString().slice(0, 10);
}

// ── Pay period summary ────────────────────────────────────────
// Summarize entries across a pay period into classified totals
// suitable for gross-pay computation.
export function summarizePayPeriod(entries, rules = {}) {
  const weeks = aggregateWeekly(entries, rules);
  let regular = 0, overtime = 0, doubletime = 0, total = 0;
  for (const w of weeks) {
    regular += w.classified.regular;
    overtime += w.classified.overtime;
    doubletime += w.classified.doubletime;
    total += w.classified.total;
  }
  return { regular, overtime, doubletime, total };
}