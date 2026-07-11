import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sun, Moon } from 'lucide-react';
import DOCNavRail from './DOCNavRail';
import { useTheme } from '@/components/ThemeProvider';

// Deep purple glass — matched EXACTLY to the Benconnect main header (HangingNav).
const PANEL_BG = 'linear-gradient(135deg, rgba(55,30,90,0.97) 0%, rgba(38,20,72,0.99) 60%, rgba(28,14,58,1) 100%)';
const PANEL_BORDER = 'rgba(255,255,255,0.10)';

const DOC_HTML_URL = 'https://media.base44.com/files/public/68fa7c4cb70fe91d38015eba/c1547e610_DOC_.html';
const EBM_SRC = 'https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/5c7593e2c_im.png';

// ── Outside component — no JSX parser issues with raw CSS strings ──
function buildPatchedHtml(htmlContent, light) {
  if (!htmlContent) return null;

  const forceLight = light
    ? 'html, body, .main-wrap, .container { background: #e8e8ee !important; background-color: #e8e8ee !important; background-image: none !important; color: #1a202c !important; }'
    : 'html, body, .main-wrap, .container { background: #2a2e3a !important; background-color: #2a2e3a !important; background-image: none !important; color: #c8ccd2 !important; }';

  const lightNeu = light ? THEME_CSS(true) : '';
  const darkOverrides = light ? '' : THEME_CSS(false);
  const lightClientSeparator = '';

  const styleBlock = [
    '<style>',
    '.side-rail { display: none !important; }',
    '.main-wrap { margin-left: 0 !important; }',
    '.client-rail { padding-left: 12px !important; top: 0 !important; }',
    '.container { padding: 16px 14px 30px !important; }',
    '.clock-weather, .weather-widget, .weather-block, .fav-btn, .favorite-btn,',
    '[class*="weather"], [class*="favorite"], [class*="fav-star"],',
    '.pin-btn, .result-pin,',
    '.theme-toggle, .dark-toggle, .light-toggle, [class*="theme-btn"],',
    '[class*="dark-mode-btn"], [class*="toggle-theme"], button[title*="dark"],',
    'button[title*="light"], button[title*="Dark"], button[title*="Light"],',
    '.mode-toggle, [class*="mode-toggle"] { display: none !important; }',
    'html, body { overflow-x: hidden !important; }',
    '.carrier-strip, #carrierStrip, .client-rail, .client-strip, .client-tabs, [class*="client-tab"] { display: none !important; }',
    '.benefit-nav { gap: 5px !important; }',
    '.ben-btn { padding: 7px 12px !important; font-size: .75rem !important; }',
    '.result-details { grid-template-columns: 1fr !important; }',
    '.result-card { position: relative; padding-right: 8px !important; }',
    '.quick-copy { position: static !important; opacity: 1 !important; display: inline-flex !important; margin-left: 8px !important; vertical-align: middle !important; flex-shrink: 0 !important; }',
    '.source-line { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 4px !important; }',
    forceLight,
    lightNeu,
    darkOverrides,
    lightClientSeparator,
    '</style>',
  ].join('\n');

  const ebmJson = JSON.stringify(EBM_SRC);

  // Script: handle search focus + theme switching without clearing search
  const footerScript = '<script>\n' +
    '(function() {\n' +
    '  function patchFooter() {\n' +
    '    var ebmSrc = ' + ebmJson + ';\n' +
    '    var candidates = document.querySelectorAll(".footer, .doc-footer, footer, [class*=\\"footer\\"]");\n' +
    '    candidates.forEach(function(el) {\n' +
    '      el.innerHTML = el.innerHTML\n' +
    '        .replace(/\\ba\\s+company\\b/gi, "")\n' +
    '        .replace(/\\ba\\s+/gi, "")\n' +
    '        .replace(/\\bcompany\\b/gi, "")\n' +
    '        .replace(/<ebm>/gi, \'<img src="\' + ebmSrc + \'" style="height:18px;vertical-align:middle;display:inline-block;margin:0 3px" alt="ebm">\')\n' +
    '        .replace(/&lt;ebm&gt;/gi, \'<img src="\' + ebmSrc + \'" style="height:18px;vertical-align:middle;display:inline-block;margin:0 3px" alt="ebm">\');\n' +
    '    });\n' +
    '    document.querySelectorAll(".footer-ebm, [class*=\\"footer-ebm\\"]").forEach(function(el) {\n' +
    '      el.innerHTML = \'<img src="\' + ebmSrc + \'" style="height:18px;vertical-align:middle" alt="ebm">\';\n' +
    '    });\n' +
    '    document.querySelectorAll("*:not(script):not(style)").forEach(function(el) {\n' +
    '      if (el.children.length === 0 && el.textContent.trim() === "<ebm>") {\n' +
    '        el.innerHTML = \'<img src="\' + ebmSrc + \'" style="height:18px;vertical-align:middle" alt="ebm">\';\n' +
    '      }\n' +
    '    });\n' +
    '  }\n' +
    '  function startOnFullSearch() {\n' +
    '    var full = document.getElementById("viewFull");\n' +
    '    if (full && !full.classList.contains("active")) full.click();\n' +
    '    var input = document.getElementById("searchInput");\n' +
    '    if (input) { input.focus(); }\n' +
    '  }\n' +
    '  if (document.readyState === "loading") {\n' +
    '    document.addEventListener("DOMContentLoaded", function() { setTimeout(patchFooter, 300); setTimeout(startOnFullSearch, 350); });\n' +
    '  } else {\n' +
    '    setTimeout(patchFooter, 300); setTimeout(startOnFullSearch, 350);\n' +
    '  }\n' +
    '  setTimeout(patchFooter, 1200); setTimeout(startOnFullSearch, 700);\n' +
    '\n' +
    '  // Broadcast the active client accent color to the parent whenever it changes\n' +
    '  var lastAccent = null;\n' +
    '  function reportAccent() {\n' +
    '    var a = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();\n' +
    '    if (a && a !== lastAccent) {\n' +
    '      lastAccent = a;\n' +
    '      parent.postMessage({ type: "doc-accent", accent: a }, "*");\n' +
    '    }\n' +
    '  }\n' +
    '  setInterval(reportAccent, 400);\n' +
    '  setTimeout(reportAccent, 600);\n' +
    '\n' +
    '  // Report the list of client tabs (label + accent color) to the parent\n' +
    '  function clientEls() {\n' +
    '    var strip = document.getElementById("carrierStrip") || document.querySelector(".carrier-strip, .client-rail, .client-strip, .client-tabs");\n' +
    '    if (!strip) return [];\n' +
    '    var kids = Array.prototype.slice.call(strip.children);\n' +
    '    return kids.filter(function(k) { return (k.textContent || "").trim(); });\n' +
    '  }\n' +
    '  var lastClientSig = null;\n' +
    '  function reportClients() {\n' +
    '    var els = clientEls();\n' +
    '    var list = els.map(function(el, i) {\n' +
    '      var col = (el.getAttribute("data-accent") || el.style.getPropertyValue("--accent") || "").trim();\n' +
    '      return { index: i, label: (el.textContent || "").trim(), accent: col, active: el.classList.contains("active") };\n' +
    '    }).filter(function(c) { return c.label; });\n' +
    '    var sig = JSON.stringify(list);\n' +
    '    if (sig !== lastClientSig) { lastClientSig = sig; parent.postMessage({ type: "doc-clients", clients: list }, "*"); }\n' +
    '  }\n' +
    '  setInterval(reportClients, 500);\n' +
    '  setTimeout(reportClients, 700);\n' +
    '\n' +
    '  // Client tabs "light up" — mirror the BC vertical-nav glow exactly.\n' +
    '  // Proximity-based blue outline + cyan glow that tracks the cursor.\n' +
    '  function clientTabs() {\n' +
    '    return document.querySelectorAll(".carrier-strip > *, .carrier-chip, .carrier-btn, .carrier-strip button, #carrierStrip > *");\n' +
    '  }\n' +
    '  function bindGlow() {\n' +
    '    clientTabs().forEach(function(tab) {\n' +
    '      if (tab.__glowBound) return;\n' +
    '      tab.__glowBound = true;\n' +
    '      tab.addEventListener("mousemove", function(e) {\n' +
    '        var r = tab.getBoundingClientRect();\n' +
    '        var cx = Math.max(r.left, Math.min(e.clientX, r.right));\n' +
    '        var cy = Math.max(r.top, Math.min(e.clientY, r.bottom));\n' +
    '        var d = Math.hypot(e.clientX - cx, e.clientY - cy);\n' +
    '        var p = Math.max(0, 1 - d / 150);\n' +
    '        tab.style.textShadow = "-0.5px -0.5px 0 #2563eb, 0.5px -0.5px 0 #2563eb, -0.5px 0.5px 0 #2563eb, 0.5px 0.5px 0 #2563eb, 0 0 " + (p * 20) + "px #00d4ff";\n' +
    '      });\n' +
    '      tab.addEventListener("mouseleave", function() {\n' +
    '        if (!tab.classList.contains("active")) tab.style.textShadow = "none";\n' +
    '      });\n' +
    '    });\n' +
    '  }\n' +
    '  setInterval(bindGlow, 700);\n' +
    '  setTimeout(bindGlow, 500);\n' +
    '\n' +
    '  // Theme switch: inject new style block without reloading page\n' +
    '  window.addEventListener("message", function(e) {\n' +
    '    if (e.data && e.data.type === "doc-focus-search") {\n' +
    '      var input = document.querySelector(\'input[type="search"], input[type="text"], input[placeholder*="earch"], .search-input, #search, #searchInput, [id*="search"], [class*="search-input"]\');\n' +
    '      if (input) { input.focus(); input.select(); }\n' +
    '    }\n' +
    '    if (e.data && e.data.type === "doc-select-client") {\n' +
    '      var els = clientEls();\n' +
    '      var el = els[e.data.index];\n' +
    '      if (el) { el.click(); }\n' +
    '    }\n' +
    '    if (e.data && e.data.type === "doc-trigger-search") {\n' +
    '      var term = (e.data.term || "").toLowerCase();\n' +
    '      var btns = document.querySelectorAll(".ben-btn, .cat-row button, #catRow button, [class*=\\"ben-btn\\"], [class*=\\"cat-\\"] button");\n' +
    '      var hit = null;\n' +
    '      btns.forEach(function(b) { if (!hit && b.textContent.toLowerCase().indexOf(term) !== -1) hit = b; });\n' +
    '      if (hit) { hit.click(); }\n' +
    '      else {\n' +
    '        var input = document.querySelector("#searchInput, .search-input, input[type=\\"text\\"]");\n' +
    '        if (input) { input.value = e.data.term || ""; input.dispatchEvent(new Event("input", { bubbles: true })); input.focus(); }\n' +
    '      }\n' +
    '    }\n' +
    '    if (e.data && e.data.type === "doc-set-theme") {\n' +
    '      var existing = document.getElementById("__theme_override__");\n' +
    '      if (existing) existing.remove();\n' +
    '      var s = document.createElement("style");\n' +
    '      s.id = "__theme_override__";\n' +
    '      s.textContent = e.data.css;\n' +
    '      document.head.appendChild(s);\n' +
    '    }\n' +
    '  });\n' +
    '})();\n' +
    '<\/script>';

  return htmlContent.replace('</head>', styleBlock + '\n' + footerScript + '\n</head>');
}

// ─────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for DOC theming. Palettes matched EXACTLY
// to the CORPS/BC neumorphic tokens (globals.css):
//   light: bg #e8e8ee, dark-shadow #c5c5cf, light-shadow #ffffff
//   dark:  bg #2a2e3a, dark-shadow #1f232d, light-shadow #353945
// Real DOC class names (from source): .search-well, .search-input,
// .cat-row button, .view-btn, .carrier-strip (client pills),
// #resultsZone cards. Every surface uses DUAL neumorphic shadows
// so nothing looks like black bleeding out.
// ─────────────────────────────────────────────────────────────
function THEME_CSS(light) {
  if (light) {
    const BG = '#e8e8ee', D = '#c5c5cf', L = '#ffffff';
    return [
      // Force ALL page wrappers to the exact BC surface — kill DOC's own bg
      `html, body, .main-wrap, .container, .search-zone, #resultsZone, .cat-wrap, .carrier-strip, .redirect-banner { background: ${BG} !important; background-color: ${BG} !important; background-image: none !important; }`,
      // Search well + input → inset pressed field (never black)
      `.search-well, .search-zone { background: ${BG} !important; box-shadow: inset 3px 3px 6px ${D}, inset -3px -3px 6px ${L} !important; border: none !important; border-radius: 14px !important; }`,
      `.search-input, input[type="text"], input[type="search"] { background: transparent !important; color: #1a202c !important; box-shadow: none !important; border: none !important; }`,
      `.search-input::placeholder { color: #9a9aa5 !important; }`,
      // Search icon + clear button → transparent, no black square
      `.search-icon { background: transparent !important; box-shadow: none !important; border: none !important; color: #9a9aa5 !important; }`,
      `.search-clear { background: transparent !important; box-shadow: none !important; border: none !important; color: #9a9aa5 !important; }`,
      // Category buttons + view toggle → raised soft buttons
      `.cat-row button, .view-btn, .search-clear, .cat-arrow { background: ${BG} !important; color: #555 !important; box-shadow: 3px 3px 7px ${D}, -3px -3px 7px ${L} !important; border: none !important; border-radius: 20px !important; }`,
      `.cat-row button.active, .view-btn.active { background: #dc2626 !important; color: #fff !important; box-shadow: inset 2px 2px 5px #a01818, inset -2px -2px 5px #ff3a3a !important; }`,
      // Client pills (carrier strip) → raised + thin INSET accent border; selected glows
      `.carrier-strip > *, .carrier-chip, .carrier-btn, .carrier-strip button, #carrierStrip > * { background: ${BG} !important; background-color: ${BG} !important; background-image: none !important; color: #555 !important; box-shadow: inset 0 0 0 1.5px var(--accent, #dc2626), 3px 3px 7px ${D}, -3px -3px 7px ${L} !important; border: none !important; border-radius: 50px !important; }`,
      `.carrier-strip > .active, .carrier-chip.active, .carrier-btn.active, #carrierStrip > .active { background: ${BG} !important; box-shadow: inset 0 0 0 2px var(--accent, #dc2626), 0 0 10px var(--accent, #dc2626), 0 0 18px var(--accent, #dc2626) !important; color: var(--accent, #dc2626) !important; }`,
      // Result cards → raised
      `#resultsZone > *, .result-card, .coverage-card, [class*="result-card"] { background: ${BG} !important; box-shadow: 6px 6px 14px ${D}, -6px -6px 14px ${L} !important; border: none !important; border-radius: 14px !important; }`,
      `.clock-weather, .search-hint, .search-meta, .result-count { background: transparent !important; box-shadow: none !important; }`,
    ].join('\n');
  }
  const BG = '#2a2e3a', D = '#1f232d', L = '#353945';
  return [
    // Force ALL page wrappers to the exact BC surface — kill DOC's own near-black bg
    `html, body, .main-wrap, .container, #resultsZone, .cat-wrap, .carrier-strip, .redirect-banner { background: ${BG} !important; background-color: ${BG} !important; background-image: none !important; }`,
    `.search-well, .search-zone { background: ${BG} !important; box-shadow: inset 3px 3px 6px ${D}, inset -3px -3px 6px ${L} !important; border: none !important; border-radius: 14px !important; }`,
    `.search-input, input[type="text"], input[type="search"] { background: transparent !important; color: #d6dae2 !important; box-shadow: none !important; border: none !important; }`,
    `.search-input::placeholder { color: #7a808c !important; }`,
    `.cat-row button, .view-btn, .search-clear, .cat-arrow { background: ${BG} !important; color: #aab0bb !important; box-shadow: 3px 3px 8px ${D}, -3px -3px 8px ${L} !important; border: none !important; border-radius: 20px !important; }`,
    `.cat-row button.active, .view-btn.active { background: #dc2626 !important; color: #fff !important; box-shadow: inset 2px 2px 5px #7a1414, inset -2px -2px 5px #ff3a3a !important; }`,
    `.carrier-strip > *, .carrier-chip, .carrier-btn, .carrier-strip button, #carrierStrip > * { background: ${BG} !important; background-color: ${BG} !important; background-image: none !important; color: #aab0bb !important; box-shadow: inset 0 0 0 1.5px var(--accent, #dc2626), 3px 3px 8px ${D}, -3px -3px 8px ${L} !important; border: none !important; border-radius: 50px !important; }`,
    `.carrier-strip > .active, .carrier-chip.active, .carrier-btn.active, #carrierStrip > .active { background: ${BG} !important; box-shadow: inset 0 0 0 2px var(--accent, #dc2626), 0 0 10px var(--accent, #dc2626), 0 0 20px var(--accent, #dc2626) !important; color: var(--accent, #dc2626) !important; }`,
    `#resultsZone > *, .result-card, .coverage-card, [class*="result-card"] { background: ${BG} !important; box-shadow: 6px 6px 14px ${D}, -6px -6px 14px ${L} !important; border: none !important; border-radius: 14px !important; }`,
    `.clock-weather, .search-hint, .search-meta, .result-count { background: transparent !important; box-shadow: none !important; }`,
    `a { color: #f0736f !important; }`,
    `.result-name, .result-title, .card-title, [class*="result-name"], [class*="card-title"] { color: #e8eaed !important; }`,
    `.result-category, .result-source, .category-label, .source-label { color: #9096a0 !important; }`,
  ].join('\n');
}

// Injected on live theme switch (no reload)
function buildThemeCss(light) {
  const base = light
    ? 'html, body { background: #e8e8ee !important; color: #1a202c !important; }'
    : 'html, body { background: #2a2e3a !important; color: #c8ccd2 !important; }';
  return [base, THEME_CSS(light)].join('\n');
}

// Cursor shadow — light mode ambient pointer glow, sits above iframe
function CursorShadow() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 2,
        width: 160,
        height: 190,
        opacity: 0.08,
      }}
    >
      <svg
        viewBox="0 0 60 72"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', filter: 'blur(22px)' }}
      >
        <path d="M4 2 L4 56 L16 44 L26 68 L34 64 L24 40 L40 40 Z" fill="#8090a0" />
      </svg>
    </div>
  );
}

export default function DOCModal({ isOpen, onClose }) {
  const { isDark: siteDark } = useTheme();
  // DOC follows the site theme unless overridden locally within DOC
  const [docLight, setDocLight] = useState(!siteDark);
  const userOverride = useRef(false);
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const iframeRef = useRef(null);
  const initialLoadDone = useRef(false);
  // Accent color of the currently-selected client (broadcast from the iframe)
  const [clientAccent, setClientAccent] = useState('#dc2626');
  // List of client tabs pulled up out of the iframe into the sub-header
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data && e.data.type === 'doc-accent' && e.data.accent) {
        setClientAccent(e.data.accent);
      }
      if (e.data && e.data.type === 'doc-clients' && Array.isArray(e.data.clients)) {
        setClients(e.data.clients);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Follow the site's light/dark unless the user has toggled DOC's own switch
  useEffect(() => {
    if (!userOverride.current) setDocLight(!siteDark);
  }, [siteDark]);

  useEffect(() => {
    if (isOpen && !htmlContent) {
      setLoading(true);
      fetch(DOC_HTML_URL)
        .then(r => r.text())
        .then(html => { setHtmlContent(html); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  // Reset initialLoadDone when modal closes so next open rebuilds with correct theme
  useEffect(() => {
    if (!isOpen) {
      initialLoadDone.current = false;
    }
  }, [isOpen]);

  // Build blob on first open, then use postMessage for theme switches (preserves search state)
  useEffect(() => {
    if (!htmlContent) return;
    if (initialLoadDone.current) {
      // Theme switch: inject CSS into existing iframe without reloading
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'doc-set-theme', css: buildThemeCss(docLight) }, '*'
        );
      }
      return;
    }
    // First load — build blob with current theme
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    const patched = buildPatchedHtml(htmlContent, docLight);
    const blob = new Blob([patched], { type: 'text/html' });
    setBlobUrl(URL.createObjectURL(blob));
    initialLoadDone.current = true;
  }, [docLight, htmlContent, isOpen]);

  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  const focusIframeSearch = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'doc-focus-search' }, '*');
    }
  };

  useEffect(() => {
    if (isOpen && blobUrl) setTimeout(focusIframeSearch, 500);
  }, [isOpen, blobUrl]);

  useEffect(() => {
    const handler = () => setTimeout(focusIframeSearch, 300);
    window.addEventListener('doc-focus-search', handler);
    return () => window.removeEventListener('doc-focus-search', handler);
  }, []);

  const triggerSearch = (term) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'doc-trigger-search', term }, '*');
    }
  };

  const selectClient = (index) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'doc-select-client', index }, '*');
    }
  };

  const handlePopOut = () => {
    if (blobUrl) window.open(blobUrl, '_blank', 'width=1100,height=820,menubar=no,toolbar=no,location=no');
    else window.open(DOC_HTML_URL, '_blank', 'width=1100,height=820,menubar=no,toolbar=no,location=no');
  };

  const isDark = !docLight;

  // Content area still follows light/dark; header/rail are always purple glass (Benconnect)
  const panelBg   = isDark ? '#2a2e3a' : '#e8e8ee';

  const btnStyle = {
    width: 32, height: 32, borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.12)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.85)',
    flexShrink: 0,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="doc-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-[201] flex overflow-hidden"
            style={{
              width: 'min(50vw, 640px)',
              boxShadow: isDark ? '-6px 0 40px #0d0d10' : '-6px 0 40px rgba(0,0,0,0.12)',
              background: panelBg,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Brushed metal divider — replaces the old rail location on the left edge */}
            <div style={{
              width: '6px',
              flexShrink: 0,
              background: isDark
                ? 'linear-gradient(90deg, #14161d 0%, #2b2f3a 22%, #3a3f4c 50%, #2b2f3a 78%, #14161d 100%)'
                : 'linear-gradient(90deg, #9098a5 0%, #d9dde4 22%, #f2f4f8 50%, #d9dde4 78%, #9098a5 100%)',
              backgroundImage: isDark
                ? 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 2px), linear-gradient(90deg, #14161d 0%, #2b2f3a 22%, #3a3f4c 50%, #2b2f3a 78%, #14161d 100%)'
                : 'repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 2px), linear-gradient(90deg, #9098a5 0%, #d9dde4 22%, #f2f4f8 50%, #d9dde4 78%, #9098a5 100%)',
              boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.3), inset -1px 0 2px rgba(0,0,0,0.3)',
            }} />

            {/* Main column: header + content */}
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
            {/* Header */}
            <div
              className="flex items-center justify-between flex-shrink-0 px-4"
              style={{
                background: 'linear-gradient(315deg, rgba(55,30,90,0.97) 0%, rgba(38,20,72,0.99) 60%, rgba(28,14,58,1) 100%)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                borderBottom: `1px solid ${PANEL_BORDER}`,
                boxShadow: '0 1px 0 rgba(255,255,255,0.07)',
                height: '52px',
              }}
            >
              <div className="flex items-baseline gap-2">
                <span style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#ff2b2b',
                  textShadow: '0 0 8px rgba(255,43,43,0.55)',
                  letterSpacing: '-0.7px',
                  lineHeight: 1,
                }}>
                  DOC<sup style={{ fontSize: '7px', opacity: 0.6, verticalAlign: 'super' }}>™</sup>
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'IBM Plex Mono, monospace', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Directory of Coverage
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => { userOverride.current = true; setDocLight(p => !p); }} title={docLight ? 'Switch to dark mode' : 'Switch to light mode'} style={btnStyle}>
                  {docLight ? <Moon size={14} color="#ffffff" /> : <Sun size={14} color="#fbbf24" />}
                </button>
                <button onClick={handlePopOut} title="Open in new window" style={btnStyle}>
                  <ExternalLink size={14} />
                </button>
                <button onClick={onClose} title="Close" style={btnStyle}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Sub-header strip — the CLIENTS, pulled up from the iframe.
                Plain words like the adjacent nav (no pills); glow their own client
                color on hover. Scrolls horizontally only, never wraps/vertical.
                min-w-0 lets the strip shrink so the left side resizes on narrow screens. */}
            <div
              className="flex items-center flex-shrink-0 gap-8 px-4 overflow-x-auto overflow-y-hidden no-scrollbar min-w-0"
              style={{
                height: '38px',
                minHeight: '38px',
                maxHeight: '38px',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                background: 'linear-gradient(315deg, rgba(55,30,90,0.97) 0%, rgba(38,20,72,0.99) 60%, rgba(28,14,58,1) 100%)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                borderBottom: `1px solid ${PANEL_BORDER}`,
              }}
            >
              {clients.length === 0 && (
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', flexShrink: 0 }}>
                  No clients loaded
                </span>
              )}
              {clients.map((client) => {
                const accent = client.accent || '#00d4ff';
                return (
                  <button
                    key={client.index}
                    onClick={() => selectClient(client.index)}
                    className="text-[13px] font-semibold tracking-widest transition-all duration-300 bg-transparent border-0 cursor-pointer flex-shrink-0"
                    style={{
                      color: client.active ? accent : 'rgba(255,255,255,0.55)',
                      textShadow: client.active
                        ? `0 0 10px ${accent}, 0 0 18px ${accent}`
                        : '0 0 1px rgba(255,255,255,0.3)',
                    }}
                    onMouseMove={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      const cx = Math.max(r.left, Math.min(e.clientX, r.right));
                      const cy = Math.max(r.top, Math.min(e.clientY, r.bottom));
                      const d = Math.hypot(e.clientX - cx, e.clientY - cy);
                      const p = Math.max(0, 1 - d / 150);
                      e.currentTarget.style.color = accent;
                      e.currentTarget.style.textShadow = `0 0 ${4 + p * 20}px ${accent}, 0 0 ${p * 32}px ${accent}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = client.active ? accent : 'rgba(255,255,255,0.55)';
                      e.currentTarget.style.textShadow = client.active
                        ? `0 0 10px ${accent}, 0 0 18px ${accent}`
                        : '0 0 1px rgba(255,255,255,0.3)';
                    }}
                  >
                    {client.label}
                  </button>
                );
              })}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden relative">
              {/* Cursor shadow — light mode only */}
              {docLight && <CursorShadow />}

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: isDark ? '#2a2e3a' : '#e8e8ee' }}>
                  <div style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    color: '#dc2626',
                    textTransform: 'uppercase',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}>
                    Loading DOC™…
                  </div>
                </div>
              )}
              {blobUrl && !loading && (
                <iframe
                  ref={iframeRef}
                  src={blobUrl}
                  className="w-full h-full"
                  style={{ border: 'none', display: 'block', position: 'relative', zIndex: 1 }}
                  title="DOC Directory of Coverage"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                />
              )}
            </div>
            </div>

            {/* BC-mirrored vertical nav rail (chip + lights + lit buttons) on the RIGHT edge of DOC */}
            <DOCNavRail onTrigger={triggerSearch} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}