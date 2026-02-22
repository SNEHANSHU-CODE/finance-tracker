/**
 * Settings Context
 * 
 * Unified provider for Theme, Language, and Currency settings.
 * 
 * Key Features:
 * - Single source of truth for all user preferences
 * - localStorage persistence (survives page refresh)
 * - Syncs with Redux store
 * - Forces re-render on any preference change using context key
 * - Applies theme to DOM consistently
 * - Updates i18n on language change
 * - Provides locale-aware formatters
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updatePreferences as updateReduxPreferences } from '../app/authSlice';
import i18n from '../i18n';

// Storage keys
const STORAGE_KEY = 'finance-tracker-preferences';

// Default preferences
const DEFAULT_PREFERENCES = {
  currency: 'INR',
  language: 'en',
  theme: 'light',
};

// Currency configuration
const CURRENCY_CONFIG = {
  INR: { symbol: '₹', locale: 'en-IN', code: 'INR', decimals: 0 },
  USD: { symbol: '$', locale: 'en-US', code: 'USD', decimals: 2 },
  EUR: { symbol: '€', locale: 'de-DE', code: 'EUR', decimals: 2 },
  GBP: { symbol: '£', locale: 'en-GB', code: 'GBP', decimals: 2 },
  CAD: { symbol: 'C$', locale: 'en-CA', code: 'CAD', decimals: 2 },
  AUD: { symbol: 'A$', locale: 'en-AU', code: 'AUD', decimals: 2 },
};

// Language to locale mapping
const LANGUAGE_LOCALES = {
  en: 'en-US',
  hi: 'hi-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ko: 'ko-KR',
};

// Context
const SettingsContext = createContext(null);

/**
 * Load preferences from localStorage
 */
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load preferences from localStorage:', e);
  }
  return DEFAULT_PREFERENCES;
};

/**
 * Save preferences to localStorage
 */
const saveToStorage = (prefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save preferences to localStorage:', e);
  }
};

/**
 * Apply theme to DOM
 */
const applyThemeToDOM = (theme) => {
  let activeTheme = theme;
  
  // Handle 'auto' theme
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    activeTheme = prefersDark ? 'dark' : 'light';
  }
  
  // Apply to both body and html for consistency
  document.body.classList.remove('light', 'dark', 'light-theme', 'dark-theme');
  document.documentElement.classList.remove('light', 'dark', 'light-theme', 'dark-theme');
  
  document.body.classList.add(activeTheme, `${activeTheme}-theme`);
  document.documentElement.classList.add(activeTheme, `${activeTheme}-theme`);
  
  // Set data attribute for CSS selectors
  document.documentElement.setAttribute('data-theme', activeTheme);
  document.body.setAttribute('data-theme', activeTheme);
  
  return activeTheme;
};

/**
 * Settings Provider Component
 */
export const SettingsProvider = ({ children }) => {
  const dispatch = useDispatch();
  
  // Redux preferences (source of truth when authenticated)
  const reduxPreferences = useSelector((state) => state.auth?.preferences);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  
  // Local state for preferences (merged from localStorage and Redux)
  const [preferences, setPreferences] = useState(() => {
    const stored = loadFromStorage();
    // If authenticated, prefer Redux; otherwise use stored
    return isAuthenticated && reduxPreferences 
      ? { ...stored, ...reduxPreferences }
      : stored;
  });
  
  // Version counter to force re-renders on any preference change
  const [version, setVersion] = useState(0);
  
  // Resolved theme (handles 'auto')
  const [resolvedTheme, setResolvedTheme] = useState('light');
  
  // Sync with Redux preferences when they change
  useEffect(() => {
    if (isAuthenticated && reduxPreferences) {
      setPreferences(prev => {
        const merged = { ...prev, ...reduxPreferences };
        saveToStorage(merged);
        return merged;
      });
      setVersion(v => v + 1);
    }
  }, [isAuthenticated, reduxPreferences]);
  
  // Apply theme whenever it changes
  useEffect(() => {
    const active = applyThemeToDOM(preferences.theme);
    setResolvedTheme(active);
    
    // Listen for system theme changes when in 'auto' mode
    if (preferences.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(newTheme);
        applyThemeToDOM('auto');
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [preferences.theme, version]);
  
  // Update i18n language when it changes
  useEffect(() => {
    if (preferences.language && i18n.language !== preferences.language) {
      i18n.changeLanguage(preferences.language).catch(console.error);
    }
  }, [preferences.language, version]);
  
  // Update a single preference
  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      saveToStorage(updated);
      
      // Also update Redux if authenticated
      if (isAuthenticated) {
        dispatch(updateReduxPreferences({ [key]: value }));
      }
      
      return updated;
    });
    
    // Force re-render of all consuming components
    setVersion(v => v + 1);
  }, [dispatch, isAuthenticated]);
  
  // Update multiple preferences
  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => {
      const updated = { ...prev, ...updates };
      saveToStorage(updated);
      
      if (isAuthenticated) {
        dispatch(updateReduxPreferences(updates));
      }
      
      return updated;
    });
    
    setVersion(v => v + 1);
  }, [dispatch, isAuthenticated]);
  
  // Shorthand setters
  const setTheme = useCallback((theme) => updatePreference('theme', theme), [updatePreference]);
  const setLanguage = useCallback((lang) => updatePreference('language', lang), [updatePreference]);
  const setCurrency = useCallback((curr) => updatePreference('currency', curr), [updatePreference]);
  
  // Format currency using Intl.NumberFormat
  const formatCurrency = useCallback((amount, options = {}) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return CURRENCY_CONFIG[preferences.currency]?.symbol + '0' || '₹0';
    }
    
    const config = CURRENCY_CONFIG[preferences.currency] || CURRENCY_CONFIG.INR;
    const { showSymbol = true } = options;
    
    try {
      const formatter = new Intl.NumberFormat(config.locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: config.code,
        minimumFractionDigits: options.decimals ?? config.decimals,
        maximumFractionDigits: options.decimals ?? 2,
      });
      
      return formatter.format(Number(amount));
    } catch (e) {
      // Fallback
      const num = Number(amount).toFixed(2);
      return showSymbol ? `${config.symbol}${num}` : num;
    }
  }, [preferences.currency]);
  
  // Format number without currency
  const formatNumber = useCallback((amount, options = {}) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0';
    
    const config = CURRENCY_CONFIG[preferences.currency] || CURRENCY_CONFIG.INR;
    
    try {
      const formatter = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: options.decimals ?? 0,
        maximumFractionDigits: options.decimals ?? 2,
      });
      
      return formatter.format(Number(amount));
    } catch (e) {
      return Number(amount).toFixed(2);
    }
  }, [preferences.currency]);
  
  // Format date based on language
  const formatDate = useCallback((date, options = {}) => {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const locale = LANGUAGE_LOCALES[preferences.language] || 'en-US';
    
    try {
      const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
      };
      
      return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
    } catch (e) {
      return d.toLocaleDateString();
    }
  }, [preferences.language]);
  
  // Format time based on language
  const formatTime = useCallback((date, options = {}) => {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const locale = LANGUAGE_LOCALES[preferences.language] || 'en-US';
    
    try {
      const defaultOptions = {
        hour: '2-digit',
        minute: '2-digit',
        ...options,
      };
      
      return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
    } catch (e) {
      return d.toLocaleTimeString();
    }
  }, [preferences.language]);
  
  // Format date and time together
  const formatDateTime = useCallback((date, options = {}) => {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const locale = LANGUAGE_LOCALES[preferences.language] || 'en-US';
    
    try {
      const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
      };
      
      return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
    } catch (e) {
      return d.toLocaleString();
    }
  }, [preferences.language]);
  
  // Translation function that uses current language
  const t = useCallback((key, options = {}) => {
    return i18n.t(key, { lng: preferences.language, ...options });
  }, [preferences.language]);
  
  // Get currency symbol
  const getCurrencySymbol = useCallback(() => {
    return CURRENCY_CONFIG[preferences.currency]?.symbol || '₹';
  }, [preferences.currency]);
  
  // Memoized context value
  const contextValue = useMemo(() => ({
    // Current preferences
    preferences,
    theme: preferences.theme,
    resolvedTheme, // The actual theme applied (handles 'auto')
    language: preferences.language,
    currency: preferences.currency,
    
    // Version for forcing re-renders
    version,
    
    // Setters
    setTheme,
    setLanguage,
    setCurrency,
    updatePreference,
    updatePreferences,
    
    // Formatters
    formatCurrency,
    formatNumber,
    formatDate,
    formatTime,
    formatDateTime,
    getCurrencySymbol,
    
    // Translation
    t,
    
    // Utilities
    isDark: resolvedTheme === 'dark',
    currencyConfig: CURRENCY_CONFIG[preferences.currency] || CURRENCY_CONFIG.INR,
    languageLocale: LANGUAGE_LOCALES[preferences.language] || 'en-US',
  }), [
    preferences,
    resolvedTheme,
    version,
    setTheme,
    setLanguage,
    setCurrency,
    updatePreference,
    updatePreferences,
    formatCurrency,
    formatNumber,
    formatDate,
    formatTime,
    formatDateTime,
    getCurrencySymbol,
    t,
  ]);
  
  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to use settings context
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

/**
 * Export for backward compatibility
 */
export default SettingsProvider;
