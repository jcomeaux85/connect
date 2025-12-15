import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import { X, Upload, Image as ImageIcon, FileText, Mail, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AttachmentsPanel({ isOpen, onClose, caseId }) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('image');
  const [imageFile, setImageFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const createAttachmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Attachment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-attachments', caseId] });
      resetForm();
    },
  });

  const resetForm = () => {
    setImageFile(null);
    setDocFile(null);
    setTextContent('');
    setTitle('');
    setNotes('');
    setActiveTab('image');
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      await createAttachmentMutation.mutateAsync({
        case_id: caseId,
        attachment_type: 'image',
        file_url,
        file_name: imageFile.name,
        title: title || imageFile.name,
        notes
      });
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!docFile) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: docFile });
      await createAttachmentMutation.mutateAsync({
        case_id: caseId,
        attachment_type: 'document',
        file_url,
        file_name: docFile.name,
        title: title || docFile.name,
        notes
      });
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim()) return;
    
    setUploading(true);
    try {
      await createAttachmentMutation.mutateAsync({
        case_id: caseId,
        attachment_type: textContent.includes('@') && textContent.includes('Subject:') ? 'email' : 'text',
        text_content: textContent,
        title: title || 'Text Content',
        notes
      });
      onClose();
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-[500px] z-[71] overflow-y-auto"
            style={{
              background: colors.bg,
              boxShadow: `-12px 0 24px ${colors.shadowDark}`
            }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
                  Add Attachment
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-xl"
                  style={{
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('image')}
                  className="flex-1 rounded-2xl h-12 flex items-center justify-center gap-2"
                  style={activeTab === 'image' ? {
                    background: colors.bg,
                    boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
                  } : {
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                >
                  <ImageIcon className="w-5 h-5" style={{ color: colors.iconColor }} />
                  <span className="text-sm font-medium" style={{ color: colors.text }}>Image</span>
                </button>
                <button
                  onClick={() => setActiveTab('document')}
                  className="flex-1 rounded-2xl h-12 flex items-center justify-center gap-2"
                  style={activeTab === 'document' ? {
                    background: colors.bg,
                    boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
                  } : {
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                >
                  <FileText className="w-5 h-5" style={{ color: colors.iconColor }} />
                  <span className="text-sm font-medium" style={{ color: colors.text }}>Document</span>
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className="flex-1 rounded-2xl h-12 flex items-center justify-center gap-2"
                  style={activeTab === 'text' ? {
                    background: colors.bg,
                    boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
                  } : {
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                >
                  <Mail className="w-5 h-5" style={{ color: colors.iconColor }} />
                  <span className="text-sm font-medium" style={{ color: colors.text }}>Text/Email</span>
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {activeTab === 'image' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                        Upload Image
                      </label>
                      <div
                        className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer"
                        style={{ borderColor: colors.border }}
                        onClick={() => document.getElementById('image-upload').click()}
                      >
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setImageFile(e.target.files[0])}
                        />
                        <Upload className="w-12 h-12 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {imageFile ? imageFile.name : 'Click to upload image'}
                        </p>
                      </div>
                    </div>
                    <Input
                      placeholder="Title (optional)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-2xl"
                      style={{
                        background: colors.bg,
                        boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                        color: colors.text,
                        border: 'none'
                      }}
                    />
                    <Textarea
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="rounded-2xl h-24"
                      style={{
                        background: colors.bg,
                        boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                        color: colors.text,
                        border: 'none'
                      }}
                    />
                    <Button
                      onClick={handleImageUpload}
                      disabled={!imageFile || uploading}
                      className="w-full rounded-2xl h-12"
                      style={{
                        background: colors.bg,
                        boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                        color: colors.text
                      }}
                    >
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload Image'}
                    </Button>
                  </>
                )}

                {activeTab === 'document' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                        Upload Document
                      </label>
                      <div
                        className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer"
                        style={{ borderColor: colors.border }}
                        onClick={() => document.getElementById('doc-upload').click()}
                      >
                        <input
                          id="doc-upload"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                          className="hidden"
                          onChange={(e) => setDocFile(e.target.files[0])}
                        />
                        <FileText className="w-12 h-12 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {docFile ? docFile.name : 'Click to upload document'}
                        </p>
                      </div>
                    </div>
                    <Input
                      placeholder="Title (optional)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-2xl"
                      style={{
                        background: colors.bg,
                        boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                        color: colors.text,
                        border: 'none'
                      }}
                    />
                    <Textarea
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="rounded-2xl h-24"
                      style={{
                        background: colors.bg,
                        boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                        color: colors.text,
                        border: 'none'
                      }}
                    />
                    <Button
                      onClick={handleDocumentUpload}
                      disabled={!docFile || uploading}
                      className="w-full rounded-2xl h-12"
                      style={{
                        background: colors.bg,
                        boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                        color: colors.text
                      }}
                    >
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload Document'}
                    </Button>
                  </>
                )}

                {activeTab === 'text' && (
                  <>
                    <Input
                      placeholder="Title (e.g., Email Subject)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-2xl"
                      style={{
                        background: colors.bg,
                        boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                        color: colors.text,
                        border: 'none'
                      }}
                    />
                    <Textarea
                      placeholder="Paste email or large text content here..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="rounded-2xl h-64"
                      style={{
                        background: colors.bg,
                        boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                        color: colors.text,
                        border: 'none'
                      }}
                    />
                    <Textarea
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="rounded-2xl h-24"
                      style={{
                        background: colors.bg,
                        boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                        color: colors.text,
                        border: 'none'
                      }}
                    />
                    <Button
                      onClick={handleTextSubmit}
                      disabled={!textContent.trim() || uploading}
                      className="w-full rounded-2xl h-12"
                      style={{
                        background: colors.bg,
                        boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                        color: colors.text
                      }}
                    >
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Text'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}