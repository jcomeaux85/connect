import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  PhoneOff, 
  Voicemail,
  User,
  MapPin,
  Briefcase,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

export default function IncomingCallPopup({ call, customer, onAnswer, onDecline, onVoicemail }) {
  const [ringCount, setRingCount] = useState(0);
  const { colors, getButtonStyle, isDark } = useTheme();
  
  const isVIP = customer?.is_vip || false;

  useEffect(() => {
    // Increment ring count every 3 seconds
    const interval = setInterval(() => {
      setRingCount(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Gold gradient for VIP
  const goldGradient = 'linear-gradient(145deg, #FCD34D, #F59E0B)';
  const goldShadow = '0 0 20px rgba(245, 158, 11, 0.4), 8px 8px 16px rgba(180, 83, 9, 0.3)';

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
            background: isVIP ? goldGradient : colors.bg,
            boxShadow: isVIP ? goldShadow : `16px 16px 32px ${colors.shadowDark}, -16px -16px 32px ${colors.shadowLight}`
          }}
        >
          {/* Animated Header */}
          <div 
            className={`h-2 w-full ${isVIP ? '' : 'animate-pulse'}`}
            style={{ 
              background: isVIP 
                ? 'linear-gradient(90deg, #F59E0B, #FCD34D, #F59E0B)' 
                : 'linear-gradient(90deg, #10b981, #3b82f6)' 
            }}
          />
          
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2" style={{ color: isVIP ? '#78350F' : colors.text }}>
                <div className="relative">
                  <Phone className={`w-6 h-6 ${isVIP ? 'text-yellow-900' : 'text-green-500'}`} />
                  <motion.div
                    className="absolute inset-0"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Phone className={`w-6 h-6 ${isVIP ? 'text-yellow-900' : 'text-green-500'}`} />
                  </motion.div>
                </div>
                {isVIP && <Star className="w-5 h-5 text-yellow-900 fill-yellow-900" />}
                Incoming Call
                {isVIP && ' - VIP'}
              </CardTitle>
              <Badge 
                className={`border-0 ${!isVIP && 'animate-pulse'}`}
                style={{
                  background: isVIP 
                    ? 'linear-gradient(145deg, #FEF3C7, #FDE68A)'
                    : 'linear-gradient(145deg, #dcfce7, #bbf7d0)',
                  color: isVIP ? '#78350F' : '#16a34a',
                  boxShadow: isVIP ? '0 0 10px rgba(245, 158, 11, 0.3)' : undefined
                }}
              >
                Ring {ringCount}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Caller Information */}
            <div className="text-center space-y-3">
              {/* Profile Picture / Icon */}
              <div 
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center relative"
                style={isVIP ? {
                  background: 'linear-gradient(145deg, #FEF3C7, #FDE68A)',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.4), 4px 4px 8px rgba(180, 83, 9, 0.2)'
                } : getButtonStyle('8px')}
              >
                <User className="w-10 h-10" style={{ color: isVIP ? '#78350F' : (customer ? colors.iconColor : colors.textSecondary) }} />
                {isVIP && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{
                    background: 'linear-gradient(145deg, #FCD34D, #F59E0B)',
                    boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)'
                  }}>
                    <Star className="w-4 h-4 text-yellow-900 fill-yellow-900" />
                  </div>
                )}
              </div>

              {/* Caller Name */}
              <div>
                <h3 className="text-2xl font-bold mb-1" style={{ color: isVIP ? '#78350F' : colors.text }}>
                  {customer ? `${customer.first_name} ${customer.last_name}` : call.caller_name || 'Unknown Caller'}
                </h3>
                <p className="text-lg font-medium" style={{ color: isVIP ? '#92400E' : colors.textSecondary }}>
                  {call.phone_number}
                </p>
              </div>

              {/* Customer Profile Info */}
              {customer ? (
                <div className="space-y-2 pt-2">
                  {customer.job_title && (
                    <div className="flex items-center justify-center gap-2 text-sm" style={{ color: isVIP ? '#92400E' : colors.textSecondary }}>
                      <Briefcase className="w-4 h-4" />
                      <span>{customer.job_title}</span>
                    </div>
                  )}
                  {customer.call_category && (
                    <Badge 
                      className="border-0"
                      style={isVIP ? {
                        background: 'linear-gradient(145deg, #FEF3C7, #FDE68A)',
                        color: '#78350F',
                        boxShadow: '0 0 5px rgba(245, 158, 11, 0.2)'
                      } : getButtonStyle('2px')}
                    >
                      {customer.call_category.charAt(0).toUpperCase() + customer.call_category.slice(1)} Insurance
                    </Badge>
                  )}
                </div>
              ) : (
                /* Caller ID Info (No Profile) */
                <div className="flex items-center justify-center gap-2 text-sm" style={{ color: isVIP ? '#92400E' : colors.textSecondary }}>
                  <MapPin className="w-4 h-4" />
                  <span>
                    {call.caller_city && call.caller_state 
                      ? `${call.caller_city}, ${call.caller_state}`
                      : 'Location Unknown'
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {/* Decline */}
              <button
                onClick={onDecline}
                className="rounded-2xl h-14 border-0 flex flex-col items-center justify-center gap-1"
                style={{
                  background: 'linear-gradient(145deg, #fee2e2, #fecaca)',
                  boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                  color: '#dc2626'
                }}
              >
                <PhoneOff className="w-5 h-5" />
                <span className="text-xs">Decline</span>
              </button>

              {/* Voicemail */}
              <button
                onClick={onVoicemail}
                className="rounded-2xl h-14 border-0 flex flex-col items-center justify-center gap-1"
                style={isVIP ? {
                  background: 'linear-gradient(145deg, #FEF3C7, #FDE68A)',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.3), 4px 4px 8px rgba(180, 83, 9, 0.2)',
                  color: '#78350F'
                } : getButtonStyle('4px')}
              >
                <Voicemail className="w-5 h-5" />
                <span className="text-xs">Voicemail</span>
              </button>

              {/* Answer - Gold for VIP */}
              <button
                onClick={onAnswer}
                className={`rounded-2xl h-14 border-0 flex flex-col items-center justify-center gap-1 ${!isVIP && 'animate-pulse'}`}
                style={isVIP ? {
                  background: 'linear-gradient(145deg, #FCD34D, #F59E0B)',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.5), 4px 4px 8px rgba(180, 83, 9, 0.3)',
                  color: '#78350F'
                } : {
                  background: 'linear-gradient(145deg, #dcfce7, #bbf7d0)',
                  boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                  color: '#16a34a'
                }}
              >
                <Phone className="w-5 h-5" />
                <span className="text-xs font-bold">Answer</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}