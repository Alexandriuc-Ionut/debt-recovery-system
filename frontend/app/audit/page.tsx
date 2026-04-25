'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  UserPlus, UserMinus, Edit3, FileText, FileX, CreditCard, Trash2,
  Bell, Shield, Brain, LogIn, LogOut, Mail, Settings, Activity,
  ChevronLeft, ChevronRight, Calendar, Filter, Search,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiFetch } from '@/services/api';
import { formatDateTime } from '@/utils/format';
import type { AuditLog, AuditAction } from '@/types';

interface ActionMeta {
  label: string;
  Icon: React.ElementType;
  iconColor: string;
  badgeColor: string;
}

const ACTION_META: Record<AuditAction, ActionMeta> = {
  CREATE_CLIENT:      { label: 'Client Created',       Icon: UserPlus,   iconColor: 'text-emerald-500', badgeColor: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' },
  UPDATE_CLIENT:      { label: 'Client Updated',       Icon: Edit3,      iconColor: 'text-blue-500',    badgeColor: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' },
  DELETE_CLIENT:      { label: 'Client Deleted',       Icon: UserMinus,  iconColor: 'text-red-500',     badgeColor: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20' },
  CREATE_INVOICE:     { label: 'Invoice Created',      Icon: FileText,   iconColor: 'text-blue-500',    badgeColor: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' },
  UPDATE_INVOICE:     { label: 'Invoice Updated',      Icon: Edit3,      iconColor: 'text-amber-500',   badgeColor: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' },
  CANCEL_INVOICE:     { label: 'Invoice Cancelled',    Icon: FileX,      iconColor: 'text-red-500',     badgeColor: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20' },
  ADD_PAYMENT:        { label: 'Payment Recorded',     Icon: CreditCard, iconColor: 'text-emerald-500', badgeColor: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' },
  DELETE_PAYMENT:     { label: 'Payment Deleted',      Icon: Trash2,     iconColor: 'text-red-500',     badgeColor: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20' },
  SEND_REMINDER:      { label: 'Reminder Sent',        Icon: Bell,       iconColor: 'text-amber-500',   badgeColor: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' },
  GENERATE_NOTICE:    { label: 'Notice Generated',     Icon: Shield,     iconColor: 'text-violet-500',  badgeColor: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-500/20' },
  CALCULATE_AI_SCORE: { label: 'AI Score Calculated',  Icon: Brain,      iconColor: 'text-cyan-500',    badgeColor: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-500/20' },
  LOGIN:              { label: 'User Logged In',       Icon: LogIn,      iconColor: 'text-blue-500',    badgeColor: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' },
  LOGOUT:             { label: 'User Logged Out',      Icon: LogOut,     iconColor: 'text-slate-500',   badgeColor: 'bg-slate-50 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.1]' },
  VERIFY_EMAIL:       { label: 'Email Verified',       Icon: Mail,       iconColor: 'text-emerald-500', badgeColor: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' },
  UPDATE_SETTINGS:    { label: 'Settings Updated',     Icon: Settings,   iconColor: 'text-slate-500',   badgeColor: 'bg-slate-50 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.1]' },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(dateStr);
}

const fieldClass = 'border border-slate-200 dark:border-white/[0.1] rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-[#070b11] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition';

interface AuditResponse {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AuditPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<AuditAction | 'ALL'>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (action !== 'ALL') params.set('action', action);
      if (from) params.set('from', from);
      if (to)   params.set('to', to);
      const res = await apiFetch<AuditResponse>(`/audit?${params.toString()}`);
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [action, from, to]);

  useEffect(() => {
    setPage(1);
    void load(1);
  }, [action, from, to, load]);

  function goToPage(p: number) {
    setPage(p);
    void load(p);
  }

  // Client-side text search on already-loaded page
  const items = data?.items ?? [];
  const filtered = search.trim()
    ? items.filter((log) => {
        const meta = ACTION_META[log.action];
        const q = search.toLowerCase();
        return (
          meta.label.toLowerCase().includes(q) ||
          (log.user?.fullName ?? '').toLowerCase().includes(q) ||
          (log.user?.email ?? '').toLowerCase().includes(q) ||
          (log.entityType ?? '').toLowerCase().includes(q)
        );
      })
    : items;

  const totalPages = data?.totalPages ?? 1;
  const total      = data?.total ?? 0;

  function clearFilters() {
    setAction('ALL');
    setFrom('');
    setTo('');
    setSearch('');
  }
  const hasFilters = action !== 'ALL' || from || to || search;

  return (
    <AppLayout title={t.audit.title}>
      <div className="space-y-4">

        {/* ── Filters bar ───────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-end">

            {/* Text search */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="User, action, entity…"
                  className={`${fieldClass} pl-8 w-full`}
                />
              </div>
            </div>

            {/* Action filter */}
            <div className="min-w-[180px]">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <Filter className="w-3 h-3 inline mr-1" />Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as AuditAction | 'ALL')}
                className={`${fieldClass} w-full`}
              >
                <option value="ALL">All actions</option>
                {(Object.keys(ACTION_META) as AuditAction[]).map((a) => (
                  <option key={a} value={a}>{ACTION_META[a].label}</option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={fieldClass}
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To</label>
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
                className={fieldClass}
              />
            </div>

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors pb-0.5"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Activity className="w-4 h-4" />
            <span>
              {loading ? 'Loading…' : `${total} event${total !== 1 ? 's' : ''} found`}
              {hasFilters && !loading && ' (filtered)'}
            </span>
          </div>
          {!loading && totalPages > 1 && (
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </span>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* ── Table ─────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">

          {loading && (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-400 dark:text-slate-500 text-sm">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          )}

          {!loading && (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06]">
                      {['Action', 'User', 'Entity', 'Status', 'Time'].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {filtered.map((log) => {
                      const meta = ACTION_META[log.action];
                      const Icon = meta.Icon;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                                <Icon className={`w-3.5 h-3.5 ${meta.iconColor}`} />
                              </div>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.badgeColor}`}>{meta.label}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {log.user ? (
                              <div>
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">{log.user.fullName ?? log.user.email}</p>
                                {log.user.fullName && <p className="text-xs text-slate-400 dark:text-slate-500">{log.user.email}</p>}
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                            {log.entityType && log.entityId ? (
                              <span className="font-mono bg-slate-100 dark:bg-white/[0.05] px-1.5 py-0.5 rounded text-xs">
                                {log.entityType} #{log.entityId}
                              </span>
                            ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            {log.success
                              ? <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Success</span>
                              : <span className="text-xs font-semibold text-red-600 dark:text-red-400">Failed</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap" title={formatDateTime(log.createdAt)}>
                              {relativeTime(log.createdAt)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">No audit events found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile timeline */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.05]">
                {filtered.map((log) => {
                  const meta = ACTION_META[log.action];
                  const Icon = meta.Icon;
                  return (
                    <div key={log.id} className="px-4 py-3.5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className={`w-4 h-4 ${meta.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.badgeColor}`}>{meta.label}</span>
                          {log.entityType && log.entityId && (
                            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{log.entityType} #{log.entityId}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
                          {log.user && <span>{log.user.fullName ?? log.user.email}</span>}
                          <span>·</span>
                          <span>{relativeTime(log.createdAt)}</span>
                          {!log.success && <span className="text-red-500 font-semibold">· Failed</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">No audit events found.</div>}
              </div>

              {/* ── Pagination ──────────────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-white/[0.05]">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '…' ? (
                          <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm select-none">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => goToPage(p as number)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              page === p
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                  </div>

                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
