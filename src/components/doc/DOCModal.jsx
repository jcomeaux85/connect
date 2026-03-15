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

        {/* DOC Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-[95vw] h-[90vh] rounded-3xl overflow-hidden"
          style={{
            background: colors.bg,
            boxShadow: `0 20px 60px ${colors.shadowDark}, 0 -10px 40px ${colors.shadowLight}`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b"
            style={{ 
              borderColor: colors.border,
              background: colors.bg
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                }}
              >
                <FileText className="w-5 h-5" style={{ color: '#dc2626' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: colors.text }}>
                  DOC™ — Directory of Coverage
                </h2>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  Search and reference benefit information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: colors.bg,
                boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
              }}
            >
              <X className="w-5 h-5" style={{ color: colors.iconColor }} />
            </button>
          </div>

          {/* DOC iframe */}
          <iframe
            key={iframeKey}
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa7c4cb70fe91d38015eba/837165c78_DOC.html"
            className="w-full h-[calc(100%-72px)]"
            style={{ border: 'none' }}
            title="DOC Directory"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}