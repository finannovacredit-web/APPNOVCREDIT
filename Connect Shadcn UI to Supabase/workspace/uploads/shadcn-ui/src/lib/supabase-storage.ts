import { supabase, TABLES } from './supabase';
import { User, Client, Loan, Payment, DailyCapital, SystemConfig } from '@/types';

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    // Check if tables exist by trying to select from them
    const { error: usersError } = await supabase.from(TABLES.USERS).select('count', { count: 'exact', head: true });
    
    if (usersError && usersError.code === '42P01') {
      // Tables don't exist, we need to create them
      console.log('Database tables need to be created. Please set up the database schema.');
      return false;
    }

    // Initialize default users if table is empty
    const { data: existingUsers } = await supabase.from(TABLES.USERS).select('id').limit(1);
    
    if (!existingUsers || existingUsers.length === 0) {
      const defaultUsers: Omit<User, 'id'>[] = [
        {
          username: 'admin',
          role: 'admin',
          name: 'Administrador',
          password: 'admin123',
          createdAt: new Date().toISOString()
        },
        {
          username: 'cobrador1',
          role: 'collector',
          name: 'Cobrador 1',
          password: 'cobrador123',
          createdAt: new Date().toISOString()
        }
      ];

      const { error } = await supabase.from(TABLES.USERS).insert(defaultUsers);
      if (error) {
        console.error('Error creating default users:', error);
        return false;
      }
    }

    // Initialize default system config if table is empty
    const { data: existingConfig } = await supabase.from(TABLES.SYSTEM_CONFIG).select('id').limit(1);
    
    if (!existingConfig || existingConfig.length === 0) {
      const defaultConfig: Omit<SystemConfig, 'id'> = {
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

      const { error } = await supabase.from(TABLES.SYSTEM_CONFIG).insert([defaultConfig]);
      if (error) {
        console.error('Error creating default config:', error);
      }
    }

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
};

// User management
export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      return null;
    }

    return data as User;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase.from(TABLES.USERS).select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const saveUser = async (user: Omit<User, 'id'> | User): Promise<boolean> => {
  try {
    if ('id' in user && user.id) {
      // Update existing user
      const { error } = await supabase
        .from(TABLES.USERS)
        .update(user)
        .eq('id', user.id);
      return !error;
    } else {
      // Create new user
      const { error } = await supabase.from(TABLES.USERS).insert([user]);
      return !error;
    }
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
};

// Client management
export const getClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase.from(TABLES.CLIENTS).select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
};

export const saveClient = async (client: Omit<Client, 'id'> | Client): Promise<boolean> => {
  try {
    if ('id' in client && client.id) {
      // Update existing client
      const { error } = await supabase
        .from(TABLES.CLIENTS)
        .update({ ...client, updatedAt: new Date().toISOString() })
        .eq('id', client.id);
      return !error;
    } else {
      // Create new client
      const { error } = await supabase.from(TABLES.CLIENTS).insert([client]);
      return !error;
    }
  } catch (error) {
    console.error('Error saving client:', error);
    return false;
  }
};

export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Client;
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
};

// Loan management
export const getLoans = async (): Promise<Loan[]> => {
  try {
    const { data, error } = await supabase.from(TABLES.LOANS).select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching loans:', error);
    return [];
  }
};

export const saveLoan = async (loan: Omit<Loan, 'id'> | Loan): Promise<boolean> => {
  try {
    if ('id' in loan && loan.id) {
      // Update existing loan
      const { error } = await supabase
        .from(TABLES.LOANS)
        .update(loan)
        .eq('id', loan.id);
      return !error;
    } else {
      // Create new loan
      const { error } = await supabase.from(TABLES.LOANS).insert([loan]);
      if (!error) {
        // Deduct from capital when creating a new loan
        await deductFromCapital(loan.amount);
      }
      return !error;
    }
  } catch (error) {
    console.error('Error saving loan:', error);
    return false;
  }
};

export const getActiveLoansByClient = async (clientId: string): Promise<Loan[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.LOANS)
      .select('*')
      .eq('clientId', clientId)
      .eq('status', 'active');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching active loans:', error);
    return [];
  }
};

// Payment management
export const getPayments = async (): Promise<Payment[]> => {
  try {
    const { data, error } = await supabase.from(TABLES.PAYMENTS).select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
};

export const savePayment = async (payment: Omit<Payment, 'id'>): Promise<boolean> => {
  try {
    const { error } = await supabase.from(TABLES.PAYMENTS).insert([payment]);
    
    if (!error) {
      // Update loan paid amount
      const { data: loan } = await supabase
        .from(TABLES.LOANS)
        .select('*')
        .eq('id', payment.loanId)
        .single();
      
      if (loan) {
        const updatedPaidAmount = loan.paidAmount + payment.amount;
        const status = updatedPaidAmount >= loan.totalAmount ? 'completed' : 'active';
        
        await supabase
          .from(TABLES.LOANS)
          .update({ 
            paidAmount: updatedPaidAmount,
            status: status
          })
          .eq('id', payment.loanId);
      }
    }
    
    return !error;
  } catch (error) {
    console.error('Error saving payment:', error);
    return false;
  }
};

// Daily Capital management
export const getDailyCapitals = async (): Promise<DailyCapital[]> => {
  try {
    const { data, error } = await supabase.from(TABLES.DAILY_CAPITAL).select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching daily capitals:', error);
    return [];
  }
};

export const getTodayCapital = async (): Promise<DailyCapital | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from(TABLES.DAILY_CAPITAL)
      .select('*')
      .eq('date', today)
      .single();
    
    if (error) return null;
    return data as DailyCapital;
  } catch (error) {
    console.error('Error fetching today capital:', error);
    return null;
  }
};

export const saveDailyCapital = async (capital: Omit<DailyCapital, 'id'> | DailyCapital): Promise<boolean> => {
  try {
    if ('id' in capital && capital.id) {
      // Update existing capital
      const { error } = await supabase
        .from(TABLES.DAILY_CAPITAL)
        .update(capital)
        .eq('id', capital.id);
      return !error;
    } else {
      // Create new capital
      const { error } = await supabase.from(TABLES.DAILY_CAPITAL).insert([capital]);
      return !error;
    }
  } catch (error) {
    console.error('Error saving daily capital:', error);
    return false;
  }
};

export const deductFromCapital = async (amount: number): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const capital = await getTodayCapital();
    
    if (capital) {
      capital.availableCapital -= amount;
      await saveDailyCapital(capital);
    }
  } catch (error) {
    console.error('Error deducting from capital:', error);
  }
};

// System Configuration
export const getSystemConfig = async (): Promise<SystemConfig | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SYSTEM_CONFIG)
      .select('*')
      .limit(1)
      .single();
    
    if (error) return null;
    return data as SystemConfig;
  } catch (error) {
    console.error('Error fetching system config:', error);
    return null;
  }
};

export const saveSystemConfig = async (config: SystemConfig): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLES.SYSTEM_CONFIG)
      .update(config)
      .eq('id', config.id);
    return !error;
  } catch (error) {
    console.error('Error saving system config:', error);
    return false;
  }
};