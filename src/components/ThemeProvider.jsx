import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  const [backgroundSettings, setBackgroundSettings] = useState(() => {
    const saved = localStorage.getItem('backgroundSettings');
    return saved ? JSON.parse(saved) : { type: 'solid', value: null };
  });

  const [transitionSpeed, setTransitionSpeed] = useState(() => {
    const saved = localStorage.getItem('transitionSpeed');
    return saved ? parseFloat(saved) : 1.05; // 5% slower = 1.05x
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('backgroundSettings', JSON.stringify(backgroundSettings));
  }, [backgroundSettings]);

  useEffect(() => {
    localStorage.setItem('transitionSpeed', transitionSpeed.toString());
    document.documentElement.style.setProperty('--transition-speed', `${transitionSpeed}`);
  }, [transitionSpeed]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const updateBackgroundSettings = (settings) => {
    setBackgroundSettings(settings);
  };

  const colors = {
    light: {
      bg: '#E0E5EC',
      text: '#374151',
      textSecondary: '#6B7280',
      textTertiary: '#9CA3AF',
      shadowDark: '#a3b1c6',
      shadowLight: '#ffffff',
      cardBg: '#E0E5EC',
      gradient: 'linear-gradient(145deg, #f0f4f8, #d1d9e6)',
      border: '#D1D9E6',
      iconColor: '#6B7280',
      
      buttonBg: '#E0E5EC',
      buttonText: '#374151',
      buttonShadow: '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff',
      buttonShadowHover: '8px 8px 16px #a3b1c6, -8px -8px 16px #ffffff',
      buttonShadowPressed: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
      
      insetBg: '#E0E5EC',
      insetShadow: 'inset 3px 3px 6px #a3b1c6, inset -3px -3px 6px #ffffff',
    },
    dark: {
      bg: '#2a2e3a',
      text: '#e5e7eb',
      textSecondary: '#9ca3af',
      textTertiary: '#6b7280',
      shadowDark: '#1f232d',
      shadowLight: '#353945',
      cardBg: '#2a2e3a',
      gradient: 'linear-gradient(145deg, #2c3041, #282c38)',
      border: '#3a3e4a',
      iconColor: '#9ca3af',
      
      buttonBg: '#2a2e3a',
      buttonText: '#e5e7eb',
      buttonShadow: '6px 6px 12px #1f232d, -6px -6px 12px #353945',
      buttonShadowHover: '8px 8px 16px #1f232d, -8px -8px 16px #353945',
      buttonShadowPressed: 'inset 4px 4px 8px #1f232d, inset -4px -4px 8px #353945',
      
      insetBg: '#2a2e3a',
      insetShadow: 'inset 3px 3px 6px #1f232d, inset -3px -3px 6px #353945',
      
      primary: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#06B6D4',
      purple: '#8B5CF6',
      
      outerShadow: '10px 10px 20px #1f232d, -10px -10px 20px #353945',
      innerShadow: 'inset 4px 4px 8px #1f232d, inset -4px -4px 8px #353945',
      cardShadow: '12px 12px 24px #1f232d, -12px -12px 24px #353945',
    }
  };

  const currentColors = colors[theme];

  const getNeumorphicStyle = (pressed = false) => {
    if (pressed) {
      return {
        background: currentColors.cardBg,
        boxShadow: `inset 6px 6px 12px ${currentColors.shadowDark}, inset -6px -6px 12px ${currentColors.shadowLight}`,
      };
    }
    return {
      background: currentColors.cardBg,
      boxShadow: `8px 8px 16px ${currentColors.shadowDark}, -8px -8px 16px ${currentColors.shadowLight}`,
    };
  };

  const getNeumorphicStyleSmall = (pressed = false) => {
    if (pressed) {
      return {
        background: currentColors.cardBg,
        boxShadow: `inset 3px 3px 6px ${currentColors.shadowDark}, inset -3px -3px 6px ${currentColors.shadowLight}`,
      };
    }
    return {
      background: currentColors.cardBg,
      boxShadow: `4px 4px 8px ${currentColors.shadowDark}, -4px -4px 8px ${currentColors.shadowLight}`,
    };
  };

  const getButtonStyle = (isActive = false) => {
    return {
      background: currentColors.buttonBg,
      color: currentColors.buttonText,
      boxShadow: isActive ? currentColors.buttonShadowPressed : currentColors.buttonShadow,
      border: 'none',
    };
  };

  const getButtonHoverStyle = () => {
    return {
      boxShadow: currentColors.buttonShadowHover,
    };
  };

  const getInsetStyle = () => {
    return {
      background: currentColors.insetBg,
      boxShadow: currentColors.insetShadow,
      border: 'none',
    };
  };

  // Get brightness-adjusted shadow for panels
  const getPanelStyle = (brightness = 0) => {
    // brightness: -3 to +3, affects shadow intensity
    const baseIntensity = 12;
    const adjustedIntensity = Math.max(4, baseIntensity + (brightness * 2));
    const glowOpacity = Math.min(0.3, 0.1 + (brightness * 0.05));
    
    return {
      background: currentColors.cardBg,
      boxShadow: brightness > 0 
        ? `0 0 ${adjustedIntensity * 2}px rgba(255,255,255,${glowOpacity}), ${adjustedIntensity}px ${adjustedIntensity}px ${adjustedIntensity * 2}px ${currentColors.shadowDark}, -${adjustedIntensity}px -${adjustedIntensity}px ${adjustedIntensity * 2}px ${currentColors.shadowLight}`
        : `${adjustedIntensity}px ${adjustedIntensity}px ${adjustedIntensity * 2}px ${currentColors.shadowDark}, -${adjustedIntensity}px -${adjustedIntensity}px ${adjustedIntensity * 2}px ${currentColors.shadowLight}`,
    };
  };

  // Transition duration with 5% slower default
  const getTransitionDuration = (baseMs = 150) => {
    return `${Math.round(baseMs * transitionSpeed)}ms`;
  };

  const value = {
    theme,
    toggleTheme,
    colors: currentColors,
    getNeumorphicStyle,
    getNeumorphicStyleSmall,
    getButtonStyle,
    getButtonHoverStyle,
    getInsetStyle,
    getPanelStyle,
    getTransitionDuration,
    backgroundSettings,
    updateBackgroundSettings,
    transitionSpeed,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};