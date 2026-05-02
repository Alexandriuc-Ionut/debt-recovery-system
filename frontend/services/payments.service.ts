import { apiFetch } from './api';
import type { Payment, PaymentMethod } from '@/types';

export const paymentsService = {
  getAll(): Promise<Payment[]> {
    return apiFetch<Payment[]>('/payments');
  },

  getByInvoice(invoiceId: number): Promise<Payment[]> {
    return apiFetch<Payment[]>(`/payments/invoice/${invoiceId}`);
  },

  create(data: {
    invoiceId: number;
    amount: number;
    paidAt: string;
    method?: PaymentMethod;
    reference?: string;
  }): Promise<Payment> {
    return apiFetch<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: { amount?: number; paidAt?: string; method?: PaymentMethod; reference?: string }): Promise<Payment> {
    return apiFetch<Payment>(`/payments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  remove(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/payments/${id}`, {
      method: 'DELETE',
    });
  },
};
