// attendanceEngine.js — Pure attendance & points policy for CORPS//.
// No React, no Base44, no external deps. Fully portable.
//
// Implements occurrence-based attendance tracking (the "points" system
// UKG uses): tardies, no-shows, early-outs accumulate occurrences that
// roll off after a configurable period, with escalating discipline tiers.

import { timeToMinutes } from "./timecardEngine.js";

// ── Tardy detection ───────────────────────────────────────────
export function isTardy(clockInTime, shiftStartTime, graceMinutes = 5) {
  const ci = timeToMinutes(clockInTime);
  const ss = timeToMinutes(shiftStartTime);
  if (ci == null || ss == null) return false;
  return ci - ss > graceMinutes;
}

// ── Early out detection ────────────────────────────────────────
export function isEarlyOut(clockOutTime, shiftEndTime, graceMinutes = 5) {
  const co = timeToMinutes(clockOutTime);
  const se = timeToMinutes(shiftEndTime);
  if (co == null || se == null) return false;
  return se - co > graceMinutes;
}

// ── Occurrence scoring ────────────────────────────────────────
// Map attendance events to points per a configurable policy.
// policy: { tardyPoints, noShowPoints, earlyOutPoints, unexcusedAbsencePoints,
//           rollOffDays, disciplineTiers: [{ threshold, action }] }
export function scoreAttendance(events = [], policy = {}) {
  const {
    tardyPoints = 0.5,
    noShowPoints = 1,
    earlyOutPoints = 0.5,
    unexcusedAbsencePoints = 1,
    rollOffDays = 365,
  } = policy;

  const now = Date.now();
  const cutoff = now - rollOffDays * 86400000;

  let activePoints = 0;
  const occurrences = [];
  for (const ev of events || []) {
    const ts = new Date(ev.timestamp || ev.date || ev.work_date).getTime();
    if (isNaN(ts) || ts < cutoff) continue; // rolled off
    let pts = 0;
    switch (ev.type) {
      case "tardy": pts = tardyPoints; break;
      case "no_show": pts = noShowPoints; break;
      case "early_out": pts = earlyOutPoints; break;
      case "unexcused_absence": pts = unexcusedAbsencePoints; break;
      default: pts = 0;
    }
    activePoints += pts;
    occurrences.push({ ...ev, points: pts, timestamp: ts });
  }

  return {
    activePoints: round2(activePoints),
    occurrences,
  };
}

// ── Discipline tier ───────────────────────────────────────────
// Given active points, return the discipline tier the employee has reached.
export function getDisciplineTier(points, tiers = []) {
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  for (const tier of sorted) {
    if (points >= tier.threshold) return tier;
  }
  return null;
}

// ── Evaluate a single clock event against a scheduled shift ───
// Returns a normalized attendance event if a violation occurred, else null.
export function evaluateShift(actual, scheduled, policy = {}) {
  const { graceMinutes = 5 } = policy;
  if (!actual || !actual.clock_in) {
    return { type: "no_show", timestamp: scheduled?.shift_date, shift: scheduled };
  }
  if (isTardy(actual.clock_in, scheduled.start_time, graceMinutes)) {
    return { type: "tardy", timestamp: actual.work_date, shift: scheduled, minutesLate: lateBy(actual.clock_in, scheduled.start_time) };
  }
  if (actual.clock_out && isEarlyOut(actual.clock_out, scheduled.end_time, graceMinutes)) {
    return { type: "early_out", timestamp: actual.work_date, shift: scheduled, minutesEarly: earlyBy(actual.clock_out, scheduled.end_time) };
  }
  return null;
}

function lateBy(clockIn, shiftStart) {
  const ci = timeToMinutes(clockIn);
  const ss = timeToMinutes(shiftStart);
  return ci != null && ss != null ? ci - ss : 0;
}
function earlyBy(clockOut, shiftEnd) {
  const co = timeToMinutes(clockOut);
  const se = timeToMinutes(shiftEnd);
  return co != null && se != null ? se - co : 0;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}