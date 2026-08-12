// livePayEngine.js — Live net-pay preview from timecard entries.
// Wraps payrollEngine.computePaystub so the UI can show projected
// gross/net the moment a timecard changes — no batch run required.
// This is the "Live Preview Engine" that UKG lacks: instant feedback
// as hours are edited, not after a payroll cycle is closed.

import { summarizePayPeriod } from "./timecardEngine.js";
import { computePaystub, rollupYTD } from "./payrollEngine.js";

// Default hourly rate if the employee profile lacks one (override via opts).
const DEFAULT_HOURLY_RATE = 28;

// Compute a live pay preview for the current pay period.
//
// entries   — timecard entries (snake_case OR camelCase, normalized here)
// employee  — CoreEmployee record (for pay_type, ytd_earnings)
// paystubs  — prior CorePaystub records (for YTD wage base + FICA caps)
// rules     — overtime/deduction rules passed through to the engines
// opts      — hourlyRate, salary, filingStatus, deductions overrides
export function computeLivePay({ entries = [], employee = null, paystubs = [], rules = {}, opts = {} }) {
  // Normalize entries to snake_case for the pure engines
  const normalized = (entries || [])
    .map((e) => ({
      work_date: e.work_date || e.workDate,
      hours: e.hours,
      entry_type: e.entry_type || e.entryType,
    }))
    .filter((e) => e.work_date);

  const period = summarizePayPeriod(normalized, rules);

  const hourlyRate = opts.hourlyRate ?? employee?.hourly_rate ?? DEFAULT_HOURLY_RATE;
  const salary =
    opts.salary ??
    (employee?.pay_type === "Salaried" ? (employee?.ytd_earnings || 0) / 26 : 0);

  // Normalize paystubs to snake_case for rollupYTD
  const normalizedStubs = (paystubs || []).map((p) => ({
    gross_pay: p.gross_pay ?? p.grossPay,
    net_pay: p.net_pay ?? p.netPay,
    hours_worked: p.hours_worked ?? p.hoursWorked,
  }));
  const ytdWages = rollupYTD(normalizedStubs).gross;

  const paystub = computePaystub({
    regularHours: period.regular,
    overtimeHours: period.overtime,
    doubletimeHours: period.doubletime,
    hourlyRate,
    salary,
    ytdWages,
    filingStatus: opts.filingStatus || "single",
    payPeriodsPerYear: 26,
    deductions: opts.deductions || [],
    rules,
  });

  return {
    ...period,
    ...paystub,
    hourlyRate,
  };
}

// Per-second earnings rate for the real-time EarningsClock widget.
// Returns gross and net per-second rates derived from the live pay preview.
// Used by the "debt-clock"-style ticker so the widget can be lifted into a
// B|c widget without re-fetching — it consumes a computeLivePay result.
export function computeEarningsRate(livePay) {
  const periodHours =
    (livePay.regular || 0) + (livePay.overtime || 0) + (livePay.doubletime || 0);
  // Effective net hourly rate: if the period has hours, net/hours; else fall
  // back to a rough 78% of gross (typical effective rate) so the clock moves.
  const netHourlyRate =
    periodHours > 0 ? livePay.net / periodHours : livePay.hourlyRate * 0.78;
  return {
    grossPerSec: livePay.hourlyRate / 3600,
    netPerSec: netHourlyRate / 3600,
    netHourlyRate,
  };
}