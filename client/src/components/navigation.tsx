import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { LanguageToggle } from './language-provider';
import { CurrencySelector } from './currency-selector';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

export function Navigation() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const scrollToSection = (sectionId: string) => {
    // If we're not on the home page, navigate to home first
    if (location !== '/') {
      window.location.href = `/#${sectionId}`;
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="font-serif font-bold text-2xl text-primary" data-testid="text-brand">
                {siteConfig?.site_name || 'Barbería Clásica'}
              </h1>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => scrollToSection('inicio')}
                className="text-foreground hover:text-primary px-3 py-2 transition-colors"
                data-testid="link-home"
              >
                {t('nav.home')}
              </button>
              <button
                onClick={() => scrollToSection('servicios')}
                className="text-foreground hover:text-primary px-3 py-2 transition-colors"
                data-testid="link-services"
              >
                {t('nav.services')}
              </button>
              <button
                onClick={() => scrollToSection('galeria')}
                className="text-foreground hover:text-primary px-3 py-2 transition-colors"
                data-testid="link-gallery"
              >
                {t('nav.gallery')}
              </button>
              <button
                onClick={() => scrollToSection('sobre-nosotros')}
                className="text-foreground hover:text-primary px-3 py-2 transition-colors"
                data-testid="link-about"
              >
                {t('nav.about')}
              </button>
              <button
                onClick={() => scrollToSection('equipo')}
                className="text-foreground hover:text-primary px-3 py-2 transition-colors"
                data-testid="link-team"
              >
                {t('nav.team')}
              </button>
              <button
                onClick={() => scrollToSection('contacto')}
                className="text-foreground hover:text-primary px-3 py-2 transition-colors"
                data-testid="link-contact"
              >
                {t('nav.contact')}
              </button>
            </div>
          </div>

          {/* Desktop controls */}
          <div className="hidden md:flex items-center space-x-4">
            <CurrencySelector />
            <LanguageToggle />
            <Link
              href="/booking"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors"
              data-testid="button-appointment"
            >
              {t('nav.appointment')}
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              href="/booking"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
              data-testid="button-appointment-mobile"
            >
              {t('nav.appointment')}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground hover:text-primary p-2"
              data-testid="button-mobile-menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-card border-t border-border">
              <button
                onClick={() => scrollToSection('inicio')}
                className="block text-foreground hover:text-primary px-3 py-2 w-full text-left"
                data-testid="link-mobile-home"
              >
                {t('nav.home')}
              </button>
              <button
                onClick={() => scrollToSection('servicios')}
                className="block text-foreground hover:text-primary px-3 py-2 w-full text-left"
                data-testid="link-mobile-services"
              >
                {t('nav.services')}
              </button>
              <button
                onClick={() => scrollToSection('galeria')}
                className="block text-foreground hover:text-primary px-3 py-2 w-full text-left"
                data-testid="link-mobile-gallery"
              >
                {t('nav.gallery')}
              </button>
              <button
                onClick={() => scrollToSection('sobre-nosotros')}
                className="block text-foreground hover:text-primary px-3 py-2 w-full text-left"
                data-testid="link-mobile-about"
              >
                {t('nav.about')}
              </button>
              <button
                onClick={() => scrollToSection('equipo')}
                className="block text-foreground hover:text-primary px-3 py-2 w-full text-left"
                data-testid="link-mobile-team"
              >
                {t('nav.team')}
              </button>
              <button
                onClick={() => scrollToSection('contacto')}
                className="block text-foreground hover:text-primary px-3 py-2 w-full text-left"
                data-testid="link-mobile-contact"
              >
                {t('nav.contact')}
              </button>
              
              
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}