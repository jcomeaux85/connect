import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, AlertCircle, ClipboardCheck, X, Lock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Specified Trainings — assigned training modules with deadlines.
// Users must OPEN and VIEW the training content before they can mark it complete.
// Cannot just click "Mark Complete" without opening the detail first.

const SEED_TRAININGS = [
  {
    id: 'seed-train-1',
    title: 'Q3 Compliance Training — HIPAA & Data Security',
    module_type: 'specified_training',
    text_content: '<p>Mandatory quarterly compliance training covering HIPAA regulations, data security protocols, and member privacy requirements. All agents must complete this training by the deadline.</p><p><strong>Topics covered:</strong></p><ul><li>HIPAA Privacy Rule fundamentals</li><li>Protected Health Information (PHI) handling</li><li>Data breach reporting procedures</li><li>Member consent requirements</li><li>Secure communication protocols</li></ul>',
    tags: ['HIPAA', 'compliance', 'data_security'],
    deadline: '2026-08-20',
  },
  {
    id: 'seed-train-2',
    title: 'New Carrier Onboarding — BlueCross BlueShield',
    module_type: 'specified_training',
    text_content: '<p>Training for the new BCBS carrier integration. Covers plan structures, claim submission processes, and provider network details.</p><p><strong>You will learn:</strong></p><ul><li>BCBS plan tiers and metal levels</li><li>Claim submission portal navigation</li><li>Provider network lookup procedures</li><li>Prior authorization requirements</li><li>Member ID card verification</li></ul>',
    tags: ['BCBS', 'carrier_onboarding', 'claims'],
    deadline: '2026-08-25',
  },
  {
    id: 'seed-train-3',
    title: 'Annual Benefits Refresh — 2026 Plan Year Updates',
    module_type: 'specified_training',
    text_content: '<p>Annual refresher covering all 2026 plan year changes including new HSA limits, updated FSA rules, and carrier network changes.</p><p><strong>2026 Updates:</strong></p><ul><li>HSA contribution limits increased</li><li>FSA carryover provisions updated</li><li>New carrier network additions</li><li>Discontinued plan grandfathering</li><li>Updated compliance requirements</li></ul>',
    tags: ['2026_updates', 'HSA_limits', 'FSA_rules'],
    deadline: '2026-09-01',
  },
  {
    id: 'seed-train-4',
    title: 'Customer Service Excellence — De-escalation Techniques',
    module_type: 'specified_training',
    text_content: '<p>Advanced de-escalation training for handling difficult calls. Covers active listening, empathy statements, and conflict resolution strategies.</p><p><strong>Techniques covered:</strong></p><ul><li>Active listening protocols</li><li>Empathy statement frameworks</li><li>Conflict de-escalation strategies</li><li>Setting boundaries with upset callers</li><li>Knowing when to escalate to a supervisor</li></ul>',
    tags: ['de-escalation', 'customer_service', 'call_handling'],
    deadline: '2026-09-10',
  },
];

function getDaysUntil(deadline) {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - now) / (1000 * 60 * 60 * 24));
}

function getUrgency(days) {
  if (days === null) return { color: '#6b7280', label: 'No deadline', icon: Clock };
  if (days < 0) return { color: '#ef4444', label: 'Overdue', icon: AlertCircle };
  if (days <= 3) return { color: '#ef4444', label: `${days}d left`, icon: AlertCircle };
  if (days <= 7) return { color: '#f59e0b', label: `${days}d left`, icon: Clock };
  return { color: '#22c55e', label: `${days}d left`, icon: Calendar };
}

export default function SpecifiedTrainings() {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const queryClient = useQueryClient();
  const [openedTraining, setOpenedTraining] = useState(null); // training detail modal
  const [viewedTrainingIds, setViewedTrainingIds] = useState(new Set()); // trainings the user has opened

  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['specified-trainings'],
    queryFn: async () => {
      const result = await base44.entities.TrainingModule.filter({ module_type: 'specified_training', is_active: true }, 'deadline', 50);
      return result.length > 0 ? result : SEED_TRAININGS;
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
    mutationFn: async (training) => {
      return base44.functions.invoke('ommni-complete-module', {
        module_id: training.id,
        module_title: training.title,
        module_tags: training.tags || []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-completions'] });
      setOpenedTraining(null);
    }
  });

  const completedIds = new Set(completions.map(c => c.module_id));

  const handleOpenTraining = (training) => {
    setOpenedTraining(training);
    setViewedTrainingIds(prev => new Set([...prev, training.id]));
  };

  const handleComplete = (training) => {
    // Only allow completion if the training has been opened/viewed
    if (!viewedTrainingIds.has(training.id)) return;
    completeMutation.mutate(training);
  };

  const sorted = [...trainings].sort((a, b) => {
    const aDone = completedIds.has(a.id);
    const bDone = completedIds.has(b.id);
    if (aDone && !bDone) return 1;
    if (!aDone && bDone) return -1;
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
    return 0;
  });

  return (
    <div className="min-h-screen" style={{ background: colors.bg, padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <ClipboardCheck className="w-8 h-8 mx-auto animate-pulse" style={{ color: colors.textSecondary }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sorted.map((training, i) => {
              const isCompleted = completedIds.has(training.id);
              const isViewed = viewedTrainingIds.has(training.id);
              const days = getDaysUntil(training.deadline);
              const urgency = getUrgency(days);
              const UrgencyIcon = urgency.icon;

              return (
                <motion.div
                  key={training.id || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  style={{ ...getButtonStyle(), borderRadius: '16px', padding: '20px', opacity: isCompleted ? 0.6 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{
                      flexShrink: 0, width: '40px', height: '40px', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isCompleted ? '#22c55e15' : `${urgency.color}15`,
                    }}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" style={{ color: '#22c55e' }} />
                      ) : (
                        <UrgencyIcon className="w-5 h-5" style={{ color: urgency.color }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: colors.text, marginBottom: '4px' }}>
                        {training.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.4, marginBottom: '8px' }}>
                        {training.text_content?.replace(/<[^>]+>/g, '').slice(0, 120)}...
                      </p>

                      {/* Tags */}
                      {(training.tags || []).length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {training.tags.slice(0, 4).map(tag => (
                            <span key={tag} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#f59e0b10', color: '#f59e0b' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Deadline + actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: urgency.color }}>
                            {isCompleted ? 'Completed' : urgency.label}
                          </span>
                          {training.deadline && (
                            <span style={{ fontSize: '11px', color: colors.textTertiary }}>
                              · Due {new Date(training.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!isCompleted && (
                            <button onClick={() => handleOpenTraining(training)} style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                              fontSize: '12px', fontWeight: 600, ...getButtonStyle(), color: colors.text,
                            }}>
                              {isViewed ? 'Review' : 'Open & Read'}
                            </button>
                          )}
                          {!isCompleted && (
                            <button
                              onClick={() => handleComplete(training)}
                              disabled={!isViewed || completeMutation.isPending}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '8px', border: 'none',
                                cursor: isViewed && !completeMutation.isPending ? 'pointer' : 'not-allowed',
                                fontSize: '12px', fontWeight: 600,
                                background: isViewed ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : colors.bg,
                                color: isViewed ? '#fff' : colors.textTertiary,
                              }}
                            >
                              {isViewed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              {isViewed ? 'Mark Complete' : 'Open First'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {trainings.length === 0 && (
              <div style={{ ...getInsetStyle(), borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
                <ClipboardCheck className="w-10 h-10 mx-auto mb-3" style={{ color: colors.textTertiary }} />
                <p style={{ color: colors.textSecondary }}>No specified trainings assigned yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Training detail modal — must be opened before completion is allowed */}
      <AnimatePresence>
        {openedTraining && (
          <TrainingDetailModal
            training={openedTraining}
            isCompleted={completedIds.has(openedTraining.id)}
            onClose={() => setOpenedTraining(null)}
            onComplete={() => handleComplete(openedTraining)}
            isCompleting={completeMutation.isPending}
            colors={colors}
            getButtonStyle={getButtonStyle}
            getInsetStyle={getInsetStyle}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Training Detail Modal — shows full content, complete button at bottom ──
function TrainingDetailModal({ training, isCompleted, onClose, onComplete, isCompleting, colors, getButtonStyle, getInsetStyle }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{ ...getButtonStyle(), borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: colors.text, marginBottom: '6px' }}>
              {training.title}
            </h2>
            {training.deadline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b' }}>
                  Due: {new Date(training.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tags */}
        {(training.tags || []).length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {training.tags.map(tag => (
              <span key={tag} style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: '#f59e0b10', color: '#f59e0b' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Full content */}
        <div dangerouslySetInnerHTML={{ __html: training.text_content || '<p>No content available.</p>' }} style={{ fontSize: '14px', lineHeight: 1.7, color: colors.text, marginBottom: '24px' }} />

        {/* Complete button */}
        {!isCompleted ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onComplete}
              disabled={isCompleting}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '10px', border: 'none',
                cursor: isCompleting ? 'wait' : 'pointer',
                fontSize: '14px', fontWeight: 700,
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#fff',
                boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
              }}
            >
              {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark Complete
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px', borderRadius: '10px', background: '#22c55e10' }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e' }}>Training Completed</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}