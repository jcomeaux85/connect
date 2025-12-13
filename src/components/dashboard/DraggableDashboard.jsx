import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { motion } from 'framer-motion';

export default function DraggableDashboard({ panels }) {
  const { colors } = useTheme();

  return (
    <div className="space-y-6">
      {/* First Row: Weather + Planner - Same Height */}
      <div className="grid grid-cols-3 gap-6">
        {panels.slice(0, 2).map((panel, index) => (
          <motion.div
            key={panel.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={panel.defaultWidth === 1 ? 'col-span-1' : 'col-span-2'}
          >
            <div
              className="h-full rounded-2xl p-4"
              style={{
                background: colors.bg,
                boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`,
              }}
            >
              <div className="h-full overflow-auto">
                {panel.content}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-6">
        {panels.slice(2, 6).map((panel, index) => (
          <motion.div
            key={panel.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (index + 2) * 0.05 }}
          >
            <div
              className="h-full rounded-2xl p-4"
              style={{
                background: colors.bg,
                boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`,
              }}
            >
              <div className="h-full overflow-auto">
                {panel.content}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Cases Row */}
      {panels.slice(6).map((panel, index) => (
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