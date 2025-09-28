import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAdminApi } from '@/hooks/use-admin-api';

interface SiteConfig {
  [key: string]: string;
}

export function AdminConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = useAdminApi();
  const [formData, setFormData] = useState<SiteConfig>({});

  const { data: config, isLoading } = useQuery<SiteConfig>({
    queryKey: ['/api/admin/config'],
    queryFn: () => api.get('/api/admin/config'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SiteConfig) => {
      return api.post('/api/admin/config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config'] });
      toast({ title: 'Configuración actualizada correctamente' });
    },
    onError: () => {
      toast({ title: 'Error al actualizar la configuración', variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando configuración...</div>;
  }

  const sections = [
    {
      title: 'Información General',
      description: 'Configuración básica del sitio',
      fields: [
        { key: 'site_name', label: 'Nombre del Sitio', type: 'text' },
        { key: 'site_description', label: 'Descripción del Sitio', type: 'text' },
        { key: 'site_email', label: 'Email de Contacto', type: 'email' },
        { key: 'site_phone', label: 'Teléfono Principal', type: 'tel' },
        { key: 'address', label: 'Dirección Completa', type: 'text' },
        { key: 'google_maps_url', label: 'URL de Google Maps', type: 'url' },
      ]
    },
    {
      title: 'Redes Sociales',
      description: 'Enlaces a redes sociales y WhatsApp',
      fields: [
        { key: 'whatsapp_number', label: 'Número de WhatsApp', type: 'tel' },
        { key: 'instagram_url', label: 'URL de Instagram', type: 'url' },
        { key: 'facebook_url', label: 'URL de Facebook', type: 'url' },
      ]
    },
    {
      title: 'Horarios de Atención',
      description: 'Configura los horarios de la barbería',
      fields: [
        { key: 'hours_monday', label: 'Lunes', type: 'text', placeholder: '8:00 - 20:00' },
        { key: 'hours_tuesday', label: 'Martes', type: 'text', placeholder: '8:00 - 20:00' },
        { key: 'hours_wednesday', label: 'Miércoles', type: 'text', placeholder: '8:00 - 20:00' },
        { key: 'hours_thursday', label: 'Jueves', type: 'text', placeholder: '8:00 - 20:00' },
        { key: 'hours_friday', label: 'Viernes', type: 'text', placeholder: '8:00 - 20:00' },
        { key: 'hours_saturday', label: 'Sábado', type: 'text', placeholder: '8:00 - 18:00' },
        { key: 'hours_sunday', label: 'Domingo', type: 'text', placeholder: 'Cerrado' },
      ]
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.key}>
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={'placeholder' in field ? field.placeholder : ''}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </form>
  );
}