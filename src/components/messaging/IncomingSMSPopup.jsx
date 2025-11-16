import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  X,
  Send,
  User,
  Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";

export default function IncomingSMSPopup({ sms, customer, onReply, onDismiss, onViewCase }) {
  const [replyText, setReplyText] = useState("");
  const { colors, getButtonStyle, getInsetStyle } = useTheme();

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(replyText);
    setReplyText("");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed top-24 right-6 z-50 w-96"
      >
        <Card 
          className="border-0 overflow-hidden shadow-2xl"
          style={{
            background: colors.bg,
            boxShadow: `16px 16px 32px ${colors.shadowDark}, -16px -16px 32px ${colors.shadowLight}`
          }}
        >
          {/* Animated Header */}
          <div 
            className="h-2 w-full animate-pulse"
            style={{ background: 'linear-gradient(90deg, #8B5CF6, #3b82f6)' }}
          />
          
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2" style={{ color: colors.text }}>
                <div className="relative">
                  <MessageSquare className="w-6 h-6" style={{ color: '#8B5CF6' }} />
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                New SMS Message
              </CardTitle>
              <button
                onClick={onDismiss}
                className="rounded-xl h-8 w-8 flex items-center justify-center border-0"
                style={getButtonStyle('3px')}
              >
                <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Sender Information */}
            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: colors.border }}>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={getButtonStyle('4px')}
              >
                <User className="w-6 h-6" style={{ color: colors.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base truncate" style={{ color: colors.text }}>
                  {customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown Contact'}
                </h3>
                <div className="flex items-center gap-1 text-sm" style={{ color: colors.textSecondary }}>
                  <Phone className="w-3 h-3" />
                  <span>{sms.customer_phone}</span>
                </div>
              </div>
              <Badge 
                className="border-0 text-xs px-2 py-1"
                style={getButtonStyle('2px')}
              >
                {formatDistanceToNow(new Date(sms.created_date), { addSuffix: true })}
              </Badge>
            </div>

            {/* Message Content */}
            <div 
              className="p-4 rounded-2xl"
              style={getInsetStyle('4px')}
            >
              <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
                {sms.message}
              </p>
            </div>

            {/* Quick Reply */}
            <div className="space-y-2">
              <label className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                Quick Reply:
              </label>
              <div className="flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                  className="rounded-2xl border-0 h-10"
                  style={getInsetStyle('3px')}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="rounded-2xl h-10 px-4 border-0 flex items-center gap-2 disabled:opacity-50"
                  style={getButtonStyle('4px')}
                >
                  <Send className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onDismiss}
                className="rounded-2xl h-10 border-0 text-sm font-medium"
                style={getButtonStyle('4px')}
              >
                <span style={{ color: colors.textSecondary }}>Dismiss</span>
              </button>
              <button
                onClick={onViewCase}
                className="rounded-2xl h-10 border-0 text-sm font-medium"
                style={{
                  ...getButtonStyle('4px'),
                  background: 'linear-gradient(145deg, #e9d5ff, #d8b4fe)'
                }}
              >
                <span style={{ color: '#8B5CF6' }}>View Case</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}