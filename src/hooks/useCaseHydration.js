import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// ─────────────────────────────────────────────────────────────
// ATOMIC CASE HYDRATION
// Given a case ID, pre-loads ALL related data (customer, employer,
// calls, SMS, notes, tasks) in a single parallel fetch pass so the
// agent sees zero loading spinners when navigating into a case.
//
// Returns a flat `hydrated` object the UI can read synchronously.
// ─────────────────────────────────────────────────────────────

export function useCaseHydration(caseId, options = {}) {
  // 1 — The case itself (the "anchor")
  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['case-hydrate-case', caseId],
    queryFn: () => base44.entities.Case.get(caseId),
    enabled: !!caseId,
    staleTime: 30000,
    ...options,
  });

  const customerId = caseData?.customer_id;
  const employerId = caseData?.employer_id;

  // 2 — Customer profile (parallel with case)
  const { data: customer } = useQuery({
    queryKey: ['case-hydrate-customer', customerId],
    queryFn: () => base44.entities.Customer.get(customerId),
    enabled: !!customerId,
    staleTime: 60000,
  });

  // 3 — Employer / company (parallel)
  const { data: employer } = useQuery({
    queryKey: ['case-hydrate-employer', employerId],
    queryFn: () => employerId ? base44.entities.Employer.get(employerId) : null,
    enabled: !!employerId,
    staleTime: 120000,
  });

  // 4 — All calls on this case (parallel)
  const { data: calls = [] } = useQuery({
    queryKey: ['case-hydrate-calls', caseId],
    queryFn: () => base44.entities.Call.filter({ case_id: caseId }, '-created_date', 50),
    enabled: !!caseId,
    staleTime: 15000,
  });

  // 5 — All SMS on this case (parallel)
  const { data: sms = [] } = useQuery({
    queryKey: ['case-hydrate-sms', caseId],
    queryFn: () => base44.entities.SMS.filter({ case_id: caseId }, '-created_date', 50),
    enabled: !!caseId,
    staleTime: 15000,
  });

  // 6 — Notes (parallel)
  const { data: notes = [] } = useQuery({
    queryKey: ['case-hydrate-notes', caseId],
    queryFn: () => base44.entities.Note.filter({ case_id: caseId }, '-created_date', 50),
    enabled: !!caseId,
    staleTime: 15000,
  });

  // 7 — Tasks (parallel)
  const { data: tasks = [] } = useQuery({
    queryKey: ['case-hydrate-tasks', caseId],
    queryFn: () => base44.entities.Task.filter({ case_id: caseId }, '-created_date', 50),
    enabled: !!caseId,
    staleTime: 15000,
  });

  // 8 — Attachments (parallel)
  const { data: attachments = [] } = useQuery({
    queryKey: ['case-hydrate-attachments', caseId],
    queryFn: () => base44.entities.Attachment.filter({ case_id: caseId }, '-created_date', 50),
    enabled: !!caseId,
    staleTime: 30000,
  });

  // Merge into a single unified activity timeline (same shape as Intent Bus)
  const activity = [
    ...calls.map((c) => ({ type: 'call', date: c.call_start_time || c.created_date, entity: c })),
    ...sms.map((s) => ({ type: 'sms', date: s.sent_at || s.created_date, entity: s })),
    ...notes.map((n) => ({ type: 'note', date: n.created_date, entity: n })),
    ...tasks.map((t) => ({ type: 'task', date: t.created_date, entity: t })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return {
    caseData,
    customer,
    employer,
    calls,
    sms,
    notes,
    tasks,
    attachments,
    activity,
    isLoading: caseLoading && !caseData,
    // Convenience flags
    hasOpenCall: calls.some((c) => c.status !== 'completed' && c.status !== 'missed'),
    hasUnreadSMS: sms.some((s) => s.direction === 'received' && !s.dismissed),
    hasPendingTasks: tasks.some((t) => t.status !== 'done' && t.status !== 'completed'),
  };
}