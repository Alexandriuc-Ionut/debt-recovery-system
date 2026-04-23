import { apiFetch } from './api';

export interface InvoiceSeries {
  id: number;
  companyId: number;
  name: string;
  prefix: string;
  nextNumber: number;
  isDefault: boolean;
  createdAt: string;
}

export interface BankAccount {
  id: number;
  companyId: number;
  bankName: string;
  iban: string;
  accountHolder: string;
  currency: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CompanySettings {
  id: number;
  name: string;
  cui: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  vatRate: number | null;
}

export const settingsService = {
  getCompany: () => apiFetch<CompanySettings>('/settings/company'),

  updateCompany: (data: Partial<CompanySettings>) =>
    apiFetch<CompanySettings>('/settings/company', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getInvoiceSeries: () => apiFetch<InvoiceSeries[]>('/settings/invoice-series'),

  createInvoiceSeries: (data: { name: string; prefix: string; nextNumber?: number; isDefault?: boolean }) =>
    apiFetch<InvoiceSeries>('/settings/invoice-series', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateInvoiceSeries: (id: number, data: Partial<InvoiceSeries>) =>
    apiFetch<InvoiceSeries>(`/settings/invoice-series/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteInvoiceSeries: (id: number) =>
    apiFetch(`/settings/invoice-series/${id}`, { method: 'DELETE' }),

  getBankAccounts: () => apiFetch<BankAccount[]>('/settings/bank-accounts'),

  createBankAccount: (data: { bankName: string; iban: string; accountHolder: string; currency?: string; isDefault?: boolean }) =>
    apiFetch<BankAccount>('/settings/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBankAccount: (id: number, data: Partial<BankAccount>) =>
    apiFetch<BankAccount>(`/settings/bank-accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteBankAccount: (id: number) =>
    apiFetch(`/settings/bank-accounts/${id}`, { method: 'DELETE' }),
};
