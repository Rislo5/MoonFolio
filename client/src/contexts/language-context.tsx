import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

type LanguageContextType = {
  language: string;
  changeLanguage: (lang: string) => void;
  toggleLanguage: () => void;
};

const defaultLanguageContext: LanguageContextType = {
  language: 'it',
  changeLanguage: () => {},
  toggleLanguage: () => {},
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState(i18n.language || 'it');

  // Aggiorna lo stato quando cambia la lingua di i18n
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Cambia la lingua utilizzando i18next
  const changeLanguage = (lang: string) => {
    console.log(`Language context: changing to ${lang}`);
    i18n.changeLanguage(lang).then(() => {
      console.log(`Language changed to ${lang}`);
      setLanguage(lang);
      // Salva la preferenza della lingua nel localStorage
      localStorage.setItem('language', lang);
    }).catch(error => {
      console.error("Error changing language:", error);
    });
  };

  // Funzione per alternare tra italiano e inglese
  const toggleLanguage = () => {
    const newLang = language === 'it' ? 'en' : 'it';
    changeLanguage(newLang);
  };

  // Inizializza la lingua dal localStorage se disponibile
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['it', 'en'].includes(savedLanguage)) {
      changeLanguage(savedLanguage);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};