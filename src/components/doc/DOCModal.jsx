import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, FileText } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function DOCModal({ isOpen, onClose }) {
  const { colors } = useTheme();
  const [iframeKey, setIframeKey] = useState(0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        onClick={onClose}
      >
        {/* Blur backdrop */}
        <div 
          className="absolute inset-0 backdrop-blur-md"
          style={{ background: `${colors.bg}40` }}
        />

        {/* DOC Container - Floating without background */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-[95vw] h-[90vh] rounded-3xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Floating */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: colors.bg,
              boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`
            }}
          >
            <X className="w-5 h-5" style={{ color: colors.iconColor }} />
          </button>

          {/* DOC iframe - No background, just floating content */}
          <iframe
            key={iframeKey}
            srcDoc={`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>
  fetch('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa7c4cb70fe91d38015eba/837165c78_DOC.html')
    .then(r => r.text())
    .then(html => document.write(html));
</script>
</head>
<body>Loading DOC...</body>
</html>`}
            className="w-full h-full rounded-3xl"
            style={{ border: 'none' }}
            title="DOC Directory"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}