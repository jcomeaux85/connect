
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare,
  Send,
  Search,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function MessagingPanel({ user, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isOpen,
  });

  // Fetch conversations
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const sent = await base44.entities.Message.filter({ sender_email: user.email }, '-created_date', 100);
      const received = await base44.entities.Message.filter({ recipient_email: user.email }, '-created_date', 100);
      return [...sent, ...received].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.email && isOpen,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      // Create notification for recipient
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

  // Get conversation with selected user
  const conversation = selectedUser 
    ? messages.filter(m => 
        (m.sender_email === user.email && m.recipient_email === selectedUser.email) ||
        (m.sender_email === selectedUser.email && m.recipient_email === user.email)
      ).sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

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
        style={{ background: '#E0E5EC' }}
      >
        <Card className="h-full border-0 rounded-none" style={{ background: '#E0E5EC' }}>
          <CardHeader className="border-b" style={{ borderColor: '#D1D9E6' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(145deg, #dcfce7, #bbf7d0)',
                    boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff'
                  }}
                >
                  <MessageSquare className="w-5 h-5" style={{ color: '#16a34a' }} />
                </div>
                <div>
                  <CardTitle style={{ color: '#374151' }}>Messages</CardTitle>
                  {totalUnread > 0 && (
                    <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
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
          </CardHeader>

          <div className="flex h-[calc(100%-80px)]">
            {/* Conversations List */}
            <div className="w-1/3 border-r overflow-y-auto" style={{ borderColor: '#D1D9E6' }}>
              <div className="p-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl border-0 h-10"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: 'inset 3px 3px 6px #a3b1c6, inset -3px -3px 6px #ffffff'
                    }}
                  />
                </div>
              </div>

              <div className="divide-y" style={{ borderColor: '#D1D9E6' }}>
                {conversations.map((conv) => (
                  <button
                    key={conv.user.email}
                    onClick={() => {
                      setSelectedUser(conv.user);
                      // Mark unread messages as read
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
                          background: 'linear-gradient(145deg, #dbeafe, #bfdbfe)',
                          boxShadow: '3px 3px 6px #a3b1c6, -3px -3px 6px #ffffff'
                        }}
                      >
                        <span className="font-semibold text-sm" style={{ color: '#3b82f6' }}>
                          {conv.user.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm truncate" style={{ color: '#374151' }}>
                            {conv.user.full_name}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                            {conv.lastMessage.sender_email === user.email ? 'You: ' : ''}
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation View */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b" style={{ borderColor: '#D1D9E6' }}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(145deg, #dbeafe, #bfdbfe)',
                          boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff'
                        }}
                      >
                        <span className="font-bold" style={{ color: '#3b82f6' }}>
                          {selectedUser.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: '#374151' }}>
                          {selectedUser.full_name}
                        </h3>
                        <p className="text-xs" style={{ color: '#6B7280' }}>
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversation.length === 0 ? (
                      <div className="text-center py-12">
                        <p style={{ color: '#9CA3AF' }}>No messages yet. Start a conversation!</p>
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
                            className={`max-w-[70%] p-3 rounded-2xl ${
                              message.sender_email === user.email
                                ? 'bg-blue-500 text-white'
                                : 'bg-white'
                            }`}
                            style={message.sender_email !== user.email ? {
                              boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff'
                            } : {}}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p 
                              className="text-xs mt-1"
                              style={{ 
                                color: message.sender_email === user.email ? '#dbeafe' : '#9CA3AF' 
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
                  <div className="p-4 border-t" style={{ borderColor: '#D1D9E6' }}>
                    <div className="flex gap-2">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="rounded-2xl border-0"
                        style={{
                          background: '#E0E5EC',
                          boxShadow: 'inset 3px 3px 6px #a3b1c6, inset -3px -3px 6px #ffffff'
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="rounded-2xl px-6 border-0"
                        style={{
                          background: 'linear-gradient(145deg, #dbeafe, #bfdbfe)',
                          boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff',
                          color: '#3b82f6'
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
                    <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: '#D1D9E6' }} />
                    <p style={{ color: '#9CA3AF' }}>Select a conversation to start messaging</p>
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
