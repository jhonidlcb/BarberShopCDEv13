import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Scissors, User, Sparkles, UserCheck, Baby, Crown } from 'lucide-react';
import { Link } from 'wouter';
import { useCurrency } from "@/hooks/use-currency";

export function ServicesSection() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, []);

  const defaultServices = [
    {
      icon: <Scissors className="text-4xl" size={32} />,
      title: t('services.haircut.title'),
      description: t('services.haircut.description'),
      priceUSD: 30.00,
      priceBRL: 150.00,
      pricePYG: 200000.00,
      isPopular: false
    },
    {
      icon: <User className="text-4xl" size={32} />,
      title: t('services.shave.title'),
      description: t('services.shave.description'),
      priceUSD: '20.00',
      priceBRL: '100.00',
      pricePYG: '140000.00',
      isPopular: false
    },
    {
      icon: <Sparkles className="text-4xl" size={32} />,
      title: t('services.treatments.title'),
      description: t('services.treatments.description'),
      priceUSD: '50.00',
      priceBRL: '250.00',
      pricePYG: '350000.00',
      isPopular: false
    },
    {
      icon: <UserCheck className="text-4xl" size={32} />,
      title: t('services.beard.title'),
      description: t('services.beard.description'),
      priceUSD: '25.00',
      priceBRL: '125.00',
      pricePYG: '175000.00',
      isPopular: false
    },
    {
      icon: <Baby className="text-4xl" size={32} />,
      title: t('services.kids.title'),
      description: t('services.kids.description'),
      priceUSD: '15.00',
      priceBRL: '75.00',
      pricePYG: '105000.00',
      isPopular: false
    },
    {
      icon: <Crown className="text-4xl" size={32} />,
      title: t('services.complete.title'),
      description: t('services.complete.description'),
      priceUSD: '70.00',
      priceBRL: '350.00',
      pricePYG: '490000.00',
      originalPriceUSD: '90.00',
      originalPriceBRL: '450.00',
      originalPricePYG: '630000.00',
      isPopular: true
    }
  ];

  return (
    <section id="servicios" className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-services-title">
            {t('services.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-services-subtitle">
            {t('services.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(services.length > 0 ? services : defaultServices).map((service, index) => (
            <div
              key={index}
              className={`service-card rounded-xl p-8 border relative overflow-hidden ${
                service.isPopular 
                  ? 'bg-primary/10 border-2 border-primary' 
                  : 'bg-background border-border'
              }`}
              data-testid={`card-service-${index}`}
            >
              {service.isPopular && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold" data-testid="badge-popular">
                  {t('services.popular')}
                </div>
              )}
              <div className="text-primary mb-6">
                {service.icon}
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-4 text-foreground" data-testid={`text-service-title-${index}`}>
                {service.title || (language === 'pt' ? (service as any).namePt : (service as any).name) || service.title}
              </h3>
              <p className="text-muted-foreground mb-6" data-testid={`text-service-description-${index}`}>
                {service.description || (language === 'pt' ? (service as any).descriptionPt : service.description) || service.description}
              </p>
              <div className="mb-4">
                <div className="text-primary font-semibold text-xl" data-testid={`text-service-price-${index}`}>
                  {formatPrice(Number((service as any).priceUsd || service.priceUSD || 0))}
                </div>
              </div>
              <Link 
                href="/booking"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-medium transition-colors text-center block"
                data-testid={`button-book-service-${index}`}
              >
                {t('services.book')}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}