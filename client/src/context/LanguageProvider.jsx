import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import i18n from '../i18n';

/**
 * Language Provider Component
 * Syncs i18next language with Redux preferences
 */
export const LanguageProvider = ({ children }) => {
  const language = useSelector((state) => state.auth?.preferences?.language || 'en');

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language).catch(() => {});
    }
  }, [language]);

  return children;
};

export default LanguageProvider;
