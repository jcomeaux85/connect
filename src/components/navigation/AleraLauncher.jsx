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

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const DURATION = 0.935;
const SOFT_EASE = [0.25, 0.1, 0.25, 1];
const EASE_CSS = "cubic-bezier(0.25, 0.1, 0.25, 1)";
const ICON_SIZE = 74;
const COL_WIDTH = 116;
const HEAD_INSET = 16; // px from viewport top — almost reaches sidebar head
const FOOT_INSET = 16; // px from viewport bottom — almost reaches sidebar foot

// Blue outline + cyan glow matching the HangingNav (Cases/Tasks/etc) style.
const GLOW_REST = "0 0 1px rgba(255,255,255,0.3)";
const GLOW_FULL =
  "-0.5px -0.5px 0 #2563eb, 0.5px -0.5px 0 #2563eb, -0.5px 0.5px 0 #2563eb, 0.5px 0.5px 0 #2563eb, 0 0 20px #00d4ff";

// ── App tiles (starting with DOC + CORPS; more logos to come) ──
const DOC_ICON =
  "https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/158bf0016_doc_teams_icon_192b.png";

const EXTERNAL_HREF = "https://ndrndr.com/alera";

const APPS = [
  {
    id: "doc",
    label: "DOC",
    renderIcon: (size) => (
      <img
        src={DOC_ICON}
        alt="DOC"
        style={{ width: size, height: size, objectFit: "contain", pointerEvents: "none" }}
      />
    ),
  },
  {
    id: "corps",
    label: "CORPS//",
    renderIcon: (size) => (
      <span
        style={{
          fontFamily: "'VT323', ui-monospace, monospace",
          fontSize: size * 0.6,
          lineHeight: 1,
          color: "#33FF33",
          letterSpacing: "0.02em",
          textShadow: "0 0 10px rgba(51,255,51,0.6), 0 0 22px rgba(51,255,51,0.35)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        CORPS//
      </span>
    ),
  },
  {
    id: "authlink",
    label: "Auth|Link",
    renderIcon: (size) => (
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 800,
          fontSize: size * 0.26,
          color: "#ffffff",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        Auth<span style={{ color: "#00d4ff" }}>|</span>Link
      </span>
    ),
  },
  {
    id: "consilium",
    label: "Consilium",
    href: EXTERNAL_HREF,
    renderIcon: (size) => (
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 800,
          fontSize: size * 0.22,
          color: "#00E5FF",
          letterSpacing: "0.08em",
          textShadow: "0 0 10px rgba(0,229,255,0.5)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        CONSILIUM
      </span>
    ),
  },
  {
    id: "learn",
    label: "ALERA | learn",
    href: EXTERNAL_HREF,
    renderIcon: (size) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          lineHeight: 1,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: size * 0.3,
            color: "#555555",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
        >
          LE<span style={{ color: "#40E0D0" }}>▼</span>RN
        </span>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: size * 0.1,
            color: "#A9A9A9",
            marginTop: "2px",
            whiteSpace: "nowrap",
          }}
        >
          by <span style={{ color: "#40E0D0" }}>ALERAGROUP</span>
        </span>
      </div>
    ),
  },
  {
    id: "train",
    label: "ALERA | train",
    href: EXTERNAL_HREF,
    renderIcon: (size) => (
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 800,
          fontSize: size * 0.3,
          color: "#ffffff",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        TR<span style={{ color: "#00d4ff" }}>▼</span>IN
      </span>
    ),
  },
  {
    id: "hub",
    label: "Alera hub",
    href: EXTERNAL_HREF,
    renderIcon: (size) => (
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 800,
          fontSize: size * 0.32,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        <span style={{ color: "#0078D7" }}>Help</span>
        <span style={{ color: "#B3B3B3" }}>Hub</span>
      </span>
    ),
  },
];

export default function AleraLauncher({ onToggleDoc }) {
  const navigate = useNavigate();
  const triggerRef = useRef(null);
  const closeTimer = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [leftEdge, setLeftEdge] = useState(0);
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const open = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    const el = triggerRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setLeftEdge(r.right); // column flush against sidebar's right edge
    }
    setIsOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredIcon(null);
    }, 160);
  }, []);

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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => () => closeTimer.current && clearTimeout(closeTimer.current), []);

  const handleSelect = (app) => {
    setIsOpen(false);
    setHoveredIcon(null);
    if (app.id === "doc") onToggleDoc?.();
    else if (app.id === "corps") navigate("/Core");
    else if (app.id === "authlink") navigate("/AuthLink");
    else if (app.href) window.open(app.href, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* ── Trigger: ALERA | one (glows like the top nav text) ── */}
      <div
        ref={triggerRef}
        onMouseEnter={open}
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
              initial={{ x: -COL_WIDTH - 12, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -COL_WIDTH - 12, opacity: 0 }}
              transition={{ duration: DURATION, ease: SOFT_EASE }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              style={{
                position: "fixed",
                left: `${leftEdge}px`,
                top: `${HEAD_INSET}px`,
                bottom: `${FOOT_INSET}px`,
                width: `${COL_WIDTH}px`,
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-evenly",
                gap: "6px",
                padding: "14px 0",
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
                      scale: isHovered ? 1.15 : isOther ? 0.92 : 1,
                      filter: isOther ? "grayscale(1)" : "grayscale(0)",
                    }}
                    exit={{ opacity: 0, y: -18, scale: 0.5 }}
                    transition={{
                      opacity: { duration: 0.3, ease: "easeOut", delay: i * 0.07 },
                      y: { duration: DURATION, ease: SOFT_EASE, delay: i * 0.07 },
                      scale: { duration: 0.28, ease: "easeOut" },
                      filter: { duration: 0.28, ease: "easeOut" },
                    }}
                    onMouseEnter={() => setHoveredIcon(app.id)}
                    onMouseLeave={() => setHoveredIcon(null)}
                    onClick={() => handleSelect(app)}
                    title={app.label}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      width: `${ICON_SIZE}px`,
                      height: `${ICON_SIZE}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    {app.renderIcon(ICON_SIZE)}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}