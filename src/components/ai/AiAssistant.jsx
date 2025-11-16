import { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  X,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

export default function AiAssistant({ 
  suggestion, 
  isLoading, 
  onAccept, 
  onDismiss, 
  type = "suggestion" 
}) {
  const { colors, isDark, getButtonStyle, getInsetStyle } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!suggestion && !isLoading) return null;

  const getIcon = () => {
    switch (type) {
      case "priority": return <AlertTriangle className="w-5 h-5" />;
      case "quality": return <TrendingUp className="w-5 h-5" />;
      case "compliance": return <CheckCircle2 className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  // Always purple for AI
  const aiPurple = '#8B5CF6';
  const aiPurpleDark = '#6D28D9';
  const aiPurpleLight = '#A78BFA';

  const hasDetails = suggestion && (
    (suggestion.key_points && suggestion.key_points.length > 0) ||
    (suggestion.action_items && suggestion.action_items.length > 0) ||
    suggestion.reasoning
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="mb-6 ml-8 mr-8"
      >
        <div
          className="rounded-3xl p-6 border-0"
          style={getInsetStyle('6px')}
        >
          {/* Header - Always Visible */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={getInsetStyle('4px')}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: aiPurple }} />
                ) : (
                  <span style={{ color: aiPurple }}>{getIcon()}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4" style={{ color: aiPurple }} />
                  <h3 className="text-sm font-bold" style={{ color: colors.text }}>
                    AI Assistant
                  </h3>
                </div>
                {!isLoading && suggestion?.summary && (
                  <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
                    {suggestion.summary}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {hasDetails && !isLoading && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="rounded-xl h-8 w-8 flex items-center justify-center border-0"
                  style={getButtonStyle()}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  )}
                </button>
              )}
              {onDismiss && !isLoading && (
                <button
                  onClick={onDismiss}
                  className="rounded-xl h-8 w-8 flex items-center justify-center border-0"
                  style={getButtonStyle()}
                >
                  <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              AI is analyzing... This may take a moment.
            </div>
          )}

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && !isLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {suggestion.key_points && suggestion.key_points.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: aiPurple }}>
                      Key Points:
                    </p>
                    <ul className="space-y-2">
                      {suggestion.key_points.map((point, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2" style={{ color: colors.text }}>
                          <span style={{ color: aiPurple, fontSize: '16px' }}>•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {suggestion.action_items && suggestion.action_items.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: aiPurple }}>
                      Action Items:
                    </p>
                    <ul className="space-y-2">
                      {suggestion.action_items.map((item, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2" style={{ color: colors.text }}>
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: aiPurple }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {suggestion.reasoning && (
                  <div 
                    className="p-3 rounded-2xl text-sm"
                    style={getInsetStyle('3px')}
                  >
                    <strong style={{ color: aiPurple }}>Reasoning:</strong>{' '}
                    <span style={{ color: colors.textSecondary }}>{suggestion.reasoning}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons - Always Visible */}
          {onAccept && !isLoading && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => onAccept(suggestion)}
                className="flex-1 rounded-2xl h-10 border-0 font-medium flex items-center justify-center gap-2"
                style={getButtonStyle()}
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: aiPurple }} />
                <span style={{ color: aiPurple }}>Apply Suggestion</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}