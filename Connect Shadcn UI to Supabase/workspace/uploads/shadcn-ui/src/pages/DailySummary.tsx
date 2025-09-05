import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  PiggyBank, 
  Plus, 
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { 
  getTodayCapital, 
  saveDailyCapital, 
  savePayment, 
  getDailySummary,
  getClients,
  getLoans,
  generateId,
  getCurrentUser
} from '@/lib/storage';
import { User, DailyCapital, Payment, Client, Loan, DailySummary as DailySummaryType } from '@/types';

interface DailySummaryProps {
  currentUser: User;
}

export default function DailySummary({ currentUser }: DailySummaryProps) {
  const [todayCapital, setTodayCapital] = useState<DailyCapital | null>(null);
  const [newCapital, setNewCapital] = useState<number>(0);
  const [dailySummary, setDailySummary] = useState<DailySummaryType | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const capital = getTodayCapital();
    setTodayCapital(capital);
    setNewCapital(capital?.availableCapital || 0);

    const summary = getDailySummary(today);
    setDailySummary(summary);

    const allClients = getClients();
    const allLoans = getLoans();
    const activeLoansList = allLoans.filter(l => l.status === 'active');
    
    setClients(allClients);
    setLoans(allLoans);
    setActiveLoans(activeLoansList);
  };

  const handleSaveCapital = () => {
    const capitalData: DailyCapital = {
      id: generateId(),
      date: today,
      availableCapital: newCapital,
      initialCapital: newCapital,
      updatedBy: currentUser.id,
      updatedAt: new Date().toISOString()
    };

    saveDailyCapital(capitalData);
    setTodayCapital(capitalData);
  };

  const handleAddPayment = () => {
    if (!selectedLoan || paymentAmount <= 0) return;

    const loan = loans.find(l => l.id === selectedLoan);
    const client = clients.find(c => c.id === loan?.clientId);
    
    if (!loan || !client) return;

    const payment: Payment = {
      id: generateId(),
      loanId: selectedLoan,
      clientId: loan.clientId,
      amount: paymentAmount,
      paymentDate: new Date().toISOString(),
      collectorId: currentUser.id,
      collectorName: currentUser.name,
      clientName: client.fullName,
      notes: paymentNotes
    };

    savePayment(payment);
    
    // Reset form
    setSelectedLoan('');
    setPaymentAmount(0);
    setPaymentNotes('');
    setShowPaymentDialog(false);
    
    // Reload data
    loadData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Resumen Diario</h2>
        <p className="text-gray-600">Gestión de capital y seguimiento diario de cobros</p>
      </div>

      {/* Capital Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PiggyBank className="h-5 w-5" />
            <span>Capital Disponible</span>
          </CardTitle>
          <CardDescription>
            Registra y gestiona el capital disponible para préstamos de hoy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capital">Capital Disponible ($)</Label>
                <Input
                  id="capital"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCapital}
                  onChange={(e) => setNewCapital(Number(e.target.value))}
                  placeholder="Ingrese el capital disponible"
                />
              </div>
              <Button onClick={handleSaveCapital} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Guardar Capital
              </Button>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600">Capital Registrado Hoy</p>
                <p className="text-2xl font-bold text-blue-600">
                  {todayCapital ? formatCurrency(todayCapital.availableCapital) : '$0.00'}
                </p>
                {todayCapital && (
                  <p className="text-xs text-gray-500 mt-2">
                    Actualizado: {formatDate(todayCapital.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary Stats */}
      {dailySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Clientes Visitados</p>
                  <p className="text-2xl font-bold">{dailySummary.clientsVisited}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Dinero Recolectado</p>
                  <p className="text-2xl font-bold">{formatCurrency(dailySummary.moneyCollected)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Ganancias</p>
                  <p className="text-2xl font-bold">{formatCurrency(dailySummary.profits)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <PiggyBank className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Capital Recuperado</p>
                  <p className="text-2xl font-bold">{formatCurrency(dailySummary.capitalRecovered)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Payment Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Registrar Cobro</span>
              </CardTitle>
              <CardDescription>
                Registra los pagos recibidos de los clientes
              </CardDescription>
            </div>
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Cobro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Cobro</DialogTitle>
                  <DialogDescription>
                    Selecciona el préstamo y registra el monto cobrado
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="loan">Préstamo</Label>
                    <Select value={selectedLoan} onValueChange={setSelectedLoan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar préstamo" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeLoans.map((loan) => {
                          const client = clients.find(c => c.id === loan.clientId);
                          const remaining = loan.totalAmount - loan.paidAmount;
                          return (
                            <SelectItem key={loan.id} value={loan.id}>
                              {client?.fullName} - {loan.loanNumber} (Pendiente: {formatCurrency(remaining)})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto Cobrado ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      placeholder="Monto del cobro"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (Opcional)</Label>
                    <Textarea
                      id="notes"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Observaciones del cobro..."
                      rows={3}
                    />
                  </div>
                  
                  <Button onClick={handleAddPayment} className="w-full">
                    Registrar Cobro
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Today's Payments */}
      {dailySummary && dailySummary.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cobros de Hoy</CardTitle>
            <CardDescription>
              Registro detallado de todos los cobros realizados hoy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailySummary.payments.map((payment: Payment) => (
                <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{payment.clientName}</p>
                    <p className="text-sm text-gray-600">
                      Cobrador: {payment.collectorName} | {formatDate(payment.paymentDate)}
                    </p>
                    {payment.notes && (
                      <p className="text-sm text-gray-500 italic">{payment.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capital Alert */}
      {todayCapital && todayCapital.availableCapital < 1000 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium text-orange-800">Capital Bajo</p>
                <p className="text-sm text-orange-600">
                  El capital disponible es menor a $1,000. Considera agregar más fondos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}