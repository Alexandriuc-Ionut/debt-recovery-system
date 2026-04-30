'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign, TrendingDown, AlertTriangle, FileText, ArrowRight,
  Clock, TrendingUp, Activity, ChevronLeft, ChevronRight,
} from 'lucide-react';

const PAGE_SIZE = 5;

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | '…')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return (
    <div className="flex items-center justify-center gap-1 py-3 border-t border-white/[0.05]">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] disabled:opacity-30 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) => p === '…' ? (
        <span key={`e${i}`} className="px-2 text-slate-600 text-sm">…</span>
      ) : (
        <button key={p} onClick={() => onPage(p as number)} className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.06]'}`}>{p}</button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] disabled:opacity-30 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import Badge, { invoiceStatusBadge } from '@/components/ui/Badge';
import { dashboardService } from '@/services/dashboard.service';
import { formatCompactCurrency, formatDate } from '@/utils/format';
import type { DashboardSummary } from '@/types';

/* ─── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, gradient, glow, accent, valueColor }: {
  title: string; value: string | number; icon: React.ElementType;
  gradient: string; glow: string; accent: string; valueColor: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.05] transition-all duration-200 shadow-lg ${glow}`}>
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${accent} rounded-full blur-3xl opacity-30`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">{title}</p>
          <p className={`mt-3 text-2xl font-bold leading-none tracking-tight ${valueColor}`}>{value}</p>
        </div>
        <div className={`flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
        </div>
      </div>
    </div>
  );
}

/* ─── Cash flow tooltip ─────────────────────────────────────────────────────── */
function CashTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1829] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{formatCompactCurrency(payload[0].value)}</p>
    </div>
  );
}

/* ─── Aging tooltip ─────────────────────────────────────────────────────────── */
function AgingTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1829] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{payload[0].name}</p>
      <p className="text-sm font-bold text-white">{formatCompactCurrency(payload[0].value)}</p>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dashboardService.getSummary()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title={t.dashboard.title}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t.dashboard.loadingDashboard}</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title={t.dashboard.title}>
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</div>
      </AppLayout>
    );
  }

  if (!data) return null;

  const paginated = data.invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const invTotalPages = Math.ceil(data.invoices.length / PAGE_SIZE);

  /* Cash flow chart data */
  const cashFlowData = [
    { name: t.dashboard.overdue, value: data.cashFlow.overdue },
    { name: t.dashboard.thisWeek, value: data.cashFlow.thisWeek },
    { name: t.dashboard.thisMonth, value: data.cashFlow.thisMonth },
    { name: t.dashboard.nextMonth, value: data.cashFlow.nextMonth },
  ];

  /* Aging pie data */
  const agingTotal = data.aging.bucket0to30 + data.aging.bucket31to60 + data.aging.bucket61plus;
  const agingData = [
    { name: '0–30 days', value: data.aging.bucket0to30, color: '#f59e0b' },
    { name: '31–60 days', value: data.aging.bucket31to60, color: '#f97316' },
    { name: '60+ days', value: data.aging.bucket61plus, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  /* Balance bar widths */
  const totalForBar = Math.max(data.totals.totalInvoices, 1);
  const paidPct = Math.round((data.totals.totalPaid / totalForBar) * 100);
  const outstandingPct = Math.round((data.totals.totalOutstanding / totalForBar) * 100);

  return (
    <AppLayout title={t.dashboard.title}>
      <div className="space-y-5">

        {/* ── Row 1: Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title={t.dashboard.totalInvoiced}
            value={formatCompactCurrency(data.totals.totalInvoices)}
            icon={FileText}
            gradient="from-blue-500 to-blue-700"
            glow="shadow-blue-500/10"
            accent="bg-blue-500"
            valueColor="text-blue-400"
          />
          <StatCard
            title={t.dashboard.totalCollected}
            value={formatCompactCurrency(data.totals.totalPaid)}
            icon={DollarSign}
            gradient="from-emerald-500 to-teal-600"
            glow="shadow-emerald-500/10"
            accent="bg-emerald-500"
            valueColor="text-emerald-400"
          />
          <StatCard
            title={t.dashboard.outstanding}
            value={formatCompactCurrency(data.totals.totalOutstanding)}
            icon={TrendingDown}
            gradient="from-amber-500 to-orange-500"
            glow="shadow-amber-500/10"
            accent="bg-amber-500"
            valueColor="text-amber-400"
          />
          <StatCard
            title={t.dashboard.overdueInvoices}
            value={data.totals.overdueInvoices}
            icon={AlertTriangle}
            gradient="from-red-500 to-rose-600"
            glow="shadow-red-500/10"
            accent="bg-red-500"
            valueColor="text-red-400"
          />
        </div>

        {/* ── Row 2: Chart + Balance panel ─────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Cash flow area chart */}
          <div className="xl:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t.dashboard.cashFlowForecast}</p>
                <p className="text-xs text-slate-600 mt-0.5">{t.dashboard.expectedCollections}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                <Activity className="w-3 h-3" /> Live
              </div>
            </div>

            {/* Total */}
            <p className="text-3xl font-bold text-blue-400 mt-3 tracking-tight">
              {formatCompactCurrency(cashFlowData.reduce((s, b) => s + b.value, 0))}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">{t.dashboard.totalExpectedCollections}</p>

            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={cashFlowData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CashTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#cashGrad)" dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#60a5fa' }} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Bucket pills */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/[0.05]">
              {[
                { label: t.dashboard.overdue, value: data.cashFlow.overdue, color: 'text-red-400', dot: 'bg-red-500' },
                { label: t.dashboard.thisWeek, value: data.cashFlow.thisWeek, color: 'text-amber-400', dot: 'bg-amber-400' },
                { label: t.dashboard.thisMonth, value: data.cashFlow.thisMonth, color: 'text-blue-400', dot: 'bg-blue-500' },
                { label: t.dashboard.nextMonth, value: data.cashFlow.nextMonth, color: 'text-emerald-400', dot: 'bg-emerald-500' },
              ].map(({ label, value, color, dot }) => (
                <div key={label} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    <span className="text-[10px] text-slate-500 font-medium">{label}</span>
                  </div>
                  <p className={`text-sm font-bold ${color}`}>{formatCompactCurrency(value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Balance panel — inspired by debt.jpg right panel */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 shadow-lg flex flex-col gap-5">

            {/* Collection ratio */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t.dashboard.collectionRatio}</p>
                <span className="text-xs font-bold text-blue-400">{paidPct}%</span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: t.dashboard.invoiced, value: formatCompactCurrency(data.totals.totalInvoices), color: 'text-slate-300' },
                  { label: t.common.paid, value: formatCompactCurrency(data.totals.totalPaid), color: 'text-emerald-400' },
                  { label: t.common.due, value: formatCompactCurrency(data.totals.totalOutstanding), color: 'text-amber-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.04]">
                    <p className="text-[10px] text-slate-600 font-medium mb-1">{label}</p>
                    <p className={`text-xs font-bold ${color} leading-tight`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Aging donut */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.dashboard.agingAnalysis}</p>
              {agingData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <PieChart width={88} height={88}>
                    <Pie data={agingData} cx={40} cy={40} innerRadius={26} outerRadius={42} dataKey="value" strokeWidth={0}>
                      {agingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<AgingTooltip />} />
                  </PieChart>
                  <div className="flex-1 space-y-2">
                    {[
                      { label: t.dashboard.days0to30, value: data.aging.bucket0to30, color: '#f59e0b', textColor: 'text-amber-400' },
                      { label: t.dashboard.days31to60, value: data.aging.bucket31to60, color: '#f97316', textColor: 'text-orange-400' },
                      { label: t.dashboard.days60plus, value: data.aging.bucket61plus, color: '#ef4444', textColor: 'text-red-400' },
                    ].map(({ label, value, color, textColor }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-[10px] text-slate-500">{label}</span>
                        </div>
                        <span className={`text-xs font-bold ${textColor}`}>{formatCompactCurrency(value)}</span>
                      </div>
                    ))}
                    {agingTotal > 0 && (
                      <div className="flex items-center justify-between border-t border-white/[0.05] pt-2 mt-1">
                        <span className="text-[10px] text-slate-600">{t.dashboard.totalOverdue}</span>
                        <span className="text-xs font-bold text-white">{formatCompactCurrency(agingTotal)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 text-xs text-slate-600">{t.dashboard.noOverdueInvoices}</div>
              )}
            </div>

            {/* Outstanding bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t.dashboard.outstanding}</p>
                <span className="text-xs font-bold text-amber-400">{outstandingPct}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-700"
                  style={{ width: `${outstandingPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-600">{t.dashboard.remainingBalance}</span>
                <span className="text-[10px] font-bold text-amber-400">{formatCompactCurrency(data.totals.totalOutstanding)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Invoice table ──────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t.dashboard.invoiceOverview}</p>
                <p className="text-[10px] text-slate-500">{data.invoices.length} {t.dashboard.invoicesTracked}</p>
              </div>
            </div>
            <Link href="/invoices" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
              {t.common.viewAll} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {[t.dashboard.client, t.dashboard.invoiceNo, t.common.total, t.common.paid, t.dashboard.remaining, t.dashboard.dueDate, t.dashboard.overdueInvoices, t.common.status].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((inv, i) => {
                  const { label, variant } = invoiceStatusBadge(inv.status);
                  return (
                    <tr key={inv.id} className={`border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[10px] font-bold">{inv.clientName.charAt(0)}</span>
                          </div>
                          <span className="font-semibold text-blue-300 text-sm">{inv.clientName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 font-medium">{inv.invoiceNumber}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-300 text-sm">{formatCompactCurrency(inv.totalAmount)}</td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-400 text-sm">{formatCompactCurrency(inv.paidAmount)}</td>
                      <td className="px-5 py-3.5 font-semibold text-amber-400 text-sm">{formatCompactCurrency(inv.remainingAmount)}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                      <td className="px-5 py-3.5">
                        {inv.overdueDays > 0
                          ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">{inv.overdueDays}{t.dashboard.dLate}</span>
                          : <span className="text-slate-700 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5"><Badge label={label} variant={variant} /></td>
                    </tr>
                  );
                })}
                {data.invoices.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-14 text-center text-slate-600 text-sm">{t.dashboard.noInvoices}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-white/[0.04]">
            {paginated.map((inv) => {
              const { label, variant } = invoiceStatusBadge(inv.status);
              return (
                <div key={inv.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{inv.clientName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-300 text-sm">{inv.clientName}</p>
                        <p className="text-[10px] font-mono text-slate-500">{inv.invoiceNumber}</p>
                      </div>
                    </div>
                    <Badge label={label} variant={variant} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: t.common.total, v: formatCompactCurrency(inv.totalAmount), c: 'text-slate-300' },
                      { l: t.common.paid, v: formatCompactCurrency(inv.paidAmount), c: 'text-emerald-400' },
                      { l: t.common.due, v: formatCompactCurrency(inv.remainingAmount), c: 'text-amber-400' },
                    ].map(({ l, v, c }) => (
                      <div key={l} className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.04]">
                        <p className="text-[10px] text-slate-600 mb-0.5">{l}</p>
                        <p className={`text-xs font-bold ${c}`}>{v}</p>
                      </div>
                    ))}
                  </div>
                  {inv.overdueDays > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-red-400">
                      <Clock className="w-3 h-3" /> {inv.overdueDays} {t.dashboard.dLate}
                    </div>
                  )}
                </div>
              );
            })}
            {data.invoices.length === 0 && (
              <p className="p-8 text-center text-slate-600 text-sm">{t.dashboard.noInvoices}</p>
            )}
          </div>
          <Pagination page={page} totalPages={invTotalPages} onPage={setPage} />
        </div>

      </div>
    </AppLayout>
  );
}
