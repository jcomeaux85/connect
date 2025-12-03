import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function CollapsiblePanel({ 
  children, 
  title, 
  icon: Icon,
  storageKey,
  defaultCollapsed = false,
  condensedContent,
  className = '',
  headerExtra
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

  return (
    <div
      className={`border-0 rounded-2xl overflow-hidden ${className}`}
      style={{
        ...panelStyle,
        transition: `all ${getTransitionDuration(200)} ease-out`
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: colors.bg,
                boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`
              }}
            >
              <Icon className="w-4 h-4" style={{ color: colors.textSecondary }} />
            </div>
          )}
          {title && (
            <h3 className="font-semibold text-sm" style={{ color: colors.text }}>
              {title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Brightness Controls */}
          <div 
            className="flex items-center gap-1 mr-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => adjustBrightness(-1)}
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: colors.bg,
                boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}`,
                transition: `all ${getTransitionDuration(150)} ease-out`
              }}
            >
              <Minus className="w-3 h-3" style={{ color: colors.textTertiary }} />
            </button>
            <span 
              className="text-xs w-4 text-center" 
              style={{ color: colors.textTertiary }}
            >
              {brightness > 0 ? `+${brightness}` : brightness}
            </span>
            <button
              onClick={() => adjustBrightness(1)}
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: colors.bg,
                boxShadow: `2px 2px 4px ${colors.shadowDark}, -2px -2px 4px ${colors.shadowLight}`,
                transition: `all ${getTransitionDuration(150)} ease-out`
              }}
            >
              <Plus className="w-3 h-3" style={{ color: colors.textTertiary }} />
            </button>
          </div>

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
              <div className="px-4 pb-3">
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
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}