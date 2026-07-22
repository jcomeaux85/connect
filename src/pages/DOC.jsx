import React, { useState, useEffect } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const DOC_HTML_URL = 'https://media.base44.com/files/public/68fa7c4cb70fe91d38015eba/c1547e610_DOC_.html';

export default function DOC() {
  const { colors, isDark } = useTheme();
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(DOC_HTML_URL)
      .then(res => res.text())
      .then(html => {
        setHtmlContent(html);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePopOut = () => {
    window.open(DOC_HTML_URL, '_blank', 'width=1200,height=860,menubar=no,toolbar=no,location=no');
  };

  return (
    <div style={{ height: '100%', background: isDark ? '#1a1a1e' : '#e0e0e0', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Minimal top strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 20px', flexShrink: 0,
        background: isDark ? '#111114' : '#d0d0d0',
        borderBottom: `1px solid ${isDark ? '#2a2a2e' : '#c0c0c0'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <img
            src="https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/158bf0016_doc_teams_icon_192b.png"
            alt="DOC"
            style={{ height: '26px', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
          <span style={{ fontSize: '9px', fontFamily: 'IBM Plex Mono, monospace', color: isDark ? '#555' : '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Directory of Coverage
          </span>
        </div>
        <button
          onClick={handlePopOut}
          title="Open in new window"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: isDark ? '#2a2a2e' : '#d8d8d8',
            boxShadow: isDark ? '3px 3px 6px #101013,-3px -3px 6px #242428' : '3px 3px 6px #bebebe,-3px -3px 6px #fff',
            color: isDark ? '#888' : '#666', fontSize: '11px', fontFamily: 'IBM Plex Mono, monospace',
          }}
        >
          <ExternalLink size={12} /> Pop out
        </button>
      </div>

      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px',
            letterSpacing: '3px', color: '#dc2626', textTransform: 'uppercase',
          }}>
            Loading DOC™…
          </div>
          <Loader2 size={20} style={{ color: '#dc2626', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      {htmlContent && !loading && (
        <iframe
          srcDoc={htmlContent}
          style={{ flex: 1, width: '100%', border: 'none', display: 'block', minHeight: 0 }}
          title="DOC Directory"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  );
}