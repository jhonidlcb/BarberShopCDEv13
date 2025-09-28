
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

interface CompanyInfo {
  section: string;
  title?: string;
  titlePt?: string;
  content?: string;
  contentPt?: string;
  content2?: string;
  content2Pt?: string;
  imageUrl?: string;
  barberName?: string;
  barberTitle?: string;
  barberTitlePt?: string;
  yearsExperience?: string;
  totalClients?: string;
  satisfaction?: string;
}

export function AboutSection() {
  const { t, language } = useLanguage();

  const scrollToTeam = () => {
    const element = document.getElementById('equipo');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { data: companyInfo } = useQuery<CompanyInfo[]>({
    queryKey: ['/api/company'],
    queryFn: async () => {
      const response = await fetch('/api/company');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const aboutInfo = companyInfo?.find(info => info.section === 'about');

  // Fallback values
  const title = (language === 'pt' ? aboutInfo?.titlePt : aboutInfo?.title) || t('about.title');
  const description1 = (language === 'pt' ? aboutInfo?.contentPt : aboutInfo?.content) || t('about.description1');
  const description2 = (language === 'pt' ? aboutInfo?.content2Pt : aboutInfo?.content2) || t('about.description2');
  const imageUrl = aboutInfo?.imageUrl || "https://images.unsplash.com/photo-1621607512214-68297480165e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000";
  const barberName = aboutInfo?.barberName || "Carlos Silva";
  const barberTitle = (language === 'pt' ? aboutInfo?.barberTitlePt : aboutInfo?.barberTitle) || "Maestro Barbero";
  const years = aboutInfo?.yearsExperience || "15+";
  const clients = aboutInfo?.totalClients || "5K+";
  const satisfaction = aboutInfo?.satisfaction || "100%";

  return (
    <section id="sobre-nosotros" className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6" data-testid="text-about-title">
              {title}
            </h2>
            <p className="text-muted-foreground text-lg mb-6" data-testid="text-about-description1">
              {description1}
            </p>
            <p className="text-muted-foreground text-lg mb-8" data-testid="text-about-description2">
              {description2}
            </p>
            
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-years">
                  {years}{years && !years.includes('+') && !years.includes('Años') ? '+' : ''}
                </div>
                <div className="text-muted-foreground text-sm" data-testid="text-years-label">
                  {t('about.years')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-clients">
                  {clients}{clients && !clients.includes('+') && !clients.includes('K') ? '+' : ''}
                </div>
                <div className="text-muted-foreground text-sm" data-testid="text-clients-label">
                  {t('about.clients')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-satisfaction">
                  {satisfaction}{satisfaction && !satisfaction.includes('%') ? '%' : ''}
                </div>
                <div className="text-muted-foreground text-sm" data-testid="text-satisfaction-label">
                  {t('about.satisfaction')}
                </div>
              </div>
            </div>

            <Button 
              onClick={scrollToTeam}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold transition-colors"
              data-testid="button-meet-team"
            >
              {t('about.meetTeam')}
            </Button>
          </div>

          <div className="relative">
            <img 
              src={imageUrl}
              alt="Maestro barbero trabajando" 
              className="rounded-2xl shadow-2xl w-full"
            />
            <div className="absolute -bottom-8 -left-8 bg-primary p-6 rounded-xl shadow-xl">
              <div className="text-primary-foreground">
                <div className="text-2xl font-bold" data-testid="text-barber-name">{barberName}</div>
                <div className="text-primary-foreground/80" data-testid="text-barber-title">
                  {barberTitle}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
