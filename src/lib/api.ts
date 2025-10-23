import { supabase } from './supabase';
import type { Category, Transaction, SavingsGoal, UserSettings } from '@/types';

// Categories
export const categoriesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Category[];
  },

  async create(category: Omit<Category, 'id' | 'user_id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .insert({ ...category, user_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    return data as Category;
  },

  async update(id: string, updates: Partial<Category>) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Category;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Transactions
export const transactionsApi = {
  async getAll() {
    // Fetch transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (transactionsError) throw transactionsError;
    if (!transactions) return [];

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesError) throw categoriesError;

    // Join categories with transactions in application layer
    const transactionsWithCategories = transactions.map(transaction => ({
      ...transaction,
      category: transaction.category_id 
        ? categories?.find(c => c.id === transaction.category_id) || null
        : null
    }));
    
    return transactionsWithCategories as Transaction[];
  },

  async create(transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'category'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user.id })
      .select()
      .single();
    
    if (error) throw error;

    // Fetch category if exists
    let category = null;
    if (data.category_id) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', data.category_id)
        .single();
      category = categoryData;
    }

    return { ...data, category } as Transaction;
  },

  async update(id: string, updates: Partial<Transaction>) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    // Fetch category if exists
    let category = null;
    if (data.category_id) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', data.category_id)
        .single();
      category = categoryData;
    }

    return { ...data, category } as Transaction;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Savings Goals
export const savingsGoalsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as SavingsGoal[];
  },

  async create(goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('savings_goals')
      .insert({ ...goal, user_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    return data as SavingsGoal;
  },

  async update(id: string, updates: Partial<SavingsGoal>) {
    const { data, error } = await supabase
      .from('savings_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as SavingsGoal;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// User Settings
export const settingsApi = {
  async get() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as UserSettings | null;
  },

  async update(updates: Partial<UserSettings>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ ...updates, user_id: user.id, updated_at: new Date().toISOString() })
      .select()
      .single();
    
    if (error) throw error;
    return data as UserSettings;
  },
};

// User Profile
export const profileApi = {
  async get() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(updates: { username?: string; email?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};
