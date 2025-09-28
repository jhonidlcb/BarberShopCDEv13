import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAdminApi } from '@/hooks/use-admin-api';
import { Clock, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ServiceHours {
  id: string;
  dayOfWeek: number;
  dayName: string;
  dayNameEs?: string;
  dayNamePt: string;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  slotDurationMinutes: number;
  active: boolean;
  availableSlots?: string[]; // Array de horarios específicos como "09:00", "09:30", etc.
  maxSlotsPerTime?: number; // Nuevo campo para la cantidad máxima de citas por hora
}

export function AdminHours() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = useAdminApi();

  const { data: serviceHours, isLoading } = useQuery<ServiceHours[]>({
    queryKey: ['/api/admin/service-hours'],
    queryFn: () => api.get('/api/admin/service-hours'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/api/admin/service-hours/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/service-hours'] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-hours'] });
      toast({ title: 'Horarios de servicio actualizados correctamente' });
    },
    onError: () => {
      toast({ title: 'Error al actualizar horarios de servicio', variant: 'destructive' });
    },
  });

  const handleHoursChange = (dayId: string, field: string, value: any) => {
    const day = serviceHours?.find(d => d.id === dayId);
    if (!day) return;

    const updatedData = { ...day, [field]: value };
    updateMutation.mutate({ id: dayId, data: updatedData });
  };

  const generateTimeSlots = (startTime: string, endTime: string, slotDuration: number, breakStart?: string, breakEnd?: string): string[] => {
    if (!startTime || !endTime) return [];

    const slots: string[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    let breakStartInMinutes = 0;
    let breakEndInMinutes = 0;

    if (breakStart && breakEnd) {
      const [breakStartHour, breakStartMinute] = breakStart.split(':').map(Number);
      const [breakEndHour, breakEndMinute] = breakEnd.split(':').map(Number);
      breakStartInMinutes = breakStartHour * 60 + breakStartMinute;
      breakEndInMinutes = breakEndHour * 60 + breakEndMinute;
    }

    for (let time = startTimeInMinutes; time < endTimeInMinutes; time += slotDuration) {
      // Skip break time if configured
      if (breakStart && breakEnd && time >= breakStartInMinutes && time < breakEndInMinutes) {
        continue;
      }

      const hour = Math.floor(time / 60);
      const minute = time % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }

    return slots;
  };

  const handleGenerateSlots = (dayId: string) => {
    const day = serviceHours?.find(d => d.id === dayId);
    if (!day || !day.startTime || !day.endTime) return;

    const generatedSlots = generateTimeSlots(
      day.startTime,
      day.endTime,
      day.slotDurationMinutes || 30,
      day.breakStartTime,
      day.breakEndTime
    );

    handleHoursChange(dayId, 'availableSlots', generatedSlots);
  };

  const handleAddCustomSlot = (dayId: string, timeSlot: string) => {
    const day = serviceHours?.find(d => d.id === dayId);
    if (!day) return;

    const currentSlots = day.availableSlots || [];
    if (!currentSlots.includes(timeSlot)) {
      const newSlots = [...currentSlots, timeSlot].sort();
      handleHoursChange(dayId, 'availableSlots', newSlots);
    }
  };

  const handleRemoveSlot = (dayId: string, timeSlot: string) => {
    const day = serviceHours?.find(d => d.id === dayId);
    if (!day) return;

    const currentSlots = day.availableSlots || [];
    const newSlots = currentSlots.filter(slot => slot !== timeSlot);
    handleHoursChange(dayId, 'availableSlots', newSlots);
  };

  const getDayName = (day: ServiceHours) => {
    return day.dayNameEs || day.dayName;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-white">Cargando horarios de servicio...</div>;
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-500/10 border-blue-500/20 backdrop-blur-sm">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          Configura los horarios específicos disponibles para reservas. Estos son los horarios que verán los clientes cuando seleccionen un día para su cita. Puedes configurar cuántas citas se pueden reservar por cada hora disponible.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {serviceHours?.map((day) => (
          <Card key={day.id} className="bg-white/5 border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-400" />
                  {getDayName(day)}
                </div>
                <Switch
                  checked={day.isAvailable}
                  onCheckedChange={(checked) => handleHoursChange(day.id, 'isAvailable', checked)}
                />
              </CardTitle>
              <CardDescription className="text-slate-300">
                {day.isAvailable ? 'Disponible para citas' : 'No disponible para citas'}
              </CardDescription>
            </CardHeader>

            {day.isAvailable && (
              <CardContent className="space-y-6">
                {/* Configuración básica de horarios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`start-${day.id}`} className="text-slate-300">Hora de Inicio</Label>
                    <Input
                      id={`start-${day.id}`}
                      type="time"
                      value={day.startTime || ''}
                      onChange={(e) => handleHoursChange(day.id, 'startTime', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`end-${day.id}`} className="text-slate-300">Hora de Fin</Label>
                    <Input
                      id={`end-${day.id}`}
                      type="time"
                      value={day.endTime || ''}
                      onChange={(e) => handleHoursChange(day.id, 'endTime', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`break-start-${day.id}`} className="text-slate-300">Inicio de Descanso</Label>
                    <Input
                      id={`break-start-${day.id}`}
                      type="time"
                      value={day.breakStartTime || ''}
                      onChange={(e) => handleHoursChange(day.id, 'breakStartTime', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`break-end-${day.id}`} className="text-slate-300">Fin de Descanso</Label>
                    <Input
                      id={`break-end-${day.id}`}
                      type="time"
                      value={day.breakEndTime || ''}
                      onChange={(e) => handleHoursChange(day.id, 'breakEndTime', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Label htmlFor={`duration-${day.id}`} className="text-slate-300">Duración de cada cita (minutos)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id={`duration-${day.id}`}
                      type="number"
                      min="15"
                      max="120"
                      step="15"
                      value={day.slotDurationMinutes || 30}
                      onChange={(e) => handleHoursChange(day.id, 'slotDurationMinutes', parseInt(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white w-32"
                    />
                    <span className="text-slate-400 text-sm">minutos</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateSlots(day.id)}
                      className="ml-4 bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Generar Horarios
                    </Button>
                  </div>
                </div>

                {/* Nuevo campo para "Máximo Citas por Hora" */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`start-${day.id}`} className="text-slate-300">Hora de Inicio</Label>
                    <Input
                      id={`start-${day.id}`}
                      type="time"
                      value={day.startTime || ''}
                      onChange={(e) => handleHoursChange(day.id, 'startTime', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`end-${day.id}`} className="text-slate-300">Hora de Fin</Label>
                    <Input
                      id={`end-${day.id}`}
                      type="time"
                      value={day.endTime || ''}
                      onChange={(e) => handleHoursChange(day.id, 'endTime', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`max-slots-${day.id}`} className="text-slate-300">Máximo Citas por Hora</Label>
                    <Input
                      id={`max-slots-${day.id}`}
                      type="number"
                      min="1"
                      max="10"
                      value={day.maxSlotsPerTime || 1}
                      onChange={(e) => handleHoursChange(day.id, 'maxSlotsPerTime', parseInt(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="1"
                    />
                    <p className="text-xs text-purple-300 mt-1">
                      Número de empleados que pueden atender al mismo tiempo
                    </p>
                  </div>
                </div>

                {/* Horarios específicos disponibles */}
                <div className="border-t border-slate-600 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-slate-300 text-lg font-semibold">Horarios Disponibles para Reservas</Label>
                    <span className="text-slate-400 text-sm">
                      {day.availableSlots?.length || 0} horarios configurados
                    </span>
                  </div>

                  {/* Agregar horario manual */}
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      type="time"
                      id={`custom-time-${day.id}`}
                      className="bg-slate-700 border-slate-600 text-white w-32"
                      placeholder="HH:MM"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById(`custom-time-${day.id}`) as HTMLInputElement;
                        if (input.value) {
                          handleAddCustomSlot(day.id, input.value);
                          input.value = '';
                        }
                      }}
                      className="bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Horario
                    </Button>
                  </div>

                  {/* Lista de horarios disponibles */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                    {day.availableSlots?.map((slot) => (
                      <div
                        key={slot}
                        className="flex items-center justify-between bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2"
                      >
                        <span className="text-white text-sm font-medium">{slot}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSlot(day.id, slot)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {(!day.availableSlots || day.availableSlots.length === 0) && (
                    <div className="text-center py-8 text-slate-400">
                      <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay horarios configurados</p>
                      <p className="text-sm">Usa "Generar Horarios" o agrega horarios manualmente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}