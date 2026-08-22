import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// MAJOR — the CORPS// AI assistant.
// Container carries the neumorphic background (no inner white box).
// Example prompt: dark grey, italic, full multi-line, ~5 reserved empty lines.
// On focus: example clears, blinking cursor, typed text is black non-italic.
// Uses a contentEditable div (not a textarea) so the .corps-neu textarea CSS
// override can't inject an inner-box background.

const ROTATING_PROMPTS = [
  "Want to know how many of your full time employees that were hired on days with temps higher than 85 degrees contribute more than 50$ to their 401k per pay period, but never work overtime, have never called in on a Friday, and have the same 2 emails on file since their hire date?",
  "Show me every part-time employee who clocked in late on a Monday after a holiday, took a lunch break longer than 45 minutes, and whose manager approved overtime in the same week they filed a PTO request.",
  "Find all salaried staff hired in odd-numbered months whose emergency contact shares a last name with another employee, has a 401k contribution that is a prime number, and has never missed a scheduled shift on a rainy Tuesday.",
  "List employees whose pay frequency changed twice in the last year, have a retirement contribution within $7 of $200, work in a department with an even headcount, and whose last clock-out was within 3 minutes of their shift end.",
  "How many hourly employees took exactly 2 sick days in Q2, have a PTO balance ending in a 5 or 0, were hired by a manager who no longer works here, and have a phone number with a 777 somewhere in it?",
];

const LINE_HEIGHT = 24;
const RESERVED_LINES = 5;
const RESERVED_PX = RESERVED_LINES * LINE_HEIGHT;

export default function CorpsChatBar() {
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  const [phIndex] = useState(() => Math.floor(Math.random() * ROTATING_PROMPTS.length));
  const [exampleHeight, setExampleHeight] = useState(0);
  const editRef = useRef(null);
  const overlayRef = useRef(null);
  const respRef = useRef(null);

  useEffect(() => {
    if (expanded && editRef.current) editRef.current.focus();
  }, [expanded]);

  useEffect(() => {
    if (respRef.current) respRef.current.scrollTop = respRef.current.scrollHeight;
  }, [conversation, loading]);

  useEffect(() => {
    if (overlayRef.current) setExampleHeight(overlayRef.current.scrollHeight);
  }, [phIndex, focused]);

  const send = async (text) => {
    const trimmed = (text ?? prompt).trim();
    if (!trimmed || loading) return;
    setExpanded(true);
    setLoading(true);
    setConversation(prev => prev ? [...prev, { role: 'user', text: trimmed }] : [{ role: 'user', text: trimmed }]);
    setPrompt('');
    if (editRef.current) editRef.current.textContent = '';
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are MAJOR — the CORPS// assistant, a concise, helpful AI for payroll, timecards, scheduling, HR, and benefits operations. Answer clearly and briefly.\n\nUser: ${trimmed}`,
      });
      const out = typeof res === 'string' ? res : (res?.text || res?.response || JSON.stringify(res));
      setConversation(prev => [...prev, { role: 'assistant', text: out }]);
    } catch (err) {
      setConversation(prev => [...prev, { role: 'assistant', text: 'Sorry, I could not process that right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    send();
  };

  const handleClose = () => {
    setExpanded(false);
    setConversation(null);
    setPrompt('');
    if (editRef.current) editRef.current.textContent = '';
  };

  const showExample = !prompt && !focused;
  const containerMinHeight = showExample ? (exampleHeight + RESERVED_PX) : RESERVED_PX;

  return (
    <div className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0 flex justify-center">
      {/* Self-contained style override — beats the .corps-neu textarea/input rules */}
      <style>{`
        .corps-chat-shell {
          background: var(--neu-bg, #e8e8ee) !important;
          box-shadow: 6px 6px 1px var(--neu-dark, #c5c5cf), -6px -6px 1px var(--neu-light, #ffffff) !important;
          border: none !important;
        }
        .corps-chat-edit {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          outline: none !important;
        }
        .corps-chat-edit:empty:before {
          content: '';
        }
      `}</style>
      <div
        className="corps-chat-shell w-full max-w-3xl rounded-3xl overflow-hidden flex flex-col transition-all duration-300"
        style={{ maxHeight: expanded ? '60vh' : 'none' }}
      >
        {/* RME of ONE header banner — black backdrop so the dark graphic blends in */}
        <div className="w-full" style={{ background: '#F0F0F0' }}>
          <img
            src="https://media.base44.com/images/public/68fa7c4cb70fe91d38015eba/cd80b6962_RMEofONE_glitchBnew2b.png"
            alt="CORPS // RME of ONE — Unifying Risk Management Enterprise"
            className="w-full h-auto block select-none"
            draggable={false}
          />
        </div>

        {/* Conversation area */}
        {expanded && conversation && (
          <div ref={respRef} className="overflow-y-auto px-5 py-4 space-y-3" style={{ background: 'rgba(255,255,255,0.4)', flex: 1, minHeight: '120px' }}>
            {conversation.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed"
                  style={msg.role === 'user'
                    ? { background: '#22c55e', color: '#ffffff' }
                    : { background: '#ffffff', color: '#1a2e1a', border: '1px solid #e5e7e5' }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2" style={{ background: '#ffffff', border: '1px solid #e5e7e5' }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#16a34a' }} />
                  <span className="text-sm" style={{ color: '#6b7280' }}>MAJOR is thinking…</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompt input — container IS the background, no inner box */}
        <div className="px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full mt-1" style={{ background: '#dcfce7' }}>
              <Sparkles className="w-4 h-4" style={{ color: '#28a745' }} />
            </div>
            <div className="flex-1 relative" style={{ minHeight: containerMinHeight }}>
              {/* contentEditable div — not a textarea, so neumorphic CSS can't touch it */}
              <div
                ref={editRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setPrompt(e.currentTarget.textContent)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                onFocus={() => { setFocused(true); setExpanded(true); }}
                onBlur={() => setFocused(false)}
                className="corps-chat-edit w-full text-base leading-relaxed break-words"
                style={{
                  color: '#000000',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  caretColor: '#28a745',
                  minHeight: RESERVED_PX,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              />
              {/* Example prompt overlay — dark grey, italic, full multi-line */}
              {showExample && (
                <div
                  ref={overlayRef}
                  className="absolute top-0 left-0 right-0 pointer-events-none text-base leading-relaxed"
                  style={{
                    color: '#333333',
                    fontStyle: 'italic',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {ROTATING_PROMPTS[phIndex]}
                </div>
              )}
            </div>
            {expanded && (
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg transition-colors flex-shrink-0 mt-1"
                style={{ color: '#9ca3af' }}
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 mt-1"
              style={{
                background: prompt.trim() ? '#28a745' : '#d1d5db',
                color: '#ffffff',
                boxShadow: prompt.trim() ? '0 2px 8px rgba(40,167,69,0.4)' : 'none',
              }}
              title="Ask MAJOR"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}