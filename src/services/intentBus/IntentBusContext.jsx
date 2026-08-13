import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/components/hooks/useUser";

// ─────────────────────────────────────────────────────────────
// UNIFIED INTENT BUS
// Normalizes every inbound interaction — Calls, SMS, Email, Tasks —
// into a single "Intent Object" so the dashboard renders ONE queue
// instead of separate tool-specific panels.
//
// Intent shape:
//   { id, channel, direction, priority, status, summary, customer_ref,
//     case_ref, timestamp, raw }
//
// channel:     'call' | 'sms' | 'email' | 'task'
// direction:   'inbound' | 'outbound'
// priority:    'urgent' | 'high' | 'medium' | 'low'
// status:      'pending' | 'active' | 'resolved'
// ─────────────────────────────────────────────────────────────

const IntentBusContext = createContext(null);

// Priority resolver — maps entity-specific fields to a unified priority
function resolvePriority(entity, channel) {
  if (channel === 'call') {
    if (entity.status === 'missed' || entity.status === 'failed') return 'urgent';
    if (entity.direction === 'inbound') return 'high';
    return 'medium';
  }
  if (channel === 'sms') {
    if (entity.direction === 'received') return 'high';
    return 'low';
  }
  if (channel === 'task') {
    if (entity.priority === 'urgent' || entity.priority === 'high') return 'high';
    return 'low';
  }
  return 'medium';
}

// Normalizers — one per channel, converts raw entity → Intent Object
const normalizers = {
  call: (c) => ({
    id: `call:${c.id}`,
    channel: 'call',
    direction: c.direction || 'inbound',
    priority: resolvePriority(c, 'call'),
    status: c.status === 'completed' ? 'resolved' : c.status === 'missed' ? 'pending' : 'active',
    summary: c.customer_phone || 'Unknown caller',
    customer_ref: c.customer_id || null,
    case_ref: c.case_id || null,
    timestamp: c.call_start_time || c.created_date,
    raw: c,
  }),
  sms: (s) => ({
    id: `sms:${s.id}`,
    channel: 'sms',
    direction: s.direction || 'received',
    priority: resolvePriority(s, 'sms'),
    status: s.direction === 'received' && !s.dismissed ? 'pending' : 'resolved',
    summary: s.message ? s.message.slice(0, 80) : '',
    customer_ref: s.customer_id || null,
    case_ref: s.case_id || null,
    timestamp: s.sent_at || s.created_date,
    raw: s,
  }),
  task: (t) => ({
    id: `task:${t.id}`,
    channel: 'task',
    direction: 'outbound',
    priority: resolvePriority(t, 'task'),
    status: t.status === 'done' || t.status === 'completed' ? 'resolved' : 'pending',
    summary: t.title || t.description || 'Untitled task',
    customer_ref: null,
    case_ref: t.case_id || null,
    timestamp: t.due_date || t.created_date,
    raw: t,
  }),
};

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

export function IntentBusProvider({ children }) {
  const { data: user } = useUser();
  const [activeIntentId, setActiveIntentId] = useState(null);

  // Single fetch pass — all channels in parallel, scoped to the current user
  const { data: calls = [] } = useQuery({
    queryKey: ['intent-bus-calls', user?.email],
    queryFn: () => base44.entities.Call.list('-created_date', 50),
    enabled: !!user?.email,
    refetchInterval: 10000,
  });

  const { data: sms = [] } = useQuery({
    queryKey: ['intent-bus-sms', user?.email],
    queryFn: () => base44.entities.SMS.list('-created_date', 50),
    enabled: !!user?.email,
    refetchInterval: 10000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['intent-bus-tasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ status: { $ne: 'done' } }, '-created_date', 50),
    enabled: !!user?.email,
    refetchInterval: 15000,
  });

  // Merge + normalize + sort into a single intent stream
  const intents = useCallback(() => {
    const all = [
      ...calls.map(normalizers.call),
      ...sms.map(normalizers.sms),
      ...tasks.map(normalizers.task),
    ];
    // Pending first (by priority), then everything else by recency
    return all.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      if (a.status === 'pending' && b.status === 'pending') {
        return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
      }
      return (b.timestamp || '').localeCompare(a.timestamp || '');
    });
  }, [calls, sms, tasks]);

  const allIntents = intents();
  const pendingIntents = allIntents.filter((i) => i.status === 'pending');
  const activeIntent = allIntents.find((i) => i.id === activeIntentId) || null;

  // Auto-select the highest-priority pending intent if nothing is active
  useEffect(() => {
    if (!activeIntentId && pendingIntents.length > 0) {
      setActiveIntentId(pendingIntents[0].id);
    }
  }, [pendingIntents, activeIntentId]);

  const resolveIntent = useCallback(async (intentId) => {
    // Mark the underlying entity as resolved — the bus refetches via React Query
    const intent = allIntents.find((i) => i.id === intentId);
    if (!intent) return;
    const [channel, entityId] = intentId.split(':');
    if (channel === 'call') {
      await base44.entities.Call.update(entityId, { status: 'completed' });
    } else if (channel === 'sms') {
      await base44.entities.SMS.update(entityId, { dismissed: true });
    } else if (channel === 'task') {
      await base44.entities.Task.update(entityId, { status: 'done' });
    }
    setActiveIntentId(null);
  }, [allIntents]);

  const value = {
    intents: allIntents,
    pendingIntents,
    activeIntent,
    activeIntentId,
    setActiveIntentId,
    resolveIntent,
    counts: {
      total: allIntents.length,
      pending: pendingIntents.length,
      calls: allIntents.filter((i) => i.channel === 'call').length,
      sms: allIntents.filter((i) => i.channel === 'sms').length,
      tasks: allIntents.filter((i) => i.channel === 'task').length,
    },
  };

  return <IntentBusContext.Provider value={value}>{children}</IntentBusContext.Provider>;
}

export function useIntentBus() {
  const ctx = useContext(IntentBusContext);
  if (!ctx) throw new Error("useIntentBus must be used within IntentBusProvider");
  return ctx;
}