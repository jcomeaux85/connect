import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Search, Filter, Download, Send } from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";

export default function MessagesPage() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSender, setFilterSender] = useState("all");
  const [filterRecipient, setFilterRecipient] = useState("all");
  const [filterReadStatus, setFilterReadStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  
  const { colors, isDark, getButtonStyle, getInsetStyle } = useTheme();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['all-messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-messages'] });
      setNewMessage("");
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Message.update(id, { 
      is_read: true,
      read_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-messages'] });
    },
  });

  // Apply filters
  const filteredMessages = messages.filter(message => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSender = message.sender_name?.toLowerCase().includes(searchLower);
      const matchesRecipient = message.recipient_name?.toLowerCase().includes(searchLower);
      const matchesContent = message.content?.toLowerCase().includes(searchLower);
      if (!matchesSender && !matchesRecipient && !matchesContent) return false;
    }

    // Sender filter
    if (filterSender !== "all" && message.sender_email !== filterSender) return false;

    // Recipient filter
    if (filterRecipient !== "all" && message.recipient_email !== filterRecipient) return false;

    // Read status filter
    if (filterReadStatus === "read" && !message.is_read) return false;
    if (filterReadStatus === "unread" && message.is_read) return false;

    // Date range filter
    if (dateFrom && new Date(message.created_date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(message.created_date) > new Date(dateTo)) return false;

    return true;
  });

  // Group messages by thread
  const threads = {};
  filteredMessages.forEach(msg => {
    const threadId = msg.thread_id || [msg.sender_email, msg.recipient_email].sort().join('_');
    if (!threads[threadId]) {
      threads[threadId] = [];
    }
    threads[threadId].push(msg);
  });

  // Get thread list with latest message
  const threadList = Object.entries(threads).map(([threadId, msgs]) => {
    const sortedMsgs = msgs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const latestMsg = sortedMsgs[0];
    const otherPersonEmail = latestMsg.sender_email === user?.email ? latestMsg.recipient_email : latestMsg.sender_email;
    const otherPersonName = latestMsg.sender_email === user?.email ? latestMsg.recipient_name : latestMsg.sender_name;
    const unreadCount = sortedMsgs.filter(m => m.recipient_email === user?.email && !m.is_read).length;
    
    return {
      threadId,
      messages: sortedMsgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)),
      latestMessage: latestMsg,
      otherPersonEmail,
      otherPersonName,
      unreadCount
    };
  }).sort((a, b) => new Date(b.latestMessage.created_date) - new Date(a.latestMessage.created_date));

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedThread) return;

    const thread = threadList.find(t => t.threadId === selectedThread);
    if (!thread) return;

    sendMessageMutation.mutate({
      sender_email: user.email,
      sender_name: user.full_name,
      recipient_email: thread.otherPersonEmail,
      recipient_name: thread.otherPersonName,
      content: newMessage,
      thread_id: selectedThread
    });
  };

  const handleSelectThread = (thread) => {
    setSelectedThread(thread.threadId);
    // Mark unread messages as read
    thread.messages
      .filter(m => m.recipient_email === user.email && !m.is_read)
      .forEach(m => markAsReadMutation.mutate({ id: m.id }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.text }}></div>
          <p style={{ color: colors.textSecondary }}>Loading...</p>
        </div>
      </div>
    );
  }

  const selectedThreadData = threadList.find(t => t.threadId === selectedThread);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
              Messages
            </h1>
            <p style={{ color: colors.textSecondary }}>
              {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
          <Button
            className="rounded-2xl h-12 px-6 border-0"
            style={{ ...getButtonStyle('6px'), color: colors.textSecondary }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Filters & Thread List */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filters */}
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.text }}>
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: colors.textTertiary }} />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-2xl border-0 h-12"
                    style={{ ...getInsetStyle('4px'), color: colors.text }}
                  />
                </div>

                <Select value={filterSender} onValueChange={setFilterSender}>
                  <SelectTrigger className="rounded-2xl border-0 h-12" style={{ ...getInsetStyle('3px'), color: colors.text }}>
                    <SelectValue placeholder="Sender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Senders</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.email} value={u.email}>{u.full_name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterRecipient} onValueChange={setFilterRecipient}>
                  <SelectTrigger className="rounded-2xl border-0 h-12" style={{ ...getInsetStyle('3px'), color: colors.text }}>
                    <SelectValue placeholder="Recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Recipients</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.email} value={u.email}>{u.full_name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterReadStatus} onValueChange={setFilterReadStatus}>
                  <SelectTrigger className="rounded-2xl border-0 h-12" style={{ ...getInsetStyle('3px'), color: colors.text }}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range */}
                <div>
                  <label className="text-sm mb-2 block" style={{ color: colors.textSecondary }}>From Date</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="rounded-2xl border-0 h-12"
                    style={{ ...getInsetStyle('3px'), color: colors.text }}
                  />
                </div>
                <div>
                  <label className="text-sm mb-2 block" style={{ color: colors.textSecondary }}>To Date</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="rounded-2xl border-0 h-12"
                    style={{ ...getInsetStyle('3px'), color: colors.text }}
                  />
                </div>

                {/* Clear Filters */}
                {(searchQuery || filterSender !== "all" || filterRecipient !== "all" || filterReadStatus !== "all" || dateFrom || dateTo) && (
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterSender("all");
                      setFilterRecipient("all");
                      setFilterReadStatus("all");
                      setDateFrom("");
                      setDateTo("");
                    }}
                    variant="outline"
                    className="rounded-2xl h-10 w-full"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Thread List */}
            <Card
              className="border-0"
              style={{
                background: colors.bg,
                boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: colors.text }}>Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {threadList.length === 0 ? (
                    <p className="text-center text-sm py-4" style={{ color: colors.textSecondary }}>
                      No conversations found
                    </p>
                  ) : (
                    threadList.map((thread) => (
                      <button
                        key={thread.threadId}
                        onClick={() => handleSelectThread(thread)}
                        className={`w-full p-3 rounded-2xl text-left transition-all ${
                          selectedThread === thread.threadId ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{
                          ...getButtonStyle('4px'),
                          background: selectedThread === thread.threadId 
                            ? isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'
                            : colors.bg
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm truncate" style={{ color: colors.text }}>
                                {thread.otherPersonName}
                              </p>
                              {thread.unreadCount > 0 && (
                                <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                                  {thread.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                              {thread.latestMessage.content}
                            </p>
                            <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                              {formatDistanceToNow(new Date(thread.latestMessage.created_date), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Message Thread */}
          <div className="lg:col-span-2">
            <Card
              className="border-0 h-[calc(100vh-200px)]"
              style={{
                background: colors.bg,
                boxShadow: `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
              }}
            >
              {selectedThreadData ? (
                <>
                  <CardHeader className="border-b" style={{ borderColor: colors.border }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          background: isDark ? 'linear-gradient(145deg, #1f2937, #111827)' : 'linear-gradient(145deg, #dbeafe, #bfdbfe)',
                          boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                        }}
                      >
                        <span className="font-bold" style={{ color: isDark ? '#93c5fd' : '#3b82f6' }}>
                          {selectedThreadData.otherPersonName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: colors.text }}>
                          {selectedThreadData.otherPersonName}
                        </h3>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {selectedThreadData.otherPersonEmail}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 h-[calc(100%-200px)]">
                    {selectedThreadData.messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${msg.sender_email === user.email ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-4 rounded-2xl ${
                            msg.sender_email === user.email
                              ? 'bg-blue-500 text-white'
                              : ''
                          }`}
                          style={msg.sender_email !== user.email ? {
                            ...getButtonStyle('4px')
                          } : {}}
                        >
                          <p className="text-sm mb-1">{msg.content}</p>
                          <p 
                            className="text-xs"
                            style={{ 
                              color: msg.sender_email === user.email ? '#dbeafe' : colors.textTertiary 
                            }}
                          >
                            {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>

                  <div className="p-4 border-t" style={{ borderColor: colors.border }}>
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="rounded-2xl border-0 h-12"
                        style={{ ...getInsetStyle('4px'), color: colors.text }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="rounded-2xl h-12 px-6 border-0"
                        style={{ ...getButtonStyle('6px'), color: colors.textSecondary }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textTertiary }} />
                    <p style={{ color: colors.textSecondary }}>Select a conversation to view messages</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}