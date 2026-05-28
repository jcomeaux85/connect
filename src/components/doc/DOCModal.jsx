import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sun, Moon } from 'lucide-react';

const DOC_HTML_URL = 'https://media.base44.com/files/public/68fa7c4cb70fe91d38015eba/c1547e610_DOC_.html';

export default function DOCModal({ isOpen, onClose }) {
  const [docLight, setDocLight] = useState(true); // start in light mode
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (isOpen && !htmlContent) {
      setLoading(true);
      fetch(DOC_HTML_URL)
        .then(r => r.text())
        .then(html => {
          setHtmlContent(html);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  // Build patched HTML whenever content or theme changes
  const getPatchedHtml = (light) => {
    if (!htmlContent) return null;
    const forceLight = light ? `
      html, body { background: #f0f4f8 !important; color: #1a202c !important; }
      .dark-mode-overrides { display: none !important; }
    ` : '';

    const ebmSrc = 'https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/7258f1cbd_ebm_white.png';

    // Script to patch footer after DOM is ready
    const footerScript = `
<script>
(function patchFooter() {
  function doFix() {
    // Replace any text node containing "a " or "company" near footer / ebm elements
    // and swap <ebm> text for the logo image
    const ebmSrc = ${JSON.stringify(ebmSrc)};
    // Find footer element — try common selectors
    const candidates = document.querySelectorAll('.footer, .doc-footer, footer, [class*="footer"]');
    candidates.forEach(el => {
      // Replace inner HTML: strip "a " prefix and "company", replace <ebm> with img
      el.innerHTML = el.innerHTML
        .replace(/\\ba\\s+company\\b/gi, '')
        .replace(/\\ba\\s+/gi, '')
        .replace(/\\bcompany\\b/gi, '')
        .replace(/<ebm>/gi, '<img src="' + ebmSrc + '" style="height:18px;vertical-align:middle;display:inline-block;margin:0 3px" alt="ebm">')
        .replace(/&lt;ebm&gt;/gi, '<img src="' + ebmSrc + '" style="height:18px;vertical-align:middle;display:inline-block;margin:0 3px" alt="ebm">');
    });
    // Also patch footer-ebm spans specifically
    document.querySelectorAll('.footer-ebm, [class*="footer-ebm"]').forEach(el => {
      el.innerHTML = '<img src="' + ebmSrc + '" style="height:18px;vertical-align:middle" alt="ebm">';
    });
    // Patch any element whose text is literally "<ebm>"
    document.querySelectorAll('*:not(script):not(style)').forEach(el => {
      if (el.children.length === 0 && el.textContent.trim() === '<ebm>') {
        el.innerHTML = '<img src="' + ebmSrc + '" style="height:18px;vertical-align:middle" alt="ebm">';
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(doFix, 300); });
  } else {
    setTimeout(doFix, 300);
  }
  // Also run after a delay in case footer is rendered by JS
  setTimeout(doFix, 1200);
})();
<\/script>`;

    return htmlContent.replace('</head>', `
<style>
  /* ── Slide-out overrides ── */
  .side-rail { display: none !important; }
  .main-wrap { margin-left: 0 !important; }
  .client-rail { padding-left: 12px !important; top: 0 !important; }
  .container { padding: 16px 14px 30px !important; }
  /* Hide weather, star/favorite, and original light/dark toggle */
  .clock-weather, .weather-widget, .weather-block, .fav-btn, .favorite-btn,
  [class*="weather"], [class*="favorite"], [class*="fav-star"],
  .pin-btn, .result-pin,
  .theme-toggle, .dark-toggle, .light-toggle, [class*="theme-btn"],
  [class*="dark-mode-btn"], [class*="toggle-theme"], button[title*="dark"],
  button[title*="light"], button[title*="Dark"], button[title*="Light"],
  .mode-toggle, [class*="mode-toggle"] { display: none !important; }
  html, body { overflow-x: hidden !important; }
  /* compact benefit nav */
  .benefit-nav { gap: 5px !important; }
  .ben-btn { padding: 7px 12px !important; font-size: .75rem !important; }
  /* results always visible */
  .result-details { grid-template-columns: 1fr !important; }
  /* move copy button inline with source citation */
  .result-card { position: relative; padding-right: 8px !important; }
  .quick-copy {
    position: static !important;
    opacity: 1 !important;
    display: inline-flex !important;
    margin-left: 8px !important;
    vertical-align: middle !important;
    flex-shrink: 0 !important;
  }
  .source-line {
    display: flex !important;
    align-items: center !important;
    flex-wrap: wrap !important;
    gap: 4px !important;
  }
  ${forceLight}
</style>
${footerScript}
</head>`);
  };

  // Sync theme changes to already-loaded iframe
  useEffect(() => {
    if (!iframeRef.current || !htmlContent) return;
    const patched = getPatchedHtml(docLight);
    if (patched) {
      // revoke old blob
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      const blob = new Blob([patched], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    }
  }, [docLight, htmlContent]);

  // Initial blob creation
  useEffect(() => {
    if (htmlContent && !blobUrl) {
      const patched = getPatchedHtml(docLight);
      const blob = new Blob([patched], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    }
  }, [htmlContent]);

  // Cleanup blob on unmount
  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

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
          {/* Backdrop */}
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

          {/* Slide-out panel */}
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
              background: isDark ? '#1a1a1e' : '#eef1f6',
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
              {/* DOC branding */}
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

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Light/dark toggle */}
                <button
                  onClick={() => setDocLight(p => !p)}
                  title={docLight ? 'Switch to dark mode' : 'Switch to light mode'}
                  style={btnStyle}
                >
                  {docLight ? <Moon size={13} /> : <Sun size={13} />}
                </button>
                {/* Pop-out */}
                <button
                  onClick={handlePopOut}
                  title="Open in new window"
                  style={btnStyle}
                >
                  <ExternalLink size={13} />
                </button>
                {/* Close */}
                <button
                  onClick={onClose}
                  title="Close"
                  style={btnStyle}
                >
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