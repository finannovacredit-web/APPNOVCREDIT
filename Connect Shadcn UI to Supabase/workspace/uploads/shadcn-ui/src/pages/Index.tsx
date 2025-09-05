import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator as CalculatorIcon, Users, DollarSign, RefreshCw, LogOut, History, TrendingUp, Settings, Shield, Database } from 'lucide-react';
import { getCurrentUser, authenticateUser, logout, initializeStorage, getStorageStatus } from '@/lib/hybrid-storage';
import { User } from '@/types';
import ClientPanel from './ClientPanel';
import CalculatorPanel from './Calculator';
import NewLoan from './NewLoan';
import Refinancing from './Refinancing';
import HistoryPanel from './HistoryPanel';
import DailySummary from './DailySummary';
import Administration from './Administration';
import Configuration from './Configuration';

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [storageStatus, setStorageStatus] = useState<{ useSupabase: boolean; storageType: string }>({ useSupabase: false, storageType: 'localStorage' });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize storage system (try Supabase first, fallback to localStorage)
        await initializeStorage();
        
        // Get storage status
        const status = getStorageStatus();
        setStorageStatus(status);
        
        // Check for existing user session
        const user = getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await authenticateUser(username, password);
      if (user) {
        setCurrentUser(user);
        setLoginError('');
        setUsername('');
        setPassword('');
        // Store user in localStorage for session management
        localStorage.setItem('novacredit_current_user', JSON.stringify(user));
      } else {
        setLoginError('Credenciales inválidas');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Error al iniciar sesión');
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Inicializando aplicación...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600">NOVACREDIT</CardTitle>
            <CardDescription>Sistema de Gestión Financiera</CardDescription>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2">
              <Database className="h-3 w-3" />
              <span>Almacenamiento: {storageStatus.storageType}</span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}
              <Button type="submit" className="w-full">
                Iniciar Sesión
              </Button>
            </form>
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Credenciales de prueba:</strong></p>
              <p>Admin: admin / admin123</p>
              <p>Cobrador: cobrador1 / cobrador123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine available tabs based on user role
  const getAvailableTabs = () => {
    const baseTabs = [
      { value: "summary", label: "Resumen", icon: TrendingUp },
      { value: "clients", label: "Clientes", icon: Users },
      { value: "calculator", label: "Calculadora", icon: CalculatorIcon },
      { value: "loans", label: "Nuevo Préstamo", icon: DollarSign },
      { value: "refinancing", label: "Refinanciamiento", icon: RefreshCw },
      { value: "history", label: "Historial", icon: History }
    ];

    if (currentUser.role === 'admin') {
      baseTabs.push(
        { value: "administration", label: "Administración", icon: Shield },
        { value: "configuration", label: "Configuración", icon: Settings }
      );
    }

    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-600">NOVACREDIT</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Database className="h-3 w-3" />
                <span>{storageStatus.storageType}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bienvenido, {currentUser.name} ({currentUser.role === 'admin' ? 'Administrador' : 'Cobrador'})
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className={`grid w-full ${availableTabs.length <= 6 ? 'grid-cols-6' : 'grid-cols-8'}`}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="summary">
            <DailySummary currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="clients">
            <ClientPanel currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="calculator">
            <CalculatorPanel />
          </TabsContent>

          <TabsContent value="loans">
            <NewLoan currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="refinancing">
            <Refinancing currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="history">
            <HistoryPanel currentUser={currentUser} />
          </TabsContent>

          {currentUser.role === 'admin' && (
            <>
              <TabsContent value="administration">
                <Administration currentUser={currentUser} />
              </TabsContent>

              <TabsContent value="configuration">
                <Configuration currentUser={currentUser} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}