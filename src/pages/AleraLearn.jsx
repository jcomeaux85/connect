import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Layers, ClipboardCheck, ChevronLeft } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import AudioGatedModules from '@/components/learn/AudioGatedModules';
import FlashCards from '@/components/learn/FlashCards';
import SpecifiedTrainings from '@/components/learn/SpecifiedTrainings';

// ALERA LEARN — the unified learning hub.
// Three categories, all with deadlines:
//   1. Audio Gated Modules — audio + text, quiz questions AFTER audio completes
//   2. Flash Cards — deck selection, flip cards, swipe to mark known/unknown
//   3. Specified Trainings — assigned trainings with deadlines

const CATEGORIES = [
  {
    id: 'audio_gated',
    label: 'Audio Gated Modules',
    icon: Volume2,
    accent: '#7c3aed',
    description: 'Listen to audio modules, then answer quiz questions after the audio completes.',
  },
  {
    id: 'flash_cards',
    label: 'Flash Cards',
    icon: Layers,
    accent: '#0891b2',
    description: 'Study flashcard decks — flip cards, swipe to mark known/unknown, track your progress.',
  },
  {
    id: 'specified_trainings',
    label: 'Specified Trainings',
    icon: ClipboardCheck,
    accent: '#f59e0b',
    description: 'Assigned training modules with deadlines. Complete before the due date.',
  },
];

export default function AleraLearn() {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const [activeSection, setActiveSection] = useState(null);

  if (activeSection === 'audio_gated') {
    return (
      <>
        <SectionHeader
          title="Audio Gated Modules"
          onBack={() => setActiveSection(null)}
          colors={colors}
          getButtonStyle={getButtonStyle}
        />
        <AudioGatedModules />
      </>
    );
  }

  if (activeSection === 'flash_cards') {
    return (
      <>
        <SectionHeader
          title="Flash Cards"
          onBack={() => setActiveSection(null)}
          colors={colors}
          getButtonStyle={getButtonStyle}
        />
        <FlashCards />
      </>
    );
  }

  if (activeSection === 'specified_trainings') {
    return (
      <>
        <SectionHeader
          title="Specified Trainings"
          onBack={() => setActiveSection(null)}
          colors={colors}
          getButtonStyle={getButtonStyle}
        />
        <SpecifiedTrainings />
      </>
    );
  }

  // Landing page — three category cards
  return (
    <div className="min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8 text-center">
          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(28px, 4vw, 42px)',
            color: colors.text,
            letterSpacing: '0.02em',
            marginBottom: '8px',
          }}>
            ALERA <span style={{ color: '#40E0D0' }}>|</span> LEARN
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            Choose a learning category to get started — all modules have deadlines
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          maxWidth: '900px',
          margin: '0 auto',
        }}>
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                onClick={() => setActiveSection(cat.id)}
                style={{
                  ...getButtonStyle(),
                  borderRadius: '20px',
                  padding: '28px 24px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: `${cat.accent}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon className="w-6 h-6" style={{ color: cat.accent }} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: colors.text,
                    marginBottom: '6px',
                  }}>
                    {cat.label}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: colors.textSecondary,
                    lineHeight: 1.5,
                  }}>
                    {cat.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, onBack, colors, getButtonStyle }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 24px',
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <button
        onClick={onBack}
        style={{
          ...getButtonStyle(),
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          color: colors.textSecondary,
        }}
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.text }}>
        {title}
      </h2>
    </div>
  );
}