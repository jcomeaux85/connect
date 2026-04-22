import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const DOC_URL = 'https://ndrndr.com/alera/doc/index.html';

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


        {loading && (
          <div className="w-full h-full flex items-center justify-center" style={{ background: colors.bg }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.textSecondary }} />
          </div>
        )}

        {htmlContent && !loading && (
          <iframe
            srcDoc={htmlContent}
            className="w-full h-full"
            style={{ border: 'none', display: 'block' }}
            title="DOC Directory"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}