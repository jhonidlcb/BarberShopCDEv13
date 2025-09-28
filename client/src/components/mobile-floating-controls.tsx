import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/hooks/use-currency';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Globe, DollarSign, Languages } from 'lucide-react';

export function MobileFloatingControls() {
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [showCurrency, setShowCurrency] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);

  const currencies = [
    { 
      code: 'USD' as const, 
      name: 'Dólar', 
      symbol: '$',
      icon: <DollarSign className="w-4 h-4" />
    },
    { 
      code: 'BRL' as const, 
      name: 'Real', 
      symbol: 'R$',
      flag: '/flags/brazil.svg'
    },
    { 
      code: 'PYG' as const, 
      name: 'Guaraní', 
      symbol: '₲',
      flag: '/flags/paraguay.svg'
    }
  ];

  const currentCurrency = currencies.find(c => c.code === currency);

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 flex flex-col gap-2 md:hidden">
      {/* Currency Selector */}
      <DropdownMenu open={showCurrency} onOpenChange={setShowCurrency}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-12 w-12 p-0 bg-background/90 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex flex-col items-center justify-center">
              {currentCurrency?.flag ? (
                <img 
                  src={currentCurrency.flag} 
                  alt={`${currentCurrency.name} flag`} 
                  className="w-6 h-4 object-cover rounded-sm" 
                />
              ) : (
                <DollarSign className="w-5 h-5" />
              )}
              <span className="text-xs font-bold mt-0.5">
                {currentCurrency?.code}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="left" className="w-40">
          {currencies.map((curr) => (
            <DropdownMenuItem
              key={curr.code}
              onClick={() => {
                setCurrency(curr.code);
                setShowCurrency(false);
              }}
              className="flex items-center gap-3 cursor-pointer py-3"
            >
              <div className="w-5 h-4 flex items-center justify-center">
                {curr.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{curr.name}</span>
                <span className="text-xs text-muted-foreground">
                  {curr.symbol} - {curr.code}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Language Selector */}
      <DropdownMenu open={showLanguage} onOpenChange={setShowLanguage}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-12 w-12 p-0 bg-background/90 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex flex-col items-center justify-center">
              {language === 'es' ? (
                <img 
                  src="/flags/paraguay.svg" 
                  alt="Paraguay" 
                  className="w-6 h-4 object-cover rounded-sm" 
                />
              ) : (
                <img 
                  src="/flags/brazil.svg" 
                  alt="Brasil" 
                  className="w-6 h-4 object-cover rounded-sm" 
                />
              )}
              <span className="text-xs font-bold mt-0.5 uppercase">
                {language}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="left" className="w-40">
          <DropdownMenuItem
            onClick={() => {
              setLanguage('es');
              setShowLanguage(false);
            }}
            className={`flex items-center gap-3 cursor-pointer py-3 ${
              language === 'es' ? 'bg-primary/10' : ''
            }`}
          >
            <img 
              src="/flags/paraguay.svg" 
              alt="Paraguay" 
              className="w-5 h-4 object-cover rounded-sm flex-shrink-0" 
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Español</span>
              <span className="text-xs text-muted-foreground">Paraguay</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setLanguage('pt');
              setShowLanguage(false);
            }}
            className={`flex items-center gap-3 cursor-pointer py-3 ${
              language === 'pt' ? 'bg-primary/10' : ''
            }`}
          >
            <img 
              src="/flags/brazil.svg" 
              alt="Brasil" 
              className="w-5 h-4 object-cover rounded-sm flex-shrink-0" 
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Português</span>
              <span className="text-xs text-muted-foreground">Brasil</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}