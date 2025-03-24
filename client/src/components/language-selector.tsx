import React from 'react';
import i18n from '../i18n';
import { Button } from '@/components/ui/button';

/**
 * Componente selettore di lingua estremamente semplificato.
 * Alterna direttamente tra italiano e inglese quando viene cliccato.
 */
export default function LanguageSelector() {
  const [lang, setLang] = React.useState(i18n.language);
  
  // Funzione diretta per cambiare lingua
  const switchLanguage = () => {
    const newLang = lang === 'it' ? 'en' : 'it';
    console.log(`Switching language from ${lang} to ${newLang}`);
    
    // Cambia la lingua in i18n
    i18n.changeLanguage(newLang);
    
    // Aggiorna lo stato locale
    setLang(newLang);
    
    // Salva la preferenza nel localStorage
    localStorage.setItem('language', newLang);
  };
  
  // Ottieni il testo da visualizzare in base alla lingua corrente
  const buttonText = lang === 'it' 
    ? '🇮🇹 Italiano → 🇬🇧 English' 
    : '🇬🇧 English → 🇮🇹 Italiano';
  
  return (
    <Button 
      variant="default"
      size="sm" 
      onClick={switchLanguage}
      style={{
        cursor: 'pointer',
        width: '100%',
        padding: '10px',
        fontWeight: 'bold',
        zIndex: 9999
      }}
    >
      {buttonText}
    </Button>
  );
}