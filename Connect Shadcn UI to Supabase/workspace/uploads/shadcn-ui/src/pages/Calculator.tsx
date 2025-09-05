import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator as CalculatorIcon, DollarSign } from 'lucide-react';
import { calculateLoan } from '@/lib/storage';
import { LoanCalculation } from '@/types';

export default function Calculator() {
  const [amount, setAmount] = useState<number>(500);
  const [days, setDays] = useState<number>(20);
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);

  useEffect(() => {
    if (amount > 0 && days > 0) {
      const result = calculateLoan(amount, days);
      setCalculation(result);
    }
  }, [amount, days]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Calculadora de Préstamos</h2>
        <p className="text-gray-600">Calcula automáticamente el interés diario (0.52380952%)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalculatorIcon className="h-5 w-5" />
              <span>Datos del Préstamo</span>
            </CardTitle>
            <CardDescription>
              Ingrese el monto y los días del préstamo
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
                placeholder="Ingrese el monto"
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
                placeholder="Ingrese los días"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Resultados del Cálculo</span>
            </CardTitle>
            <CardDescription>
              Detalles automáticos del préstamo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calculation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Monto Préstamo</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(calculation.amount)}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Días del Préstamo</p>
                    <p className="text-lg font-bold text-green-600">
                      {calculation.days} días
                    </p>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Interés Diario</p>
                    <p className="text-lg font-bold text-yellow-600">
                      {calculation.dailyInterestRate.toFixed(8)}%
                    </p>
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Interés Total</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(calculation.totalInterest)}
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total a Pagar</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(calculation.totalAmount)}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-gray-600">Cuota Diaria Real</p>
                        <p className="text-lg font-bold text-indigo-600">
                          {formatCurrency(calculation.dailyPayment)}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-teal-50 rounded-lg">
                        <p className="text-sm text-gray-600">Cuota Diaria Redondeada</p>
                        <p className="text-lg font-bold text-teal-600">
                          {formatCurrency(calculation.roundedDailyPayment)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalculatorIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingrese los datos para ver los cálculos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Example Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ejemplo Completo</CardTitle>
          <CardDescription>
            Ejemplo con los valores por defecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Monto préstamo:</strong> $500.00</p>
                <p><strong>Días del préstamo:</strong> 20</p>
                <p><strong>Interés diario:</strong> 0.52380952%</p>
                <p><strong>Interés total (20 días):</strong> $52.38</p>
              </div>
              <div>
                <p><strong>Total a pagar:</strong> $552.38</p>
                <p><strong>Cuota diaria:</strong> $27.62</p>
                <p><strong>Cuota aproximada:</strong> $28.00</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}