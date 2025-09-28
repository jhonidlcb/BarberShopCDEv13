
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAdminApi } from '@/hooks/use-admin-api';
import { Plus, Edit, Trash2, User, Upload, X } from 'lucide-react';

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
  active: boolean;
  sortOrder?: number;
}

export function AdminStaff() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = useAdminApi();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    positionEs: '',
    positionPt: '',
    description: '',
    descriptionEs: '',
    descriptionPt: '',
    imageUrl: '',
    yearsExperience: 0,
    specialties: '',
    specialtiesEs: '',
    specialtiesPt: '',
    socialInstagram: '',
    socialFacebook: '',
    active: true,
    sortOrder: 0
  });

  const { data: staff, isLoading } = useQuery<StaffMember[]>({
    queryKey: ['/api/admin/staff'],
    queryFn: () => api.get('/api/admin/staff'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/admin/staff', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff'] });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({ title: 'Miembro del equipo creado correctamente' });
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error al crear miembro del equipo', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/api/admin/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff'] });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({ title: 'Miembro del equipo actualizado correctamente' });
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error al actualizar miembro del equipo', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff'] });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({ title: 'Miembro del equipo eliminado correctamente' });
    },
    onError: () => {
      toast({ title: 'Error al eliminar miembro del equipo', variant: 'destructive' });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
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
      
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      setImagePreview(data.url);
      toast({ title: 'Imagen subida correctamente' });
    },
    onError: () => {
      toast({ title: 'Error al subir imagen', variant: 'destructive' });
    },
  });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'La imagen debe ser menor a 5MB', variant: 'destructive' });
        return;
      }
      
      // Crear preview local inmediatamente
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Subir archivo automáticamente
      setUploadingImage(true);
      try {
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
        
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        
        // Actualizar formData con la URL de la imagen subida
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        setImagePreview(data.url);
        toast({ title: 'Imagen subida correctamente' });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({ title: 'Error al subir imagen', variant: 'destructive' });
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    setUploadingImage(true);
    try {
      const result = await uploadImageMutation.mutateAsync(imageFile);
      // Limpiar el archivo después de subir exitosamente
      setImageFile(null);
      return result;
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      positionEs: '',
      positionPt: '',
      description: '',
      descriptionEs: '',
      descriptionPt: '',
      imageUrl: '',
      yearsExperience: 0,
      specialties: '',
      specialtiesEs: '',
      specialtiesPt: '',
      socialInstagram: '',
      socialFacebook: '',
      active: true,
      sortOrder: 0
    });
    setEditingMember(null);
    setImageFile(null);
    setImagePreview('');
    setIsDialogOpen(false);
  };

  const handleEdit = (member: StaffMember) => {
    setFormData({
      name: member.name,
      position: member.position,
      positionEs: member.positionEs || '',
      positionPt: member.positionPt,
      description: member.description || '',
      descriptionEs: member.descriptionEs || '',
      descriptionPt: member.descriptionPt || '',
      imageUrl: member.imageUrl || '',
      yearsExperience: member.yearsExperience || 0,
      specialties: member.specialties || '',
      specialtiesEs: member.specialtiesEs || '',
      specialtiesPt: member.specialtiesPt || '',
      socialInstagram: member.socialInstagram || '',
      socialFacebook: member.socialFacebook || '',
      active: member.active,
      sortOrder: member.sortOrder || 0
    });
    setImagePreview(member.imageUrl || '');
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  if (isLoading) {
    return <div className="text-center py-8 text-white">Cargando equipo...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Gestión del Equipo</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Miembro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] bg-slate-800 text-white border-slate-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {editingMember ? 'Editar Miembro del Equipo' : 'Agregar Miembro del Equipo'}
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                {editingMember ? 'Actualiza la información del miembro del equipo' : 'Agrega un nuevo miembro al equipo de trabajo'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="yearsExperience">Años de Experiencia</Label>
                  <Input
                    id="yearsExperience"
                    name="yearsExperience"
                    type="number"
                    min="0"
                    value={formData.yearsExperience}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label>Imagen del Miembro</Label>
                <div className="space-y-4">
                  {/* Preview de imagen */}
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border border-slate-600"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={removeImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Upload de archivo */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={uploadingImage}
                      className="bg-slate-700 border-slate-600 text-white file:bg-slate-600 file:border-0 file:text-white"
                    />
                    {uploadingImage && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                        <span className="text-sm">Subiendo...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Fallback para URL manual */}
                  <div>
                    <Label htmlFor="imageUrl" className="text-xs text-slate-400">O ingresa una URL de imagen</Label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        handleInputChange(e);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-white">Cargo/Posición</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="positionEs">Español</Label>
                    <Input
                      id="positionEs"
                      name="positionEs"
                      value={formData.positionEs}
                      onChange={handleInputChange}
                      placeholder="Barbero Senior"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionPt">Português *</Label>
                    <Input
                      id="positionPt"
                      name="positionPt"
                      value={formData.positionPt}
                      onChange={handleInputChange}
                      placeholder="Barbeiro Sênior"
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-white">Descripción</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="descriptionEs">Español</Label>
                    <Textarea
                      id="descriptionEs"
                      name="descriptionEs"
                      value={formData.descriptionEs}
                      onChange={handleInputChange}
                      placeholder="Descripción en español..."
                      className="bg-slate-700 border-slate-600 text-white"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="descriptionPt">Português</Label>
                    <Textarea
                      id="descriptionPt"
                      name="descriptionPt"
                      value={formData.descriptionPt}
                      onChange={handleInputChange}
                      placeholder="Descrição em português..."
                      className="bg-slate-700 border-slate-600 text-white"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-white">Especialidades</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialtiesEs">Español</Label>
                    <Input
                      id="specialtiesEs"
                      name="specialtiesEs"
                      value={formData.specialtiesEs}
                      onChange={handleInputChange}
                      placeholder="Cortes clásicos, Barba, Fade"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialtiesPt">Português</Label>
                    <Input
                      id="specialtiesPt"
                      name="specialtiesPt"
                      value={formData.specialtiesPt}
                      onChange={handleInputChange}
                      placeholder="Cortes clássicos, Barba, Fade"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="socialInstagram">Instagram</Label>
                  <Input
                    id="socialInstagram"
                    name="socialInstagram"
                    value={formData.socialInstagram}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/usuario"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="socialFacebook">Facebook</Label>
                  <Input
                    id="socialFacebook"
                    name="socialFacebook"
                    value={formData.socialFacebook}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/usuario"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sortOrder">Orden de Visualización</Label>
                  <Input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active">Activo</Label>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? (editingMember ? 'Actualizando...' : 'Creando...') 
                    : (editingMember ? 'Actualizar' : 'Crear')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-slate-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Experiencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  {member.imageUrl ? (
                    <img 
                      src={member.imageUrl} 
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                      <User size={20} className="text-slate-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.positionEs || member.position}</TableCell>
                <TableCell>{member.yearsExperience || 0} años</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    member.active 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {member.active ? 'Activo' : 'Inactivo'}
                  </span>
                </TableCell>
                <TableCell>{member.sortOrder}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(member)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(member.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600/20"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
