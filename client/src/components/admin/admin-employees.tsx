
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAdminApi } from '@/hooks/use-admin-api';
import { Plus, Edit, Trash2, User, Users, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  position: string;
  active: boolean;
}

interface EmployeeUser {
  id: string;
  staffMemberId?: string;
  username: string;
  email: string;
  active: boolean;
  canLogin: boolean;
  createdAt: string;
  staffMember?: StaffMember;
}

interface EmployeeStats {
  employeeId: string;
  monthYear: string;
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: string;
  employeeName: string;
  employeeUsername: string;
}

export function AdminEmployees() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = useAdminApi();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeUser | null>(null);
  const [formData, setFormData] = useState({
    staffMemberId: 'none',
    username: '',
    email: '',
    password: '',
    active: true,
    canLogin: true
  });

  const { data: employees, isLoading } = useQuery<EmployeeUser[]>({
    queryKey: ['/api/admin/employees'],
    queryFn: () => api.get('/api/admin/employees'),
  });

  const { data: staffMembers } = useQuery<StaffMember[]>({
    queryKey: ['/api/admin/staff'],
    queryFn: () => api.get('/api/admin/staff'),
  });

  const { data: employeeStats } = useQuery<EmployeeStats[]>({
    queryKey: ['/api/admin/employee-stats'],
    queryFn: () => api.get('/api/admin/employee-stats'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/admin/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      toast({ title: 'Empleado creado correctamente' });
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error al crear empleado', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/api/admin/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      toast({ title: 'Empleado actualizado correctamente' });
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error al actualizar empleado', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      toast({ title: 'Empleado eliminado correctamente' });
    },
    onError: () => {
      toast({ title: 'Error al eliminar empleado', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      staffMemberId: 'none',
      username: '',
      email: '',
      password: '',
      active: true,
      canLogin: true
    });
    setEditingEmployee(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (employee: EmployeeUser) => {
    setFormData({
      staffMemberId: employee.staffMemberId || 'none',
      username: employee.username,
      email: employee.email,
      password: '', // Don't populate password for security
      active: employee.active,
      canLogin: employee.canLogin
    });
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't send empty password on update
    const submitData: any = { ...formData };
    
    // Construct payload properly without empty password
    const finalData: any = {
      ...submitData,
      // Convert 'none' to null for staffMemberId
      staffMemberId: submitData.staffMemberId === 'none' ? null : submitData.staffMemberId
    };
    
    // Only include password if it's not empty (for updates)
    if (!editingEmployee || finalData.password) {
      // Keep password for new employees or when updating password
    } else {
      // Remove password field for updates when empty
      const { password, ...dataWithoutPassword } = finalData;
      Object.assign(finalData, dataWithoutPassword);
    }
    
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calculate current month stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthStats = employeeStats?.filter(stat => stat.monthYear === currentMonth) || [];
  const totalRevenue = currentMonthStats.reduce((sum, stat) => sum + parseFloat(stat.totalRevenue), 0);
  const totalAppointments = currentMonthStats.reduce((sum, stat) => sum + stat.totalAppointments, 0);

  if (isLoading) {
    return <div className="text-center py-8 text-white">Cargando empleados...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              Total Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{employees?.length || 0}</div>
            <p className="text-purple-300 text-sm">
              {employees?.filter(emp => emp.active).length || 0} activos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Calendar className="h-5 w-5 mr-2 text-green-400" />
              Citas Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalAppointments}</div>
            <p className="text-purple-300 text-sm">Por todos los empleados</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <DollarSign className="h-5 w-5 mr-2 text-yellow-400" />
              Ingresos Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
            <p className="text-purple-300 text-sm">Total generado</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Gestión de Empleados</h3>
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
              Agregar Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-slate-800 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {editingEmployee ? 'Editar Empleado' : 'Agregar Empleado'}
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                {editingEmployee ? 'Actualiza la información del empleado' : 'Crea un nuevo empleado con acceso al sistema'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="staffMemberId">Miembro del Equipo</Label>
                <Select 
                  value={formData.staffMemberId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, staffMemberId: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Seleccionar miembro del equipo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="none" className="text-white hover:bg-slate-600">
                      Sin asignar
                    </SelectItem>
                    {staffMembers?.filter(member => 
                      member.active && (!employees?.some(emp => emp.staffMemberId === member.id) || 
                      (editingEmployee && editingEmployee.staffMemberId === member.id))
                    ).map((member) => (
                      <SelectItem key={member.id} value={member.id} className="text-white hover:bg-slate-600">
                        {member.name} - {member.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Usuario *</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">
                  Contraseña {editingEmployee ? '(dejar en blanco para mantener actual)' : '*'}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  required={!editingEmployee}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active">Activo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="canLogin"
                    checked={formData.canLogin}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canLogin: checked }))}
                  />
                  <Label htmlFor="canLogin">Puede Iniciar Sesión</Label>
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
                    ? (editingEmployee ? 'Actualizando...' : 'Creando...') 
                    : (editingEmployee ? 'Actualizar' : 'Crear')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees Table */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Lista de Empleados</CardTitle>
          <CardDescription className="text-purple-200">
            Gestiona los empleados y su acceso al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Miembro del Equipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Puede Acceder</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.username}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      {employee.staffMember ? (
                        <div className="flex flex-col">
                          <span className="text-green-400 font-medium">
                            {employee.staffMember.name}
                          </span>
                          <span className="text-xs text-purple-300">
                            {employee.staffMember.position}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        employee.active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {employee.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        employee.canLogin 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {employee.canLogin ? 'Sí' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(employee)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(employee.id)}
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
        </CardContent>
      </Card>

      {/* Employee Statistics */}
      {currentMonthStats.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
              Estadísticas del Mes Actual
            </CardTitle>
            <CardDescription className="text-purple-200">
              Rendimiento de empleados en {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Total Citas</TableHead>
                    <TableHead>Completadas</TableHead>
                    <TableHead>Ingresos</TableHead>
                    <TableHead>Tasa Éxito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentMonthStats.map((stat) => (
                    <TableRow key={stat.employeeId}>
                      <TableCell className="font-medium">
                        {stat.employeeName || stat.employeeUsername}
                      </TableCell>
                      <TableCell>{stat.totalAppointments}</TableCell>
                      <TableCell>{stat.completedAppointments}</TableCell>
                      <TableCell>${parseFloat(stat.totalRevenue).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className="text-green-400">
                          {stat.totalAppointments > 0 
                            ? `${Math.round((stat.completedAppointments / stat.totalAppointments) * 100)}%`
                            : '0%'
                          }
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
