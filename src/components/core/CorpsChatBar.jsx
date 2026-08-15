import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// AI command bar for CORPS — prominent, central, like an AI provider's chat box.
// Sends the prompt to InvokeLLM and shows the response inline below the input.
export default function CorpsChatBar() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const respRef = useRef(null);

  // Focus the input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // Auto-scroll response to bottom as it grows
  useEffect(() => {
    if (respRef.current) respRef.current.scrollTop = respRef.current.scrollHeight;
  }, [response, loading]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setResponse(prev => prev ? [...prev, { role: 'user', text: trimmed }] : [{ role: 'user', text: trimmed }]);
    setPrompt('');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the CORPS// assistant — a concise, helpful AI for payroll, timecards, scheduling, HR, and benefits operations. Answer the user's question clearly and briefly.\n\nUser: ${trimmed}`,
      });
      const text = typeof res === 'string' ? res : (res?.text || res?.response || JSON.stringify(res));
      setResponse(prev => [...prev, { role: 'assistant', text }]);
    } catch (err) {
      setResponse(prev => [...prev, { role: 'assistant', text: 'Sorry, I could not process that right now. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResponse(null);
    setPrompt('');
  };

  // Collapsed state — prominent prompt bar with "Chat with AI" button
  if (!open) {
    return (
      <div className="px-4 sm:px-6 pt-3 pb-1 flex-shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); setOpen(true); }}
          className="flex items-center gap-2 rounded-2xl px-4 py-3 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(240,253,244,0.95) 100%)',
            border: '1px solid rgba(34,197,94,0.35)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(34,197,94,0.1)',
          }}
        >
          <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: '#16a34a' }} />
          <input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Ask CORPS AI anything — payroll, timecards, schedules, benefits…"
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
            style={{ color: '#1a2e1a', caretColor: '#22c55e' }}
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(34,197,94,0.4)',
            }}
          >
            <Send className="w-3.5 h-3.5" />
            Chat with AI
          </button>
        </form>
      </div>
    );
  }

  // Expanded state — chat panel with conversation history
  return (
    <div className="px-4 sm:px-6 pt-3 pb-1 flex-shrink-0">
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.98)',
          border: '1px solid rgba(34,197,94,0.35)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(34,197,94,0.1)',
          maxHeight: '50vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            color: '#ffffff',
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold tracking-wide">CORPS AI</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg transition-colors hover:bg-white/20"
            style={{ color: '#ffffff' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation */}
        {response && (
          <div ref={respRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5" style={{ background: '#f8faf8' }}>
            {response.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap"
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
                <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: '#ffffff', border: '1px solid #e5e7e5' }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#16a34a' }} />
                  <span className="text-sm" style={{ color: '#6b7280' }}>Thinking…</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0" style={{ borderTop: '1px solid #e5e7e5' }}>
          <input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your message…"
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
            style={{ color: '#1a2e1a', caretColor: '#22c55e' }}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(34,197,94,0.4)',
            }}
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}