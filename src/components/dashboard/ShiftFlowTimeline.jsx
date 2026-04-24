import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/ThemeProvider";
import { format, parseISO, addMinutes } from "date-fns";
import { Clock, Users, User, Zap, Settings, Coffee, AlertCircle, CheckCircle, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TODAY = format(new Date(), "yyyy-MM-dd");

// Convert "HH:MM" to minutes from midnight
function toMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Convert minutes from midnight back to "HH:MM"
function fromMins(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Position a time on the timeline as a percentage
function timeToPercent(time, shiftStart, shiftEnd) {
  const total = toMins(shiftEnd) - toMins(shiftStart);
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, ((toMins(time) - toMins(shiftStart)) / total) * 100));
}

function widthPercent(start, end, shiftStart, shiftEnd) {
  const total = toMins(shiftEnd) - toMins(shiftStart);
  if (total <= 0) return 0;
  return Math.max(0, ((toMins(end) - toMins(start)) / total) * 100);
}

// Check if a requested break time conflicts with existing breaks in the group (15-min buffer)
function checkConflict(requestedStart, existingBreaks, myEmail) {
  const reqMins = toMins(requestedStart);
  const reqEnd = reqMins + 15;

  for (const b of existingBreaks) {
    if (b.employee_email === myEmail) continue;
    if (b.status === "cancelled" || b.status === "declined") continue;
    const bStart = toMins(b.requested_start_time || b.actual_start_time);
    const bEnd = bStart + 15;
    // Buffer zone: 15 mins before and after
    const bufferStart = bStart - 15;
    const bufferEnd = bEnd + 15;
    if (reqMins < bufferEnd && reqEnd > bufferStart) return true;
  }
  return false;
}

// A single employee row on the timeline
function EmployeeTimeline({ employee, shift, breaks, groupBreaks, onRequestBreak, isDark, colors, currentTime }) {
  const [hoverTime, setHoverTime] = useState(null);
  const [showPopover, setShowPopover] = useState(null); // { x, time, type }

  if (!shift) return null;

  const shiftStart = shift.start_time || "08:00";
  const shiftEnd = shift.end_time || "17:00";
  const lunchStart = employee.lunch_start_time || "12:00";
  const lunchEnd = employee.lunch_end_time || "12:30";
  const nowMins = toMins(currentTime);
  const shiftStartMins = toMins(shiftStart);
  const shiftEndMins = toMins(shiftEnd);
  const progressPct = Math.max(0, Math.min(100, ((nowMins - shiftStartMins) / (shiftEndMins - shiftStartMins)) * 100));

  const amBreak = breaks.find(b => b.break_type === "AM_15_min" && b.status !== "cancelled");
  const pmBreak = breaks.find(b => b.break_type === "PM_15_min" && b.status !== "cancelled");

  // Generate 30-min tick marks
  const ticks = [];
  let t = Math.ceil(shiftStartMins / 30) * 30;
  while (t <= shiftEndMins) {
    ticks.push(fromMins(t));
    t += 30;
  }

  const handleTrackClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const totalMins = shiftEndMins - shiftStartMins;
    const clickedMins = shiftStartMins + Math.round((pct * totalMins) / 15) * 15;
    const clickedTime = fromMins(clickedMins);

    // Determine if AM or PM
    const isAM = clickedMins < toMins(lunchStart);
    const breakType = isAM ? "AM_15_min" : "PM_15_min";

    // Don't allow if break already taken
    if (isAM && amBreak) return;
    if (!isAM && pmBreak) return;

    // Don't allow in lunch window
    if (clickedMins >= toMins(lunchStart) && clickedMins < toMins(lunchEnd)) return;

    setShowPopover({ x: e.clientX - rect.left, time: clickedTime, type: breakType });
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const totalMins = shiftEndMins - shiftStartMins;
    const clickedMins = shiftStartMins + Math.round((pct * totalMins) / 15) * 15;
    setHoverTime(fromMins(clickedMins));
  };

  const confirmBreak = () => {
    if (!showPopover) return;
    const conflict = checkConflict(showPopover.time, groupBreaks, employee.email);
    onRequestBreak(employee.email, showPopover.type, showPopover.time, !conflict);
    setShowPopover(null);
  };

  const conflict = showPopover ? checkConflict(showPopover.time, groupBreaks, employee.email) : false;

  return (
    <div className="mb-5">
      {/* Employee info row */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: `linear-gradient(135deg, #7c3aed, #4c1d95)`, color: '#e9d5ff', boxShadow: '0 0 8px rgba(124,58,237,0.5)' }}>
          {employee.full_name?.charAt(0) || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: colors.text }}>{employee.full_name}</p>
          <p className="text-[10px] truncate" style={{ color: colors.textTertiary }}>{employee.position || "Agent"} · {formatTime(shiftStart)}–{formatTime(shiftEnd)}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {/* AM Break indicator */}
          <div className="flex items-center gap-1" title={amBreak ? `AM Break: ${formatTime(amBreak.requested_start_time || amBreak.actual_start_time)}` : "AM break not yet taken"}>
            {amBreak?.status === "taken" ? <CheckCircle className="w-3.5 h-3.5" style={{ color: '#10B981' }} /> :
             amBreak?.status === "reserved" || amBreak?.status === "approved" ? <Circle className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} /> :
             <Circle className="w-3.5 h-3.5" style={{ color: colors.textTertiary }} />}
            <span className="text-[9px] font-semibold" style={{ color: colors.textTertiary }}>AM</span>
          </div>
          {/* PM Break indicator */}
          <div className="flex items-center gap-1" title={pmBreak ? `PM Break: ${formatTime(pmBreak.requested_start_time || pmBreak.actual_start_time)}` : "PM break not yet taken"}>
            {pmBreak?.status === "taken" ? <CheckCircle className="w-3.5 h-3.5" style={{ color: '#10B981' }} /> :
             pmBreak?.status === "reserved" || pmBreak?.status === "approved" ? <Circle className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} /> :
             <Circle className="w-3.5 h-3.5" style={{ color: colors.textTertiary }} />}
            <span className="text-[9px] font-semibold" style={{ color: colors.textTertiary }}>PM</span>
          </div>
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative" style={{ height: '32px' }}>
        {/* Background track */}
        <div
          className="absolute inset-0 rounded-lg cursor-crosshair"
          style={{
            background: isDark ? 'rgba(15,10,30,0.7)' : 'rgba(220,215,240,0.5)',
            border: `1px solid ${isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.15)'}`,
            boxShadow: isDark ? 'inset 0 1px 4px rgba(0,0,0,0.5)' : 'inset 0 1px 4px rgba(0,0,0,0.1)'
          }}
          onClick={handleTrackClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverTime(null)}
        />

        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-full rounded-lg pointer-events-none"
          style={{
            width: `${progressPct}%`,
            background: isDark
              ? 'linear-gradient(90deg, rgba(109,40,217,0.3), rgba(124,58,237,0.15))'
              : 'linear-gradient(90deg, rgba(109,40,217,0.15), rgba(124,58,237,0.05))',
            borderRight: progressPct > 0 && progressPct < 100 ? '2px solid rgba(167,139,250,0.6)' : 'none'
          }} />

        {/* Lunch block */}
        <div className="absolute top-1 bottom-1 rounded pointer-events-none"
          style={{
            left: `${timeToPercent(lunchStart, shiftStart, shiftEnd)}%`,
            width: `${widthPercent(lunchStart, lunchEnd, shiftStart, shiftEnd)}%`,
            background: isDark ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.2)',
            border: '1px solid rgba(245,158,11,0.5)',
            boxShadow: '0 0 6px rgba(245,158,11,0.3)'
          }} />

        {/* AM Break block */}
        {amBreak && (
          <div className="absolute top-1 bottom-1 rounded pointer-events-none"
            style={{
              left: `${timeToPercent(amBreak.requested_start_time || amBreak.actual_start_time, shiftStart, shiftEnd)}%`,
              width: `${widthPercent(amBreak.requested_start_time || amBreak.actual_start_time, fromMins(toMins(amBreak.requested_start_time || amBreak.actual_start_time) + 15), shiftStart, shiftEnd)}%`,
              background: amBreak.status === "taken" ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.25)',
              border: `1px solid ${amBreak.status === "taken" ? 'rgba(16,185,129,0.7)' : 'rgba(59,130,246,0.6)'}`,
              boxShadow: amBreak.status === "taken" ? '0 0 6px rgba(16,185,129,0.4)' : '0 0 6px rgba(59,130,246,0.3)'
            }} />
        )}

        {/* PM Break block */}
        {pmBreak && (
          <div className="absolute top-1 bottom-1 rounded pointer-events-none"
            style={{
              left: `${timeToPercent(pmBreak.requested_start_time || pmBreak.actual_start_time, shiftStart, shiftEnd)}%`,
              width: `${widthPercent(pmBreak.requested_start_time || pmBreak.actual_start_time, fromMins(toMins(pmBreak.requested_start_time || pmBreak.actual_start_time) + 15), shiftStart, shiftEnd)}%`,
              background: pmBreak.status === "taken" ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.25)',
              border: `1px solid ${pmBreak.status === "taken" ? 'rgba(16,185,129,0.7)' : 'rgba(59,130,246,0.6)'}`,
              boxShadow: pmBreak.status === "taken" ? '0 0 6px rgba(16,185,129,0.4)' : '0 0 6px rgba(59,130,246,0.3)'
            }} />
        )}

        {/* Current time needle */}
        {progressPct > 0 && progressPct < 100 && (
          <div className="absolute top-0 bottom-0 w-px pointer-events-none"
            style={{ left: `${progressPct}%`, background: 'rgba(167,139,250,0.9)', boxShadow: '0 0 4px rgba(167,139,250,0.8)' }} />
        )}

        {/* Tick marks */}
        {ticks.map((tick, i) => {
          const pct = timeToPercent(tick, shiftStart, shiftEnd);
          if (pct <= 1 || pct >= 99) return null;
          return (
            <div key={i} className="absolute top-0 pointer-events-none"
              style={{ left: `${pct}%`, width: '1px', height: '6px', background: isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)' }} />
          );
        })}

        {/* Hover time indicator */}
        {hoverTime && !showPopover && (
          <div className="absolute -top-5 pointer-events-none text-[9px] font-semibold px-1 rounded"
            style={{
              left: `${timeToPercent(hoverTime, shiftStart, shiftEnd)}%`,
              transform: 'translateX(-50%)',
              background: isDark ? 'rgba(30,20,50,0.9)' : 'rgba(240,235,255,0.95)',
              color: '#a78bfa',
              border: '1px solid rgba(124,58,237,0.3)'
            }}>
            {formatTime(hoverTime)}
          </div>
        )}

        {/* Popover for confirming break */}
        <AnimatePresence>
          {showPopover && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              className="absolute z-50 rounded-xl p-3 shadow-xl"
              style={{
                left: `${Math.min(80, Math.max(5, timeToPercent(showPopover.time, shiftStart, shiftEnd)))}%`,
                bottom: '40px',
                transform: 'translateX(-50%)',
                minWidth: '160px',
                background: isDark ? 'rgba(20,10,40,0.97)' : 'rgba(250,248,255,0.97)',
                border: `1px solid ${conflict ? 'rgba(239,68,68,0.5)' : 'rgba(124,58,237,0.4)'}`,
                boxShadow: conflict ? '0 0 16px rgba(239,68,68,0.3)' : '0 0 16px rgba(124,58,237,0.3)'
              }}
            >
              <p className="text-[10px] font-bold mb-1" style={{ color: conflict ? '#EF4444' : '#a78bfa' }}>
                {conflict ? '⚠ Conflict Detected' : `Reserve ${showPopover.type === 'AM_15_min' ? 'AM' : 'PM'} Break`}
              </p>
              <p className="text-[11px] mb-2" style={{ color: colors.text }}>
                {formatTime(showPopover.time)} – {formatTime(fromMins(toMins(showPopover.time) + 15))}
              </p>
              {conflict && <p className="text-[9px] mb-2" style={{ color: '#EF4444' }}>Another break is too close. Pick a different time.</p>}
              <div className="flex gap-2">
                {!conflict && (
                  <button onClick={confirmBreak} className="flex-1 text-[10px] font-bold py-1 rounded-lg border-0"
                    style={{ background: 'rgba(124,58,237,0.8)', color: '#fff' }}>
                    Reserve
                  </button>
                )}
                <button onClick={() => setShowPopover(null)} className="flex-1 text-[10px] font-bold py-1 rounded-lg border-0"
                  style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: colors.textSecondary }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Time axis labels below */}
      <div className="relative h-4 mt-0.5 pointer-events-none">
        {ticks.filter((_, i) => i % 2 === 0).map((tick, i) => {
          const pct = timeToPercent(tick, shiftStart, shiftEnd);
          if (pct <= 2 || pct >= 98) return null;
          return (
            <span key={i} className="absolute text-[8px]"
              style={{ left: `${pct}%`, transform: 'translateX(-50%)', color: colors.textTertiary }}>
              {formatTime(tick)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function ShiftFlowTimeline() {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState("team"); // "team" | "mine"
  const [currentTime, setCurrentTime] = useState(format(new Date(), "HH:mm"));

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(format(new Date(), "HH:mm")), 60000);
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
    mutationFn: (breakData) => base44.entities.EmployeeBreak.create(breakData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-breaks-today"] }),
  });

  const handleRequestBreak = (employeeEmail, breakType, requestedTime, isApproved) => {
    const bufferStart = fromMins(toMins(requestedTime) - 15);
    const bufferEnd = fromMins(toMins(requestedTime) + 30);
    createBreakMutation.mutate({
      employee_email: employeeEmail,
      break_date: TODAY,
      break_type: breakType,
      requested_start_time: requestedTime,
      status: isApproved ? "reserved" : "declined",
      buffer_start: bufferStart,
      buffer_end: bufferEnd,
    });
  };

  // Filter employees with shifts today
  const employeesWithShifts = useMemo(() => {
    return employees.filter(emp => shifts.some(s => s.employee_email === emp.email));
  }, [employees, shifts]);

  const displayEmployees = viewMode === "mine"
    ? employeesWithShifts.filter(e => e.email === currentUser?.email)
    : employeesWithShifts;

  // Cyberpunk panel style
  const panelStyle = {
    background: isDark
      ? 'linear-gradient(135deg, rgba(15,10,30,0.95) 0%, rgba(20,12,40,0.95) 100%)'
      : 'linear-gradient(135deg, rgba(245,242,255,0.97) 0%, rgba(235,230,255,0.97) 100%)',
    border: `1px solid ${isDark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.18)'}`,
    boxShadow: isDark
      ? '0 0 30px rgba(109,40,217,0.15), 12px 12px 24px rgba(0,0,0,0.5), -4px -4px 12px rgba(255,255,255,0.02)'
      : '10px 10px 20px rgba(180,170,220,0.4), -6px -6px 14px rgba(255,255,255,0.8)',
    borderRadius: '16px',
  };

  return (
    <div style={panelStyle} className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', boxShadow: '0 0 10px rgba(124,58,237,0.5)' }}>
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: isDark ? '#e9d5ff' : '#4c1d95' }}>ShiftFlow Timeline</h3>
            <p className="text-[10px]" style={{ color: colors.textTertiary }}>{format(new Date(), "EEEE, MMMM d")} · {formatTime(currentTime)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)'}` }}>
            {["mine", "team"].map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className="text-[10px] font-bold px-3 py-1.5 border-0 capitalize"
                style={{
                  background: viewMode === v
                    ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                    : 'transparent',
                  color: viewMode === v ? '#fff' : colors.textSecondary,
                }}>
                {v === "mine" ? <><User className="w-3 h-3 inline mr-1" />Mine</> : <><Users className="w-3 h-3 inline mr-1" />Team</>}
              </button>
            ))}
          </div>

          {/* Admin: Optimize */}
          {currentUser?.role === "admin" && (
            <button className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg border-0"
              style={{ background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
              title="Auto-stagger all breaks within groups">
              <Zap className="w-3 h-3" /> Optimize
            </button>
          )}
          {currentUser?.role === "admin" && (
            <button className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg border-0"
              style={{ background: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.08)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
              <Settings className="w-3 h-3" /> Groups
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {[
          { color: 'rgba(245,158,11,0.6)', label: 'Lunch', border: 'rgba(245,158,11,0.8)' },
          { color: 'rgba(16,185,129,0.35)', label: 'Break Taken', border: 'rgba(16,185,129,0.7)' },
          { color: 'rgba(59,130,246,0.3)', label: 'Reserved', border: 'rgba(59,130,246,0.6)' },
          { color: 'rgba(109,40,217,0.2)', label: 'Progress', border: 'rgba(167,139,250,0.5)' },
        ].map(({ color, label, border }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-5 h-3 rounded-sm" style={{ background: color, border: `1px solid ${border}` }} />
            <span className="text-[9px] font-semibold" style={{ color: colors.textTertiary }}>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-px h-3" style={{ background: 'rgba(167,139,250,0.9)', boxShadow: '0 0 3px rgba(167,139,250,0.8)' }} />
          <span className="text-[9px] font-semibold" style={{ color: colors.textTertiary }}>Now</span>
        </div>
      </div>

      {/* Hint */}
      <div className="mb-3 px-3 py-1.5 rounded-lg" style={{ background: isDark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.05)', border: `1px solid ${isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)'}` }}>
        <p className="text-[9px]" style={{ color: colors.textTertiary }}>
          <Coffee className="w-3 h-3 inline mr-1" />
          Click on any timeline to reserve a 15-min break. Slots with a 15-min buffer around existing breaks are blocked.
        </p>
      </div>

      {/* Timeline rows */}
      {displayEmployees.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: colors.textSecondary }}>No shifts scheduled for today.</p>
        </div>
      ) : (
        displayEmployees.map(emp => {
          const shift = shifts.find(s => s.employee_email === emp.email);
          const empBreaks = breaks.filter(b => b.employee_email === emp.email);
          // For conflict checking: breaks from same group
          const empGroup = emp.break_group_id ? breakGroups.find(g => g.id === emp.break_group_id) : null;
          const groupBreaks = empGroup
            ? breaks.filter(b => empGroup.member_emails?.includes(b.employee_email))
            : breaks; // fallback: compare against all

          return (
            <EmployeeTimeline
              key={emp.id}
              employee={emp}
              shift={shift}
              breaks={empBreaks}
              groupBreaks={groupBreaks}
              onRequestBreak={handleRequestBreak}
              isDark={isDark}
              colors={colors}
              currentTime={currentTime}
            />
          );
        })
      )}

      {/* Stats footer */}
      {displayEmployees.length > 0 && (
        <div className="flex items-center gap-4 pt-3 mt-1 border-t flex-wrap" style={{ borderColor: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)' }}>
          {[
            { label: "On Shift", value: displayEmployees.length, color: '#a78bfa' },
            { label: "Breaks Taken", value: breaks.filter(b => b.status === "taken").length, color: '#10B981' },
            { label: "Reserved", value: breaks.filter(b => b.status === "reserved").length, color: '#3B82F6' },
            { label: "Pending AM", value: displayEmployees.filter(e => !breaks.find(b => b.employee_email === e.email && b.break_type === "AM_15_min" && b.status !== "cancelled")).length, color: '#F59E0B' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-sm font-bold" style={{ color }}>{value}</span>
              <span className="text-[9px]" style={{ color: colors.textTertiary }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}