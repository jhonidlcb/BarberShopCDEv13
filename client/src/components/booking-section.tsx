import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Calendar, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { PhoneInput } from '@/components/ui/phone-input';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
}

export function BookingSection() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>('');

  const { data: services } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
  });

  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    serviceType: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  // Get service hours from API (for appointment booking)
  const { data: serviceHours } = useQuery({
    queryKey: ['/api/service-hours'],
    queryFn: async () => {
      const response = await fetch('/api/service-hours');
      if (!response.ok) throw new Error('Failed to fetch service hours');
      return response.json();
    },
  });

  // Generate available time slots based on service hours
  const generateTimeSlots = (): TimeSlot[] => {
    if (!selectedDate || !serviceHours) return [];

    // Fix timezone issue: Use Paraguay timezone (America/Asuncion) to get correct dayOfWeek
    // Parse selectedDate safely and use UTC midday to avoid timezone edge cases
    const [year, month, day] = selectedDate.split('-').map(Number);
    const utcMidday = new Date(Date.UTC(year, month - 1, day, 12));
    const weekdayFormatter = new Intl.DateTimeFormat('en-US', { 
      timeZone: 'America/Asuncion', 
      weekday: 'short' 
    });
    const weekdayName = weekdayFormatter.format(utcMidday);
    // Map weekday names to numbers: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
    const weekdayMap: { [key: string]: number } = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    const dayOfWeek = weekdayMap[weekdayName];

    const dayHours = serviceHours.find((sh: any) => sh.dayOfWeek === dayOfWeek);
    if (!dayHours || !dayHours.isAvailable) return [];

    // If availableSlots are configured, use them
    if (dayHours.availableSlots && Array.isArray(dayHours.availableSlots) && dayHours.availableSlots.length > 0) {
      return dayHours.availableSlots.map((time: string) => ({
        time,
        available: true
      }));
    }

    // Otherwise, generate automatically (fallback)
    const slots: TimeSlot[] = [];
    const startTime = dayHours.startTime;
    const endTime = dayHours.endTime;
    const slotDuration = dayHours.slotDurationMinutes || 30;

    if (!startTime || !endTime) return [];

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    for (let time = startTimeInMinutes; time < endTimeInMinutes; time += slotDuration) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      // Skip break time if configured
      if (dayHours.breakStartTime && dayHours.breakEndTime) {
        const [breakStartHour, breakStartMinute] = dayHours.breakStartTime.split(':').map(Number);
        const [breakEndHour, breakEndMinute] = dayHours.breakEndTime.split(':').map(Number);
        const breakStartInMinutes = breakStartHour * 60 + breakStartMinute;
        const breakEndInMinutes = breakEndHour * 60 + breakEndMinute;

        if (time >= breakStartInMinutes && time < breakEndInMinutes) {
          continue;
        }
      }

      slots.push({ time: timeString, available: true });
    }

    return slots;
  };

  // Fetch existing appointments for selected date
  const { data: appointmentData, isLoading: appointmentsLoading } = useQuery<any>({
    queryKey: ['/api/appointments/date', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/appointments/date/${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    },
    enabled: !!selectedDate
  });

  const existingAppointments = appointmentData?.appointments || [];
  const maxSlotsPerTime = appointmentData?.maxSlotsPerTime || 1;
  const appointmentsByTime = appointmentData?.appointmentsByTime || {};

  const timeSlots = generateTimeSlots().map(slot => {
    // Check how many slots are already booked for this time
    const bookedSlots = appointmentsByTime[slot.time] || 0;
    const availableSlots = maxSlotsPerTime - bookedSlots;
    
    return {
      ...slot,
      available: availableSlots > 0,
      availableSlots,
      totalSlots: maxSlotsPerTime
    };
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create appointment');
      return response.json();
    },
    onSuccess: async (appointmentData) => {
      toast({
        title: t('booking.bookingSuccess'),
        description: t('booking.bookingConfirmation'),
      });

      // Get WhatsApp number from site config
      try {
        const configResponse = await fetch('/api/site-config');
        const siteConfig = await configResponse.json();
        const whatsappNumber = siteConfig?.whatsapp_number || '+595971234567';

        // Create WhatsApp message
        const serviceName = services?.find((s: any) => s.id === formData.serviceType)?.name || formData.serviceType;
        const appointmentDate = new Date(formData.appointmentDate).toLocaleDateString('es-ES');
        const message = encodeURIComponent(
          `¡Hola! Acabo de realizar una reserva:\n\n` +
          `👤 Nombre: ${formData.customerName}\n` +
          `📞 Teléfono: ${formData.customerPhone}\n` +
          `✂️ Servicio: ${serviceName}\n` +
          `📅 Fecha: ${appointmentDate}\n` +
          `🕐 Hora: ${formData.appointmentTime}\n` +
          `${formData.notes ? `📝 Notas: ${formData.notes}\n` : ''}` +
          `\n¡Gracias!`
        );

        // Open WhatsApp
        window.open(`https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${message}`, '_blank');
      } catch (error) {
        console.error('Error getting site config for WhatsApp:', error);
      }

      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        serviceType: '',
        appointmentDate: '',
        appointmentTime: '',
        notes: ''
      });
      setSelectedDate('');
      setSelectedTime('');
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/date'] });
    },
    onError: (error) => {
      toast({
        title: t('booking.bookingError'),
        description: "Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    }
  });

  // Generate next 30 days for date picker
  const generateAvailableDates = () => {
    const dates = [];
    // Get current date in Paraguay timezone
    const today = new Date();
    const paraguayOffset = -3; // Paraguay is UTC-3
    const paraguayToday = new Date(today.getTime() + (paraguayOffset * 60 * 60 * 1000));

    for (let i = 0; i < 30; i++) {
      const futureDate = new Date(paraguayToday);
      futureDate.setDate(paraguayToday.getDate() + i);

      // Format date as YYYY-MM-DD
      const year = futureDate.getFullYear();
      const month = String(futureDate.getMonth() + 1).padStart(2, '0');
      const day = String(futureDate.getDate()).padStart(2, '0');
      const paraguayDateValue = `${year}-${month}-${day}`;

      // Skip Sundays (day 0)
      if (futureDate.getDay() !== 0) {
        const displayFormatter = new Intl.DateTimeFormat('es-ES', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short'
        });

        dates.push({
          date: paraguayDateValue,
          display: displayFormatter.format(futureDate),
          isToday: i === 0,
          isTomorrow: i === 1
        });
      }
    }
    return dates;
  };

  const availableDates = generateAvailableDates();

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setFormData(prev => ({ ...prev, appointmentDate: date, appointmentTime: '' }));
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setFormData(prev => ({ ...prev, appointmentTime: time }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime || !formData.customerName || !formData.customerPhone || !formData.serviceType) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    createAppointmentMutation.mutate(formData);
  };

  return (
    <section id="reservar" className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="text-booking-title">
            {t('booking.title')}
          </h2>
          <p className="text-muted-foreground text-lg" data-testid="text-booking-subtitle">
            {t('booking.subtitle')}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Date Selection */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2" data-testid="text-select-date">
                <Calendar className="text-primary" size={20} />
                {t('booking.selectDate')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableDates.slice(0, 12).map((dateOption) => (
                  <button
                    key={dateOption.date}
                    type="button"
                    onClick={() => handleDateSelect(dateOption.date)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      selectedDate === dateOption.date
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary hover:bg-primary/10'
                    }`}
                    data-testid={`button-date-${dateOption.date}`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">
                        {dateOption.isToday ? t('booking.today') : 
                         dateOption.isTomorrow ? t('booking.tomorrow') : 
                         dateOption.display.split(' ')[0]}
                      </div>
                      <div className="text-xs opacity-75">
                        {dateOption.display.split(' ').slice(1).join(' ')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2" data-testid="text-select-time">
                <Clock className="text-primary" size={20} />
                {t('booking.selectTime')}
              </h3>

              {!selectedDate ? (
                <p className="text-muted-foreground italic" data-testid="text-select-date-first">
                  {t('booking.selectDateFirst')}
                </p>
              ) : appointmentsLoading ? (
                <p className="text-muted-foreground" data-testid="text-loading">
                  {t('booking.loading')}
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        selectedTime === slot.time
                          ? 'bg-primary text-primary-foreground border-primary'
                          : slot.available
                          ? 'border-border hover:border-primary hover:bg-primary/10'
                          : 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                      data-testid={`button-time-${slot.time}`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2" data-testid="text-customer-info">
                <User className="text-primary" size={20} />
                {t('booking.customerInfo')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2" data-testid="label-customer-name">
                    {t('contact.name')} *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder={t('contact.namePlaceholder')}
                    required
                    data-testid="input-customer-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2" data-testid="label-customer-phone">
                    {t('contact.phone')} *
                  </label>
                  <PhoneInput
                    value={formData.customerPhone}
                    onChange={(value) => setFormData(prev => ({ ...prev, customerPhone: value }))}
                    placeholder={t('contact.phonePlaceholder')}
                    className="w-full"
                    required
                    data-testid="input-customer-phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2" data-testid="label-customer-email">
                    {t('booking.email')}
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder={t('booking.emailPlaceholder')}
                    data-testid="input-customer-email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2" data-testid="label-service-type">
                    {t('contact.service')} *
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    required
                    data-testid="select-service-type"
                  >
                    <option value="">{t('contact.selectService')}</option>
                    {services?.map((service: any) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2" data-testid="label-notes">
                  {t('booking.notes')}
                </label>
                <textarea
                  rows={3}
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder={t('booking.notesPlaceholder')}
                  data-testid="textarea-notes"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={createAppointmentMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                data-testid="button-confirm-booking"
              >
                {createAppointmentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent"></div>
                    {t('booking.loading')}
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    {t('booking.confirmBooking')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}