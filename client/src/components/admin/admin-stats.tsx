
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminApi } from '@/hooks/use-admin-api';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatsData {
  totalThisMonth: number;
  totalThisWeek: number;
  totalToday: number;
  monthlyRevenue: number;
  monthlyRevenueByCurrency: Record<string, number>;
  totalPrevMonth: number;
  prevMonthRevenue: number;
  prevMonthRevenueByCurrency: Record<string, number>;
  monthGrowth: number;
  revenueGrowth: number;
  statusStats: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  popularServices: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  weeklyTrend: Array<{
    date: string;
    day: string;
    appointments: number;
  }>;
  busyHours: Array<{
    hour: string;
    appointments: number;
  }>;
  completionRate: number;
  averageDaily: number;
}

export function AdminStats() {
  const api = useAdminApi();
  
  const { data: stats, isLoading, error } = useQuery<StatsData>({
    queryKey: ['/api/admin/stats'],
    queryFn: () => api.get('/api/admin/stats'),
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300">Error al cargar las estadísticas</p>
        </CardContent>
      </Card>
    );
  }

  const GrowthIndicator = ({ value, isRevenue = false }: { value: number; isRevenue?: boolean }) => {
    const isPositive = value > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
    
    return (
      <div className={`flex items-center space-x-1 ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{value.toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-300">Citas Este Mes</CardTitle>
              <Calendar className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalThisMonth}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-blue-200">vs mes anterior: {stats.totalPrevMonth}</p>
              <GrowthIndicator value={stats.monthGrowth} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-300">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.monthlyRevenue.toFixed(2)}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-green-200">vs mes anterior: ${stats.prevMonthRevenue.toFixed(2)}</p>
              <GrowthIndicator value={stats.revenueGrowth} isRevenue />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-300">Esta Semana</CardTitle>
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalThisWeek}</div>
            <p className="text-xs text-purple-200 mt-2">
              Promedio diario: {stats.averageDaily.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-300">Hoy</CardTitle>
              <Clock className="h-4 w-4 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalToday}</div>
            <p className="text-xs text-orange-200 mt-2">
              Tasa completado: {stats.completionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Currency */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <DollarSign className="h-5 w-5 mr-2 text-green-400" />
            Ingresos por Moneda
          </CardTitle>
          <CardDescription className="text-purple-200">
            Comparación este mes vs anterior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(stats.monthlyRevenueByCurrency).map(([currency, amount]) => {
            const prevAmount = stats.prevMonthRevenueByCurrency[currency] || 0;
            const growth = prevAmount > 0 ? ((amount - prevAmount) / prevAmount * 100) : 0;
            const symbol = currency === 'USD' ? '$' : currency === 'BRL' ? 'R$' : '₲';
            
            return (
              <div key={currency} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currency === 'USD' ? 'bg-green-500' :
                    currency === 'BRL' ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`}>
                    {symbol}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {symbol}{currency === 'PYG' ? amount.toLocaleString('es-PY') : amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Anterior: {symbol}{currency === 'PYG' ? prevAmount.toLocaleString('es-PY') : prevAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <GrowthIndicator value={growth} />
                  <div className="text-xs text-gray-400 mt-1">{currency}</div>
                </div>
              </div>
            );
          })}
          
          {Object.keys(stats.monthlyRevenueByCurrency).length === 0 && (
            <p className="text-purple-300 text-sm text-center py-4">
              No hay ingresos registrados este mes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution & Popular Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
              Estado de Citas
            </CardTitle>
            <CardDescription className="text-purple-200">
              Distribución por estado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-white">Pendientes</span>
              </div>
              <Badge variant="outline" className="text-yellow-300 border-yellow-400">
                {stats.statusStats.pending}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-white">Confirmadas</span>
              </div>
              <Badge variant="outline" className="text-blue-300 border-blue-400">
                {stats.statusStats.confirmed}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-white">Completadas</span>
              </div>
              <Badge variant="outline" className="text-green-300 border-green-400">
                {stats.statusStats.completed}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-white">Canceladas</span>
              </div>
              <Badge variant="outline" className="text-red-300 border-red-400">
                {stats.statusStats.cancelled}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Users className="h-5 w-5 mr-2 text-green-400" />
              Servicios Populares
            </CardTitle>
            <CardDescription className="text-purple-200">
              Más solicitados este mes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.popularServices.length > 0 ? (
              stats.popularServices.map((service, index) => (
                <div key={service.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-purple-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-sm text-white truncate">{service.name}</span>
                  </div>
                  <Badge variant="outline" className="text-purple-300 border-purple-400">
                    {service.count}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-purple-300 text-sm text-center py-4">
                No hay datos suficientes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend & Busy Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
              Tendencia Semanal
            </CardTitle>
            <CardDescription className="text-purple-200">
              Últimos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.weeklyTrend.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-white">{day.day}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.max((day.appointments / Math.max(...stats.weeklyTrend.map(d => d.appointments), 1)) * 100, 5)}%` }}
                      />
                    </div>
                    <span className="text-sm text-purple-300 w-8 text-right">{day.appointments}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Clock className="h-5 w-5 mr-2 text-orange-400" />
              Horas Más Ocupadas
            </CardTitle>
            <CardDescription className="text-purple-200">
              Este mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.busyHours.length > 0 ? (
                stats.busyHours.map((hour) => (
                  <div key={hour.hour} className="flex items-center justify-between">
                    <span className="text-sm text-white">{hour.hour}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${Math.max((hour.appointments / Math.max(...stats.busyHours.map(h => h.appointments), 1)) * 100, 5)}%` }}
                        />
                      </div>
                      <span className="text-sm text-purple-300 w-8 text-right">{hour.appointments}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-purple-300 text-sm text-center py-4">
                  No hay datos suficientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
