import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import CoreLayout from '../components/core/CoreLayout';
import CoreDashboard from '../components/core/CoreDashboard';
import CoreTimecard from '../components/core/CoreTimecard';
import CoreSchedule from '../components/core/CoreSchedule';
import CoreRequests from '../components/core/CoreRequests';
import CorePay from '../components/core/CorePay';
import CoreMyInfo from '../components/core/CoreMyInfo';
import CoreTeam from '../components/core/CoreTeam';

export default function Core() {
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('core-last-section') || 'dashboard';
  });

  const handleNavigate = (section) => {
    setActiveSection(section);
    localStorage.setItem('core-last-section', section);
    window.dispatchEvent(new CustomEvent('corps-section-changed', { detail: { section } }));
  };

  // Listen for sidebar CORPS section navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.section) handleNavigate(e.detail.section);
    };
    window.addEventListener('corps-navigate-section', handler);
    return () => window.removeEventListener('corps-navigate-section', handler);
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <CoreDashboard onNavigate={handleNavigate} />;
      case 'timecard': return <CoreTimecard />;
      case 'schedule': return <CoreSchedule />;
      case 'requests': return <CoreRequests />;
      case 'pay': return <CorePay />;
      case 'my-info': return <CoreMyInfo />;
      case 'team': return <CoreTeam />;
      default: return <CoreDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <CoreLayout activeSection={activeSection} onNavigate={handleNavigate}>
      {renderSection()}
    </CoreLayout>
  );
}