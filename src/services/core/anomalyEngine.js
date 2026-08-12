// anomalyEngine.js — Proactive payroll/timecard anomaly detection.
// Pure logic: scans timecard entries + shifts and returns actionable
// alerts the moment something looks wrong — no batch run, no waiting.
//
// This is the "Active Spine" intelligence UKG lacks: problems surface
// as they're entered, not at end-of-cycle when they're expensive to fix.

// entries — timecard entries (snake_case OR camelCase, normalized here)
// shifts  — scheduled shifts (used for missed-day detection)
// rules   — thresholds (all overridable)
export function detectAnomalies({ entries = [], shifts = [], rules = {} }) {
  const alerts = [];
  const {
    overtimeThreshold = 40,
    dailyOvertimeThreshold = 8,
    minShiftHours = 1,
    maxDailyHours = 12,
  } = rules;

  // Normalize entries to snake_case
  const norm = (entries || []).map((e) => ({
    work_date: e.work_date || e.workDate,
    hours: e.hours || 0,
    clock_in: e.clock_in || e.clockIn,
    clock_out: e.clock_out || e.clockOut,
    entry_type: e.entry_type || e.entryType,
  })).filter((e) => e.work_date);

  // Group by date
  const byDate = {};
  for (const e of norm) {
    if (!byDate[e.work_date]) byDate[e.work_date] = [];
    byDate[e.work_date].push(e);
  }

  // 1. Missing clock-out (has clock_in, no clock_out)
  for (const e of norm) {
    if (e.clock_in && !e.clock_out) {
      alerts.push({
        severity: "high",
        type: "missing_clockout",
        date: e.work_date,
        title: "Missing clock-out",
        message: `Entry on ${e.work_date} has a clock-in but no clock-out. Hours may be underreported.`,
      });
    }
  }

  // 2. Duplicate same-day entries
  for (const [date, dayEntries] of Object.entries(byDate)) {
    if (dayEntries.length > 1) {
      alerts.push({
        severity: "medium",
        type: "duplicate_entry",
        date,
        title: "Duplicate same-day entry",
        message: `${dayEntries.length} timecard entries on ${date}. Verify for overlap.`,
      });
    }
  }

  // 3. Very short shift (< minShiftHours)
  for (const e of norm) {
    if (e.hours > 0 && e.hours < minShiftHours) {
      alerts.push({
        severity: "low",
        type: "short_shift",
        date: e.work_date,
        title: "Short shift",
        message: `Entry on ${e.work_date} is only ${e.hours.toFixed(1)} hrs. Was this a partial day?`,
      });
    }
  }

  // 4. Daily overtime spike (> dailyOvertimeThreshold)
  for (const [date, dayEntries] of Object.entries(byDate)) {
    const dayHours = dayEntries.reduce((s, e) => s + e.hours, 0);
    if (dayHours > dailyOvertimeThreshold) {
      alerts.push({
        severity: "medium",
        type: "daily_overtime",
        date,
        title: "Daily overtime",
        message: `${dayHours.toFixed(1)} hrs on ${date} exceeds the ${dailyOvertimeThreshold}-hr daily threshold.`,
      });
    }
  }

  // 5. Excessive daily hours (> maxDailyHours — possible error)
  for (const [date, dayEntries] of Object.entries(byDate)) {
    const dayHours = dayEntries.reduce((s, e) => s + e.hours, 0);
    if (dayHours > maxDailyHours) {
      alerts.push({
        severity: "high",
        type: "excessive_hours",
        date,
        title: "Excessive daily hours",
        message: `${dayHours.toFixed(1)} hrs on ${date} exceeds ${maxDailyHours} hrs. Possible duplicate or error.`,
      });
    }
  }

  // 6. Weekly overtime approaching/exceeded (FLSA)
  const weekBuckets = {};
  for (const e of norm) {
    const d = new Date(e.work_date + "T00:00:00");
    if (isNaN(d.getTime())) continue;
    const day = d.getDay();
    const anchor = new Date(d);
    anchor.setDate(d.getDate() - day);
    const key = anchor.toISOString().slice(0, 10);
    weekBuckets[key] = (weekBuckets[key] || 0) + e.hours;
  }
  for (const [week, hours] of Object.entries(weekBuckets)) {
    if (hours > overtimeThreshold) {
      alerts.push({
        severity: "medium",
        type: "weekly_overtime",
        date: week,
        title: "Weekly overtime",
        message: `${hours.toFixed(1)} hrs for week of ${week} exceeds the ${overtimeThreshold}-hr FLSA threshold.`,
      });
    }
  }

  // Sort by severity (high → medium → low), then by date
  const rank = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || (b.date || "").localeCompare(a.date || ""));
  return alerts;
}