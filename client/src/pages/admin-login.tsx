import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Shield, Eye, EyeOff, Users } from 'lucide-react';

export default function AdminLogin() {
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [employeeUsername, setEmployeeUsername] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('admin');
  const { loginWithCredentials } = useAuth();
  const [, setLocation] = useLocation();

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await loginWithCredentials(adminUsername, adminPassword);
      if (success) {
        setLocation('/admin');
      } else {
        setError('Credenciales de administrador inválidas');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/employee/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: employeeUsername, password: employeePassword })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('employee_token', data.token);
        localStorage.setItem('employee_user', JSON.stringify(data.employee));
        setLocation('/employee/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Credenciales de empleado inválidas');
      }
    } catch (error) {
      console.error('Employee login error:', error);
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {loginType === 'admin' ? (
                <Shield className="h-12 w-12 text-purple-400" />
              ) : (
                <Users className="h-12 w-12 text-blue-400" />
              )}
              <div className={`absolute -inset-1 ${loginType === 'admin' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'} rounded-full blur opacity-25`}></div>
            </div>
          </div>
          <CardTitle className={`text-2xl font-bold ${loginType === 'admin' ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-gradient-to-r from-blue-400 to-cyan-400'} bg-clip-text text-transparent`}>
            {loginType === 'admin' ? 'Panel de Administración' : 'Portal de Empleado'}
          </CardTitle>
          <CardDescription className="text-purple-200">
            Ingrese sus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={loginType} onValueChange={setLoginType} className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20">
              <TabsTrigger value="admin" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-200 text-white">
                Administrador
              </TabsTrigger>
              <TabsTrigger value="employee" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200 text-white">
                Empleado
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <form onSubmit={loginType === 'admin' ? handleAdminSubmit : handleEmployeeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                {loginType === 'admin' ? 'Usuario Admin' : 'Usuario Empleado'}
              </Label>
              <Input
                id="username"
                type="text"
                value={loginType === 'admin' ? adminUsername : employeeUsername}
                onChange={(e) => loginType === 'admin' ? setAdminUsername(e.target.value) : setEmployeeUsername(e.target.value)}
                required
                disabled={loading}
                placeholder={loginType === 'admin' ? 'Usuario de administrador' : 'Usuario de empleado'}
                className={`bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:border-current focus:ring-current ${loginType === 'admin' ? 'focus:border-purple-400 focus:ring-purple-400 placeholder:text-purple-300' : 'focus:border-blue-400 focus:ring-blue-400 placeholder:text-blue-300'}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={loginType === 'admin' ? (showAdminPassword ? 'text' : 'password') : (showEmployeePassword ? 'text' : 'password')}
                  value={loginType === 'admin' ? adminPassword : employeePassword}
                  onChange={(e) => loginType === 'admin' ? setAdminPassword(e.target.value) : setEmployeePassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder={loginType === 'admin' ? 'Contraseña de administrador' : 'Contraseña de empleado'}
                  className={`bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:border-current focus:ring-current pr-12 ${loginType === 'admin' ? 'focus:border-purple-400 focus:ring-purple-400 placeholder:text-purple-300' : 'focus:border-blue-400 focus:ring-blue-400 placeholder:text-blue-300'}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10 ${loginType === 'admin' ? 'text-purple-300 hover:text-white' : 'text-blue-300 hover:text-white'}`}
                  onClick={() => loginType === 'admin' ? setShowAdminPassword(!showAdminPassword) : setShowEmployeePassword(!showEmployeePassword)}
                  disabled={loading}
                >
                  {loginType === 'admin' ? (showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />) : (showEmployeePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />)}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className={`w-full ${loginType === 'admin' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'} text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Accediendo...</span>
                </div>
              ) : (
                loginType === 'admin' ? 'Acceder como Admin' : 'Acceder como Empleado'
              )}
            </Button>
          </form>

          {error && (
            <Alert className="bg-red-500/10 border-red-500/20 backdrop-blur-sm mt-4">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}