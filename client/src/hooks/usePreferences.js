import { useSettings } from './useSettings';

/**
 * Custom hook to access and use user preferences.
 *
 * Backward-compatibility wrapper around useSettings.
 * New code should import useSettings directly from './useSettings'.
 */
export const usePreferences = () => {
  const settings = useSettings();

  return {
    // Preferences
    preferences: settings.preferences,
    currency: settings.currency,
    theme: settings.theme,

    // Formatting methods
    formatCurrency: settings.formatCurrency,
    formatNumber: settings.formatNumber,
    formatDate: settings.formatDate,
    formatTime: settings.formatTime,
    formatDateTime: settings.formatDateTime,

    // Setters
    setCurrency: settings.setCurrency,
    setTheme: settings.setTheme,
    updatePreference: settings.updatePreference,

    // Utilities
    isDark: settings.isDark,
    resolvedTheme: settings.resolvedTheme,
    getCurrencySymbol: settings.getCurrencySymbol,
  };
};

export default usePreferences;