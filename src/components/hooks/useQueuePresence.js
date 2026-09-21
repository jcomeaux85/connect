import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useUser } from "@/components/hooks/useUser";

// Queue presence. Logging in puts you in your queue (your break group), and a
// heartbeat keeps you lit for teammates. Someone with no heartbeat for
// PRESENCE_FRESH_MS reads as logged out, so a closed laptop clears itself.
export const HEARTBEAT_MS = 60 * 1000;
export const PRESENCE_FRESH_MS = 2 * 60 * 1000;

// The queue key. Users without a break group share the "default" queue.
export const queueKeyFor = (user) => user?.break_group_id || "default";

export function useQueuePresence() {
  const { data: user } = useUser();
  const email = user?.email;
  const name = user?.full_name || "";
  const queueKey = queueKeyFor(user);

  useEffect(() => {
    if (!email) return undefined;
    let rowId = null;
    let stopped = false;
    let firstBeat = true;

    const beat = async () => {
      const now = new Date().toISOString();
      try {
        if (!rowId) {
          const mine = await base44.entities.QueuePresence.filter({ employee_email: email }, "-updated_date", 1);
          rowId = mine?.[0]?.id || null;
        }
        const patch = { employee_name: name, break_group_id: queueKey, status: "active", last_seen: now };
        if (firstBeat) patch.logged_in_at = now;
        if (rowId) {
          await base44.entities.QueuePresence.update(rowId, patch);
        } else {
          const created = await base44.entities.QueuePresence.create({ employee_email: email, logged_in_at: now, ...patch });
          rowId = created?.id || null;
        }
        firstBeat = false;
      } catch (err) {
        // Presence is best effort. A failed beat must never break the page.
        rowId = null;
      }
    };

    const markOff = () => {
      if (rowId) base44.entities.QueuePresence.update(rowId, { status: "off" }).catch(() => {});
    };

    beat();
    const id = setInterval(() => { if (!stopped && document.visibilityState !== "hidden") beat(); }, HEARTBEAT_MS);
    const onVisible = () => { if (document.visibilityState === "visible") beat(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", markOff);

    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", markOff);
      markOff();
    };
  }, [email, name, queueKey]);
}
