import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationIT from './locales/it/translation.json';

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

export default i18n;