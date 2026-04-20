import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { motion } from 'framer-motion';

export default function DraggableDashboard({ panels }) {
  const { colors } = useTheme();

  return (
    <div className="space-y-6">
      {/* First Row: Planner - Full Width */}
      <motion.div
        key={panels[0]?.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0 }}
      >
        <div className="rounded-2xl p-4 min-w-0" style={{ background: colors.bg, boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}` }}>
          <div className="overflow-auto">{panels[0]?.content}</div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {panels.slice(1, 5).map((panel, index) => (
          <motion.div
            key={panel.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (index + 1) * 0.05 }}
            style={{ minHeight: '180px' }}
          >
            {panel.id === 'chip-image' ? (
              <div className="h-full min-h-[180px] rounded-2xl overflow-hidden">
                {panel.content}
              </div>
            ) : (
              <div className="h-full rounded-2xl p-4 min-h-[180px]" style={{ background: colors.bg, boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}` }}>
                <div className="h-full overflow-auto">{panel.content}</div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent Cases Row */}
      {panels.slice(5).map((panel, index) => (
        <motion.div
          key={panel.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: (index + 6) * 0.05 }}
        >
          <div
            className="rounded-2xl p-4"
            style={{
              background: colors.bg,
              boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`,
            }}
          >
            <div className="overflow-auto">
              {panel.content}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}