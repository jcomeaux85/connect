import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Send, Phone, Video, MoreHorizontal, Sparkles } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

const TABS = ['All', 'SMS', 'Email', 'Internal'];

export default function Messages() {
  const { colors, getButtonStyle, getInsetStyle, isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ['all-messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 200),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: smsList = [] } = useQuery({
    queryKey: ['all-sms'],
    queryFn: () => base44.entities.SMS.list('-created_date', 100),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-messages'],
    queryFn: () => base44.entities.Customer.list('-updated_date', 100),
    enabled: !!user,
  });

  const sendMsgMutation = useMutation({
    mutationFn: (d) => base44.entities.Message.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-messages'] }); setNewMessage(''); },
  });

  const sendSmsMutation = useMutation({
    mutationFn: (d) => base44.entities.SMS.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-sms'] }); setNewMessage(''); },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread, messages, smsList]);

  // Build unified conversation threads
  const threads = [];

  // Internal messages
  const msgThreads = {};
  messages.forEach(m => {
    const tid = m.thread_id || [m.sender_email, m.recipient_email].sort().join('_');
    if (!msgThreads[tid]) msgThreads[tid] = [];
    msgThreads[tid].push(m);
  });
  Object.entries(msgThreads).forEach(([tid, msgs]) => {
    const sorted = [...msgs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const latest = sorted[0];
    const otherEmail = latest.sender_email === user?.email ? latest.recipient_email : latest.sender_email;
    const otherName = latest.sender_email === user?.email ? latest.recipient_name : latest.sender_name;
    const unread = sorted.filter(m => m.recipient_email === user?.email && !m.is_read).length;
    threads.push({ id: tid, type: 'internal', name: otherName || otherEmail, email: otherEmail, latest, messages: msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)), unread });
  });

  // SMS threads by phone
  const smsThreads = {};
  smsList.forEach(s => {
    const tid = `sms_${s.customer_phone}`;
    if (!smsThreads[tid]) smsThreads[tid] = [];
    smsThreads[tid].push(s);
  });
  Object.entries(smsThreads).forEach(([tid, smsMsgs]) => {
    const sorted = [...smsMsgs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const latest = sorted[0];
    const customer = customers.find(c => c.primary_phone === latest.customer_phone);
    const name = customer ? `${customer.first_name} ${customer.last_name}` : latest.customer_phone;
    threads.push({ id: tid, type: 'sms', name, phone: latest.customer_phone, latest, messages: smsMsgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)), unread: 0 });
  });

  threads.sort((a, b) => new Date(b.latest.created_date) - new Date(a.latest.created_date));

  const filteredThreads = threads.filter(t => {
    if (activeTab === 'SMS' && t.type !== 'sms') return false;
    if (activeTab === 'Internal' && t.type !== 'internal') return false;
    if (searchQuery && !t.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedData = filteredThreads.find(t => t.id === selectedThread) || filteredThreads[0];

  const handleSend = () => {
    if (!newMessage.trim() || !selectedData) return;
    if (selectedData.type === 'sms') {
      sendSmsMutation.mutate({ customer_phone: selectedData.phone, message: newMessage, direction: 'sent', status: 'sent', sent_at: new Date().toISOString() });
    } else {
      sendMsgMutation.mutate({ sender_email: user.email, sender_name: user.full_name, recipient_email: selectedData.email, recipient_name: selectedData.name, content: newMessage, thread_id: selectedData.id });
    }
  };

  const getInitials = (name) => (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const accent = '#7C3AED';
  const selectedBg = isDark ? 'rgba(124,58,237,0.18)' : '#F5F3FF';
  const themBubbleBg = isDark ? 'rgba(255,255,255,0.08)' : '#f1f1f4';

  return (
    <div className="flex h-full" style={{ background: colors.bg }}>
      {/* Left panel */}
      <div className="w-72 flex-shrink-0 flex flex-col" style={{ background: colors.cardBg, borderRight: `1px solid ${colors.border}` }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <h1 className="text-lg font-bold mb-1" style={{ color: colors.text }}>Messages</h1>
          <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>SMS, email, and internal messaging</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: colors.textTertiary }} />
            <input
              className="w-full pl-9 pr-3 h-8 rounded-xl text-xs outline-none"
              style={{ ...getInsetStyle(), color: colors.text }}
              placeholder="Search messages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-3 py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 h-7 rounded-lg text-xs font-semibold transition-all border-0"
              style={activeTab === tab ? { background: accent, color: '#fff' } : { color: colors.textSecondary, background: 'transparent' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 && (
            <div className="text-center py-8 text-sm" style={{ color: colors.textTertiary }}>No conversations</div>
          )}
          {filteredThreads.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedThread(t.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{
                borderBottom: `1px solid ${colors.border}`,
                background: selectedData?.id === t.id ? selectedBg : 'transparent',
              }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: t.type === 'sms' ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
                {getInitials(t.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold truncate" style={{ color: colors.text }}>{t.name}</p>
                  <p className="text-[10px] flex-shrink-0 ml-1" style={{ color: colors.textTertiary }}>{formatDistanceToNow(new Date(t.latest.created_date), { addSuffix: false })}</p>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {t.type === 'sms' && <span className="text-[9px]" style={{ color: colors.textTertiary }}>☑</span>}
                  <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{t.latest.content || t.latest.message || ''}</p>
                </div>
              </div>
              {t.unread > 0 && (
                <span className="w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0" style={{ background: accent }}>
                  {t.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation view */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ background: colors.bg }}>
        {selectedData ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: selectedData.type === 'sms' ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
                  {getInitials(selectedData.name)}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: colors.text }}>{selectedData.name}</p>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>via {selectedData.type === 'sms' ? 'SMS' : 'Internal'} · AI Demo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[Phone, Video, MoreHorizontal].map((Icon, i) => (
                  <button key={i} className="w-8 h-8 rounded-lg flex items-center justify-center border-0" style={getButtonStyle()}>
                    <Icon className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selectedData.messages.map((m, i) => {
                const isMe = (m.sender_email === user?.email) || (m.direction === 'sent');
                const text = m.content || m.message || '';
                const time = m.created_date ? format(new Date(m.created_date), 'h:mm aa') : '';
                return (
                  <motion.div key={m.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[65%]`}>
                      <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed" style={isMe ? { background: accent, color: '#fff' } : { background: themBubbleBg, color: colors.text }}>
                        {text}
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: colors.textTertiary }}>{time}</p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-3" style={{ borderTop: `1px solid ${colors.border}` }}>
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={getInsetStyle()}>
                <button style={{ color: colors.textTertiary }}>
                  <Sparkles className="w-4 h-4" />
                </button>
                <input
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: colors.text }}
                  placeholder="Type a message... (Enter to send, AI will reply)"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                />
                <button onClick={handleSend} style={{ color: accent }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center mt-1.5" style={{ color: colors.textTertiary }}>AI Demo Mode — customer replies are simulated by AI</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: colors.textTertiary }}>
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}