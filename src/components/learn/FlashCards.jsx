import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar, Layers } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { SEED_DECKS } from '@/data/flashcardDecks';

// Flash Cards — deck selection grid, flip card study screen, swipe controls.
// Recreated from the ALERA LEARN flash HTML structure.
// All decks have deadlines.

export default function FlashCards() {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const [activeDeck, setActiveDeck] = useState(null);

  const { data: decks = [], isLoading } = useQuery({
    queryKey: ['flashcard-decks'],
    queryFn: async () => {
      const result = await base44.entities.FlashcardDeck.filter({ is_active: true }, 'name', 50);
      return result.length > 0 ? result : SEED_DECKS;
    }
  });

  // Deck selection screen
  if (!activeDeck) {
    return (
      <div className="min-h-screen" style={{ background: colors.bg, padding: '24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Layers className="w-8 h-8 mx-auto animate-pulse" style={{ color: colors.textSecondary }} />
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {decks.map((deck, i) => (
                <motion.button
                  key={deck.id || i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  onClick={() => setActiveDeck(deck)}
                  style={{
                    ...getButtonStyle(),
                    borderRadius: '18px',
                    padding: '22px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top accent bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, #0891b2, #06b6d4)',
                  }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.text, marginBottom: '6px' }}>
                    {deck.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.4, marginBottom: '14px' }}>
                    {deck.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '10px',
                      background: '#0891b215', color: '#0891b2',
                    }}>
                      {deck.cards?.length || 0} cards
                    </span>
                    {deck.deadline && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '11px', fontWeight: 600, color: '#f59e0b',
                      }}>
                        <Calendar className="w-3 h-3" />
                        {new Date(deck.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Study screen
  return <StudyScreen deck={activeDeck} onBack={() => setActiveDeck(null)} colors={colors} getButtonStyle={getButtonStyle} getInsetStyle={getInsetStyle} />;
}

// ── Study Screen — flip cards, swipe controls, stats ──
function StudyScreen({ deck, onBack, colors, getButtonStyle, getInsetStyle }) {
  const cards = deck.cards || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState({ right: 0, wrong: 0, total: 0 });
  const [showResults, setShowResults] = useState(false);
  const [sessionStart] = useState(Date.now());
  const [exitAnim, setExitAnim] = useState(null); // 'left' | 'right' | null

  const currentCard = cards[currentIndex];

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      if (showResults) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped(f => !f);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleWrong();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleRight();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showResults, isFlipped, currentIndex]);

  const handleRight = () => {
    if (showResults) return;
    setExitAnim('right');
    setTimeout(() => {
      setStats(s => ({ ...s, right: s.right + 1, total: s.total + 1 }));
      nextCard();
    }, 300);
  };

  const handleWrong = () => {
    if (showResults) return;
    setExitAnim('left');
    setTimeout(() => {
      setStats(s => ({ ...s, wrong: s.wrong + 1, total: s.total + 1 }));
      nextCard();
    }, 300);
  };

  const nextCard = () => {
    setExitAnim(null);
    setIsFlipped(false);
    if (currentIndex + 1 >= cards.length) {
      setShowResults(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ right: 0, wrong: 0, total: 0 });
    setShowResults(false);
    setExitAnim(null);
  };

  // Results screen
  if (showResults) {
    const correctPct = stats.total > 0 ? Math.round((stats.right / stats.total) * 100) : 0;
    const elapsed = Math.round((Date.now() - sessionStart) / 1000);
    return (
      <div style={{ ...getInsetStyle(), borderRadius: '24px', padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: colors.text, marginBottom: '24px' }}>
          Deck Complete!
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px' }}>
          <div>
            <span style={{ fontSize: '28px', fontWeight: 700, display: 'block', color: '#22c55e' }}>{correctPct}%</span>
            <span style={{ fontSize: '13px', color: colors.textSecondary }}>Correct</span>
          </div>
          <div>
            <span style={{ fontSize: '28px', fontWeight: 700, display: 'block', color: colors.text }}>{stats.total}</span>
            <span style={{ fontSize: '13px', color: colors.textSecondary }}>Cards</span>
          </div>
          <div>
            <span style={{ fontSize: '28px', fontWeight: 700, display: 'block', color: colors.text }}>{elapsed}s</span>
            <span style={{ fontSize: '13px', color: colors.textSecondary }}>Time</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={restart} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, ...getButtonStyle(), color: colors.text,
          }}>
            <RotateCcw className="w-4 h-4" /> Restart Deck
          </button>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600,
            background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: '#fff',
          }}>
            Back to Decks
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div style={{ ...getInsetStyle(), borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: colors.textSecondary }}>This deck has no cards yet.</p>
        <button onClick={onBack} style={{ marginTop: '16px', ...getButtonStyle(), padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
          Back to Decks
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: colors.bg, padding: '24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, ...getButtonStyle(), color: colors.textSecondary,
          }}>
            <ChevronLeft className="w-4 h-4" /> Back to Decks
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.textSecondary }}>
            {deck.name}
          </h2>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '24px',
          padding: '14px 30px', borderRadius: '16px', ...getButtonStyle(),
        }}>
          <StatItem label="Reviewing" value={currentIndex + 1} color={colors.text} />
          <StatItem label="Right" value={stats.right} color="#22c55e" />
          <StatItem label="Wrong" value={stats.wrong} color="#f87171" />
        </div>

        {/* Progress bar */}
        <div style={{ height: '4px', borderRadius: '2px', background: colors.bg, overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{
            width: `${((currentIndex) / cards.length) * 100}%`, height: '100%',
            background: 'linear-gradient(90deg, #0891b2, #06b6d4)', borderRadius: '2px', transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Flash card */}
        <div style={{ perspective: '1000px', marginBottom: '30px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: exitAnim === 'right' ? 150 : exitAnim === 'left' ? -150 : 0, rotate: exitAnim === 'right' ? 15 : exitAnim === 'left' ? -15 : 0 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: exitAnim === 'right' ? 150 : -150, rotate: exitAnim === 'right' ? 15 : -15 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsFlipped(f => !f)}
              style={{
                position: 'relative', width: '100%', height: '260px', cursor: 'pointer',
                transformStyle: 'preserve-3d', transition: 'transform 0.6s ease',
                transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
              }}
            >
              {/* Front (question) */}
              <div style={{
                position: 'absolute', width: '100%', height: '100%',
                backfaceVisibility: 'hidden', borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                padding: '30px', ...getButtonStyle(),
                fontSize: '18px', fontWeight: 500, color: colors.text, lineHeight: 1.5,
              }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Question
                  </p>
                  {currentCard.question}
                </div>
              </div>
              {/* Back (answer) */}
              <div style={{
                position: 'absolute', width: '100%', height: '100%',
                backfaceVisibility: 'hidden', borderRadius: '20px',
                transform: 'rotateX(180deg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                padding: '30px', ...getInsetStyle(),
                fontSize: '16px', fontWeight: 500, color: colors.text, lineHeight: 1.5,
              }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#0891b2', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Answer
                  </p>
                  {currentCard.answer}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
          <button onClick={handleWrong} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, ...getButtonStyle(), color: '#f87171',
          }}>
            <ChevronLeft className="w-4 h-4" /> Didn't Know
          </button>
          <button onClick={() => setIsFlipped(f => !f)} style={{
            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, ...getButtonStyle(), color: colors.text,
          }}>
            Flip
          </button>
          <button onClick={handleRight} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, ...getButtonStyle(), color: '#22c55e',
          }}>
            Knew It <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Keyboard hints */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '12px', color: colors.textTertiary }}>
          <span>↑↓ Flip</span>
          <span>← Didn't Know</span>
          <span>→ Knew It</span>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: '22px', fontWeight: 700, display: 'block', color }}>{value}</span>
      <span style={{ fontSize: '13px', opacity: 0.8 }}>{label}</span>
    </div>
  );
}