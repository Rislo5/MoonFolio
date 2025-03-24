import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';

export default function LanguageSelector() {
  const { language, toggleLanguage } = useLanguage();

  // Usa la funzione toggle per alternare tra italiano e inglese
  const handleToggleLanguage = () => {
    console.log(`Toggle language from: ${language}`);
    toggleLanguage();
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleToggleLanguage}
      className="w-full justify-center cursor-pointer"
    >
      {language === 'it' ? '🇮🇹 IT → 🇬🇧 EN' : '🇬🇧 EN → 🇮🇹 IT'}
    </Button>
  );
}