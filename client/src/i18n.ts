import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationIT from './locales/it/translation.json';

// Ottieni la lingua preferita dal localStorage o usa l'italiano come predefinito
const savedLanguage = localStorage.getItem('language');
const userLanguage = savedLanguage || 'it';

// the translations
const resources = {
  en: {
    translation: translationEN
  },
  it: {
    translation: translationIT
  }
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    lng: userLanguage, // Usa la lingua salvata o rilevata
    fallbackLng: 'it',
    debug: false,

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
    },

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    // react i18next special options
    react: {
      useSuspense: true,
    }
  });

// Log per debug
console.log(`i18n initialized with language: ${i18n.language}`);

// Event listener per i cambiamenti di lingua
i18n.on('languageChanged', (lng) => {
  console.log(`Language changed to: ${lng}`);
  localStorage.setItem('language', lng);
});

export default i18n;