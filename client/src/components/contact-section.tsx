import { useLanguage } from '@/hooks/use-language';
import { MapPin, Phone, Mail, MessageCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PhoneInput } from './ui/phone-input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';

export function ContactSection() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: 'Mensaje enviado',
        description: 'Te contactaremos pronto. Redirigiendo a WhatsApp...',
      });

      // Get WhatsApp number and redirect
      try {
        const configResponse = await fetch('/api/site-config');
        const siteConfig = await configResponse.json();
        const whatsappNumber = siteConfig?.whatsapp_number || '+595971234567';
        
        const serviceName = services?.find((s: any) => s.id === formData.service)?.name || formData.service;
        const message = encodeURIComponent(
          `¡Hola! Te escribo desde el formulario de contacto:\n\n` +
          `👤 Nombre: ${formData.name}\n` +
          `📞 Teléfono: ${formData.phone}\n` +
          `${serviceName ? `✂️ Servicio de interés: ${serviceName}\n` : ''}` +
          `💬 Mensaje: ${formData.message}\n\n` +
          `¡Espero tu respuesta!`
        );

        setTimeout(() => {
          window.open(`https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${message}`, '_blank');
        }, 2000);
      } catch (error) {
        console.error('Error getting WhatsApp config:', error);
      }

      // Reset form
      setFormData({
        name: '',
        phone: '',
        service: '',
        message: ''
      });
    },
    onError: () => {
      toast({
        title: 'Error al enviar mensaje',
        description: 'Intenta nuevamente o contáctanos por WhatsApp',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.message) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa nombre, teléfono y mensaje',
        variant: 'destructive'
      });
      return;
    }

    contactMutation.mutate(formData);
  };

  const { data: services } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
  });

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


  return (
    <>
      {/* Hours and Contact Info Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Hours */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="font-serif text-3xl font-bold text-foreground mb-6 flex items-center gap-3" data-testid="text-hours-title">
                <Clock className="text-primary" size={32} />
                {t('hours.title')}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground" data-testid="text-monday">Lunes</span>
                  <span className="font-semibold text-foreground">{siteConfig?.hours_monday || '8:00 - 20:00'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground" data-testid="text-tuesday">Martes</span>
                  <span className="font-semibold text-foreground">{siteConfig?.hours_tuesday || '8:00 - 20:00'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground" data-testid="text-wednesday">Miércoles</span>
                  <span className="font-semibold text-foreground">{siteConfig?.hours_wednesday || '8:00 - 20:00'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground" data-testid="text-thursday">Jueves</span>
                  <span className="font-semibold text-foreground">{siteConfig?.hours_thursday || '8:00 - 20:00'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground" data-testid="text-friday">Viernes</span>
                  <span className="font-semibold text-foreground">{siteConfig?.hours_friday || '8:00 - 20:00'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground" data-testid="text-saturday">Sábado</span>
                  <span className="font-semibold text-foreground">{siteConfig?.hours_saturday || '8:00 - 18:00'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground" data-testid="text-sunday">Domingo</span>
                  <span className="font-semibold text-foreground">{siteConfig?.hours_sunday || 'Cerrado'}</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground" data-testid="text-hours-note">
                  {t('hours.note')}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="font-serif text-3xl font-bold text-foreground mb-6" data-testid="text-contact-title">
                {t('contact.title')}
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="text-primary text-xl">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1" data-testid="text-address-label">
                      {t('contact.address')}
                    </h4>
                    <p className="text-muted-foreground" data-testid="text-address">
                      {siteConfig?.address || 'Av. Monseñor Rodríguez 1245, Ciudad del Este, Paraguay'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="text-primary text-xl">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1" data-testid="text-phone-label">
                      {t('contact.phone')}
                    </h4>
                    <p className="text-muted-foreground" data-testid="text-phone">
                      {siteConfig?.site_phone || '+595 61 570-123'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="text-primary text-xl">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1" data-testid="text-email-label">Email</h4>
                    <p className="text-muted-foreground" data-testid="text-email">
                      {siteConfig?.site_email || 'info@barberiaclasica.com'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="text-primary text-xl">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1" data-testid="text-whatsapp-label">WhatsApp</h4>
                    <p className="text-muted-foreground" data-testid="text-whatsapp">
                      {siteConfig?.whatsapp_number || '+595 971 234-567'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold transition-colors"
                  data-testid="button-whatsapp"
                  onClick={() => {
                    const whatsappNumber = siteConfig?.whatsapp_number || '+595971234567';
                    const message = encodeURIComponent('Hola! Me gustaría hacer una cita en la barbería.');
                    window.open(`https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${message}`, '_blank');
                  }}
                >
                  {t('contact.whatsapp')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contacto" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-visit-title">
              {t('contact.visit')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-visit-subtitle">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-6" data-testid="text-message-title">
                {t('contact.sendMessage')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-muted-foreground mb-2" data-testid="label-name">
                      {t('contact.name')}
                    </Label>
                    <Input 
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors" 
                      placeholder={t('contact.namePlaceholder')}
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-muted-foreground mb-2" data-testid="label-phone">
                      {t('contact.phone')}
                    </Label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) => setFormData({...formData, phone: value})}
                      placeholder={t('contact.phonePlaceholder')}
                      className="w-full"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-muted-foreground mb-2" data-testid="label-service">
                    {t('contact.service')}
                  </Label>
                  <Select 
                    value={formData.service}
                    onValueChange={(value) => setFormData({...formData, service: value})}
                    data-testid="select-service"
                  >
                    <SelectTrigger className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors">
                      <SelectValue placeholder={t('contact.selectService')}/>
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map((service: any) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-muted-foreground mb-2" data-testid="label-message">
                    {t('contact.message')}
                  </Label>
                  <Textarea 
                    rows={4}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors" 
                    placeholder={t('contact.messagePlaceholder')}
                    data-testid="textarea-message"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={contactMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-send-message"
                >
                  {contactMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                      Enviando...
                    </div>
                  ) : (
                    t('contact.sendBtn')
                  )}
                </Button>
              </form>
            </div>

            {/* Map Area */}
            <div>
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-6" data-testid="text-location-title">
                {t('contact.location')}
              </h3>
              <div className="bg-background rounded-lg h-96 flex items-center justify-center border border-border">
                <div className="text-center text-muted-foreground">
                  <MapPin className="text-primary text-4xl mb-4 mx-auto" size={48} />
                  <p className="text-lg font-medium" data-testid="text-map-address">
                    {siteConfig?.address || 'Av. Monseñor Rodríguez 1245, Ciudad del Este, Paraguay'}
                  </p>
                  <button 
                    className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors"
                    data-testid="button-google-maps"
                    onClick={() => window.open(siteConfig?.google_maps_url || 'https://maps.google.com', '_blank')}
                  >
                    {t('contact.viewMaps')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}