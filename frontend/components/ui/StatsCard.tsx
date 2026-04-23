import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  subtitle?: string;
}

const colorMap = {
  blue:   { gradient: 'from-blue-500 to-blue-700',     accent: 'bg-blue-500',   glow: 'shadow-blue-500/10' },
  green:  { gradient: 'from-emerald-500 to-teal-600',  accent: 'bg-emerald-500', glow: 'shadow-emerald-500/10' },
  yellow: { gradient: 'from-amber-500 to-orange-500',  accent: 'bg-amber-500',  glow: 'shadow-amber-500/10' },
  red:    { gradient: 'from-red-500 to-rose-600',      accent: 'bg-red-500',    glow: 'shadow-red-500/10' },
};

export default function StatsCard({ title, value, icon: Icon, color = 'blue', subtitle }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.05] transition-all duration-200 shadow-lg ${c.glow}`}>
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${c.accent} rounded-full blur-3xl opacity-25`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">{title}</p>
          <p className="mt-3 text-2xl font-bold text-white leading-none tracking-tight">{value}</p>
          {subtitle && <p className="mt-1.5 text-xs text-slate-600">{subtitle}</p>}
        </div>
        <div className={`flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br ${c.gradient} shadow-lg`}>
          <Icon className="w-[18px] h-[18px] text-white" />
        </div>
      </div>
    </div>
  );
}
