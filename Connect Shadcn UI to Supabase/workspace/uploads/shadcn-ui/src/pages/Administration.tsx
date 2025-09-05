import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Key, 
  Download, 
  HardDrive, 
  UserPlus, 
  Edit, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  Camera
} from 'lucide-react';
import { 
  getUsers, 
  saveUser, 
  deleteUser, 
  updateUserPassword, 
  generateId, 
  validatePassword,
  exportToExcel,
  createBackup
} from '@/lib/storage';
import { User } from '@/types';

interface AdministrationProps {
  currentUser: User;
}

export default function Administration({ currentUser }: AdministrationProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Create User Form
  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    role: 'collector' as 'admin' | 'collector',
    password: '',
    confirmPassword: '',
    photo: ''
  });
  
  // Change Password Form
  const [passwordForm, setPasswordForm] = useState({
    userId: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = getUsers();
    setUsers(allUsers);
  };

  const handleCreateUser = () => {
    setErrors([]);
    setSuccess('');
    
    // Validation
    const validationErrors: string[] = [];
    
    if (!newUser.username.trim()) {
      validationErrors.push('El nombre de usuario es requerido');
    }
    
    if (!newUser.name.trim()) {
      validationErrors.push('El nombre completo es requerido');
    }
    
    if (!newUser.password) {
      validationErrors.push('La contraseña es requerida');
    } else {
      const passwordValidation = validatePassword(newUser.password);
      if (!passwordValidation.isValid) {
        validationErrors.push(...passwordValidation.errors);
      }
    }
    
    if (newUser.password !== newUser.confirmPassword) {
      validationErrors.push('Las contraseñas no coinciden');
    }
    
    // Check if username already exists
    const existingUser = users.find(u => u.username === newUser.username);
    if (existingUser) {
      validationErrors.push('El nombre de usuario ya existe');
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Create user
    const user: User = {
      id: generateId(),
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      password: newUser.password,
      photo: newUser.photo,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };
    
    saveUser(user);
    loadUsers();
    
    // Reset form
    setNewUser({
      username: '',
      name: '',
      role: 'collector',
      password: '',
      confirmPassword: '',
      photo: ''
    });
    
    setShowCreateUser(false);
    setSuccess('Usuario creado exitosamente');
  };

  const handleChangePassword = () => {
    setErrors([]);
    setSuccess('');
    
    const validationErrors: string[] = [];
    
    if (!passwordForm.userId) {
      validationErrors.push('Selecciona un usuario');
    }
    
    if (!passwordForm.newPassword) {
      validationErrors.push('La nueva contraseña es requerida');
    } else {
      const passwordValidation = validatePassword(passwordForm.newPassword);
      if (!passwordValidation.isValid) {
        validationErrors.push(...passwordValidation.errors);
      }
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      validationErrors.push('Las contraseñas no coinciden');
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    updateUserPassword(passwordForm.userId, passwordForm.newPassword);
    loadUsers();
    
    setPasswordForm({
      userId: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    setShowChangePassword(false);
    setSuccess('Contraseña actualizada exitosamente');
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert('No puedes eliminar tu propio usuario');
      return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      deleteUser(userId);
      loadUsers();
      setSuccess('Usuario eliminado exitosamente');
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewUser(prev => ({ ...prev, photo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = () => {
    try {
      exportToExcel();
      setSuccess('Datos exportados exitosamente');
    } catch (error) {
      setErrors(['Error al exportar los datos']);
    }
  };

  const handleCreateBackup = () => {
    try {
      const backup = createBackup();
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `novacredit_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      setSuccess('Backup creado y descargado exitosamente');
    } catch (error) {
      setErrors(['Error al crear el backup']);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Panel de Administración</h2>
        <p className="text-gray-600">Gestión de usuarios, contraseñas y datos del sistema</p>
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

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Crear Usuarios</TabsTrigger>
          <TabsTrigger value="passwords">Contraseñas</TabsTrigger>
          <TabsTrigger value="export">Exportar Datos</TabsTrigger>
          <TabsTrigger value="storage">Local Storage</TabsTrigger>
        </TabsList>

        {/* Create Users Tab */}
        <TabsContent value="users">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Gestión de Usuarios</span>
                    </CardTitle>
                    <CardDescription>
                      Crear y administrar usuarios del sistema
                    </CardDescription>
                  </div>
                  <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Crear Usuario
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                        <DialogDescription>
                          Completa la información para crear un nuevo usuario
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Nombre de Usuario</Label>
                          <Input
                            id="username"
                            value={newUser.username}
                            onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Nombre de usuario único"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre Completo</Label>
                          <Input
                            id="name"
                            value={newUser.name}
                            onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nombre completo del usuario"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="role">Rol</Label>
                          <Select value={newUser.role} onValueChange={(value: 'admin' | 'collector') => setNewUser(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="collector">Cobrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password">Contraseña</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Mínimo 8 caracteres con mayúsculas, minúsculas y símbolos"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={newUser.confirmPassword}
                            onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirma la contraseña"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="photo">Fotografía (Opcional)</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="photo"
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('photo')?.click()}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Subir Foto
                            </Button>
                            {newUser.photo && (
                              <img
                                src={newUser.photo}
                                alt="Preview"
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                          </div>
                        </div>
                        
                        <Button onClick={handleCreateUser} className="w-full">
                          Crear Usuario
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {user.photo ? (
                          <img
                            src={user.photo}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">@{user.username}</p>
                          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.id !== currentUser.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Change Passwords Tab */}
        <TabsContent value="passwords">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Cambiar Contraseñas</span>
              </CardTitle>
              <CardDescription>
                Actualiza las contraseñas de los usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userSelect">Seleccionar Usuario</Label>
                  <Select value={passwordForm.userId} onValueChange={(value) => setPasswordForm(prev => ({ ...prev, userId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} (@{user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Mínimo 8 caracteres con mayúsculas, minúsculas y símbolos"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirma la nueva contraseña"
                  />
                </div>
                
                <Button onClick={handleChangePassword} className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Cambiar Contraseña
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Data Tab */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Exportar Datos</span>
              </CardTitle>
              <CardDescription>
                Exporta todos los datos del sistema a archivos Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Datos a Exportar:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Lista de clientes (hoja separada)</li>
                    <li>• Préstamos activos e inactivos (hoja separada)</li>
                    <li>• Lista de cuotas con nombres y montos (hoja separada)</li>
                    <li>• Usuarios registrados (hoja separada)</li>
                  </ul>
                </div>
                
                <Button onClick={handleExportData} className="w-full" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar a Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Local Storage Tab */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5" />
                <span>Gestión de Local Storage</span>
              </CardTitle>
              <CardDescription>
                Crear backups y gestionar el almacenamiento local
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Backup Automático:</h4>
                  <p className="text-sm text-gray-600">
                    El sistema crea automáticamente un backup cada 5 minutos para proteger la información.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={handleCreateBackup} variant="outline" className="h-20 flex-col">
                    <Download className="h-6 w-6 mb-2" />
                    <span>Crear Backup Manual</span>
                    <span className="text-xs text-gray-500">Descarga archivo JSON</span>
                  </Button>
                  
                  <Button onClick={handleExportData} variant="outline" className="h-20 flex-col">
                    <HardDrive className="h-6 w-6 mb-2" />
                    <span>Exportar Todo</span>
                    <span className="text-xs text-gray-500">Archivos Excel organizados</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}