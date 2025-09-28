import { useState } from 'react';
import { useCurrency } from '@/hooks/use-currency';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, DollarSign } from 'lucide-react';

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
    flag: '/flags/brazil.svg',
    icon: <DollarSign className="w-4 h-4" />
  },
  { 
    code: 'PYG' as const, 
    name: 'Guaraní', 
    symbol: '₲',
    flag: '/flags/paraguay.svg',
    icon: <DollarSign className="w-4 h-4" />
  }
];

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const currentCurrency = currencies.find(c => c.code === currency);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2">
          <div className="flex items-center gap-1">
            {currentCurrency?.flag ? (
              <img 
                src={currentCurrency.flag} 
                alt={`${currentCurrency.name} flag`} 
                className="w-4 h-3 object-cover rounded-sm" 
              />
            ) : (
              currentCurrency?.icon
            )}
            <span className="text-xs font-medium">
              {currentCurrency?.symbol}
            </span>
            <ChevronDown className="w-3 h-3" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => {
              setCurrency(curr.code);
              setIsOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            {curr.icon}
            <span className="text-sm">{curr.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {curr.symbol}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}