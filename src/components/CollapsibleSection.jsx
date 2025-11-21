import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';

export default function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = false, 
  storageKey,
  tier = 1, // 1 = Primary (frosted), 2 = Secondary (border), 3 = Flat accordion
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { colors, getButtonStyle, getInsetStyle } = useTheme();

  // Persist state in localStorage
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`collapse_${storageKey}`);
      if (saved !== null) {
        setIsOpen(saved === 'true');
      }
    }
  }, [storageKey]);

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (storageKey) {
      localStorage.setItem(`collapse_${storageKey}`, newState.toString());
    }
  };

  // Tier 1: Full frosted card (Call Interface, SMS, Notes, AI Tools)
  if (tier === 1) {
    return (
      <div 
        className={`border-0 ${className}`}
        style={{
          background: colors.bg,
          boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`,
          borderRadius: '18px',
          overflow: 'hidden'
        }}
      >
        <button
          onClick={toggleOpen}
          className="w-full px-5 py-4 flex items-center justify-between border-0"
          style={{ background: 'transparent' }}
        >
          <h3 className="section-header m-0" style={{ color: colors.text, opacity: 1 }}>
            {title}
          </h3>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
          </motion.div>
        </button>
        
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-5 pb-5">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Tier 2: Thin border only (Customer Info, Follow-ups, Carrier Info)
  if (tier === 2) {
    return (
      <div 
        className={`${className}`}
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: '18px',
          overflow: 'hidden'
        }}
      >
        <button
          onClick={toggleOpen}
          className="w-full px-5 py-4 flex items-center justify-between border-0"
          style={{ background: 'transparent' }}
        >
          <h3 className="section-header m-0" style={{ color: colors.text, opacity: 1 }}>
            {title}
          </h3>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
          </motion.div>
        </button>
        
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-5 pb-5">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Tier 3: Flat accordion bar (Call logs, Transcripts, Activity timeline)
  return (
    <div className={className}>
      <button
        onClick={toggleOpen}
        className="w-full px-4 py-3 flex items-center justify-between border-0 rounded-xl"
        style={getButtonStyle()}
      >
        <h3 className="section-header m-0" style={{ color: colors.text, opacity: 1 }}>
          {title}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" style={{ color: colors.textSecondary }} />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}