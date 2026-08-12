import React, { useRef, useState, useLayoutEffect } from "react";

// Wraps a wordmark (or any inline content) and scales it DOWN so it fits
// inside `maxWidth` without clipping. Measures the natural rendered width
// (via width:max-content) on mount + resize and applies a CSS transform
// only when the content is wider than the box — never scales up.
export default function FitWordmark({ maxWidth, children, style }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !maxWidth) return;
    const measure = () => {
      const natural = el.offsetWidth; // width:max-content → natural content width
      if (natural > maxWidth && natural > 0) {
        setScale(maxWidth / natural);
      } else if (scale !== 1) {
        setScale(1);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

  return (
    <div
      ref={ref}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "max-content",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}