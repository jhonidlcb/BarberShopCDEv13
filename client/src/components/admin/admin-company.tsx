import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAdminApi } from '@/hooks/use-admin-api';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface CompanyInfo {
  section: string;
  title?: string;
  titlePt?: string;
  content?: string;
  contentPt?: string;
  metadata?: any;
}

export function AdminCompany() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = useAdminApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: CompanyInfo }>({});

  const { data: companyInfo, isLoading } = useQuery<CompanyInfo[]>({
    queryKey: ['/api/admin/company'],
    queryFn: () => api.get('/api/admin/company'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CompanyInfo[]) => {
      return api.post('/api/admin/company', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company'] });
      toast({ title: 'Información actualizada correctamente' });
    },
    onError: () => {
      toast({ title: 'Error al actualizar la información', variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (companyInfo) {
      const mapped = companyInfo.reduce((acc, info) => {
        acc[info.section] = info;
        return acc;
      }, {} as { [key: string]: CompanyInfo });
      setFormData(mapped);
    }
  }, [companyInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataArray = Object.values(formData);
    updateMutation.mutate(dataArray);
  };

  const updateSection = (section: string, field: string, value: string) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        section,
        [field]: value
      }
    });
  };

  const handleImageUpload = async (section: string, field: string) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const result = await api.upload('/api/admin/upload', formData);
      updateSection(section, field, result.url);

      toast({ 
        title: '✅ Imagen subida correctamente',
        description: `Archivo: ${result.originalName}`
      });
    } catch (error) {
      toast({
        title: '❌ Error al subir imagen',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando información...</div>;
  }

  const sections = [
    {
      key: 'hero',
      title: 'Sección Hero',
      description: 'Contenido principal de la página de inicio',
      fields: [
        { field: 'title', label: 'Título Principal (Español)' },
        { field: 'titlePt', label: 'Título Principal (Portugués)' },
        { field: 'content', label: 'Descripción (Español)' },
        { field: 'contentPt', label: 'Descripción (Portugués)' },
      ]
    },
    {
      key: 'about',
      title: 'Nuestra Historia',
      description: 'Información sobre la barbería e historia',
      fields: [
        { field: 'title', label: 'Título Principal (Español)' },
        { field: 'titlePt', label: 'Título Principal (Portugués)' },
        { field: 'content', label: 'Descripción 1 (Español)' },
        { field: 'contentPt', label: 'Descripción 1 (Portugués)' },
        { field: 'content2', label: 'Descripción 2 (Español)' },
        { field: 'content2Pt', label: 'Descripción 2 (Portugués)' },
        { field: 'imageUrl', label: 'Imagen Principal' },
        { field: 'barberName', label: 'Nombre del Barbero Principal' },
        { field: 'barberTitle', label: 'Título del Barbero (Español)' },
        { field: 'barberTitlePt', label: 'Título del Barbero (Portugués)' },
        { field: 'yearsExperience', label: 'Años de Experiencia' },
        { field: 'totalClients', label: 'Total de Clientes' },
        { field: 'satisfaction', label: 'Porcentaje de Satisfacción' },
      ]
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sections.map((section) => (
        <Card key={section.key}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.field}>
                <Label htmlFor={`${section.key}-${field.field}`}>
                  {field.label}
                </Label>

                {field.field === 'imageUrl' ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id={`${section.key}-${field.field}`}
                        value={formData[section.key]?.[field.field as keyof CompanyInfo] as string || ''}
                        onChange={(e) => updateSection(section.key, field.field, e.target.value)}
                        placeholder="URL de imagen"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="shrink-0"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {uploading ? 'Subiendo...' : 'Subir'}
                      </Button>
                    </div>

                    {formData[section.key]?.[field.field as keyof CompanyInfo] && (
                      <div className="relative w-32 h-24 border rounded overflow-hidden">
                        <img 
                          src={formData[section.key]?.[field.field as keyof CompanyInfo] as string}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={() => handleImageUpload(section.key, field.field)}
                      className="hidden"
                    />
                  </div>
                ) : field.field.includes('content') ? (
                  <Textarea
                    id={`${section.key}-${field.field}`}
                    value={formData[section.key]?.[field.field as keyof CompanyInfo] as string || ''}
                    onChange={(e) => updateSection(section.key, field.field, e.target.value)}
                    rows={4}
                  />
                ) : (
                  <Input
                    id={`${section.key}-${field.field}`}
                    value={formData[section.key]?.[field.field as keyof CompanyInfo] as string || ''}
                    onChange={(e) => updateSection(section.key, field.field, e.target.value)}
                    type={field.field.includes('years') || field.field.includes('Clients') || field.field.includes('satisfaction') ? 'number' : 'text'}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Guardando...' : 'Guardar Información'}
        </Button>
      </div>
    </form>
  );
}