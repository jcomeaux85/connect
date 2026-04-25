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

  // Inject BC theme colors into the iframe HTML
  const themedHtml = htmlContent ? htmlContent.replace(
    '</head>',
    `<style>
      :root {
        --bc-bg: ${colors.bg};
        --bc-text: ${colors.text};
        --bc-text-secondary: ${colors.textSecondary};
        --bc-border: ${colors.border};
        --bc-shadow-dark: ${colors.shadowDark};
        --bc-shadow-light: ${colors.shadowLight};
      }
      html, body {
        background-color: ${colors.bg} !important;
        color: ${colors.text} !important;
      }
      ${isDark ? `
        /* Override common dark elements to match BC dark mode */
        [style*="background: #1"], [style*="background:#1"],
        [style*="background: #2"], [style*="background:#2"],
        [style*="background-color: #1"], [style*="background-color:#1"],
        [style*="background-color: #2"], [style*="background-color:#2"] {
          background-color: ${colors.bg} !important;
        }
        input, select, textarea {
          background: ${colors.cardBg} !important;
          color: ${colors.text} !important;
          border-color: ${colors.border} !important;
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