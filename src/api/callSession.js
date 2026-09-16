import { base44 } from "@/api/base44Client";

// Operational call bones. Identifiers stay here. Telemetry is a later projection.

export async function startCallSession({ incomingCall, user } = {}) {
  const now = new Date().toISOString();
  const phone = incomingCall?.phone_number || incomingCall?.customer_phone || "";
  return base44.entities.Call.create({
    customer_id: incomingCall?.customer_id || "",
    customer_phone: phone || "unknown",
    direction: "inbound",
    status: "in_progress",
    call_start_time: now,
    case_id: incomingCall?.case_id || "",
    notes: user?.email ? `agent:${user.email}` : "",
  });
}

export async function finishCallSession(callId, { duration, notes } = {}) {
  if (!callId) return null;
  return base44.entities.Call.update(callId, {
    duration: typeof duration === "number" ? duration : undefined,
    notes: notes || undefined,
    call_end_time: new Date().toISOString(),
  });
}

export async function completeCallSession(callId, patch = {}) {
  if (!callId) return null;
  return base44.entities.Call.update(callId, {
    status: "completed",
    call_end_time: patch.call_end_time || new Date().toISOString(),
    ...patch,
  });
}
