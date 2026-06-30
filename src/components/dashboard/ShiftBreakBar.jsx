import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/components/hooks/useUser";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Coffee, Clock } from "lucide-react";

const BRAND_PURPLE = "#7c3aed";
const ALERT_BLUE = "#3b82f6";

const TODAY = format(new Date(), "yyyy-MM-dd");
const DAY_START = "08:00";
const DAY_END = "18:00";

// The four agents that make up this queue. Fixed daily lunches (Eastern).
const QUEUE = [
  { name: "Ryan",    email: "ryan@queue.demo",    color: "#ef4444", lunchStart: "10:00", lunchEnd: "11:00" },
  { name: "Vanessa", email: "vanessa@queue.demo", color: "#eab308", lunchStart: "11:00", lunchEnd: "12:00" },
  { name: "Chris",   email: "chris@queue.demo",   color: "#3b82f6", lunchStart: "12:00", lunchEnd: "13:00" },
  { name: "Jarrad",  email: "jarrad@queue.demo",  color: "#22c55e", lunchStart: "13:00", lunchEnd: "14:00" },
];

function toMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function fromMins(m) {
  const c = Math.max(0, m);
  return `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(c % 60).padStart(2, "0")}`;
}
function pct(t) {
  const total = toMins(DAY_END) - toMins(DAY_START);
  return Math.max(0, Math.min(100, ((toMins(t) - toMins(DAY_START)) / total) * 100));
}
function wPct(s, e) {
  const total = toMins(DAY_END) - toMins(DAY_START);
  return Math.max(0, ((toMins(e) - toMins(s)) / total) * 100);
}
function hexToRgba(hex, a) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function fmt12(t) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const BREAK_LEN = 15; // minutes

export default function ShiftBreakBar({ isDark }) {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const txtPrimary = isDark ? "#f0f0f0" : "#111827";
  const txtSecondary = isDark ? "#9ca3af" : "#6b7280";

  const [nowMins, setNowMins] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });
  const [showClock, setShowClock] = useState(false);
  const [pickTime, setPickTime] = useState("10:15");

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNowMins(n.getHours() * 60 + n.getMinutes());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const { data: breaks = [] } = useQuery({
    queryKey: ["queue-breaks-today"],
    queryFn: () => base44.entities.EmployeeBreak.filter({ break_date: TODAY }),
    refetchInterval: 20000,
  });

  // Only breaks for this queue's emails
  const queueEmails = QUEUE.map((q) => q.email);
  const queueBreaks = useMemo(
    () => breaks.filter((b) => queueEmails.includes(b.employee_email) && b.status !== "cancelled" && b.status !== "declined"),
    [breaks]
  );

  const createBreak = useMutation({
    mutationFn: (d) => base44.entities.EmployeeBreak.create(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["queue-breaks-today"] }),
  });

  const removeBreak = useMutation({
    mutationFn: (id) => base44.entities.EmployeeBreak.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["queue-breaks-today"] }),
  });

  // Locked to the logged-in user — no switching, ever.
  const active = {
    name: user?.full_name || "You",
    email: user?.email || "you@queue.demo",
    color: BRAND_PURPLE,
  };
  const colorOf = (email) =>
    email === active.email ? BRAND_PURPLE : (QUEUE.find((q) => q.email === email)?.color || "#94a3b8");
  const nameOf = (email) =>
    email === active.email ? active.name : (QUEUE.find((q) => q.email === email)?.name || "?");

  const myBreaks = queueBreaks.filter((b) => b.employee_email === active.email);

  // --- Conflict rules ---
  // 1. No two agents on break overlapping (15-min block) — buffer applied.
  // 2. An agent can't take/schedule another break within 1 hour of one of their own.
  function overlapsOther(startMins) {
    const s = startMins, e = startMins + BREAK_LEN;
    return queueBreaks.some((b) => {
      if (b.employee_email === active.email) return false;
      const bs = toMins(b.requested_start_time || b.actual_start_time);
      const be = bs + BREAK_LEN;
      return s < be && bs < e;
    });
  }
  function withinOwnHour(startMins) {
    return myBreaks.some((b) => {
      const bs = toMins(b.requested_start_time || b.actual_start_time);
      return Math.abs(startMins - bs) < 60;
    });
  }
  function reachedLimit() {
    return myBreaks.length >= 2;
  }

  function validate(startMins) {
    if (reachedLimit()) return "You've used both breaks today";
    if (startMins < toMins(DAY_START) || startMins + BREAK_LEN > toMins(DAY_END)) return "Outside shift hours";
    if (withinOwnHour(startMins)) return "Must be 1 hour from your other break";
    if (overlapsOther(startMins)) return "Another agent is on break then";
    return null;
  }

  // "Break" now = take a break starting now (rounded to current minute)
  function takeNow() {
    const start = Math.round(nowMins / 5) * 5;
    const err = validate(start);
    if (err) { window.alert(err); return; }
    createBreak.mutate({
      employee_email: active.email,
      break_date: TODAY,
      break_type: myBreaks.length === 0 ? "AM_15_min" : "PM_15_min",
      actual_start_time: fromMins(start),
      actual_end_time: fromMins(start + BREAK_LEN),
      status: "taken",
      buffer_start: fromMins(start - BREAK_LEN),
      buffer_end: fromMins(start + BREAK_LEN * 2),
    });
  }

  // Schedule from the clock time picker
  function scheduleAt() {
    const start = toMins(pickTime);
    const err = validate(start);
    if (err) { window.alert(err); return; }
    createBreak.mutate({
      employee_email: active.email,
      break_date: TODAY,
      break_type: myBreaks.length === 0 ? "AM_15_min" : "PM_15_min",
      requested_start_time: pickTime,
      status: "reserved",
      buffer_start: fromMins(start - BREAK_LEN),
      buffer_end: fromMins(start + BREAK_LEN * 2),
    });
    setShowClock(false);
  }

  const progressPct = pct(fromMins(nowMins));

  // Time options for the picker (5-min steps within shift)
  const timeOptions = useMemo(() => {
    const opts = [];
    for (let m = toMins(DAY_START); m + BREAK_LEN <= toMins(DAY_END); m += 5) opts.push(fromMins(m));
    return opts;
  }, []);

  const armed = showClock; // button is "armed" once a time has been picked

  return (
    <div className="px-4 py-2.5">
      {/* Section title — just above the left side of the bar */}
      <div className="mb-1.5" style={{ fontSize: 12, letterSpacing: "0.04em", color: txtSecondary }}>
        <span style={{ fontWeight: 800, color: txtPrimary }}>Q</span>flo
      </div>

      {/* === BAR === */}
      <div className="relative" style={{ height: "20px" }}>
        <div className="absolute rounded-full overflow-hidden" style={{ top: "3px", left: 0, right: 0, height: "14px", background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)" }}>
          {/* Time progress fill */}
          <div className="absolute top-0 left-0 h-full" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${BRAND_PURPLE}, #4f46e5)` }} />

          {/* Fixed lunch segments — one per agent, in their color */}
          {QUEUE.map((q) => (
            <div key={`lunch-${q.email}`} className="absolute pointer-events-none" style={{
              top: "18%", height: "64%",
              left: `${pct(q.lunchStart)}%`,
              width: `${wPct(q.lunchStart, q.lunchEnd)}%`,
              background: hexToRgba(q.color, 0.55),
              borderRadius: "3px",
            }} title={`${q.name} lunch ${fmt12(q.lunchStart)}–${fmt12(q.lunchEnd)}`} />
          ))}
        </div>

        {/* Now line */}
        {progressPct > 0 && progressPct < 100 && (
          <div className="absolute pointer-events-none" style={{ left: `${progressPct}%`, top: "1px", bottom: "1px", width: "2px", background: BRAND_PURPLE, boxShadow: `0 0 6px ${hexToRgba(BRAND_PURPLE, 0.8)}`, transform: "translateX(-50%)", zIndex: 25 }} />
        )}

        {/* Break circles — filled = taken, outline = reserved */}
        {queueBreaks.map((b) => {
          const bTime = b.actual_start_time || b.requested_start_time;
          if (!bTime) return null;
          const c = colorOf(b.employee_email);
          const taken = b.status === "taken";
          const mine = b.employee_email === active.email && !taken;
          return (
            <div key={b.id} className="absolute top-1/2"
              onClick={mine ? () => removeBreak.mutate(b.id) : undefined}
              title={mine ? `Click to remove ${nameOf(b.employee_email)}'s scheduled break` : `${nameOf(b.employee_email)} break ${fmt12(bTime)} (${taken ? "taken" : "scheduled"})`}
              style={{
                left: `${pct(bTime)}%`,
                transform: "translate(-50%, -50%)",
                width: "13px", height: "13px", borderRadius: "50%",
                background: taken ? c : "transparent",
                border: `2.5px solid ${c}`,
                boxShadow: taken ? `0 0 7px ${c}bb` : `0 0 4px ${c}77`,
                cursor: mine ? "pointer" : "default",
                zIndex: 22,
              }} />
          );
        })}
      </div>

      {/* Break + Clock buttons — in normal flow, right-aligned under the bar */}
      <div className="flex items-center justify-end gap-1.5 mt-1.5">
        <AnimatePresence>
          {showClock && (
            <motion.div
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1.5 overflow-hidden"
            >
              <select value={pickTime} onChange={(e) => setPickTime(e.target.value)}
                className="text-[11px] font-semibold rounded-lg px-2 py-1 outline-none"
                style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6", color: txtPrimary, border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb"}` }}>
                {timeOptions.map((t) => <option key={t} value={t}>{fmt12(t)}</option>)}
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => setShowClock((s) => !s)} title="Schedule a break for a specific time"
          className="flex items-center justify-center rounded-lg"
          style={{ width: 22, height: 22, background: showClock ? hexToRgba(ALERT_BLUE, 0.2) : (isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6"), border: `1px solid ${showClock ? hexToRgba(ALERT_BLUE, 0.5) : (isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb")}`, color: showClock ? ALERT_BLUE : txtSecondary }}>
          <Clock className="w-3 h-3" />
        </button>

        <button onClick={showClock ? scheduleAt : takeNow} title={showClock ? "Schedule break at chosen time" : "Take a break now"}
          disabled={reachedLimit()}
          className="relative flex items-center gap-1 rounded-lg px-2 font-bold text-[10px] overflow-hidden"
          style={{ height: 22, background: reachedLimit() ? (isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6") : ALERT_BLUE, color: reachedLimit() ? txtSecondary : "#fff", border: "none", cursor: reachedLimit() ? "not-allowed" : "pointer", opacity: reachedLimit() ? 0.6 : 1 }}>
          {/* Glare sweep — only while armed (a time has been picked) and not yet pressed */}
          {armed && !reachedLimit() && (
            <motion.span
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ width: "40%", background: "linear-gradient(105deg, transparent, rgba(255,255,255,0.65), transparent)" }}
              initial={{ left: "-50%" }}
              animate={{ left: "120%" }}
              transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
            />
          )}
          <Coffee className="w-3 h-3 relative z-10" />
          <span className="relative z-10">Break</span>
        </button>
      </div>
    </div>
  );
}