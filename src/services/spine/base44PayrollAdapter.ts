// base44PayrollAdapter.ts — Base44-backed implementation of
// SpinePayrollService. Reuses the shared `assertCaller` chokepoint from
// spineAuth.ts verbatim (not reinvented) — the money domain must not
// diverge from the Timecard guard. This is the ONLY file that knows about
// the Base44 SDK for the payroll domain.

import { base44 } from "@/api/base44Client";
import { assertCaller } from "./spineAuth";
import type {
  SpinePayrollService,
  Paystub,
  PaystubInput,
} from "./SpineInterface";

// ── Mapping ──────────────────────────────────────────────────────────
function toDTO(raw: any): Paystub {
  return {
    id: raw.id,
    employeeEmail: raw.employee_email,
    payPeriodStart: raw.pay_period_start,
    payPeriodEnd: raw.pay_period_end,
    payDate: raw.pay_date,
    grossPay: raw.gross_pay ?? 0,
    netPay: raw.net_pay ?? 0,
    hoursWorked: raw.hours_worked ?? 0,
    deductions: raw.deductions ?? null,
    createdAt: raw.created_date,
    updatedAt: raw.updated_date,
  };
}

function fromInput(input: PaystubInput) {
  return {
    employee_email: input.employeeEmail,
    pay_period_start: input.payPeriodStart,
    pay_period_end: input.payPeriodEnd,
    pay_date: input.payDate,
    gross_pay: input.grossPay,
    net_pay: input.netPay,
    hours_worked: input.hoursWorked ?? 0,
    deductions: input.deductions ?? null,
  };
}

// ── Service ──────────────────────────────────────────────────────────
export const base44PayrollAdapter: SpinePayrollService = {
  async getPaystubs(ctx, query) {
    assertCaller(ctx);
    const raw = await base44.entities.CorePaystub.filter(
      { employee_email: query.employeeEmail },
      "-pay_date"
    );
    return raw.map(toDTO);
  },

  async createPaystub(ctx, input) {
    assertCaller(ctx);
    const raw = await base44.entities.CorePaystub.create(fromInput(input));
    return toDTO(raw);
  },
};