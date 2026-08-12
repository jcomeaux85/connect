// core/index.js — Barrel export for the CORPS// rules engine.
//
// This is the portable backbone: pure business logic for time & attendance,
// payroll, scheduling, and attendance policy. No React, no Base44, no
// framework. Import from anywhere in the app (or copy into another repo).
//
//   import { computePaystub, aggregateWeekly, detectBreakConflicts }
//     from "@/services/core";

export * from "./timecardEngine.js";
export * from "./payrollEngine.js";
export * from "./scheduleEngine.js";
export * from "./attendanceEngine.js";
export * from "./livePayEngine.js";
export * from "./anomalyEngine.js";