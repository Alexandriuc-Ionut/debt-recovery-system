import { apiFetch } from './api';
import type { Client } from '@/types';

export const clientsService = {
  getAll(): Promise<Client[]> {
    return apiFetch<Client[]>('/clients');
  },

  getById(id: number): Promise<Client> {
    return apiFetch<Client>(`/clients/${id}`);
  },

  create(data: {
    name: string;
    cui?: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<Client> {
    return apiFetch<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: Partial<Omit<Client, 'id' | 'companyId' | 'createdAt'>>): Promise<Client> {
    return apiFetch<Client>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  remove(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/clients/${id}`, {
      method: 'DELETE',
    });
  },

  lookupCui(cui: string): Promise<{ name: string; address: string; vatPayer: boolean }> {
    const clean = cui.replace(/\D/g, '');
    return apiFetch(`/settings/anaf/${clean}`);
  },
};
