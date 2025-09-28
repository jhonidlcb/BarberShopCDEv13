import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useAdminApi } from '@/hooks/use-admin-api';
import { Plus, Edit, Trash, Upload, Image as ImageIcon, Globe, Palette, Eye, EyeOff, Loader2 } from 'lucide-react';

interface GalleryImage {
  id: string;
  title?: string;
  titlePt?: string;
  imageUrl: string;
  description?: string;
  descriptionPt?: string;
  category: string;
  active: boolean;
  sortOrder: number;
}

interface ImageFormData {
  title: string;
  titlePt: string;
  imageUrl: string;
  description: string;
  descriptionPt: string;
  category: string;
  active: boolean;
}

export function AdminGallery() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = useAdminApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<ImageFormData>({
    title: '',
    titlePt: '',
    imageUrl: '',
    description: '',
    descriptionPt: '',
    category: 'general',
    active: true,
  });

  const { data: images, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ['/api/admin/gallery'],
    queryFn: () => api.get('/api/admin/gallery'),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/api/admin/gallery', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gallery'] });
      toast({ title: '✅ Imagen agregada correctamente' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: '❌ Error al crear imagen', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/api/admin/gallery/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gallery'] });
      toast({ title: '✅ Imagen actualizada correctamente' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: '❌ Error al actualizar imagen', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/admin/gallery/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gallery'] });
      toast({ title: '✅ Imagen eliminada correctamente' });
    },
    onError: (error: any) => {
      toast({ 
        title: '❌ Error al eliminar imagen', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('admin_token');
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error al subir la imagen');
    }

    return response.json();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file);
      setFormData({ ...formData, imageUrl: result.url });
      toast({ title: '✅ Imagen subida correctamente' });
    } catch (error: any) {
      toast({ 
        title: '❌ Error al subir imagen', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      titlePt: '',
      imageUrl: '',
      description: '',
      descriptionPt: '',
      category: 'general',
      active: true,
    });
    setEditingImage(null);
    setIsSheetOpen(false);
  };

  const handleEdit = (image: GalleryImage) => {
    setFormData({
      title: image.title || '',
      titlePt: image.titlePt || '',
      imageUrl: image.imageUrl,
      description: image.description || '',
      descriptionPt: image.descriptionPt || '',
      category: image.category,
      active: image.active,
    });
    setEditingImage(image);
    setIsSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageUrl) {
      toast({ 
        title: '❌ Error', 
        description: 'Debes subir una imagen o proporcionar una URL',
        variant: 'destructive' 
      });
      return;
    }

    const submitData = {
      title: formData.title || null,
      titlePt: formData.titlePt || null,
      imageUrl: formData.imageUrl,
      description: formData.description || null,
      descriptionPt: formData.descriptionPt || null,
      category: formData.category,
      active: formData.active,
    };

    if (editingImage) {
      updateMutation.mutate({ id: editingImage.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'interior', label: 'Interior' },
    { value: 'tools', label: 'Herramientas' },
    { value: 'services', label: 'Servicios' },
    { value: 'team', label: 'Equipo' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200">Cargando galería...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Galería de Imágenes
          </h3>
          <p className="text-purple-200">
            Administra las imágenes con soporte multiidioma
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              onClick={() => setEditingImage(null)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Imagen
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-2xl bg-slate-900/95 backdrop-blur-md border-purple-500/20 text-white overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-white flex items-center">
                <div className="relative mr-3">
                  <ImageIcon className="h-6 w-6 text-purple-400" />
                  <div className="absolute -inset-1 bg-purple-500/20 rounded-full blur"></div>
                </div>
                {editingImage ? 'Editar Imagen' : 'Nueva Imagen'}
              </SheetTitle>
              <SheetDescription className="text-purple-200">
                {editingImage ? 'Modifica los datos de la imagen' : 'Agrega una nueva imagen a la galería'}
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              {/* Upload de imagen */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-purple-400" />
                    Imagen
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Sube una imagen desde tu dispositivo o usa una URL
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="h-20 flex flex-col items-center justify-center space-y-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Upload className="h-6 w-6" />
                      )}
                      <span className="text-sm">
                        {uploading ? 'Subiendo...' : 'Subir Archivo'}
                      </span>
                    </Button>

                    <div className="space-y-2">
                      <Label htmlFor="imageUrl" className="text-white">O URL de imagen</Label>
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://..."
                        className="bg-white/5 border-white/20 text-white placeholder:text-purple-300"
                      />
                    </div>
                  </div>

                  {formData.imageUrl && (
                    <div className="mt-4">
                      <p className="text-sm text-purple-200 mb-2">Vista previa:</p>
                      <div className="relative w-full h-32 bg-white/5 rounded-lg overflow-hidden border border-white/10">
                        <img
                          src={formData.imageUrl}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Títulos */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-purple-400" />
                    Títulos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="text-white">Español</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-white/5 border-white/20 text-white placeholder:text-purple-300"
                        placeholder="Título en español"
                      />
                    </div>
                    <div>
                      <Label htmlFor="titlePt" className="text-white">Portugués</Label>
                      <Input
                        id="titlePt"
                        value={formData.titlePt}
                        onChange={(e) => setFormData({ ...formData, titlePt: e.target.value })}
                        className="bg-white/5 border-white/20 text-white placeholder:text-purple-300"
                        placeholder="Título em português"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Descripciones */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Descripciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="description" className="text-white">Español</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="bg-white/5 border-white/20 text-white placeholder:text-purple-300"
                        placeholder="Descripción en español"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="descriptionPt" className="text-white">Portugués</Label>
                      <Textarea
                        id="descriptionPt"
                        value={formData.descriptionPt}
                        onChange={(e) => setFormData({ ...formData, descriptionPt: e.target.value })}
                        className="bg-white/5 border-white/20 text-white placeholder:text-purple-300"
                        placeholder="Descrição em português"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuración */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Palette className="h-5 w-5 mr-2 text-purple-400" />
                    Configuración
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-white">Categoría</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-purple-500/20">
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-purple-500/20">
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-3 pt-6">
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                      />
                      <Label htmlFor="active" className="text-white flex items-center">
                        {formData.active ? (
                          <Eye className="h-4 w-4 mr-1 text-green-400" />
                        ) : (
                          <EyeOff className="h-4 w-4 mr-1 text-red-400" />
                        )}
                        {formData.active ? 'Visible' : 'Oculta'}
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editingImage ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Grid de imágenes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images?.map((image) => (
          <Card key={image.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <div className="relative overflow-hidden rounded-t-lg">
              <img
                src={image.imageUrl}
                alt={image.title || 'Imagen de galería'}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2">
                {image.active ? (
                  <div className="bg-green-500/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Eye className="h-3 w-3 text-green-400" />
                  </div>
                ) : (
                  <div className="bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    <EyeOff className="h-3 w-3 text-red-400" />
                  </div>
                )}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-white truncate">
                  {image.title || 'Sin título'}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-300 capitalize">
                    {categories.find(c => c.value === image.category)?.label || image.category}
                  </span>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(image)}
                      className="h-8 w-8 p-0 text-purple-300 hover:text-white hover:bg-purple-500/20"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteMutation.mutate(image.id)}
                      disabled={deleteMutation.isPending}
                      className="h-8 w-8 p-0 text-red-300 hover:text-white hover:bg-red-500/20"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {images?.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="text-center py-12">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <ImageIcon className="h-20 w-20 text-purple-400/50" />
              <div className="absolute -inset-2 bg-purple-500/10 rounded-full blur"></div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay imágenes
            </h3>
            <p className="text-purple-300 mb-4">
              Comienza agregando tu primera imagen a la galería
            </p>
            <Button 
              onClick={() => setIsSheetOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primera Imagen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}