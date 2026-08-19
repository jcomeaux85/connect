import React, { useState, useEffect, useRef } from "react";

// Fixed full-viewport background for Lazer client profiles: the red Lazer mark
// floating in a black void. The mark sits ~1/3 of the viewport, slightly below
// center at rest with a gentle distance blur, then rises toward the top and
// zooms + blurs further as the page scrolls.
//
// Scroll is tracked from the app's main scroll container (Layout's <main>),
// not the window — the Customer page scrolls inside that element.
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

  // Rest: 6vh below center. Full scroll: 6vh above center.
  const ty = 6 - progress * 12;
  const scale = 1 + progress * 0.55;
  const blur = 6 + progress * 14;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "#050505",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "34vw",
          height: "34vw",
          transform: `translate(-50%, calc(-50% + ${ty}vh)) scale(${scale})`,
          transition: "transform 0.12s ease-out, filter 0.12s ease-out",
          backgroundImage: `url(${markUrl})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: `blur(${blur}px)`,
          opacity: 0.9,
        }}
      />
    </div>
  );
}