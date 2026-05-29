import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';

const NAV_LINKS = [
  { label: 'CASES', path: '/Cases' },
  { label: 'TASKS', path: '/Tasks' },
  { label: 'CUSTOMERS', path: '/Customers' },
  { label: 'PHONE', path: '/Phone' },
  { label: 'MESSAGES', path: '/Messages' },
  { label: 'TIMELINE', path: '/Timeline' },
];

export default function HangingNav() {
  const { isDark } = useTheme();
  const location = useLocation();
  
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const textPrimary = isDark ? '#f0f0f0' : '#111827';

  const handleLinkHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const closestX = Math.max(rect.left, Math.min(mouseX, rect.right));
    const closestY = Math.max(rect.top, Math.min(mouseY, rect.bottom));
    const distance = Math.hypot(mouseX - closestX, mouseY - closestY);
    const proximity = Math.max(0, 1 - distance / 150);
    e.currentTarget.style.color = `rgba(255,255,255,${0.4 + proximity * 0.6})`;
    e.currentTarget.style.textShadow = `-0.5px -0.5px 0 #2563eb, 0.5px -0.5px 0 #2563eb, -0.5px 0.5px 0 #2563eb, 0.5px 0.5px 0 #2563eb, 0 0 ${proximity * 20}px #00d4ff`;
  };

  const handleLinkLeave = (e) => {
    const isActive = location.pathname === e.currentTarget.getAttribute('href');
    if (isActive) {
      e.currentTarget.style.color = '#ffffff';
      e.currentTarget.style.textShadow = '-0.5px -0.5px 0 #2563eb, 0.5px -0.5px 0 #2563eb, -0.5px 0.5px 0 #2563eb, 0.5px 0.5px 0 #2563eb, 0 0 15px #00d4ff';
    } else {
      e.currentTarget.style.color = textPrimary;
      e.currentTarget.style.textShadow = '0 0 1px rgba(255,255,255,0.3)';
    }
  };

  return (
    <div className="flex justify-center py-1.5 border-b" style={{ borderColor: cardBorder }}>
      <div className="flex gap-16 w-4/5 justify-center">
        {NAV_LINKS.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className="text-base font-semibold tracking-widest transition-all duration-300"
              style={{
                color: isActive ? '#ffffff' : textPrimary,
                textShadow: isActive 
                  ? '-0.5px -0.5px 0 #2563eb, 0.5px -0.5px 0 #2563eb, -0.5px 0.5px 0 #2563eb, 0.5px 0.5px 0 #2563eb, 0 0 15px #00d4ff'
                  : '0 0 1px rgba(255,255,255,0.3)'
              }}
              onMouseMove={handleLinkHover}
              onMouseLeave={handleLinkLeave}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}