import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

/**
 * Theme Provider Component
 * Applies theme from Redux preferences to document body
 */
export const ThemeProvider = ({ children }) => {
  const theme = useSelector((state) => state.auth?.preferences?.theme || 'light');
  
  useEffect(() => {
    // Get system preference if theme is 'auto'
    let activeTheme = theme;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = prefersDark ? 'dark' : 'light';
    }
    
    // Remove all theme classes
    document.body.classList.remove('light', 'dark');
    // Add active theme
    document.body.classList.add(activeTheme);
    
    // Also set html element for consistency
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(activeTheme);
  }, [theme]);
  
  return children;
};

export default ThemeProvider;
