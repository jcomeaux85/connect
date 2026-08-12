import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { corpsData } from '@/api/corpsData';
import { computeLivePay, computeEarningsRate } from '@/services/core/livePayEngine';

// EarningsClock — a real-time "earnings clock" (like the national debt clock)
// that ticks forward by the penny as hours are worked. Shows net accumulation
// for the current shift plus a per-second rate. Styled in the CORPS green
// neumorphic accent.
//
// Self-contained & reusable: fetches its own employee profile + paystubs
// (react-query dedupes by key, so no duplicate network calls when a parent
// already fetched the same data). Designed to be lifted into a B|c widget.
//
// Accessibility: role="timer" with an aria-label that refreshes on a slow
// cadence so screen readers aren't spammed by the sub-second visual ticks.
export default function EarningsClock({ isClockedIn, clockInTime, entries = [], userEmail }) {
  const [earnings, setEarnings] = useState(0);
  const [ariaValue, setAriaValue] = useState('$0.00');
  const rafRef = useRef(null);
  const lastCentRef = useRef(-1);

  const { data: employee } = useQuery({
    queryKey: ['core-employee', userEmail],
    queryFn: async () => {
      const results = await corpsData.CoreEmployee.filter({ email: userEmail });
      return results[0] || null;
    },
    enabled: !!userEmail,
  });

  const { data: paystubs = [] } = useQuery({
    queryKey: ['core-paystubs-live', userEmail],
    queryFn: () => corpsData.CorePaystub.filter({ employee_email: userEmail }, '-pay_date', 26),
    enabled: !!userEmail,
  });

  const live = computeLivePay({ entries, employee, paystubs });
  const { grossPerSec, netPerSec } = computeEarningsRate(live);

  // Smooth ticking via rAF, gated on cent changes so we only re-render when
  // the displayed value actually moves (~6 renders/sec at typical rates).
  useEffect(() => {
    if (!isClockedIn || !clockInTime) {
      setEarnings(0);
      lastCentRef.current = -1;
      return;
    }
    const start = new Date(clockInTime).getTime();
    const tick = () => {
      const seconds = (Date.now() - start) / 1000;
      const newEarnings = seconds * netPerSec;
      const newCent = Math.floor(newEarnings * 100);
      if (newCent !== lastCentRef.current) {
        lastCentRef.current = newCent;
        setEarnings(newEarnings);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isClockedIn, clockInTime, netPerSec]);

  // Slow aria refresh so screen readers announce the clock without spam.
  useEffect(() => {
    if (!isClockedIn) {
      setAriaValue('$0.00');
      return;
    }
    const id = setInterval(() => {
      setAriaValue(`$${earnings.toFixed(2)} earned this shift`);
    }, 5000);
    return () => clearInterval(id);
  }, [isClockedIn, earnings]);

  const dollars = Math.floor(earnings).toLocaleString();
  const cents = Math.floor((earnings % 1) * 100).toString().padStart(2, '0');
  const ratePerSec = netPerSec;
  const ratePerMin = netPerSec * 60;

  return (
    <div
      role="timer"
      aria-label={ariaValue}
      aria-live="off"
      className="rounded-xl p-4 mt-4"
      style={{
        background: 'var(--neu-bg, #e8e8ee)',
        boxShadow: 'inset 4px 4px 8px #c5c5cf, inset -4px -4px 8px #ffffff',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              background: '#22C55E',
              boxShadow: '0 0 6px rgba(34,197,94,0.8)',
              animation: isClockedIn ? 'pulse-green 1.2s ease-in-out infinite' : 'none',
              opacity: isClockedIn ? 1 : 0.3,
            }}
          />
          {isClockedIn ? 'EARNED THIS SHIFT' : 'READY TO EARN'}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#16A34A' }}>
          {isClockedIn ? 'LIVE' : 'STANDBY'}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-400">$</span>
        <span
          className="text-4xl font-bold tabular-nums tracking-tight"
          style={{ color: '#1f2937', fontVariantNumeric: 'tabular-nums' }}
        >
          {dollars}
        </span>
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: '#22C55E', fontVariantNumeric: 'tabular-nums' }}
        >
          .{cents}
        </span>
      </div>

      <div className="flex items-center justify-between mt-2 text-[11px]">
        <span className="text-gray-400">
          {isClockedIn
            ? `Ticking at $${ratePerSec.toFixed(4)}/sec`
            : `Will earn $${ratePerSec.toFixed(4)}/sec when clocked in`}
        </span>
        <span className="font-semibold" style={{ color: '#16A34A' }}>
          ${ratePerMin.toFixed(2)}/min
        </span>
      </div>
    </div>
  );
}