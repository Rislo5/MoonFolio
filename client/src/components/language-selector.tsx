import React, { useEffect } from 'react';
import i18n from '../i18n';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  isCollapsed?: boolean;
}

/**
 * Componente selettore di lingua estremamente semplificato.
 * Alterna direttamente tra italiano e inglese quando viene cliccato.
 */
export default function LanguageSelector({ isCollapsed = false }: LanguageSelectorProps) {
  const [lang, setLang] = React.useState(i18n.language);
  
  // Sincronizza lo stato locale con i18n quando cambia la lingua
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLang(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Funzione diretta per cambiare lingua
  const switchLanguage = () => {
    try {
      const newLang = lang === 'it' ? 'en' : 'it';
      console.log(`Switching language from ${lang} to ${newLang}`);
      
      // Cambia la lingua in i18n
      i18n.changeLanguage(newLang);
      
      // Salva la preferenza nel localStorage
      localStorage.setItem('language', newLang);
    } catch (error) {
      console.error('Error switching language:', error);
    }
  };
  
  // Versione collassata (solo icona)
  if (isCollapsed) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 mx-auto"
        onClick={switchLanguage}
      >
        {lang === 'it' ? <span>🇮🇹</span> : <span>🇬🇧</span>}
      </Button>
    );
  }
  
  // Versione completa
  return (
    <Button 
      variant="outline"
      size="sm" 
      onClick={switchLanguage}
      className="w-full justify-start"
    >
      <Globe className="mr-2 h-4 w-4" />
      {lang === 'it' ? 'Italiano' : 'English'}
    </Button>
  );
}