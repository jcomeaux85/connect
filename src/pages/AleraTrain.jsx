import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, CheckCircle2, Lock, BookOpen, Volume2, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ALERA TRAIN — the active-training module viewer.
// Two module types:
//   standard     → video + text block, single "Mark Complete" button.
//                  Button only enables after video reaches end AND user
//                  has dwelled on the text block for min_dwell_seconds.
//   audio_gated  → audio player with timestamped dropdown questions that
//                  pause the audio. "Next Module" enables when all
//                  questions are correct + audio finished.
//
// On completion of either type, fires the ommni-complete-module backend
// function (the webhook that generates 14-day OMMNI rules from tags).

// ── Seed modules (used when the DB is empty so the page is usable immediately) ──
const SEED_MODULES = [
  {
    id: 'seed-1',
    title: 'Module 1 | Introduction to Benefits 101',
    module_type: 'standard',
    module_number: 1,
    video_url: '',
    text_content: `<p>Welcome to Benefits 101! This module provides a foundational understanding of common lines of coverage you'll encounter in the benefits service industry.</p><p>This comprehensive introduction covers medical insurance fundamentals, funding arrangements like FSAs and HSAs, and various voluntary benefits. Understanding these core concepts will prepare you for more detailed coverage in subsequent modules.</p><p><strong>Key takeaways:</strong></p><ul><li>Medical insurance helps manage healthcare costs in exchange for monthly premiums</li><li>Funding arrangements (FSA, HSA, HRA) are IRS-approved accounts, not insurance plans</li><li>Dental, vision, life, and disability are separate lines of coverage</li><li>Voluntary worksite benefits supplement core coverage</li></ul>`,
    tags: ['FRG_terminology', 'HSA_basics', 'FSA_basics', 'benefits_101'],
    min_dwell_seconds: 10,
    header_image_url: 'https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/73eb59cb0_learm.png',
  },
  {
    id: 'seed-2',
    title: 'Module 2 | Medical Insurance Deep Dive',
    module_type: 'standard',
    module_number: 2,
    text_content: `<p>This module explores medical insurance in depth, covering funding structures, provider networks, and costs.</p><p><strong>Self-Insured vs Fully-Insured:</strong> Self-insured employers pay claims directly (regulated federally). Fully-insured employers pay premiums to an insurance company who pays claims (regulated by state).</p><p><strong>Network Types:</strong> HMO requires referrals, PPO offers flexibility, EPO is exclusive but no referrals needed, POS combines HMO/PPO features.</p><p><strong>Key cost terms:</strong> Premium, Deductible, Copay, Coinsurance, Out-of-Pocket Maximum.</p>`,
    tags: ['self_insured', 'fully_insured', 'HMO', 'PPO', 'deductible', 'coinsurance'],
    min_dwell_seconds: 10,
  },
  {
    id: 'seed-3',
    title: 'Module 3 | Funding Arrangements (HRA, HSA, FSA)',
    module_type: 'audio_gated',
    module_number: 3,
    audio_url: '',
    text_content: `<p>Building on Module 1, this module examines ACA-compliant HRA types, HSA contribution limits, and specialized FSA variations.</p><p><strong>QSEHRA:</strong> Small employers (<50), employer-only funded, 2024 limits: Single $6,150 / Family $12,450.</p><p><strong>ICHRA:</strong> No size limit, no contribution limits, can vary by employee class.</p><p><strong>EBHRA:</strong> Excepted benefits only, 2024 limit $2,100.</p>`,
    tags: ['QSEHRA', 'ICHRA', 'HSA_contribution_limits', 'LPFSA', 'DCFSA'],
    questions: [
      {
        id: 'q3_1',
        question_num: 1,
        timestamp: 5,
        prompt: 'HRA amounts credited to employees are ______ to employees.',
        options: ['fully taxable', 'partially taxable', 'not taxable', 'deferred tax'],
        correct_answer: 'not taxable'
      },
      {
        id: 'q3_2',
        question_num: 2,
        timestamp: 10,
        prompt: 'PFAs work similarly to HRAs by providing ______ to reduce employee out-of-pocket expenses.',
        options: ['premium payments', 'cost-sharing coverage', 'full replacement', 'administrative services'],
        correct_answer: 'cost-sharing coverage'
      },
      {
        id: 'q3_3',
        question_num: 3,
        timestamp: 15,
        prompt: 'Unlike HSAs where funds belong to the individual, FSA funds follow a ______ rule.',
        options: ['rollover indefinitely', 'use it or lose it', 'employer matching', 'tax penalty'],
        correct_answer: 'use it or lose it'
      },
    ],
  },
];

export default function AleraTrain() {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const queryClient = useQueryClient();
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  // Fetch modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['training-modules'],
    queryFn: async () => {
      const result = await base44.entities.TrainingModule.filter({ is_active: true }, 'module_number', 50);
      // If DB is empty, use seed modules
      return result.length > 0 ? result : SEED_MODULES;
    }
  });

  // Fetch completions for the current user
  const { data: completions = [] } = useQuery({
    queryKey: ['training-completions'],
    queryFn: async () => {
      const me = await base44.auth.me();
      if (!me?.email) return [];
      return base44.entities.TrainingCompletion.filter({ user_email: me.email }, '-completed_at', 100);
    }
  });

  // Completion mutation — fires the webhook
  const completeMutation = useMutation({
    mutationFn: async (module) => {
      return base44.functions.invoke('ommni-complete-module', {
        module_id: module.id,
        module_title: module.title,
        module_tags: module.tags || []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-completions'] });
    }
  });

  // Auto-select first module
  useEffect(() => {
    if (!selectedModuleId && modules.length > 0) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const completedIds = new Set(completions.map(c => c.module_id));

  return (
    <div className="min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(28px, 4vw, 42px)',
            color: colors.text,
            letterSpacing: '0.02em',
            marginBottom: '8px',
          }}>
            ALERA <span style={{ color: '#7c3aed' }}>|</span> TRAIN
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            Active training modules — complete each module to activate real-time OMMNI guidance
          </p>
        </div>

        <div className="flex gap-6" style={{ minHeight: '500px' }}>
          {/* Module list sidebar */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <div style={{
              ...getInsetStyle(),
              borderRadius: '16px',
              padding: '16px',
            }}>
              <p style={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.textSecondary,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}>
                Curriculum
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {modulesLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: colors.textSecondary }} />
                  </div>
                ) : modules.map(module => {
                  const isCompleted = completedIds.has(module.id);
                  const isSelected = selectedModuleId === module.id;
                  return (
                    <button
                      key={module.id}
                      onClick={() => setSelectedModuleId(module.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        background: isSelected ? `${colors.cardBg}` : 'transparent',
                        boxShadow: isSelected ? getButtonStyle().boxShadow : 'none',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <div style={{
                        flexShrink: 0,
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isCompleted ? '#22c55e20' : isSelected ? '#7c3aed20' : colors.bg,
                      }}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                        ) : (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#7c3aed' : colors.textSecondary }}>
                            {module.module_number || '?'}
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isSelected ? colors.text : colors.textSecondary,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {module.title}
                      </span>
                      {module.module_type === 'audio_gated' && (
                        <Volume2 className="w-3 h-3 flex-shrink-0" style={{ color: colors.textTertiary }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progress indicator */}
            <div style={{
              ...getInsetStyle(),
              borderRadius: '16px',
              padding: '16px',
              marginTop: '12px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '8px' }}>
                Progress
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  flex: 1,
                  height: '6px',
                  borderRadius: '3px',
                  background: colors.bg,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${modules.length > 0 ? (completedIds.size / modules.length) * 100 : 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>
                  {completedIds.size}/{modules.length}
                </span>
              </div>
            </div>
          </div>

          {/* Module viewer */}
          <div style={{ flex: 1 }}>
            {selectedModule ? (
              <ModuleViewer
                key={selectedModule.id}
                module={selectedModule}
                isCompleted={completedIds.has(selectedModule.id)}
                onComplete={() => completeMutation.mutate(selectedModule)}
                isCompleting={completeMutation.isPending}
                colors={colors}
                getButtonStyle={getButtonStyle}
                getInsetStyle={getInsetStyle}
              />
            ) : (
              <div style={{
                ...getInsetStyle(),
                borderRadius: '20px',
                padding: '60px',
                textAlign: 'center',
              }}>
                <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textTertiary }} />
                <p style={{ color: colors.textSecondary }}>Select a module to begin training</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Module Viewer — handles both standard and audio_gated types ──
function ModuleViewer({ module, isCompleted, onComplete, isCompleting, colors, getButtonStyle, getInsetStyle }) {
  if (module.module_type === 'audio_gated') {
    return <AudioGatedViewer module={module} isCompleted={isCompleted} onComplete={onComplete} isCompleting={isCompleting} colors={colors} getButtonStyle={getButtonStyle} getInsetStyle={getInsetStyle} />;
  }
  return <StandardViewer module={module} isCompleted={isCompleted} onComplete={onComplete} isCompleting={isCompleting} colors={colors} getButtonStyle={getButtonStyle} getInsetStyle={getInsetStyle} />;
}

// ── Standard Module: video + text + Mark Complete ──
function StandardViewer({ module, isCompleted, onComplete, isCompleting, colors, getButtonStyle, getInsetStyle }) {
  const videoRef = useRef(null);
  const textRef = useRef(null);
  const dwellTimerRef = useRef(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [dwellMet, setDwellMet] = useState(false);
  const [dwellProgress, setDwellProgress] = useState(0);
  const minDwell = (module.min_dwell_seconds || 10) * 1000;

  // Track dwell time on the text block
  useEffect(() => {
    if (isCompleted) return;
    let elapsed = 0;
    const interval = setInterval(() => {
      // Check if text block is visible in viewport
      const el = textRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible) {
        elapsed += 500;
        setDwellProgress(Math.min(elapsed / minDwell, 1));
        if (elapsed >= minDwell) {
          setDwellMet(true);
          clearInterval(interval);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isCompleted, minDwell]);

  const canComplete = (videoEnded || !module.video_url) && dwellMet;
  const showVideo = !!module.video_url;

  if (isCompleted) {
    return (
      <div style={{
        ...getInsetStyle(),
        borderRadius: '20px',
        padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#22c55e' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: colors.text, marginBottom: '8px' }}>
            Module Complete
          </h2>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            OMMNI guidance rules activated for 14 days
          </p>
        </div>
        <div style={{
          ...getButtonStyle(),
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '8px' }}>
            Active OMMNI tags from this module:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(module.tags || []).map(tag => (
              <span key={tag} style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#7c3aed15',
                color: '#7c3aed',
                border: '1px solid #7c3aed30',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: module.text_content || '' }} style={{
          fontSize: '14px',
          lineHeight: 1.7,
          color: colors.text,
        }} />
      </div>
    );
  }

  return (
    <div style={{
      ...getInsetStyle(),
      borderRadius: '20px',
      padding: '32px',
    }}>
      {/* Module header */}
      <div style={{ marginBottom: '24px' }}>
        {module.header_image_url && (
          <div style={{
            width: '100%',
            height: '160px',
            borderRadius: '12px',
            marginBottom: '16px',
            backgroundImage: `url(${module.header_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
        )}
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: colors.text, marginBottom: '4px' }}>
          {module.title}
        </h2>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px',
            background: '#3b82f615',
            color: '#3b82f6',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Standard
          </span>
          {module.tags?.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '4px',
              background: '#7c3aed10',
              color: '#7c3aed',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Video player */}
      {showVideo && (
        <div style={{ marginBottom: '20px' }}>
          <video
            ref={videoRef}
            src={module.video_url}
            controls
            onEnded={() => setVideoEnded(true)}
            style={{
              width: '100%',
              borderRadius: '12px',
              background: '#000',
            }}
          />
          {!videoEnded && (
            <p style={{ fontSize: '11px', color: colors.textTertiary, marginTop: '6px', textAlign: 'center' }}>
              Watch the full video to unlock completion
            </p>
          )}
        </div>
      )}

      {/* Text content */}
      <div ref={textRef} style={{ marginBottom: '24px' }}>
        <div dangerouslySetInnerHTML={{ __html: module.text_content || '' }} style={{
          fontSize: '14px',
          lineHeight: 1.7,
          color: colors.text,
        }} />
      </div>

      {/* Dwell progress + Mark Complete */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        borderRadius: '12px',
        ...getButtonStyle(),
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' }}>
            {showVideo && !videoEnded ? 'Watch video to unlock' :
             !dwellMet ? `Dwell: ${Math.round(dwellProgress * 100)}%` :
             'Ready to complete'}
          </p>
          <div style={{
            height: '4px',
            borderRadius: '2px',
            background: colors.bg,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${showVideo && !videoEnded ? 0 : dwellProgress * 100}%`,
              height: '100%',
              background: canComplete ? '#22c55e' : '#7c3aed',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
        <button
          onClick={onComplete}
          disabled={!canComplete || isCompleting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            cursor: canComplete && !isCompleting ? 'pointer' : 'not-allowed',
            background: canComplete ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : colors.bg,
            color: canComplete ? '#fff' : colors.textTertiary,
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: canComplete ? '0 4px 12px rgba(124,58,237,0.35)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Mark Complete
        </button>
      </div>
    </div>
  );
}

// ── Audio-Gated Module: audio + timestamped questions ──
function AudioGatedViewer({ module, isCompleted, onComplete, isCompleting, colors, getButtonStyle, getInsetStyle }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioEnded, setAudioEnded] = useState(false);
  const [currentGate, setCurrentGate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [speed, setSpeed] = useState(1);
  const questions = module.questions || [];

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id]?.isCorrect);
  const canProceed = allAnswered && (audioEnded || !module.audio_url);

  // Audio time update — check for gate timestamps
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || questions.length === 0) return;

    const onTimeUpdate = () => {
      if (audio.paused || audio.ended || currentGate) return;
      const currentTime = audio.currentTime;
      const gate = questions.find(q => q.timestamp <= currentTime && !answers[q.id]?.isCorrect);
      if (gate) {
        audio.pause();
        setIsPlaying(false);
        setCurrentGate(gate);
      }
      setAudioProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };

    const onEnded = () => {
      setAudioEnded(true);
      setIsPlaying(false);
      setAudioProgress(100);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [questions, answers, currentGate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(e => console.error('Audio play failed:', e));
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const setPlaybackSpeed = (s) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = s;
    setSpeed(s);
  };

  const checkAnswer = (question, selectedValue) => {
    const isCorrect = selectedValue === question.correct_answer;
    setAnswers(prev => ({ ...prev, [question.id]: { value: selectedValue, isCorrect } }));
    if (isCorrect && currentGate?.id === question.id) {
      setCurrentGate(null);
      // Resume audio
      const audio = audioRef.current;
      if (audio) {
        audio.play().catch(e => console.error('Audio resume failed:', e));
        setIsPlaying(true);
      }
    }
  };

  const restart = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.pause();
    }
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioEnded(false);
    setCurrentGate(null);
    setAnswers({});
  };

  if (isCompleted) {
    return (
      <div style={{
        ...getInsetStyle(),
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
      }}>
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#22c55e' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: colors.text, marginBottom: '8px' }}>
          Module Complete
        </h2>
        <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
          OMMNI guidance rules activated for 14 days
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
          {(module.tags || []).map(tag => (
            <span key={tag} style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '6px',
              background: '#7c3aed15',
              color: '#7c3aed',
              border: '1px solid #7c3aed30',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      ...getInsetStyle(),
      borderRadius: '20px',
      padding: '32px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: colors.text, marginBottom: '4px' }}>
          {module.title}
        </h2>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px',
            background: '#f59e0b15',
            color: '#f59e0b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Audio Gated
          </span>
          {module.tags?.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '4px',
              background: '#7c3aed10',
              color: '#7c3aed',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Audio player */}
      {module.audio_url && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px',
          borderRadius: '12px',
          marginBottom: '20px',
          ...getButtonStyle(),
        }}>
          <button
            onClick={togglePlay}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div style={{
            flex: 1,
            height: '8px',
            borderRadius: '4px',
            background: colors.bg,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${audioProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              borderRadius: '4px',
              transition: 'width 0.2s ease',
            }} />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0.5, 0.75, 1, 1.25, 1.5].map(s => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: speed === s ? '#7c3aed' : 'transparent',
                  color: speed === s ? '#fff' : colors.textSecondary,
                }}
              >
                {s}x
              </button>
            ))}
          </div>
          <audio ref={audioRef} src={module.audio_url} />
        </div>
      )}

      {/* Text content */}
      <div dangerouslySetInnerHTML={{ __html: module.text_content || '' }} style={{
        fontSize: '14px',
        lineHeight: 1.7,
        color: colors.text,
        marginBottom: '20px',
      }} />

      {/* Questions */}
      {questions.map((q, i) => {
        const ans = answers[q.id];
        const isGated = currentGate?.id === q.id;
        return (
          <div key={q.id} style={{
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '12px',
            border: isGated ? '2px solid #f59e0b' : `1px solid ${colors.border}`,
            background: isGated ? '#f59e0b10' : getButtonStyle().background,
            transition: 'all 0.3s ease',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '10px' }}>
              {q.prompt}
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {q.options.map(opt => {
                const isSelected = ans?.value === opt;
                const showResult = isSelected && ans;
                return (
                  <button
                    key={opt}
                    onClick={() => checkAnswer(q, opt)}
                    disabled={ans?.isCorrect}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: showResult
                        ? (ans.isCorrect ? '#22c55e' : '#ef4444')
                        : `${colors.border}`,
                      cursor: ans?.isCorrect ? 'default' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: showResult
                        ? (ans.isCorrect ? '#22c55e20' : '#ef444420')
                        : 'transparent',
                      color: showResult
                        ? (ans.isCorrect ? '#22c55e' : '#ef4444')
                        : colors.text,
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {ans && (
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                marginTop: '8px',
                color: ans.isCorrect ? '#22c55e' : '#ef4444',
              }}>
                {ans.isCorrect ? '✓ Correct — audio resumed' : '✗ Try again'}
              </p>
            )}
          </div>
        );
      })}

      {/* Footer: restart + complete */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
      }}>
        <button
          onClick={restart}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            ...getButtonStyle(),
            color: colors.textSecondary,
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>
        <button
          onClick={onComplete}
          disabled={!canProceed || isCompleting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            cursor: canProceed && !isCompleting ? 'pointer' : 'not-allowed',
            background: canProceed ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : colors.bg,
            color: canProceed ? '#fff' : colors.textTertiary,
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: canProceed ? '0 4px 12px rgba(124,58,237,0.35)' : 'none',
          }}
        >
          {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Complete Module
        </button>
      </div>
    </div>
  );
}