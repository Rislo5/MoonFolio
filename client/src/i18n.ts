import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationIT from './locales/it/translation.json';

// Ottieni la lingua preferita dal documento HTML (impostata in main.tsx)
// Questo garantisce coerenza tra il tag HTML e le traduzioni
const documentLang = document.documentElement.lang || 'it';

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
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    lng: documentLang, // Usa la lingua dal tag HTML
    fallbackLng: 'it',
    debug: false,

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

export default i18n;