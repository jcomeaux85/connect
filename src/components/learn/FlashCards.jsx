import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar, Layers, Shuffle, Plus, X, Download, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { SEED_DECKS } from '@/data/flashcardDecks';

// Flash Cards — deck selection grid, flip card study screen, swipe controls.
// Smart Card mode reshuffles wrong cards back into the queue.
// Users can create new cards and decks (persisted to localStorage + entity).
// All decks have deadlines.

const STORAGE_KEY = 'aleraFlashcardDecks';

export default function FlashCards() {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const [activeDeck, setActiveDeck] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const fileInputRef = useRef(null);

  const { data: dbDecks = [], isLoading } = useQuery({
    queryKey: ['flashcard-decks'],
    queryFn: async () => {
      const result = await base44.entities.FlashcardDeck.filter({ is_active: true }, 'name', 50);
      return result;
    }
  });

  // Merge: DB decks + localStorage decks + seed decks (deduped by name)
  const [localDecks, setLocalDecks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });

  const allDecks = React.useMemo(() => {
    const merged = [...localDecks];
    for (const d of [...dbDecks, ...SEED_DECKS]) {
      if (!merged.some(m => m.name === d.name)) merged.push(d);
    }
    return merged;
  }, [localDecks, dbDecks]);

  const persistLocal = (decks) => {
    setLocalDecks(decks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  };

  const handleCreateDeck = (name, description, cardsText, deadline) => {
    const cards = cardsText
      .split('\n')
      .map(line => {
        const [q, a] = line.split('|');
        return q && a ? { question: q.trim(), answer: a.trim() } : null;
      })
      .filter(Boolean);
    const newDeck = {
      id: `local-${Date.now()}`,
      name, description, cards, deadline,
      is_active: true,
    };
    persistLocal([newDeck, ...localDecks]);
    setShowCreateModal(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(allDecks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alera-flashcard-decks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (Array.isArray(imported)) {
          const valid = imported.filter(d => d.name && Array.isArray(d.cards));
          persistLocal([...valid, ...localDecks]);
        }
      } catch { /* ignore bad JSON */ }
    };
    reader.readAsText(file);
  };

  // ── Deck selection screen ──
  if (!activeDeck) {
    return (
      <div className="min-h-screen" style={{ background: colors.bg, padding: '24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowCreateModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, ...getButtonStyle(), color: colors.text,
            }}>
              <Plus className="w-4 h-4" /> Create Deck
            </button>
            <button onClick={handleExport} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, ...getButtonStyle(), color: colors.text,
            }}>
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, ...getButtonStyle(), color: colors.text,
            }}>
              <Upload className="w-4 h-4" /> Import
            </button>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </div>

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
              {allDecks.map((deck, i) => (
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
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #0891b2, #06b6d4)' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.text, marginBottom: '6px' }}>
                    {deck.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.4, marginBottom: '14px' }}>
                    {deck.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '10px', background: '#0891b215', color: '#0891b2' }}>
                      {deck.cards?.length || 0} cards
                    </span>
                    {deck.deadline && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>
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

        {/* Create Deck Modal */}
        {showCreateModal && (
          <CreateDeckModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateDeck}
            colors={colors}
            getButtonStyle={getButtonStyle}
            getInsetStyle={getInsetStyle}
          />
        )}
      </div>
    );
  }

  // Study screen
  return <StudyScreen deck={activeDeck} onBack={() => setActiveDeck(null)} colors={colors} getButtonStyle={getButtonStyle} getInsetStyle={getInsetStyle} />;
}

// ── Study Screen — flip cards, swipe controls, stats, Smart Card mode ──
function StudyScreen({ deck, onBack, colors, getButtonStyle, getInsetStyle }) {
  const initialCards = deck.cards || [];
  const [queue, setQueue] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState({ right: 0, wrong: 0, total: 0 });
  const [showResults, setShowResults] = useState(false);
  const [exitAnim, setExitAnim] = useState(null);
  const [smartMode, setSmartMode] = useState(() => localStorage.getItem('aleraSmartMode') === 'true');
  const [sessionStart] = useState(Date.now());
  const [cardTimes, setCardTimes] = useState([]);
  const cardStartRef = useRef(Date.now());

  const currentCard = queue[currentIndex];

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
  }, [showResults, currentIndex, isFlipped]);

  const toggleSmart = () => {
    const next = !smartMode;
    setSmartMode(next);
    localStorage.setItem('aleraSmartMode', String(next));
  };

  const recordCardTime = () => {
    const elapsed = (Date.now() - cardStartRef.current) / 1000;
    setCardTimes(prev => [...prev, elapsed]);
    cardStartRef.current = Date.now();
  };

  const handleRight = () => {
    if (showResults) return;
    recordCardTime();
    setExitAnim('right');
    setTimeout(() => {
      setStats(s => ({ ...s, right: s.right + 1, total: s.total + 1 }));
      nextCard();
    }, 300);
  };

  const handleWrong = () => {
    if (showResults) return;
    recordCardTime();
    setExitAnim('left');
    setTimeout(() => {
      setStats(s => ({ ...s, wrong: s.wrong + 1, total: s.total + 1 }));
      // Smart Card: wrong cards go back to the end of the queue
      if (smartMode && currentCard) {
        setQueue(prev => [...prev, prev[currentIndex]]);
      }
      nextCard();
    }, 300);
  };

  const nextCard = () => {
    setExitAnim(null);
    setIsFlipped(false);
    if (currentIndex + 1 >= queue.length) {
      setShowResults(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const restart = () => {
    setQueue(initialCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ right: 0, wrong: 0, total: 0 });
    setShowResults(false);
    setExitAnim(null);
    setCardTimes([]);
    cardStartRef.current = Date.now();
  };

  // Results screen
  if (showResults) {
    const totalStudied = stats.right + stats.wrong;
    const correctPct = totalStudied > 0 ? Math.round((stats.right / totalStudied) * 100) : 0;
    const elapsed = Math.round((Date.now() - sessionStart) / 1000);
    const avgPerCard = cardTimes.length > 0 ? (cardTimes.reduce((a, b) => a + b, 0) / cardTimes.length).toFixed(1) : 0;
    return (
      <div style={{ ...getInsetStyle(), borderRadius: '24px', padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: colors.text, marginBottom: '24px' }}>Deck Complete!</h2>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px' }}>
          <ResultStat value={`${correctPct}%`} label="Correct" color="#22c55e" />
          <ResultStat value={totalStudied} label="Cards" color={colors.text} />
          <ResultStat value={`${elapsed}s`} label="Time" color={colors.text} />
          <ResultStat value={`${avgPerCard}s`} label="Avg/Card" color={colors.text} />
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
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.textSecondary }}>{deck.name}</h2>
          {/* Smart Card toggle */}
          <button onClick={toggleSmart} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 600,
            background: smartMode ? 'linear-gradient(135deg, #0891b2, #06b6d4)' : 'transparent',
            color: smartMode ? '#fff' : colors.textSecondary,
            ...(!smartMode ? getButtonStyle() : {}),
          }}>
            <Shuffle className="w-3.5 h-3.5" /> Smart: {smartMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '24px', padding: '14px 30px', borderRadius: '16px', ...getButtonStyle() }}>
          <StatItem label="Reviewing" value={currentIndex + 1} color={colors.text} />
          <StatItem label="Right" value={stats.right} color="#22c55e" />
          <StatItem label="Wrong" value={stats.wrong} color="#f87171" />
        </div>

        {/* Progress bar */}
        <div style={{ height: '4px', borderRadius: '2px', background: colors.bg, overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ width: `${(currentIndex / queue.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #0891b2, #06b6d4)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
        </div>

        {/* Flash card — entrance animation on outer, flip on inner (separated to avoid transform conflict) */}
        <div style={{ perspective: '1000px', marginBottom: '30px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: exitAnim === 'right' ? 150 : exitAnim === 'left' ? -150 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: exitAnim === 'right' ? 150 : -150 }}
              transition={{ duration: 0.3 }}
            >
              <div
                onClick={() => setIsFlipped(f => !f)}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '260px',
                  cursor: 'pointer',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.6s ease',
                  transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                }}
              >
                {/* Front (question) */}
                <div style={{
                  position: 'absolute', width: '100%', height: '100%',
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  borderRadius: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  padding: '30px', ...getButtonStyle(),
                  fontSize: '18px', fontWeight: 500, color: colors.text, lineHeight: 1.5,
                }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Question</p>
                    {currentCard.question}
                  </div>
                </div>
                {/* Back (answer) */}
                <div style={{
                  position: 'absolute', width: '100%', height: '100%',
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  borderRadius: '20px',
                  transform: 'rotateX(180deg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  padding: '30px', ...getInsetStyle(),
                  fontSize: '16px', fontWeight: 500, color: colors.text, lineHeight: 1.5,
                }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#0891b2', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Answer</p>
                    {currentCard.answer}
                  </div>
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

function ResultStat({ value, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: '28px', fontWeight: 700, display: 'block', color }}>{value}</span>
      <span style={{ fontSize: '14px', opacity: 0.8 }}>{label}</span>
    </div>
  );
}

// ── Create Deck Modal ──
function CreateDeckModal({ onClose, onCreate, colors, getButtonStyle, getInsetStyle }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [cardsText, setCardsText] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div style={{ ...getButtonStyle(), borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.text }}>Create New Deck</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '4px' }}>Deck Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Medicare Basics"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '4px' }}>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '4px' }}>Deadline</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '4px' }}>
              Cards (one per line, format: <code style={{ fontSize: '11px' }}>question | answer</code>)
            </label>
            <textarea value={cardsText} onChange={e => setCardsText(e.target.value)} placeholder={'What is Medicare? | Federal health insurance for 65+\nWhat is Part A? | Hospital insurance'}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '13px', minHeight: '120px', resize: 'vertical', fontFamily: 'monospace' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, ...getButtonStyle(), color: colors.textSecondary }}>Cancel</button>
            <button onClick={() => onCreate(name, description, cardsText, deadline)} disabled={!name || !cardsText.trim()}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: name && cardsText.trim() ? 'pointer' : 'not-allowed',
                fontSize: '13px', fontWeight: 600,
                background: name && cardsText.trim() ? 'linear-gradient(135deg, #0891b2, #06b6d4)' : colors.bg,
                color: name && cardsText.trim() ? '#fff' : colors.textTertiary,
              }}>
              Create Deck
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}