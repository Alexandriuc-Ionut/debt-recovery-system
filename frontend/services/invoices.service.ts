import { apiFetch } from './api';
import type { Invoice, InvoiceStatus } from '@/types';

export const invoicesService = {
  getAll(status?: InvoiceStatus, page = 1, limit = 20): Promise<{ data: Invoice[]; total: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    return apiFetch<{ data: Invoice[]; total: number }>(`/invoices?${params}`);
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

  update(id: number, data: { dueDate?: string; notes?: string; totalAmount?: number; currency?: string }): Promise<Invoice> {
    return apiFetch<Invoice>(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
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
