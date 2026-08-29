import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────
// Shared simulated clock — drives the call timeline AND the
// call queue so they stay in sync. Runs at REAL speed (1 real
// second = 1 second of clock time), starting at the actual current
// time. Loops 8am→6pm so the demo resets overnight.
// Both AgentCallTimeline and CallQueuePanel subscribe to the
// SAME singleton so a call "arriving" on the timeline instantly
// shifts the queue.
// ─────────────────────────────────────────────────────────────

export const CLOCK_START_MIN = 8 * 60;   // 480  (8:00 AM)
export const CLOCK_END_MIN   = 18 * 60;  // 1080 (6:00 PM)
export const CLOCK_SPAN      = CLOCK_END_MIN - CLOCK_START_MIN; // 600

const TICK_MS = 1000; // tick every real second

// Always start at the actual current time so the displayed clock
// matches reality. The now-line only renders within 8am–6pm.
function getInitialNow() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

let nowMins = getInitialNow();
let cycle = 0;
const listeners = new Set();

let intervalId = null;
function ensureRunning() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    // Advance at real speed: 1 tick = 1 real second = 1/60 minute
    nowMins += TICK_MS / 60000;
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