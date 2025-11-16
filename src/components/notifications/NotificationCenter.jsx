
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  MessageSquare,
  AlertCircle,
  Megaphone,
  X,
  Check,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

export default function NotificationCenter({ user, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("all");

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 50);
    },
    enabled: !!user?.email && isOpen,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Notification.update(id, { 
      is_read: true,
      read_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { 
          is_read: true,
          read_at: new Date().toISOString()
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getIcon = (type) => {
    switch (type) {
      case 'sms_reply': return <MessageSquare className="w-5 h-5" />;
      case 'stale_case': return <AlertCircle className="w-5 h-5" />;
      case 'stale_task': return <AlertCircle className="w-5 h-5" />;
      case 'message': return <MessageSquare className="w-5 h-5" />;
      case 'announcement': return <Megaphone className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'normal': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'unread') return !n.is_read;
    return n.type === selectedTab;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-0 top-0 h-full w-full md:w-[480px] z-50 shadow-2xl"
        style={{ background: '#E0E5EC' }}
      >
        <Card className="h-full border-0 rounded-none" style={{ background: '#E0E5EC' }}>
          <CardHeader className="border-b" style={{ borderColor: '#D1D9E6' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(145deg, #dbeafe, #bfdbfe)',
                    boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff'
                  }}
                >
                  <Bell className="w-5 h-5" style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <CardTitle style={{ color: '#374151' }}>Notifications</CardTitle>
                  {unreadCount > 0 && (
                    <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                      {unreadCount} unread
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-xs"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-[calc(100%-80px)]">
            <div className="px-6 py-3 border-b" style={{ borderColor: '#D1D9E6' }}>
              <TabsList className="w-full grid grid-cols-4 gap-2" style={{ background: '#E0E5EC' }}>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && (
                    <Badge className="ml-1 bg-blue-500 text-white text-xs">{unreadCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="message">Messages</TabsTrigger>
                <TabsTrigger value="announcement">Alerts</TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-0 h-[calc(100%-120px)] overflow-y-auto">
              <div className="divide-y" style={{ borderColor: '#D1D9E6' }}>
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <div 
                      className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{
                        background: '#E0E5EC',
                        boxShadow: 'inset 6px 6px 12px #a3b1c6, inset -6px -6px 12px #ffffff'
                      }}
                    >
                      <Bell className="w-8 h-8" style={{ color: '#9CA3AF' }} />
                    </div>
                    <p style={{ color: '#6B7280' }}>No notifications</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.is_read ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => !notification.is_read && markAsReadMutation.mutate({ id: notification.id })}
                    >
                      <div className="flex gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                          style={{
                            background: `linear-gradient(145deg, ${getColor(notification.priority)}20, ${getColor(notification.priority)}40)`,
                            color: getColor(notification.priority)
                          }}
                        >
                          {getIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm" style={{ color: '#374151' }}>
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: '#9CA3AF' }}>
                              {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                            </span>
                            <div className="flex items-center gap-1">
                              {notification.link && (
                                <Link to={notification.link}>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                                    View
                                  </Button>
                                </Link>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotificationMutation.mutate(notification.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Tabs>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
