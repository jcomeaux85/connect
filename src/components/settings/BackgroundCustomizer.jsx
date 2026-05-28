import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image, Palette, Check } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const TEXTURE_PRESETS = [
  { id: 'none', label: 'None', value: null },
  { id: 'dots', label: 'Dots', value: 'radial-gradient(circle, rgba(120,120,120,0.25) 1px, transparent 1px)', size: '20px 20px' },
  { id: 'grid', label: 'Grid', value: 'linear-gradient(to right, rgba(120,120,120,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,120,0.15) 1px, transparent 1px)', size: '40px 40px' },
  { id: 'diagonal', label: 'Diagonal', value: 'repeating-linear-gradient(45deg, rgba(120,120,120,0.12) 0, rgba(120,120,120,0.12) 1px, transparent 0, transparent 10px)', size: 'auto' },
  { id: 'crosshatch', label: 'Crosshatch', value: 'repeating-linear-gradient(0deg, rgba(120,120,120,0.1) 0, rgba(120,120,120,0.1) 1px, transparent 0, transparent 20px), repeating-linear-gradient(90deg, rgba(120,120,120,0.1) 0, rgba(120,120,120,0.1) 1px, transparent 0, transparent 20px)', size: 'auto' },
];

export default function BackgroundCustomizer({ isOpen, onClose }) {
  const { colors, backgroundSettings, updateBackgroundSettings, getTransitionDuration } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(backgroundSettings?.preset || 'none');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateBackgroundSettings({ type: 'image', value: file_url, preset: null });
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.id);
    if (preset.id === 'none') {
      updateBackgroundSettings({ type: 'solid', value: null, preset: 'none' });
    } else {
      updateBackgroundSettings({ type: 'texture', value: preset.value, preset: preset.id, size: preset.size });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: parseFloat(getTransitionDuration(200)) / 1000 }}
          className="w-full max-w-md rounded-2xl p-6"
          style={{
            background: colors.bg,
            boxShadow: `20px 20px 40px ${colors.shadowDark}, -20px -20px 40px ${colors.shadowLight}`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold" style={{ color: colors.text }}>
              Customize Background
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: colors.bg,
                boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
              }}
            >
              <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
            </button>
          </div>

          {/* Upload Custom Image */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
              Custom Image
            </label>
            <label
              className="flex items-center justify-center gap-2 p-4 rounded-2xl cursor-pointer"
              style={{
                background: colors.bg,
                boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploading ? (
                <span style={{ color: colors.textSecondary }}>Uploading...</span>
              ) : (
                <>
                  <Upload className="w-5 h-5" style={{ color: colors.textSecondary }} />
                  <span style={{ color: colors.textSecondary }}>Upload Image</span>
                </>
              )}
            </label>
          </div>

          {/* Texture Presets */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
              Texture Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TEXTURE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-3 rounded-xl text-xs font-medium relative"
                  style={{
                    background: colors.bg,
                    boxShadow: selectedPreset === preset.id 
                      ? `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
                      : `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                    color: colors.textSecondary
                  }}
                >
                  {preset.label}
                  {selectedPreset === preset.id && (
                    <Check className="w-3 h-3 absolute top-1 right-1" style={{ color: '#10B981' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {backgroundSettings?.value && (
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block" style={{ color: colors.textSecondary }}>
                Current Background
              </label>
              <div
                className="h-20 rounded-xl overflow-hidden"
                style={{
                  background: backgroundSettings.type === 'image' 
                    ? `url(${backgroundSettings.value}) center/cover`
                    : backgroundSettings.value,
                  boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
                }}
              />
            </div>
          )}

          <Button
            onClick={() => updateBackgroundSettings({ type: 'solid', value: null, preset: 'none' })}
            className="w-full rounded-2xl h-10 border-0"
            style={{
              background: colors.bg,
              boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
              color: colors.textSecondary
            }}
          >
            Reset to Default
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}