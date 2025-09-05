import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Palette, 
  Globe, 
  Info, 
  Upload, 
  Download,
  Moon,
  Sun,
  CheckCircle,
  AlertTriangle,
  Camera
} from 'lucide-react';
import { 
  getSystemConfig, 
  saveSystemConfig, 
  getLoans,
  createBackup,
  importSystemData,
  generateId
} from '@/lib/storage';
import { SystemConfig, User } from '@/types';

interface ConfigurationProps {
  currentUser: User;
}

export default function Configuration({ currentUser }: ConfigurationProps) {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [tempConfig, setTempConfig] = useState<SystemConfig | null>(null);
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    loadConfig();
    
    // Auto backup every 5 minutes
    const interval = setInterval(() => {
      createAutoBackup();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const loadConfig = () => {
    const systemConfig = getSystemConfig();
    setConfig(systemConfig);
    setTempConfig({ ...systemConfig });
    setLogoPreview(systemConfig.logo || '');
  };

  const createAutoBackup = async () => {
    try {
      const backup = createBackup();
      console.log('Auto backup created:', backup.timestamp);
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  };

  const handleSaveConfig = () => {
    if (!tempConfig) return;
    
    setErrors([]);
    setSuccess('');
    
    const validationErrors: string[] = [];
    
    if (!tempConfig.appName.trim()) {
      validationErrors.push('El nombre de la aplicación es requerido');
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    const updatedConfig: SystemConfig = {
      ...tempConfig,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    };
    
    saveSystemConfig(updatedConfig);
    setConfig(updatedConfig);
    setSuccess('Configuración guardada exitosamente');
    
    // Apply theme change immediately
    document.documentElement.classList.toggle('dark', updatedConfig.theme === 'dark');
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target?.result as string;
        setLogoPreview(logoData);
        if (tempConfig) {
          setTempConfig({ ...tempConfig, logo: logoData });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportConfig = () => {
    if (!config) return;
    
    try {
      const configData = JSON.stringify(config, null, 2);
      const blob = new Blob([configData], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `novacredit_config_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      setSuccess('Configuración exportada exitosamente');
    } catch (error) {
      setErrors(['Error al exportar la configuración']);
    }
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const configData = JSON.parse(e.target?.result as string);
          if (configData.appName && configData.version) {
            const importedConfig: SystemConfig = {
              ...configData,
              id: config?.id || generateId(),
              updatedAt: new Date().toISOString(),
              updatedBy: currentUser.id
            };
            saveSystemConfig(importedConfig);
            loadConfig();
            setSuccess('Configuración importada exitosamente');
          } else {
            setErrors(['Archivo de configuración inválido']);
          }
        } catch (error) {
          setErrors(['Error al leer el archivo de configuración']);
        }
      };
      reader.readAsText(file);
    }
  };

  const getSystemStats = () => {
    const loans = getLoans();
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const inactiveLoans = loans.filter(l => l.status !== 'active').length;
    
    return {
      activeLoans,
      inactiveLoans,
      totalLoans: loans.length
    };
  };

  const stats = getSystemStats();

  if (!config || !tempConfig) {
    return <div>Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Panel de Configuración</h2>
        <p className="text-gray-600">Personaliza la aplicación y gestiona la configuración del sistema</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      
      {errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="actions">Acciones</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configuración General</span>
              </CardTitle>
              <CardDescription>
                Configuración básica de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">Nombre de la Aplicación</Label>
                <Input
                  id="appName"
                  value={tempConfig.appName}
                  onChange={(e) => setTempConfig({ ...tempConfig, appName: e.target.value })}
                  placeholder="Nombre de la aplicación"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo de la Aplicación</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo')?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Subir Logo
                  </Button>
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-16 h-16 object-contain border rounded"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select 
                  value={tempConfig.language} 
                  onValueChange={(value: 'es' | 'en') => setTempConfig({ ...tempConfig, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveConfig} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Apariencia</span>
              </CardTitle>
              <CardDescription>
                Personaliza el tema y la apariencia de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Tema</Label>
                  <p className="text-sm text-gray-600">
                    Cambia entre tema claro y oscuro
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4" />
                  <Switch
                    checked={tempConfig.theme === 'dark'}
                    onCheckedChange={(checked) => 
                      setTempConfig({ ...tempConfig, theme: checked ? 'dark' : 'light' })
                    }
                  />
                  <Moon className="h-4 w-4" />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Vista Previa del Tema</h4>
                <div className={`p-4 rounded ${tempConfig.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white border'}`}>
                  <h5 className="font-medium">{tempConfig.appName}</h5>
                  <p className="text-sm opacity-70">
                    Esta es una vista previa de cómo se verá la aplicación con el tema seleccionado.
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveConfig} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Aplicar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Info Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Información del Sistema</span>
              </CardTitle>
              <CardDescription>
                Detalles y estadísticas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Versión del Sistema</p>
                    <p className="text-lg font-bold text-blue-600">{config.version}</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Último Backup</p>
                    <p className="text-sm font-medium text-green-600">
                      {new Date(config.lastBackup).toLocaleString('es-ES')}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Backup Automático</p>
                    <p className="text-sm font-medium text-purple-600">
                      Cada {config.autoBackupInterval} minutos
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Préstamos Activos</p>
                    <p className="text-lg font-bold text-orange-600">{stats.activeLoans}</p>
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Préstamos Inactivos</p>
                    <p className="text-lg font-bold text-red-600">{stats.inactiveLoans}</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total de Préstamos</p>
                    <p className="text-lg font-bold text-gray-600">{stats.totalLoans}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Actions Tab */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Acciones del Sistema</span>
              </CardTitle>
              <CardDescription>
                Exportar e importar configuraciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleExportConfig} variant="outline" className="h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  <span>Exportar Configuración</span>
                  <span className="text-xs text-gray-500">Descargar archivo JSON</span>
                </Button>
                
                <div className="relative">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleImportConfig}
                    className="hidden"
                    id="import-config"
                  />
                  <Button
                    variant="outline"
                    className="h-20 flex-col w-full"
                    onClick={() => document.getElementById('import-config')?.click()}
                  >
                    <Upload className="h-6 w-6 mb-2" />
                    <span>Importar Configuración</span>
                    <span className="text-xs text-gray-500">Subir archivo JSON</span>
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-800">Precaución</p>
                    <p className="text-sm text-yellow-600">
                      Importar una configuración sobrescribirá la configuración actual. 
                      Asegúrate de hacer un backup antes de proceder.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}