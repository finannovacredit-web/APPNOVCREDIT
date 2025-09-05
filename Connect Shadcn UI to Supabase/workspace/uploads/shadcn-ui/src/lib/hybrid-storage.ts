// Hybrid storage that can work with both localStorage and Supabase
import * as localStorageAPI from './storage';
import * as supabaseAPI from './supabase-storage';
import { testConnection } from './supabase';
import { User, Client, Loan, Payment, DailyCapital, SystemConfig } from '@/types';

let useSupabase = false;

// Initialize storage system
export const initializeStorage = async () => {
  const isConnected = await testConnection();
  if (isConnected) {
    const dbInitialized = await supabaseAPI.initializeDatabase();
    if (dbInitialized) {
      useSupabase = true;
      console.log('Using Supabase for data storage');
      return true;
    }
  }
  
  console.log('Using localStorage for data storage');
  useSupabase = false;
  return false;
};

// Export unified API that switches between localStorage and Supabase
export const authenticateUser = async (username: string, password: string) => {
  if (useSupabase) {
    return await supabaseAPI.authenticateUser(username, password);
  }
  return localStorageAPI.authenticateUser(username, password);
};

export const getCurrentUser = () => {
  // This remains localStorage-based for session management
  return localStorageAPI.getCurrentUser();
};

export const logout = () => {
  return localStorageAPI.logout();
};

export const getUsers = async () => {
  if (useSupabase) {
    return await supabaseAPI.getUsers();
  }
  return localStorageAPI.getUsers();
};

export const saveUser = async (user: User) => {
  if (useSupabase) {
    return await supabaseAPI.saveUser(user);
  }
  localStorageAPI.saveUser(user);
  return true;
};

export const getClients = async () => {
  if (useSupabase) {
    return await supabaseAPI.getClients();
  }
  return localStorageAPI.getClients();
};

export const saveClient = async (client: Client) => {
  if (useSupabase) {
    return await supabaseAPI.saveClient(client);
  }
  localStorageAPI.saveClient(client);
  return true;
};

export const getClientById = async (id: string) => {
  if (useSupabase) {
    return await supabaseAPI.getClientById(id);
  }
  return localStorageAPI.getClientById(id);
};

export const getClientByDui = async (dui: string) => {
  if (useSupabase) {
    const clients = await supabaseAPI.getClients();
    return clients.find(c => c.dui === dui) || null;
  }
  return localStorageAPI.getClientByDui(dui);
};

export const getLoans = async () => {
  if (useSupabase) {
    return await supabaseAPI.getLoans();
  }
  return localStorageAPI.getLoans();
};

export const saveLoan = async (loan: Loan) => {
  if (useSupabase) {
    return await supabaseAPI.saveLoan(loan);
  }
  localStorageAPI.saveLoan(loan);
  return true;
};

export const getActiveLoansByClient = async (clientId: string) => {
  if (useSupabase) {
    return await supabaseAPI.getActiveLoansByClient(clientId);
  }
  return localStorageAPI.getActiveLoansByClient(clientId);
};

export const getLoanById = async (id: string) => {
  if (useSupabase) {
    const loans = await supabaseAPI.getLoans();
    return loans.find(l => l.id === id) || null;
  }
  return localStorageAPI.getLoanById(id);
};

export const getPayments = async () => {
  if (useSupabase) {
    return await supabaseAPI.getPayments();
  }
  return localStorageAPI.getPayments();
};

export const savePayment = async (payment: Payment) => {
  if (useSupabase) {
    return await supabaseAPI.savePayment(payment);
  }
  localStorageAPI.savePayment(payment);
  return true;
};

export const getPaymentsByDate = async (date: string) => {
  const payments = await getPayments();
  return payments.filter(p => p.paymentDate.startsWith(date));
};

export const getDailyCapitals = async () => {
  if (useSupabase) {
    return await supabaseAPI.getDailyCapitals();
  }
  return localStorageAPI.getDailyCapitals();
};

export const getTodayCapital = async () => {
  if (useSupabase) {
    return await supabaseAPI.getTodayCapital();
  }
  return localStorageAPI.getTodayCapital();
};

export const saveDailyCapital = async (capital: DailyCapital) => {
  if (useSupabase) {
    return await supabaseAPI.saveDailyCapital(capital);
  }
  localStorageAPI.saveDailyCapital(capital);
  return true;
};

export const getSystemConfig = async () => {
  if (useSupabase) {
    return await supabaseAPI.getSystemConfig();
  }
  return localStorageAPI.getSystemConfig();
};

export const saveSystemConfig = async (config: SystemConfig) => {
  if (useSupabase) {
    return await supabaseAPI.saveSystemConfig(config);
  }
  localStorageAPI.saveSystemConfig(config);
  return true;
};

// Re-export utility functions from localStorage API
export const {
  generateId,
  calculateLoan,
  getDailySummary,
  validatePassword,
  createBackup,
  exportToExcel,
  importSystemData,
  deductFromCapital,
  checkCapitalAvailability,
  getUserById,
  deleteUser,
  updateUserPassword
} = localStorageAPI;

// Export storage status
export const getStorageStatus = () => ({
  useSupabase,
  storageType: useSupabase ? 'Supabase' : 'localStorage'
});