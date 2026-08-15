// AleraLauncher — "ALERA | one" trigger + vertical glass column slide-out.
//
// Interaction:
//  • Hover the ALERA | one text → a glassmorphism column slides out from
//    under the sidebar's right edge, logos dropping in top-to-bottom in
//    succession over ~1s with a soft start/landing ease.
//  • The column spans nearly the full height of the sidebar (small
//    head/foot insets) and sits flush against the sidebar's right edge.
//  • Hovering one icon scales it up + greys/fades the others; de-hovering
//    an icon restores all (while the mouse stays on the column).
//  • De-hovering the column retracts everything.
//
// No brightwash / no full-screen overlay — just the glass column.
//
// Sizing: every logo tile is a uniform box `logoW × tileH`. `logoW` is the
// single adaptive variable (shrinks only on short screens so all tiles
// still fit the column height). Each wordmark's font size is a % of
// `logoW`, tuned so it fits inside the box — nothing overflows left behind
// the sidebar. The hover increase is a % scale (HOVER_SCALE), not a fixed
// px bump, so growth stays proportional to the uniform width.

import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FitWordmark from "@/components/navigation/FitWordmark";

const DURATION = 0.935;
const SOFT_EASE = [0.25, 0.1, 0.25, 1];
const EASE_CSS = "cubic-bezier(0.25, 0.1, 0.25, 1)";
const MAX_LOGO_W = 168;        // uniform tile width (px) — every logo fits this box
const LOGO_H_RATIO = 0.5;      // tile height = logoW * LOGO_H_RATIO
const HOVER_SCALE = 1.12;      // hover increase — % of width, not a fixed px
const SLIDE_OFFSET = 0; // flush against the sidebar's right edge — no gap
const HEAD_INSET = 16; // px from viewport top — almost reaching sidebar head
const FOOT_INSET = 16; // px from viewport bottom — almost reaching sidebar foot

// Blue outline + cyan glow matching the HangingNav (Cases/Tasks/etc) style.
const GLOW_REST = "0 0 1px rgba(255,255,255,0.3)";
const GLOW_FULL =
  "-0.5px -0.5px 0 #2563eb, 0.5px -0.5px 0 #2563eb, -0.5px 0.5px 0 #2563eb, 0.5px 0.5px 0 #2563eb, 0 0 20px #00d4ff";

// ── App tiles (starting with DOC + CORPS; more logos to come) ──
const DOC_ICON =
  "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/158bf0016_doc_teams_icon_192b.png";

const EXTERNAL_HREF = "https://ndrndr.com/alera";

// "by ALERAGROUP" subtext — styled to match each logo's accent color.
const aleraSub = (size, accent, { font = "'Inter', sans-serif", weight = 600 } = {}) => (
  <span
    style={{
      fontFamily: font,
      fontWeight: weight,
      fontSize: size * 0.07,
      color: "rgba(255,255,255,0.32)",
      letterSpacing: "0.10em",
      whiteSpace: "nowrap",
      marginTop: "4px",
      lineHeight: 1,
    }}
  >
    by <span style={{ color: accent, letterSpacing: "0.10em" }}>ALERAGROUP</span>
  </span>
);

const APPS = [
  {
    id: "benconnect",
    label: "BEN|connect",
    href: "https://benconnect.ndrndr.com/Core",
    renderIcon: (size) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, pointerEvents: "none" }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: size * 0.15, color: "#ffffff", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
          BEN<span style={{ color: "#a855f7" }}>|</span>connect
        </span>
        {aleraSub(size, "#a855f7")}
      </div>
    ),
  },
  {
    id: "corps",
    label: "CORPS//",
    renderIcon: (size) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: size * 0.015 }}>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: size * 0.32,
              color: "#f1f5f9",
              letterSpacing: "0.10em",
              whiteSpace: "nowrap",
              textShadow: "0 1px 0 rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.65)",
            }}
          >
            CORPS
          </span>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: size * 0.32,
              color: "#22C55E",
              letterSpacing: "0.02em",
              textShadow: "0 0 10px rgba(34,197,94,0.55), 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            //
          </span>
        </div>
        {aleraSub(size, "#22C55E", { font: "'Barlow Condensed', sans-serif", weight: 600 })}
      </div>
    ),
  },
  {
    id: "doc",
    label: "DOC",
    renderIcon: (size) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, pointerEvents: "none" }}>
        <img src={DOC_ICON} alt="DOC" style={{ width: size * 0.34, height: size * 0.34, objectFit: "contain", pointerEvents: "none" }} />
        {aleraSub(size, "#ef4444")}
      </div>
    ),
  },
  {
    id: "authlink",
    label: "Auth|Link",
    href: "https://authlink.ndrndr.com",
    renderIcon: (size) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, pointerEvents: "none" }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: size * 0.205, color: "#ffffff", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
          Auth<span style={{ color: "#00d4ff" }}>|</span>Link
        </span>
        {aleraSub(size, "#00d4ff")}
      </div>
    ),
  },
  {
    id: "hub",
    label: "HelpHub",
    href: "https://helphub.ndrndr.com",
    renderIcon: (size) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, pointerEvents: "none" }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: size * 0.24, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
          <span style={{ color: "#0078D7" }}>Help</span><span style={{ color: "#B3B3B3" }}>Hub</span>
        </span>
        {aleraSub(size, "#0078D7")}
      </div>
    ),
  },
  {
    id: "consilium",
    label: "Consilium",
    href: "https://consilium.ndrndr.com",
    renderIcon: (size) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, pointerEvents: "none" }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: size * 0.17, color: "#00E5FF", letterSpacing: "0.06em", textShadow: "0 0 10px rgba(0,229,255,0.5)", whiteSpace: "nowrap" }}>
          CONSILIUM
        </span>
        {aleraSub(size, "#00E5FF")}
      </div>
    ),
  },
  {
    id: "learn",
    label: "ALERA | learn",
    href: "https://learn.ndrndr.com",
    renderIcon: (size) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, pointerEvents: "none" }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: size * 0.32, color: "#555555", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
          LE<span style={{ color: "#40E0D0" }}>▼</span>RN
        </span>
        {aleraSub(size, "#40E0D0")}
      </div>
    ),
  },
];

// ── Hover previews: image + description shown in the dashboard area ──
const PREVIEWS = {
  doc: {
    title: "DOC",
    image:
      "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/5eeb7752f_DOCresultstoolong.png",
    description:
      "Dynamic Operations Console — a real-time client knowledge base with employer profiles, carrier maps, and instant benefit-plan lookups at your fingertips.",
  },
  corps: {
    title: "CORPS//",
    image:
      "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/d0826666c_Core.png",
    description:
      "RME of ONE — Centralized Operations & Resource Planning System. Workforce scheduling, attendance, payroll, and break coordination for the entire call-center floor.",
  },
  authlink: {
    title: "Auth|Link",
    image:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80",
    description:
      "Secure member identity verification — a 4-step wizard (data, video recital, ID capture, e-signature) with a specialist review console and automatic ID purging.",
  },
  consilium: {
    title: "CONSILIUM",
    image:
      "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/fc1907fb7_consilium.png",
    description:
      "Consilium — a collaborative consultation workspace for case strategy, team huddles, and cross-department decision tracking.",
  },
  learn: {
    title: "ALERA | learn",
    image:
      "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/73eb59cb0_learm.png",
    description:
      "ALERA | learn — on-demand training library with guided courses, certifications, and knowledge checks for new and tenured agents alike.",
  },
  hub: {
    title: "HelpHub",
    image:
      "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&q=80",
    description:
      "HelpHub — a self-serve support center with how-to articles, video walkthroughs, and direct escalation paths to the ALERA team.",
  },
  benconnect: {
    title: "BEN|connect",
    image:
      "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/c2cee6c0b_image.png",
    description:
      "BEN|connect — a unified call center platform combining phone, SMS, email, benefits tracking, HR management, and AI-assisted research in one high-performance workspace.",
  },
};

export default function AleraLauncher({ onToggleDoc }) {
  const navigate = useNavigate();
  const triggerRef = useRef(null);
  const closeTimer = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarRight, setSidebarRight] = useState(0);
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [hoveredY, setHoveredY] = useState(null); // vertical center of hovered logo button
  const previewRef = useRef(null);
  const [panelH, setPanelH] = useState(360); // measured real height of the preview pane

  // Measure the actual preview pane height so we can clamp it to the screen
  // edge instead of guessing (a wrong guess lets it spill off the bottom).
  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const measure = () => setPanelH(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hoveredIcon, isOpen]);

  // Uniform logo width adapts to viewport height so all tiles always fit
  // inside the glass column — width drives font size, so every logo scales
  // proportionally and none spill behind the sidebar.
  const [logoW, setLogoW] = useState(() => {
    if (typeof window === "undefined") return MAX_LOGO_W;
    const avail = window.innerHeight - HEAD_INSET - FOOT_INSET - 32;
    const gaps = (APPS.length - 1) * 8;
    const byH = Math.floor((avail - gaps) / (APPS.length * LOGO_H_RATIO));
    return Math.max(96, Math.min(MAX_LOGO_W, byH));
  });

  useEffect(() => {
    const onResize = () => {
      const avail = window.innerHeight - HEAD_INSET - FOOT_INSET - 32;
      const gaps = (APPS.length - 1) * 8;
      const byH = Math.floor((avail - gaps) / (APPS.length * LOGO_H_RATIO));
      setLogoW(Math.max(96, Math.min(MAX_LOGO_W, byH)));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const colWidth = logoW + 32;   // tile + 16px padding each side
  const tileH = Math.floor(logoW * LOGO_H_RATIO);

  // Tell the parent sidebar we're active so it stays pinned open while the
  // glass column is out — prevents the column from floating parentless.
  const setActive = useCallback((active) => {
    window.dispatchEvent(new CustomEvent('alera-launcher-active', { detail: { active } }));
  }, []);

  // Track the sidebar's right edge live so the column always sits flush
  // against it — never stale, never behind it (even mid-animation).
  useLayoutEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    let sidebar = el.parentElement;
    while (sidebar && sidebar.parentElement) {
      if (getComputedStyle(sidebar).position === "fixed") break;
      sidebar = sidebar.parentElement;
    }
    if (!sidebar) return;
    const measure = () => setSidebarRight(sidebar.getBoundingClientRect().right);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sidebar);
    return () => ro.disconnect();
  }, []);

  const open = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsOpen(true);
    setActive(true);
  }, [setActive]);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredIcon(null);
      setHoveredY(null);
      setActive(false);
    }, 200);
  }, [setActive]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  // Allow Escape to retract.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setHoveredIcon(null);
        setHoveredY(null);
        setActive(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => () => closeTimer.current && clearTimeout(closeTimer.current), []);

  const handleSelect = (app) => {
    setIsOpen(false);
    setHoveredIcon(null);
    setHoveredY(null);
    setActive(false);
    if (app.id === "doc") onToggleDoc?.();
    else if (app.id === "corps") navigate("/Core");
    else if (app.id === "authlink") navigate("/AuthLink");
    else if (app.href) window.open(app.href, "_blank", "noopener,noreferrer");
  };

  // Compute preview pane position when a logo is hovered.
  const previewData = (() => {
    if (!isOpen || !hoveredIcon || !PREVIEWS[hoveredIcon]) return null;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const center = hoveredY ?? vh / 2;
    const clampedTop = Math.max(10, Math.min(center - panelH / 2, vh - panelH - 10));
    return { clampedTop, ...PREVIEWS[hoveredIcon] };
  })();

  return (
    <>
      {/* ── Trigger: ALERA | one (glows like the top nav text) ── */}
      <div
        ref={triggerRef}
        onMouseEnter={open}
        onMouseLeave={scheduleClose}
        className="w-full flex items-center justify-center"
        style={{ padding: "6px 0", cursor: "pointer" }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(13px, 1.4vw, 16px)",
            letterSpacing: "0.1em",
            whiteSpace: "nowrap",
            color: isOpen ? "#ffffff" : "rgba(255,255,255,0.55)",
            textShadow: isOpen ? GLOW_FULL : GLOW_REST,
            transition: `text-shadow ${DURATION}s ${EASE_CSS}, color ${DURATION}s ${EASE_CSS}`,
          }}
        >
          ALERA{" "}
          <span style={{ opacity: 0.5, margin: "0 1px" }}>|</span>{" "}
          one
        </span>
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            /* ── Vertical glass column: slides out from under the sidebar ── */
            <motion.div
              initial={{ x: -colWidth - 12, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -colWidth - 12, opacity: 0 }}
              transition={{ duration: DURATION, ease: SOFT_EASE }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              style={{
                position: "fixed",
                left: `${sidebarRight + SLIDE_OFFSET}px`,
                top: `${HEAD_INSET}px`,
                bottom: `${FOOT_INSET}px`,
                width: `${colWidth}px`,
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-evenly",
                gap: "8px",
                padding: "16px",
                overflow: "hidden",
                borderRadius: "0 18px 18px 0",
                // Glassmorphism — translucent dark glass that blurs the site behind it
                background: "rgba(18, 20, 28, 0.38)",
                backdropFilter: "blur(20px) saturate(140%) brightness(1.02)",
                WebkitBackdropFilter: "blur(20px) saturate(140%) brightness(1.02)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderLeft: "none",
                boxShadow:
                  "8px 0 30px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {APPS.map((app, i) => {
                const isHovered = hoveredIcon === app.id;
                const isOther = hoveredIcon !== null && !isHovered;
                return (
                  <motion.button
                    key={app.id}
                    type="button"
                    initial={{ opacity: 0, y: -18, scale: 0.5 }}
                    animate={{
                      opacity: isOther ? 0.3 : 1,
                      y: 0,
                      scale: isHovered ? HOVER_SCALE : isOther ? 0.92 : 1,
                      filter: isOther ? "grayscale(1)" : "grayscale(0)",
                    }}
                    exit={{ opacity: 0, y: -18, scale: 0.5 }}
                    transition={{
                      opacity: { duration: 0.3, ease: "easeOut", delay: i * 0.07 },
                      y: { duration: DURATION, ease: SOFT_EASE, delay: i * 0.07 },
                      scale: { duration: 0.28, ease: "easeOut" },
                      filter: { duration: 0.28, ease: "easeOut" },
                    }}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setHoveredIcon(app.id);
                      setHoveredY(r.top + r.height / 2);
                    }}
                    onMouseLeave={() => { setHoveredIcon(null); setHoveredY(null); }}
                    onClick={() => handleSelect(app)}
                    title={app.label}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      width: `${logoW}px`,
                      height: `${tileH}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    <FitWordmark maxWidth={logoW - 6}>
                      {app.renderIcon(logoW)}
                    </FitWordmark>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Hover preview: image + description fades into the dashboard area ── */}
      {createPortal(
        <AnimatePresence>
          {previewData && (
            <motion.div
              key="preview-pane"
              ref={previewRef}
              initial={{ opacity: 0, x: -20, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.96 }}
              transition={{ duration: 0.45, ease: SOFT_EASE }}
              style={{
                position: "fixed",
                left: `${sidebarRight + colWidth + 18}px`,
                top: `${previewData.clampedTop}px`,
                zIndex: 49,
                pointerEvents: "none",
                width: "clamp(300px, 28vw, 400px)",
                borderRadius: "18px",
                overflow: "hidden",
                background: "rgba(18, 20, 28, 0.46)",
                backdropFilter: "blur(18px) saturate(140%)",
                WebkitBackdropFilter: "blur(18px) saturate(140%)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 16px 50px rgba(0,0,0,0.50)",
              }}
            >
              {/* IMG — preview image */}
              <div
                style={{
                  width: "100%",
                  height: "clamp(190px, 18vw, 240px)",
                  backgroundImage: `url(${previewData.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    background:
                      "linear-gradient(to bottom, rgba(18,20,28,0.1), rgba(18,20,28,0.85))",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: 18,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(20px, 2vw, 26px)",
                    color: "#ffffff",
                    letterSpacing: "0.02em",
                    textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                  }}
                >
                  {previewData.title}
                </span>
              </div>
              {/* TXT — description */}
              <p
                style={{
                  margin: 0,
                  padding: "16px 18px 18px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "clamp(13px, 1.05vw, 15px)",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                {previewData.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}