import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { motion } from 'framer-motion';

export default function DraggableDashboard({ panels }) {
  const { colors } = useTheme();

  return (
    <div className="grid gap-6" style={{
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridAutoRows: 'minmax(0, 1fr)'
    }}>
      {panels.map((panel, index) => (
        <motion.div
          key={panel.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative"
          style={{
            gridColumn: `span ${panel.defaultWidth}`,
            gridRow: `span ${panel.defaultHeight}`,
          }}
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
  );
}