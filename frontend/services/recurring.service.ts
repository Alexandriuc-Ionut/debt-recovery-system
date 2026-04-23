import { apiFetch } from './api';
import type { RecurringInvoice, RecurringInterval } from '@/types';

export const recurringService = {
  getAll(): Promise<RecurringInvoice[]> {
    return apiFetch<RecurringInvoice[]>('/recurring');
  },

  create(data: {
    clientId: number;
    templateName: string;
    series?: string;
    amount: number;
    currency?: string;
    notes?: string;
    interval: RecurringInterval;
    dayOfMonth?: number;
    nextRunAt: string;
  }): Promise<RecurringInvoice> {
    return apiFetch<RecurringInvoice>('/recurring', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  toggle(id: number): Promise<RecurringInvoice> {
    return apiFetch<RecurringInvoice>(`/recurring/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  remove(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/recurring/${id}`, {
      method: 'DELETE',
    });
  },
};
