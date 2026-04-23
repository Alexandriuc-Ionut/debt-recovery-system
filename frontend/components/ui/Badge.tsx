type BadgeVariant = 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'purple';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
}

const variantMap: Record<BadgeVariant, string> = {
  green: 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400',
  yellow: 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  red: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400',
  gray: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300',
  blue: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
  purple: 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400',
};

export default function Badge({ label, variant }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantMap[variant]}`}
    >
      {label}
    </span>
  );
}

// Helpers for consistent status → badge mapping

export function invoiceStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    OPEN: { label: 'Open', variant: 'blue' },
    PARTIAL: { label: 'Partial', variant: 'yellow' },
    PAID: { label: 'Paid', variant: 'green' },
    CANCELED: { label: 'Canceled', variant: 'gray' },
  };
  return map[status] ?? { label: status, variant: 'gray' };
}

export function riskLevelBadge(level: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    LOW: { label: 'Low Risk', variant: 'green' },
    MEDIUM: { label: 'Medium Risk', variant: 'yellow' },
    HIGH: { label: 'High Risk', variant: 'red' },
  };
  return map[level] ?? { label: level, variant: 'gray' };
}

export function reminderStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    SENT: { label: 'Sent', variant: 'green' },
    FAILED: { label: 'Failed', variant: 'red' },
  };
  return map[status] ?? { label: status, variant: 'gray' };
}
