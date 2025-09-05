import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { 
  getClients, 
  saveLoan, 
  getActiveLoansByClient, 
  calculateLoan, 
  generateId,
  getTodayCapital,
  checkCapitalAvailability
} from '@/lib/storage';
import { Client, Loan, User, LoanCalculation } from '@/types';

interface NewLoanProps {
  currentUser: User;
}

export default function NewLoan({ currentUser }: NewLoanProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [days, setDays] = useState<number>(30);
  const [paymentFrequency, setPaymentFrequency] = useState<'daily' | 'weekly'>('daily');
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [availableCapital, setAvailableCapital] = useState<number>(0);
  const [capitalAlert, setCapitalAlert] = useState<string>('');

  useEffect(() => {
    const loadedClients = getClients();
    setClients(loadedClients);
    setFilteredClients(loadedClients);

    // Load today's capital
    const todayCapital = getTodayCapital();
    setAvailableCapital(todayCapital?.availableCapital || 0);
  }, []);

  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => 
        client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.dui.includes(searchTerm)
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  useEffect(() => {
    if (selectedClient) {
      const loans = getActiveLoansByClient(selectedClient.id);
      setActiveLoans(loans);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (amount > 0 && days > 0) {
      const result = calculateLoan(amount, days);
      setCalculation(result);

      // Check capital availability
      if (amount > availableCapital) {
        setCapitalAlert(`El monto solicitado ($${amount.toFixed(2)}) supera el capital disponible ($${availableCapital.toFixed(2)})`);
      } else {
        setCapitalAlert('');
      }
    }
  }, [amount, days, availableCapital]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSearchTerm(client.fullName);
  };

  const handleCreateLoan = () => {
    if (!selectedClient || !calculation) return;

    // Check capital availability
    if (!checkCapitalAvailability(amount)) {
      alert('Capital insuficiente para este préstamo');
      return;
    }

    // Check if client already has 2 active loans
    if (activeLoans.length >= 2) {
      alert('El cliente ya tiene el máximo de 2 préstamos activos');
      return;
    }

    const loanNumber = `L${Date.now().toString().slice(-6)}`;
    
    const newLoan: Loan = {
      id: generateId(),
      loanNumber,
      clientId: selectedClient.id,
      amount: calculation.amount,
      days: calculation.days,
      totalAmount: calculation.totalAmount,
      paidAmount: 0,
      dailyPayment: calculation.dailyPayment,
      roundedDailyPayment: calculation.roundedDailyPayment,
      paymentFrequency,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };

    saveLoan(newLoan);
    
    // Reset form
    setSelectedClient(null);
    setSearchTerm('');
    setAmount(0);
    setDays(30);
    setPaymentFrequency('daily');
    setCalculation(null);
    setActiveLoans([]);
    
    // Reload capital
    const todayCapital = getTodayCapital();
    setAvailableCapital(todayCapital?.availableCapital || 0);
    
    alert('Préstamo creado exitosamente');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const canCreateLoan = selectedClient && calculation && activeLoans.length < 2 && !capitalAlert;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nuevo Préstamo</h2>
        <p className="text-gray-600">Crea un nuevo préstamo para un cliente existente</p>
      </div>

      {/* Capital Status */}
      <Card className={availableCapital < 1000 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className={`h-5 w-5 ${availableCapital < 1000 ? 'text-orange-500' : 'text-green-500'}`} />
              <div>
                <p className="font-medium">Capital Disponible</p>
                <p className="text-sm text-gray-600">Para préstamos de hoy</p>
              </div>
            </div>
            <p className={`text-xl font-bold ${availableCapital < 1000 ? 'text-orange-600' : 'text-green-600'}`}>
              {formatCurrency(availableCapital)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Buscar Cliente</span>
            </CardTitle>
            <CardDescription>
              Busca y selecciona un cliente para el préstamo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por nombre o DUI</Label>
              <Input
                id="search"
                placeholder="Nombre del cliente o DUI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {searchTerm && !selectedClient && (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => handleClientSelect(client)}
                  >
                    <p className="font-medium">{client.fullName}</p>
                    <p className="text-sm text-gray-600">DUI: {client.dui}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedClient && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{selectedClient.fullName}</p>
                    <p className="text-sm text-gray-600">DUI: {selectedClient.dui}</p>
                    <p className="text-sm text-gray-600">Teléfono: {selectedClient.phone}</p>
                    <p className="text-sm text-gray-600">Cobrador: {selectedClient.assignedCollector}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedClient(null);
                      setSearchTerm('');
                    }}
                  >
                    Cambiar
                  </Button>
                </div>
                
                {activeLoans.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-orange-600">
                      Préstamos Activos: {activeLoans.length}/2
                    </p>
                    {activeLoans.map((loan) => (
                      <div key={loan.id} className="text-xs text-gray-600">
                        {loan.loanNumber}: {formatCurrency(loan.totalAmount - loan.paidAmount)} pendiente
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loan Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Detalles del Préstamo</span>
            </CardTitle>
            <CardDescription>
              Configura los términos del préstamo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto del Préstamo ($)</Label>
              <Input
                id="amount"
                type="number"
                min="100"
                max="6000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Monto del préstamo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="days">Días del Préstamo</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                placeholder="Días del préstamo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frecuencia de Pago</Label>
              <Select value={paymentFrequency} onValueChange={(value: 'daily' | 'weekly') => setPaymentFrequency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {capitalAlert && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-600">
                  {capitalAlert}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calculation Results */}
      {calculation && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen del Préstamo</CardTitle>
            <CardDescription>
              Detalles calculados automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Monto Prestado</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(calculation.amount)}
                </p>
              </div>
              
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Interés Total</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(calculation.totalInterest)}
                </p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Total a Pagar</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(calculation.totalAmount)}
                </p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Cuota Diaria</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(calculation.roundedDailyPayment)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Loan Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleCreateLoan}
          disabled={!canCreateLoan}
          size="lg"
          className="px-8"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Crear Préstamo
        </Button>
      </div>

      {/* Validation Messages */}
      {selectedClient && activeLoans.length >= 2 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este cliente ya tiene el máximo de 2 préstamos activos.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}