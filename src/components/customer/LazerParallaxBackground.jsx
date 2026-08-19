import React, { useState, useEffect, useRef } from "react";

// Fixed full-viewport background for Lazer client profiles: the red Lazer mark
// floating in a WHITE void. The mark sits ~1/3 of the viewport, slightly below
// center at rest, and only drifts up/down with scroll — no zoom, no size change,
// only a barely-there constant blur.
//
// The supplied mark asset has a solid black background, which would show as a
// black square on a white void. An inline SVG feColorMatrix keys the black out
// (alpha = R+G+B - threshold) so only the red mark remains.
//
// Scroll is tracked from the app's main scroll container (Layout's <main>).
export default function LazerParallaxBackground({ markUrl }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const scroller = document.querySelector("main");
    if (!scroller) return;

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const max = Math.max(scroller.scrollHeight - scroller.clientHeight, 1);
        setProgress(Math.min(scroller.scrollTop / max, 1));
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Up/down parallax only: rest 6vh below center → full scroll 6vh above center.
  const ty = 6 - progress * 12;
  // Barely-there constant blur — the image is already soft/distant.
  const blur = 2;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "#ffffff",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* SVG chroma-key: black bg → transparent, red mark stays. */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter id="lazer-mark-key">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 1 1 0 -0.15"
          />
        </filter>
      </svg>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "34vw",
          height: "34vw",
          transform: `translate(-50%, calc(-50% + ${ty}vh))`,
          transition: "transform 0.12s ease-out",
          backgroundImage: `url(${markUrl})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: `url(#lazer-mark-key) blur(${blur}px)`,
          opacity: 0.95,
        }}
      />
    </div>
  );
}