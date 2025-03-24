import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import i18n from '../i18n';

interface LanguageSelectorProps {
  isCollapsed?: boolean;
}

/**
 * Selettore di lingua migliorato che utilizza direttamente l'API i18n.
 */
export default function LanguageSelector({ isCollapsed = false }: LanguageSelectorProps) {
  // Usare lo stato locale per tracciare la lingua corrente
  const [currentLang, setCurrentLang] = useState(i18n.language);

  // Aggiorna lo stato locale quando i18n cambia lingua
  useEffect(() => {
    // Mantieni lo stato sincronizzato con i18n
    const handleLanguageChange = (lng: string) => {
      setCurrentLang(lng);
      console.log(`Language changed: ${lng}`);
    };

    // Registra l'evento languageChanged
    i18n.on('languageChanged', handleLanguageChange);
    
    // Cleanup
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Funzione per cambiare lingua
  const handleLanguageChange = () => {
    try {
      // Determina la nuova lingua
      const newLang = currentLang === 'it' ? 'en' : 'it';
      console.log(`Switching language from ${currentLang} to ${newLang}`);
      
      // Cambia la lingua in i18n
      i18n.changeLanguage(newLang);
      
      // Salva la preferenza nel localStorage
      localStorage.setItem('language', newLang);
      
      // Aggiorna il tag lang dell'HTML
      document.documentElement.lang = newLang;
    } catch (error) {
      console.error('Error switching language:', error);
    }
  };
  
  // Versione collassata (solo icona della lingua corrente)
  if (isCollapsed) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 mx-auto"
        onClick={handleLanguageChange}
        title={currentLang === 'it' ? 'Change to English' : 'Cambia in Italiano'}
      >
        {currentLang === 'it' ? <span aria-label="Italiano">🇮🇹</span> : <span aria-label="English">🇬🇧</span>}
      </Button>
    );
  }
  
  // Versione completa con testo
  return (
    <Button 
      variant="outline"
      size="sm" 
      onClick={handleLanguageChange}
      className="w-full justify-start"
      title={currentLang === 'it' ? 'Change to English' : 'Cambia in Italiano'}
    >
      <Globe className="mr-2 h-4 w-4" />
      {currentLang === 'it' ? '🇮🇹 Italiano' : '🇬🇧 English'}
    </Button>
  );
}