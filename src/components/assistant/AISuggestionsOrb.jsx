import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Check, ThumbsDown, Brain, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/ThemeProvider';

export default function AISuggestionsOrb({ suggestion, isLoading, onAccept, onDismiss, type }) {
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useTheme();

  // Don't render anything if no suggestion
  if (!suggestion && !isLoading) return null;

  const getTypeIcon = () => {
    switch (type) {
      case 'summary': return Brain;
      case 'quality': return TrendingUp;
      case 'compliance': return Shield;
      default: return Sparkles;
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <>
      {/* Floating Orb Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-[90] rounded-full border-0 p-0 overflow-hidden"
        style={{
          width: '56px',
          height: '56px',
          background: 'white',
          boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isLoading ? {
          scale: [1, 1.05, 1],
        } : {
          scale: 1
        }}
        transition={{ 
          duration: 0.5,
          repeat: isLoading ? Infinity : 0 
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Pulsing glow effect when suggestion is ready */}
          {suggestion && !isOpen && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0) 70%)'
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
          <TypeIcon 
            className="w-6 h-6 relative z-10" 
            style={{ color: suggestion ? '#8B5CF6' : '#9CA3AF' }}
          />
        </div>
      </motion.button>

      {/* Popup Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-24 z-[95] w-96"
            style={{
              maxHeight: 'calc(100vh - 200px)'
            }}
          >
            <Card
              className="border-0 shadow-2xl"
              style={{
                background: colors.bg,
                boxShadow: `12px 12px 24px ${colors.shadowDark}, -12px -12px 24px ${colors.shadowLight}`
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(145deg, #ede9fe, #ddd6fe)',
                        boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`
                      }}
                    >
                      <TypeIcon className="w-5 h-5" style={{ color: '#8B5CF6' }} />
                    </div>
                    <CardTitle className="text-lg" style={{ color: colors.text }}>
                      AI Suggestion
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Brain className="w-8 h-8 mx-auto mb-3" style={{ color: '#8B5CF6' }} />
                    </motion.div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      AI is thinking...
                    </p>
                  </div>
                ) : suggestion ? (
                  <>
                    {/* Summary */}
                    {suggestion.summary && (
                      <div>
                        <p className="font-semibold mb-2" style={{ color: colors.text }}>
                          {suggestion.summary}
                        </p>
                      </div>
                    )}

                    {/* Key Points */}
                    {suggestion.key_points && suggestion.key_points.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                          Key Points:
                        </h4>
                        <ul className="space-y-1">
                          {suggestion.key_points.map((point, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2" style={{ color: colors.text }}>
                              <span style={{ color: '#8B5CF6' }}>•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Items */}
                    {suggestion.action_items && suggestion.action_items.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                          Action Items:
                        </h4>
                        <ul className="space-y-1">
                          {suggestion.action_items.map((item, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2" style={{ color: colors.text }}>
                              <span style={{ color: '#10B981' }}>✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reasoning */}
                    {suggestion.reasoning && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                          Reasoning:
                        </h4>
                        <p className="text-sm" style={{ color: colors.text }}>
                          {suggestion.reasoning}
                        </p>
                      </div>
                    )}

                    {/* Priority Badge */}
                    {suggestion.priority && (
                      <div>
                        <Badge
                          className="border-0"
                          style={{
                            background: 
                              suggestion.priority === 'urgent' ? 'linear-gradient(145deg, #fee2e2, #fecaca)' :
                              suggestion.priority === 'high' ? 'linear-gradient(145deg, #fed7aa, #fdba74)' :
                              'linear-gradient(145deg, #dbeafe, #bfdbfe)',
                            color:
                              suggestion.priority === 'urgent' ? '#991b1b' :
                              suggestion.priority === 'high' ? '#9a3412' :
                              '#1e40af'
                          }}
                        >
                          Suggested Priority: {suggestion.priority}
                        </Badge>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => {
                          onAccept(suggestion);
                          setIsOpen(false);
                        }}
                        className="flex-1 rounded-xl h-10 border-0"
                        style={{
                          background: 'linear-gradient(145deg, #dcfce7, #bbf7d0)',
                          boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                          color: '#065f46'
                        }}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => {
                          onDismiss();
                          setIsOpen(false);
                        }}
                        variant="outline"
                        className="flex-1 rounded-xl h-10 border-0"
                        style={{
                          background: colors.bg,
                          boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                          color: colors.textSecondary
                        }}
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" />
                        Dismiss
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: colors.textTertiary }} />
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      No suggestions available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}