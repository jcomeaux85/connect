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
  const h = Math.floor(Math.max(0, m) / 60);
  const min = Math.max(0, m) % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
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
  const reqEnd = reqMins + 15;
  for (const b of existingBreaks) {
    if (b.employee_email === myEmail) continue;
    if (b.status === "cancelled" || b.status === "declined") continue;
    const bStart = toMins(b.requested_start_time || b.actual_start_time);
    const bEnd = bStart + 15;
    if (reqMins < bEnd + 15 && reqEnd > bStart - 15) return true;
  }
  return false;
}

// Single employee bar
function EmployeeBar({ employee, shift, breaks, groupBreaks, onRequestBreak, isDark, colors, nowMins }) {
  const [hover, setHover] = useState(null); // { pct, time, type }
  const [popover, setPopover] = useState(null);

  if (!shift) return null;

  const shiftStart = shift.start_time || "08:00";
  const shiftEnd = shift.end_time || "17:00";
  const lunchStart = employee.lunch_start_time || "12:00";
  const lunchEnd = employee.lunch_end_time || "12:30";

  const shiftStartMins = toMins(shiftStart);
  const shiftEndMins = toMins(shiftEnd);
  const progressPct = Math.max(0, Math.min(100, ((nowMins - shiftStartMins) / (shiftEndMins - shiftStartMins)) * 100));

  const amBreak = breaks.find(b => b.break_type === "AM_15_min" && b.status !== "cancelled" && b.status !== "declined");
  const pmBreak = breaks.find(b => b.break_type === "PM_15_min" && b.status !== "cancelled" && b.status !== "declined");

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const clickedMins = shiftStartMins + Math.round((pct * (shiftEndMins - shiftStartMins)) / 15) * 15;
    const clickedTime = fromMins(clickedMins);
    const isAM = clickedMins < toMins(lunchStart);
    const breakType = isAM ? "AM_15_min" : "PM_15_min";
    if (isAM && amBreak) return;
    if (!isAM && pmBreak) return;
    if (clickedMins >= toMins(lunchStart) && clickedMins < toMins(lunchEnd)) return;
    const conflict = checkConflict(clickedTime, groupBreaks, employee.email);
    setPopover({ time: clickedTime, type: breakType, conflict, pct: pct * 100 });
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const clickedMins = shiftStartMins + Math.round((pct * (shiftEndMins - shiftStartMins)) / 15) * 15;
    setHover({ pct: pct * 100, time: fromMins(clickedMins) });
  };

  // Dot color/style
  const dotStyle = (brk) => {
    if (!brk) return null;
    const taken = brk.status === "taken";
    const pct = toPct(brk.requested_start_time || brk.actual_start_time, shiftStart, shiftEnd);
    return { pct, taken, status: brk.status };
  };

  const amDot = amBreak ? dotStyle(amBreak) : null;
  const pmDot = pmBreak ? dotStyle(pmBreak) : null;

  return (
    <div className="flex items-center gap-2 group" style={{ minHeight: '28px' }}>
      {/* Name */}
      <div className="flex-shrink-0 text-right" style={{ width: '90px' }}>
        <span className="text-[10px] font-semibold truncate block" style={{ color: colors.textSecondary }}>
          {employee.full_name?.split(' ')[0]}
        </span>
      </div>

      {/* Bar */}
      <div className="flex-1 relative" style={{ height: '12px' }}>
        {/* Track */}
        <div
          className="absolute inset-0 rounded-full cursor-crosshair"
          style={{
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
          }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
        />

        {/* Progress fill */}
        <div className="absolute top-0 left-0 h-full rounded-full pointer-events-none"
          style={{
            width: `${progressPct}%`,
            background: isDark
              ? 'linear-gradient(90deg, #10B981, #059669)'
              : 'linear-gradient(90deg, #10B981, #059669)',
          }} />

        {/* Future track (grey) */}
        <div className="absolute top-0 h-full rounded-full pointer-events-none"
          style={{
            left: `${progressPct}%`,
            right: 0,
            background: isDark ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.2)',
          }} />

        {/* Lunch block */}
        <div className="absolute top-0 h-full pointer-events-none"
          style={{
            left: `${toPct(lunchStart, shiftStart, shiftEnd)}%`,
            width: `${widthPct(lunchStart, lunchEnd, shiftStart, shiftEnd)}%`,
            background: isDark ? 'rgba(245,158,11,0.55)' : 'rgba(245,158,11,0.5)',
            borderRadius: '3px',
          }} />

        {/* AM Break dot */}
        {amDot && (
          <div className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${amDot.pct}%`,
              transform: 'translate(-50%, -50%)',
              width: amDot.taken ? '10px' : '10px',
              height: amDot.taken ? '10px' : '10px',
              borderRadius: '50%',
              background: amDot.taken ? '#8B5CF6' : 'transparent',
              border: amDot.taken ? '2px solid #a78bfa' : '2px solid #8B5CF6',
              boxShadow: amDot.taken ? '0 0 6px rgba(139,92,246,0.8)' : 'none',
              zIndex: 10,
            }} />
        )}

        {/* PM Break dot */}
        {pmDot && (
          <div className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${pmDot.pct}%`,
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: pmDot.taken ? '#8B5CF6' : 'transparent',
              border: pmDot.taken ? '2px solid #a78bfa' : '2px solid #8B5CF6',
              boxShadow: pmDot.taken ? '0 0 6px rgba(139,92,246,0.8)' : 'none',
              zIndex: 10,
            }} />
        )}

        {/* Now needle */}
        {progressPct > 0 && progressPct < 100 && (
          <div className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${progressPct}%`,
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: isDark ? '#e9d5ff' : '#7c3aed',
              border: '2px solid white',
              boxShadow: '0 0 6px rgba(139,92,246,0.7)',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
            }} />
        )}

        {/* Hover tooltip */}
        {hover && !popover && (
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
                bottom: '20px',
                transform: 'translateX(-50%)',
                minWidth: '150px',
                background: isDark ? 'rgba(18,10,36,0.98)' : 'rgba(250,248,255,0.98)',
                border: `1px solid ${popover.conflict ? 'rgba(239,68,68,0.5)' : 'rgba(139,92,246,0.5)'}`,
                boxShadow: popover.conflict ? '0 4px 20px rgba(239,68,68,0.25)' : '0 4px 20px rgba(139,92,246,0.25)',
              }}
            >
              <p className="text-[10px] font-bold mb-1" style={{ color: popover.conflict ? '#EF4444' : '#a78bfa' }}>
                {popover.conflict ? '⚠ Too close to another break' : `Reserve ${popover.type === 'AM_15_min' ? 'AM' : 'PM'} Break`}
              </p>
              {!popover.conflict && (
                <p className="text-[11px] mb-2" style={{ color: colors.text }}>
                  {formatTime(popover.time)} – {formatTime(fromMins(toMins(popover.time) + 15))}
                </p>
              )}
              <div className="flex gap-1.5">
                {!popover.conflict && (
                  <button
                    onClick={() => { onRequestBreak(employee.email, popover.type, popover.time, true); setPopover(null); }}
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

      {/* Time labels */}
      <div className="flex-shrink-0 flex gap-1 text-[9px]" style={{ color: colors.textTertiary, width: '80px' }}>
        <span>{formatTime(shiftStart)}</span>
        <span>–</span>
        <span>{formatTime(shiftEnd)}</span>
      </div>
    </div>
  );
}

export default function ShiftFlowTimeline() {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [nowMins, setNowMins] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

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

  const createBreakMutation = useMutation({
    mutationFn: (d) => base44.entities.EmployeeBreak.create(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-breaks-today"] }),
  });

  const handleRequestBreak = (email, type, time) => {
    createBreakMutation.mutate({
      employee_email: email,
      break_date: TODAY,
      break_type: type,
      requested_start_time: time,
      status: "reserved",
      buffer_start: fromMins(toMins(time) - 15),
      buffer_end: fromMins(toMins(time) + 30),
    });
  };

  const employeesWithShifts = useMemo(() =>
    employees.filter(emp => shifts.some(s => s.employee_email === emp.email)),
    [employees, shifts]
  );

  if (employeesWithShifts.length === 0) return null;

  return (
    <div className="px-2 py-3 space-y-2.5">
      {employeesWithShifts.map(emp => {
        const shift = shifts.find(s => s.employee_email === emp.email);
        const empBreaks = breaks.filter(b => b.employee_email === emp.email);
        const empGroup = emp.break_group_id ? breakGroups.find(g => g.id === emp.break_group_id) : null;
        const groupBreaks = empGroup
          ? breaks.filter(b => empGroup.member_emails?.includes(b.employee_email))
          : breaks;

        return (
          <EmployeeBar
            key={emp.id}
            employee={emp}
            shift={shift}
            breaks={empBreaks}
            groupBreaks={groupBreaks}
            onRequestBreak={handleRequestBreak}
            isDark={isDark}
            colors={colors}
            nowMins={nowMins}
          />
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1 flex-wrap">
        {[
          { type: 'bar', color: '#10B981', label: 'Elapsed' },
          { type: 'bar', color: 'rgba(245,158,11,0.55)', label: 'Lunch' },
          { type: 'dot-filled', color: '#8B5CF6', label: 'Break taken' },
          { type: 'dot-hollow', color: '#8B5CF6', label: 'Reserved' },
          { type: 'circle', color: isDark ? '#e9d5ff' : '#7c3aed', label: 'Now' },
        ].map(({ type, color, label }) => (
          <div key={label} className="flex items-center gap-1">
            {type === 'bar' && <div className="w-5 h-2 rounded-full" style={{ background: color }} />}
            {type === 'dot-filled' && <div className="w-3 h-3 rounded-full" style={{ background: color, border: '2px solid #a78bfa' }} />}
            {type === 'dot-hollow' && <div className="w-3 h-3 rounded-full" style={{ background: 'transparent', border: `2px solid ${color}` }} />}
            {type === 'circle' && <div className="w-3 h-3 rounded-full" style={{ background: color, border: '2px solid white', boxShadow: '0 0 4px rgba(139,92,246,0.6)' }} />}
            <span className="text-[9px]" style={{ color: colors.textTertiary }}>{label}</span>
          </div>
        ))}
        <span className="text-[9px] ml-auto" style={{ color: colors.textTertiary }}>Click bar to reserve a break</span>
      </div>
    </div>
  );
}