import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { LayoutGrid, Sidebar, Rows, Grid3X3, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const layouts = [
  {
    id: 'grid',
    name: 'Grid',
    description: 'Equal sized panels in a grid',
    icon: LayoutGrid
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Large panel on left, smaller on right',
    icon: Sidebar
  },
  {
    id: 'featured',
    name: 'Featured',
    description: 'Large top panel, smaller below',
    icon: Rows
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense grid with varied sizes',
    icon: Grid3X3
  }
];

export default function LayoutSelector({ isOpen, onClose }) {
  const { colors, dashboardLayout, setDashboardLayout } = useTheme();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="rounded-3xl p-6 max-w-2xl w-full"
        style={{
          background: colors.bg,
          boxShadow: `20px 20px 40px ${colors.shadowDark}, -20px -20px 40px ${colors.shadowLight}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
          Dashboard Layout
        </h2>
        <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
          Choose how you want your dashboard panels arranged
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {layouts.map((layout) => {
            const Icon = layout.icon;
            const isSelected = dashboardLayout === layout.id;

            return (
              <button
                key={layout.id}
                onClick={() => setDashboardLayout(layout.id)}
                className="rounded-2xl p-4 text-left transition-all relative"
                style={{
                  background: colors.bg,
                  boxShadow: isSelected
                    ? `inset 6px 6px 12px ${colors.shadowDark}, inset -6px -6px 12px ${colors.shadowLight}`
                    : `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`,
                }}
              >
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: '#10B981',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: colors.bg,
                    boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: colors.textSecondary }} />
                </div>

                <h3 className="font-bold text-lg mb-1" style={{ color: colors.text }}>
                  {layout.name}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {layout.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-2xl h-12 px-6 border-0 font-medium"
            style={{
              background: colors.bg,
              boxShadow: `6px 6px 12px ${colors.shadowDark}, -6px -6px 12px ${colors.shadowLight}`,
              color: colors.text
            }}
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}