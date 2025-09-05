import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwtxutzxvxsxpipfvvcn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dHh1dHp4dnhzeHBpcGZ2dmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzQ4NjYsImV4cCI6MjA3MjYxMDg2Nn0.-cts8OPVK3z2NyeLax91ecU80Me68s4O79pyuXGzJBQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  USERS: 'novacredit_users',
  CLIENTS: 'novacredit_clients', 
  LOANS: 'novacredit_loans',
  PAYMENTS: 'novacredit_payments',
  DAILY_CAPITAL: 'novacredit_daily_capital',
  SYSTEM_CONFIG: 'novacredit_system_config'
} as const;

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('novacredit_users').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('Supabase connection test result:', error.message);
      return false;
    }
    console.log('Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
};