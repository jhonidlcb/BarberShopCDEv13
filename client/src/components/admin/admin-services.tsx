import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAdminApi } from '@/hooks/use-admin-api';
import { Edit, Plus, Trash2, Eye, EyeOff, Upload, Loader2 } from 'lucide-react';
import type { Service } from '@shared/schema';

interface ServiceFormData {
  name: string;
  namePt: string;
  description: string;
  descriptionPt: string;
  priceUSD: number;
  priceBRL: number;
  pricePYG: number;
  durationMinutes: number;
  imageUrl: string;
  active: boolean;
  isPopular: boolean;
  sortOrder: number;
}

const initialFormData: ServiceFormData = {
  name: '',
  namePt: '',
  description: '',
  descriptionPt: '',
  priceUSD: 0,
  priceBRL: 0,
  pricePYG: 0,
  durationMinutes: 30,
  imageUrl: '',
  active: true,
  isPopular: false,
  sortOrder: 0,
};

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const api = useAdminApi();

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/api/admin/services');
      setServices(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los servicios',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      name: formData.name,
      namePt: formData.namePt,
      description: formData.description,
      descriptionPt: formData.descriptionPt,
      priceUsd: formData.priceUSD,
      priceBrl: null, // Se calculará automáticamente
      pricePyg: null, // Se calculará automáticamente
      durationMinutes: formData.durationMinutes,
      imageUrl: formData.imageUrl || null,
      active: formData.active,
      isPopular: formData.isPopular,
      sortOrder: formData.sortOrder,
    };

    try {
      if (editingService) {
        await api.put(`/api/admin/services/${editingService.id}`, submitData);
        toast({ title: 'Servicio actualizado correctamente' });
      } else {
        await api.post('/api/admin/services', submitData);
        toast({ title: 'Servicio creado correctamente' });
      }

      setFormData(initialFormData);
      setEditingService(null);
      setIsDialogOpen(false);
      fetchServices();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar el servicio',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (service: Service) => {
    setFormData({
      name: service.name || '',
      namePt: service.namePt || '',
      description: service.description || '',
      descriptionPt: service.descriptionPt || '',
      priceUSD: Number(service.priceUsd) || 0,
      priceBRL: Number(service.priceBrl) || 0,
      pricePYG: Number(service.pricePyg) || 0,
      durationMinutes: service.durationMinutes || 30,
      imageUrl: service.imageUrl || '',
      active: service.active ?? true,
      isPopular: service.isPopular || false,
      sortOrder: service.sortOrder || 0,
    });
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) return;

    try {
      await api.delete(`/api/admin/services/${id}`);
      toast({ title: 'Servicio eliminado correctamente' });
      fetchServices();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el servicio',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await api.put(`/api/admin/services/${service.id}`, {
        ...service,
        active: !service.active,
      });
      toast({ title: `Servicio ${!service.active ? 'activado' : 'desactivado'} correctamente` });
      fetchServices();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el servicio',
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const result = await api.upload('/api/admin/upload', uploadFormData);
      setFormData(prev => ({ ...prev, imageUrl: result.url }));

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
    return <div className="text-center">Cargando servicios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Servicios</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData(initialFormData);
              setEditingService(null);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </DialogTitle>
              <DialogDescription>
                Configura el servicio en español y portugués con precios en USD, BRL y PYG
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre (Español)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="namePt">Nome (Português)</Label>
                  <Input
                    id="namePt"
                    value={formData.namePt}
                    onChange={(e) => setFormData({ ...formData, namePt: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Descripción (Español)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descriptionPt">Descrição (Português)</Label>
                  <Textarea
                    id="descriptionPt"
                    value={formData.descriptionPt}
                    onChange={(e) => setFormData({ ...formData, descriptionPt: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="priceUSD">Precio Base (USD)</Label>
                  <Input
                    id="priceUSD"
                    type="number"
                    step="0.01"
                    value={formData.priceUSD}
                    onChange={(e) => setFormData({ ...formData, priceUSD: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="Ej: 25.00"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Los precios en otras monedas se calcularán automáticamente según las tasas de cambio configuradas.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Vista previa de precios:</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">USD:</span> ${formData.priceUSD.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">BRL:</span> R$ {(formData.priceUSD * 5.2).toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">PYG:</span> ₲ {(formData.priceUSD * 7200000).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    *Los precios se actualizarán según las tasas de cambio reales configuradas
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="durationMinutes">Duración (minutos)</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Orden</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">Imagen del Servicio</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="URL de imagen o usar botón subir"
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

                  {formData.imageUrl && (
                    <div className="relative w-32 h-24 border rounded overflow-hidden">
                      <img 
                        src={formData.imageUrl}
                        alt="Preview del servicio"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label>Servicio Activo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isPopular}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                  />
                  <Label>Servicio Popular</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingService ? 'Actualizar' : 'Crear'} Servicio
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Precios</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Popular</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-muted-foreground">{service.namePt}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>USD: ${service.priceUsd}</div>
                      <div>BRL: R${service.priceBrl}</div>
                      <div>PYG: ₲{service.pricePyg}</div>
                    </div>
                  </TableCell>
                  <TableCell>{service.durationMinutes} min</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(service)}
                    >
                      {service.active ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-red-600" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {service.isPopular && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Popular
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {services.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay servicios registrados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}