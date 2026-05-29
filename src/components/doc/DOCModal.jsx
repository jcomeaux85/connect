import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sun, Moon } from 'lucide-react';

const DOC_HTML_URL = 'https://media.base44.com/files/public/68fa7c4cb70fe91d38015eba/c1547e610_DOC_.html';
const EBM_SRC = 'https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/5c7593e2c_im.png';

// ── Kept outside component so JSX parser never sees the raw CSS/script strings ──
function buildPatchedHtml(htmlContent, light) {
  if (!htmlContent) return null;

  const forceLight = light
    ? 'html, body { background: #f0f4f8 !important; color: #1a202c !important; } .dark-mode-overrides { display: none !important; }'
    : '';

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
    '.benefit-nav { gap: 5px !important; }',
    '.ben-btn { padding: 7px 12px !important; font-size: .75rem !important; }',
    '.result-details { grid-template-columns: 1fr !important; }',
    '.result-card { position: relative; padding-right: 8px !important; }',
    '.quick-copy { position: static !important; opacity: 1 !important; display: inline-flex !important; margin-left: 8px !important; vertical-align: middle !important; flex-shrink: 0 !important; }',
    '.source-line { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 4px !important; }',
    forceLight,
    '</style>',
  ].join('\n');

  const ebmJson = JSON.stringify(EBM_SRC);

  const footerScript = '<script>\n' +
    '(function patchFooter() {\n' +
    '  function doFix() {\n' +
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
    '  if (document.readyState === "loading") {\n' +
    '    document.addEventListener("DOMContentLoaded", function() { setTimeout(doFix, 300); });\n' +
    '  } else {\n' +
    '    setTimeout(doFix, 300);\n' +
    '  }\n' +
    '  setTimeout(doFix, 1200);\n' +
    '})();\n' +
    // postMessage listener to focus search
    'window.addEventListener("message", function(e) {\n' +
    '  if (e.data && e.data.type === "doc-focus-search") {\n' +
    '    var input = document.querySelector(\'input[type="search"], input[type="text"], input[placeholder*="earch"], .search-input, #search, #searchInput, [id*="search"], [class*="search-input"]\');\n' +
    '    if (input) { input.focus(); input.select(); }\n' +
    '  }\n' +
    '});\n' +
    '<\/script>';

  return htmlContent.replace('</head>', styleBlock + '\n' + footerScript + '\n</head>');
}

export default function DOCModal({ isOpen, onClose }) {
  const [docLight, setDocLight] = useState(true);
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (isOpen && !htmlContent) {
      setLoading(true);
      fetch(DOC_HTML_URL)
        .then(r => r.text())
        .then(html => { setHtmlContent(html); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  // Rebuild blob when theme or content changes
  useEffect(() => {
    if (!htmlContent) return;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    const patched = buildPatchedHtml(htmlContent, docLight);
    const blob = new Blob([patched], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
  }, [docLight, htmlContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  const focusIframeSearch = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'doc-focus-search' }, '*');
    }
  };

  // Focus search when panel opens or blob is ready
  useEffect(() => {
    if (isOpen && blobUrl) {
      setTimeout(focusIframeSearch, 500);
    }
  }, [isOpen, blobUrl]);

  // Respond to global Ctrl+K event (when already open)
  useEffect(() => {
    const handler = () => setTimeout(focusIframeSearch, 300);
    window.addEventListener('doc-focus-search', handler);
    return () => window.removeEventListener('doc-focus-search', handler);
  }, []);

  const handlePopOut = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank', 'width=1100,height=820,menubar=no,toolbar=no,location=no');
    } else {
      window.open(DOC_HTML_URL, '_blank', 'width=1100,height=820,menubar=no,toolbar=no,location=no');
    }
  };

  const isDark = !docLight;

  const btnStyle = {
    width: 28, height: 28, borderRadius: 8, border: 'none',
    background: isDark ? '#2a2a2e' : '#dde3ea',
    boxShadow: isDark
      ? '3px 3px 6px #101013, -3px -3px 6px #242428'
      : '3px 3px 6px #b8c0cc, -3px -3px 6px #fff',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: isDark ? '#888' : '#555',
    flexShrink: 0,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="doc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200]"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.55)' }}
            onClick={onClose}
          />

          <motion.div
            key="doc-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-[201] flex flex-col overflow-hidden"
            style={{
              width: 'min(420px, 100vw)',
              boxShadow: '-8px 0 48px rgba(0,0,0,0.5)',
              background: isDark ? 'rgba(26, 26, 30, 0.95)' : 'rgba(238, 241, 246, 0.95)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header bar */}
            <div
              className="flex items-center justify-between flex-shrink-0 px-4 py-2"
              style={{
                background: isDark ? '#111114' : '#dde3ea',
                borderBottom: `1px solid ${isDark ? '#2a2a2e' : '#c8d0da'}`,
                minHeight: '44px',
              }}
            >
              <div className="flex items-baseline gap-2">
                <span style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  color: '#dc2626',
                  letterSpacing: '-1px',
                  lineHeight: 1,
                  textShadow: isDark
                    ? '2px 2px 4px #101013, -1px -1px 2px #242428'
                    : '2px 2px 4px #b8c0cc, -1px -1px 2px #fff',
                }}>
                  DOC<sup style={{ fontSize: '.45rem', opacity: .5, verticalAlign: 'super' }}>™</sup>
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'IBM Plex Mono, monospace', color: isDark ? '#666' : '#8a96a3', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Directory of Coverage
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setDocLight(p => !p)} title={docLight ? 'Switch to dark mode' : 'Switch to light mode'} style={btnStyle}>
                  {docLight ? <Moon size={13} /> : <Sun size={13} />}
                </button>
                <button onClick={handlePopOut} title="Open in new window" style={btnStyle}>
                  <ExternalLink size={13} />
                </button>
                <button onClick={onClose} title="Close" style={btnStyle}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: isDark ? '#1a1a1e' : '#eef1f6' }}>
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
                  style={{ border: 'none', display: 'block' }}
                  title="DOC Directory of Coverage"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}