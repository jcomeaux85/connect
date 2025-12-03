import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function CollapsiblePanel({ 
  children, 
  title, 
  icon: Icon,
  storageKey,
  defaultCollapsed = false,
  condensedContent,
  className = '',
  headerExtra,
  accentColor // New prop for glow color
}) {
  const { colors, getPanelStyle, getTransitionDuration } = useTheme();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`panel-collapsed-${storageKey}`);
      return saved ? JSON.parse(saved) : defaultCollapsed;
    }
    return defaultCollapsed;
  });

  const [brightness, setBrightness] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`panel-brightness-${storageKey}`);
      return saved ? parseInt(saved) : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`panel-collapsed-${storageKey}`, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, storageKey]);

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`panel-brightness-${storageKey}`, brightness.toString());
    }
  }, [brightness, storageKey]);

  const adjustBrightness = (delta) => {
    setBrightness(prev => Math.max(-3, Math.min(3, prev + delta)));
  };

  const panelStyle = getPanelStyle(brightness);
  
  // Calculate glow based on brightness and accent color
  const getGlowStyle = () => {
    if (brightness <= 0 || !accentColor) return {};
    const glowIntensity = brightness * 10;
    return {
      boxShadow: `0 0 ${glowIntensity * 2}px ${accentColor}40, 0 0 ${glowIntensity * 4}px ${accentColor}20, ${panelStyle.boxShadow}`
    };
  };

  return (
    <div
      className={`border-0 rounded-2xl overflow-hidden relative ${className}`}
      style={{
        ...panelStyle,
        ...getGlowStyle(),
        transition: `all ${getTransitionDuration(200)} ease-out`
      }}
    >
      {/* Vertical Brightness Dial - Left Edge */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-5 flex flex-col items-center justify-center gap-1 z-10"
        style={{
          background: `linear-gradient(to right, ${colors.shadowDark}30, transparent)`,
          borderRadius: '18px 0 0 18px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => adjustBrightness(1)}
          className="w-4 h-6 rounded-t-lg flex items-center justify-center hover:scale-110 transition-transform"
          style={{
            background: colors.cardBg,
            boxShadow: `1px 1px 2px ${colors.shadowDark}, -1px -1px 2px ${colors.shadowLight}`
          }}
        >
          <ChevronUp className="w-3 h-3" style={{ color: brightness >= 3 ? colors.textTertiary : (accentColor || colors.textSecondary) }} />
        </button>
        <div 
          className="text-[9px] font-bold w-4 text-center"
          style={{ color: accentColor || colors.textTertiary }}
        >
          {brightness > 0 ? `+${brightness}` : brightness}
        </div>
        <button
          onClick={() => adjustBrightness(-1)}
          className="w-4 h-6 rounded-b-lg flex items-center justify-center hover:scale-110 transition-transform"
          style={{
            background: colors.cardBg,
            boxShadow: `1px 1px 2px ${colors.shadowDark}, -1px -1px 2px ${colors.shadowLight}`
          }}
        >
          <ChevronDown className="w-3 h-3" style={{ color: brightness <= -3 ? colors.textTertiary : colors.textSecondary }} />
        </button>
      </div>

      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 pl-7 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: accentColor ? `${accentColor}20` : colors.bg,
                boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`
              }}
            >
              <Icon className="w-4 h-4" style={{ color: accentColor || colors.textSecondary }} />
            </div>
          )}
          {title && (
            <h3 className="font-semibold text-sm" style={{ color: colors.text }}>
              {title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-2">
          {headerExtra}

          {/* Collapse Toggle */}
          <motion.div
            animate={{ rotate: isCollapsed ? -90 : 0 }}
            transition={{ duration: parseFloat(getTransitionDuration(200)) / 1000 }}
          >
            <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isCollapsed ? (
          condensedContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: parseFloat(getTransitionDuration(200)) / 1000 }}
              className="overflow-hidden"
            >
              <div className="px-4 pl-7 pb-3">
                {condensedContent}
              </div>
            </motion.div>
          )
        ) : (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: parseFloat(getTransitionDuration(200)) / 1000 }}
            className="overflow-hidden"
          >
            <div className="px-4 pl-7 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}