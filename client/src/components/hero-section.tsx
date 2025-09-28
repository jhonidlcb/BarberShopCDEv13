import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
import { Scissors } from 'lucide-react';
import { Link } from 'wouter';

export function HeroSection() {
  const { t } = useLanguage();

  const scrollToServices = () => {
    const element = document.getElementById('servicios');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080" 
          alt="Interior de barbería clásica" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>
      </div>

      <div className="relative z-20 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/20 rounded-full mb-6">
            <Scissors className="text-primary text-3xl" size={32} />
          </div>
          <div className="text-primary font-serif text-lg mb-2" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.5)' }} data-testid="text-hero-subtitle">
            {t('hero.subtitle')}
          </div>
        </div>

        <h1 className="font-serif font-bold text-5xl md:text-7xl text-white mb-6 fade-in" style={{ textShadow: '3px 3px 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.7), 1px 1px 3px rgba(0,0,0,1)' }}>
          <span data-testid="text-hero-title1">{t('hero.title1')}</span><br />
          <span className="text-primary" data-testid="text-hero-title2" style={{ textShadow: '3px 3px 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.7), 1px 1px 3px rgba(0,0,0,1)' }}>{t('hero.title2')}</span>
        </h1>

        <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl mx-auto fade-in" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.6), 1px 1px 2px rgba(0,0,0,1)' }} data-testid="text-hero-description">
          {t('hero.description')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in">
          <Link 
            href="/booking"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            data-testid="button-book-now"
          >
            {t('hero.bookNow')}
          </Link>
          <button 
            onClick={scrollToServices}
            className="border-2 border-white text-white hover:bg-white hover:text-background px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            data-testid="button-view-services"
          >
            {t('hero.viewServices')}
          </button>
        </div>
      </div>

    </section>
  );
}