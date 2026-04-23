import { apiFetch } from './api';
import type { DashboardSummary } from '@/types';

export const dashboardService = {
  getSummary(): Promise<DashboardSummary> {
    return apiFetch<DashboardSummary>('/dashboard/summary');
  },

  getOverdueCount(): Promise<{ count: number }> {
    return apiFetch<{ count: number }>('/dashboard/overdue-count');
  },

  getOverdueInvoices(): Promise<{
    id: number; number: string; clientName: string; dueDate: string;
    totalAmount: string; currency: string; status: string; overdueDays: number;
  }[]> {
    return apiFetch('/dashboard/overdue-invoices');
  },
};
