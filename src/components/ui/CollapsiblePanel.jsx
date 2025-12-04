import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
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
  accentColor, // New prop for glow color
  largerIcon = false // New prop for larger header icon
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
      {/* Vertical Brightness Slider - Left Edge */}
      <div 
        className="absolute left-1 top-1/2 -translate-y-1/2 w-[3px] h-16 z-10 rounded-full"
        style={{
          background: colors.textTertiary + '40',
          boxShadow: `inset 1px 1px 2px ${colors.shadowDark}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Track fill based on brightness - always grey */}
        <div 
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-200"
          style={{
            height: `${((brightness + 3) / 6) * 100}%`,
            background: colors.textTertiary + '80'
          }}
        />
        {/* Draggable thumb - keeps accent color */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full cursor-pointer hover:scale-150 transition-transform"
          style={{
            bottom: `calc(${((brightness + 3) / 6) * 100}% - 3px)`,
            background: accentColor || colors.textSecondary,
            boxShadow: accentColor ? `0 0 4px ${accentColor}` : 'none'
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            const track = e.currentTarget.parentElement;
            const trackRect = track.getBoundingClientRect();
            
            const handleMove = (moveEvent) => {
              const y = moveEvent.clientY;
              const relativeY = trackRect.bottom - y;
              const percentage = Math.max(0, Math.min(1, relativeY / trackRect.height));
              const newBrightness = Math.round(percentage * 6) - 3;
              setBrightness(newBrightness);
            };
            
            const handleUp = () => {
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleUp);
            };
            
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
          }}
        />
      </div>

      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 pl-7 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={`${largerIcon ? 'w-10 h-10' : 'w-8 h-8'} rounded-xl flex items-center justify-center`}
              style={{
                background: accentColor ? `${accentColor}20` : colors.bg,
                boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`
              }}
            >
              <Icon className={largerIcon ? 'w-5 h-5' : 'w-4 h-4'} style={{ color: accentColor || colors.textSecondary }} />
            </div>
          )}
          {title && (
            <h3 className="font-semibold text-sm" style={{ color: panelStyle.textColor || colors.text, textShadow: panelStyle.textShadow || 'none' }}>
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
              style={{ color: panelStyle.textColor || colors.text, textShadow: panelStyle.textShadow || 'none' }}
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
            style={{ color: panelStyle.textColor || colors.text, textShadow: panelStyle.textShadow || 'none' }}
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