import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Search,
  X,
  User,
  Users,
  Paperclip,
  Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTheme } from "@/components/ThemeProvider";

export default function MessagingPanel({ user, isOpen, onClose }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [smsText, setSmsText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("team");

  // Fetch all team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isOpen,
  });

  // Fetch team messages
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const sent = await base44.entities.Message.filter({ sender_email: user.email }, '-created_date', 100);
      const received = await base44.entities.Message.filter({ recipient_email: user.email }, '-created_date', 100);
      return [...sent, ...received].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.email && isOpen,
    refetchInterval: 5000,
  });

  // Fetch SMS messages
  const { data: smsMessages = [] } = useQuery({
    queryKey: ['sms-messages'],
    queryFn: () => base44.entities.SMS.list('-created_date', 200),
    enabled: isOpen,
    refetchInterval: 5000,
  });

  // Fetch customers for SMS display
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-sms'],
    queryFn: () => base44.entities.Customer.list('-updated_date', 100),
    enabled: isOpen && activeTab === 'sms',
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      if (selectedUser) {
        base44.entities.Notification.create({
          user_email: selectedUser.email,
          type: 'message',
          title: 'New Message',
          message: `${user.full_name} sent you a message`,
          priority: 'normal'
        });
      }
      setMessageText("");
    },
  });

  const sendSmsMutation = useMutation({
    mutationFn: (smsData) => base44.entities.SMS.create(smsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-messages'] });
      setSmsText("");
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Message.update(id, { 
      is_read: true,
      read_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUser) return;

    sendMessageMutation.mutate({
      sender_email: user.email,
      sender_name: user.full_name,
      recipient_email: selectedUser.email,
      recipient_name: selectedUser.full_name,
      content: messageText,
      thread_id: [user.email, selectedUser.email].sort().join('_')
    });
  };

  const handleSendSms = () => {
    if (!smsText.trim() || !selectedPhone) return;

    const smsThread = smsThreads.find(t => t.phone === selectedPhone);
    
    sendSmsMutation.mutate({
      case_id: smsThread?.case_id || null,
      customer_phone: selectedPhone,
      message: smsText,
      direction: 'sent',
      status: 'sent',
      sent_at: new Date().toISOString()
    });
  };

  // Get conversation with selected user
  const conversation = selectedUser 
    ? messages.filter(m => 
        (m.sender_email === user.email && m.recipient_email === selectedUser.email) ||
        (m.sender_email === selectedUser.email && m.recipient_email === user.email)
      ).sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

  // Get SMS conversation with selected phone
  const smsConversation = selectedPhone
    ? smsMessages
        .filter(m => m.customer_phone === selectedPhone)
        .sort((a, b) => new Date(a.created_date || a.sent_at) - new Date(b.created_date || b.sent_at))
    : [];

  // Group SMS by phone number
  const smsThreads = {};
  smsMessages.forEach(sms => {
    const phone = sms.customer_phone;
    if (!smsThreads[phone]) {
      smsThreads[phone] = {
        phone,
        messages: [],
        lastMessage: null,
        case_id: sms.case_id,
        customer: customers.find(c => c.primary_phone === phone)
      };
    }
    smsThreads[phone].messages.push(sms);
    if (!smsThreads[phone].lastMessage || 
        new Date(sms.created_date || sms.sent_at) > new Date(smsThreads[phone].lastMessage.created_date || smsThreads[phone].lastMessage.sent_at)) {
      smsThreads[phone].lastMessage = sms;
    }
  });

  const smsThreadList = Object.values(smsThreads)
    .filter(thread => 
      !searchQuery || 
      thread.phone.includes(searchQuery) ||
      thread.customer?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.customer?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => 
      new Date(b.lastMessage.created_date || b.lastMessage.sent_at) - 
      new Date(a.lastMessage.created_date || a.lastMessage.sent_at)
    );

  // Get list of conversations (unique users)
  const conversations = teamMembers
    .filter(member => member.email !== user?.email)
    .map(member => {
      const userMessages = messages.filter(m => 
        m.sender_email === member.email || m.recipient_email === member.email
      );
      const lastMessage = userMessages[0];
      const unreadCount = userMessages.filter(m => 
        m.recipient_email === user?.email && !m.is_read
      ).length;
      
      return {
        user: member,
        lastMessage,
        unreadCount
      };
    })
    .filter(conv => 
      !searchQuery || 
      conv.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date);
    });

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-0 top-0 h-full w-full md:w-[600px] z-50 shadow-2xl"
        style={{ background: colors.bg }}
      >
        <Card className="h-full border-0 rounded-none" style={{ background: colors.bg }}>
          <CardHeader className="border-b" style={{ borderColor: colors.border }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: colors.bg,
                    boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                  }}
                >
                  <MessageSquare className="w-5 h-5" style={{ color: colors.success }} />
                </div>
                <div>
                  <CardTitle style={{ color: colors.text }}>Messages</CardTitle>
                  {totalUnread > 0 && (
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {totalUnread} unread
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2 rounded-xl" style={{
                background: colors.bg,
                boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
              }}>
                <TabsTrigger value="team" className="rounded-xl">
                  <Users className="w-4 h-4 mr-2" />
                  Team
                </TabsTrigger>
                <TabsTrigger value="sms" className="rounded-xl">
                  <Phone className="w-4 h-4 mr-2" />
                  Customer SMS
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <div className="flex h-[calc(100%-160px)]">
            {/* Conversations List */}
            <div className="w-1/3 border-r overflow-y-auto" style={{ borderColor: colors.border }}>
              <div className="p-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: colors.textTertiary }} />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl border-0 h-10"
                    style={{
                      background: colors.bg,
                      boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                      color: colors.text
                    }}
                  />
                </div>
              </div>

              {activeTab === 'team' && (
                <div className="divide-y" style={{ borderColor: colors.border }}>
                  {conversations.map((conv) => (
                    <button
                      key={conv.user.email}
                      onClick={() => {
                        setSelectedUser(conv.user);
                        setSelectedPhone(null);
                        messages
                          .filter(m => m.sender_email === conv.user.email && m.recipient_email === user.email && !m.is_read)
                          .forEach(m => markAsReadMutation.mutate({ id: m.id }));
                      }}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedUser?.email === conv.user.email ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: colors.bg,
                            boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`
                          }}
                        >
                          <span className="font-semibold text-sm" style={{ color: colors.primary }}>
                            {conv.user.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-sm truncate" style={{ color: colors.text }}>
                              {conv.user.full_name}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="text-white text-xs px-2 py-0.5 rounded-full" style={{ background: colors.primary }}>
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          {conv.lastMessage && (
                            <p className="text-xs truncate" style={{ color: colors.textTertiary }}>
                              {conv.lastMessage.sender_email === user.email ? 'You: ' : ''}
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'sms' && (
                <div className="divide-y" style={{ borderColor: colors.border }}>
                  {smsThreadList.map((thread) => (
                    <button
                      key={thread.phone}
                      onClick={() => {
                        setSelectedPhone(thread.phone);
                        setSelectedUser(null);
                      }}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedPhone === thread.phone ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: colors.bg,
                            boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`
                          }}
                        >
                          <Phone className="w-4 h-4" style={{ color: colors.success }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: colors.text }}>
                            {thread.customer 
                              ? `${thread.customer.first_name} ${thread.customer.last_name}`
                              : thread.phone
                            }
                          </p>
                          {thread.customer && (
                            <p className="text-xs" style={{ color: colors.textSecondary }}>
                              {thread.phone}
                            </p>
                          )}
                          {thread.lastMessage && (
                            <p className="text-xs truncate mt-1" style={{ color: colors.textTertiary }}>
                              {thread.lastMessage.direction === 'sent' ? 'You: ' : ''}
                              {thread.lastMessage.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  {smsThreadList.length === 0 && (
                    <div className="p-4 text-center">
                      <p className="text-sm" style={{ color: colors.textTertiary }}>No SMS conversations</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Conversation View */}
            <div className="flex-1 flex flex-col">
              {activeTab === 'team' && selectedUser ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          background: colors.bg,
                          boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                        }}
                      >
                        <span className="font-bold" style={{ color: colors.primary }}>
                          {selectedUser.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: colors.text }}>
                          {selectedUser.full_name}
                        </h3>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversation.length === 0 ? (
                      <div className="text-center py-12">
                        <p style={{ color: colors.textTertiary }}>No messages yet. Start a conversation!</p>
                      </div>
                    ) : (
                      conversation.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.sender_email === user.email ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl`}
                            style={message.sender_email === user.email ? {
                              background: colors.primary,
                              color: '#ffffff'
                            } : {
                              background: colors.bg,
                              boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                              color: colors.text
                            }}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p 
                              className="text-xs mt-1"
                              style={{ 
                                color: message.sender_email === user.email ? 'rgba(255,255,255,0.7)' : colors.textTertiary
                              }}
                            >
                              {format(new Date(message.created_date), 'h:mm a')}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t" style={{ borderColor: colors.border }}>
                    <div className="flex gap-2">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="rounded-2xl border-0"
                        style={{
                          background: colors.bg,
                          boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                          color: colors.text
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="rounded-2xl px-6 border-0"
                        style={{
                          background: colors.bg,
                          boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                          color: colors.primary
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : activeTab === 'sms' && selectedPhone ? (
                <>
                  {/* SMS Conversation Header */}
                  <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{
                            background: colors.bg,
                            boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                          }}
                        >
                          <Phone className="w-5 h-5" style={{ color: colors.success }} />
                        </div>
                        <div>
                          {(() => {
                            const customer = customers.find(c => c.primary_phone === selectedPhone);
                            return customer ? (
                              <>
                                <h3 className="font-semibold" style={{ color: colors.text }}>
                                  {customer.first_name} {customer.last_name}
                                </h3>
                                <p className="text-xs" style={{ color: colors.textSecondary }}>
                                  {selectedPhone}
                                </p>
                              </>
                            ) : (
                              <h3 className="font-semibold" style={{ color: colors.text }}>
                                {selectedPhone}
                              </h3>
                            );
                          })()}
                        </div>
                      </div>
                      {(() => {
                        const smsThread = smsThreads[selectedPhone];
                        return smsThread?.case_id && (
                          <Link to={createPageUrl(`Case?id=${smsThread.case_id}`)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl"
                              onClick={onClose}
                            >
                              View Case
                            </Button>
                          </Link>
                        );
                      })()}
                    </div>
                  </div>

                  {/* SMS Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {smsConversation.length === 0 ? (
                      <div className="text-center py-12">
                        <p style={{ color: colors.textTertiary }}>No messages yet.</p>
                      </div>
                    ) : (
                      smsConversation.map((sms) => (
                        <motion.div
                          key={sms.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${sms.direction === 'sent' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl`}
                            style={sms.direction === 'sent' ? {
                              background: colors.success,
                              color: '#ffffff'
                            } : {
                              background: colors.bg,
                              boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                              color: colors.text
                            }}
                          >
                            <p className="text-sm">{sms.message}</p>
                            <p 
                              className="text-xs mt-1"
                              style={{ 
                                color: sms.direction === 'sent' ? 'rgba(255,255,255,0.7)' : colors.textTertiary
                              }}
                            >
                              {format(new Date(sms.created_date || sms.sent_at), 'h:mm a')}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* SMS Input */}
                  <div className="p-4 border-t" style={{ borderColor: colors.border }}>
                    <div className="flex gap-2">
                      <Input
                        value={smsText}
                        onChange={(e) => setSmsText(e.target.value)}
                        placeholder="Type an SMS..."
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendSms()}
                        className="rounded-2xl border-0"
                        style={{
                          background: colors.bg,
                          boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                          color: colors.text
                        }}
                      />
                      <Button
                        onClick={handleSendSms}
                        disabled={!smsText.trim()}
                        className="rounded-2xl px-6 border-0"
                        style={{
                          background: colors.bg,
                          boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                          color: colors.success
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: colors.border }} />
                    <p style={{ color: colors.textTertiary }}>
                      {activeTab === 'team' 
                        ? 'Select a conversation to start messaging'
                        : 'Select an SMS conversation'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}