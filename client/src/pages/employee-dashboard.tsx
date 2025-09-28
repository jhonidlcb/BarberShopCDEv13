import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentModal } from '@/components/admin/payment-modal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, CheckCircle, Clock, DollarSign, LogOut } from 'lucide-react';

interface EmployeeAuthContextType {
  employee: any;
  logout: () => void;
}

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
  status: string;
  amountPaid?: number;
  paymentCurrency?: string;
  createdAt: string;
  attendedByEmployeeId?: string;
}

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    appointmentId: string;
    customerName: string;
    serviceType: string;
  }>({
    isOpen: false,
    appointmentId: '',
    customerName: '',
    serviceType: ''
  });

  // Mock employee auth - replace with actual auth context
  const employee = JSON.parse(localStorage.getItem('employee_user') || '{}');
  const token = localStorage.getItem('employee_token');

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/employee/appointments'],
    queryFn: async () => {
      const response = await fetch('/api/employee/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.log('Token expired during appointments fetch, redirecting to login...');
        localStorage.removeItem('employee_token');
        localStorage.removeItem('employee_user');
        window.location.href = '/admin/login';
        throw new Error('Sesión expirada');
      }

      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    },
    enabled: !!token,
    retry: (failureCount, error) => {
      // Don't retry if it's an auth error
      if (error.message === 'Sesión expirada') return false;
      return failureCount < 3;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/employee/stats'],
    queryFn: async () => {
      const response = await fetch('/api/employee/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.log('Token expired during stats fetch, redirecting to login...');
        localStorage.removeItem('employee_token');
        localStorage.removeItem('employee_user');
        window.location.href = '/admin/login';
        throw new Error('Sesión expirada');
      }

      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!token,
    retry: (failureCount, error) => {
      // Don't retry if it's an auth error
      if (error.message === 'Sesión expirada') return false;
      return failureCount < 3;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, amountPaid, paymentCurrency }: {
      id: string;
      status: string;
      amountPaid?: number;
      paymentCurrency?: string;
    }) => {
      const response = await fetch(`/api/employee/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, amountPaid, paymentCurrency }),
      });

      if (response.status === 401) {
        console.log('Token expired or invalid, redirecting to login...');
        localStorage.removeItem('employee_token');
        localStorage.removeItem('employee_user');
        window.location.href = '/admin/login';
        throw new Error('Sesión expirada');
      }

      if (response.status === 409) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Esta cita ya fue tomada por otro empleado');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error updating status');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employee/stats'] });

      if (variables.status === 'confirmed') {
        toast({
          title: '¡Cita confirmada!',
          description: 'La cita ha sido asignada a ti automáticamente.',
          className: 'bg-green-600 text-white'
        });
      } else if (variables.status === 'completed') {
        toast({
          title: '¡Pago registrado!',
          description: 'La cita ha sido completada exitosamente.',
          className: 'bg-green-600 text-white'
        });
      } else {
        toast({ title: 'Estado actualizado correctamente' });
      }
    },
    onError: (error: Error) => {
      // Only show error toast for actual errors, not for successful completions
      if (error.message !== 'Sesión expirada') {
        toast({
          title: 'Error al actualizar el estado',
          description: error.message,
          variant: 'destructive'
        });
      }
      // Actualizar la lista para reflejar los cambios
      queryClient.invalidateQueries({ queryKey: ['/api/employee/appointments'] });
    },
  });

  const handlePaymentConfirm = async (amount: number, currency: string, employeeId?: string) => {
    console.log('handlePaymentConfirm llamado con:', { amount, currency, appointmentId: paymentModal.appointmentId, employeeId }); // Debug log

    // Close modal immediately to prevent double calls
    setPaymentModal({ isOpen: false, appointmentId: '', customerName: '', serviceType: '' });

    try {
      await updateStatusMutation.mutateAsync({
        id: paymentModal.appointmentId,
        status: 'completed',
        amountPaid: amount,
        paymentCurrency: currency
      });
      console.log('Pago confirmado exitosamente'); // Debug log
    } catch (error) {
      console.error('Error confirming payment:', error);
      // Re-open modal if there was an actual error
      setPaymentModal({
        isOpen: true,
        appointmentId: paymentModal.appointmentId,
        customerName: paymentModal.customerName,
        serviceType: paymentModal.serviceType
      });
    }
  };

  const openPaymentModal = (appointmentId: string, customerName: string, serviceType: string) => {
    console.log('openPaymentModal llamado con:', { appointmentId, customerName, serviceType }); // Debug log
    setPaymentModal({
      isOpen: true,
      appointmentId,
      customerName,
      serviceType
    });
    console.log('Modal state actualizado a isOpen: true'); // Debug log
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/employee/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('employee_token');
      localStorage.removeItem('employee_user');
      window.location.href = '/admin/login';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'default',
      cancelled: 'destructive',
    } as const;

    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (!token) {
    console.log('No token found, redirecting to login...');
    window.location.href = '/admin/login';
    return null;
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando citas...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Panel de Empleado</h1>
            <p className="text-purple-200">Bienvenido, {employee.username}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-200">Total Citas</p>
                <p className="text-2xl font-bold text-white">{stats?.totalAppointments || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-200">Completadas</p>
                <p className="text-2xl font-bold text-white">{stats?.completedAppointments || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-200">Total USD</p>
                <p className="text-2xl font-bold text-white">
                  ${Number(stats?.totalRevenue || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-200">Por Moneda</p>
                <div className="text-sm text-white space-y-1">
                  {stats?.revenueByCurrency && Object.keys(stats.revenueByCurrency).length > 0 ? (
                    Object.entries(stats.revenueByCurrency).map(([currency, amount]) => (
                      <div key={currency} className="flex justify-between">
                        <span className="text-purple-300">{currency}:</span>
                        <span className="font-medium">
                          {currency === 'USD' && '$'}
                          {currency === 'BRL' && 'R$'}
                          {currency === 'PYG' && '₲'}
                          {currency === 'PYG' 
                            ? Math.round(Number(amount)).toLocaleString('es-PY')
                            : Number(amount).toFixed(2)
                          }
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400">Sin ingresos</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <h3 className="text-lg font-semibold text-white">Mis Citas</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-purple-200">Cliente</TableHead>
                  <TableHead className="text-purple-200">Contacto</TableHead>
                  <TableHead className="text-purple-200">Servicio</TableHead>
                  <TableHead className="text-purple-200">Fecha</TableHead>
                  <TableHead className="text-purple-200">Hora</TableHead>
                  <TableHead className="text-purple-200">Estado</TableHead>
                  <TableHead className="text-purple-200">Asignado a</TableHead>
                  <TableHead className="text-purple-200">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments?.map((appointment) => (
                  <TableRow key={appointment.id} className="border-white/20">
                    <TableCell className="font-medium text-white">
                      {appointment.customerName}
                    </TableCell>
                    <TableCell className="text-purple-200">
                      <div className="text-sm">
                        <div>{appointment.customerPhone}</div>
                        {appointment.customerEmail && (
                          <div className="text-purple-300">{appointment.customerEmail}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{appointment.serviceType}</TableCell>
                    <TableCell className="text-white">
                      {format(new Date(appointment.appointmentDate), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-white">{appointment.appointmentTime}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(appointment.status)}
                        {appointment.status === 'completed' && appointment.amountPaid && (
                          <div className="text-xs text-green-400 font-medium">
                            Cobrado: {appointment.paymentCurrency === 'USD' && '$'}
                            {appointment.paymentCurrency === 'BRL' && 'R$'}
                            {appointment.paymentCurrency === 'PYG' && '₲'}
                            {appointment.paymentCurrency === 'PYG' 
                              ? Math.round(Number(appointment.amountPaid)).toLocaleString('es-PY')
                              : Number(appointment.amountPaid).toFixed(2)
                            } {appointment.paymentCurrency}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {appointment.attendedByEmployeeId === employee.id ? (
                        <Badge variant="default" className="bg-green-500 text-white">
                          Tú
                        </Badge>
                      ) : appointment.attendedByEmployeeId ? (
                        <Badge variant="outline" className="text-orange-400 border-orange-400">
                          Otro empleado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-gray-400">
                          Disponible
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {appointment.attendedByEmployeeId && appointment.attendedByEmployeeId !== employee.id ? (
                          // Cita ya asignada a otro empleado
                          <div className="text-center">
                            <Badge variant="outline" className="text-orange-400 border-orange-400">
                              Asignada a otro
                            </Badge>
                            <div className="text-xs text-gray-400 mt-1">
                              No disponible
                            </div>
                          </div>
                        ) : (
                          // Cita disponible o asignada al empleado actual
                          <div className="space-y-2">
                            <Select
                              value={appointment.status}
                              onValueChange={(status) => {
                                console.log('Status cambiado a:', status); // Debug log
                                if (status === 'completed') {
                                  console.log('Abriendo modal de pago para:', appointment.customerName); // Debug log
                                  openPaymentModal(appointment.id, appointment.customerName, appointment.serviceType);
                                } else {
                                  updateStatusMutation.mutate({ id: appointment.id, status });
                                }
                              }}
                              disabled={updateStatusMutation.isPending}
                            >
                              <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-700 border-slate-600">
                                <SelectItem value="pending" className="text-white hover:bg-slate-600">
                                  Pendiente
                                </SelectItem>
                                <SelectItem value="confirmed" className="text-white hover:bg-slate-600">
                                  {appointment.status === 'pending' ? 'Confirmar y Tomar' : 'Confirmada'}
                                </SelectItem>
                                <SelectItem value="completed" className="text-white hover:bg-slate-600">
                                  💰 Completar y Cobrar
                                </SelectItem>
                                <SelectItem value="cancelled" className="text-white hover:bg-slate-600">
                                  Cancelada
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {appointment.status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  console.log('Botón completar clickeado para:', appointment.customerName); // Debug log
                                  openPaymentModal(appointment.id, appointment.customerName, appointment.serviceType);
                                }}
                                className="w-32 bg-green-500 hover:bg-green-600 text-white text-xs"
                                disabled={updateStatusMutation.isPending}
                              >
                                💰 Completar
                              </Button>
                            )}
                          </div>
                        )}
                        {appointment.attendedByEmployeeId === employee.id && (
                          <div className="text-xs text-green-400 font-medium">
                            Asignada a ti
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal({ isOpen: false, appointmentId: '', customerName: '', serviceType: '' })}
          onConfirm={handlePaymentConfirm}
          customerName={paymentModal.customerName}
          serviceType={paymentModal.serviceType}
          isEmployeeView={true}
          currentEmployeeId={employee.id}
        />
      </div>
    </div>
  );
}