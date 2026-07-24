import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { invokeAI } from "@/api/aiProvider";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import ReactMarkdown from 'react-markdown';
import { useTheme } from "@/components/ThemeProvider";
import { useUser } from "@/components/hooks/useUser";

export default function AIAssistantOrb() {
  const { data: user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you stay productive. I can assist with work tasks, answer questions, help you plan your day, or just chat about whatever's on your mind. What can I do for you?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const scrollRef = useRef(null);
  const chatRef = useRef(null);
  const { colors, getButtonStyle, getInsetStyle, isDark } = useTheme();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && chatRef.current && !chatRef.current.contains(event.target)) {
        const orbButton = document.getElementById('ai-orb-button');
        if (orbButton && !orbButton.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopyMessage = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      // Use the user from the useUser hook directly
      // const user = await base44.auth.me(); // This line is no longer needed

      let casesContext = '';
      if (user && user.email) { // Ensure user data is available
        try {
          const recentCases = await base44.entities.Case.filter(
            { assigned_to: user.email },
            '-updated_date',
            5
          );
          const openCases = recentCases.filter(c => c.status !== 'closed' && c.status !== 'resolved');
          
          if (openCases.length > 0) {
            casesContext = `\n\nUser's current open cases: ${openCases.map(c => 
              `${c.case_number} (${c.customer_name}, Priority: ${c.priority}, Status: ${c.status})`
            ).join(', ')}`;
          }
        } catch (e) {
          // Silent fail
          console.error("Error fetching cases for AI context:", e);
        }
      }


      const conversationHistory = messages
        .slice(-8)
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const response = await invokeAI({
        prompt: `You are a helpful, conversational AI assistant for a call center management application. You're friendly, supportive, and understanding.

Your Primary Role:
- Help with work tasks, case management, customer service
- Assist with time management and productivity
- Answer questions about workflow and best practices
- Provide encouragement and support

Your Secondary Role:
- Answer general questions
- Engage in light conversation to help users decompress
- Be personable and relatable

Important Guidelines:
- Be conversational and natural
- Allow casual conversation, but if it drifts too far from work for multiple messages, gently redirect
- When redirecting, mention specific open cases or tasks they have
- ALWAYS cite sources when providing factual information - include links when relevant
- Format responses with markdown for better readability
- Keep responses helpful but concise

User Context:${casesContext}

Previous conversation:
${conversationHistory}

User: ${userMessage}

Provide a helpful, friendly response. Cite sources when applicable.`,
        add_context_from_internet: true
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Orb Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            id="ai-orb-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[90]"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="w-10 h-10 rounded-full border-0 p-0 overflow-hidden group hover:scale-110 transition-transform flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
              }}
            >
              <span className="text-white font-bold text-xs">Ai</span>
                     </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Interface - Full Screen with Floating Bubbles */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
              background: isDark 
                ? 'rgba(0, 0, 0, 0.4)' 
                : 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <motion.div
              ref={chatRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-4xl h-[85vh] flex flex-col"
            >
              {/* Header - Floating */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-6 py-4 rounded-3xl flex items-center justify-between"
                style={{
                  background: isDark ? 'rgba(26, 29, 41, 0.95)' : 'rgba(224, 229, 236, 0.95)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: isDark
                    ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                    : '0 8px 32px rgba(163, 177, 198, 0.4)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%)',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <span className="text-white font-bold text-lg">AI</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: colors.text }}>
                      BEN|CONNECT AI
                    </h3>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      Your AI Assistant
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-2xl h-10 w-10 border-0 flex items-center justify-center"
                  style={getButtonStyle()}
                >
                  <X className="w-5 h-5" style={{ color: colors.iconColor }} />
                </button>
              </motion.div>

              {/* Messages - No Container, Just Floating Bubbles */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 space-y-4 mb-4"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${colors.textTertiary} transparent`
                }}
              >
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="relative group max-w-[85%]">
                      <div
                        className="rounded-3xl px-6 py-4"
                        style={message.role === 'user' 
                          ? {
                              background: isDark 
                                ? 'rgba(224, 229, 236, 0.95)'
                                : 'rgba(26, 29, 41, 0.95)',
                              color: isDark ? '#1a1d29' : '#E0E5EC',
                              boxShadow: isDark
                                ? '0 8px 24px rgba(224, 229, 236, 0.3)'
                                : '0 8px 24px rgba(0, 0, 0, 0.4)',
                            }
                          : {
                              background: isDark 
                                ? 'rgba(224, 229, 236, 0.95)'
                                : 'rgba(26, 29, 41, 0.95)',
                              backdropFilter: 'blur(20px)',
                              boxShadow: isDark
                                ? '0 8px 24px rgba(224, 229, 236, 0.3)'
                                : '0 8px 24px rgba(0, 0, 0, 0.4)',
                              color: isDark ? '#1a1d29' : '#E0E5EC',
                            }
                        }
                      >
                        {message.role === 'user' ? (
                          <p className="text-base leading-relaxed whitespace-pre-wrap select-text">
                            {message.content}
                          </p>
                        ) : (
                          <div className="text-base leading-relaxed select-text prose prose-sm max-w-none" style={{ color: isDark ? '#1a1d29' : '#E0E5EC' }}>
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span
                            className="text-xs opacity-70"
                            style={{ 
                              color: isDark ? '#6B7280' : '#9CA3AF'
                            }}
                          >
                            {format(new Date(message.timestamp), 'h:mm a')}
                          </span>
                          {message.role === 'assistant' && (
                            <button
                              onClick={() => handleCopyMessage(message.content, index)}
                              className="h-8 w-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={getButtonStyle()}
                            >
                              {copiedIndex === index ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div
                      className="rounded-3xl px-6 py-4 flex items-center gap-3"
                      style={{
                        background: isDark ? 'rgba(26, 29, 41, 0.95)' : 'rgba(224, 229, 236, 0.95)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: isDark
                          ? '0 8px 24px rgba(0, 0, 0, 0.6)'
                          : '0 8px 24px rgba(163, 177, 198, 0.4)',
                      }}
                    >
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#8b5cf6' }} />
                      <span className="text-base" style={{ color: colors.textSecondary }}>Thinking...</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input - Floating */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-4 rounded-3xl"
                style={{
                  background: isDark ? 'rgba(26, 29, 41, 0.95)' : 'rgba(224, 229, 236, 0.95)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: isDark
                    ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                    : '0 8px 32px rgba(163, 177, 198, 0.4)',
                }}
              >
                <div className="flex gap-3">
                  <div className="flex-1" style={{ background: colors.insetBg, boxShadow: colors.insetShadow, borderRadius: '1rem' }}>
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      disabled={isLoading}
                      className="border-0 bg-transparent h-12 focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-4"
                      style={{ color: colors.text }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="h-12 w-12 rounded-2xl border-0 flex items-center justify-center"
                    style={getButtonStyle()}
                  >
                    <Send className="w-5 h-5" style={{ color: colors.iconColor }} />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}