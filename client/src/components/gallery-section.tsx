import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';

interface GalleryImage {
  id: string;
  title?: string;
  titlePt?: string;
  imageUrl: string;
  description?: string;
  descriptionPt?: string;
  category: string;
  active: boolean;
}

export function GallerySection() {
  const { t, language } = useLanguage();

  const { data: galleryImages, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ['/api/gallery'],
    queryFn: async () => {
      const response = await fetch('/api/gallery');
      if (!response.ok) {
        throw new Error('Failed to fetch gallery images');
      }
      return response.json();
    },
  });

  const displayImages = galleryImages?.filter(img => img.active) || [];

  // Fallback images si no hay en la base de datos
  const fallbackImages = [
    {
      id: 'fallback-1',
      imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
      title: "Fade Clásico",
      titlePt: "Fade Clássico",
      description: "Corte clásico con fade",
      descriptionPt: "Corte clássico com fade",
      category: "general",
      active: true
    },
    {
      id: 'fallback-2',
      imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
      title: "Barba Moderna",
      titlePt: "Barba Moderna",
      description: "Arreglo de barba profesional",
      descriptionPt: "Arranjo de barba profissional",
      category: "general",
      active: true
    },
    {
      id: 'fallback-3',
      imageUrl: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
      title: "Ejecutivo",
      titlePt: "Executivo",
      description: "Corte ejecutivo moderno",
      descriptionPt: "Corte executivo moderno",
      category: "general",
      active: true
    },
    {
      id: 'fallback-4',
      imageUrl: "https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
      title: "Afeitado Clásico",
      titlePt: "Barbear Clássico",
      description: "Afeitado tradicional con navaja",
      descriptionPt: "Barbear tradicional com navalha",
      category: "general",
      active: true
    }
  ];

  const imagesToShow = displayImages.length > 0 ? displayImages : fallbackImages;

  return (
    <section id="galeria" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-gallery-title">
            {t('gallery.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-gallery-subtitle">
            {t('gallery.subtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div 
                key={index}
                className="aspect-square bg-muted rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imagesToShow.map((image, index) => (
              <div 
                key={image.id}
                className="group relative overflow-hidden rounded-xl aspect-square"
                data-testid={`gallery-item-${index}`}
              >
                <img 
                  src={image.imageUrl}
                  alt={language === 'pt' ? (image.descriptionPt || image.description || 'Imagem da galeria') : (image.description || 'Imagen de galería')}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end">
                  <div className="text-white p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="font-semibold" data-testid={`text-gallery-title-${index}`}>
                      {language === 'pt' ? (image.titlePt || image.title || 'Sem título') : (image.title || 'Sin título')}
                    </h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold transition-colors"
            data-testid="button-view-more"
          >
            {t('gallery.viewMore')}
          </button>
        </div>
      </div>
    </section>
  );
}
