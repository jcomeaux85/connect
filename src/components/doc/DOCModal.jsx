import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const DOC_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa7c4cb70fe91d38015eba/837165c78_DOC.html';

export default function DOCModal({ isOpen, onClose }) {
  const { colors } = useTheme();
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !htmlContent) {
      setLoading(true);
      fetch(DOC_URL)
        .then(res => res.text())
        .then(html => {
          setHtmlContent(html);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  const handlePopOut = () => {
    if (htmlContent) {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
      // Revoke after a delay to allow the window to load
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } else {
      window.open(DOC_URL, '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {/* Ultra-thin top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-end px-3" style={{ height: '22px', background: `${colors.bg}cc`, borderBottom: `1px solid ${colors.border}` }}>
          <button onClick={handlePopOut} className="text-[10px] font-medium border-0 bg-transparent cursor-pointer hover:underline" style={{ color: colors.textSecondary }}>pop out</button>
          <span className="mx-2 text-[10px]" style={{ color: colors.border }}>·</span>
          <button onClick={onClose} className="text-[10px] font-medium border-0 bg-transparent cursor-pointer hover:underline" style={{ color: colors.textSecondary }}>close</button>
        </div>

        {loading && (
          <div className="w-full h-full flex items-center justify-center" style={{ background: colors.bg }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.textSecondary }} />
          </div>
        )}

        {htmlContent && !loading && (
          <iframe
            srcDoc={htmlContent}
            className="w-full"
            style={{ border: 'none', display: 'block', height: 'calc(100% - 22px)', marginTop: '22px' }}
            title="DOC Directory"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}