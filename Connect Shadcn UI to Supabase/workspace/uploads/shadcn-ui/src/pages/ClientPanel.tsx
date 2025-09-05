import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Upload, Eye, Plus, Edit } from 'lucide-react';
import { saveClient, getClients, generateId } from '@/lib/storage';
import { Client, User, FileUpload } from '@/types';
import { toast } from 'sonner';

interface ClientPanelProps {
  currentUser: User;
}

export default function ClientPanel({ currentUser }: ClientPanelProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dui: '',
    address: '',
    assignedCollector: '',
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [files, setFiles] = useState<FileUpload[]>([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    const loadedClients = getClients();
    setClients(loadedClients);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      dui: '',
      address: '',
      assignedCollector: '',
    });
    setLocation(null);
    setFiles([]);
    setEditingClient(null);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success('Ubicación obtenida correctamente');
        },
        (error) => {
          toast.error('Error al obtener la ubicación: ' + error.message);
        }
      );
    } else {
      toast.error('Geolocalización no soportada por este navegador');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`El archivo ${file.name} es demasiado grande (máximo 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: FileUpload = {
          id: generateId(),
          name: file.name,
          type: file.type,
          data: e.target?.result as string,
          uploadedAt: new Date().toISOString()
        };
        setFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      toast.error('Por favor, obtenga la ubicación del cliente');
      return;
    }

    const clientData: Client = {
      id: editingClient?.id || generateId(),
      ...formData,
      location,
      files,
      createdAt: editingClient?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveClient(clientData);
    loadClients();
    resetForm();
    setIsAddingClient(false);
    toast.success(editingClient ? 'Cliente actualizado' : 'Cliente registrado exitosamente');
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      fullName: client.fullName,
      phone: client.phone,
      dui: client.dui,
      address: client.address,
      assignedCollector: client.assignedCollector,
    });
    setLocation(client.location);
    setFiles(client.files);
    setIsAddingClient(true);
  };

  const collectors = ['cobrador1', 'cobrador2', 'cobrador3'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Panel de Clientes</h2>
          <p className="text-gray-600">Gestiona los clientes de la financiera</p>
        </div>
        <Button onClick={() => setIsAddingClient(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Cliente
        </Button>
      </div>

      {/* Client List */}
      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{client.fullName}</CardTitle>
                  <CardDescription>DUI: {client.dui}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Badge variant="secondary">{client.assignedCollector}</Badge>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(client)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-medium">{client.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Archivos</p>
                  <p className="font-medium">{client.files.length} archivo(s)</p>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Lat: {client.location.lat.toFixed(6)}, Lng: {client.location.lng.toFixed(6)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Client Dialog */}
      <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              Complete todos los campos requeridos para registrar el cliente
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Celular *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dui">DUI *</Label>
                <Input
                  id="dui"
                  value={formData.dui}
                  onChange={(e) => setFormData(prev => ({ ...prev, dui: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="collector">Cobrador Asignado *</Label>
                <Select
                  value={formData.assignedCollector}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assignedCollector: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cobrador" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectors.map(collector => (
                      <SelectItem key={collector} value={collector}>
                        {collector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Dirección Completa *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ubicación GPS *</Label>
              <div className="flex items-center space-x-2">
                <Button type="button" onClick={getCurrentLocation} variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Obtener Ubicación
                </Button>
                {location && (
                  <span className="text-sm text-green-600">
                    ✓ Ubicación obtenida: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="files">Archivos (PDF, Imágenes)</Label>
              <Input
                id="files"
                type="file"
                multiple
                accept="/images/FileUpload.jpg"
                onChange={handleFileUpload}
              />
              {files.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Archivos cargados:</p>
                  <ul className="list-disc list-inside text-sm">
                    {files.map(file => (
                      <li key={file.id}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddingClient(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingClient ? 'Actualizar' : 'Registrar'} Cliente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}