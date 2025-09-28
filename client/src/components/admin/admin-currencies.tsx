
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAdminApi } from '@/hooks/use-admin-api';
import { DollarSign, TrendingUp, Loader2, Save } from 'lucide-react';

interface CurrencySettings {
  id: number;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  exchangeRateToUsd: number;
  isActive: boolean;
}

export function AdminCurrencies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = useAdminApi();
  const [rates, setRates] = useState<Record<string, string>>({});

  const { data: currencies, isLoading } = useQuery<CurrencySettings[]>({
    queryKey: ['/api/admin/currencies'],
    queryFn: () => api.get('/api/admin/currencies'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; exchangeRateToUsd: number }) => {
      return api.put(`/api/admin/currencies/${data.id}`, {
        exchangeRateToUsd: data.exchangeRateToUsd
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currencies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: 'Tasa de cambio actualizada correctamente' });
    },
    onError: () => {
      toast({ title: 'Error al actualizar la tasa de cambio', variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (currencies) {
      const initialRates = currencies.reduce((acc, curr) => {
        acc[curr.currencyCode] = formatRateDisplay(curr.exchangeRateToUsd, curr.currencyCode);
        return acc;
      }, {} as Record<string, string>);
      setRates(initialRates);
    }
  }, [currencies]);

  const handleRateChange = (currencyCode: string, value: string) => {
    setRates(prev => ({ ...prev, [currencyCode]: value }));
  };

  const handleSave = (currency: CurrencySettings) => {
    const inputValue = rates[currency.currencyCode];
    const newRate = parseRateInput(inputValue, currency.currencyCode);
    
    if (isNaN(newRate) || newRate <= 0) {
      const errorMsg = currency.currencyCode === 'PYG' 
        ? 'Para Guaraníes usa solo números enteros (ej: 7300)'
        : currency.currencyCode === 'BRL'
        ? 'Para Reales usa punto para decimales (ej: 5.20)'
        : 'Por favor ingresa una tasa válida';
      toast({ title: errorMsg, variant: 'destructive' });
      return;
    }
    
    // Validación adicional para PYG (debe ser entero)
    if (currency.currencyCode === 'PYG' && !Number.isInteger(newRate)) {
      toast({ 
        title: 'Guaraníes debe ser número entero (sin decimales)', 
        variant: 'destructive' 
      });
      return;
    }
    
    updateMutation.mutate({ id: currency.id, exchangeRateToUsd: newRate });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!currencies || currencies.length === 0) {
    return (
      <Card className="bg-yellow-500/10 border-yellow-500/20">
        <CardContent className="p-6 text-center">
          <DollarSign className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-yellow-300">No hay configuración de monedas disponible</p>
        </CardContent>
      </Card>
    );
  }

  const getConversionExample = (currency: CurrencySettings) => {
    const rate = parseFloat(rates[currency.currencyCode]) || currency.exchangeRateToUsd;
    const example = 100 * rate;
    if (currency.currencyCode === 'PYG') {
      return Math.round(example).toLocaleString(); // Mostrar número completo
    }
    return example.toLocaleString();
  };

  const formatRateDisplay = (rate: number, currencyCode: string) => {
    if (currencyCode === 'PYG') {
      return Math.round(rate).toString(); // Mostrar como número entero
    }
    if (currencyCode === 'BRL') {
      return Number(rate).toFixed(2); // Mostrar con 2 decimales para BRL
    }
    return rate.toString();
  };

  const parseRateInput = (value: string, currencyCode: string) => {
    const numValue = parseFloat(value);
    return numValue; // Usar valor directo tal como se ingresa
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <DollarSign className="h-5 w-5 mr-2 text-green-400" />
            Configuración de Tasas de Cambio
          </CardTitle>
          <CardDescription className="text-green-200">
            Actualiza las tasas de cambio para calcular correctamente los ingresos en USD equivalente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currencies.filter(curr => curr.isActive).map((currency) => (
              <Card key={currency.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        currency.currencyCode === 'USD' ? 'bg-green-500' :
                        currency.currencyCode === 'BRL' ? 'bg-blue-500' :
                        'bg-orange-500'
                      }`}>
                        {currency.currencySymbol}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{currency.currencyName}</h3>
                        <p className="text-xs text-gray-400">{currency.currencyCode}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currency.currencyCode === 'USD' ? (
                    <div className="text-center p-4 bg-green-500/20 rounded-lg">
                      <p className="text-green-300 text-sm">Moneda base</p>
                      <p className="text-white font-bold">1 USD = 1 USD</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`rate-${currency.currencyCode}`} className="text-white">
                          1 USD = ? {currency.currencyCode}
                        </Label>
                        <Input
                          id={`rate-${currency.currencyCode}`}
                          type="number"
                          step={currency.currencyCode === 'BRL' ? '0.01' : '1'}
                          min="0"
                          value={rates[currency.currencyCode] || ''}
                          onChange={(e) => handleRateChange(currency.currencyCode, e.target.value)}
                          placeholder={currency.currencyCode === 'PYG' ? '7300 (solo números)' : currency.currencyCode === 'BRL' ? '5.20 (usa punto)' : '1.00'}
                          className="bg-white/10 border-white/30 text-white placeholder-gray-400"
                        />
                        {currency.currencyCode === 'PYG' && (
                          <div className="text-xs text-yellow-300 mt-1">
                            ⚠️ Para Guaraníes: escribe solo números (ej: 7300), sin puntos ni comas
                          </div>
                        )}
                        {currency.currencyCode === 'BRL' && (
                          <div className="text-xs text-blue-300 mt-1">
                            ℹ️ Para Reales: usa punto para decimales (ej: 5.20), no comas
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white/5 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Ejemplo:</p>
                        <p className="text-sm text-white">
                          100 USD = {currency.currencySymbol}{getConversionExample(currency)} {currency.currencyCode}
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => handleSave(currency)}
                        disabled={updateMutation.isPending}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        size="sm"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Guardar
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
              <h4 className="font-medium text-blue-300 mb-2">¿Cómo funciona?</h4>
              <p>Las tasas de cambio se usan para convertir los ingresos de cada moneda a USD equivalente en las estadísticas.</p>
            </div>
            <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
              <h4 className="font-medium text-yellow-300 mb-2">💡 Guaraníes (PYG)</h4>
              <p className="mb-2"><strong>Solo números enteros, SIN comas ni puntos:</strong></p>
              <p className="text-sm">✅ Correcto: <span className="font-mono bg-black/20 px-1 rounded">7300</span></p>
              <p className="text-sm">❌ Incorrecto: <span className="font-mono bg-black/20 px-1 rounded line-through">7.300</span> o <span className="font-mono bg-black/20 px-1 rounded line-through">7,300</span></p>
            </div>
            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <h4 className="font-medium text-green-300 mb-2">💡 Reales (BRL)</h4>
              <p className="mb-2"><strong>Usa PUNTO (.) para decimales:</strong></p>
              <p className="text-sm">✅ Correcto: <span className="font-mono bg-black/20 px-1 rounded">5.20</span></p>
              <p className="text-sm">❌ Incorrecto: <span className="font-mono bg-black/20 px-1 rounded line-through">5,20</span></p>
            </div>
            <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
              <h4 className="font-medium text-purple-300 mb-2">❓ Preguntas Frecuentes</h4>
              <div className="space-y-2 text-sm">
                <p><strong>P: ¿Por qué no puedo usar comas en Guaraníes?</strong></p>
                <p>R: El sistema usa formato internacional donde el punto (.) es para decimales. Guaraníes no usa decimales.</p>
                <p><strong>P: ¿Por qué punto y no coma para Reales?</strong></p>
                <p>R: Estándar internacional de programación. 5.20 = cinco reales con veinte centavos.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
