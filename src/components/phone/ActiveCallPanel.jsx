import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  PhoneOff,
  Pause,
  Play,
  Users,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Star
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ActiveCallPanel({
  isVisible,
  callDuration,
  phoneNumber,
  customerName,
  isOnHold,
  isThreeWay,
  thirdPartyNumber,
  transcript,
  isVIP = false,
  onToggleHold,
  onEndCall,
  onMinimize
}) {
  const { colors, isDark } = useTheme();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  const formatCallDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  const goldGradient = 'linear-gradient(145deg, #FCD34D, #F59E0B)';
  const goldShadow = '0 0 30px rgba(245, 158, 11, 0.4)';

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-96 z-[100] shadow-2xl"
      style={{
        background: isVIP ? goldGradient : colors.bg,
        boxShadow: isVIP ? goldShadow : undefined
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div
          className="p-6 border-b"
          style={{
            borderColor: isVIP ? 'rgba(180, 83, 9, 0.3)' : colors.border,
            background: isVIP 
              ? 'linear-gradient(145deg, rgba(254, 243, 199, 0.3), rgba(253, 230, 138, 0.3))'
              : isDark ? 'linear-gradient(145deg, #6D28D915, #8B5CF625)' : 'linear-gradient(145deg, #A78BFA15, #8B5CF625)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${isOnHold ? 'animate-pulse' : ''} relative`}
                style={isVIP ? {
                  background: 'linear-gradient(145deg, #FEF3C7, #FDE68A)',
                  boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)'
                } : {
                  background: isOnHold 
                    ? 'linear-gradient(145deg, #F59E0B, #D97706)'
                    : 'linear-gradient(145deg, #10B981, #059669)',
                  boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                }}
              >
                {isOnHold ? (
                  <Pause className="w-7 h-7" style={{ color: isVIP ? '#78350F' : 'white' }} />
                ) : (
                  <Phone className="w-7 h-7" style={{ color: isVIP ? '#78350F' : 'white' }} />
                )}
                {isVIP && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{
                    background: 'linear-gradient(145deg, #FCD34D, #F59E0B)',
                    boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)'
                  }}>
                    <Star className="w-3 h-3 text-yellow-900 fill-yellow-900" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: isVIP ? '#78350F' : colors.text }}>
                  {isOnHold ? 'On Hold' : 'Active Call'}
                  {isVIP && <Star className="w-4 h-4 text-yellow-900 fill-yellow-900" />}
                </h3>
                <p className="text-sm" style={{ color: isVIP ? '#92400E' : colors.textSecondary }}>
                  {customerName}
                </p>
              </div>
            </div>
            <Button
              onClick={onMinimize}
              variant="ghost"
              size="icon"
              className="rounded-xl"
              style={{ color: isVIP ? '#78350F' : colors.textTertiary }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Call Duration */}
          <div className="text-center mb-4">
            <p className="text-4xl font-bold mb-1" style={{ color: isVIP ? '#78350F' : colors.text }}>
              {formatCallDuration(callDuration)}
            </p>
            <p className="text-sm" style={{ color: isVIP ? '#92400E' : colors.textSecondary }}>
              {phoneNumber}
            </p>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 justify-center">
            <Badge
              className="border-0 text-xs px-3 py-1"
              style={isVIP ? {
                background: 'linear-gradient(145deg, #FEF3C7, #FDE68A)',
                color: '#78350F',
                boxShadow: '0 0 8px rgba(245, 158, 11, 0.3)'
              } : {
                background: isDark ? 'linear-gradient(145deg, #2e1d1d, #1a0f0f)' : 'linear-gradient(145deg, #fee2e2, #fecaca)',
                color: isDark ? '#f87171' : '#991b1b',
                boxShadow: `2px 2px 4px ${colors.shadowDark}`
              }}
            >
              <div className={`w-2 h-2 ${isVIP ? 'bg-yellow-900' : 'bg-red-500'} rounded-full mr-2 animate-pulse`} />
              Recording
            </Badge>
            {isThreeWay && (
              <Badge
                className="border-0 text-xs px-3 py-1"
                style={isVIP ? {
                  background: 'linear-gradient(145deg, #FEF3C7, #FDE68A)',
                  color: '#78350F',
                  boxShadow: '0 0 8px rgba(245, 158, 11, 0.3)'
                } : {
                  background: isDark ? 'linear-gradient(145deg, #1e3a8a, #1e40af)' : 'linear-gradient(145deg, #dbeafe, #bfdbfe)',
                  color: isDark ? '#93c5fd' : '#1e40af',
                  boxShadow: `2px 2px 4px ${colors.shadowDark}`
                }}
              >
                <Users className="w-3 h-3 mr-1 inline" />
                3-Way
              </Badge>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="p-6 border-b" style={{ borderColor: isVIP ? 'rgba(180, 83, 9, 0.3)' : colors.border }}>
          <div className="grid grid-cols-4 gap-3">
            <Button
              onClick={() => setIsMuted(!isMuted)}
              className="rounded-2xl h-16 border-0 flex-col gap-1"
              style={isVIP ? {
                background: isMuted ? 'linear-gradient(145deg, #FEF3C7, #FDE68A)' : 'rgba(254, 243, 199, 0.3)',
                boxShadow: isMuted ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none',
                color: isMuted ? '#DC2626' : '#78350F'
              } : {
                background: colors.bg,
                boxShadow: isMuted 
                  ? `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
                  : `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`,
                color: isMuted ? '#EF4444' : colors.textSecondary
              }}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="text-xs">{isMuted ? 'Muted' : 'Mute'}</span>
            </Button>

            <Button
              onClick={onToggleHold}
              className="rounded-2xl h-16 border-0 flex-col gap-1"
              style={isVIP ? {
                background: isOnHold ? 'linear-gradient(145deg, #FEF3C7, #FDE68A)' : 'rgba(254, 243, 199, 0.3)',
                boxShadow: isOnHold ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none',
                color: isOnHold ? '#F59E0B' : '#78350F'
              } : {
                background: colors.bg,
                boxShadow: isOnHold 
                  ? `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
                  : `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`,
                color: isOnHold ? '#F59E0B' : colors.textSecondary
              }}
            >
              {isOnHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              <span className="text-xs">{isOnHold ? 'Resume' : 'Hold'}</span>
            </Button>

            <Button
              onClick={() => setIsSpeaker(!isSpeaker)}
              className="rounded-2xl h-16 border-0 flex-col gap-1"
              style={isVIP ? {
                background: isSpeaker ? 'linear-gradient(145deg, #FEF3C7, #FDE68A)' : 'rgba(254, 243, 199, 0.3)',
                boxShadow: isSpeaker ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none',
                color: isSpeaker ? '#3B82F6' : '#78350F'
              } : {
                background: colors.bg,
                boxShadow: isSpeaker 
                  ? `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
                  : `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`,
                color: isSpeaker ? '#3B82F6' : colors.textSecondary
              }}
            >
              {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="text-xs">{isSpeaker ? 'Speaker' : 'Speaker'}</span>
            </Button>

            <Button
              onClick={onEndCall}
              className="rounded-2xl h-16 border-0 flex-col gap-1"
              style={{
                background: 'linear-gradient(145deg, #FCA5A5, #EF4444)',
                boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`,
                color: '#FFFFFF'
              }}
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-xs">End</span>
            </Button>
          </div>

          {isThreeWay && thirdPartyNumber && (
            <div
              className="mt-4 p-3 rounded-2xl text-sm"
              style={isVIP ? {
                background: 'rgba(254, 243, 199, 0.5)',
                boxShadow: '0 0 5px rgba(245, 158, 11, 0.2)',
                color: '#78350F'
              } : {
                background: colors.bg,
                boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`,
                color: colors.textSecondary
              }}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: isVIP ? '#78350F' : '#3B82F6' }} />
                <span className="font-medium">Third Party: {thirdPartyNumber}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Transcript */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: isVIP ? '#78350F' : colors.text }}>
            <span className={`w-2 h-2 ${isVIP ? 'bg-yellow-900' : 'bg-red-500'} rounded-full animate-pulse`} />
            Live Transcript
          </h4>
          <div
            className="flex-1 overflow-y-auto p-4 rounded-2xl text-sm space-y-2"
            style={isVIP ? {
              background: 'rgba(254, 243, 199, 0.3)',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)',
              color: '#78350F'
            } : {
              background: colors.bg,
              boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
              color: colors.textSecondary
            }}
          >
            {transcript && transcript.length > 0 ? (
              transcript.map((entry, idx) => (
                <div key={idx} className="mb-2">
                  <span className="font-semibold" style={{ color: isVIP ? '#78350F' : colors.text }}>
                    {entry.speaker}:
                  </span>{' '}
                  {entry.text}
                </div>
              ))
            ) : (
              <p className="text-center py-8" style={{ color: isVIP ? '#92400E' : colors.textTertiary }}>
                Transcript will appear here as the conversation progresses...
              </p>
            )}
          </div>
        </div>

        {/* Warning Banner */}
        <div
          className="p-4 text-center text-xs font-medium"
          style={isVIP ? {
            background: 'linear-gradient(145deg, rgba(254, 243, 199, 0.5), rgba(253, 230, 138, 0.5))',
            color: '#78350F',
            borderTop: '1px solid rgba(180, 83, 9, 0.3)'
          } : {
            background: isDark ? 'linear-gradient(145deg, #6D28D915, #8B5CF625)' : 'linear-gradient(145deg, #A78BFA15, #8B5CF625)',
            color: '#8B5CF6',
            borderTop: `1px solid ${colors.border}`
          }}
        >
          {isVIP && <Star className="w-3 h-3 inline mr-1 fill-yellow-900 text-yellow-900" />}
          ⚠️ Do not navigate away while on an active call
        </div>
      </div>
    </motion.div>
  );
}