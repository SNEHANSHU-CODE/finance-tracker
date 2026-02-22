import { useSettings } from '../context/SettingsContext';

/**
 * Custom hook to access and use user preferences
 * 
 * This is a wrapper around useSettings for backward compatibility.
 * New code should use useSettings directly.
 * 
 * @returns {object} Preferences object with utility methods
 */
export const usePreferences = () => {
  const settings = useSettings();
  
  return {
    // Preferences object for backward compatibility
    preferences: settings.preferences,
    currency: settings.currency,
    language: settings.language,
    theme: settings.theme,
    
    // Formatting methods
    formatCurrency: settings.formatCurrency,
    formatNumber: settings.formatNumber,
    formatDate: settings.formatDate,
    formatTime: settings.formatTime,
    
    // Translation helper
    t: settings.t,
    
    // Preference setters
    setCurrency: settings.setCurrency,
    setLanguage: settings.setLanguage,
    setTheme: settings.setTheme,
    updatePreference: settings.updatePreference,
    
    // Additional utilities from SettingsContext
    isDark: settings.isDark,
    resolvedTheme: settings.resolvedTheme,
    formatDateTime: settings.formatDateTime,
    getCurrencySymbol: settings.getCurrencySymbol,
  };
};

export default usePreferences;
