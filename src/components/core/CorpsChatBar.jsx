import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// CORPS AI chat box — white container with the action button in the
// bottom-right corner, like the reference AI-provider layout.
export default function CorpsChatBar() {
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);
  const respRef = useRef(null);

  useEffect(() => {
    if (expanded && inputRef.current) inputRef.current.focus();
  }, [expanded]);

  useEffect(() => {
    if (respRef.current) respRef.current.scrollTop = respRef.current.scrollHeight;
  }, [conversation, loading]);

  const send = async (text) => {
    const trimmed = (text ?? prompt).trim();
    if (!trimmed || loading) return;
    setExpanded(true);
    setLoading(true);
    setConversation(prev => prev ? [...prev, { role: 'user', text: trimmed }] : [{ role: 'user', text: trimmed }]);
    setPrompt('');
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
    e.preventDefault();
    send();
  };

  const handleClose = () => {
    setExpanded(false);
    setConversation(null);
    setPrompt('');
  };

  return (
    <div className="px-4 sm:px-6 pt-3 pb-1 flex-shrink-0">
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: '#ffffff',
          border: '1px solid #d1e7dd',
          boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
          maxHeight: expanded ? '55vh' : 'none',
        }}
      >
        {/* Conversation area (only when expanded) */}
        {expanded && conversation && (
          <div ref={respRef} className="overflow-y-auto px-5 py-4 space-y-3" style={{ background: '#f8faf8', flex: 1 }}>
            {conversation.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? { background: '#22c55e', color: '#ffffff' }
                      : { background: '#ffffff', color: '#1a2e1a', border: '1px solid #e5e7e5' }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2" style={{ background: '#ffffff', border: '1px solid #e5e7e5' }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#16a34a' }} />
                  <span className="text-sm" style={{ color: '#6b7280' }}>Thinking…</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input area — white box with button in bottom-right */}
        <div className="px-5 pt-4 pb-3" style={{ background: '#ffffff' }}>
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: '#28a745' }} />
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onFocus={() => setExpanded(true)}
              placeholder="Ask MAJOR anything — payroll, timecards, schedules, benefits…"
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm font-medium leading-relaxed"
              style={{ color: '#1a2e1a', caretColor: '#28a745', minHeight: '24px' }}
            />
            {expanded && (
              <button
                onClick={handleClose}
                className="p-1 rounded-lg transition-colors hover:bg-gray-100 flex-shrink-0 mt-0.5"
                style={{ color: '#9ca3af' }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Action row — button in bottom-right */}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: '#28a745',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(40,167,69,0.4)',
              }}
            >
              <Send className="w-3.5 h-3.5" />
              Ask MAJOR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}