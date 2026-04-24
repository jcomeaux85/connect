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
function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
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

// Grey shades for teammates (not the current user)
const TEAMMATE_COLORS = [
  "rgba(160,160,180,0.5)",
  "rgba(130,130,150,0.45)",
  "rgba(100,100,120,0.4)",
  "rgba(180,175,200,0.45)",
];

export default function ShiftFlowTimeline() {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [nowMins, setNowMins] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [hover, setHover] = useState(null);
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

  // All employees with shifts today
  const employeesWithShifts = useMemo(() =>
    employees.filter(emp => shifts.some(s => s.employee_email === emp.email)),
    [employees, shifts]
  );

  if (employeesWithShifts.length === 0) return null;

  // Find the widest shift window to define the full bar range
  const allStartMins = employeesWithShifts.map(e => {
    const s = shifts.find(sh => sh.employee_email === e.email);
    return toMins(s?.start_time || "08:00");
  });
  const allEndMins = employeesWithShifts.map(e => {
    const s = shifts.find(sh => sh.employee_email === e.email);
    return toMins(s?.end_time || "17:00");
  });
  const globalStart = fromMins(Math.min(...allStartMins));
  const globalEnd = fromMins(Math.max(...allEndMins));

  // Current user's shift
  const meEmployee = employeesWithShifts.find(e => e.email === currentUser?.email);
  const meShift = meEmployee ? shifts.find(s => s.employee_email === meEmployee.email) : null;
  const meShiftStart = meShift?.start_time || globalStart;
  const meShiftEnd = meShift?.end_time || globalEnd;
  const progressPct = Math.max(0, Math.min(100,
    ((nowMins - toMins(meShiftStart)) / (toMins(meShiftEnd) - toMins(meShiftStart))) * 100
  ));

  // Group breaks for conflict checking
  const empGroup = meEmployee?.break_group_id
    ? breakGroups.find(g => g.id === meEmployee.break_group_id)
    : null;
  const groupBreaks = empGroup
    ? breaks.filter(b => empGroup.member_emails?.includes(b.employee_email))
    : breaks;

  const meBreaks = breaks.filter(b => b.employee_email === meEmployee?.email);
  const amBreak = meBreaks.find(b => b.break_type === "AM_15_min" && b.status !== "cancelled" && b.status !== "declined");
  const pmBreak = meBreaks.find(b => b.break_type === "PM_15_min" && b.status !== "cancelled" && b.status !== "declined");

  // Teammates (excluding current user)
  const teammates = employeesWithShifts.filter(e => e.email !== currentUser?.email);

  const handleBarClick = (e) => {
    if (!meEmployee) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const totalMins = toMins(meShiftEnd) - toMins(meShiftStart);
    const clickedMins = toMins(meShiftStart) + Math.round((pct * totalMins) / 15) * 15;
    const lunchStart = meEmployee.lunch_start_time || "12:00";
    const lunchEnd = meEmployee.lunch_end_time || "12:30";
    if (clickedMins >= toMins(lunchStart) && clickedMins < toMins(lunchEnd)) return;
    const isAM = clickedMins < toMins(lunchStart);
    const breakType = isAM ? "AM_15_min" : "PM_15_min";
    if (isAM && amBreak) return;
    if (!isAM && pmBreak) return;
    const clickedTime = fromMins(clickedMins);
    const conflict = checkConflict(clickedTime, groupBreaks, meEmployee.email);
    setPopover({ time: clickedTime, type: breakType, conflict, pct: pct * 100 });
    setHover(null);
  };

  const handleMouseMove = (e) => {
    if (popover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const totalMins = toMins(meShiftEnd) - toMins(meShiftStart);
    const clickedMins = toMins(meShiftStart) + Math.round((pct * totalMins) / 15) * 15;
    setHover({ pct: pct * 100, time: fromMins(clickedMins) });
  };

  return (
    <div className="px-4 py-3">
      {/* Single bar */}
      <div className="relative" style={{ height: '18px' }}>

        {/* Base track */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
            cursor: meEmployee ? 'crosshair' : 'default',
          }}
          onClick={handleBarClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* My progress (purple) */}
          {meShift && (
            <div className="absolute top-0 h-full"
              style={{
                left: `${toPct(meShiftStart, globalStart, globalEnd)}%`,
                width: `${(progressPct / 100) * widthPct(meShiftStart, meShiftEnd, globalStart, globalEnd)}%`,
                background: 'linear-gradient(90deg, #7c3aed, #6d28d9)',
              }} />
          )}

          {/* My future shift (dim purple) */}
          {meShift && (
            <div className="absolute top-0 h-full"
              style={{
                left: `${toPct(meShiftStart, globalStart, globalEnd) + (progressPct / 100) * widthPct(meShiftStart, meShiftEnd, globalStart, globalEnd)}%`,
                width: `${((100 - progressPct) / 100) * widthPct(meShiftStart, meShiftEnd, globalStart, globalEnd)}%`,
                background: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)',
              }} />
          )}

          {/* Teammate bars (grey shades, offset vertically within the bar) */}
          {teammates.map((emp, i) => {
            const s = shifts.find(sh => sh.employee_email === emp.email);
            if (!s) return null;
            const color = TEAMMATE_COLORS[i % TEAMMATE_COLORS.length];
            return (
              <div key={emp.id} className="absolute pointer-events-none"
                style={{
                  left: `${toPct(s.start_time, globalStart, globalEnd)}%`,
                  width: `${widthPct(s.start_time, s.end_time, globalStart, globalEnd)}%`,
                  top: '30%',
                  height: '40%',
                  background: color,
                  borderRadius: '2px',
                }} />
            );
          })}

          {/* My lunch block */}
          {meShift && meEmployee?.lunch_start_time && (
            <div className="absolute top-0 h-full pointer-events-none"
              style={{
                left: `${toPct(meEmployee.lunch_start_time, globalStart, globalEnd)}%`,
                width: `${widthPct(meEmployee.lunch_start_time, meEmployee.lunch_end_time || "12:30", globalStart, globalEnd)}%`,
                background: 'rgba(245,158,11,0.6)',
              }} />
          )}

          {/* Teammate lunch blocks */}
          {teammates.map((emp) => {
            if (!emp.lunch_start_time) return null;
            const s = shifts.find(sh => sh.employee_email === emp.email);
            if (!s) return null;
            return (
              <div key={`lunch-${emp.id}`} className="absolute top-1 pointer-events-none"
                style={{
                  left: `${toPct(emp.lunch_start_time, globalStart, globalEnd)}%`,
                  width: `${widthPct(emp.lunch_start_time, emp.lunch_end_time || "12:30", globalStart, globalEnd)}%`,
                  height: '40%',
                  background: 'rgba(245,158,11,0.35)',
                  borderRadius: '2px',
                }} />
            );
          })}
        </div>

        {/* Break dots for all employees */}
        {breaks.filter(b => b.status !== "cancelled" && b.status !== "declined").map((brk) => {
          const emp = employeesWithShifts.find(e => e.email === brk.employee_email);
          const s = emp ? shifts.find(sh => sh.employee_email === emp.email) : null;
          if (!emp || !s) return null;
          const isMe = emp.email === currentUser?.email;
          const bTime = brk.requested_start_time || brk.actual_start_time;
          const pct = toPct(bTime, globalStart, globalEnd);
          const taken = brk.status === "taken";
          return (
            <div key={brk.id}
              className="absolute top-1/2 pointer-events-none"
              style={{
                left: `${pct}%`,
                transform: 'translate(-50%, -50%)',
                width: isMe ? '13px' : '9px',
                height: isMe ? '13px' : '9px',
                borderRadius: '50%',
                background: taken ? (isMe ? '#8B5CF6' : 'rgba(160,160,180,0.7)') : 'transparent',
                border: `2px solid ${isMe ? '#a78bfa' : 'rgba(160,160,180,0.6)'}`,
                boxShadow: taken && isMe ? '0 0 8px rgba(139,92,246,0.9)' : 'none',
                zIndex: 15,
              }} />
          );
        })}

        {/* Now needle (circle on the bar) */}
        {meShift && progressPct > 0 && progressPct < 100 && (
          <div className="absolute top-1/2 pointer-events-none"
            style={{
              left: `${toPct(meShiftStart, globalStart, globalEnd) + (progressPct / 100) * widthPct(meShiftStart, meShiftEnd, globalStart, globalEnd)}%`,
              transform: 'translate(-50%, -50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: isDark ? '#e9d5ff' : '#7c3aed',
              border: '2.5px solid white',
              boxShadow: '0 0 8px rgba(139,92,246,0.8)',
              zIndex: 25,
            }} />
        )}

        {/* Hover tooltip */}
        {hover && !popover && meEmployee && (
          <div className="absolute pointer-events-none z-30 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
            style={{
              left: `${hover.pct}%`,
              top: '-22px',
              transform: 'translateX(-50%)',
              background: isDark ? 'rgba(30,20,50,0.95)' : 'rgba(240,235,255,0.97)',
              color: '#a78bfa',
              border: '1px solid rgba(139,92,246,0.4)',
              whiteSpace: 'nowrap',
            }}>
            {formatTime(hover.time)}
          </div>
        )}

        {/* Popover */}
        <AnimatePresence>
          {popover && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              className="absolute z-50 rounded-xl p-3 shadow-xl"
              style={{
                left: `${Math.min(85, Math.max(10, popover.pct))}%`,
                bottom: '26px',
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
                  {formatTime(popover.time)} – {formatTime(fromMins(toMins(popover.time) + 15))}
                </p>
              )}
              <div className="flex gap-1.5">
                {!popover.conflict && (
                  <button
                    onClick={() => {
                      createBreakMutation.mutate({
                        employee_email: meEmployee.email,
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

      {/* Time labels below */}
      <div className="flex justify-between mt-1">
        <span className="text-[9px]" style={{ color: colors.textTertiary }}>{formatTime(globalStart)}</span>
        <span className="text-[9px]" style={{ color: colors.textTertiary }}>{formatTime(globalEnd)}</span>
      </div>
    </div>
  );
}