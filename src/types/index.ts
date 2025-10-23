export interface User {
  id: string;
  email: string;
  username?: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category_id?: string;
  date: string;
  description: string;
  notes?: string;
  type: 'income' | 'expense';
  created_at: string;
  category?: Category;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  currency: string;
  language: string;
  theme: string;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  recentTransactions: Transaction[];
}
