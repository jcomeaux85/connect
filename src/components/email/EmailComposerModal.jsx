import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Loader2, Paperclip, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { base44 } from '@/api/base44Client';
import { invokeAI } from '@/api/aiProvider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// PDF attachments stored on your server — add as many as needed
const SERVER_PDFS = [
  { label: 'Benefit Guide 2026', url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa7c4cb70fe91d38015eba/837165c78_DOC.html' },
  { label: 'Open Enrollment Form', url: '' },
  { label: 'COBRA Notice', url: '' },
  { label: 'FSA/HSA Enrollment', url: '' },
];

export default function EmailComposerModal({ isOpen, onClose, toEmail, toName }) {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [showPdfPicker, setShowPdfPicker] = useState(false);

  const handleAIWrite = async () => {
    setAiLoading(true);
    try {
      const result = await invokeAI({
        prompt: `Write a professional, friendly email to ${toName || 'a customer'} (${toEmail || ''}) about their employee benefits. 
Keep it concise (3-4 short paragraphs), warm, and helpful. 
Subject line should be relevant and professional.
Return JSON with "subject" and "body" fields only.`,
        response_json_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            body: { type: 'string' }
          },
          required: ['subject', 'body']
        }
      });
      setSubject(result.subject || '');
      setBody(result.body || '');
    } catch (e) {
      console.error('AI email error', e);
    }
    setAiLoading(false);
  };

  const togglePdf = (url) => {
    setSelectedPdfs(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleSend = () => {
    // Build mailto: URL — attaching files via mailto isn't universally supported,
    // but we include a note in the body listing which PDFs to attach manually.
    const attachmentNote = selectedPdfs.length > 0
      ? `\n\n---\nPlease attach the following document(s):\n${selectedPdfs.map(u => {
          const pdf = SERVER_PDFS.find(p => p.url === u);
          return `• ${pdf?.label || u}${u ? ` (${u})` : ''}`;
        }).join('\n')}`
      : '';

    const fullBody = body + attachmentNote;
    const mailto = `mailto:${encodeURIComponent(toEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
    window.open(mailto, '_blank');
    onClose();
  };

  const handleClose = () => {
    setSubject('');
    setBody('');
    setSelectedPdfs([]);
    setShowPdfPicker(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="w-full max-w-2xl rounded-3xl overflow-hidden"
          style={{
            background: colors.bg,
            boxShadow: `20px 20px 40px ${colors.shadowDark}, -20px -20px 40px ${colors.shadowLight}`
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: colors.border }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: colors.text }}>Compose Email</h2>
              <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                To: <span style={{ color: '#3B82F6' }}>{toName ? `${toName} <${toEmail}>` : toEmail || 'No email on file'}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAIWrite}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-0"
                style={{ ...getButtonStyle(), color: '#8B5CF6' }}
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                AI Write
              </button>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-xl border-0 flex items-center justify-center"
                style={getButtonStyle()}
              >
                <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Subject */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: colors.textSecondary }}>Subject</label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="rounded-2xl border-0 h-10"
                style={{ ...getInsetStyle(), color: colors.text }}
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: colors.textSecondary }}>Message</label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Type your message here, or click AI Write to generate one..."
                className="rounded-2xl border-0 min-h-48 resize-none"
                style={{ ...getInsetStyle(), color: colors.text }}
              />
            </div>

            {/* PDF Attachments */}
            <div>
              <button
                onClick={() => setShowPdfPicker(p => !p)}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border-0"
                style={{ ...getButtonStyle(), color: selectedPdfs.length > 0 ? '#3B82F6' : colors.textSecondary }}
              >
                <Paperclip className="w-3.5 h-3.5" />
                {selectedPdfs.length > 0 ? `${selectedPdfs.length} PDF(s) selected` : 'Attach PDF from server'}
                {showPdfPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <AnimatePresence>
                {showPdfPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2"
                  >
                    <div className="space-y-2 p-3 rounded-2xl" style={getInsetStyle()}>
                      {SERVER_PDFS.map(pdf => (
                        <label key={pdf.label} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPdfs.includes(pdf.url)}
                            onChange={() => pdf.url && togglePdf(pdf.url)}
                            disabled={!pdf.url}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm" style={{ color: pdf.url ? colors.text : colors.textTertiary }}>
                            {pdf.label}
                            {!pdf.url && <span className="text-xs ml-2" style={{ color: colors.textTertiary }}>(URL not set)</span>}
                          </span>
                        </label>
                      ))}
                      <p className="text-[11px] mt-2" style={{ color: colors.textTertiary }}>
                        Selected PDFs will be noted in the email body. Open Outlook to attach them.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: colors.border }}>
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border-0 text-sm"
              style={{ ...getButtonStyle(), color: colors.textSecondary }}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!toEmail || !subject.trim() || !body.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl border-0 text-sm font-semibold"
              style={{
                background: (!toEmail || !subject.trim() || !body.trim()) ? colors.bg : 'linear-gradient(135deg,#3B82F6,#2563EB)',
                color: (!toEmail || !subject.trim() || !body.trim()) ? colors.textTertiary : '#fff',
                boxShadow: (!toEmail || !subject.trim() || !body.trim()) ? `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}` : '0 4px 12px rgba(59,130,246,0.4)',
                cursor: (!toEmail || !subject.trim() || !body.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              <Send className="w-4 h-4" />
              Open in Outlook
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}