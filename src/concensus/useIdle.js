// Concensus — fires `isIdle` true after `delay` ms of no user interaction.
// Resets on mouse / keyboard / scroll / touch activity.
import { useEffect, useRef, useState } from "react";

export function useIdle(delay = 5000, enabled = true) {
  const [isIdle, setIsIdle] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setIsIdle(false);
      if (timer.current) clearTimeout(timer.current);
      return;
    }

    const reset = () => {
      setIsIdle(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setIsIdle(true), delay);
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [delay, enabled]);

  return isIdle;
}