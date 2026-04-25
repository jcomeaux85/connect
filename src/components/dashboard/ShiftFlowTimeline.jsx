import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/ThemeProvider";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";

const TODAY = format(new Date(), "yyyy-MM-dd");

function toMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function fromMins(m) {
  const clamped = Math.max(0, m);
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}
function toPct(time, start, end) {
  const total = toMins(end) - toMins(start);
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, ((toMins(time) - toMins(start)) / total) * 100));
}
function widthPct(s, e, start, end) {
  const total = toMins(end) - toMins(start);
  if (total <= 0) return 0;
  return Math.max(0, ((toMins(e) - toMins(s)) / total) * 100);
}
function checkConflict(requestedStart, existingBreaks, myEmail) {
  const reqMins = toMins(requestedStart);
  for (const b of existingBreaks) {
    if (b.employee_email === myEmail) continue;
    if (b.status === "cancelled" || b.status === "declined") continue;
    const bStart = toMins(b.requested_start_time || b.actual_start_time);
    if (Math.abs(reqMins - bStart) < 30) return true;
  }
  return false;
}

// Teammate colors: burnt orange, sky blue, aloe green, then repeat
const TEAMMATE_COLORS = [
  { lunch: "rgba(210,100,30,0.45)", dot: "#E8621A" },   // burnt orange
  { lunch: "rgba(30,160,220,0.45)", dot: "#1DA8E0" },   // sky blue
  { lunch: "rgba(80,180,100,0.45)", dot: "#50B464" },   // aloe green
  { lunch: "rgba(210,100,30,0.35)", dot: "#E8621A" },
];
// Keep for backward compat
const TEAMMATE_LUNCH_COLORS = TEAMMATE_COLORS.map(c => c.lunch);
const TEAMMATE_DOT_COLORS = TEAMMATE_COLORS.map(c => c.dot);

export default function ShiftFlowTimeline() {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [nowMins, setNowMins] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [popover, setPopover] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNowMins(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["core-employees-shifts"],
    queryFn: () => base44.entities.CoreEmployee.list("full_name"),
  });
  const { data: shifts = [] } = useQuery({
    queryKey: ["core-shifts-today"],
    queryFn: () => base44.entities.CoreShift.filter({ shift_date: TODAY }),
  });
  const { data: breaks = [] } = useQuery({
    queryKey: ["employee-breaks-today"],
    queryFn: () => base44.entities.EmployeeBreak.filter({ break_date: TODAY }),
    refetchInterval: 30000,
  });
  const { data: breakGroups = [] } = useQuery({
    queryKey: ["break-groups"],
    queryFn: () => base44.entities.BreakGroup.list("name"),
  });
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const createBreakMutation = useMutation({
    mutationFn: (d) => base44.entities.EmployeeBreak.create(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-breaks-today"] }),
  });

  const employeesWithShifts = useMemo(() =>
    employees.filter(emp => shifts.some(s => s.employee_email === emp.email)),
    [employees, shifts]
  );

  const nowTime = fromMins(nowMins);

  if (employeesWithShifts.length === 0) {
    const defaultStart = "08:00";
    const defaultEnd = "17:00";
    const lunchStart = "12:00";
    const lunchEnd = "12:30";
    const totalMins = toMins(defaultEnd) - toMins(defaultStart);
    const progressPct = Math.max(0, Math.min(100, ((nowMins - toMins(defaultStart)) / totalMins) * 100));
    const lunchLeftPct = ((toMins(lunchStart) - toMins(defaultStart)) / totalMins) * 100;
    const lunchWidthPct = ((toMins(lunchEnd) - toMins(lunchStart)) / totalMins) * 100;
    return (
      <div className="px-4 py-3">
        <div className="relative" style={{ height: '20px' }}>
          {/* Track */}
          <div className="absolute inset-0 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)' }}>
            {/* Green progress */}
            <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #8B5CF6, #7C3AED)', transition: 'width 1s linear' }} />
            {/* Remaining shift (dim purple) */}
            <div className="absolute top-0 h-full" style={{ left: `${progressPct}%`, width: `${100 - progressPct}%`, background: isDark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.12)' }} />
            {/* Lunch block */}
            <div className="absolute top-0 h-full pointer-events-none" style={{ left: `${lunchLeftPct}%`, width: `${lunchWidthPct}%`, background: isDark ? 'rgba(139,92,246,0.55)' : 'rgba(109,40,217,0.45)' }} />
          </div>
          {/* Now circle */}
          {progressPct > 0 && progressPct < 100 && (
            <div className="absolute top-1/2 pointer-events-none" style={{ left: `${progressPct}%`, transform: 'translate(-50%, -50%)', width: '16px', height: '16px', borderRadius: '50%', background: isDark ? '#d4d4d8' : '#e4e4e7', border: '2.5px solid white', boxShadow: '0 0 0 1px rgba(100,100,120,0.3), 0 2px 6px rgba(0,0,0,0.4)', zIndex: 30 }} />
          )}
        </div>
      </div>
    );
  }

  // Global time window = widest shift span
  const allStartMins = employeesWithShifts.map(e => toMins(shifts.find(s => s.employee_email === e.email)?.start_time || "08:00"));
  const allEndMins = employeesWithShifts.map(e => toMins(shifts.find(s => s.employee_email === e.email)?.end_time || "17:00"));
  const globalStart = fromMins(Math.min(...allStartMins));
  const globalEnd = fromMins(Math.max(...allEndMins));

  // Me
  const me = employeesWithShifts.find(e => e.email === currentUser?.email);
  const meShift = me ? shifts.find(s => s.employee_email === me.email) : null;
  const meStart = meShift?.start_time || globalStart;
  const meEnd = meShift?.end_time || globalEnd;

  // Green progress: how far through MY shift
  const progressPct = meShift
    ? Math.max(0, Math.min(100, ((nowMins - toMins(meStart)) / (toMins(meEnd) - toMins(meStart))) * 100))
    : 0;

  // Green bar width in global coords = progressPct of my shift width
  const meShiftWidthPct = widthPct(meStart, meEnd, globalStart, globalEnd);
  const meShiftLeftPct = toPct(meStart, globalStart, globalEnd);
  const greenWidthPct = (progressPct / 100) * meShiftWidthPct;

  // Teammates ordered consistently (not me)
  const teammates = employeesWithShifts.filter(e => e.email !== currentUser?.email);

  // Group breaks for conflict
  const empGroup = me?.break_group_id ? breakGroups.find(g => g.id === me.break_group_id) : null;
  const groupBreaks = empGroup
    ? breaks.filter(b => empGroup.member_emails?.includes(b.employee_email))
    : breaks;

  const meBreaks = breaks.filter(b => b.employee_email === me?.email);
  const amBreak = meBreaks.find(b => b.break_type === "AM_15_min" && b.status !== "cancelled" && b.status !== "declined");
  const pmBreak = meBreaks.find(b => b.break_type === "PM_15_min" && b.status !== "cancelled" && b.status !== "declined");

  const handleBarClick = (e) => {
    if (!me || !meShift) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const totalMins = toMins(globalEnd) - toMins(globalStart);
    const clickedMins = toMins(globalStart) + Math.round((pct * totalMins) / 15) * 15;
    // Only allow clicks within my shift
    if (clickedMins < toMins(meStart) || clickedMins >= toMins(meEnd)) return;
    const lunchStart = me.lunch_start_time || "12:00";
    const lunchEnd = me.lunch_end_time || "12:30";
    if (clickedMins >= toMins(lunchStart) && clickedMins < toMins(lunchEnd)) return;
    const isAM = clickedMins < toMins(lunchStart);
    const breakType = isAM ? "AM_15_min" : "PM_15_min";
    if (isAM && amBreak) return;
    if (!isAM && pmBreak) return;
    const clickedTime = fromMins(clickedMins);
    const conflict = checkConflict(clickedTime, groupBreaks, me.email);
    setPopover({ time: clickedTime, type: breakType, conflict, pct: pct * 100 });
  };

  return (
    <div className="px-4 py-3">
      <div className="relative" style={{ height: '20px' }}>

        {/* === BASE TRACK === */}
        <div
          className="absolute inset-0 rounded-full overflow-visible"
          style={{
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
            cursor: me ? 'crosshair' : 'default',
          }}
          onClick={handleBarClick}
        >
          {/* Green "clock" progress fill */}
          <div className="absolute top-0 left-0 h-full rounded-full"
            style={{
              left: `${meShiftLeftPct}%`,
              width: `${greenWidthPct}%`,
              background: 'linear-gradient(90deg, #8B5CF6, #7C3AED)',
              transition: 'width 1s linear',
            }} />

          {/* Remaining my-shift (dim) */}
          <div className="absolute top-0 h-full"
            style={{
              left: `${meShiftLeftPct + greenWidthPct}%`,
              width: `${meShiftWidthPct - greenWidthPct}%`,
              background: isDark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.12)',
            }} />

          {/* === LUNCH BLOCKS === */}

          {/* Teammate lunches — grey gradient (lighter = earlier index) */}
          {teammates.map((emp, i) => {
            if (!emp.lunch_start_time) return null;
            const lEnd = emp.lunch_end_time || fromMins(toMins(emp.lunch_start_time) + 60);
            return (
              <div key={`lunch-tm-${emp.id}`}
                className="absolute top-1 pointer-events-none"
                style={{
                  left: `${toPct(emp.lunch_start_time, globalStart, globalEnd)}%`,
                  width: `${widthPct(emp.lunch_start_time, lEnd, globalStart, globalEnd)}%`,
                  height: '60%',
                  background: TEAMMATE_LUNCH_COLORS[i % TEAMMATE_LUNCH_COLORS.length],
                  borderRadius: '3px',
                }} />
            );
          })}

          {/* My lunch — purple */}
          {me?.lunch_start_time && (
            <div className="absolute top-0 h-full pointer-events-none"
              style={{
                left: `${toPct(me.lunch_start_time, globalStart, globalEnd)}%`,
                width: `${widthPct(me.lunch_start_time, me.lunch_end_time || fromMins(toMins(me.lunch_start_time) + 60), globalStart, globalEnd)}%`,
                background: isDark ? 'rgba(139,92,246,0.55)' : 'rgba(109,40,217,0.45)',
                borderRadius: '3px',
              }} />
          )}
        </div>

        {/* === NOW CIRCLE (on top, outside overflow:hidden) === */}
        {meShift && progressPct > 0 && progressPct < 100 && (
          <div className="absolute top-1/2 pointer-events-none"
            style={{
              left: `${meShiftLeftPct + greenWidthPct}%`,
              transform: 'translate(-50%, -50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: isDark ? '#d4d4d8' : '#e4e4e7',
              border: '2.5px solid white',
              boxShadow: '0 0 0 1px rgba(100,100,120,0.3), 0 2px 6px rgba(0,0,0,0.4)',
              zIndex: 30,
            }} />
        )}

        {/* === BREAK DOTS === */}

        {/* Teammate break dots */}
        {teammates.map((emp, i) => {
          const empBreaks = breaks.filter(b =>
            b.employee_email === emp.email &&
            b.status !== "cancelled" && b.status !== "declined"
          );
          return empBreaks.map(brk => {
            const bTime = brk.requested_start_time || brk.actual_start_time;
            if (!bTime) return null;
            const pct = toPct(bTime, globalStart, globalEnd);
            const taken = brk.status === "taken";
            const dotColor = TEAMMATE_DOT_COLORS[i % TEAMMATE_DOT_COLORS.length];
            return (
              <div key={brk.id}
                className="absolute top-1/2 pointer-events-none"
                style={{
                  left: `${pct}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: taken ? dotColor : 'transparent',
                  border: `2px solid ${dotColor}`,
                  zIndex: 20,
                }} />
            );
          });
        })}

        {/* My AM break dot */}
        {amBreak && (() => {
          const bTime = amBreak.requested_start_time || amBreak.actual_start_time;
          const pct = toPct(bTime, globalStart, globalEnd);
          const taken = amBreak.status === "taken";
          return (
            <div className="absolute top-1/2 pointer-events-none"
              style={{
                left: `${pct}%`,
                transform: 'translate(-50%, -50%)',
                width: '13px',
                height: '13px',
                borderRadius: '50%',
                background: taken ? '#8B5CF6' : 'transparent',
                border: '2.5px solid #a78bfa',
                boxShadow: taken ? '0 0 8px rgba(139,92,246,0.9)' : '0 0 4px rgba(139,92,246,0.5)',
                zIndex: 25,
              }} />
          );
        })()}

        {/* My PM break dot */}
        {pmBreak && (() => {
          const bTime = pmBreak.requested_start_time || pmBreak.actual_start_time;
          const pct = toPct(bTime, globalStart, globalEnd);
          const taken = pmBreak.status === "taken";
          return (
            <div className="absolute top-1/2 pointer-events-none"
              style={{
                left: `${pct}%`,
                transform: 'translate(-50%, -50%)',
                width: '13px',
                height: '13px',
                borderRadius: '50%',
                background: taken ? '#8B5CF6' : 'transparent',
                border: '2.5px solid #a78bfa',
                boxShadow: taken ? '0 0 8px rgba(139,92,246,0.9)' : '0 0 4px rgba(139,92,246,0.5)',
                zIndex: 25,
              }} />
          );
        })()}

        {/* === POPOVER === */}
        <AnimatePresence>
          {popover && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              className="absolute z-50 rounded-xl p-3 shadow-xl"
              style={{
                left: `${Math.min(85, Math.max(10, popover.pct))}%`,
                bottom: '28px',
                transform: 'translateX(-50%)',
                minWidth: '148px',
                background: isDark ? 'rgba(18,10,36,0.98)' : 'rgba(250,248,255,0.98)',
                border: `1px solid ${popover.conflict ? 'rgba(239,68,68,0.5)' : 'rgba(139,92,246,0.5)'}`,
                boxShadow: popover.conflict ? '0 4px 20px rgba(239,68,68,0.2)' : '0 4px 20px rgba(139,92,246,0.2)',
              }}
            >
              <p className="text-[10px] font-bold mb-1" style={{ color: popover.conflict ? '#EF4444' : '#a78bfa' }}>
                {popover.conflict ? '⚠ Overlaps another break' : `Reserve ${popover.type === 'AM_15_min' ? 'AM' : 'PM'} Break`}
              </p>
              {!popover.conflict && (
                <p className="text-[11px] mb-2" style={{ color: colors.text }}>
                  {(() => {
                    const [h, m] = popover.time.split(":").map(Number);
                    const endMins = h * 60 + m + 15;
                    const eh = Math.floor(endMins / 60), em = endMins % 60;
                    const fmt = (hh, mm) => `${hh % 12 || 12}:${String(mm).padStart(2,"0")} ${hh >= 12 ? "PM" : "AM"}`;
                    return `${fmt(h, m)} – ${fmt(eh, em)}`;
                  })()}
                </p>
              )}
              <div className="flex gap-1.5">
                {!popover.conflict && (
                  <button
                    onClick={() => {
                      createBreakMutation.mutate({
                        employee_email: me.email,
                        break_date: TODAY,
                        break_type: popover.type,
                        requested_start_time: popover.time,
                        status: "reserved",
                        buffer_start: fromMins(toMins(popover.time) - 15),
                        buffer_end: fromMins(toMins(popover.time) + 30),
                      });
                      setPopover(null);
                    }}
                    className="flex-1 text-[10px] font-bold py-1 rounded-lg border-0"
                    style={{ background: 'rgba(139,92,246,0.85)', color: '#fff' }}>
                    Reserve
                  </button>
                )}
                <button
                  onClick={() => setPopover(null)}
                  className="flex-1 text-[10px] font-bold py-1 rounded-lg border-0"
                  style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', color: colors.textSecondary }}>
                  {popover.conflict ? 'OK' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}