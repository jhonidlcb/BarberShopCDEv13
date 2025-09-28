
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

type Currency = 'USD' | 'BRL' | 'PYG';

interface CurrencySettings {
  id: number;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  exchangeRateToUsd: number;
  isActive: boolean;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceUsd: number, priceBrl?: number, pricePyg?: number) => string;
  getCurrencySymbol: (currency: Currency) => string;
  convertFromUSD: (usdPrice: number, targetCurrency: Currency) => number;
  currencySettings: CurrencySettings[];
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<Currency>('USD');

  // Obtener configuración de monedas desde la API
  const { data: currencySettings = [], isLoading } = useQuery<CurrencySettings[]>({
    queryKey: ['/api/currencies'],
    queryFn: async () => {
      const response = await fetch('/api/currencies');
      if (!response.ok) throw new Error('Failed to fetch currencies');
      return response.json();
    },
  });

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as Currency;
    if (savedCurrency && ['USD', 'BRL', 'PYG'].includes(savedCurrency)) {
      setCurrency(savedCurrency);
    }
  }, []);

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const getCurrencySymbol = (curr: Currency): string => {
    const symbols = {
      USD: '$',
      BRL: 'R$',
      PYG: '₲'
    };
    return symbols[curr];
  };

  const convertFromUSD = (usdPrice: number, targetCurrency: Currency): number => {
    if (targetCurrency === 'USD') return usdPrice;
    
    const currencySetting = currencySettings.find(c => c.currencyCode === targetCurrency);
    if (!currencySetting) return usdPrice;
    
    const rate = parseFloat(currencySetting.exchangeRateToUsd.toString());
    return usdPrice * rate;
  };

  const formatPrice = (priceUsd: number, priceBrl?: number, pricePyg?: number): string => {
    let price: number;
    
    // Si no se proporcionan precios específicos para BRL/PYG, calcularlos desde USD
    if (currency === 'USD') {
      price = priceUsd || 0;
    } else if (currency === 'BRL') {
      price = priceBrl || convertFromUSD(priceUsd, 'BRL');
    } else if (currency === 'PYG') {
      price = pricePyg || convertFromUSD(priceUsd, 'PYG');
    } else {
      price = priceUsd || 0;
    }

    const symbol = getCurrencySymbol(currency);

    if (currency === 'PYG') {
      return `${symbol} ${Math.round(price).toLocaleString('es-PY')}`;
    } else if (currency === 'BRL') {
      return `${symbol} ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `${symbol} ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency: handleSetCurrency,
    formatPrice,
    getCurrencySymbol,
    convertFromUSD,
    currencySettings,
    isLoading
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
