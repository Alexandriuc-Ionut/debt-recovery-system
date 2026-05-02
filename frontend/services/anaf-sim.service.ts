export type SimStatus = 'PENDING' | 'VALIDATED' | 'ERROR';

export interface SimSubmission {
  id: number;
  companyId: number;
  invoiceId: number;
  executionId: string | null;
  messageId: string | null;
  status: SimStatus;
  xmlContent: string | null;
  recipisa: Record<string, unknown> | null;
  errorMsg: string | null;
  submittedAt: string;
  processedAt: string | null;
  invoice?: {
    id: number;
    number: string;
    series: string | null;
    totalAmount: string;
    currency: string;
    client?: { name: string; cui: string | null };
  };
  company?: { id: number; name: string; cui: string | null };
}

export interface SimStats {
  total: number;
  pending: number;
  validated: number;
  error: number;
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function simFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/anaf-sim${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error((err as { message?: string }).message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const anafSimService = {
  getStats: () => simFetch<SimStats>('/stats'),
  getAll: () => simFetch<SimSubmission[]>(''),
  getPending: () => simFetch<SimSubmission[]>('/pending'),
  validate: (id: number) =>
    simFetch<SimSubmission>(`/validate/${id}`, { method: 'POST' }),
  reject: (id: number, errorMsg: string) =>
    simFetch<SimSubmission>(`/reject/${id}`, {
      method: 'POST',
      body: JSON.stringify({ errorMsg }),
    }),
  xmlUrl: (id: number) => `${BASE}/anaf-sim/xml/${id}`,
};

