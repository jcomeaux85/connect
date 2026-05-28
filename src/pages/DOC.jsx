import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const DOC_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa7c4cb70fe91d38015eba/837165c78_DOC.html';

export default function DOC() {
  const { colors, isDark } = useTheme();
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(DOC_URL)
      .then(res => res.text())
      .then(html => {
        setHtmlContent(html);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Inject BC theme + purple sidebar/client bar overrides
  const themedHtml = htmlContent ? htmlContent.replace(
    '</head>',
    `<style>
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

      :root {
        --bc-bg: ${colors.bg};
        --bc-text: ${colors.text};
        --bc-border: ${colors.border};
        --doc-purple: #6d28d9;
        --doc-purple-light: #8b5cf6;
        --doc-purple-dark: #4c1d95;
      }

      html, body {
        background-color: ${colors.bg} !important;
        color: ${colors.text} !important;
      }

      /* ── SIDEBAR / LEFT RAIL → purple ── */
      .left-rail, #leftRail, [class*="left-rail"], [class*="sidebar"], [id*="sidebar"],
      .nav-rail, #navRail {
        background: linear-gradient(180deg, #3b0764 0%, #4c1d95 100%) !important;
        border-right: 1px solid rgba(139,92,246,0.4) !important;
      }
      .left-rail *, .nav-rail *, #leftRail * {
        color: rgba(255,255,255,0.85) !important;
      }
      .left-rail .active, .nav-rail .active, #leftRail .active {
        background: rgba(139,92,246,0.4) !important;
        color: #ffffff !important;
      }

      /* ── COMPANY/CLIENT INFO BAR → purple ── */
      .company-info, #companyInfo {
        background: linear-gradient(135deg, #3b0764 0%, #5b21b6 100%) !important;
        border-radius: 10px !important;
        padding: 10px 14px !important;
        border: 1px solid rgba(139,92,246,0.4) !important;
        box-shadow: 0 4px 20px rgba(109,40,217,0.35) !important;
      }
      .company-info *, #companyInfo * {
        color: rgba(255,255,255,0.9) !important;
      }
      .company-info a, #companyInfo a {
        color: #c4b5fd !important;
      }
      .ci-label {
        color: rgba(196,181,253,0.7) !important;
        font-weight: 600 !important;
        font-size: 9px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
      }
      .ci-accent {
        border-left: 3px solid #8b5cf6 !important;
        padding-left: 8px !important;
      }

      /* ── CARRIER / CLIENT BAR → purple strip ── */
      .sticky-bar, #stickyBar {
        background: linear-gradient(135deg, rgba(59,7,100,0.95) 0%, rgba(91,33,182,0.95) 100%) !important;
        border-top: 1px solid rgba(139,92,246,0.3) !important;
        border-bottom: 1px solid rgba(139,92,246,0.3) !important;
        padding: 4px 12px !important;
      }
      .carrier-strip, #carrierStrip {
        background: transparent !important;
      }
      .carrier-link img {
        filter: brightness(1.1) !important;
        opacity: 0.9 !important;
      }
      .carrier-link:hover img {
        opacity: 1 !important;
      }

      /* ── STICKY HEADER → deep purple ── */
      .sticky-header, #stickyHeader {
        background: linear-gradient(180deg, #14004d 0%, #1e0066 100%) !important;
        border-bottom: 1px solid rgba(139,92,246,0.3) !important;
        box-shadow: 0 4px 20px rgba(20,0,77,0.5) !important;
      }

      /* ── CAT NAV LINKS → purple accent ── */
      .cat-link {
        color: rgba(196,181,253,0.85) !important;
        border: none !important;
        background: transparent !important;
      }
      .cat-link:hover, .cat-link.active {
        color: #ffffff !important;
        background: rgba(139,92,246,0.25) !important;
        border-radius: 4px !important;
      }

      /* ── MODE TOGGLE → purple ── */
      .mode-btn.active, .mode-btn:focus {
        background: rgba(139,92,246,0.4) !important;
        border-color: rgba(139,92,246,0.6) !important;
        color: #ffffff !important;
      }

      ${isDark ? `
        input, select, textarea {
          background: rgba(255,255,255,0.08) !important;
          color: ${colors.text} !important;
          border-color: rgba(139,92,246,0.3) !important;
        }
      ` : ''}
    </style>
    </head>`
  ) : null;

  return (
    <div style={{ height: '100%', background: colors.bg, display: 'flex', flexDirection: 'column' }}>
      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.textSecondary }} />
        </div>
      )}
      {themedHtml && !loading && (
        <iframe
          srcDoc={themedHtml}
          style={{ flex: 1, width: '100%', border: 'none', display: 'block', minHeight: 0 }}
          title="DOC Directory"
          sandbox="allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
}