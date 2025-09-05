export interface User {
  id: string;
  username: string;
  role: 'admin' | 'collector';
  name: string;
  password?: string;
  photo?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Client {
  id: string;
  fullName: string;
  dui: string;
  phone: string;
  address: string;
  assignedCollector: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
  documents?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Loan {
  id: string;
  loanNumber: string;
  clientId: string;
  amount: number;
  days: number;
  totalAmount: number;
  paidAmount: number;
  dailyPayment: number;
  roundedDailyPayment: number;
  paymentFrequency: 'daily' | 'weekly';
  status: 'active' | 'completed' | 'refinanced';
  createdAt: string;
  createdBy: string;
}

export interface LoanCalculation {
  amount: number;
  days: number;
  dailyInterestRate: number;
  totalInterest: number;
  totalAmount: number;
  dailyPayment: number;
  roundedDailyPayment: number;
}

export interface Payment {
  id: string;
  loanId: string;
  clientId: string;
  amount: number;
  paymentDate: string;
  collectorId: string;
  collectorName: string;
  clientName: string;
  notes?: string;
}

export interface DailyCapital {
  id: string;
  date: string;
  availableCapital: number;
  initialCapital: number;
  updatedBy: string;
  updatedAt: string;
}

export interface DailySummary {
  date: string;
  clientsVisited: number;
  moneyCollected: number;
  profits: number;
  capitalRecovered: number;
  payments: Payment[];
}

export interface SystemConfig {
  id: string;
  appName: string;
  logo: string;
  language: 'es' | 'en';
  theme: 'light' | 'dark';
  version: string;
  lastBackup: string;
  autoBackupInterval: number; // minutes
  updatedAt: string;
  updatedBy: string;
}

export interface SystemBackup {
  id: string;
  timestamp: string;
  data: {
    users: User[];
    clients: Client[];
    loans: Loan[];
    payments: Payment[];
    dailyCapitals: DailyCapital[];
    config: SystemConfig;
  };
}