import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const DOC_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa7c4cb70fe91d38015eba/837165c78_DOC.html';

export default function DOCModal({ isOpen, onClose }) {
  const { colors } = useTheme();

  const handlePopOut = () => {
    window.open(DOC_URL, '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
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
        {/* Control buttons - floating top-right */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            onClick={handlePopOut}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            title="Open in new window"
            style={{
              background: colors.bg,
              boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`
            }}
          >
            <ExternalLink className="w-4 h-4" style={{ color: colors.iconColor }} />
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: colors.bg,
              boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`
            }}
          >
            <X className="w-5 h-5" style={{ color: colors.iconColor }} />
          </button>
        </div>

        {/* Full-screen DOC iframe */}
        <iframe
          src={DOC_URL}
          className="w-full h-full"
          style={{ border: 'none', display: 'block' }}
          title="DOC Directory"
        />
      </motion.div>
    </AnimatePresence>
  );
}