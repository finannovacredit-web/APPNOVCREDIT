import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { History, Search, Eye, Calendar, DollarSign } from 'lucide-react';
import { getClients, getLoans } from '@/lib/storage';
import { Client, Loan, User } from '@/types';

interface HistoryPanelProps {
  currentUser: User;
}

export default function HistoryPanel({ currentUser }: HistoryPanelProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientLoans, setClientLoans] = useState<Loan[]>([]);

  useEffect(() => {
    const loadedClients = getClients();
    setClients(loadedClients);
    setFilteredClients(loadedClients);
  }, []);

  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => 
        client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.dui.includes(searchTerm) ||
        getClientUniqueId(client.dui).includes(searchTerm)
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const getClientUniqueId = (dui: string): string => {
    return dui.substring(0, 3);
  };

  const loadClientHistory = (client: Client) => {
    setSelectedClient(client);
    const allLoans = getLoans();
    const loans = allLoans.filter(l => l.clientId === client.id);
    // Sort loans by creation date (newest first)
    loans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setClientLoans(loans);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'refinanced': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'refinanced': return 'Refinanciado';
      default: return status;
    }
  };

  const calculateProgress = (loan: Loan) => {
    const progress = (loan.paidAmount / loan.totalAmount) * 100;
    return Math.min(progress, 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Panel de Historial</h2>
        <p className="text-gray-600">Consulta el historial completo de cada cliente</p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Buscar Cliente</span>
          </CardTitle>
          <CardDescription>
            Busque por nombre, DUI o ID único (primeros 3 dígitos del DUI)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Cliente</Label>
            <Input
              id="search"
              placeholder="Nombre, DUI o ID único..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="grid gap-4">
        {filteredClients.map((client) => {
          const uniqueId = getClientUniqueId(client.dui);
          const allLoans = getLoans().filter(l => l.clientId === client.id);
          const activeLoans = allLoans.filter(l => l.status === 'active');
          const completedLoans = allLoans.filter(l => l.status === 'completed');
          const totalBorrowed = allLoans.reduce((sum, loan) => sum + loan.amount, 0);
          
          return (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{client.fullName}</span>
                      <Badge variant="outline" className="text-xs">
                        ID: {uniqueId}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      DUI: {client.dui} | Teléfono: {client.phone}
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => loadClientHistory(client)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Historial
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <History className="h-5 w-5" />
                          <span>Historial de {selectedClient?.fullName}</span>
                          <Badge variant="outline">ID: {selectedClient ? getClientUniqueId(selectedClient.dui) : ''}</Badge>
                        </DialogTitle>
                        <DialogDescription>
                          Historial completo de préstamos y transacciones
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedClient && (
                        <div className="space-y-6">
                          {/* Client Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-gray-600">Total Préstamos</p>
                              <p className="text-2xl font-bold text-blue-600">{clientLoans.length}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-gray-600">Préstamos Activos</p>
                              <p className="text-2xl font-bold text-green-600">
                                {clientLoans.filter(l => l.status === 'active').length}
                              </p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm text-gray-600">Total Prestado</p>
                              <p className="text-lg font-bold text-purple-600">
                                {formatCurrency(clientLoans.reduce((sum, loan) => sum + loan.amount, 0))}
                              </p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg">
                              <p className="text-sm text-gray-600">Cliente desde</p>
                              <p className="text-sm font-bold text-orange-600">
                                {formatDate(selectedClient.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Client Information */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Información del Cliente</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Nombre Completo</p>
                                  <p className="font-medium">{selectedClient.fullName}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">DUI</p>
                                  <p className="font-medium">{selectedClient.dui}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Teléfono</p>
                                  <p className="font-medium">{selectedClient.phone}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Cobrador Asignado</p>
                                  <p className="font-medium">{selectedClient.assignedCollector}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <p className="text-sm text-gray-600">Dirección</p>
                                  <p className="font-medium">{selectedClient.address}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Loans History */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Historial de Préstamos</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {clientLoans.length > 0 ? (
                                <div className="space-y-4">
                                  {clientLoans.map((loan, index) => (
                                    <div key={loan.id} className="border rounded-lg p-4">
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <h4 className="font-semibold flex items-center space-x-2">
                                            <span>Préstamo {loan.loanNumber}</span>
                                            <Badge className={getStatusColor(loan.status)}>
                                              {getStatusLabel(loan.status)}
                                            </Badge>
                                          </h4>
                                          <p className="text-sm text-gray-600">
                                            Creado: {formatDate(loan.createdAt)}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm text-gray-600">Progreso</p>
                                          <p className="font-bold text-lg">
                                            {calculateProgress(loan).toFixed(1)}%
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                        <div>
                                          <p className="text-xs text-gray-500">Monto Prestado</p>
                                          <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Total a Pagar</p>
                                          <p className="font-semibold">{formatCurrency(loan.totalAmount)}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Pagado</p>
                                          <p className="font-semibold text-green-600">{formatCurrency(loan.paidAmount)}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Restante</p>
                                          <p className="font-semibold text-red-600">
                                            {formatCurrency(loan.totalAmount - loan.paidAmount)}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                          <p className="text-xs text-gray-500">Cuota Diaria</p>
                                          <p className="font-medium">{formatCurrency(loan.roundedDailyPayment)}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Frecuencia</p>
                                          <p className="font-medium capitalize">{loan.paymentFrequency}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Días del Préstamo</p>
                                          <p className="font-medium">{loan.days} días</p>
                                        </div>
                                      </div>
                                      
                                      {/* Progress Bar */}
                                      <div className="mt-3">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${calculateProgress(loan)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <p>No hay préstamos registrados para este cliente</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cobrador</p>
                    <p className="font-medium">{client.assignedCollector}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Préstamos Activos</p>
                    <p className="font-medium text-green-600">{activeLoans.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Préstamos Completados</p>
                    <p className="font-medium text-blue-600">{completedLoans.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Prestado</p>
                    <p className="font-medium">{formatCurrency(totalBorrowed)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredClients.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No se encontraron clientes con el término de búsqueda: "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}