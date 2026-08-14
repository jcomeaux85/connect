import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Power, Shield, GraduationCap, X, Loader2, Edit2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// OMMNI Admin — CRUD interface for ommni_rules.
// Restricted to admin role. Admins can create keyword/regex/semantic rules
// with notification text and priority. Training-sourced rules are visible
// (read-only) so admins can see what training completions generated.

export default function OmmniAdmin() {
  const { colors, getButtonStyle, getInsetStyle } = useTheme();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['ommni-rules'],
    queryFn: async () => base44.entities.OmmniRule.list('-created_date', 200)
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => base44.auth.me()
  });

  const deleteMutation = useMutation({
    mutationFn: async (ruleId) => base44.entities.OmmniRule.delete(ruleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ommni-rules'] })
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ ruleId, active }) => base44.entities.OmmniRule.update(ruleId, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ommni-rules'] })
  });

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg }}>
        <div style={{ textAlign: 'center', ...getInsetStyle(), borderRadius: '20px', padding: '40px' }}>
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textTertiary }} />
          <p style={{ fontSize: '16px', fontWeight: 700, color: colors.text }}>Admin Access Required</p>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
            OMMNI rule management is restricted to administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(24px, 3vw, 32px)',
              color: colors.text,
              letterSpacing: '0.02em',
            }}>
              OMMNI
            </h1>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
              Rules & notification engine — {rules.filter(r => r.active).length} active, {rules.length} total
            </p>
          </div>
          <button
            onClick={() => { setEditingRule(null); setShowCreateForm(true); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(8,145,178,0.35)',
            }}
          >
            <Plus className="w-4 h-4" />
            New Rule
          </button>
        </div>

        {/* Rules list */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: colors.textSecondary }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <AnimatePresence>
              {rules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  colors={colors}
                  getButtonStyle={getButtonStyle}
                  getInsetStyle={getInsetStyle}
                  onToggle={(active) => toggleMutation.mutate({ ruleId: rule.id, active })}
                  onDelete={() => deleteMutation.mutate(rule.id)}
                  onEdit={() => { setEditingRule(rule); setShowCreateForm(true); }}
                />
              ))}
            </AnimatePresence>
            {rules.length === 0 && (
              <div style={{
                ...getInsetStyle(),
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
              }}>
                <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
                  No rules yet. Create an admin rule or complete a training module to auto-generate rules.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      <AnimatePresence>
        {showCreateForm && (
          <RuleFormModal
            rule={editingRule}
            colors={colors}
            getButtonStyle={getButtonStyle}
            getInsetStyle={getInsetStyle}
            onClose={() => { setShowCreateForm(false); setEditingRule(null); }}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['ommni-rules'] });
              setShowCreateForm(false);
              setEditingRule(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Rule Card ──
function RuleCard({ rule, colors, getButtonStyle, getInsetStyle, onToggle, onDelete, onEdit }) {
  const isTraining = rule.source_type === 'training';
  const Icon = isTraining ? GraduationCap : Shield;
  const accentColor = isTraining ? '#7c3aed' : '#0891b2';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      style={{
        ...getButtonStyle(),
        borderRadius: '14px',
        padding: '16px',
        opacity: rule.active ? 1 : 0.55,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          flexShrink: 0,
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: `${accentColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: `${accentColor}15`,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {rule.trigger_type}
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: rule.active ? '#22c55e15' : '#6b728015',
              color: rule.active ? '#22c55e' : '#6b7280',
            }}>
              {rule.active ? 'Active' : 'Disabled'}
            </span>
            {rule.priority > 0 && (
              <span style={{ fontSize: '10px', fontWeight: 600, color: colors.textTertiary }}>
                Priority: {rule.priority}
              </span>
            )}
          </div>

          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: colors.text,
            marginBottom: '4px',
          }}>
            {rule.notification_text}
          </p>

          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: colors.textSecondary }}>
            <span>
              <strong style={{ color: colors.textTertiary }}>Match:</strong> {rule.condition_value}
            </span>
            {rule.source_label && (
              <span>
                <strong style={{ color: colors.textTertiary }}>Source:</strong> {rule.source_label}
              </span>
            )}
            {rule.user_email && (
              <span>
                <strong style={{ color: colors.textTertiary }}>User:</strong> {rule.user_email}
              </span>
            )}
            {rule.expires_at && (
              <span>
                <strong style={{ color: colors.textTertiary }}>Expires:</strong> {new Date(rule.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={onEdit}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggle(!rule.active)}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: rule.active ? '#22c55e' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Create/Edit Form Modal ──
function RuleFormModal({ rule, colors, getButtonStyle, getInsetStyle, onClose, onSaved }) {
  const [form, setForm] = useState({
    trigger_type: rule?.trigger_type || 'keyword',
    condition_value: rule?.condition_value || '',
    notification_text: rule?.notification_text || '',
    priority: rule?.priority || 0,
    active: rule?.active ?? true,
    semantic_threshold: rule?.semantic_threshold || 0.75,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const me = await base44.auth.me();
      if (rule?.id) {
        await base44.entities.OmmniRule.update(rule.id, form);
      } else {
        await base44.entities.OmmniRule.create({
          ...form,
          source_type: 'admin',
          source_label: 'Admin rule',
          created_by: me?.email,
        });
      }
      onSaved();
    } catch (e) {
      console.error('Save rule error:', e);
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{
          background: colors.bg,
          boxShadow: `20px 20px 40px ${colors.shadowDark}, -20px -20px 40px ${colors.shadowLight}`
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: colors.text }}>
            {rule ? 'Edit Rule' : 'New OMMNI Rule'}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              ...getButtonStyle(),
            }}
          >
            <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Trigger type */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px', display: 'block' }}>
              Trigger Type
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['keyword', 'regex', 'semantic'].map(type => (
                <button
                  key={type}
                  onClick={() => setForm(f => ({ ...f, trigger_type: type }))}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: form.trigger_type === type ? '#0891b2' : colors.border,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: form.trigger_type === type ? '#0891b215' : 'transparent',
                    color: form.trigger_type === type ? '#0891b2' : colors.textSecondary,
                    textTransform: 'capitalize',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Condition value */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px', display: 'block' }}>
              {form.trigger_type === 'keyword' ? 'Keyword (case-insensitive)' :
               form.trigger_type === 'regex' ? 'Regex Pattern' :
               'Semantic Concept (phrase to match meaning)'}
            </label>
            <input
              value={form.condition_value}
              onChange={e => setForm(f => ({ ...f, condition_value: e.target.value }))}
              placeholder={form.trigger_type === 'keyword' ? 'e.g. FRG' :
                           form.trigger_type === 'regex' ? 'e.g. \\bFRG\\b' :
                           'e.g. referring to employees as FRG'}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '14px',
                color: colors.text,
                ...getInsetStyle(),
              }}
            />
          </div>

          {/* Notification text */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px', display: 'block' }}>
              Notification Text
            </label>
            <textarea
              value={form.notification_text}
              onChange={e => setForm(f => ({ ...f, notification_text: e.target.value }))}
              placeholder="e.g. We no longer refer to them as FRG employees. Do not use this term."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '14px',
                color: colors.text,
                resize: 'none',
                ...getInsetStyle(),
              }}
            />
          </div>

          {/* Priority + threshold */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px', display: 'block' }}>
                Priority
              </label>
              <input
                type="number"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '14px',
                  color: colors.text,
                  ...getInsetStyle(),
                }}
              />
            </div>
            {form.trigger_type === 'semantic' && (
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px', display: 'block' }}>
                  Similarity Threshold
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={form.semantic_threshold}
                  onChange={e => setForm(f => ({ ...f, semantic_threshold: parseFloat(e.target.value) || 0.75 }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '14px',
                    color: colors.text,
                    ...getInsetStyle(),
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          padding: '16px 24px',
          borderTop: `1px solid ${colors.border}`,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              ...getButtonStyle(),
              color: colors.textSecondary,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.condition_value || !form.notification_text || saving}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              background: (!form.condition_value || !form.notification_text) ? colors.bg : 'linear-gradient(135deg, #0891b2, #06b6d4)',
              color: (!form.condition_value || !form.notification_text) ? colors.textTertiary : '#fff',
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : rule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}