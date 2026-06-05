import React from 'react';
import CorpsPillHeader from './CorpsPillHeader';

export default function CoreLayout({ activeSection, onNavigate, children }) {
  return (
    <div className="corps-neu flex flex-col h-full bg-[#e8e8ee]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Neumorphic pill header — search + section nav (replaces the B|c hanging nav on CORPS) */}
      <CorpsPillHeader activeSection={activeSection} onNavigate={onNavigate} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}