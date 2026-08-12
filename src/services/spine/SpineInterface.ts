// ─────────────────────────────────────────────────────────────────────
// SpineInterface.ts — the CORPS// Spine contract.
//
// This is the single source of truth for what the Spine exposes to every
// consumer (BEN|connect, DOC, and — over the network later — Consilium).
// Consumers program against these types and the `Spine` interface, NEVER
// against the Base44 SDK or any adapter internals.
//
// Design rules:
//   1. Every method is resource-oriented and maps 1:1 to a REST endpoint
//      (see the `HTTP:` comment on each). The in-memory call today and the
//      HTTP call tomorrow share the SAME signature shape — we do not
//      optimize for in-process convenience (no callbacks, no live query
//      objects, no SDK handles as args or return values).
//   2. All return values are plain JSON DTOs. Base44-isms (entity wrapper
//      objects, `created_by_id`, snake_case audit fields) are normalized
//      away at the adapter boundary — never leaked to a consumer.
//   3. The first parameter is always `SpineContext` (the caller's auth).
//      In HTTP mode it is derived from the `Authorization` header; in
//      in-memory mode it is built from the trusted session. The shape is
//      identical either way.
// ─────────────────────────────────────────────────────────────────────


// ═════════════════════════════════════════════════════════════════════
// AUTH MILESTONE — session-email → real token auth
// ═════════════════════════════════════════════════════════════════════
// Today (Phase 1): in-memory callers pass `{ email }` from the trusted
// Base44 session. The adapter trusts it as-is. This is acceptable ONLY
// because the caller and the Spine share one process and one auth
// context (the Base44 session guard already vetted the user).
//
// The switch to real token auth (Phase 2) is NOT "later / someday". It is
// a named milestone with a concrete trigger. The switch fires the moment
// ANY of the following becomes true:
//
//   M1. An EXTERNAL consumer (Consilium, or any app outside this monorepo)
//       makes its first real network call to a Spine endpoint. Cross-origin
//       calls cannot rely on the in-process session, so token auth becomes
//       mandatory — and the in-memory path adopts it at the same instant so
//       both paths share one auth model.
//
//   M2. Any Spine method is wrapped in a `base44/functions/*/entry.ts`
//       HTTP handler. The moment a method is reachable over HTTP it MUST
//       validate a bearer token; a passed `email` is no longer trusted.
//
//   M3. CORPS// is lifted to its own deployment (separate origin/server),
//       even if only BC/DOC consume it. Same-origin session trust no
//       longer holds.
//
// When the milestone fires:
//   - `SpineContext.token` becomes required (non-optional) on every call.
//   - The adapter validates the token (RS256 against a published JWKS)
//     and derives `email` from its claims — it no longer accepts a
//     caller-supplied `email`.
//   - A single test ("can a forged email reach the Spine?") is added to
//     the adapter and must fail before the milestone is declared done.
//
// Until then: `token` is undefined and `email` is trusted. The signature
// is already shaped for the switch, so no consumer code changes when it
// fires — only the adapter's validation does.
// ═════════════════════════════════════════════════════════════════════


export interface SpineContext {
  /** Phase 1: caller email from the trusted in-app session. Phase 2: derived from `token` claims, not caller-supplied. */
  email: string;
  /** Phase 2: signed bearer token proving identity. Undefined until AUTH_MILESTONE fires. */
  token?: string;
}


// ── Timecard DTOs ────────────────────────────────────────────────────
export type TimecardEntryType = "regular" | "overtime" | "holiday" | "sick";
export type TimecardStatus = "pending" | "submitted" | "approved" | "rejected";

export interface TimecardEntry {
  id: string;
  employeeEmail: string;
  workDate: string;        // YYYY-MM-DD
  clockIn: string | null;  // "HH:mm" or null
  clockOut: string | null; // "HH:mm" or null
  hours: number;
  entryType: TimecardEntryType;
  status: TimecardStatus;
  notes: string | null;
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}

export interface TimecardEntryInput {
  employeeEmail: string;
  workDate: string;
  clockIn?: string | null;
  clockOut?: string | null;
  hours?: number;
  entryType?: TimecardEntryType;
  status?: TimecardStatus;
  notes?: string | null;
}

export interface TimecardEntryPatch {
  clockIn?: string | null;
  clockOut?: string | null;
  hours?: number;
  entryType?: TimecardEntryType;
  status?: TimecardStatus;
  notes?: string | null;
}

export interface TimecardSummary {
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  entryCount: number;
}


// ── SpineTimecardService ─────────────────────────────────────────────
export interface SpineTimecardService {
  /** HTTP: GET /timecard/entries?employeeEmail=…&from=…&to=…&status=… */
  getTimecardEntries(
    ctx: SpineContext,
    query: { employeeEmail: string; from?: string; to?: string; status?: TimecardStatus }
  ): Promise<TimecardEntry[]>;

  /** HTTP: POST /timecard/entries */
  createTimecardEntry(ctx: SpineContext, input: TimecardEntryInput): Promise<TimecardEntry>;

  /** HTTP: PATCH /timecard/entries/{id} */
  updateTimecardEntry(ctx: SpineContext, id: string, patch: TimecardEntryPatch): Promise<TimecardEntry>;

  /** HTTP: POST /timecard/entries:submit  body: { employeeEmail, periodStart } */
  submitTimecardForApproval(
    ctx: SpineContext,
    body: { employeeEmail: string; periodStart: string }
  ): Promise<{ submittedCount: number }>;

  /** HTTP: GET /timecard/summary?employeeEmail=…&from=…&to=… */
  getTimecardSummary(
    ctx: SpineContext,
    query: { employeeEmail: string; from: string; to: string }
  ): Promise<TimecardSummary>;
}


// ── Payroll DTOs ─────────────────────────────────────────────────────
export interface Paystub {
  id: string;
  employeeEmail: string;
  payPeriodStart: string;  // YYYY-MM-DD
  payPeriodEnd: string;     // YYYY-MM-DD
  payDate: string;          // YYYY-MM-DD
  grossPay: number;
  netPay: number;
  hoursWorked: number;
  deductions: Record<string, any> | null;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}

export interface PaystubInput {
  employeeEmail: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  grossPay: number;
  netPay: number;
  hoursWorked?: number;
  deductions?: Record<string, any> | null;
}

export interface PaystubPatch {
  grossPay?: number;
  netPay?: number;
  hoursWorked?: number;
  deductions?: Record<string, any> | null;
}

// ── SpinePayrollService ──────────────────────────────────────────────
export interface SpinePayrollService {
  /** HTTP: GET /payroll/paystubs?employeeEmail=… */
  getPaystubs(
    ctx: SpineContext,
    query: { employeeEmail: string }
  ): Promise<Paystub[]>;

  /** HTTP: POST /payroll/paystubs */
  createPaystub(ctx: SpineContext, input: PaystubInput): Promise<Paystub>;
}

// ── Spine (root) ─────────────────────────────────────────────────────
// New domains attach here as their services land. Timecard is first;
// Payroll, Schedule, HRIS, etc. follow the same pattern once Timecard
// proves the adapter shape.
export interface Spine {
  timecard: SpineTimecardService;
  payroll: SpinePayrollService;
  // schedule: SpineScheduleService;
  // hris: SpineHrisService;
}