import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      settings: 'Settings',
      language: 'Language',
      currency: 'Currency',
      theme: 'Theme',
      english: 'English',
      hindi: 'Hindi',
      inr: 'Indian Rupee (INR)',
      usd: 'US Dollar (USD)',
      eur: 'Euro (EUR)',
      light: 'Light',
      dark: 'Dark',
      save: 'Save',
      loading: 'Loading...',
    },
  },
  hi: {
    translation: {
      settings: 'सेटिंग्स',
      language: 'भाषा',
      currency: 'मुद्रा',
      theme: 'थीम',
      english: 'अंग्रेजी',
      hindi: 'हिंदी',
      inr: 'भारतीय रुपया (INR)',
      usd: 'अमेरिकी डॉलर (USD)',
      eur: 'यूरो (EUR)',
      light: 'लाइट',
      dark: 'डार्क',
      save: 'सेव करें',
      loading: 'लोड हो रहा है...',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;