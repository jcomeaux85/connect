// After-call → blended pulse. Floor rows stay identified.
// This projection is the only shape that should ever leave the tenancy.
// Nothing consumes it yet on purpose.

const DROP = new Set([
  "client_company",
  "caller_name",
  "user_email",
  "case_id",
  "customer_id",
  "customer_phone",
  "phone",
  "call_notes",
  "follow_up_notes",
  "knowledge_gap_notes",
  "notes",
  "transcript",
  "recording_url",
  "id",
  "callId",
]);

function hourOfWeek(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCDay() * 24 + d.getUTCHours();
}

function bucketDuration(seconds) {
  const n = Number(seconds) || 0;
  if (n < 60) return "0-1m";
  if (n < 180) return "1-3m";
  if (n < 300) return "3-5m";
  if (n < 600) return "5-10m";
  return "10m+";
}

/**
 * @param {{ call?: object, disposition?: object }} raw
 * @returns {object} identifier-free pulse row
 */
export function projectCall({ call = {}, disposition = {} } = {}) {
  const submitted = disposition.submitted_at || call.call_end_time || call.created_date;
  const duration = call.duration ?? disposition.completion_time_seconds;

  const row = {
    benefit_area: disposition.benefit_area || call.call_category || null,
    service_reason: disposition.service_reason || call.call_qualifier || null,
    resolution_status: disposition.resolution_status || null,
    actions_taken: Array.isArray(disposition.actions_taken) ? disposition.actions_taken : [],
    compliance_flag_types: Array.isArray(disposition.compliance_flags)
      ? disposition.compliance_flags.filter((f) => f && f !== "None")
      : [],
    direction: (call.direction || disposition.call_type || "").toLowerCase() || null,
    duration_bucket: bucketDuration(duration),
    wrap_seconds_bucket: bucketDuration(disposition.completion_time_seconds),
    hour_of_week: hourOfWeek(submitted),
    sentiment_start: disposition.sentiment_start || null,
    sentiment_end: disposition.sentiment_end || null,
    handling_rating: disposition.handling_rating || null,
    difficulty_rating: disposition.difficulty_rating || null,
    could_automate: !!disposition.could_automate,
    knowledge_gap: !!disposition.knowledge_gap,
    follow_up_required: !!disposition.follow_up_required,
  };

  for (const key of Object.keys(row)) {
    if (DROP.has(key)) delete row[key];
  }
  return row;
}

export const TELEMETRY_DROPPED_FIELDS = [...DROP];
