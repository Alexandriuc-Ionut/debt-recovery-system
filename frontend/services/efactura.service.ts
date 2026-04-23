import { apiFetch } from './api';
import type { Invoice } from '@/types';

export type EFacturaStatus = 'PENDING' | 'VALIDATED' | 'ERROR';

export interface EFacturaSubmission {
  id: number;
  companyId: number;
  invoiceId: number;
  executionId: string | null;
  messageId: string | null;
  status: EFacturaStatus;
  recipisa: Record<string, unknown> | null;
  errorMsg: string | null;
  submittedAt: string;
  processedAt: string | null;
  invoice?: Invoice & { client?: { name: string } };
}

export const efacturaService = {
  getAll(): Promise<EFacturaSubmission[]> {
    return apiFetch<EFacturaSubmission[]>('/efactura');
  },

  getEligible(): Promise<(Invoice & { client: { name: string } })[]> {
    return apiFetch<(Invoice & { client: { name: string } })[]>('/efactura/eligible');
  },

  submit(invoiceId: number): Promise<EFacturaSubmission> {
    return apiFetch<EFacturaSubmission>(`/efactura/submit/${invoiceId}`, {
      method: 'POST',
    });
  },

  poll(submissionId: number): Promise<EFacturaSubmission> {
    return apiFetch<EFacturaSubmission>(`/efactura/poll/${submissionId}`, {
      method: 'POST',
    });
  },

  downloadXmlUrl(submissionId: number): string {
    // Direct link — the browser will trigger file download
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return `/efactura/xml/${submissionId}?token=${token ?? ''}`;
  },
};
