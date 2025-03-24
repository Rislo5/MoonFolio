import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationIT from './locales/it/translation.json';

// Reset di localStorage per forzare l'utilizzo dell'inglese
localStorage.removeItem('language');
localStorage.setItem('language', 'en');

// Forza l'attributo lang del documento HTML in inglese
document.documentElement.lang = 'en';

// Resource per le traduzioni
const resources = {
  en: {
    translation: translationEN
  },
  it: {
    translation: translationIT
  }
};

// Inizializza i18next solo se non è già stato inizializzato
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en', // Forza l'inglese come predefinito
      fallbackLng: 'en',
      debug: false,

      interpolation: {
        escapeValue: false,
      },

      react: {
        useSuspense: true,
      }
    });

  // Aggiunge un listener per i cambiamenti di lingua
  i18n.on('languageChanged', (lng) => {
    // Aggiorna l'attributo lang del documento HTML
    document.documentElement.lang = lng;
    // Salva la preferenza nel localStorage
    localStorage.setItem('language', lng);
    console.log(`Language changed to: ${lng}`);
  });

  console.log(`i18n initialized with language: ${i18n.language}`);
}

export default i18n;