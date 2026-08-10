import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, AlertCircle, ClipboardCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Specified Trainings — assigned training modules with deadlines.
// Shows a list of trainings with deadline urgency indicators and completion status.

const SEED_TRAININGS = [
  {
    id: 'seed-train-1',
    title: 'Q3 Compliance Training — HIPAA & Data Security',
    module_type: 'specified_training',
    text_content: '<p>Mandatory quarterly compliance training covering HIPAA regulations, data security protocols, and member privacy requirements. All agents must complete this training by the deadline.</p>',
    tags: ['HIPAA', 'compliance', 'data_security'],
    deadline: '2026-08-20',
  },
  {
    id: 'seed-train-2',
    title: 'New Carrier Onboarding — BlueCross BlueShield',
    module_type: 'specified_training',
    text_content: '<p>Training for the new BCBS carrier integration. Covers plan structures, claim submission processes, and provider network details.</p>',
    tags: ['BCBS', 'carrier_onboarding', 'claims'],
    deadline: '2026-08-25',
  },
  {
    id: 'seed-train-3',
    title: 'Annual Benefits Refresh — 2026 Plan Year Updates',
    module_type: 'specified_training',
    text_content: '<p>Annual refresher covering all 2026 plan year changes including new HSA limits, updated FSA rules, and carrier network changes.</p>',
    tags: ['2026_updates', 'HSA_limits', 'FSA_rules'],
    deadline: '2026-09-01',
  },
  {
    id: 'seed-train-4',
    title: 'Customer Service Excellence — De-escalation Techniques',
    module_type: 'specified_training',
    text_content: '<p>Advanced de-escalation training for handling difficult calls. Covers active listening, empathy statements, and conflict resolution strategies.</p>',
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
    }
  });

  const completedIds = new Set(completions.map(c => c.module_id));

  // Sort by deadline urgency (overdue first, then by date)
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
              const days = getDaysUntil(training.deadline);
              const urgency = getUrgency(days);
              const UrgencyIcon = urgency.icon;

              return (
                <motion.div
                  key={training.id || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  style={{
                    ...getButtonStyle(),
                    borderRadius: '16px',
                    padding: '20px',
                    opacity: isCompleted ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    {/* Status icon */}
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

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: colors.text, marginBottom: '4px' }}>
                        {training.title}
                      </h3>
                      {training.text_content && (
                        <p style={{
                          fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5, marginBottom: '10px',
                        }}
                          dangerouslySetInnerHTML={{ __html: training.text_content }}
                        />
                      )}

                      {/* Tags */}
                      {(training.tags || []).length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {training.tags.slice(0, 4).map(tag => (
                            <span key={tag} style={{
                              fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                              background: '#f59e0b10', color: '#f59e0b',
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Deadline + action */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '12px', fontWeight: 600, color: urgency.color,
                          }}>
                            {isCompleted ? 'Completed' : urgency.label}
                          </span>
                          {training.deadline && (
                            <span style={{ fontSize: '11px', color: colors.textTertiary }}>
                              · Due {new Date(training.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {!isCompleted && (
                          <button
                            onClick={() => completeMutation.mutate(training)}
                            disabled={completeMutation.isPending}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '8px 16px', borderRadius: '8px', border: 'none',
                              cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#fff',
                            }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Complete
                          </button>
                        )}
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
    </div>
  );
}