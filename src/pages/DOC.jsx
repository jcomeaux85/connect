import React, { useState, useEffect } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const DOC_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa7c4cb70fe91d38015eba/837165c78_DOC.html';

export default function DOC() {
  const { colors } = useTheme();
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

  const handlePopOut = () => {
    if (htmlContent) {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } else {
      window.open(DOC_URL, '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
    }
  };

  return (
    <div className="flex flex-col" style={{ height: '100%', background: colors.bg }}>
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.textSecondary }} />
        </div>
      )}

      {htmlContent && !loading && (
        <iframe
          srcDoc={htmlContent}
          className="flex-1 w-full"
          style={{ border: 'none', display: 'block' }}
          title="DOC Directory"
          sandbox="allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
}