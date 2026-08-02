// scheduleEngine.js — Pure scheduling & break-coordination rules for CORPS//.
// No React, no Base44, no external deps. Fully portable.
//
// Implements break-concurrency conflict detection (no two agents on break
// simultaneously), buffer-window enforcement, shift coverage analysis, and
// staffing-gap detection — the operational scheduling backbone.

import { timeToMinutes } from "./timecardEngine.js";

// ── Break conflict detection ──────────────────────────────────
// breaks: [{ actual_start_time, actual_end_time, requested_start_time, status, break_type, employee_email }]
// group:  { max_concurrent_breaks, am_break_window_start, am_break_window_end, pm_break_window_start, pm_break_window_end }
// Returns a list of conflicts: { start, end, employees: [], window }
export function detectBreakConflicts(breaks = [], group = {}) {
  const active = (breaks || []).filter(
    (b) => b.status === "approved" || b.status === "taken" || b.status === "reserved"
  );
  if (!active.length) return [];

  const max = group.max_concurrent_breaks || 1;

  // Build an event timeline.
  const events = [];
  for (const b of active) {
    const start = timeToMinutes(b.actual_start_time || b.requested_start_time);
    const end = timeToMinutes(b.actual_end_time) || (start != null ? start + 15 : null);
    if (start == null || end == null || end <= start) continue;
    events.push({ type: "start", t: start, employee: b.employee_email });
    events.push({ type: "end", t: end, employee: b.employee_email });
  }
  events.sort((a, b) => a.t - b.t || (a.type === "end" ? -1 : 1));

  const conflicts = [];
  let current = [];
  for (const ev of events) {
    if (ev.type === "start") {
      current.push(ev.employee);
      if (current.length > max) {
        conflicts.push({ t: ev.t, employees: [...current] });
      }
    } else {
      current = current.filter((e) => e !== ev.employee);
    }
  }
  return conflicts;
}

// ── Buffer-window violation ───────────────────────────────────
// A break cannot start within `buffer` minutes of another break in the same group.
// Returns list of violating breaks.
export function detectBufferViolations(breaks = [], bufferMinutes = 15) {
  const active = (breaks || [])
    .filter((b) => b.status === "approved" || b.status === "reserved")
    .map((b) => ({
      employee: b.employee_email,
      start: timeToMinutes(b.actual_start_time || b.requested_start_time),
      end: timeToMinutes(b.actual_end_time),
    }))
    .filter((b) => b.start != null && b.end != null)
    .sort((a, b) => a.start - b.start);

  const violations = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const gap = active[j].start - active[i].end;
      if (gap < 0) continue; // overlapping handled by conflict detection
      if (gap < bufferMinutes) {
        violations.push({ a: active[i].employee, b: active[j].employee, gapMinutes: gap });
      }
    }
  }
  return violations;
}

// ── Window compliance ─────────────────────────────────────────
// Verify a requested break falls inside the allowed window for its type.
export function isBreakInWindow(breakReq, group = {}) {
  const start = timeToMinutes(breakReq.requested_start_time || breakReq.actual_start_time);
  if (start == null) return false;
  const isAm = breakReq.break_type === "AM_15_min";
  const winStart = timeToMinutes(isAm ? group.am_break_window_start : group.pm_break_window_start);
  const winEnd = timeToMinutes(isAm ? group.am_break_window_end : group.pm_break_window_end);
  if (winStart == null || winEnd == null) return true; // no window configured
  return start >= winStart && start <= winEnd;
}

// ── Shift coverage ────────────────────────────────────────────
// shifts: [{ start_time, end_time, employee_email, status }]
// window: { start, end } in "HH:mm"
// Returns coverage ratio 0..1 and a list of gaps where nobody was scheduled.
export function computeCoverage(shifts = [], window = {}) {
  const winStart = timeToMinutes(window.start);
  const winEnd = timeToMinutes(window.end);
  if (winStart == null || winEnd == null) return { ratio: 0, gaps: [] };

  const active = (shifts || [])
    .filter((s) => s.status !== "cancelled" && s.start_time && s.end_time)
    .map((s) => ({
      start: Math.max(timeToMinutes(s.start_time), winStart),
      end: Math.min(timeToMinutes(s.end_time), winEnd),
    }))
    .filter((s) => s.start != null && s.end != null && s.end > s.start)
    .sort((a, b) => a.start - b.start);

  const totalMinutes = winEnd - winStart;
  let coveredMinutes = 0;
  let cursor = winStart;
  const gaps = [];

  for (const s of active) {
    if (s.start > cursor) {
      gaps.push({ start: cursor, end: s.start, minutes: s.start - cursor });
    }
    coveredMinutes += Math.max(0, s.end - Math.max(s.start, cursor));
    cursor = Math.max(cursor, s.end);
  }
  if (cursor < winEnd) {
    gaps.push({ start: cursor, end: winEnd, minutes: winEnd - cursor });
  }
  return {
    ratio: totalMinutes > 0 ? Math.min(1, coveredMinutes / totalMinutes) : 0,
    coveredMinutes,
    totalMinutes,
    gaps,
  };
}

// ── Staffing gaps ─────────────────────────────────────────────
// required: number of staff needed. Returns whether currently understaffed.
export function findStaffingGaps(required = 1, scheduledCount = 0) {
  return {
    required,
    scheduled: scheduledCount,
    shortfall: Math.max(0, required - scheduledCount),
    surplus: Math.max(0, scheduledCount - required),
    isUnderstaffed: scheduledCount < required,
  };
}