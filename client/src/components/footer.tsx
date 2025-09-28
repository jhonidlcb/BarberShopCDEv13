import { Facebook, Instagram, Phone, MapPin, MessageCircle, Mail, Globe, DollarSign } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useCurrency } from '@/hooks/use-currency';


export function Footer() {
  const { t, language, setLanguage } = useLanguage();
  const { currency, setCurrency, getCurrencySymbol } = useCurrency();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

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
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      code: 'PYG' as const,
      name: 'Guaraní',
      symbol: '₲',
      icon: <DollarSign className="w-4 h-4" />
    }
  ];

  const { data: siteConfig } = useQuery({
    queryKey: ['/api/site-config'],
    queryFn: async () => {
      const response = await fetch('/api/site-config');
      if (!response.ok) throw new Error('Failed to fetch site config');
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  const currentCurrency = currencies.find(c => c.code === currency);

  const handleWhatsAppClick = () => {
    const phoneNumber = siteConfig?.whatsapp_number || '+595971234567';
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola! Me gustaría agendar una cita en ${siteConfig?.site_name || 'Barbería Elite'}`);
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <MessageCircle size={24} />
              </div>
              <span className="font-serif text-2xl font-bold text-foreground">
                {siteConfig?.site_name || 'Barbería Clásica'}
              </span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {siteConfig?.site_description || t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <a href={siteConfig?.facebook_url || '#'} className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-facebook">
                <Facebook size={24} />
              </a>
              <a href={siteConfig?.instagram_url || '#'} className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-instagram">
                <Instagram size={24} />
              </a>
              <a href={siteConfig?.whatsapp_url || '#'} className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-whatsapp-footer">
                <MessageCircle size={24} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4" data-testid="text-footer-services-title">
              {t('footer.services')}
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors" data-testid="link-footer-haircut">
                  {t('services.haircut.title')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors" data-testid="link-footer-shave">
                  {t('services.shave.title')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors" data-testid="link-footer-beard">
                  {t('services.beard.title')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors" data-testid="link-footer-treatments">
                  {t('services.treatments.title')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4" data-testid="text-footer-contact-title">
              {t('footer.contact')}
            </h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MessageCircle className="text-primary" size={20} />
                <span className="text-muted-foreground">
                  {siteConfig?.whatsapp_number || '+595 971 234-567'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="text-primary" size={20} />
                <span className="text-muted-foreground">
                  {siteConfig?.address || 'Av. Monseñor Rodríguez 1245, Ciudad del Este, Paraguay'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="text-primary" size={20} />
                <span className="text-muted-foreground">
                  {siteConfig?.site_phone || '+595 61 570-123'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="text-primary" size={20} />
                <span className="text-muted-foreground">
                  {siteConfig?.site_email || 'info@barberiaelite.com'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p data-testid="text-copyright">
            &copy; {new Date().getFullYear()} {siteConfig?.site_name || 'Barbería Clásica'}. {t('footer.rights')}
          </p>
          <p className="mt-2 text-sm">
            Desarrollado por{' '}
            <a 
              href="https://softwarepar.lat/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              SoftwarePar
            </a>
          </p>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 md:hidden">
        <div className="flex items-center justify-around py-3 px-4">
          {/* Language Selector */}
          <DropdownMenu open={showLanguageMenu} onOpenChange={setShowLanguageMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto p-2">
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
                <span className="text-xs">{t('nav.language') || 'Idioma'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="w-40">
              <DropdownMenuItem
                onClick={() => {
                  setLanguage('es');
                  setShowLanguageMenu(false);
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
                  setShowLanguageMenu(false);
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

          {/* Currency Selector */}
          <DropdownMenu open={showCurrencyMenu} onOpenChange={setShowCurrencyMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto p-2">
                <span className="text-lg font-bold">{currentCurrency?.symbol || '$'}</span>
                <span className="text-xs">{t('nav.currency') || 'Moneda'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="w-40">
              {currencies.map((curr) => (
                <DropdownMenuItem
                  key={curr.code}
                  onClick={() => {
                    setCurrency(curr.code);
                    setShowCurrencyMenu(false);
                  }}
                  className={`flex items-center gap-3 cursor-pointer py-3 ${
                    currency === curr.code ? 'bg-primary/10' : ''
                  }`}
                >
                  <span className="text-lg font-bold w-5 text-center">{curr.symbol}</span>
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

          {/* WhatsApp Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center gap-1 h-auto p-2"
            onClick={handleWhatsAppClick}
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-white"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.585"/>
              </svg>
            </div>
            <span className="text-xs">WhatsApp</span>
          </Button>
        </div>
      </div>
    </footer>
  );
}