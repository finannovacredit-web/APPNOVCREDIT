import { User, Client, Loan, Payment, DailyCapital, SystemConfig, SystemBackup } from '@/types';

const STORAGE_KEYS = {
  USERS: 'novacredit_users',
  CLIENTS: 'novacredit_clients',
  LOANS: 'novacredit_loans',
  PAYMENTS: 'novacredit_payments',
  DAILY_CAPITAL: 'novacredit_daily_capital',
  SYSTEM_CONFIG: 'novacredit_system_config',
  CURRENT_USER: 'novacredit_current_user',
} as const;

// Initialize default data
const initializeDefaultData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: User[] = [
      {
        id: '1',
        username: 'admin',
        role: 'admin',
        name: 'Administrador',
        password: 'admin123',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        username: 'cobrador1',
        role: 'collector',
        name: 'Cobrador 1',
        password: 'cobrador123',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.LOANS)) {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.DAILY_CAPITAL)) {
    localStorage.setItem(STORAGE_KEYS.DAILY_CAPITAL, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG)) {
    const defaultConfig: SystemConfig = {
      id: 'config_1',
      appName: 'NOVACREDIT',
      logo: '',
      language: 'es',
      theme: 'light',
      version: '1.0.0',
      lastBackup: new Date().toISOString(),
      autoBackupInterval: 5,
      updatedAt: new Date().toISOString(),
      updatedBy: '1'
    };
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(defaultConfig));
  }
};

// User management
export const authenticateUser = (username: string, password: string): User | null => {
  initializeDefaultData();
  const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }
  
  return null;
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return userStr ? JSON.parse(userStr) : null;
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getUsers = (): User[] => {
  initializeDefaultData();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
};

export const getUserById = (id: string): User | null => {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
};

export const deleteUser = (id: string): void => {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
};

export const updateUserPassword = (userId: string, newPassword: string): void => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex >= 0) {
    users[userIndex].password = newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
};

// Client management
export const saveClient = (client: Client): void => {
  const clients = getClients();
  const existingIndex = clients.findIndex(c => c.id === client.id);
  
  if (existingIndex >= 0) {
    clients[existingIndex] = { ...client, updatedAt: new Date().toISOString() };
  } else {
    clients.push(client);
  }
  
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
};

export const getClients = (): Client[] => {
  initializeDefaultData();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
};

export const getClientById = (id: string): Client | null => {
  const clients = getClients();
  return clients.find(c => c.id === id) || null;
};

export const getClientByDui = (dui: string): Client | null => {
  const clients = getClients();
  return clients.find(c => c.dui === dui) || null;
};

// Loan management
export const saveLoan = (loan: Loan): void => {
  const loans = getLoans();
  const existingIndex = loans.findIndex(l => l.id === loan.id);
  
  if (existingIndex >= 0) {
    loans[existingIndex] = loan;
  } else {
    loans.push(loan);
    // Deduct from available capital when creating a new loan
    deductFromCapital(loan.amount);
  }
  
  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
};

export const getLoans = (): Loan[] => {
  initializeDefaultData();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOANS) || '[]');
};

export const getActiveLoansByClient = (clientId: string): Loan[] => {
  const loans = getLoans();
  return loans.filter(l => l.clientId === clientId && l.status === 'active');
};

export const getLoanById = (id: string): Loan | null => {
  const loans = getLoans();
  return loans.find(l => l.id === id) || null;
};

// Payment management
export const savePayment = (payment: Payment): void => {
  const payments = getPayments();
  payments.push(payment);
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

  // Update loan paid amount
  const loan = getLoanById(payment.loanId);
  if (loan) {
    loan.paidAmount += payment.amount;
    if (loan.paidAmount >= loan.totalAmount) {
      loan.status = 'completed';
    }
    saveLoan(loan);
  }
};

export const getPayments = (): Payment[] => {
  initializeDefaultData();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '[]');
};

export const getPaymentsByDate = (date: string): Payment[] => {
  const payments = getPayments();
  return payments.filter(p => p.paymentDate.startsWith(date));
};

// Daily Capital management
export const saveDailyCapital = (capital: DailyCapital): void => {
  const capitals = getDailyCapitals();
  const existingIndex = capitals.findIndex(c => c.date === capital.date);
  
  if (existingIndex >= 0) {
    capitals[existingIndex] = capital;
  } else {
    capitals.push(capital);
  }
  
  localStorage.setItem(STORAGE_KEYS.DAILY_CAPITAL, JSON.stringify(capitals));
};

export const getDailyCapitals = (): DailyCapital[] => {
  initializeDefaultData();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_CAPITAL) || '[]');
};

export const getTodayCapital = (): DailyCapital | null => {
  const today = new Date().toISOString().split('T')[0];
  const capitals = getDailyCapitals();
  return capitals.find(c => c.date === today) || null;
};

export const deductFromCapital = (amount: number): void => {
  const today = new Date().toISOString().split('T')[0];
  const capital = getTodayCapital();
  
  if (capital) {
    capital.availableCapital -= amount;
    saveDailyCapital(capital);
  }
};

export const checkCapitalAvailability = (amount: number): boolean => {
  const capital = getTodayCapital();
  return capital ? capital.availableCapital >= amount : false;
};

// System Configuration
export const getSystemConfig = (): SystemConfig => {
  initializeDefaultData();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG) || '{}');
};

export const saveSystemConfig = (config: SystemConfig): void => {
  localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(config));
};

// Backup and Export
export const createBackup = (): SystemBackup => {
  const backup: SystemBackup = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    data: {
      users: getUsers(),
      clients: getClients(),
      loans: getLoans(),
      payments: getPayments(),
      dailyCapitals: getDailyCapitals(),
      config: getSystemConfig()
    }
  };
  
  // Update last backup time
  const config = getSystemConfig();
  config.lastBackup = backup.timestamp;
  saveSystemConfig(config);
  
  return backup;
};

export const exportToExcel = () => {
  const data = {
    users: getUsers(),
    clients: getClients(),
    loans: getLoans(),
    payments: getPayments(),
    dailyCapitals: getDailyCapitals()
  };
  
  // Create CSV content for each sheet
  const createCSV = (data: Record<string, unknown>[], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');
    return csvContent;
  };
  
  // Download function
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Export each sheet
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Clients
  if (data.clients.length > 0) {
    const clientsCSV = createCSV(data.clients, ['id', 'fullName', 'dui', 'phone', 'address', 'assignedCollector', 'createdAt']);
    downloadCSV(clientsCSV, `novacredit_clients_${timestamp}.csv`);
  }
  
  // Loans
  if (data.loans.length > 0) {
    const loansCSV = createCSV(data.loans, ['id', 'loanNumber', 'clientId', 'amount', 'totalAmount', 'paidAmount', 'status', 'createdAt']);
    downloadCSV(loansCSV, `novacredit_loans_${timestamp}.csv`);
  }
  
  // Payments
  if (data.payments.length > 0) {
    const paymentsCSV = createCSV(data.payments, ['id', 'clientName', 'amount', 'paymentDate', 'collectorName']);
    downloadCSV(paymentsCSV, `novacredit_payments_${timestamp}.csv`);
  }
  
  // Users
  if (data.users.length > 0) {
    const usersData = data.users.map(u => ({ ...u, password: '***' })); // Hide passwords
    const usersCSV = createCSV(usersData, ['id', 'username', 'name', 'role', 'createdAt']);
    downloadCSV(usersCSV, `novacredit_users_${timestamp}.csv`);
  }
};

export const importSystemData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
    if (data.clients) localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data.clients));
    if (data.loans) localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(data.loans));
    if (data.payments) localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(data.payments));
    if (data.dailyCapitals) localStorage.setItem(STORAGE_KEYS.DAILY_CAPITAL, JSON.stringify(data.dailyCapitals));
    if (data.config) localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(data.config));
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Utility functions
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const calculateLoan = (amount: number, days: number) => {
  const dailyInterestRate = 0.52380952; // 0.52380952%
  
  // Calculate total interest: amount * (rate/100) * days
  const totalInterest = amount * (dailyInterestRate / 100) * days;
  const totalAmount = amount + totalInterest;
  const dailyPayment = totalAmount / days;
  const roundedDailyPayment = Math.ceil(dailyPayment);
  
  return {
    amount,
    days,
    dailyInterestRate,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    dailyPayment: Math.round(dailyPayment * 100) / 100,
    roundedDailyPayment
  };
};

export const getDailySummary = (date: string) => {
  const payments = getPaymentsByDate(date);
  const uniqueClients = new Set(payments.map(p => p.clientId));
  
  const moneyCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  
  // Calculate profits (interest portion of payments)
  let profits = 0;
  payments.forEach(payment => {
    const loan = getLoanById(payment.loanId);
    if (loan) {
      const interestPerPayment = (loan.totalAmount - loan.amount) / loan.days;
      const dailyPayments = payment.amount / loan.roundedDailyPayment;
      profits += interestPerPayment * dailyPayments;
    }
  });

  const capitalRecovered = moneyCollected - profits;

  return {
    date,
    clientsVisited: uniqueClients.size,
    moneyCollected: Math.round(moneyCollected * 100) / 100,
    profits: Math.round(profits * 100) / 100,
    capitalRecovered: Math.round(capitalRecovered * 100) / 100,
    payments
  };
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe incluir al menos una mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe incluir al menos una minúscula');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Debe incluir al menos un símbolo especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};