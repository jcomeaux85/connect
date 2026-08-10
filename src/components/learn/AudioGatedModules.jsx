import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, CheckCircle2, Loader2, RotateCcw, Volume2, Calendar, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Audio Gated Modules — audio plays first, THEN quiz questions appear.
// Questions come AFTER the module (not during audio playback).
// All modules have deadlines.

const SEED_MODULES = [
  {
    id: 'seed-audio-1',
    title: 'Module 1 | Introduction to Benefits 101',
    module_type: 'audio_gated',
    module_number: 1,
    audio_url: '',
    text_content: `<p>Welcome to Benefits 101! This module provides a foundational understanding of common lines of coverage you'll encounter in the benefits service industry.</p><p>This comprehensive introduction covers medical insurance fundamentals, funding arrangements like FSAs and HSAs, and various voluntary benefits. Understanding these core concepts will prepare you for more detailed coverage in subsequent modules.</p><p><strong>Key takeaways:</strong></p><ul><li>Medical insurance helps manage healthcare costs in exchange for monthly premiums</li><li>Funding arrangements (FSA, HSA, HRA) are IRS-approved accounts, not insurance plans</li><li>Dental, vision, life, and disability are separate lines of coverage</li><li>Voluntary worksite benefits supplement core coverage</li></ul>`,
    tags: ['FRG_terminology', 'HSA_basics', 'FSA_basics', 'benefits_101'],
    deadline: '2026-09-15',
    questions: [
      {
        id: 'q1_1',
        question_num: 1,
        prompt: 'What is medical insurance also commonly called?',
        options: ['Health insurance', 'Life insurance', 'Dental insurance', 'Vision insurance'],
        correct_answer: 'Health insurance',
      },
      {
        id: 'q1_2',
        question_num: 2,
        prompt: 'What do individuals pay monthly for medical insurance coverage?',
        options: ['Deductible', 'Copay', 'Premium', 'Coinsurance'],
        correct_answer: 'Premium',
      },
      {
        id: 'q1_3',
        question_num: 3,
        prompt: 'Are FSA, HSA, HRA, and PFA considered insurance plans?',
        options: ['Yes, they are all insurance plans', 'No, they are funding arrangements that work with medical plans', 'Only HSA is an insurance plan', 'Only FSA is an insurance plan'],
        correct_answer: 'No, they are funding arrangements that work with medical plans',
      },
    ],
  },
  {
    id: 'seed-audio-2',
    title: 'Module 2 | Medical Insurance Deep Dive',
    module_type: 'audio_gated',
    module_number: 2,
    text_content: `<p>This module explores medical insurance in depth, covering funding structures, provider networks, and costs.</p><p><strong>Self-Insured vs Fully-Insured:</strong> Self-insured employers pay claims directly (regulated federally). Fully-insured employers pay premiums to an insurance company who pays claims (regulated by state).</p><p><strong>Network Types:</strong> HMO requires referrals, PPO offers flexibility, EPO is exclusive but no referrals needed, POS combines HMO/PPO features.</p><p><strong>Key cost terms:</strong> Premium, Deductible, Copay, Coinsurance, Out-of-Pocket Maximum.</p>`,
    tags: ['self_insured', 'fully_insured', 'HMO', 'PPO', 'deductible', 'coinsurance'],
    deadline: '2026-09-20',
    questions: [
      {
        id: 'q2_1',
        question_num: 1,
        prompt: 'Who pays claims directly in a self-insured plan?',
        options: ['The insurance company', 'The employer', 'The employee', 'The broker'],
        correct_answer: 'The employer',
      },
      {
        id: 'q2_2',
        question_num: 2,
        prompt: 'Which network type requires referrals?',
        options: ['PPO', 'HMO', 'EPO', 'POS'],
        correct_answer: 'HMO',
      },
      {
        id: 'q2_3',
        question_num: 3,
        prompt: 'What is the amount you pay before insurance starts covering costs?',
        options: ['Premium', 'Copay', 'Deductible', 'Coinsurance'],
        correct_answer: 'Deductible',
      },
    ],
  },
  {
    id: 'seed-audio-3',
    title: 'Module 3 | Funding Arrangements (HRA, HSA, FSA)',
    module_type: 'audio_gated',
    module_number: 3,
    text_content: `<p>Building on Module 1, this module examines ACA-compliant HRA types, HSA contribution limits, and specialized FSA variations.</p><p><strong>QSEHRA:</strong> Small employers (<50), employer-only funded, 2024 limits: Single $6,150 / Family $12,450.</p><p><strong>ICHRA:</strong> No size limit, no contribution limits, can vary by employee class.</p><p><strong>EBHRA:</strong> Excepted benefits only, 2024 limit $2,100.</p>`,
    tags: ['QSEHRA', 'ICHRA', 'HSA_contribution_limits', 'LPFSA', 'DCFSA'],
    deadline: '2026-09-25',
    questions: [
      {
        id: 'q3_1',
        question_num: 1,
        prompt: 'HRA amounts credited to employees are ______ to employees.',
        options: ['fully taxable', 'partially taxable', 'not taxable', 'deferred tax'],
        correct_answer: 'not taxable',
      },
      {
        id: 'q3_2',
        question_num: 2,
        prompt: 'PFAs work similarly to HRAs by providing ______ to reduce employee out-of-pocket expenses.',
        options: ['premium payments', 'cost-sharing coverage', 'full replacement', 'administrative services'],
        correct_answer: 'cost-sharing coverage',
      },
      {
        id: 'q3_3',
        question_num: 3,
        prompt: 'Unlike HSAs where funds belong to the individual, FSA funds follow a ______ rule.',
        options: ['rollover indefinitely', 'use it or lose it', 'employer matching', 'tax penalty'],
        correct_answer: 'use it or lose it',
      },
    ],
  },
];

export default function AudioGatedModules() {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const queryClient = useQueryClient();
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['audio-gated-modules'],
    queryFn: async () => {
      const result = await base44.entities.TrainingModule.filter({ module_type: 'audio_gated', is_active: true }, 'module_number', 50);
      return result.length > 0 ? result : SEED_MODULES;
    }
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['training-completions'],
    queryFn: async () => {
      const me = await base44.auth.me();
      if (!me?.email) return [];
      return base44.entities.TrainingCompletion.filter({ user_email: me.email }, '-completed_at', 100);
    }
  });

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

  useEffect(() => {
    if (!selectedModuleId && modules.length > 0) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const completedIds = new Set(completions.map(c => c.module_id));

  return (
    <div className="min-h-screen" style={{ background: colors.bg, padding: '24px' }}>
      <div style={{ display: 'flex', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Module list */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ ...getInsetStyle(), borderRadius: '16px', padding: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Modules
            </p>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: colors.textSecondary }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {modules.map(module => {
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
                        background: isSelected ? colors.cardBg : 'transparent',
                        boxShadow: isSelected ? getButtonStyle().boxShadow : 'none',
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isSelected ? colors.text : colors.textSecondary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {module.title}
                        </p>
                        {module.deadline && (
                          <p style={{ fontSize: '10px', color: colors.textTertiary, marginTop: '2px' }}>
                            Due: {new Date(module.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Module viewer */}
        <div style={{ flex: 1 }}>
          {selectedModule ? (
            <AudioGatedViewer
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
            <div style={{ ...getInsetStyle(), borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
              <Volume2 className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textTertiary }} />
              <p style={{ color: colors.textSecondary }}>Select a module to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Audio Gated Viewer: audio plays FIRST, then quiz ──
function AudioGatedViewer({ module, isCompleted, onComplete, isCompleting, colors, getButtonStyle, getInsetStyle }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioEnded, setAudioEnded] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [phase, setPhase] = useState('audio'); // 'audio' | 'quiz' | 'done'
  const [answers, setAnswers] = useState({});
  const questions = module.questions || [];

  const allCorrect = questions.length > 0 && questions.every(q => answers[q.id]?.isCorrect);

  useEffect(() => {
    if (isCompleted) setPhase('done');
  }, [isCompleted]);

  // Reset when module changes
  useEffect(() => {
    setPhase('audio');
    setAudioEnded(false);
    setAudioProgress(0);
    setIsPlaying(false);
    setAnswers({});
  }, [module.id]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) {
      // No audio URL — allow proceeding to quiz
      setAudioEnded(true);
      return;
    }
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

  const handleAudioEnded = () => {
    setAudioEnded(true);
    setIsPlaying(false);
    setAudioProgress(100);
  };

  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setAudioProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  const checkAnswer = (question, selectedValue) => {
    const isCorrect = selectedValue === question.correct_answer;
    setAnswers(prev => ({ ...prev, [question.id]: { value: selectedValue, isCorrect } }));
  };

  const restart = () => {
    const audio = audioRef.current;
    if (audio) { audio.currentTime = 0; audio.pause(); }
    setPhase('audio');
    setAudioEnded(false);
    setAudioProgress(0);
    setIsPlaying(false);
    setAnswers({});
  };

  const canProceedToQuiz = audioEnded || !module.audio_url;
  const canComplete = allCorrect && phase === 'quiz';

  // ── DONE phase ──
  if (phase === 'done' || isCompleted) {
    return (
      <div style={{ ...getInsetStyle(), borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
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
              fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px',
              background: '#7c3aed15', color: '#7c3aed', border: '1px solid #7c3aed30',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── AUDIO phase ──
  if (phase === 'audio') {
    return (
      <div style={{ ...getInsetStyle(), borderRadius: '20px', padding: '32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: colors.text, marginBottom: '4px' }}>
            {module.title}
          </h2>
          {module.deadline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
              <Calendar className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b' }}>
                Deadline: {new Date(module.deadline).toLocaleDateString()}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {(module.tags || []).slice(0, 4).map(tag => (
              <span key={tag} style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: '#7c3aed10', color: '#7c3aed' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Audio player */}
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
              width: '48px', height: '48px', borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: colors.bg, overflow: 'hidden' }}>
            <div style={{
              width: `${audioProgress}%`, height: '100%',
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: '4px', transition: 'width 0.2s ease',
            }} />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0.5, 0.75, 1, 1.25, 1.5].map(s => (
              <button key={s} onClick={() => setPlaybackSpeed(s)} style={{
                padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                fontSize: '10px', fontWeight: 700,
                background: speed === s ? '#7c3aed' : 'transparent',
                color: speed === s ? '#fff' : colors.textSecondary,
              }}>
                {s}x
              </button>
            ))}
          </div>
          {module.audio_url && <audio ref={audioRef} src={module.audio_url} onEnded={handleAudioEnded} onTimeUpdate={handleAudioTimeUpdate} />}
        </div>

        {/* Text content */}
        <div dangerouslySetInnerHTML={{ __html: module.text_content || '' }} style={{
          fontSize: '14px', lineHeight: 1.7, color: colors.text, marginBottom: '24px',
        }} />

        {/* Proceed to quiz */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setPhase('quiz')}
            disabled={!canProceedToQuiz}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              cursor: canProceedToQuiz ? 'pointer' : 'not-allowed',
              background: canProceedToQuiz ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : colors.bg,
              color: canProceedToQuiz ? '#fff' : colors.textTertiary,
              fontSize: '13px', fontWeight: 700,
              boxShadow: canProceedToQuiz ? '0 4px 12px rgba(124,58,237,0.35)' : 'none',
            }}
          >
            {canProceedToQuiz ? 'Start Quiz' : 'Listen to audio first'}
            {canProceedToQuiz && <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  }

  // ── QUIZ phase (questions come AFTER the audio) ──
  return (
    <div style={{ ...getInsetStyle(), borderRadius: '20px', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: colors.text }}>
          Quiz: {module.title}
        </h2>
        <button onClick={restart} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          fontSize: '12px', fontWeight: 600, ...getButtonStyle(), color: colors.textSecondary,
        }}>
          <RotateCcw className="w-3.5 h-3.5" /> Restart
        </button>
      </div>

      {/* Questions */}
      {questions.map((q, i) => {
        const ans = answers[q.id];
        return (
          <div key={q.id} style={{
            padding: '16px', borderRadius: '12px', marginBottom: '12px',
            border: `1px solid ${colors.border}`, ...getButtonStyle(),
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '10px' }}>
              {i + 1}. {q.prompt}
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {q.options.map(opt => {
                const isSelected = ans?.value === opt;
                const showResult = isSelected && ans;
                return (
                  <button key={opt} onClick={() => checkAnswer(q, opt)} disabled={ans?.isCorrect} style={{
                    padding: '6px 14px', borderRadius: '8px', border: '1px solid',
                    borderColor: showResult ? (ans.isCorrect ? '#22c55e' : '#ef4444') : colors.border,
                    cursor: ans?.isCorrect ? 'default' : 'pointer',
                    fontSize: '12px', fontWeight: 600,
                    background: showResult ? (ans.isCorrect ? '#22c55e20' : '#ef444420') : 'transparent',
                    color: showResult ? (ans.isCorrect ? '#22c55e' : '#ef4444') : colors.text,
                  }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {ans && (
              <p style={{ fontSize: '11px', fontWeight: 600, marginTop: '8px', color: ans.isCorrect ? '#22c55e' : '#ef4444' }}>
                {ans.isCorrect ? '✓ Correct' : '✗ Try again'}
              </p>
            )}
          </div>
        );
      })}

      {/* Complete button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button
          onClick={onComplete}
          disabled={!canComplete || isCompleting}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            cursor: canComplete && !isCompleting ? 'pointer' : 'not-allowed',
            background: canComplete ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : colors.bg,
            color: canComplete ? '#fff' : colors.textTertiary,
            fontSize: '13px', fontWeight: 700,
            boxShadow: canComplete ? '0 4px 12px rgba(124,58,237,0.35)' : 'none',
          }}
        >
          {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Complete Module
        </button>
      </div>
    </div>
  );
}