// spine/index.ts — active Spine instance + type re-exports.
//
// Consumers import the Spine from here, never from an adapter:
//   import { spine, type SpineContext } from "@/services/spine";
//
// Backend selection mirrors the existing corpsData env switch so the
// remote/HTTP adapter (for external consumers like Consilium) drops in
// without touching call sites:
//   VITE_SPINE_BACKEND = 'base44' (default) | 'remote'
//   VITE_SPINE_API_BASE = https://…  (remote mode; uses Authorization header)

import type { Spine, SpineContext } from "./SpineInterface";
import { base44TimecardAdapter } from "./base44TimecardAdapter";
import { base44PayrollAdapter } from "./base44PayrollAdapter";

export type { Spine, SpineContext } from "./SpineInterface";
export type {
  SpineTimecardService,
  TimecardEntry,
  TimecardEntryInput,
  TimecardEntryPatch,
  TimecardSummary,
  TimecardEntryType,
  TimecardStatus,
  SpinePayrollService,
  Paystub,
  PaystubInput,
  PaystubPatch,
} from "./SpineInterface";

const BACKEND = import.meta.env.VITE_SPINE_BACKEND || "base44";

// TODO(AUTH_MILESTONE / remote backend): when VITE_SPINE_BACKEND='remote',
// mount an HTTP-backed adapter that calls the Spine REST endpoints with
// an Authorization: Bearer <token> header. The interface is already
// REST-shaped so the remote adapter is a thin fetch wrapper.
export const spine: Spine = {
  timecard: base44TimecardAdapter,
  payroll: base44PayrollAdapter,
  // schedule: base44ScheduleAdapter,
  // hris:     base44HrisAdapter,
};

export function buildCtx(email: string, token?: string): SpineContext {
  return { email, token };
}