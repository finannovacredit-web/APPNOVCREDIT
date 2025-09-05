import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Search, CheckCircle, XCircle } from 'lucide-react';
import { getClients, getLoans, saveLoan, generateId, calculateLoan } from '@/lib/storage';
import { Client, Loan, User } from '@/types';
import { toast } from 'sonner';

interface RefinancingProps {
  currentUser: User;
}

export default function Refinancing({ currentUser }: RefinancingProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientLoans, setClientLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [refinancingData, setRefinancingData] = useState({
    newAmount: 0,
    newDays: 20
  });

  useEffect(() => {
    const loadedClients = getClients();
    setClients(loadedClients);
  }, []);

  useEffect(() => {
    if (selectedClient) {
      const allLoans = getLoans();
      const loans = allLoans.filter(l => l.clientId === selectedClient.id && l.status === 'active');
      setClientLoans(loans);
    }
  }, [selectedClient]);

  const handleClientSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length >= 3) {
      const foundClient = clients.find(c => 
        c.fullName.toLowerCase().includes(term.toLowerCase()) ||
        c.dui.includes(term)
      );
      
      if (foundClient) {
        setSelectedClient(foundClient);
      }
    } else {
      setSelectedClient(null);
      setClientLoans([]);
      setSelectedLoan(null);
    }
  };

  const isEligibleForRefinancing = (loan: Loan): { eligible: boolean; reason: string } => {
    // Calculate remaining payments based on payment frequency
    const totalPayments = loan.paymentFrequency === 'daily' ? loan.days :
                         loan.paymentFrequency === 'weekly' ? Math.ceil(loan.days / 7) :
                         loan.paymentFrequency === 'biweekly' ? Math.ceil(loan.days / 14) :
                         Math.ceil(loan.days / 30);
    
    const paidPayments = Math.floor(loan.paidAmount / loan.roundedDailyPayment);
    const remainingPayments = totalPayments - paidPayments;
    
    // Check eligibility rules
    if (loan.paymentFrequency === 'daily' && remainingPayments <= 5) {
      return { eligible: true, reason: `Elegible: ${remainingPayments} cuotas restantes (máximo 5 para préstamos diarios)` };
    } else if (loan.paymentFrequency === 'weekly' && remainingPayments <= 1) {
      return { eligible: true, reason: `Elegible: ${remainingPayments} cuota restante (máximo 1 para préstamos semanales)` };
    } else if (loan.paymentFrequency === 'biweekly' && remainingPayments <= 2) {
      return { eligible: true, reason: `Elegible: ${remainingPayments} cuotas restantes` };
    } else if (loan.paymentFrequency === 'monthly' && remainingPayments <= 1) {
      return { eligible: true, reason: `Elegible: ${remainingPayments} cuota restante` };
    }
    
    return { 
      eligible: false, 
      reason: `No elegible: ${remainingPayments} cuotas restantes (máximo ${
        loan.paymentFrequency === 'daily' ? '5 para diarios' :
        loan.paymentFrequency === 'weekly' ? '1 para semanales' : '2'
      })` 
    };
  };

  const calculateRefinancing = () => {
    if (!selectedLoan) return null;
    
    const remainingAmount = selectedLoan.totalAmount - selectedLoan.paidAmount;
    const newTotalAmount = remainingAmount + refinancingData.newAmount;
    
    return calculateLoan(newTotalAmount, refinancingData.newDays);
  };

  const handleRefinance = () => {
    if (!selectedClient || !selectedLoan) {
      toast.error('Debe seleccionar un cliente y un préstamo');
      return;
    }

    const eligibility = isEligibleForRefinancing(selectedLoan);
    if (!eligibility.eligible) {
      toast.error('El préstamo no es elegible para refinanciamiento');
      return;
    }

    if (refinancingData.newAmount < 100) {
      toast.error('El monto adicional mínimo es $100');
      return;
    }

    if (refinancingData.newAmount > 6000) {
      toast.error('El monto adicional máximo es $6,000');
      return;
    }

    const remainingAmount = selectedLoan.totalAmount - selectedLoan.paidAmount;
    const newTotalAmount = remainingAmount + refinancingData.newAmount;
    const calculation = calculateLoan(newTotalAmount, refinancingData.newDays);

    // Mark old loan as refinanced
    const updatedOldLoan: Loan = {
      ...selectedLoan,
      status: 'refinanced'
    };
    saveLoan(updatedOldLoan);

    // Create new refinanced loan
    const newLoan: Loan = {
      id: generateId(),
      clientId: selectedClient.id,
      clientName: selectedClient.fullName,
      loanNumber: selectedLoan.loanNumber,
      ...calculation,
      amount: newTotalAmount, // Override with the new total amount
      paymentFrequency: selectedLoan.paymentFrequency,
      excludedDays: selectedLoan.excludedDays,
      status: 'active',
      createdAt: new Date().toISOString(),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + refinancingData.newDays * 24 * 60 * 60 * 1000).toISOString(),
      paidAmount: 0,
      remainingPayments: refinancingData.newDays
    };

    saveLoan(newLoan);
    
    // Refresh data
    const allLoans = getLoans();
    const loans = allLoans.filter(l => l.clientId === selectedClient.id && l.status === 'active');
    setClientLoans(loans);
    setSelectedLoan(null);
    
    // Reset form
    setRefinancingData({
      newAmount: 0,
      newDays: 20
    });
    
    toast.success('Refinanciamiento procesado exitosamente');
  };

  const refinancingCalculation = calculateRefinancing();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Panel de Refinanciamiento</h2>
        <p className="text-gray-600">Gestiona refinanciamientos de préstamos existentes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client and Loan Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Buscar Cliente</span>
            </CardTitle>
            <CardDescription>
              Busque por nombre completo o DUI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientSearch">Buscar Cliente</Label>
              <Input
                id="clientSearch"
                placeholder="Nombre completo o DUI"
                value={searchTerm}
                onChange={(e) => handleClientSearch(e.target.value)}
              />
            </div>

            {selectedClient && (
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="font-semibold text-blue-800">{selectedClient.fullName}</h4>
                <p className="text-sm text-blue-600">DUI: {selectedClient.dui}</p>
                <p className="text-sm text-blue-600">Teléfono: {selectedClient.phone}</p>
              </div>
            )}

            {clientLoans.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Préstamos Activos:</h4>
                {clientLoans.map((loan) => {
                  const eligibility = isEligibleForRefinancing(loan);
                  return (
                    <div 
                      key={loan.id} 
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedLoan?.id === loan.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedLoan(loan)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">Préstamo {loan.loanNumber}</span>
                          <p className="text-sm text-gray-600">
                            Monto: ${loan.amount} | Total: ${loan.totalAmount}
                          </p>
                          <p className="text-sm text-gray-600">
                            Pagado: ${loan.paidAmount} | Restante: ${(loan.totalAmount - loan.paidAmount).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant={eligibility.eligible ? 'default' : 'destructive'}>
                            {eligibility.eligible ? 'Elegible' : 'No Elegible'}
                          </Badge>
                          {eligibility.eligible ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{eligibility.reason}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refinancing Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span>Configurar Refinanciamiento</span>
            </CardTitle>
            <CardDescription>
              Configure los nuevos términos del préstamo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedLoan ? (
              <>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <h5 className="font-semibold text-yellow-800">Préstamo Seleccionado</h5>
                  <p className="text-sm text-yellow-700">
                    Monto restante: ${(selectedLoan.totalAmount - selectedLoan.paidAmount).toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newAmount">Monto Adicional ($)</Label>
                    <Input
                      id="newAmount"
                      type="number"
                      min="100"
                      max="6000"
                      value={refinancingData.newAmount}
                      onChange={(e) => setRefinancingData(prev => ({ ...prev, newAmount: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-gray-500">Mín: $100 - Máx: $6,000</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newDays">Nuevos Días</Label>
                    <Input
                      id="newDays"
                      type="number"
                      min="1"
                      max="365"
                      value={refinancingData.newDays}
                      onChange={(e) => setRefinancingData(prev => ({ ...prev, newDays: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                {refinancingCalculation && refinancingData.newAmount > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-semibold">Vista Previa del Refinanciamiento:</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-green-50 rounded text-sm">
                        <p className="text-gray-600">Nuevo Total</p>
                        <p className="font-bold text-green-600">
                          ${refinancingCalculation.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded text-sm">
                        <p className="text-gray-600">Nueva Cuota Diaria</p>
                        <p className="font-bold text-blue-600">
                          ${refinancingCalculation.roundedDailyPayment.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleRefinance}
                  disabled={!isEligibleForRefinancing(selectedLoan).eligible || refinancingData.newAmount < 100}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Procesar Refinanciamiento
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Seleccione un préstamo para configurar el refinanciamiento</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refinancing Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas de Refinanciamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-semibold mb-2">Elegibilidad por Frecuencia de Pago:</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Préstamos Diarios:</strong> Máximo 5 cuotas pendientes</li>
                <li>• <strong>Préstamos Semanales:</strong> Máximo 1 cuota pendiente</li>
                <li>• <strong>Préstamos Quincenales:</strong> Máximo 2 cuotas pendientes</li>
                <li>• <strong>Préstamos Mensuales:</strong> Máximo 1 cuota pendiente</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Límites de Monto:</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Mínimo adicional:</strong> $100</li>
                <li>• <strong>Máximo adicional:</strong> $6,000</li>
                <li>• <strong>Interés:</strong> 0.52380952% diario</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}