import React from "react";
import { X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function PDFViewer({ pdfUrl, title, onClose }) {
  const { colors, getButtonStyle } = useTheme();

  if (!pdfUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full h-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden"
          style={{
            background: colors.bg,
            boxShadow: `20px 20px 40px ${colors.shadowDark}, -20px -20px 40px ${colors.shadowLight}`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: colors.border }}
          >
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
              {title || 'Document Viewer'}
            </h3>
            <div className="flex gap-2">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl h-10 px-4 border-0 flex items-center gap-2"
                style={getButtonStyle()}
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </a>
              <a
                href={pdfUrl}
                download
                className="rounded-2xl h-10 px-4 border-0 flex items-center gap-2"
                style={getButtonStyle()}
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <Button
                onClick={onClose}
                className="rounded-2xl h-10 px-4 border-0"
                style={getButtonStyle()}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="w-full h-[calc(100%-64px)]">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={title || 'PDF Document'}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}