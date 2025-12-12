import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { motion } from 'framer-motion';

const layoutConfigs = {
  grid: (panels) => panels.map((panel, idx) => ({
    ...panel,
    gridClass: 'col-span-1',
  })),
  
  sidebar: (panels) => [
    { ...panels[0], gridClass: 'col-span-2 row-span-2' },
    ...panels.slice(1).map((panel) => ({
      ...panel,
      gridClass: 'col-span-1',
    }))
  ],
  
  featured: (panels) => [
    { ...panels[0], gridClass: 'col-span-3' },
    ...panels.slice(1).map((panel) => ({
      ...panel,
      gridClass: 'col-span-1',
    }))
  ],
  
  compact: (panels) => {
    const sizes = ['col-span-2 row-span-2', 'col-span-1', 'col-span-1', 'col-span-2', 'col-span-1', 'col-span-1'];
    return panels.map((panel, idx) => ({
      ...panel,
      gridClass: sizes[idx % sizes.length],
    }));
  }
};

export default function DraggableDashboard({ panels }) {
  const { colors, dashboardLayout } = useTheme();
  
  const layoutConfig = layoutConfigs[dashboardLayout] || layoutConfigs.grid;
  const arrangedPanels = layoutConfig(panels);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto">
      {arrangedPanels.map((panel, index) => (
        <motion.div
          key={panel.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.03 }}
          className={panel.gridClass}
          style={{ minHeight: '200px' }}
        >
          <div
            className="h-full rounded-2xl p-4"
            style={{
              background: colors.bg,
              boxShadow: `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`,
            }}
          >
            {panel.content}
          </div>
        </motion.div>
      ))}
    </div>
  );
}