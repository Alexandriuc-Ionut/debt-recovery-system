import { apiFetch } from './api';
import type { Reminder } from '@/types';

export const remindersService = {
  getAll(): Promise<Reminder[]> {
    return apiFetch<Reminder[]>('/reminders');
  },

  process(): Promise<{ message: string; totalCreated: number; reminders: Reminder[] }> {
    return apiFetch('/reminders/process', { method: 'POST' });
  },

  sendToClient(clientId: number): Promise<{ message: string; totalCreated: number }> {
    return apiFetch(`/reminders/send-client/${clientId}`, { method: 'POST' });
  },
};
