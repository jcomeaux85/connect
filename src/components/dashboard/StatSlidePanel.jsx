import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

const PANEL_BG = 'linear-gradient(160deg, rgba(55,30,90,0.99) 0%, rgba(38,20,72,1) 60%, rgba(28,14,58,1) 100%)';

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(d) {
  if (!d) return '—';
  try { return format(parseISO(d), 'MMM d, h:mm a'); } catch { return d; }
}

const STATUS_COLOR = {
  new: '#a78bfa',
  in_progress: '#3B82F6',
  pending: '#F59E0B',
  resolved: '#10B981',
  closed: '#6B7280',
  completed: '#10B981',
  missed: '#EF4444',
  busy: '#F59E0B',
};

export default function StatSlidePanel({ open, onClose, statType, data }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const getRows = () => {
    const items = (data || []).slice(0, 10);
    if (statType === 'Active Calls') {
      return items.map(c => ({
        title: c.customer_name || c.case_number || 'Unknown',
        badge: c.status,
        meta: c.call_category || c.case_type || '—',
        time: formatDate(c.updated_date || c.created_date),
        link: `/Case?id=${c.id}`,
      }));
    }
    if (statType === 'In Queue') {
      return items.map(c => ({
        title: c.customer_name || c.case_number || 'Unknown',
        badge: c.priority,
        meta: c.call_reason || c.description?.slice(0, 40) || '—',
        time: formatDate(c.created_date),
        link: `/Case?id=${c.id}`,
      }));
    }
    if (statType === 'Resolved Today') {
      return items.map(c => ({
        title: c.customer_name || c.case_number || 'Unknown',
        badge: 'resolved',
        meta: c.resolution?.slice(0, 40) || c.call_category || '—',
        time: formatDate(c.updated_date),
        link: `/Case?id=${c.id}`,
      }));
    }
    if (statType === 'Avg Handle Time') {
      return items.map(c => ({
        title: c.customer_phone || 'Unknown',
        badge: c.status,
        meta: c.direction || '—',
        time: formatDuration(c.duration),
        link: null,
      }));
    }
    return [];
  };

  const rows = getRows();

  const titles = {
    'Active Calls': 'Active Cases',
    'In Queue': 'In Queue',
    'Resolved Today': 'Resolved Today',
    'Avg Handle Time': 'Recent Calls',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[70]"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full z-[71] flex flex-col"
            style={{
              width: '340px',
              background: PANEL_BG,
              backdropFilter: 'blur(24px) saturate(200%)',
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top sheen */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)', zIndex: 1 }} />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
              <h2 className="text-base font-bold text-white">{titles[statType] || statType}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(167,139,250,0.3) transparent' }}>
              {rows.length === 0 ? (
                <p className="text-sm text-center mt-12" style={{ color: 'rgba(255,255,255,0.35)' }}>No data available</p>
              ) : (
                <div className="space-y-2">
                  {rows.map((row, i) => {
                    const badgeColor = STATUS_COLOR[row.badge] || '#9CA3AF';
                    const inner = (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/5"
                        style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)' }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: badgeColor, boxShadow: `0 0 6px ${badgeColor}` }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>{row.title}</p>
                          {row.meta && <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{row.meta}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${badgeColor}20`, color: badgeColor }}>
                            {row.badge || '—'}
                          </span>
                          <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{row.time}</p>
                        </div>
                      </div>
                    );
                    return row.link
                      ? <Link key={i} to={row.link} onClick={onClose}>{inner}</Link>
                      : <React.Fragment key={i}>{inner}</React.Fragment>;
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Showing most recent 10 · Click outside to close</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}