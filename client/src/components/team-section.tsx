
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Star, Instagram, Facebook } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  position: string;
  positionEs?: string;
  positionPt: string;
  description?: string;
  descriptionEs?: string;
  descriptionPt?: string;
  imageUrl?: string;
  yearsExperience?: number;
  specialties?: string;
  specialtiesEs?: string;
  specialtiesPt?: string;
  socialInstagram?: string;
  socialFacebook?: string;
}

export function TeamSection() {
  const { t, language } = useLanguage();

  const { data: staff, isLoading } = useQuery<StaffMember[]>({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
  });

  const getLocalizedText = (item: StaffMember, field: 'position' | 'description' | 'specialties') => {
    if (language === 'es') {
      return item[`${field}Es` as keyof StaffMember] || item[field] || '';
    } else if (language === 'pt') {
      return item[`${field}Pt` as keyof StaffMember] || item[field] || '';
    }
    return item[field] || '';
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!staff || staff.length === 0) {
    return null;
  }

  return (
    <section id="equipo" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-team-title">
            {t('team.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-team-subtitle">
            {t('team.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {staff.map((member) => (
            <div key={member.id} className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow" data-testid={`staff-member-${member.id}`}>
              <div className="text-center">
                {member.imageUrl && (
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-full object-cover rounded-full border-4 border-primary/20"
                      data-testid={`staff-image-${member.id}`}
                    />
                    {member.yearsExperience && member.yearsExperience > 0 && (
                      <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                        {member.yearsExperience}+ {t('team.years')}
                      </div>
                    )}
                  </div>
                )}

                <h3 className="font-bold text-xl text-foreground mb-2" data-testid={`staff-name-${member.id}`}>
                  {member.name}
                </h3>

                <p className="text-primary font-semibold mb-3" data-testid={`staff-position-${member.id}`}>
                  {getLocalizedText(member, 'position')}
                </p>

                {getLocalizedText(member, 'description') && (
                  <p className="text-muted-foreground text-sm mb-4" data-testid={`staff-description-${member.id}`}>
                    {getLocalizedText(member, 'description')}
                  </p>
                )}

                {getLocalizedText(member, 'specialties') && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-foreground text-sm mb-2">
                      {t('team.specialties')}:
                    </h4>
                    <p className="text-muted-foreground text-sm" data-testid={`staff-specialties-${member.id}`}>
                      {getLocalizedText(member, 'specialties')}
                    </p>
                  </div>
                )}

                {(member.socialInstagram || member.socialFacebook) && (
                  <div className="flex justify-center space-x-3 pt-4 border-t border-border">
                    {member.socialInstagram && (
                      <a
                        href={member.socialInstagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        data-testid={`staff-instagram-${member.id}`}
                      >
                        <Instagram size={20} />
                      </a>
                    )}
                    {member.socialFacebook && (
                      <a
                        href={member.socialFacebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        data-testid={`staff-facebook-${member.id}`}
                      >
                        <Facebook size={20} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
