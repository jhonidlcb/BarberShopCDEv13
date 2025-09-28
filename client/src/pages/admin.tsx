import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AdminAppointments } from '@/components/admin/admin-appointments';
import { AdminServices } from '@/components/admin/admin-services';
import { AdminGallery } from '@/components/admin/admin-gallery';
import { AdminStaff } from '@/components/admin/admin-staff';
import { AdminHours } from '@/components/admin/admin-hours';
import { AdminConfig } from '@/components/admin/admin-config';
import { AdminCompany } from '@/components/admin/admin-company';
import { AdminStats } from '@/components/admin/admin-stats';
import { AdminCurrencies } from '@/components/admin/admin-currencies';
import { AdminEmployees } from '@/components/admin/admin-employees';
import { useAuth } from '@/hooks/use-auth';
import { 
  Calendar, 
  Settings, 
  Image, 
  Briefcase, 
  Building, 
  Users,
  LogOut,
  Shield,
  Globe,
  DollarSign,
  Activity,
  Clock,
  Menu,
  X,
  BarChart3,
  Scissors,
  ImageIcon
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Admin() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
          setLocation('/admin/login');
          return;
        }

        const response = await fetch('/api/admin/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          logout();
          setLocation('/admin/login');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
        setLocation('/admin/login');
      }
    };

    checkAuth();
  }, [logout, setLocation]);

  const handleLogout = () => {
    logout();
    setLocation('/admin/login');
  };

  const tabs = [
    { value: 'stats', label: 'Estadísticas', icon: Activity, color: 'text-pink-400' },
    { value: 'appointments', label: 'Citas', icon: Calendar, color: 'text-blue-400' },
    { value: 'services', label: 'Servicios', icon: Briefcase, color: 'text-green-400' },
    { value: 'gallery', label: 'Galería', icon: Image, color: 'text-purple-400' },
    { value: 'staff', label: 'Equipo', icon: Users, color: 'text-orange-400' },
    { value: 'employees', label: 'Empleados', icon: Shield, color: 'text-red-400' },
    { value: 'hours', label: 'Horarios', icon: Clock, color: 'text-yellow-400' },
    { value: 'company', label: 'Empresa', icon: Building, color: 'text-cyan-400' },
    { value: 'currencies', label: 'Monedas', icon: DollarSign, color: 'text-green-400' },
    { value: 'config', label: 'Config', icon: Settings, color: 'text-indigo-400' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Shield className="h-16 w-16 mx-auto mb-4 text-purple-400 animate-pulse" />
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-25 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verificando autenticación...</h2>
          <p className="text-purple-300">Accediendo al panel de administración</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400" />
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-25"></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Panel Admin
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-xs sm:text-sm text-purple-300">
                    {user.username}
                  </p>
                  <Badge variant="outline" className="text-purple-300 border-purple-400 text-xs">
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats Cards - Desktop only */}
            <div className="hidden xl:flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-white">Activo</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-white">
                  {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="lg:hidden bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-slate-900/95 backdrop-blur-md border-purple-500/20">
                  <SheetHeader>
                    <SheetTitle className="text-white">Navegación</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-2 py-6">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <Button
                          key={tab.value}
                          variant={activeTab === tab.value ? "default" : "ghost"}
                          className={`justify-start h-12 ${
                            activeTab === tab.value 
                              ? 'bg-purple-600 text-white' 
                              : 'text-purple-200 hover:text-white hover:bg-purple-500/20'
                          }`}
                          onClick={() => {
                            setActiveTab(tab.value);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Icon className={`h-5 w-5 mr-3 ${tab.color}`} />
                          {tab.label}
                        </Button>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>

              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/20 backdrop-blur-sm">
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Tabs */}
          <TabsList className="hidden lg:grid lg:grid-cols-10 bg-white/10 backdrop-blur-md border border-white/20 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-purple-200 hover:text-white transition-all"
                >
                  <Icon className="h-4 w-4 mr-1" />
                  <span className="hidden xl:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Mobile Tabs */}
          <div className="lg:hidden">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1">
              <div className="grid grid-cols-4 gap-1">
                {tabs.slice(0, 8).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.value}
                      variant={activeTab === tab.value ? "default" : "ghost"}
                      size="sm"
                      className={`flex flex-col items-center justify-center h-16 p-2 ${
                        activeTab === tab.value 
                          ? 'bg-purple-500 text-white' 
                          : 'text-purple-200 hover:text-white hover:bg-purple-500/20'
                      }`}
                      onClick={() => setActiveTab(tab.value)}
                    >
                      <Icon className={`h-4 w-4 mb-1 ${tab.color}`} />
                      <span className="text-xs leading-none">{tab.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tab Contents */}
          <TabsContent value="stats">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="border-b border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center text-white">
                      <div className="relative mr-3">
                        <Activity className="h-6 w-6 text-pink-400" />
                        <div className="absolute -inset-1 bg-pink-500/20 rounded-full blur"></div>
                      </div>
                      Estadísticas y Métricas
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Panel de control con métricas del negocio y tendencias
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center space-x-2 bg-pink-500/20 px-3 py-2 rounded-lg">
                      <Activity className="h-4 w-4 text-pink-400" />
                      <span className="text-sm text-pink-300">Tiempo Real</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <AdminStats />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="border-b border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center text-white">
                      <div className="relative mr-3">
                        <Calendar className="h-6 w-6 text-blue-400" />
                        <div className="absolute -inset-1 bg-blue-500/20 rounded-full blur"></div>
                      </div>
                      Gestión de Citas
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Administra las citas programadas y su estado
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center space-x-2 bg-purple-500/20 px-3 py-2 rounded-lg">
                      <Globe className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-blue-300">Multiidioma</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-2 rounded-lg">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-green-300">Multimoneda</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <AdminAppointments />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="border-b border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center text-white">
                      <div className="relative mr-3">
                        <Briefcase className="h-6 w-6 text-green-400" />
                        <div className="absolute -inset-1 bg-green-500/20 rounded-full blur"></div>
                      </div>
                      Gestión de Servicios
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Administra los servicios con soporte multiidioma y multimoneda
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-blue-300 border-blue-400">
                      <Globe className="h-3 w-3 mr-1" />
                      ES/PT
                    </Badge>
                    <Badge variant="outline" className="text-green-300 border-green-400">
                      <DollarSign className="h-3 w-3 mr-1" />
                      USD/BRL/PYG
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <AdminServices />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center text-white">
                  <div className="relative mr-3">
                    <Image className="h-6 w-6 text-purple-400" />
                    <div className="absolute -inset-1 bg-purple-500/20 rounded-full blur"></div>
                  </div>
                  Gestión de Galería
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Administra las imágenes de la galería con descripciones multiidioma
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <AdminGallery />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center text-white">
                  <div className="relative mr-3">
                    <Users className="h-6 w-6 text-orange-400" />
                    <div className="absolute -inset-1 bg-orange-500/20 rounded-full blur"></div>
                  </div>
                  Gestión del Equipo
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Administra los miembros del equipo de trabajo con información multiidioma
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <AdminStaff />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center text-white">
                  <div className="relative mr-3">
                    <Shield className="h-6 w-6 text-red-400" />
                    <div className="absolute -inset-1 bg-red-500/20 rounded-full blur"></div>
                  </div>
                  Gestión de Empleados
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Administra empleados con acceso al sistema, estadísticas y seguimiento de citas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <AdminEmployees />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center text-white">
                  <div className="relative mr-3">
                    <Clock className="h-6 w-6 text-yellow-400" />
                    <div className="absolute -inset-1 bg-yellow-500/20 rounded-full blur"></div>
                  </div>
                  Gestión de Horarios Laborales
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Configura los días y horarios de atención, descansos y duración de citas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <AdminHours />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center text-white">
                  <div className="relative mr-3">
                    <Building className="h-6 w-6 text-cyan-400" />
                    <div className="absolute -inset-1 bg-cyan-500/20 rounded-full blur"></div>
                  </div>
                  Información de la Empresa
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Administra la información de la empresa en múltiples idiomas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <AdminCompany />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="currencies">
            <AdminCurrencies />
          </TabsContent>

          <TabsContent value="config">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center text-white">
                  <div className="relative mr-3">
                    <Settings className="h-6 w-6 text-indigo-400" />
                    <div className="absolute -inset-1 bg-indigo-500/20 rounded-full blur"></div>
                  </div>
                  Configuración del Sistema
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Configura los parámetros generales del sitio
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <AdminConfig />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}