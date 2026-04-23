import { apiFetch } from './api';
import type { Expense, ExpenseCategory } from '@/types';

export const expensesService = {
  getAll(): Promise<Expense[]> {
    return apiFetch<Expense[]>('/expenses');
  },

  create(data: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    currency?: string;
    date: string;
    supplier?: string;
    reference?: string;
  }): Promise<Expense> {
    return apiFetch<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: {
    category?: ExpenseCategory;
    description?: string;
    amount?: number;
    currency?: string;
    date?: string;
    supplier?: string;
    reference?: string;
  }): Promise<Expense> {
    return apiFetch<Expense>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  remove(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },
};
