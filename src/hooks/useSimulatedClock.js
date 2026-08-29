import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────
// Shared simulated clock — drives the call timeline AND the
// call queue so they stay in sync. Loops 8am→6pm at 2 sim-min
// per real second (full 10-hour day ≈ 5 minutes), repeating daily.
// Both AgentCallTimeline and CallQueuePanel subscribe to the
// SAME singleton so a call "arriving" on the timeline instantly
// shifts the queue.
// ─────────────────────────────────────────────────────────────

export const CLOCK_START_MIN = 8 * 60;   // 480  (8:00 AM)
export const CLOCK_END_MIN   = 18 * 60;  // 1080 (6:00 PM)
export const CLOCK_SPAN      = CLOCK_END_MIN - CLOCK_START_MIN; // 600

const TICK_MS = 200;
const SIM_MIN_PER_REAL_SEC = 2; // 2 simulated minutes per real second

// Start at real time if inside business hours, else 10:00 AM so the
// demo always has content (mid-morning — calls already on the board).
function getInitialNow() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins >= CLOCK_START_MIN && mins < CLOCK_END_MIN) return mins;
  return 10 * 60; // 10:00 AM
}

let nowMins = getInitialNow();
let cycle = 0;
const listeners = new Set();

let intervalId = null;
function ensureRunning() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    nowMins += SIM_MIN_PER_REAL_SEC * (TICK_MS / 1000);
    if (nowMins >= CLOCK_END_MIN) {
      nowMins = CLOCK_START_MIN;
      cycle++;
    }
    listeners.forEach((fn) => fn(nowMins, cycle));
  }, TICK_MS);
}
ensureRunning();

export function useSimulatedClock() {
  const [state, setState] = useState({ nowMins, cycle });
  useEffect(() => {
    const fn = (m, c) => setState({ nowMins: m, cycle: c });
    listeners.add(fn);
    setState({ nowMins, cycle }); // sync immediately
    return () => { listeners.delete(fn); };
  }, []);
  return state;
}

// Convert sim minutes → timeline percentage (0-100 across the 8am-6pm span)
export function simMinsToPct(mins) {
  return Math.max(0, Math.min(100, ((mins - CLOCK_START_MIN) / CLOCK_SPAN) * 100));
}