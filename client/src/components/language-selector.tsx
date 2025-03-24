import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  isCollapsed?: boolean;
}

/**
 * Selettore di lingua completamente reingegnerizzato.
 * Non usa hook o state, semplicemente cambia direttamente la lingua nel documento.
 */
export default function LanguageSelector({ isCollapsed = false }: LanguageSelectorProps) {
  // Leggi direttamente l'attributo lang dal documento
  const currentLang = document.documentElement.lang || 'it';
  
  // Cambia la lingua direttamente
  const handleLanguageChange = () => {
    try {
      // Determina la nuova lingua basandosi su quella corrente
      const newLang = currentLang === 'it' ? 'en' : 'it';
      console.log(`Changing language from ${currentLang} to ${newLang}`);
      
      // Cambia l'attributo lang del documento
      document.documentElement.lang = newLang;
      
      // Salva la preferenza nel localStorage
      localStorage.setItem('language', newLang);
      
      // Forza il ricaricamento della pagina per applicare le traduzioni
      window.location.reload();
    } catch (error) {
      console.error('Errore durante il cambio di lingua:', error);
    }
  };
  
  // Versione collassata (solo icona)
  if (isCollapsed) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 mx-auto"
        onClick={handleLanguageChange}
        title={currentLang === 'it' ? 'Cambia in Inglese' : 'Change to Italian'}
      >
        {currentLang === 'it' ? <span aria-label="Italiano">🇮🇹</span> : <span aria-label="English">🇬🇧</span>}
      </Button>
    );
  }
  
  // Versione completa
  return (
    <Button 
      variant="outline"
      size="sm" 
      onClick={handleLanguageChange}
      className="w-full justify-start"
      title={currentLang === 'it' ? 'Cambia in Inglese' : 'Change to Italian'}
    >
      <Globe className="mr-2 h-4 w-4" />
      {currentLang === 'it' ? '🇮🇹 Italiano' : '🇬🇧 English'}
    </Button>
  );
}