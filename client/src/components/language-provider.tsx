
import { useLanguage } from '@/hooks/use-language';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setLanguage('es')}
        className={`flex items-center px-2 py-1 rounded-md transition-all duration-200 ${
          language === 'es'
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
        }`}
        data-testid="button-language-es"
        title="Paraguay - Español"
      >
        <img src="/flags/paraguay.svg" alt="Paraguay" className="w-5 h-3 mr-1 rounded-sm object-cover" />
        <span className="text-xs font-medium hidden sm:inline">ES</span>
      </button>
      <button
        onClick={() => setLanguage('pt')}
        className={`flex items-center px-2 py-1 rounded-md transition-all duration-200 ${
          language === 'pt'
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
        }`}
        data-testid="button-language-pt"
        title="Brasil - Português"
      >
        <img src="/flags/brazil.svg" alt="Brasil" className="w-5 h-3 mr-1 rounded-sm object-cover" />
        <span className="text-xs font-medium hidden sm:inline">PT</span>
      </button>
    </div>
  );
}
