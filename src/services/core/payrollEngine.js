// payrollEngine.js — Pure payroll calculation rules for CORPS//.
// No React, no Base44, no external deps. Fully portable.
//
// Implements gross-to-net: regular/OT/DT pay, FICA (SS + Medicare incl.
// additional Medicare), simplified federal income tax (annualized bracket
// method), flat-rate state tax, pre/post-tax deductions, and YTD rollup.
//
// Tax constants reflect 2024-ish US figures; override via rules for accuracy.

// ── Constants (overridable via rules) ─────────────────────────
const DEFAULTS = {
  socialSecurityRate: 0.062,
  socialSecurityWageBase: 168600,   // 2024 SS wage base
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009,    // on wages over threshold
  additionalMedicareThresholdSingle: 200000,
  additionalMedicareThresholdMarried: 250000,
  federalStandardDeductionSingle: 14600,
  federalStandardDeductionMarried: 29200,
};

// 2024 federal brackets (annual, single filer). Override via rules.federalBrackets.
const FEDERAL_BRACKETS_SINGLE = [
  { upTo: 11600, rate: 0.10 },
  { upTo: 47150, rate: 0.12 },
  { upTo: 100525, rate: 0.22 },
  { upTo: 191950, rate: 0.24 },
  { upTo: 243725, rate: 0.32 },
  { upTo: 609350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

// ── Gross pay ─────────────────────────────────────────────────
export function computeGrossPay({ regularHours = 0, overtimeHours = 0, doubletimeHours = 0, hourlyRate = 0, salary = 0, rules = {} }) {
  const { overtimeMultiplier = 1.5, doubletimeMultiplier = 2.0 } = rules;
  const hourlyGross =
    regularHours * hourlyRate +
    overtimeHours * hourlyRate * overtimeMultiplier +
    doubletimeHours * hourlyRate * doubletimeMultiplier;
  // Salaried employees receive their salary per period regardless of hours,
  // unless hourlyGross exceeds it (e.g. non-exempt salary with OT).
  const gross = salary > 0 ? Math.max(salary, hourlyGross) : hourlyGross;
  return Math.round(gross * 100) / 100;
}

// ── FICA ──────────────────────────────────────────────────────
// ytdWages used to cap Social Security and trigger additional Medicare.
export function computeFICA(gross, ytdWages = 0, rules = {}) {
  const cfg = { ...DEFAULTS, ...rules };
  const ssBase = Math.max(0, Math.min(gross, cfg.socialSecurityWageBase - ytdWages));
  const socialSecurity = Math.max(0, ssBase) * cfg.socialSecurityRate;

  const threshold = cfg.additionalMedicareThresholdSingle; // simplified: single
  const medicareBase = gross;
  const medicare = medicareBase * cfg.medicareRate;
  const additionalMedicare = Math.max(0, (ytdWages + gross - threshold)) > 0
    ? Math.max(0, Math.min(gross, ytdWages + gross - threshold)) * cfg.additionalMedicareRate
    : 0;

  return {
    socialSecurity: round2(socialSecurity),
    medicare: round2(medicare),
    additionalMedicare: round2(additionalMedicare),
    total: round2(socialSecurity + medicare + additionalMedicare),
  };
}

// ── Federal income tax (annualized bracket method) ────────────
// Annualizes gross, subtracts standard deduction, applies brackets,
// then divides back to the period. Simplified — not a substitute for
// a full withholding engine (W-4 steps 2-4 not modeled).
export function estimateFederalTax(periodGross, opts = {}, rules = {}) {
  const cfg = { ...DEFAULTS, ...rules };
  const {
    filingStatus = "single",
    payPeriodsPerYear = 26, // bi-weekly default
    additionalWithholding = 0,
  } = opts;

  const annualGross = periodGross * payPeriodsPerYear;
  const deduction = filingStatus === "married"
    ? cfg.federalStandardDeductionMarried
    : cfg.federalStandardDeductionSingle;
  const taxable = Math.max(0, annualGross - deduction);

  const brackets = rules.federalBrackets || FEDERAL_BRACKETS_SINGLE;
  let tax = 0;
  let lastCap = 0;
  for (const b of brackets) {
    if (taxable > lastCap) {
      const slice = Math.min(taxable, b.upTo) - lastCap;
      tax += Math.max(0, slice) * b.rate;
      lastCap = b.upTo;
    } else break;
  }
  const periodTax = tax / payPeriodsPerYear + additionalWithholding / payPeriodsPerYear;
  return round2(Math.max(0, periodTax));
}

// ── State tax (flat-rate simplification) ──────────────────────
// Real state tax is bracketed per-state; this is a flat approximation
// suitable for net-pay estimation. Override rate via rules.stateRate.
export function estimateStateTax(periodGross, rules = {}) {
  const rate = rules.stateRate ?? 0;
  return round2(periodGross * rate);
}

// ── Deductions ────────────────────────────────────────────────
// deductions: [{ label, amount, preTax: boolean }]
export function applyDeductions(gross, deductions = []) {
  const preTax = deductions.filter((d) => d.preTax).reduce((s, d) => s + (d.amount || 0), 0);
  const postTax = deductions.filter((d) => !d.preTax).reduce((s, d) => s + (d.amount || 0), 0);
  return {
    preTaxTotal: round2(preTax),
    postTaxTotal: round2(postTax),
    taxableGross: round2(Math.max(0, gross - preTax)),
  };
}

// ── Full paystub ──────────────────────────────────────────────
// Computes gross-to-net for one pay period from classified hours + employee.
export function computePaystub(input = {}) {
  const {
    regularHours = 0,
    overtimeHours = 0,
    doubletimeHours = 0,
    hourlyRate = 0,
    salary = 0,
    ytdWages = 0,
    filingStatus = "single",
    payPeriodsPerYear = 26,
    deductions = [],
    rules = {},
  } = input;

  const gross = computeGrossPay({ regularHours, overtimeHours, doubletimeHours, hourlyRate, salary, rules });
  const ded = applyDeductions(gross, deductions);
  const taxableGross = ded.taxableGross;

  const fica = computeFICA(taxableGross, ytdWages, rules);
  const federal = estimateFederalTax(taxableGross, { filingStatus, payPeriodsPerYear }, rules);
  const state = estimateStateTax(taxableGross, rules);

  const totalTax = fica.total + federal + state;
  const net = round2(taxableGross - totalTax - ded.postTaxTotal);

  return {
    gross,
    taxableGross,
    deductions: ded,
    taxes: { ...fica, federal, state, total: round2(totalTax) },
    net,
    ytdWagesAfter: round2(ytdWages + gross),
  };
}

// ── YTD rollup ────────────────────────────────────────────────
// Given an array of past paystubs (from CorePaystub), return YTD totals.
export function rollupYTD(paystubs = []) {
  const acc = { gross: 0, net: 0, hours: 0 };
  for (const p of paystubs) {
    acc.gross += p.gross_pay || 0;
    acc.net += p.net_pay || 0;
    acc.hours += p.hours_worked || 0;
  }
  return { gross: round2(acc.gross), net: round2(acc.net), hours: round2(acc.hours) };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}