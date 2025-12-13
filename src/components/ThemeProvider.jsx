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

  const [dashboardLayout, setDashboardLayout] = useState(() => {
    const saved = localStorage.getItem('dashboardLayout');
    return saved || 'grid';
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

  useEffect(() => {
    localStorage.setItem('dashboardLayout', dashboardLayout);
  }, [dashboardLayout]);

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
      
      // Vibrant colors for both modes
      primary: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#06B6D4',
      purple: '#8B5CF6',
      pink: '#EC4899',
      indigo: '#6366F1',
      
      outerShadow: '8px 8px 16px #a3b1c6, -8px -8px 16px #ffffff',
      innerShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
      cardShadow: '10px 10px 20px #a3b1c6, -10px -10px 20px #ffffff',
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
      
      // Vibrant colors for both modes
      primary: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#06B6D4',
      purple: '#8B5CF6',
      pink: '#EC4899',
      indigo: '#6366F1',
      
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
  const getPanelStyle = (brightness = 0, accentColor = null) => {
    // brightness: -3 to +3, affects shadow intensity AND face color
    const baseIntensity = 12;
    const adjustedIntensity = Math.max(4, baseIntensity + (brightness * 2));
    const glowOpacity = Math.min(0.3, 0.1 + (brightness * 0.05));

    // Calculate face color with accent color bleed-through
    const getFaceColor = () => {
      if (brightness === 0) return currentColors.cardBg;

      // If we have an accent color and brightness > 0, blend it in
      if (accentColor && brightness > 0) {
        // Parse accent color
        const hex = accentColor.replace('#', '');
        const accentR = parseInt(hex.substr(0, 2), 16);
        const accentG = parseInt(hex.substr(2, 2), 16);
        const accentB = parseInt(hex.substr(4, 2), 16);

        if (theme === 'dark') {
          const baseR = 42, baseG = 46, baseB = 58;
          // Blend accent color at 10-30% strength based on brightness
          const blendStrength = brightness * 0.10; // 10% at +1, 20% at +2, 30% at +3
          const r = Math.round(baseR + (accentR - baseR) * blendStrength);
          const g = Math.round(baseG + (accentG - baseG) * blendStrength);
          const b = Math.round(baseB + (accentB - baseB) * blendStrength);
          return `rgb(${r}, ${g}, ${b})`;
        } else {
          const baseR = 224, baseG = 229, baseB = 236;
          const blendStrength = brightness * 0.08; // 8% at +1, 16% at +2, 24% at +3
          const r = Math.round(baseR + (accentR - baseR) * blendStrength);
          const g = Math.round(baseG + (accentG - baseG) * blendStrength);
          const b = Math.round(baseB + (accentB - baseB) * blendStrength);
          return `rgb(${r}, ${g}, ${b})`;
        }
      }

      // No accent color, use original logic
      if (theme === 'dark') {
        const baseR = 42, baseG = 46, baseB = 58;
        if (brightness > 0) {
          const adjust = brightness * 15;
          const r = Math.min(255, baseR + adjust);
          const g = Math.min(255, baseG + adjust);
          const b = Math.min(255, baseB + adjust);
          return `rgb(${r}, ${g}, ${b})`;
        } else {
          const adjust = Math.abs(brightness) * 10;
          const r = Math.max(5, baseR - adjust);
          const g = Math.max(5, baseG - adjust);
          const b = Math.max(5, baseB - adjust);
          return `rgb(${r}, ${g}, ${b})`;
        }
      } else {
        const baseR = 224, baseG = 229, baseB = 236;
        if (brightness > 0) {
          const adjust = brightness * 8;
          const r = Math.min(255, baseR + adjust);
          const g = Math.min(255, baseG + adjust);
          const b = Math.min(255, baseB + adjust);
          return `rgb(${r}, ${g}, ${b})`;
        } else {
          const adjust = Math.abs(brightness) * 30;
          const r = Math.max(20, baseR - adjust);
          const g = Math.max(20, baseG - adjust);
          const b = Math.max(20, baseB - adjust);
          return `rgb(${r}, ${g}, ${b})`;
        }
      }
    };

    // Calculate text color for dark mode based on brightness
    // brightness 0 = #d0d0d0, +3 = #ffffff, -3 = #909090
    const getAdjustedTextColor = () => {
      if (theme !== 'dark') return currentColors.text;

      // Base is #d0d0d0 (208) at brightness 0
      // +3 should be #ffffff (255)
      // -3 should be #909090 (144)
      const baseValue = 208;
      let adjustedValue;

      if (brightness >= 0) {
        // 0 to +3: 208 to 255 (47 units over 3 steps)
        adjustedValue = Math.min(255, baseValue + Math.round(brightness * (47 / 3)));
      } else {
        // 0 to -3: 208 to 144 (64 units over 3 steps)
        adjustedValue = Math.max(144, baseValue + Math.round(brightness * (64 / 3)));
      }

      return `rgb(${adjustedValue}, ${adjustedValue}, ${adjustedValue})`;
    };

    // Calculate text glow for brighter text
    const getTextGlow = () => {
      if (theme !== 'dark' || brightness <= 0) return 'none';
      const glowStrength = brightness * 2; // 0-6px
      const glowOpacity = brightness * 0.1; // 0-0.3
      return `0 0 ${glowStrength}px rgba(255,255,255,${glowOpacity})`;
    };

    return {
      background: getFaceColor(),
      boxShadow: brightness > 0 
        ? `0 0 ${adjustedIntensity * 2}px rgba(255,255,255,${glowOpacity}), ${adjustedIntensity}px ${adjustedIntensity}px ${adjustedIntensity * 2}px ${currentColors.shadowDark}, -${adjustedIntensity}px -${adjustedIntensity}px ${adjustedIntensity * 2}px ${currentColors.shadowLight}`
        : `${adjustedIntensity}px ${adjustedIntensity}px ${adjustedIntensity * 2}px ${currentColors.shadowDark}, -${adjustedIntensity}px -${adjustedIntensity}px ${adjustedIntensity * 2}px ${currentColors.shadowLight}`,
      textColor: getAdjustedTextColor(),
      textShadow: getTextGlow(),
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
    dashboardLayout,
    setDashboardLayout,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};