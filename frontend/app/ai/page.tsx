'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Brain, Zap, TrendingUp, ShieldAlert, ShieldCheck, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 5;

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | '…')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return (
    <div className="flex items-center justify-center gap-1 py-4 border-t border-slate-100 dark:border-white/[0.06]">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) => p === '…' ? (
        <span key={`e${i}`} className="px-2 text-slate-400 text-sm">…</span>
      ) : (
        <button key={p} onClick={() => onPage(p as number)} className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'}`}>{p}</button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
import AppLayout from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import Badge, { riskLevelBadge } from '@/components/ui/Badge';
import { aiService } from '@/services/ai.service';
import { clientsService } from '@/services/clients.service';
import { formatDateTime } from '@/utils/format';
import type { AIClientScore, Client } from '@/types';

function RiskIcon({ level }: { level: string }) {
  if (level === 'HIGH') return <ShieldAlert className="w-4 h-4 text-red-500" />;
  if (level === 'MEDIUM') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  return <ShieldCheck className="w-4 h-4 text-green-500" />;
}

export default function AiPage() {
  const { t } = useLanguage();
  const [scores, setScores] = useState<AIClientScore[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoringAll, setScoringAll] = useState(false);
  const [scoringId, setScoringId] = useState<number | null>(null);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    aiService.getScores()
      .then(setScores)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { clientsService.getAll().then(setClients).catch(() => {}); }, []);

  async function handleScoreAll() {
    setScoringAll(true);
    try {
      await aiService.scoreCompany();
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to calculate scores');
    } finally {
      setScoringAll(false);
    }
  }

  async function handleScoreClient(clientId: number) {
    setScoringId(clientId);
    try {
      await aiService.scoreClient(clientId);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to calculate score');
    } finally {
      setScoringId(null);
    }
  }

  const [page, setPage] = useState(1);
  const scoreMap = new Map(scores.map((s) => [s.clientId, s]));
  const unscoredClients = clients.filter((c) => !scoreMap.has(c.id));

  const scoresTotalPages = Math.ceil(scores.length / PAGE_SIZE);
  const paginatedScores = scores.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const highRisk = scores.filter((s) => s.riskLevel === 'HIGH').length;
  const avgScore = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.trustScore, 0) / scores.length)
    : null;

  return (
    <AppLayout title={t.ai.title}>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Brain className="w-4 h-4 text-blue-500" />
            <span>{scores.length} client{scores.length !== 1 ? 's' : ''} scored</span>
          </div>
          <button
            onClick={handleScoreAll}
            disabled={scoringAll}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${scoringAll ? 'animate-spin' : ''}`} />
            {scoringAll ? t.ai.calculating : t.ai.scoreAllClients}
          </button>
        </div>

        {/* Stats */}
        {scores.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.ai.avgTrustScore}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{avgScore}<span className="text-sm font-normal text-slate-400 dark:text-slate-500">/100</span></p>
            </div>
            <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.ai.highRisk}</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{highRisk}<span className="text-sm font-normal text-slate-400 dark:text-slate-500"> {t.ai.clients}</span></p>
            </div>
            <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm p-4 col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.ai.unscored}</p>
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{unscoredClients.length}<span className="text-sm font-normal text-slate-400 dark:text-slate-500"> {t.ai.clients}</span></p>
            </div>
          </div>
        )}

        {/* Info banner */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-3 flex gap-3 items-start">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t.ai.aiDescription}
          </p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</p>}

        {/* Scored clients */}
        <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.ai.scoredClients}</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">{scores.length} {t.ai.records}</span>
          </div>

          {loading && <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm">Loading scores...</div>}
          {!loading && (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06]">
                      {[t.ai.clients, t.ai.trustScore, t.ai.riskLevel, t.ai.lateProbability, t.ai.calculatedAt, ''].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {paginatedScores.map((s) => {
                      const { label, variant } = riskLevelBadge(s.riskLevel);
                      const lateProb = s.lateProb ? `${(Number(s.lateProb) * 100).toFixed(1)}%` : '—';
                      const scoreColor = s.trustScore >= 70 ? 'bg-emerald-500' : s.trustScore >= 40 ? 'bg-amber-400' : 'bg-red-500';
                      const scoreTextColor = s.trustScore >= 70 ? 'text-emerald-700 dark:text-emerald-400' : s.trustScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group">
                          <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2">
                              <RiskIcon level={s.riskLevel} />
                              {s.client?.name ?? `Client #${s.clientId}`}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 w-28">
                                <div className={`h-2 rounded-full ${scoreColor}`} style={{ width: `${s.trustScore}%` }} />
                              </div>
                              <span className={`font-bold text-sm tabular-nums ${scoreTextColor}`}>{s.trustScore}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4"><Badge label={label} variant={variant} /></td>
                          <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-medium">{lateProb}</td>
                          <td className="px-5 py-4 text-slate-400 dark:text-slate-500 text-xs">{formatDateTime(s.calculatedAt)}</td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleScoreClient(s.clientId)}
                              disabled={scoringId === s.clientId}
                              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold disabled:opacity-50 transition-all"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              {scoringId === s.clientId ? t.ai.recalculating : t.ai.recalculate}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {scores.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                          {t.ai.noScores}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {paginatedScores.map((s) => {
                  const { label, variant } = riskLevelBadge(s.riskLevel);
                  const lateProb = s.lateProb ? `${(Number(s.lateProb) * 100).toFixed(1)}%` : '—';
                  const scoreColor = s.trustScore >= 70 ? 'bg-emerald-500' : s.trustScore >= 40 ? 'bg-amber-400' : 'bg-red-500';
                  const scoreTextColor = s.trustScore >= 70 ? 'text-emerald-700' : s.trustScore >= 40 ? 'text-amber-600' : 'text-red-600';
                  return (
                    <div key={s.id} className="px-4 py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RiskIcon level={s.riskLevel} />
                          <p className="font-semibold text-slate-900">{s.client?.name ?? `Client #${s.clientId}`}</p>
                        </div>
                        <Badge label={label} variant={variant} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${scoreColor}`} style={{ width: `${s.trustScore}%` }} />
                        </div>
                        <span className={`font-bold text-sm tabular-nums ${scoreTextColor}`}>{s.trustScore}/100</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Late probability: <span className="font-semibold text-slate-700">{lateProb}</span></p>
                        <button
                          onClick={() => handleScoreClient(s.clientId)}
                          disabled={scoringId === s.clientId}
                          className="flex items-center gap-1 text-xs text-blue-600 font-semibold disabled:opacity-50"
                        >
                          <Zap className="w-3 h-3" />
                          {scoringId === s.clientId ? t.ai.recalculating : t.ai.recalculate}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {scores.length === 0 && (
                  <div className="px-4 py-12 text-center text-slate-400 text-sm">
                    No scores yet. Tap &quot;Score All Clients&quot; to begin.
                  </div>
                )}
              </div>
              <Pagination page={page} totalPages={scoresTotalPages} onPage={setPage} />
            </>
          )}
        </div>

        {/* ── Client Segmentation ──────────────────────────────────── */}
        {scores.length > 0 && (
          <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Client Risk Segmentation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  {
                    level: 'HIGH' as const,
                    label: 'High Risk',
                    icon: <ShieldAlert className="w-4 h-4" />,
                    bg: 'bg-red-50 dark:bg-red-500/10',
                    border: 'border-red-100 dark:border-red-500/20',
                    text: 'text-red-700 dark:text-red-400',
                    bar: 'bg-red-500',
                    hint: 'Immediate follow-up required',
                  },
                  {
                    level: 'MEDIUM' as const,
                    label: 'Medium Risk',
                    icon: <AlertTriangle className="w-4 h-4" />,
                    bg: 'bg-amber-50 dark:bg-amber-500/10',
                    border: 'border-amber-100 dark:border-amber-500/20',
                    text: 'text-amber-700 dark:text-amber-400',
                    bar: 'bg-amber-400',
                    hint: 'Monitor closely',
                  },
                  {
                    level: 'LOW' as const,
                    label: 'Low Risk',
                    icon: <ShieldCheck className="w-4 h-4" />,
                    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                    border: 'border-emerald-100 dark:border-emerald-500/20',
                    text: 'text-emerald-700 dark:text-emerald-400',
                    bar: 'bg-emerald-500',
                    hint: 'Reliable payers',
                  },
                ] as const
              ).map(({ level, label, icon, bg, border, text, bar, hint }) => {
                const group = scores.filter((s) => s.riskLevel === level);
                const pct = scores.length > 0 ? Math.round((group.length / scores.length) * 100) : 0;
                return (
                  <div key={level} className={`rounded-xl border p-4 ${bg} ${border}`}>
                    <div className={`flex items-center gap-2 ${text} mb-2`}>
                      {icon}
                      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                    </div>
                    <p className={`text-3xl font-bold ${text}`}>{group.length}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>
                    <div className="mt-3 h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{pct}% of scored clients</p>
                    {group.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {group.slice(0, 3).map((s) => (
                          <p key={s.id} className="text-xs text-slate-600 dark:text-slate-300 truncate">
                            • {s.client?.name ?? `Client #${s.clientId}`}
                            <span className="ml-1 text-slate-400 dark:text-slate-500">({s.trustScore})</span>
                          </p>
                        ))}
                        {group.length > 3 && (
                          <p className="text-xs text-slate-400 dark:text-slate-500">+{group.length - 3} more</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unscored clients */}
        {unscoredClients.length > 0 && (
          <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clients Without Score</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {unscoredClients.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{c.name}</p>
                    {c.email && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{c.email}</p>}
                  </div>
                  <button
                    onClick={() => handleScoreClient(c.id)}
                    disabled={scoringId === c.id}
                    className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {scoringId === c.id ? 'Calculating...' : 'Calculate Score'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
