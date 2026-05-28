import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Send, Phone, Video, MoreHorizontal, Sparkles } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const TABS = ['All', 'SMS', 'Email', 'Internal'];

export default function Messages() {
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

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left panel */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Messages</h1>
          <p className="text-xs text-gray-400 mb-3">SMS, email, and internal messaging</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 h-8 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 h-7 rounded-lg text-xs font-semibold transition-all"
              style={activeTab === tab ? { background: '#7C3AED', color: '#fff' } : { color: '#9CA3AF' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400">No conversations</div>
          )}
          {filteredThreads.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedThread(t.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 text-left transition-colors"
              style={selectedData?.id === t.id ? { background: '#F5F3FF' } : {}}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: t.type === 'sms' ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
                {getInitials(t.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-800 truncate">{t.name}</p>
                  <p className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{formatDistanceToNow(new Date(t.latest.created_date), { addSuffix: false })}</p>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {t.type === 'sms' && <span className="text-[9px] text-gray-400">☑</span>}
                  <p className="text-xs text-gray-400 truncate">{t.latest.content || t.latest.message || ''}</p>
                </div>
              </div>
              {t.unread > 0 && (
                <span className="w-4 h-4 bg-violet-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {t.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation view */}
      <div className="flex-1 min-w-0 flex flex-col bg-white">
        {selectedData ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: selectedData.type === 'sms' ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
                  {getInitials(selectedData.name)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{selectedData.name}</p>
                  <p className="text-xs text-gray-400">via {selectedData.type === 'sms' ? 'SMS' : 'Internal'} · AI Demo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                </button>
                <button className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <Video className="w-3.5 h-3.5 text-gray-500" />
                </button>
                <button className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
                </button>
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
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {text}
                      </div>
                      <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>{time}</p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                <button className="text-gray-400 hover:text-violet-500 transition-colors">
                  <Sparkles className="w-4 h-4" />
                </button>
                <input
                  className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  placeholder="Type a message... (Enter to send, AI will reply)"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                />
                <button onClick={handleSend} className="text-violet-500 hover:text-violet-700 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">AI Demo Mode — customer replies are simulated by AI</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}