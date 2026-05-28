import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const DOC_HTML_URL = 'https://media.base44.com/files/public/68fa7c4cb70fe91d38015eba/c1547e610_DOC_.html';

export default function DOCModal({ isOpen, onClose }) {
  const { isDark } = useTheme();
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (isOpen && !htmlContent) {
      setLoading(true);
      fetch(DOC_HTML_URL)
        .then(r => r.text())
        .then(html => {
          // Inject theme sync + hide the original left sidebar rail (we're in slide-out mode)
          const patched = html.replace('</head>', `
<style>
  /* ── Slide-out overrides ── */
  .side-rail { display: none !important; }
  .main-wrap { margin-left: 0 !important; }
  .client-rail {
    padding-left: 12px !important;
    top: 0 !important;
  }
  .container { padding: 16px 14px 30px !important; }
  .clock-weather { position: static !important; margin-bottom: 8px; }
  html, body { overflow-x: hidden !important; }
  /* compact benefit nav */
  .benefit-nav { gap: 5px !important; }
  .ben-btn { padding: 7px 12px !important; font-size: .75rem !important; }
  /* results always visible */
  .result-details { grid-template-columns: 1fr !important; }
  /* mobile-friendly result cards */
  .result-card { padding-right: 22px !important; }
  .result-pin, .quick-copy { position: static; opacity: 1; display: inline-flex; margin-top: 8px; margin-right: 4px; }
</style>
</head>`);
          setHtmlContent(patched);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  const handlePopOut = () => {
    window.open(DOC_HTML_URL, '_blank', 'width=1100,height=820,menubar=no,toolbar=no,location=no');
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

          {/* Slide-out panel — mobile phone width */}
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
              background: isDark ? '#1a1a1e' : '#e0e0e0',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header bar */}
            <div
              className="flex items-center justify-between flex-shrink-0 px-4 py-2"
              style={{
                background: isDark ? '#111114' : '#d0d0d0',
                borderBottom: `1px solid ${isDark ? '#2a2a2e' : '#c0c0c0'}`,
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
                    : '2px 2px 4px #bebebe, -1px -1px 2px #fff',
                }}>
                  DOC<sup style={{ fontSize: '.45rem', opacity: .5, verticalAlign: 'super' }}>™</sup>
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'IBM Plex Mono, monospace', color: isDark ? '#666' : '#999', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Directory of Coverage
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePopOut}
                  title="Open in new window"
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: 'none',
                    background: isDark ? '#2a2a2e' : '#d8d8d8',
                    boxShadow: isDark
                      ? '3px 3px 6px #101013, -3px -3px 6px #242428'
                      : '3px 3px 6px #bebebe, -3px -3px 6px #fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isDark ? '#888' : '#666',
                  }}
                >
                  <ExternalLink size={13} />
                </button>
                <button
                  onClick={onClose}
                  title="Close"
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: 'none',
                    background: isDark ? '#2a2a2e' : '#d8d8d8',
                    boxShadow: isDark
                      ? '3px 3px 6px #101013, -3px -3px 6px #242428'
                      : '3px 3px 6px #bebebe, -3px -3px 6px #fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isDark ? '#888' : '#666',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: isDark ? '#1a1a1e' : '#e0e0e0' }}>
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
              {htmlContent && !loading && (
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
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