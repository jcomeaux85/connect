import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Clock, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/ThemeProvider';

const CLIENT_COMPANIES = ['PSP', 'DOHRN', 'TEKNIPLEX', 'AMBA', 'AOPS', 'Brandywine', 'Buddys', 'Cogstate', 'Cynosure', 'GCL', 'Lazer', 'Onin', 'PAM'];
const BENEFIT_AREAS = ['401k/Retirement', 'COBRA/FMLA/LOA', 'Dental', 'General Benefits', 'HSA/FSA/HRA', 'Life Insurance', 'LTD', 'Medical', 'Prescription/Rx', 'STD', 'Vision', 'Voluntary/Worksite', 'N/A'];
const SERVICE_REASONS = ['Ben Admin System Issue/Error', 'Benefits Guide Request', 'COCC Request', 'Claims Appeal Assistance', 'Claims Assistance', 'Demographics Changes', 'Documentation Request', 'Documentation Submission', 'Enrollment Assistance', 'General Questions', 'ID Card Inquiry/Issue', 'Network Provider Questions', 'New Hire', 'Payroll Issue', 'Prior Authorization Assistance', 'QLE Assistance', 'Tax Form Request', 'Waive Benefits', 'Other'];
const RESOLUTION_STATUSES = ['Resolved on First Call', 'Resolved with Follow-Up Complete', 'Pending Awaiting Carrier', 'Pending Awaiting Client HR', 'Pending Awaiting Member Docs', 'Escalated to Supervisor', 'Escalated to Compliance', 'Transferred', 'Callback Scheduled'];
const COMPLIANCE_FLAGS = ['Caller requested supervisor', 'Possible HIPAA concern raised', 'Incorrect information may have been given', 'Caller expressed intent to file complaint', 'Agent unsure of answer provided', 'Caller referenced legal action', 'Benefit denial dispute', 'Discrimination or bias concern raised', 'Agent needed to correct themselves mid-call', 'None'];
const ACTIONS_LIST = ['Verified member identity', 'Looked up plan details', 'Contacted carrier on behalf of member', 'Submitted ticket/case', 'Sent follow-up email to member', 'Sent follow-up email to client HR', 'Transferred call', 'Placed call on hold', 'Provided forms or documents', 'Updated member information', 'Scheduled callback'];
const SENTIMENTS = ['Frustrated', 'Confused', 'Neutral', 'Satisfied', 'Happy'];
const S_EMOJI = { Frustrated: '😤', Confused: '😕', Neutral: '😐', Satisfied: '😊', Happy: '😄' };
const S_COLOR = { Frustrated: '#EF4444', Confused: '#F59E0B', Neutral: '#6B7280', Satisfied: '#3B82F6', Happy: '#10B981' };

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

export default function DispositionForm({ isOpen, onClose, callData, user }) {
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
      setForm(blank());
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isOpen]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const toggleCompliance = v => setForm(p => {
    if (v === 'None') return { ...p, compliance_flags: p.compliance_flags.includes('None') ? [] : ['None'] };
    const sans = p.compliance_flags.filter(x => x !== 'None');
    return { ...p, compliance_flags: sans.includes(v) ? sans.filter(x => x !== v) : [...sans, v] };
  });

  const toggleAction = v => setForm(p => ({
    ...p, actions_taken: p.actions_taken.includes(v) ? p.actions_taken.filter(x => x !== v) : [...p.actions_taken, v]
  }));

  const required = [form.client_company, form.benefit_area, form.service_reason, form.resolution_status];
  const bonus = [form.caller_name, form.compliance_flags.length > 0, form.actions_taken.length > 0, form.sentiment_start, form.sentiment_end, form.handling_rating > 0, form.difficulty_rating > 0, form.call_notes];
  const progress = Math.min(100, Math.round(required.filter(Boolean).length * 20 + bonus.filter(Boolean).length * 5));

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
      ...form, case_id: callData?.caseId || '', user_email: user?.email || '',
      completion_time_seconds: secs, submitted_at: new Date().toISOString(),
    });
    setSubmissionSecs(secs);
    setSubmitted(true);
    setSaving(false);
  };

  const handleNextCall = () => {
    const company = form.client_company;
    setForm({ ...blank(), client_company: company });
    setSubmitted(false);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  // Shared styles
  const inp = (err) => ({
    width: '100%', height: '40px', border: 'none', borderRadius: '12px',
    padding: '0 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    background: colors.bg, color: colors.text, appearance: 'none',
    boxShadow: err
      ? `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}, 0 0 0 2px #EF4444`
      : `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
  });
  const lbl = (err) => ({ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: err ? '#EF4444' : colors.textSecondary });
  const sec = { marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${colors.border}` };
  const secH = { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', color: colors.text, marginBottom: '12px' };

  const Num = ({ n }) => (
    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: colors.bg, flexShrink: 0, boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: colors.textSecondary }}>
      {n}
    </span>
  );

  const Toggle = ({ val, onToggle, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color: colors.text, fontSize: '14px' }}>{label}</span>
      <button onClick={() => onToggle(!val)} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s', background: val ? '#10B981' : colors.bg, boxShadow: val ? 'inset 1px 1px 3px rgba(0,0,0,0.2)' : `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}` }}>
        <span style={{ position: 'absolute', top: '2px', left: val ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
      </button>
    </div>
  );

  const CB = ({ checked, label, onChange }) => (
    <label onClick={onChange} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '5px 8px', borderRadius: '8px', userSelect: 'none', background: checked ? '#3B82F618' : 'transparent' }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', background: checked ? '#3B82F6' : colors.bg, boxShadow: checked ? 'none' : `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}` }}>
        {checked && <Check style={{ width: '10px', height: '10px', color: '#fff' }} />}
      </div>
      <span style={{ color: colors.text, fontSize: '13px', lineHeight: '1.3' }}>{label}</span>
    </label>
  );

  const Stars = ({ val, onChange, label, hint }) => (
    <div>
      <label style={lbl(false)}>{label}</label>
      {hint && <p style={{ color: colors.textTertiary, fontSize: '10px', marginBottom: '5px' }}>{hint}</p>}
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n === val ? 0 : n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
            <Star style={{ width: '22px', height: '22px', color: n <= val ? '#F59E0B' : colors.border, fill: n <= val ? '#F59E0B' : 'none', transition: 'all 0.1s' }} />
          </button>
        ))}
      </div>
    </div>
  );

  // ── Confirmation screen ──
  if (submitted) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: `${colors.bg}f0`, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: colors.bg, borderRadius: '24px', padding: '40px', maxWidth: '460px', width: '100%', textAlign: 'center', boxShadow: `20px 20px 40px ${colors.shadowDark}, -20px -20px 40px ${colors.shadowLight}` }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(145deg,#10B981,#059669)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(16,185,129,0.4)' }}>
            <Check style={{ width: '32px', height: '32px', color: '#fff' }} />
          </div>
          <h2 style={{ color: colors.text, fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>Disposition Submitted!</h2>
          <p style={{ color: colors.textSecondary, marginBottom: '20px', fontSize: '14px' }}>
            Completed in <strong style={{ color: colors.text }}>{fmt(submissionSecs)}</strong>
            {submissionSecs <= 60 && <span style={{ color: '#10B981', fontWeight: '600' }}> ⚡ Under 60s!</span>}
          </p>
          <div style={{ background: colors.bg, boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`, borderRadius: '16px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ color: colors.textTertiary, fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>Summary</div>
            {[['Client', form.client_company], ['Benefit Area', form.benefit_area], ['Service Reason', form.service_reason === 'Other' ? (form.service_reason_custom || 'Other') : form.service_reason], ['Status', form.resolution_status]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: colors.textSecondary, minWidth: '95px' }}>{k}:</span>
                <span style={{ color: colors.text, fontWeight: '600' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ flex: 1, height: '44px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', ...getButtonStyle(), color: colors.textSecondary }}>Close</button>
            <button onClick={handleNextCall} style={{ flex: 1, height: '44px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: 'linear-gradient(145deg,#3B82F6,#2563EB)', color: '#fff', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}>Next Call →</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: `${colors.bg}f0`, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '16px' }}>
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{ background: colors.bg, borderRadius: '24px', width: '100%', maxWidth: '740px', marginBottom: '20px', boxShadow: `16px 16px 32px ${colors.shadowDark}, -16px -16px 32px ${colors.shadowLight}` }}
      >
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: colors.bg, borderRadius: '24px 24px 0 0', padding: '14px 20px 12px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <h2 style={{ color: colors.text, fontWeight: '700', fontSize: '15px', margin: 0 }}>End-of-Call Disposition</h2>
              {callData?.customerName && <p style={{ color: colors.textSecondary, fontSize: '12px', margin: '2px 0 0' }}>{callData.customerName}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '14px', color: elapsed > 60 ? '#EF4444' : elapsed > 45 ? '#F59E0B' : '#10B981' }}>
                <Clock style={{ width: '14px', height: '14px' }} />
                {fmt(elapsed)}
              </span>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textTertiary, padding: '2px', display: 'flex' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: colors.bg, boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`, overflow: 'hidden' }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} style={{ height: '100%', borderRadius: '3px', background: progress >= 80 ? '#10B981' : progress >= 50 ? '#3B82F6' : '#F59E0B' }} />
            </div>
            <span style={{ color: colors.textTertiary, fontSize: '11px', fontWeight: '600', minWidth: '34px' }}>{progress}%</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>

          {/* §1 Call Identification */}
          <div style={sec}>
            <div style={secH}><Num n="1" /> Call Identification</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl(errors.client_company)}>Client Company *</label>
                <select value={form.client_company} onChange={e => { set('client_company', e.target.value); setErrors(p => ({...p, client_company: false})); }} style={inp(errors.client_company)}>
                  <option value="">Select client...</option>
                  {CLIENT_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl(false)}>Caller Name</label>
                <input value={form.caller_name} onChange={e => set('caller_name', e.target.value)} placeholder="Enter name..." style={inp(false)} />
              </div>
              <div>
                <label style={lbl(false)}>Call Type</label>
                <select value={form.call_type} onChange={e => set('call_type', e.target.value)} style={inp(false)}>
                  <option value="Inbound">Inbound</option>
                  <option value="Outbound">Outbound</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '6px' }}>
                <Toggle val={form.is_vip} onToggle={v => set('is_vip', v)} label="⭐ VIP Caller" />
              </div>
            </div>
          </div>

          {/* §2 Call Classification */}
          <div style={sec}>
            <div style={secH}><Num n="2" /> Call Classification</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl(errors.benefit_area)}>Benefit Area *</label>
                <select value={form.benefit_area} onChange={e => { set('benefit_area', e.target.value); setErrors(p => ({...p, benefit_area: false})); }} style={inp(errors.benefit_area)}>
                  <option value="">Select area...</option>
                  {BENEFIT_AREAS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl(errors.service_reason)}>Service Reason *</label>
                <select value={form.service_reason} onChange={e => { set('service_reason', e.target.value); setErrors(p => ({...p, service_reason: false})); }} style={inp(errors.service_reason)}>
                  <option value="">Select reason...</option>
                  {SERVICE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {form.service_reason === 'Other' && (
                  <input value={form.service_reason_custom} onChange={e => set('service_reason_custom', e.target.value)} placeholder="Describe the reason..." style={{ ...inp(false), marginTop: '8px' }} />
                )}
              </div>
            </div>
          </div>

          {/* §3 Resolution */}
          <div style={sec}>
            <div style={secH}><Num n="3" /> Resolution</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={lbl(errors.resolution_status)}>Status *</label>
                <select value={form.resolution_status} onChange={e => { set('resolution_status', e.target.value); setErrors(p => ({...p, resolution_status: false})); }} style={inp(errors.resolution_status)}>
                  <option value="">Select status...</option>
                  {RESOLUTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl(false)}>Task Priority</label>
                <select value={form.task_priority} onChange={e => set('task_priority', e.target.value)} style={inp(false)}>
                  {['Urgent', 'High', 'Normal', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <Toggle val={form.follow_up_required} onToggle={v => set('follow_up_required', v)} label="Follow-Up Required" />
            {form.follow_up_required && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginTop: '12px' }}>
                <div>
                  <label style={lbl(false)}>Follow-Up Date</label>
                  <input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} style={inp(false)} />
                </div>
                <div>
                  <label style={lbl(false)}>Notes</label>
                  <input value={form.follow_up_notes} onChange={e => set('follow_up_notes', e.target.value)} placeholder="Follow-up notes..." style={inp(false)} />
                </div>
              </div>
            )}
          </div>

          {/* §4 Compliance Flags */}
          <div style={sec}>
            <div style={secH}>
              <Num n="4" /> Compliance &amp; Escalation Flags
              <span style={{ color: colors.textTertiary, fontWeight: '400', fontSize: '11px' }}>— select all that apply</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
              {COMPLIANCE_FLAGS.map(f => (
                <CB key={f} label={f} checked={form.compliance_flags.includes(f)} onChange={() => toggleCompliance(f)} />
              ))}
            </div>
          </div>

          {/* §5 Actions Taken */}
          <div style={sec}>
            <div style={secH}>
              <Num n="5" /> Actions Taken
              <span style={{ color: colors.textTertiary, fontWeight: '400', fontSize: '11px' }}>— select all that apply</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
              {ACTIONS_LIST.map(a => (
                <CB key={a} label={a} checked={form.actions_taken.includes(a)} onChange={() => toggleAction(a)} />
              ))}
            </div>
          </div>

          {/* §6 Caller Sentiment */}
          <div style={sec}>
            <div style={secH}><Num n="6" /> Caller Sentiment</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {['start', 'end'].map(when => {
                const field = when === 'start' ? 'sentiment_start' : 'sentiment_end';
                const sel = form[field];
                return (
                  <div key={when}>
                    <label style={lbl(false)}>At {when === 'start' ? 'Start' : 'End'} of Call</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {SENTIMENTS.map(s => (
                        <button key={s} onClick={() => set(field, sel === s ? '' : s)} title={s} style={{ border: 'none', cursor: 'pointer', borderRadius: '10px', padding: '7px 10px', fontSize: '18px', transition: 'all 0.15s', background: sel === s ? `${S_COLOR[s]}20` : colors.bg, boxShadow: sel === s ? `0 0 0 2px ${S_COLOR[s]}, inset 2px 2px 4px ${colors.shadowDark}40` : `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}` }}>
                          {S_EMOJI[s]}
                        </button>
                      ))}
                    </div>
                    {sel && <p style={{ color: S_COLOR[sel], fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>{sel}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* §7 Agent Self-Assessment */}
          <div style={sec}>
            <div style={secH}><Num n="7" /> Agent Self-Assessment</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
              <Stars val={form.handling_rating} onChange={v => set('handling_rating', v)} label="Call Handling" hint="1 = Rough  ·  5 = Nailed it" />
              <Stars val={form.difficulty_rating} onChange={v => set('difficulty_rating', v)} label="Call Difficulty" hint="1 = Easy  ·  5 = Complex" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Toggle val={form.could_automate} onToggle={v => set('could_automate', v)} label="Could this be automated?" />
              <Toggle val={form.knowledge_gap} onToggle={v => set('knowledge_gap', v)} label="Knowledge gap identified?" />
              {form.knowledge_gap && (
                <input value={form.knowledge_gap_notes} onChange={e => set('knowledge_gap_notes', e.target.value)} placeholder="Describe the knowledge gap..." style={{ ...inp(false), marginTop: '2px' }} />
              )}
            </div>
          </div>

          {/* §8 Notes */}
          <div>
            <div style={secH}><Num n="8" /> Notes</div>
            <textarea
              value={form.call_notes}
              onChange={e => set('call_notes', e.target.value)}
              placeholder="Call notes..."
              rows={3}
              style={{ width: '100%', border: 'none', borderRadius: '12px', padding: '10px 12px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '8px', background: colors.bg, color: colors.text, boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}` }}
            />
            <CB label="Enable Reminder" checked={form.enable_reminder} onChange={() => set('enable_reminder', !form.enable_reminder)} />
          </div>
        </div>

        {/* Sticky Footer */}
        <div style={{ position: 'sticky', bottom: 0, background: colors.bg, borderRadius: '0 0 24px 24px', padding: '12px 20px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
          {Object.values(errors).some(Boolean) && (
            <span style={{ color: '#EF4444', fontSize: '12px' }}>Please fill in all required fields (*)</span>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ height: '42px', padding: '0 18px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', ...getButtonStyle(), color: colors.textSecondary }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ height: '42px', padding: '0 28px', borderRadius: '12px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 12px rgba(59,130,246,0.35)', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Submitting...' : '✓ Submit Disposition'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}