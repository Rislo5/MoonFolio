import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const handleLanguageChange = (lang: string) => {
    console.log(`Changing language to: ${lang}`);
    changeLanguage(lang);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center mb-2">
        <Globe className="mr-2 h-4 w-4" />
        <span className="text-sm font-medium">{t('language.select')}</span>
      </div>
      <div className="flex space-x-2">
        <Button
          variant={language === 'it' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLanguageChange('it')}
          className="w-full justify-start cursor-pointer"
        >
          🇮🇹 {t('language.it')}
        </Button>
        <Button
          variant={language === 'en' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLanguageChange('en')}
          className="w-full justify-start cursor-pointer"
        >
          🇬🇧 {t('language.en')}
        </Button>
      </div>
    </div>
  );
}