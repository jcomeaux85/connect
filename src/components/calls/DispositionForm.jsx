import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';

const CLIENT_COMPANIES = ['PSP', 'DOHRN', 'TEKNIPLEX', 'AMBA', 'AOPS', 'Brandywine', 'Buddys', 'Cogstate', 'Cynosure', 'GCL', 'Lazer', 'Onin', 'PAM'];
const BENEFIT_AREAS = ['401k/Retirement', 'COBRA/FMLA/LOA', 'Dental', 'General Benefits', 'HSA/FSA/HRA', 'Life Insurance', 'LTD', 'Medical', 'Prescription/Rx', 'STD', 'Vision', 'Voluntary/Worksite', 'N/A'];
const SERVICE_REASONS = ['Ben Admin System Issue/Error', 'Benefits Guide Request', 'COCC Request', 'Claims Appeal Assistance', 'Claims Assistance', 'Demographics Changes', 'Documentation Request', 'Documentation Submission', 'Enrollment Assistance', 'General Questions', 'ID Card Inquiry/Issue', 'Network Provider Questions', 'New Hire', 'Payroll Issue', 'Prior Authorization Assistance', 'QLE Assistance', 'Tax Form Request', 'Waive Benefits', 'Other'];
const RESOLUTION_STATUSES = ['Resolved on First Call', 'Resolved with Follow-Up Complete', 'Pending Awaiting Carrier', 'Pending Awaiting Client HR', 'Pending Awaiting Member Docs', 'Escalated to Supervisor', 'Escalated to Compliance', 'Transferred', 'Callback Scheduled'];
const SENTIMENTS = ['Frustrated', 'Confused', 'Neutral', 'Satisfied', 'Happy'];

const blank = () => ({
  client_company: '', caller_name: '', call_type: 'Inbound', is_vip: false,
  benefit_area: '', service_reason: '', service_reason_custom: '',
  resolution_status: '', task_priority: 'Normal',
  follow_up_required: false, follow_up_date: '', follow_up_notes: '',
  compliance_flags: [], actions_taken: [],
  sentiment_start: '', sentiment_end: '',
  handling_rating: 0, difficulty_rating: 0,
  could_automate: false, knowledge_gap: false, knowledge_gap_notes: '',
  call_notes: '', enable_reminder: false,
});

export default function DispositionForm({ isOpen, onClose, callData, user, mustComplete = false }) {
  const { colors, getButtonStyle } = useTheme();
  const [form, setForm] = useState(blank());
  const [elapsed, setElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submissionSecs, setSubmissionSecs] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const startRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startRef.current = Date.now();
      setElapsed(0);
      setSubmitted(false);
      setErrors({});
      setForm({
        ...blank(),
        call_notes: callData?.call_notes || '',
        caller_name: callData?.name || callData?.caller_name || '',
        is_vip: !!(callData?.is_vip || callData?.isVip),
      });
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isOpen]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmit = async () => {
    const errs = {};
    if (!form.client_company) errs.client_company = true;
    if (!form.benefit_area) errs.benefit_area = true;
    if (!form.service_reason) errs.service_reason = true;
    if (!form.resolution_status) errs.resolution_status = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const secs = Math.floor((Date.now() - startRef.current) / 1000);
    await base44.entities.CallDisposition.create({
      ...form,
      case_id: callData?.caseId || callData?.case_id || '',
      user_email: user?.email || '',
      completion_time_seconds: secs,
      submitted_at: new Date().toISOString(),
    });
    if (callData?.callId) {
      try {
        await base44.entities.Call.update(callData.callId, {
          status: 'completed',
          notes: form.call_notes || undefined,
          call_category: form.benefit_area || undefined,
          call_qualifier: form.service_reason || undefined,
          call_end_time: new Date().toISOString(),
        });
      } catch (err) {
        console.error('complete Call failed', err);
      }
    }
    setSubmissionSecs(secs);
    setSubmitted(true);
    setSaving(false);
  };

  if (!isOpen) return null;

  const inp = (err) => ({
    width: '100%', height: '40px', border: 'none', borderRadius: '12px',
    padding: '0 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: colors.bg, color: colors.text,
    boxShadow: err
      ? `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}, 0 0 0 2px #EF4444`
      : `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
  });

  if (submitted) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: `${colors.bg}f0`, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: colors.bg, borderRadius: '24px', padding: '36px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: `20px 20px 40px ${colors.shadowDark}, -20px -20px 40px ${colors.shadowLight}` }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(145deg,#10B981,#059669)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check style={{ width: '28px', height: '28px', color: '#fff' }} />
          </div>
          <h2 style={{ color: colors.text, fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Disposition submitted</h2>
          <p style={{ color: colors.textSecondary, marginBottom: '20px' }}>Completed in {fmt(submissionSecs)}</p>
          <button onClick={onClose} style={{ width: '100%', height: '44px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: 'linear-gradient(145deg,#3B82F6,#2563EB)', color: '#fff', fontWeight: 700 }}>Done</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: `${colors.bg}f0`, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '16px' }}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: colors.bg, borderRadius: '24px', width: '100%', maxWidth: '640px', padding: '20px', boxShadow: `16px 16px 32px ${colors.shadowDark}, -16px -16px 32px ${colors.shadowLight}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ color: colors.text, fontWeight: 700, fontSize: '16px', margin: 0 }}>End-of-call disposition</h2>
            {mustComplete && <p style={{ color: colors.textSecondary, fontSize: '12px', margin: '4px 0 0' }}>Required before returning to idle</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: elapsed > 60 ? '#EF4444' : '#10B981' }}>
              <Clock style={{ width: '14px', height: '14px' }} />{fmt(elapsed)}
            </span>
            {!mustComplete && (
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textTertiary }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={{ color: colors.textSecondary, fontSize: '11px', fontWeight: 600 }}>
            Client *
            <select value={form.client_company} onChange={(e) => { set('client_company', e.target.value); setErrors((p) => ({ ...p, client_company: false })); }} style={{ ...inp(errors.client_company), marginTop: 6 }}>
              <option value="">Select client...</option>
              {CLIENT_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ color: colors.textSecondary, fontSize: '11px', fontWeight: 600 }}>
            Caller
            <input value={form.caller_name} onChange={(e) => set('caller_name', e.target.value)} style={{ ...inp(false), marginTop: 6 }} />
          </label>
          <label style={{ color: colors.textSecondary, fontSize: '11px', fontWeight: 600 }}>
            Benefit area *
            <select value={form.benefit_area} onChange={(e) => { set('benefit_area', e.target.value); setErrors((p) => ({ ...p, benefit_area: false })); }} style={{ ...inp(errors.benefit_area), marginTop: 6 }}>
              <option value="">Select area...</option>
              {BENEFIT_AREAS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label style={{ color: colors.textSecondary, fontSize: '11px', fontWeight: 600 }}>
            Service reason *
            <select value={form.service_reason} onChange={(e) => { set('service_reason', e.target.value); setErrors((p) => ({ ...p, service_reason: false })); }} style={{ ...inp(errors.service_reason), marginTop: 6 }}>
              <option value="">Select reason...</option>
              {SERVICE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label style={{ color: colors.textSecondary, fontSize: '11px', fontWeight: 600 }}>
            Resolution *
            <select value={form.resolution_status} onChange={(e) => { set('resolution_status', e.target.value); setErrors((p) => ({ ...p, resolution_status: false })); }} style={{ ...inp(errors.resolution_status), marginTop: 6 }}>
              <option value="">Select status...</option>
              {RESOLUTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label style={{ color: colors.textSecondary, fontSize: '11px', fontWeight: 600 }}>
            Sentiment end
            <select value={form.sentiment_end} onChange={(e) => set('sentiment_end', e.target.value)} style={{ ...inp(false), marginTop: 6 }}>
              <option value="">Optional</option>
              {SENTIMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <textarea
          value={form.call_notes}
          onChange={(e) => set('call_notes', e.target.value)}
          placeholder="Call notes..."
          rows={3}
          style={{ ...inp(false), height: 'auto', padding: '10px 12px', marginTop: 16, resize: 'vertical' }}
        />

        {Object.values(errors).some(Boolean) && (
          <p style={{ color: '#EF4444', fontSize: '12px', marginTop: 10 }}>Fill required fields (*)</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          {!mustComplete && (
            <button onClick={onClose} style={{ height: 42, padding: '0 18px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, ...getButtonStyle(), color: colors.textSecondary }}>Cancel</button>
          )}
          <button onClick={handleSubmit} disabled={saving} style={{ height: 42, padding: '0 24px', borderRadius: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Submitting...' : 'Submit disposition'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
