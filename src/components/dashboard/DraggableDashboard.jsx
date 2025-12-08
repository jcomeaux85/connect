import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTheme } from '@/components/ThemeProvider';
import { GripVertical, Maximize2, Minimize2, RotateCcw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DraggableDashboard({ panels }) {
  const { colors } = useTheme();
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('dashboard-layout');
    if (saved) {
      return JSON.parse(saved);
    }
    return panels.map((panel, index) => ({
      id: panel.id,
      width: panel.defaultWidth || 1,
      height: panel.defaultHeight || 1,
      order: index
    }));
  });

  useEffect(() => {
    localStorage.setItem('dashboard-layout', JSON.stringify(layout));
  }, [layout]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(layout);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedLayout = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setLayout(updatedLayout);
  };

  const toggleSize = (panelId, e) => {
    e.stopPropagation();
    setLayout(prev => prev.map(item => {
      if (item.id === panelId) {
        // Cycle through sizes: 1x1 -> 2x1 -> 2x2 -> 3x2 -> 1x1
        let newWidth = item.width;
        let newHeight = item.height;

        if (item.width === 1 && item.height === 1) {
          newWidth = 2; newHeight = 1;
        } else if (item.width === 2 && item.height === 1) {
          newWidth = 2; newHeight = 2;
        } else if (item.width === 2 && item.height === 2) {
          newWidth = 3; newHeight = 2;
        } else {
          newWidth = 1; newHeight = 1;
        }

        return { ...item, width: newWidth, height: newHeight };
      }
      return item;
    }));
  };

  const resetLayout = () => {
    setLayout(panels.map((panel, index) => ({
      id: panel.id,
      width: panel.defaultWidth || 1,
      height: panel.defaultHeight || 1,
      order: index
    })));
  };

  const sortedLayout = [...layout].sort((a, b) => a.order - b.order);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-4">
      {/* Help Banner */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-4"
            style={{
              background: colors.bg,
              boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
            }}
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.textSecondary }} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: colors.text }}>Dashboard Controls</p>
                <ul className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                  <li>• Drag panels using the <GripVertical className="w-3 h-3 inline" /> handle to reorder</li>
                  <li>• Click <Maximize2 className="w-3 h-3 inline" /> to resize panels (cycles: 1x1 → 2x1 → 2x2 → 3x2 → 1x1)</li>
                  <li>• Click <RotateCcw className="w-3 h-3 inline" /> to reset all panels to default layout</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: colors.text }}>Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="rounded-xl h-9 px-3 border-0 text-xs flex items-center gap-2"
            style={{
              background: colors.bg,
              boxShadow: showHelp 
                ? `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
                : `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
              color: colors.textSecondary
            }}
          >
            <Info className="w-4 h-4" />
            Help
          </button>
          <button
            onClick={resetLayout}
            className="rounded-xl h-9 px-3 border-0 text-xs flex items-center gap-2"
            style={{
              background: colors.bg,
              boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
              color: colors.textSecondary
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset Layout
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid gap-6 auto-rows-auto"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
              }}
            >
            {sortedLayout.map((layoutItem, index) => {
              const panel = panels.find(p => p.id === layoutItem.id);
              if (!panel) return null;

              return (
                <Draggable key={panel.id} draggableId={panel.id} index={index}>
                  {(provided, snapshot) => (
                    <motion.div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative"
                      style={{
                        ...provided.draggableProps.style,
                        gridColumn: `span ${layoutItem.width}`,
                        gridRow: `span ${layoutItem.height}`,
                      }}
                    >
                      <div
                        className="h-full rounded-2xl p-4 relative"
                        style={{
                          background: colors.bg,
                          boxShadow: snapshot.isDragging
                            ? `16px 16px 32px ${colors.shadowDark}, -16px -16px 32px ${colors.shadowLight}`
                            : `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`,
                          transition: 'box-shadow 0.2s ease',
                          opacity: snapshot.isDragging ? 0.8 : 1,
                        }}
                      >
                        {/* Size Indicator */}
                        <div className="absolute top-2 left-2 z-10">
                          <div 
                            className="px-2 py-0.5 rounded-lg text-xs font-medium"
                            style={{
                              background: colors.bg,
                              boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`,
                              color: colors.textTertiary
                            }}
                          >
                            {layoutItem.width}x{layoutItem.height}
                          </div>
                        </div>

                        {/* Drag Handle & Resize Button */}
                        <div className="absolute top-2 right-2 flex gap-1 z-10">
                          <button
                            onClick={(e) => toggleSize(panel.id, e)}
                            className="rounded-xl h-8 w-8 flex items-center justify-center border-0 hover:scale-105 transition-transform"
                            style={{
                              background: colors.bg,
                              boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                              color: colors.textSecondary
                            }}
                            title={`Current: ${layoutItem.width}x${layoutItem.height} - Click to resize`}
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                          <div
                            {...provided.dragHandleProps}
                            className="rounded-xl h-8 w-8 flex items-center justify-center border-0 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                            style={{
                              background: colors.bg,
                              boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                              color: colors.textSecondary
                            }}
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Panel Content */}
                        <div className="h-full overflow-auto">
                          {panel.content}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </Draggable>
              );
            })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}