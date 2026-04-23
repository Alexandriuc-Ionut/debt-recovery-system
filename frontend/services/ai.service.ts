import { apiFetch } from './api';
import type { AIClientScore } from '@/types';

export const aiService = {
  getScores(): Promise<AIClientScore[]> {
    return apiFetch<AIClientScore[]>('/ai/scores');
  },

  scoreClient(clientId: number): Promise<AIClientScore> {
    return apiFetch<AIClientScore>(`/ai/score/client/${clientId}`, {
      method: 'POST',
    });
  },

  scoreCompany(): Promise<AIClientScore[]> {
    return apiFetch<AIClientScore[]>('/ai/score/company', { method: 'POST' });
  },
};
