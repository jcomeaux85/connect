// base44TimecardAdapter.ts — Base44-backed implementation of
// SpineTimecardService. This is the ONLY place that knows about the
// Base44 SDK for the timecard domain. Swap this file out (or add a
// remote adapter alongside it) to change backends; consumers never change.
//
// Responsibilities:
//   - Call the Base44 entity SDK for CoreTimecardEntry.
//   - Normalize raw Base44 records into Spine DTOs (snake_case → camelCase,
//     drop `created_by_id`, expose `createdAt`/`updatedAt`).
//   - Compose the pure timecardEngine for the summary (the adapter is
//     where data access meets business rules).

import { base44 } from "@/api/base44Client";
import type {
  SpineContext,
  SpineTimecardService,
  TimecardEntry,
  TimecardEntryInput,
  TimecardEntryPatch,
  TimecardSummary,
} from "./SpineInterface";

// ── Mapping ──────────────────────────────────────────────────────────
function toDTO(raw: any): TimecardEntry {
  return {
    id: raw.id,
    employeeEmail: raw.employee_email,
    workDate: raw.work_date,
    clockIn: raw.clock_in ?? null,
    clockOut: raw.clock_out ?? null,
    hours: raw.hours ?? 0,
    entryType: raw.entry_type ?? "regular",
    status: raw.status ?? "pending",
    notes: raw.notes ?? null,
    createdAt: raw.created_date,
    updatedAt: raw.updated_date,
  };
}

function fromInput(input: TimecardEntryInput) {
  return {
    employee_email: input.employeeEmail,
    work_date: input.workDate,
    clock_in: input.clockIn ?? null,
    clock_out: input.clockOut ?? null,
    hours: input.hours ?? 0,
    entry_type: input.entryType ?? "regular",
    status: input.status ?? "pending",
    notes: input.notes ?? null,
  };
}

// ── Auth guard ───────────────────────────────────────────────────────
// Phase 1: trust the caller email. This is the single chokepoint that the
// AUTH_MILESTONE will harden — when it fires, this function validates
// `ctx.token` instead and derives email from its claims.
function assertCaller(ctx: SpineContext): string {
  if (!ctx?.email) throw new Error("Spine: missing caller identity (ctx.email)");
  // TODO(AUTH_MILESTONE): validate ctx.token (RS256 / JWKS) and derive email
  // from claims; reject any caller-supplied email that doesn't match.
  return ctx.email;
}

// ── Service ──────────────────────────────────────────────────────────
export const base44TimecardAdapter: SpineTimecardService = {
  async getTimecardEntries(ctx, query) {
    assertCaller(ctx);
    const filter: Record<string, any> = { employee_email: query.employeeEmail };
    if (query.status) filter.status = query.status;
    const raw = await base44.entities.CoreTimecardEntry.filter(filter, "work_date");
    let rows = raw;
    if (query.from || query.to) {
      rows = rows.filter((r: any) => {
        const d = r.work_date;
        if (!d) return false;
        if (query.from && d < query.from) return false;
        if (query.to && d > query.to) return false;
        return true;
      });
    }
    return rows.map(toDTO);
  },

  async createTimecardEntry(ctx, input) {
    assertCaller(ctx);
    const raw = await base44.entities.CoreTimecardEntry.create(fromInput(input));
    return toDTO(raw);
  },

  async updateTimecardEntry(ctx, id, patch) {
    assertCaller(ctx);
    const data: Record<string, any> = {};
    if (patch.clockIn !== undefined) data.clock_in = patch.clockIn;
    if (patch.clockOut !== undefined) data.clock_out = patch.clockOut;
    if (patch.hours !== undefined) data.hours = patch.hours;
    if (patch.entryType !== undefined) data.entry_type = patch.entryType;
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.notes !== undefined) data.notes = patch.notes;
    const raw = await base44.entities.CoreTimecardEntry.update(id, data);
    return toDTO(raw);
  },

  async submitTimecardForApproval(ctx, body) {
    assertCaller(ctx);
    const raw = await base44.entities.CoreTimecardEntry.filter(
      { employee_email: body.employeeEmail, status: "pending" },
      "work_date"
    );
    const inPeriod = raw.filter((r: any) => r.work_date >= body.periodStart);
    // One-by-one so per-record side effects fire (status transitions matter).
    for (const r of inPeriod) {
      await base44.entities.CoreTimecardEntry.update(r.id, { status: "submitted" });
    }
    return { submittedCount: inPeriod.length };
  },

  async getTimecardSummary(ctx, query) {
    assertCaller(ctx);
    const entries = await this.getTimecardEntries(ctx, {
      employeeEmail: query.employeeEmail,
      from: query.from,
      to: query.to,
    });
    // Preserve the existing display semantics: REGULAR = non-overtime
    // entries, OVERTIME = overtime entries, TOTAL = sum. (The pure engine's
    // weekly-threshold classification is available for Payroll later; the
    // Timecard UI has always summed by entry_type, so we keep that here.)
    const regularHours = entries
      .filter((e) => e.entryType !== "overtime")
      .reduce((s, e) => s + (e.hours || 0), 0);
    const overtimeHours = entries
      .filter((e) => e.entryType === "overtime")
      .reduce((s, e) => s + (e.hours || 0), 0);
    const summary: TimecardSummary = {
      regularHours,
      overtimeHours,
      totalHours: regularHours + overtimeHours,
      entryCount: entries.length,
    };
    return summary;
  },
};