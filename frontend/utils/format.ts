export function formatCurrency(amount: number | string, currency = 'RON'): string {
  return `${Number(amount).toFixed(2)} ${currency}`;
}

export function formatCompactCurrency(amount: number | string, currency = 'RON'): string {
  const n = Number(amount);
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B ${currency}`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ${currency}`;
  if (abs >= 10_000) return `${(n / 1_000).toFixed(1)}K ${currency}`;
  return `${n.toFixed(2)} ${currency}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
