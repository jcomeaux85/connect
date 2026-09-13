import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, X, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

// MAJOR — the CORPS// AI assistant.
// Containerless full-width CRT prompt surface: scanlines, glowing pixelated
// green text (VT323), auto-grows as you type, background adapts to light/dark.
// Example prompt overlay (dim phosphor) fills the surface when empty/unfocused.

const ROTATING_PROMPTS = [
  "Want to know how many of your full time employees that were hired on days with temps higher than 85 degrees contribute more than 50$ to their 401k per pay period, but never work overtime, have never called in on a Friday, and have the same 2 emails on file since their hire date?",
  "Show me every part-time employee who clocked in late on a Monday after a holiday, took a lunch break longer than 45 minutes, and whose manager approved overtime in the same week they filed a PTO request.",
  "Find all salaried staff hired in odd-numbered months whose emergency contact shares a last name with another employee, has a 401k contribution that is a prime number, and has never missed a scheduled shift on a rainy Tuesday.",
  "List employees whose pay frequency changed twice in the last year, have a retirement contribution within $7 of $200, work in a department with an even headcount, and whose last clock-out was within 3 minutes of their shift end.",
  "How many hourly employees took exactly 2 sick days in Q2, have a PTO balance ending in a 5 or 0, were hired by a manager who no longer works here, and have a phone number with a 777 somewhere in it?",
];

export default function CorpsChatBar() {
  const { isDark } = useTheme();
  const [inputCollapsed, setInputCollapsed] = useState(false);
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
  const minHeight = showExample ? Math.max(exampleHeight, 120) : 120;

  // Theme-adaptive CRT palette
  const text = isDark ? '#00FF41' : '#0a6a14';
  const textGlow = isDark
    ? '0 0 8px rgba(0,255,65,0.55), 0 0 14px rgba(0,255,65,0.2)'
    : '0 0 4px rgba(10,106,20,0.25)';
  const dimText = isDark ? 'rgba(0,255,65,0.32)' : 'rgba(10,106,20,0.4)';
  const assistantText = isDark ? '#86efac' : '#0a5a0a';
  const borderTint = isDark ? 'rgba(0,255,65,0.25)' : 'rgba(10,106,20,0.2)';
  const bubbleBg = isDark ? 'rgba(0,255,65,0.05)' : 'rgba(10,106,20,0.04)';

  return (
    <div className="flex-shrink-0 w-full px-4 sm:px-6">
      <style>{`
        .crt-surface { position: relative; font-family: 'VT323', ui-monospace, monospace; }
        .crt-surface::before {
          content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 1px, transparent 1px 3px);
        }
        .crt-surface-light::before {
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 3px);
        }
        .crt-edit { background: transparent !important; box-shadow: none !important; border: none !important; outline: none !important; }
        .crt-edit:empty:before { content: ''; }
      `}</style>
      <div
        className={`crt-surface ${isDark ? '' : 'crt-surface-light'} w-full overflow-hidden`}
        style={{ background: isDark ? '#000500' : '#eef5ee', transition: 'background 0.3s ease' }}
      >
        {/* Conversation area — sits on the CRT surface */}
        {expanded && conversation && (
          <div ref={respRef} className="relative z-[2] overflow-y-auto px-5 py-4 space-y-3" style={{ maxHeight: '40vh', minHeight: '120px' }}>
            {conversation.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-4 py-2 whitespace-pre-wrap leading-relaxed"
                  style={{
                    fontFamily: "'VT323', ui-monospace, monospace",
                    fontSize: '20px',
                    color: msg.role === 'user' ? text : assistantText,
                    textShadow: msg.role === 'user' ? textGlow : 'none',
                    border: `1px solid ${borderTint}`,
                    background: bubbleBg,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-2 flex items-center gap-2"
                  style={{
                    fontFamily: "'VT323', ui-monospace, monospace",
                    fontSize: '20px',
                    color: assistantText,
                    border: `1px solid ${borderTint}`,
                  }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: text }} />
                  <span>MAJOR is thinking…</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompt input — collapsible via the bottom arrow (accordion upward) */}
        <AnimatePresence initial={false}>
          {!inputCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="relative z-[2] flex items-start gap-3 px-5 py-4">
                <div className="relative flex-1 min-w-0">
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
                    className="crt-edit w-full break-words"
                    style={{
                      color: text,
                      textShadow: textGlow,
                      fontFamily: "'VT323', ui-monospace, monospace",
                      fontSize: '26px',
                      lineHeight: 1.2,
                      caretColor: '#00FF41',
                      minHeight: minHeight,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  />
                  {/* Example prompt overlay — dim phosphor green */}
                  {showExample && (
                    <div
                      ref={overlayRef}
                      className="absolute top-0 left-0 right-0 pointer-events-none"
                      style={{
                        color: dimText,
                        fontFamily: "'VT323', ui-monospace, monospace",
                        fontSize: '24px',
                        lineHeight: 1.2,
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
                    className="p-1.5 flex-shrink-0 mt-1 transition-colors"
                    style={{ color: assistantText, background: 'transparent', border: 'none', cursor: 'pointer' }}
                    title="Clear"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !prompt.trim()}
                  className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 mt-1"
                  style={{
                    background: prompt.trim() ? '#00FF41' : (isDark ? 'rgba(0,255,65,0.15)' : 'rgba(10,106,20,0.15)'),
                    color: prompt.trim() ? '#001a00' : (isDark ? 'rgba(0,255,65,0.5)' : 'rgba(10,106,20,0.5)'),
                    boxShadow: prompt.trim() ? '0 0 10px rgba(0,255,65,0.6)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title="Ask MAJOR"
                >
                  <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom arrow — toggles the prompt text area (accordion upward) */}
        <button
          onClick={() => setInputCollapsed((c) => !c)}
          className="relative z-[2] w-full flex items-center justify-center py-2 transition-colors"
          style={{ color: assistantText, background: 'transparent', border: 'none', cursor: 'pointer' }}
          title={inputCollapsed ? 'Expand prompt' : 'Collapse prompt'}
        >
          {inputCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}