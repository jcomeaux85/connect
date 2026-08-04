// AleraLauncher — "ALERA | one" glowing trigger + full-screen brightwash
// icon slide-out. Replaces the old DOC/CORPS brand row in the sidebar.
//
// Interaction:
//  • Hover the ALERA | one text → glow ramps + icons slide out + screen
//    brightwashes, all over 1.1s with a soft start/landing ease.
//  • Icons sit in an invisible full-width band at the trigger's vertical
//    position, extended 30px above/below for forgiving hover.
//  • Hovering one icon scales it up + greys/fades the others; de-hovering
//    an icon restores all (while the mouse stays on the band).
//  • De-hovering the band retracts everything.
//
// No container background behind the icon row — the brightwash alone is
// the backdrop. Each icon casts a drop-shadow on the site behind it.

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const DURATION = 0.935;
const SOFT_EASE = [0.25, 0.1, 0.25, 1];
const EASE_CSS = "cubic-bezier(0.25, 0.1, 0.25, 1)";
const BUFFER_PX = 30;
const ICON_SIZE = 88;
const BAND_HEIGHT = ICON_SIZE + BUFFER_PX * 2;

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
    href: EXTERNAL_HREF,
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
  const [centerY, setCenterY] = useState(null);
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const open = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    const el = triggerRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setCenterY(r.top + r.height / 2);
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
    else if (app.href) window.open(app.href, "_blank", "noopener,noreferrer");
  };

  const bandTop = (centerY ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 400)) - BAND_HEIGHT / 2;

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
            <>
              {/* ── Brightwash: ultra-bright, over-exposed, out-of-focus site ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION, ease: SOFT_EASE }}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 80,
                  pointerEvents: "none",
                  background:
                    "radial-gradient(ellipse at center, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.78) 45%, rgba(240,248,255,0.62) 100%)",
                  backdropFilter: "blur(3px) brightness(1.85) saturate(0.4) contrast(0.95)",
                  WebkitBackdropFilter: "blur(3px) brightness(1.85) saturate(0.4) contrast(0.95)",
                }}
              />

              {/* ── Interactive band: invisible, full-width, 30px buffer ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
                style={{
                  position: "fixed",
                  left: 0,
                  width: "100%",
                  top: `${bandTop}px`,
                  height: `${BAND_HEIGHT}px`,
                  zIndex: 90,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "clamp(40px, 8vw, 120px)",
                  // No container background — the brightwash is the backdrop.
                }}
              >
                {APPS.map((app, i) => {
                  const isHovered = hoveredIcon === app.id;
                  const isOther = hoveredIcon !== null && !isHovered;
                  return (
                    <motion.button
                      key={app.id}
                      type="button"
                      initial={{ x: -80, opacity: 0, scale: 0.5 }}
                      animate={{
                        x: 0,
                        opacity: isOther ? 0.3 : 1,
                        scale: isHovered ? 1.15 : isOther ? 0.92 : 1,
                        filter: isOther
                          ? "grayscale(1) drop-shadow(0 10px 20px rgba(0,0,0,0.28))"
                          : "grayscale(0) drop-shadow(0 10px 20px rgba(0,0,0,0.28))",
                      }}
                      exit={{ x: -80, opacity: 0, scale: 0.5 }}
                      transition={{
                        x: { duration: DURATION, ease: SOFT_EASE, delay: i * 0.06 },
                        opacity: { duration: 0.28, ease: "easeOut" },
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
                      }}
                    >
                      {app.renderIcon(ICON_SIZE)}
                    </motion.button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}