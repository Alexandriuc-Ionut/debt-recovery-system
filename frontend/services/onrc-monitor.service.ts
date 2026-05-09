import { apiFetch } from './api';

export type OnrcAlert = {
  id: number;
  clientId: number;
  clientName: string;
  alertType: 'STATUS_INACTIVE' | 'STATUS_SUSPENDED' | 'VAT_LOST' | 'VAT_GAINED' | 'NAME_CHANGED';
  description: string;
  isRead: boolean;
  createdAt: string;
};

export const onrcMonitorService = {
  getAlerts(): Promise<OnrcAlert[]> {
    return apiFetch<OnrcAlert[]>('/onrc-monitor/alerts');
  },

  getUnreadCount(): Promise<number> {
    return apiFetch<number>('/onrc-monitor/unread-count');
  },

  scan(): Promise<{ scanned: number; alertsCreated: number }> {
    return apiFetch('/onrc-monitor/scan', { method: 'POST' });
  },

  markRead(id: number): Promise<OnrcAlert> {
    return apiFetch<OnrcAlert>(`/onrc-monitor/alerts/${id}/read`, { method: 'POST' });
  },

  markAllRead(): Promise<{ message: string }> {
    return apiFetch('/onrc-monitor/alerts/read-all', { method: 'POST' });
  },
};
