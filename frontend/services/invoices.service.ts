import { apiFetch } from './api';
import type { Invoice, InvoiceStatus } from '@/types';

export const invoicesService = {
  getAll(status?: InvoiceStatus): Promise<Invoice[]> {
    const query = status ? `?status=${status}` : '';
    return apiFetch<Invoice[]>(`/invoices${query}`);
  },

  getById(id: number): Promise<Invoice> {
    return apiFetch<Invoice>(`/invoices/${id}`);
  },

  getByClient(clientId: number): Promise<Invoice[]> {
    return apiFetch<Invoice[]>(`/invoices/client/${clientId}`);
  },

  create(data: {
    clientId: number;
    series?: string;
    number: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    currency?: string;
    notes?: string;
  }): Promise<Invoice> {
    return apiFetch<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  cancel(id: number): Promise<Invoice> {
    return apiFetch<Invoice>(`/invoices/${id}/cancel`, { method: 'PATCH' });
  },

  async exportSaga(): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const res = await fetch('http://localhost:3000/invoices/export/saga', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export-saga.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
};
