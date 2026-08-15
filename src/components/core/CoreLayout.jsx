import React from 'react';
import CorpsPillHeader from './CorpsPillHeader';
import CorpsChatBar from './CorpsChatBar';
import { useTheme } from '@/components/ThemeProvider';

export default function CoreLayout({ activeSection, onNavigate, children }) {
  const { isDark, colors } = useTheme();

  return (
    <div
      className="corps-neu flex flex-col h-full"
      style={{ fontFamily: "'Inter', sans-serif", background: isDark ? '#2a2e3a' : '#e8e8ee' }}
    >
      {/* Neumorphic pill header — search + section nav (replaces the B|c hanging nav on CORPS) */}
      <CorpsPillHeader activeSection={activeSection} onNavigate={onNavigate} />

      {/* AI command bar — chat with CORPS AI like an AI provider */}
      <CorpsChatBar />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}